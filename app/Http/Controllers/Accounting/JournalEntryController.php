<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Supplier;
use App\Models\Customer;
use App\Models\Employee;
use App\Http\Requests\Accounting\JournalEntryRequest;
use App\Http\Requests\Accounting\QuickJournalEntryRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class JournalEntryController extends Controller
{
    public function index()
    {
        $entries = JournalEntry::with(['creator', 'lines.account'])
            ->orderBy('date', 'desc')
            ->get();

        return Inertia::render('Transaction/JournalEntryList', [
            'entries' => $entries
        ]);
    }

    public function create(Request $request)
    {
        $accounts = ChartOfAcc::orderBy('account_code')->get();

        // Get the last numeric reference and increment it
        $lastRef = JournalEntry::where('transaction_type', 'journal_entry')
            ->whereNotNull('reference')
            ->orderByRaw('CAST(reference AS UNSIGNED) DESC')
            ->first();

        $nextJournalNo = ($lastRef && is_numeric($lastRef->reference)) ? (int)$lastRef->reference + 1 : 1;

        if ($copyId = $request->query('copy')) {
            $journalEntry = JournalEntry::findOrFail($copyId);
            $journalEntry->load('lines');

            $copiedJournalEntry = [
                'id' => null,
                'date' => $journalEntry->date,
                'reference' => (string) $nextJournalNo,
                'description' => $journalEntry->description,
                'lines' => $journalEntry->lines->map(function ($line) {
                    return [
                        'id' => null,
                        'chart_of_acc_id' => $line->chart_of_acc_id,
                        'payee_id' => $line->payee_id,
                        'debit' => (float) $line->debit,
                        'credit' => (float) $line->credit,
                        'memo' => $line->memo,
                    ];
                })->values()->toArray(),
            ];

            return Inertia::render('Transaction/JournalEntryForm', [
                'nextJournalNo' => (string)$nextJournalNo,
                'journalEntry' => $copiedJournalEntry,
            ]);
        }

        return Inertia::render('Transaction/JournalEntryForm', [
            'nextJournalNo' => (string)$nextJournalNo
        ]);
    }

    public function store(JournalEntryRequest $request)
{
    $request->validated();
    \App\Services\BooksLockService::check($request->date, $request->books_pin);

    return DB::transaction(function () use ($request) {
        $totalDebit = 0;
        $totalCredit = 0;

        $entry = JournalEntry::create([

            'date' => $request->date,
            'reference' => $request->reference_no,
            'description' => $request->description,
            'transaction_type' => 'journal_entry',
            'status' => 'posted',
            'created_by' => Auth::id(),
            'currency_id' => $request->input('currency_id'),
            'exchange_rate' => $request->input('exchange_rate', 1),
        ]);

        foreach ($request->lines as $line) {
            $debit = (float)($line['debit'] ?? 0);
            $credit = (float)($line['credit'] ?? 0);

            if ($debit == 0 && $credit == 0) continue;

            $payeeId = $line['payee_id'] ?? null;
            $payeeType = null;

            // FIX 2: Check if payeeId is a valid UUID/ID before searching
            if ($payeeId) {
                if (Supplier::where('id', $payeeId)->exists()) $payeeType = Supplier::class;
                elseif (Customer::where('id', $payeeId)->exists()) $payeeType = Customer::class;
                elseif (Employee::where('id', $payeeId)->exists()) $payeeType = Employee::class;
            }

            $entry->lines()->create([
                'chart_of_acc_id' => $line['account_id'],
                'payee_id' => $payeeId,
                'payee_type' => $payeeType,
                'fc_currency_id' => $request->input('currency_id'),
                'fc_debit' => $line['fc_debit'] ?? null,
                'fc_credit' => $line['fc_credit'] ?? null,
                'exchange_rate' => $request->input('exchange_rate', 1),
                'debit' => $debit,
                'credit' => $credit,
                'memo' => $line['description'] ?? null,
            ]);

            $totalDebit += $debit;
            $totalCredit += $credit;
        }

        // Use a small epsilon check for floating point math safety
        if (abs($totalDebit - $totalCredit) > 0.001) {
            throw new \Exception("Debits ({$totalDebit}) and Credits ({$totalCredit}) must balance.");
        }

        $entry->update(['total_amount' => $totalDebit]);

        $action = $request->input('action', 'save');
        if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'Journal Entry saved successfully.'); }
        if ($action === 'new') {
            return redirect()->route('journal-entries.create')->with('success', 'Journal Entry saved successfully.');
        }
        return redirect()->route('journal-entries.edit', $entry->id)->with('success', 'Journal Entry saved successfully.');
    });
}

    public function edit(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $accounts = ChartOfAcc::orderBy('account_code')->get();

        return Inertia::render('Transaction/JournalEntryForm', [
            'journalEntry' => $journalEntry
        ]);
    }

    public function update(JournalEntryRequest $request, JournalEntry $journalEntry)
    {
        $request->validated();
        \App\Services\BooksLockService::check($journalEntry->date, $request->books_pin);
        if (date('Y-m-d', strtotime($journalEntry->date)) !== date('Y-m-d', strtotime($request->date))) {
            \App\Services\BooksLockService::check($request->date, $request->books_pin);
        }

        return DB::transaction(function () use ($request, $journalEntry) {
            $journalEntry->update([
                'date' => $request->date,
                'reference' => $request->reference_no,
                'description' => $request->description,
                'currency_id' => $request->input('currency_id'),
                'exchange_rate' => $request->input('exchange_rate', 1),
            ]);

            $journalEntry->lines->each->delete();

            $totalDebit = 0;
            foreach ($request->lines as $line) {
                $debit = (float)($line['debit'] ?? 0);
                $credit = (float)($line['credit'] ?? 0);

                if ($debit == 0 && $credit == 0) continue;

                $payeeId = $line['payee_id'] ?? null;
                $payeeType = null;
                if ($payeeId) {
                    if (Supplier::find($payeeId)) $payeeType = Supplier::class;
                    elseif (Customer::find($payeeId)) $payeeType = Customer::class;
                    elseif (Employee::find($payeeId)) $payeeType = Employee::class;
                }

                $journalEntry->lines()->create([
                    'chart_of_acc_id' => $line['account_id'],
                    'payee_id' => $payeeId,
                    'payee_type' => $payeeType,
                    'fc_currency_id' => $request->input('currency_id'),
                    'fc_debit' => $line['fc_debit'] ?? null,
                    'fc_credit' => $line['fc_credit'] ?? null,
                    'exchange_rate' => $request->input('exchange_rate', 1),
                    'debit' => $debit,
                    'credit' => $credit,
                    'memo' => $line['description'] ?? null,
                ]);

                $totalDebit += $debit;
            }

            $journalEntry->update(['total_amount' => $totalDebit]);

            $action = $request->input('action', 'save');
            if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'Journal Entry updated successfully.'); }
            if ($action === 'new') {
                return redirect()->route('journal-entries.create')->with('success', 'Journal Entry updated successfully.');
            }
            
            return redirect()->route('journal-entries.edit', $journalEntry->id)->with('success', 'Journal Entry updated successfully.');
        });
    }

    /**
     * Quick update a JournalEntry from the Account History register.
     */
    public function quickUpdate(QuickJournalEntryRequest $request, JournalEntry $journalEntry)
    {
        $request->validated();
        \App\Services\BooksLockService::check($journalEntry->date, $request->books_pin);
        if (date('Y-m-d', strtotime($journalEntry->date)) !== date('Y-m-d', strtotime($request->input('date')))) {
            \App\Services\BooksLockService::check($request->input('date'), $request->books_pin);
        }

        return DB::transaction(function () use ($request, $journalEntry) {
            $payeeId = $request->input('payee_id');
            $payeeType = null;
            if ($payeeId) {
                if (Supplier::where('id', $payeeId)->exists()) $payeeType = Supplier::class;
                elseif (Customer::where('id', $payeeId)->exists()) $payeeType = Customer::class;
                elseif (Employee::where('id', $payeeId)->exists()) $payeeType = Employee::class;
            }

            // Update main journal entry fields
            $journalEntry->update([
                'date' => $request->input('date'),
                'reference' => $request->input('reference'),
                'description' => $request->input('description'),
                'total_amount' => max((float)$request->input('debit'), (float)$request->input('credit')),
            ]);

            $lines = $journalEntry->lines;
            $currentAccountId = $request->input('chart_of_acc_id');

            if ($lines->count() === 2) {
                // Simple double-entry update
                $line1 = $lines->firstWhere('chart_of_acc_id', $currentAccountId);
                $line2 = $lines->firstWhere('chart_of_acc_id', '!=', $currentAccountId);

                if (!$line1) {
                    $line1 = $lines->first();
                    $line2 = $lines->last();
                }

                $debit = (float)$request->input('debit');
                $credit = (float)$request->input('credit');

                $line1->update([
                    'chart_of_acc_id' => $currentAccountId,
                    'debit' => $debit,
                    'credit' => $credit,
                    'payee_id' => $payeeId,
                    'payee_type' => $payeeType,
                    'memo' => $request->input('description'),
                ]);

                if ($line2) {
                    $offsetAccountId = $request->input('offset_account_id') ?? $line2->chart_of_acc_id;
                    $line2->update([
                        'chart_of_acc_id' => $offsetAccountId,
                        'debit' => $credit,
                        'credit' => $debit,
                        'payee_id' => $payeeId,
                        'payee_type' => $payeeType,
                        'memo' => $request->input('description'),
                    ]);
                }
            } else {
                // Split transaction (multiple lines)
                $line1 = $lines->firstWhere('chart_of_acc_id', $currentAccountId);
                if ($line1) {
                    $line1->update([
                        'debit' => (float)$request->input('debit'),
                        'credit' => (float)$request->input('credit'),
                        'payee_id' => $payeeId,
                        'payee_type' => $payeeType,
                        'memo' => $request->input('description'),
                    ]);
                }
            }

            return response()->json(['message' => 'Journal Entry Updated Successfully']);
        });
    }

    /**
     * Delete a JournalEntry.
     */
public function destroy(Request $request, JournalEntry $journalEntry)
{
    \App\Services\BooksLockService::check($journalEntry->date, $request->input('books_pin'));
    $chartOfAccountId = $journalEntry->lines->first()?->chart_of_acc_id 
        ?? $journalEntry->lines->first()?->chart_of_account_id 
        ?? $journalEntry->lines->first()?->account_id;

    $journalEntry->lines->each->delete();
    $journalEntry->delete();

    if ($chartOfAccountId) {
        return redirect()->route('chart-of-account.history', ['chart_of_account' => $chartOfAccountId])
            ->with('success', 'Journal Entry deleted successfully.');
    }

    return redirect()->route('chart-of-account.index')
        ->with('success', 'Journal Entry deleted successfully.');
}
}
