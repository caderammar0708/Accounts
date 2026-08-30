<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Accounting\Cheque;
use App\Models\Accounting\ChequeLine;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Http\Requests\Accounting\ChequeRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ChequeController extends Controller
{
    use \App\Traits\AccountingControllerTrait;
    public function index()
    {
        // For standard indexing, not specifically requested, but good for completeness
        $cheques = Cheque::with('bankAccount', 'payee')->latest()->paginate(20);
        return Inertia::render('Transaction/ChequeIndex', ['cheques' => $cheques]);
    }

    public function create(Request $request)
    {
        if ($copyId = $request->query('copy')) {
            $journalEntry = JournalEntry::findOrFail($copyId);
            $journalEntry->load('lines');
            $cheque = Cheque::find($journalEntry->transactionable_id);

            $chequeData = [
                'id' => null,
                'payee' => $journalEntry->payee_id,
                'payeeType' => $cheque?->payee_type ?? ($journalEntry->payee_type == Customer::class ? 'customer' : 'supplier'),
                'account' => $cheque?->bank_account_id ?? $journalEntry->lines->where('credit', '>', 0)->first()?->chart_of_acc_id,
                'date' => $journalEntry->date,
                'cheque_no' => '',
                'mailing_address' => $cheque?->mailing_address ?? '',
                'memo' => $journalEntry->description,
                'items' => $cheque ? $cheque->lines->map(function ($item) {
                    return [
                        'category' => $item->category_account_id,
                        'description' => $item->description,
                        'amount' => $item->amount,
                        'customer_id' => $item->customer_id,
                    ];
                })->values()->toArray() : [],
            ];

            return Inertia::render('Transaction/Cheque/ChequeForm', [
                'cheque' => $chequeData,
            ]);
        }

        return Inertia::render('Transaction/Cheque/ChequeForm', [
            'nextChequeNo' => $this->getNextChequeNo()
        ]);
    }

    private function getNextChequeNo()
    {
        $last = JournalEntry::query()
            ->where('transaction_type', 'cheque')
            ->orderByRaw('CAST(REGEXP_REPLACE(reference, "[^0-9]", "") AS UNSIGNED) DESC')
            ->first();

        if ($last) {
            $num = (int) preg_replace('/[^0-9]/', '', $last->reference);
            return 'CHQ-' . str_pad($num + 1, 4, '0', STR_PAD_LEFT);
        }
        return 'CHQ-0001';
    }

    public function store(ChequeRequest $request)
    {
        $validated = $request->validated();

        $bankAccount = $request->input('account', $request->input('paymentAccount'));
        $paymentDate = $request->input('date', $request->input('paymentDate'));
        $chequeNo = $request->input('cheque_no', $request->input('ref'));

        $this->checkBooksLock($paymentDate, $request->books_pin);

        try {
            $journalEntry = DB::transaction(function() use ($request, $bankAccount, $paymentDate, $chequeNo) {
                $categoryItems = collect($request->items)->filter(function($item) {
                    return !empty($item['category']) && isset($item['amount']) && $item['amount'] !== '';
                });

                if ($categoryItems->isEmpty()) {
                    throw new \Exception('At least one Category item is required.');
                }

                $totalAmount = $categoryItems->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                });

                // 1. Create Business Document (Cheque)
                $cheque = Cheque::create([
                    'payee_id' => $request->payee,
                    'payee_type' => $request->payeeType,
                    'bank_account_id' => $bankAccount,
                    'payment_date' => $paymentDate,
                    'cheque_no' => $chequeNo,
                    'mailing_address' => $request->mailing_address,
                    'total_amount' => $totalAmount,
                    'memo' => $request->memo,
                    'status' => 'posted',
                    'currency_id' => $request->currency_id,
                    'exchange_rate' => $request->exchange_rate ?? 1.0,
                ]);

                $exchangeRate = (float) ($request->exchange_rate ?? 1.0);

                // Categories
                $lineOrder = 1;
                foreach ($categoryItems as $lineItem) {
                    ChequeLine::create([
                        'cheque_id' => $cheque->id,
                        'category_account_id' => $lineItem['category'],
                        'description' => $lineItem['description'] ?? '',
                        'amount' => (float) str_replace(',', '', $lineItem['amount']),
                        'customer_id' => $lineItem['customer_id'] ?? null,
                        'line_order' => $lineOrder++,
                    ]);
                }

                // 2. Create Financial Truth (Journal Entry)
                $journalEntry = JournalEntry::create([
                    'date' => $paymentDate,
                    'reference' => $chequeNo,
                    'description' => $request->memo,
                    'transaction_type' => 'cheque',
                    'payee_id' => $request->payee,
                    'payee_type' => $request->payeeType == 'customer' ? Customer::class : (Supplier::class),
                    'total_amount' => $totalAmount,
                    'status' => 'posted',
                    'created_by' => Auth::id(),
                    'transactionable_id' => $cheque->id,
                    'transactionable_type' => Cheque::class,
                ]);

                // Debits (Expenses/Assets) - Categories
                foreach ($categoryItems as $lineItem) {
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $lineItem['category'],
                        'debit' => (float) str_replace(',', '', $lineItem['amount']),
                        'credit' => 0,
                        'memo' => $lineItem['description'] ?? $request->memo,
                    ]);
                }

                // Bank Account Credit
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $bankAccount,
                    'debit' => 0,
                    'credit' => $totalAmount * $exchangeRate,
                    'memo' => $request->memo,
                ]);

                $cheque->attachAttachments($request->input('attachment_ids', []));
                $journalEntry->attachAttachments($request->input('attachment_ids', []));

                return $journalEntry;
            });

            $action = $request->input('action', 'save');

            if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'Cheque saved successfully.'); }

            if ($action === 'new') {
                return redirect()->route('cheque')->with('success', 'Cheque saved successfully.');
            }

            return redirect()->route('cheque.edit', $journalEntry->id)->with('success', 'Cheque saved successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function edit(JournalEntry $journalEntry)
    {
        $journalEntry->load(['lines', 'attachments']);
        $cheque = Cheque::with('attachments')->find($journalEntry->transactionable_id);

        $chequeData = [
            'id' => $journalEntry->id,
            'payee' => $journalEntry->payee_id,
            'payeeType' => $cheque?->payee_type ?? ($journalEntry->payee_type == Customer::class ? 'customer' : 'supplier'),
            'account' => $cheque?->bank_account_id ?? $journalEntry->lines->where('credit', '>', 0)->first()?->chart_of_acc_id,
            'date' => $journalEntry->date,
            'exchange_rate' => $cheque?->exchange_rate ?? 1.0,
            'currency_id' => $cheque?->currency_id ?? "",
            'cheque_no' => $cheque?->cheque_no ?? $journalEntry->reference,
            'mailing_address' => $cheque?->mailing_address ?? '',
            'memo' => $journalEntry->description,
            'items' => $cheque ? $cheque->lines->map(function ($item) {
                return [
                    'category' => $item->category_account_id,
                    'description' => $item->description,
                    'amount' => $item->amount,
                    'customer_id' => $item->customer_id,
                ];
            })->values()->toArray() : [],
            'attachments' => ($cheque && $cheque->attachments->isNotEmpty()) ? $cheque->attachments : $journalEntry->attachments,
        ];

        return Inertia::render('Transaction/Cheque/ChequeForm', [
            'cheque' => $chequeData,
        ]);
    }

    public function update(ChequeRequest $request, JournalEntry $journalEntry)
    {
        $validated = $request->validated();

        $bankAccount = $request->input('account', $request->input('paymentAccount'));
        $paymentDate = $request->input('date', $request->input('paymentDate'));
        $chequeNo = $request->input('cheque_no', $request->input('ref'));

        $this->checkBooksLock($journalEntry->date, $request->books_pin);
        $this->checkBooksLock($paymentDate, $request->books_pin);

        try {
            DB::transaction(function() use ($request, $journalEntry, $bankAccount, $paymentDate, $chequeNo) {
                $categoryItems = collect($request->items)->filter(function($item) {
                    return !empty($item['category']) && isset($item['amount']) && $item['amount'] !== '';
                });

                if ($categoryItems->isEmpty()) {
                    throw new \Exception('At least one Category item is required.');
                }

                $totalAmount = $categoryItems->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                });

                // 1. Update Business Document
                $cheque = Cheque::find($journalEntry->transactionable_id);
                $exchangeRate = (float) ($request->exchange_rate ?? 1.0);

                if ($cheque) {
                    $cheque->update([
                        'payee_id' => $request->payee,
                        'payee_type' => $request->payeeType,
                        'bank_account_id' => $bankAccount,
                        'payment_date' => $paymentDate,
                        'cheque_no' => $chequeNo,
                        'mailing_address' => $request->mailing_address,
                        'total_amount' => $totalAmount,
                        'memo' => $request->memo,
                        'currency_id' => $request->currency_id,
                        'exchange_rate' => $exchangeRate,
                    ]);

                    $cheque->lines()->delete();

                    // Categories
                    $lineOrder = 1;
                    foreach ($categoryItems as $lineItem) {
                        ChequeLine::create([
                            'cheque_id' => $cheque->id,
                            'category_account_id' => $lineItem['category'],
                            'description' => $lineItem['description'] ?? '',
                            'amount' => (float) str_replace(',', '', $lineItem['amount']),
                            'customer_id' => $lineItem['customer_id'] ?? null,
                            'line_order' => $lineOrder++,
                        ]);
                    }
                }

                // 2. Update Financial Truth
                $journalEntry->update([
                    'date' => $paymentDate,
                    'reference' => $chequeNo,
                    'description' => $request->memo,
                    'payee_id' => $request->payee,
                    'payee_type' => $request->payeeType == 'customer' ? Customer::class : (Supplier::class),
                    'total_amount' => $totalAmount,
                ]);

                $journalEntry->lines->each->delete();

                // Debits (Expenses/Assets) - Categories
                foreach ($categoryItems as $lineItem) {
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $lineItem['category'],
                        'debit' => ((float) str_replace(',', '', $lineItem['amount'])) * $exchangeRate,
                        'credit' => 0,
                        'memo' => $lineItem['description'] ?? $request->memo,
                    ]);
                }

                // Credit
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $bankAccount,
                    'debit' => 0,
                    'credit' => $totalAmount * $exchangeRate,
                    'memo' => $request->memo,
                ]);

                $cheque = Cheque::find($journalEntry->transactionable_id);
                if ($cheque) {
                    $cheque->attachAttachments($request->input('attachment_ids', []));
                }
                $journalEntry->attachAttachments($request->input('attachment_ids', []));
            });

            $action = $request->input('action', 'save');
            if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'Cheque updated successfully.'); } elseif ($action === 'new') {
                return redirect()->route('cheque')->with('success', 'Cheque updated successfully.');
            }

            return redirect()->route('cheque.edit', $journalEntry->id)->with('success', 'Cheque updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function void(Request $request, JournalEntry $journalEntry)
    {
        $this->checkBooksLock($journalEntry->date, $request->input('books_pin'));

        DB::transaction(function () use ($journalEntry) {
            $cheque = Cheque::find($journalEntry->transactionable_id);

            if ($cheque) {
                $cheque->update(['status' => 'void', 'voided_at' => now()]);
            }

            $journalEntry->update(['status' => 'void', 'total_amount' => 0, 'voided_at' => now()]);
            $journalEntry->lines()->update(['debit' => 0, 'credit' => 0, 'fc_debit' => 0, 'fc_credit' => 0]);
        });

        return redirect()->back()->with('success', 'Cheque voided successfully.');
    }

    public function destroy(JournalEntry $journalEntry)
    {
        $this->checkBooksLock($journalEntry->date, request()->input('books_pin'));
        // Must grab this BEFORE the transaction deletes the lines
        $paymentAccountId = $journalEntry->lines()
            ->where('credit', '>', 0)
            ->value('chart_of_acc_id');

        DB::transaction(function () use ($journalEntry) {
            $cheque = Cheque::find($journalEntry->transactionable_id);

            if ($cheque) {
                $cheque->lines()->delete();
                $cheque->delete();
            }

            $journalEntry->lines()->delete();
            $journalEntry->delete();
        });

        if ($paymentAccountId) {
            return redirect()->route('chart-of-account.history', ['chart_of_account' => $paymentAccountId])
                ->with('success', 'Cheque deleted successfully.');
        }

        return redirect()->route('dashboard')
            ->with('success', 'Cheque deleted successfully.');
    }
}
