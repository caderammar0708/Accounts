<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PaymentMethod;
use App\Models\Accounting\ChartOfAcc;

use App\Models\Supplier;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Http\Requests\Accounting\PaymentRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    public function create(Request $request)
    {
        if ($copyId = $request->query('copy')) {
            $journalEntry = JournalEntry::findOrFail($copyId);
            $journalEntry->load('lines');
            $payment = \App\Models\Accounting\Payment::find($journalEntry->transactionable_id);

            $expenseData = [
                'id' => null,
                'payee' => $journalEntry->payee_id,
                'payeeType' => $payment?->payee_type ?? ($journalEntry->payee_type == Customer::class ? 'customer' : 'supplier'),
                'paymentAccount' => $payment?->payment_account_id ?? $journalEntry->lines->where('credit', '>', 0)->first()?->chart_of_acc_id,
                'paymentDate' => $journalEntry->date,
                'paymentMethod' => $payment?->payment_method_id ?? '',
                'referenceNo' => '',
                'memo' => $journalEntry->description,
                'checkDate' => $payment?->check_date,
                'checkNumber' => $payment?->check_number,
                'items' => $payment ? $payment->items->whereNull('item_id')->map(function ($item) {
                    return [
                        'category' => $item->chart_of_acc_id,
                        'description' => $item->description,
                        'amount' => $item->amount,
                    ];
                })->values()->toArray() : [],
                'itemDetails' => $payment ? $payment->items->whereNotNull('item_id')->map(function ($item) {
                    return [
                        'product' => $item->item_id,
                        'description' => $item->description,
                        'qty' => $item->quantity ?? 1,
                        'rate' => $item->rate ?? $item->amount,
                        'amount' => $item->amount,
                    ];
                })->values()->toArray() : [],
            ];

            return Inertia::render('Transaction/Payment/PaymentForm', [
                'expense' => $expenseData,
                'paymentMethods' => $this->paymentMethods(),
            ]);
        }

        return Inertia::render('Transaction/Payment/PaymentForm', [
            'nextExpenseNo' => $this->getNextExpenseNo(),
            'paymentMethods' => $this->paymentMethods()
        ]);
    }

    private function getNextExpenseNo()
    {
        $last = JournalEntry::query()
            ->where('transaction_type', 'expense')
            ->orderByRaw('CAST(REGEXP_REPLACE(reference, "[^0-9]", "") AS UNSIGNED) DESC')
            ->first();

        if ($last) {
            $num = (int) preg_replace('/[^0-9]/', '', $last->reference);
            return 'EXP-' . str_pad($num + 1, 4, '0', STR_PAD_LEFT);
        }
        return 'EXP-0001';
    }

    public function store(PaymentRequest $request)
    {
        $validated = $request->validated();

        $paymentAccount = $request->input('account', $request->input('paymentAccount'));
        $paymentDate = $request->input('date', $request->input('paymentDate'));
        $paymentMethod = $request->input('method', $request->input('paymentMethod'));
        $referenceNo = $request->input('ref', $request->input('referenceNo'));

        
        try {
            \App\Services\BooksLockService::check($paymentDate, $request->books_pin);
            $journalEntry = DB::transaction(function() use ($request, $paymentAccount, $paymentDate, $paymentMethod, $referenceNo) {
                $categoryItems = collect($request->items)->filter(function($item) {
                    return !empty($item['category']) && (float)str_replace(',', '', $item['amount']) > 0;
                });

                $productItems = collect($request->itemDetails)->filter(function($item) {
                    return !empty($item['product']) && (float)str_replace(',', '', $item['amount']) > 0;
                });

                if ($categoryItems->isEmpty() && $productItems->isEmpty()) {
                    throw new \Exception('At least one Category item or Product item is required.');
                }

                $totalAmount = $categoryItems->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                }) + $productItems->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                });

                // 1. Create Business Document (Expense)

                $payment = \App\Models\Accounting\Payment::create([
                    'payee_id' => $request->payee,
                    'payee_type' => $request->payeeType,
                    'payment_account_id' => $paymentAccount,
                    'payment_date' => $paymentDate,
                    'payment_method_id' => $paymentMethod,
                    'reference_no' => $referenceNo,
                    'total_amount' => $totalAmount,
                    'memo' => $request->memo,
                    'check_date' => $request->checkDate,
                    'check_number' => $request->checkNumber,
                    'status' => 'posted',
                ]);

                // Categories
                foreach ($categoryItems as $lineItem) {
                    \App\Models\Accounting\PaymentItem::create([
                        'payment_id' => $payment->id,
                        'chart_of_acc_id' => $lineItem['category'],
                        'description' => $lineItem['description'] ?? '',
                        'quantity' => 1,
                        'rate' => (float) str_replace(',', '', $lineItem['amount']),
                        'amount' => (float) str_replace(',', '', $lineItem['amount']),
                    ]);
                }

                // Products
                foreach ($productItems as $productItem) {
                    $itemModel = \App\Models\Item::find($productItem['product']);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $qty = (float)str_replace(',', '', $productItem['qty'] ?? 1);
                        $itemModel->increment('quantity_on_hand', $qty);
                    }

                    $chartOfAccId = $itemModel?->type === 'inventory'
                        ? ($itemModel->inventory_account_id ?? (ChartOfAcc::query()->where('sub_type', 'inventory')->first()?->id ?? ChartOfAcc::getOrCreateDefault('inventory')->id))
                        : ($itemModel?->expense_account_id ?? (ChartOfAcc::query()->where('account_type', 'expense')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-expense')->id));

                    if (!$chartOfAccId) {
                        $chartOfAccId = ChartOfAcc::query()->where('account_type', 'expense')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-expense')->id;
                    }

                    \App\Models\Accounting\PaymentItem::create([
                        'payment_id' => $payment->id,
                        'item_id' => $productItem['product'],
                        'chart_of_acc_id' => $chartOfAccId,
                        'description' => $productItem['description'] ?? '',
                        'quantity' => (float)str_replace(',', '', $productItem['qty'] ?? 1),
                        'rate' => (float)str_replace(',', '', $productItem['rate'] ?? 0),
                        'amount' => (float)str_replace(',', '', $productItem['amount']),
                    ]);
                }

                // 2. Create Financial Truth (Journal Entry)
                $journalEntry = JournalEntry::create([
                    'date' => $paymentDate,
                    'reference' => $referenceNo,
                    'description' => $request->memo,
                    'transaction_type' => 'expense',
                    'payee_id' => $request->payee,
                    'payee_type' => $request->payeeType == 'customer' ? Customer::class : (\App\Models\Supplier::class),
                    'total_amount' => $totalAmount,
                    'status' => 'posted',
                    'created_by' => Auth::id(),
                    'transactionable_id' => $payment->id,
                    'transactionable_type' => \App\Models\Accounting\Payment::class,
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

                // Debits (Expenses/Assets) - Products
                foreach ($productItems as $productItem) {
                    $itemModel = \App\Models\Item::find($productItem['product']);
                    $chartOfAccId = $itemModel?->type === 'inventory'
                        ? ($itemModel->inventory_account_id ?? ChartOfAcc::query()->where('sub_type', 'inventory')->first()?->id)
                        : ($itemModel?->expense_account_id ?? ChartOfAcc::query()->where('account_type', 'expense')->first()?->id);

                    if (!$chartOfAccId) {
                        $chartOfAccId = ChartOfAcc::query()->where('account_type', 'expense')->first()?->id;
                    }

                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $chartOfAccId,
                        'debit' => (float)str_replace(',', '', $productItem['amount']),
                        'credit' => 0,
                        'memo' => $productItem['description'] ?? $request->memo,
                    ]);
                }

                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $paymentAccount,
                    'debit' => 0,
                    'credit' => $totalAmount,
                    'memo' => $request->memo,
                ]);

                return $journalEntry;
            });

            $action = $request->input('action', 'save');

            // No session saving needed

            if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'ReceivePayment saved successfully.'); }

            if ($action === 'new') {
                return redirect()->route('payment.create')->with('success', 'ReceivePayment saved successfully.');
            }

            return redirect()->route('payment.edit', $journalEntry->id)->with('success', 'ReceivePayment saved successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function edit(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $payment = \App\Models\Accounting\Payment::find($journalEntry->transactionable_id);

        $expenseData = [
            'id' => $journalEntry->id,
            'payee' => $journalEntry->payee_id,
            'payeeType' => $payment?->payee_type ?? ($journalEntry->payee_type == Customer::class ? 'customer' : 'supplier'),
            'paymentAccount' => $payment?->payment_account_id ?? $journalEntry->lines->where('credit', '>', 0)->first()?->chart_of_acc_id,
            'paymentDate' => $journalEntry->date,
            'paymentMethod' => $payment?->payment_method_id ?? '',
            'referenceNo' => $journalEntry->reference,
            'memo' => $journalEntry->description,
            'checkDate' => $payment?->check_date,
            'checkNumber' => $payment?->check_number,
            'items' => $payment ? $payment->items->whereNull('item_id')->map(function ($item) {
                return [
                    'category' => $item->chart_of_acc_id,
                    'description' => $item->description,
                    'amount' => $item->amount,
                ];
            })->values()->toArray() : [],
            'itemDetails' => $payment ? $payment->items->whereNotNull('item_id')->map(function ($item) {
                return [
                    'product' => $item->item_id,
                    'description' => $item->description,
                    'qty' => $item->quantity ?? 1,
                    'rate' => $item->rate ?? $item->amount,
                    'amount' => $item->amount,
                ];
            })->values()->toArray() : [],
        ];

        return Inertia::render('Transaction/Payment/PaymentForm', [
            'payees' => array_merge(
                Customer::orderBy('display_name')->get()->map(fn($c) => ['id' => $c->id, 'name' => $c->display_name, 'type' => 'customer'])->toArray(),
                Supplier::orderBy('display_name')->get()->map(fn($s) => ['id' => $s->id, 'name' => $s->display_name, 'type' => 'supplier'])->toArray()
            ),
            'accounts' => ChartOfAcc::orderBy('account_code')->get(),
            'expense' => $expenseData,
            'paymentMethods' => $this->paymentMethods(),
        ]);
    }

    public function update(PaymentRequest $request, JournalEntry $journalEntry)
    {
        $validated = $request->validated();

        $paymentAccount = $request->input('account', $request->input('paymentAccount'));
        $paymentDate = $request->input('date', $request->input('paymentDate'));
        $paymentMethod = $request->input('method', $request->input('paymentMethod'));
        $referenceNo = $request->input('ref', $request->input('referenceNo'));

        
        try {
            \App\Services\BooksLockService::check($journalEntry->date, $request->books_pin);
            if (date('Y-m-d', strtotime($journalEntry->date)) !== date('Y-m-d', strtotime($paymentDate))) {
                \App\Services\BooksLockService::check($paymentDate, $request->books_pin);
            }

            DB::transaction(function() use ($request, $journalEntry, $paymentAccount, $paymentDate, $paymentMethod, $referenceNo) {
                $categoryItems = collect($request->items)->filter(function($item) {
                    return !empty($item['category']) && (float)str_replace(',', '', $item['amount']) > 0;
                });

                $productItems = collect($request->itemDetails)->filter(function($item) {
                    return !empty($item['product']) && (float)str_replace(',', '', $item['amount']) > 0;
                });

                if ($categoryItems->isEmpty() && $productItems->isEmpty()) {
                    throw new \Exception('At least one Category item or Product item is required.');
                }

                $totalAmount = $categoryItems->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                }) + $productItems->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                });

                // 1. Update Business Document
                $payment = \App\Models\Accounting\Payment::find($journalEntry->transactionable_id);
                if ($payment) {

                    $payment->update([
                        'payee_id' => $request->payee,
                        'payee_type' => $request->payeeType,
                        'payment_account_id' => $paymentAccount,
                        'payment_date' => $paymentDate,
                        'payment_method_id' => $paymentMethod,
                        'reference_no' => $referenceNo,
                        'total_amount' => $totalAmount,
                        'memo' => $request->memo,
                        'check_date' => $request->checkDate,
                        'check_number' => $request->checkNumber,
                    ]);

                    foreach ($payment->items->whereNotNull('item_id') as $oldItem) {
                        $itemModel = \App\Models\Item::find($oldItem->item_id);
                        if ($itemModel && $itemModel->type === 'inventory') {
                            $itemModel->decrement('quantity_on_hand', $oldItem->quantity);
                        }
                    }
                    $payment->items()->delete();

                    // Categories
                    foreach ($categoryItems as $lineItem) {
                        \App\Models\Accounting\PaymentItem::create([
                            'payment_id' => $payment->id,
                            'chart_of_acc_id' => $lineItem['category'],
                            'description' => $lineItem['description'] ?? '',
                            'quantity' => 1,
                            'rate' => (float) str_replace(',', '', $lineItem['amount']),
                            'amount' => (float) str_replace(',', '', $lineItem['amount']),
                        ]);
                    }

                    // Products
                    foreach ($productItems as $productItem) {
                        $itemModel = \App\Models\Item::find($productItem['product']);
                        if ($itemModel && $itemModel->type === 'inventory') {
                            $qty = (float)str_replace(',', '', $productItem['qty'] ?? 1);
                            $itemModel->increment('quantity_on_hand', $qty);
                        }

                        $chartOfAccId = $itemModel?->type === 'inventory'
                            ? ($itemModel->inventory_account_id ?? (ChartOfAcc::query()->where('sub_type', 'inventory')->first()?->id ?? ChartOfAcc::getOrCreateDefault('inventory')->id))
                            : ($itemModel?->expense_account_id ?? (ChartOfAcc::query()->where('account_type', 'expense')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-expense')->id));

                        if (!$chartOfAccId) {
                            $chartOfAccId = ChartOfAcc::query()->where('account_type', 'expense')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-expense')->id;
                        }

                        \App\Models\Accounting\PaymentItem::create([
                            'payment_id' => $payment->id,
                            'item_id' => $productItem['product'],
                            'chart_of_acc_id' => $chartOfAccId,
                            'description' => $productItem['description'] ?? '',
                            'quantity' => (float)str_replace(',', '', $productItem['qty'] ?? 1),
                            'rate' => (float)str_replace(',', '', $productItem['rate'] ?? 0),
                            'amount' => (float)str_replace(',', '', $productItem['amount']),
                        ]);
                    }
                }

                // 2. Update Financial Truth
                $journalEntry->update([
                    'date' => $paymentDate,
                    'reference' => $referenceNo,
                    'description' => $request->memo,
                    'payee_id' => $request->payee,
                    'payee_type' => $request->payeeType == 'customer' ? Customer::class : (\App\Models\Supplier::class),
                    'total_amount' => $totalAmount,
                ]);

                $journalEntry->lines->each->delete();

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

                // Debits (Expenses/Assets) - Products
                foreach ($productItems as $productItem) {
                    $itemModel = \App\Models\Item::find($productItem['product']);
                    $chartOfAccId = $itemModel?->type === 'inventory'
                        ? ($itemModel->inventory_account_id ?? ChartOfAcc::query()->where('sub_type', 'inventory')->first()?->id)
                        : ($itemModel?->expense_account_id ?? ChartOfAcc::query()->where('account_type', 'expense')->first()?->id);

                    if (!$chartOfAccId) {
                        $chartOfAccId = ChartOfAcc::query()->where('account_type', 'expense')->first()?->id;
                    }

                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $chartOfAccId,
                        'debit' => (float)str_replace(',', '', $productItem['amount']),
                        'credit' => 0,
                        'memo' => $productItem['description'] ?? $request->memo,
                    ]);
                }

                // Credit
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $paymentAccount,
                    'debit' => 0,
                    'credit' => $totalAmount,
                    'memo' => $request->memo,
                ]);
            });

            $action = $request->input('action', 'save');
            if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'Payment updated successfully.'); } elseif ($action === 'new') {
                return redirect()->route('payment.create')->with('success', 'Payment updated successfully.');
            }

            return redirect()->route('payment.edit', $journalEntry->id)->with('success', 'Payment updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(Request $request, JournalEntry $journalEntry)
{
    \App\Services\BooksLockService::check($journalEntry->date, $request->input('books_pin'));

    // Must grab this BEFORE the transaction deletes the lines
    $paymentAccountId = $journalEntry->lines()
        ->where('credit', '>', 0)
        ->value('chart_of_acc_id');

    DB::transaction(function () use ($journalEntry) {
        $payment = \App\Models\Accounting\Payment::find($journalEntry->transactionable_id);

        if ($payment) {
            foreach ($payment->items->whereNotNull('item_id') as $oldItem) {
                $itemModel = \App\Models\Item::find($oldItem->item_id);
                if ($itemModel && $itemModel->type === 'inventory') {
                    $itemModel->decrement('quantity_on_hand', $oldItem->quantity);
                }
            }
            $payment->items()->delete();
            $payment->delete();
        }

        $journalEntry->lines()->delete();
        $journalEntry->delete();
    });

    if ($paymentAccountId) {
        return redirect()->route('chart-of-account.history', ['chart_of_account' => $paymentAccountId])
            ->with('success', 'Payment deleted successfully.');
    }

    return redirect()->route('dashboard')
        ->with('success', 'Payment deleted successfully.');
}
}
