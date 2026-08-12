<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\PaymentMethod;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\BankDeposit;
use App\Models\Accounting\BankDepositItem;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Http\Requests\Accounting\BankDepositRequest;

class BankDepositController extends Controller
{
    public function create()
    {
        return Inertia::render('Transaction/BankDeposit/BankDepositForm', [
            'nextRef' => $this->getNextDepositNo(),
            'paymentMethods' => $this->paymentMethods()
        ]);
    }

    public function store(BankDepositRequest $request)
    {
        $validated = $request->validated();
        \App\Services\BooksLockService::check($request->depositDate, $request->books_pin);

        DB::transaction(function() use ($request) {
            $items = collect($request->items)->filter(fn($i) => (float)str_replace(',', '', $i['amount']) > 0)->values()->all();

            $total = collect($items)->sum(fn($i) => (float)str_replace(',', '', $i['amount']));

            $deposit = BankDeposit::create([
                'deposit_no' => $request->depositNo,
                'deposit_date' => $request->depositDate,
                'deposit_to_account_id' => $request->depositTo,
                'cash_back_account_id' => $request->cashBackAccount,
                'cash_back_memo' => $request->cashBackMemo,
                'cash_back_amount' => (float) str_replace(',', '', $request->cashBackAmount ?? 0),
                'total_amount' => $total,
                'memo' => $request->memo,
                'status' => 'posted',
            ]);

            foreach ($items as $it) {
                BankDepositItem::create([
                    'bank_deposit_id' => $deposit->id,
                    'received_from' => $it['receivedFrom'] ?? null,
                    'account_id' => $it['account'] ?? null,
                    'description' => $it['description'] ?? null,
                    'payment_method_id' => $it['paymentMethod'] ?? null,
                    'ref_no' => $it['refNo'] ?? null,
                    'amount' => (float) str_replace(',', '', $it['amount']),
                ]);
            }

            // Financial truth
            $journalEntry = JournalEntry::create([
                'date' => $request->depositDate,
                'reference' => $request->depositNo,
                'description' => $request->memo,
                'transaction_type' => 'bank_deposit',
                'total_amount' => $total,
                'status' => 'posted',
                'created_by' => Auth::id(),
                'transactionable_id' => $deposit->id,
                'transactionable_type' => BankDeposit::class,
            ]);

            // Debit deposit account (bank)
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_acc_id' => $request->depositTo,
                'debit' => $total,
                'credit' => 0,
                'memo' => $request->memo,
            ]);

            // Credit each source account
            foreach ($items as $it) {
                if (!empty($it['account'])) {
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $it['account'],
                        'debit' => 0,
                        'credit' => (float) str_replace(',', '', $it['amount']),
                        'memo' => $it['description'] ?? $request->memo,
                    ]);
                }
            }
        });

        $action = $request->input('action', 'save');
        if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'Bank deposit saved successfully.'); }

        if ($action === 'new') {
            return redirect()->route('bank-deposit.create')->with('success', 'Bank deposit saved successfully.');
        }

        return redirect()->back()->with('success', 'Bank deposit saved successfully.');
    }

    public function edit(JournalEntry $journalEntry)
    {
        $deposit = BankDeposit::with('items')->find($journalEntry->transactionable_id);

        return Inertia::render('Transaction/BankDeposit/BankDepositForm', [
            'deposit' => [
                'id' => $journalEntry->id,
                'depositTo' => $deposit->deposit_to_account_id,
                'depositDate' => $deposit->deposit_date,
                'depositNo' => $deposit->deposit_no,
                'cashBackAccount' => $deposit->cash_back_account_id,
                'cashBackMemo' => $deposit->cash_back_memo,
                'cashBackAmount' => $deposit->cash_back_amount,
                'memo' => $deposit->memo,
                'items' => $deposit->items->map(function($i) {
                    return [
                        'id' => $i->id,
                        'receivedFrom' => $i->received_from,
                        'account' => $i->account_id,
                        'description' => $i->description,
                        'paymentMethod' => $i->payment_method_id,
                        'refNo' => $i->ref_no,
                        'amount' => $i->amount,
                    ];
                })
            ],
            'paymentMethods' => $this->paymentMethods()
        ]);
    }

    public function update(BankDepositRequest $request, JournalEntry $journalEntry)
    {
        $validated = $request->validated();
        \App\Services\BooksLockService::check($journalEntry->date, $request->books_pin);
        \App\Services\BooksLockService::check($request->depositDate, $request->books_pin);
        $deposit = BankDeposit::find($journalEntry->transactionable_id);

        DB::transaction(function() use ($request, $deposit, $journalEntry) {
            $items = collect($request->items)->filter(fn($i) => (float)str_replace(',', '', $i['amount']) > 0)->values()->all();

            $total = collect($items)->sum(fn($i) => (float)str_replace(',', '', $i['amount']));

            $deposit->update([
                'deposit_no' => $request->depositNo,
                'deposit_date' => $request->depositDate,
                'deposit_to_account_id' => $request->depositTo,
                'cash_back_account_id' => $request->cashBackAccount,
                'cash_back_memo' => $request->cashBackMemo,
                'cash_back_amount' => (float) str_replace(',', '', $request->cashBackAmount ?? 0),
                'total_amount' => $total,
                'memo' => $request->memo,
            ]);

            $deposit->items()->delete();

            foreach ($items as $it) {
                BankDepositItem::create([
                    'bank_deposit_id' => $deposit->id,
                    'received_from' => $it['receivedFrom'] ?? null,
                    'account_id' => $it['account'] ?? null,
                    'description' => $it['description'] ?? null,
                    'payment_method_id' => $it['paymentMethod'] ?? null,
                    'ref_no' => $it['refNo'] ?? null,
                    'amount' => (float) str_replace(',', '', $it['amount']),
                ]);
            }

            $journalEntry->update([
                'date' => $request->depositDate,
                'reference' => $request->depositNo,
                'description' => $request->memo,
                'total_amount' => $total,
            ]);

            $journalEntry->lines->each->delete();

            // Debit deposit account (bank)
            JournalEntryLine::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_acc_id' => $request->depositTo,
                'debit' => $total,
                'credit' => 0,
                'memo' => $request->memo,
            ]);

            // Credit each source account
            foreach ($items as $it) {
                if (!empty($it['account'])) {
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $it['account'],
                        'debit' => 0,
                        'credit' => (float) str_replace(',', '', $it['amount']),
                        'memo' => $it['description'] ?? $request->memo,
                    ]);
                }
            }
        });

        $action = $request->input('action', 'save');
        if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'Bank deposit updated successfully.'); }

        if ($action === 'new') {
            return redirect()->route('bank-deposit.create')->with('success', 'Bank deposit updated successfully.');
        }

        return redirect()->back()->with('success', 'Bank deposit updated successfully.');
    }

    public function destroy(JournalEntry $journalEntry)
    {
        \App\Services\BooksLockService::check($journalEntry->date, request()->input('books_pin'));
        DB::transaction(function () use ($journalEntry) {
            $deposit = BankDeposit::find($journalEntry->transactionable_id);
            if ($deposit) {
                $deposit->items()->delete();
                $deposit->delete();
            }
            $journalEntry->lines->each->delete();
            $journalEntry->delete();
        });

        return redirect()->route('dashboard')->with('success', 'Bank deposit deleted successfully.');
    }

    private function getNextDepositNo()
    {
        $last = BankDeposit::query()->latest()->first();
        return $last ? (int)filter_var($last->deposit_no, FILTER_SANITIZE_NUMBER_INT) + 1 : 1001;
    }
}
