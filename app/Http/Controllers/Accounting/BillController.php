<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Supplier;
use App\Models\Accounting\Bill;
use App\Models\Accounting\BillItem;
use App\Http\Requests\Accounting\BillRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Traits\AccountingControllerTrait;

class BillController extends Controller
{
    use AccountingControllerTrait;

    public function create(Request $request)
    {
        // Generate next Bill Number
        $lastRef = JournalEntry::query()
            ->where('transaction_type', 'bill')
            ->orderByRaw('CAST(reference AS UNSIGNED) DESC')
            ->value('reference');

        $nextBillNo = is_numeric($lastRef) ? (int)$lastRef + 1 : 1001;
        $nextBillNoLabel = (string)str_pad($nextBillNo, 4, '0', STR_PAD_LEFT);

        if ($copyId = $request->query('copy')) {
            $journalEntry = JournalEntry::findOrFail($copyId);
            $journalEntry->load('lines');
            $bill = \App\Models\Accounting\Bill::find($journalEntry->transactionable_id);

            $billData = [
                'id' => null,
                'supplier' => $bill?->supplier_id ?? $journalEntry->payee_id,
                'mailingAddress' => '',
                'terms' => $bill?->terms ?? 'Net 30',
                'billDate' => $journalEntry->date,
                'dueDate' => $bill?->due_date ?? $journalEntry->due_date,
                'billNo' => $nextBillNoLabel,
                'memo' => $journalEntry->description,
                'items' => $bill ? $bill->items->whereNull('item_id')->map(function ($item) {
                    return [
                        'category' => $item->chart_of_acc_id,
                        'description' => $item->description,
                        'amount' => $item->amount,
                    ];
                })->values()->toArray() : [],
                'itemDetails' => $bill ? $bill->items->whereNotNull('item_id')->map(function ($item) {
                    return [
                        'product' => $item->item_id,
                        'description' => $item->description,
                        'qty' => $item->quantity ?? 1,
                        'rate' => $item->rate ?? $item->amount,
                        'amount' => $item->amount,
                    ];
                })->values()->toArray() : [],
            ];

            return Inertia::render('Transaction/Bill/BillForm', [
                'bill' => $billData,
                'nextBillNo' => $nextBillNoLabel,
            ]);
        }

        return Inertia::render('Transaction/Bill/BillForm', [
            'nextBillNo' => $nextBillNoLabel
        ]);
    }

    public function store(BillRequest $request)
    {
        $request->validated();

        try {
            $journalEntry = DB::transaction(function() use ($request) {
                
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
                    return (float)str_replace(',', '', $item['amount']);
                }) + $productItems->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                });

                if ($totalAmount > 9999999999999.99) {
                    throw new \Exception('Total amount is too large. Please enter a smaller value.');
                }

                // 1. Create the Bill
                $bill = Bill::create([
                    'supplier_id' => $request->supplier,
                    'bill_date' => $request->billDate,
                    'due_date' => $request->dueDate,
                    'bill_no' => $request->billNo,
                    'total_amount' => $totalAmount,
                    'memo' => $request->memo,
                    'status' => 'posted',
                ]);

                // 2. Create Bill Items (Categories)
                foreach ($categoryItems as $lineItem) {
                    $amount = (float)str_replace(',', '', $lineItem['amount']);
                    BillItem::create([
                        'bill_id' => $bill->id,
                        'chart_of_acc_id' => $lineItem['category'],
                        'description' => $lineItem['description'] ?? '',
                        'amount' => $amount,
                        'quantity' => 1,
                        'rate' => $amount,
                    ]);
                }

                // Create Bill Items (Products)
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

                    BillItem::create([
                        'bill_id' => $bill->id,
                        'item_id' => $productItem['product'],
                        'chart_of_acc_id' => $chartOfAccId,
                        'description' => $productItem['description'] ?? '',
                        'quantity' => (float)str_replace(',', '', $productItem['qty'] ?? 1),
                        'rate' => (float)str_replace(',', '', $productItem['rate'] ?? 0),
                        'amount' => (float)str_replace(',', '', $productItem['amount']),
                    ]);
                }

                // 3. Create the Journal Entry
                $journalEntry = JournalEntry::create([
                    'date' => $request->billDate,
                    'reference' => $request->billNo,
                    'description' => $request->memo,
                    'transaction_type' => 'bill',
                    'payee_id' => $request->supplier,
                    'payee_type' => Supplier::class,
                    'total_amount' => $totalAmount,
                    'status' => 'posted',
                    'created_by' => Auth::id(),
                    'transactionable_id' => $bill->id,
                    'transactionable_type' => Bill::class,
                ]);

                // Debits (Expenses/Assets) - Categories
                foreach ($categoryItems as $lineItem) {
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $lineItem['category'],
                        'debit' => (float)str_replace(',', '', $lineItem['amount']),
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

                // Credit (Accounts Payable)
                $apAccount = ChartOfAcc::getOrCreateDefault('accounts-payable');

                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $apAccount->id,
                    'debit' => 0,
                    'credit' => $totalAmount,
                    'memo' => $request->memo,
                ]);

                return $journalEntry;
            });

            return $this->handleActionRedirect($request, 'bill', $journalEntry->id, 'Bill saved successfully.');


        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == '22003') {
                return redirect()->back()->withErrors(['error' => 'Total amount is too large. Please enter a smaller value.']);
            }
            return redirect()->back()->withErrors(['error' => 'A database error occurred.']);
        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function edit(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $bill = \App\Models\Accounting\Bill::find($journalEntry->transactionable_id);

        $billData = [
            'id' => $journalEntry->id,
            'supplier' => $bill?->supplier_id ?? $journalEntry->payee_id,
            'mailingAddress' => '',
            'terms' => $bill?->terms ?? 'Net 30',
            'billDate' => $journalEntry->date,
            'dueDate' => $bill?->due_date ?? $journalEntry->due_date,
            'billNo' => $journalEntry->reference,
            'memo' => $journalEntry->description,
            'items' => $bill ? $bill->items->whereNull('item_id')->map(function ($item) {
                return [
                    'category' => $item->chart_of_acc_id,
                    'description' => $item->description,
                    'amount' => $item->amount,
                ];
            })->values()->toArray() : [],
            'itemDetails' => $bill ? $bill->items->whereNotNull('item_id')->map(function ($item) {
                return [
                    'product' => $item->item_id,
                    'description' => $item->description,
                    'qty' => $item->quantity ?? 1,
                    'rate' => $item->rate ?? $item->amount,
                    'amount' => $item->amount,
                ];
            })->values()->toArray() : [],
        ];

        return Inertia::render('Transaction/Bill/BillForm', [
            'bill' => $billData
        ]);
    }

    public function update(BillRequest $request, JournalEntry $journalEntry)
    {
        $request->validated();

        try {
            DB::transaction(function() use ($request, $journalEntry) {
                
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
                    return (float)str_replace(',', '', $item['amount']);
                }) + $productItems->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                });

                if ($totalAmount > 9999999999999.99) {
                    throw new \Exception('Total amount is too large. Please enter a smaller value.');
                }

                // 1. Update the Bill
                $bill = Bill::find($journalEntry->transactionable_id);
                if ($bill) {
                    $bill->update([
                        'supplier_id' => $request->supplier,
                        'bill_date' => $request->billDate,
                        'due_date' => $request->dueDate,
                        'bill_no' => $request->billNo,
                        'total_amount' => $totalAmount,
                        'memo' => $request->memo,
                    ]);

                    foreach ($bill->items->whereNotNull('item_id') as $oldItem) {
                        $itemModel = \App\Models\Item::find($oldItem->item_id);
                        if ($itemModel && $itemModel->type === 'inventory') {
                            $itemModel->decrement('quantity_on_hand', $oldItem->quantity);
                        }
                    }
                    $bill->items()->delete();

                    // Categories
                    foreach ($categoryItems as $lineItem) {
                        $amount = (float)str_replace(',', '', $lineItem['amount']);
                        BillItem::create([
                            'bill_id' => $bill->id,
                            'chart_of_acc_id' => $lineItem['category'],
                            'description' => $lineItem['description'] ?? '',
                            'amount' => $amount,
                            'quantity' => 1,
                            'rate' => $amount,
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

                        BillItem::create([
                            'bill_id' => $bill->id,
                            'item_id' => $productItem['product'],
                            'chart_of_acc_id' => $chartOfAccId,
                            'description' => $productItem['description'] ?? '',
                            'quantity' => (float)str_replace(',', '', $productItem['qty'] ?? 1),
                            'rate' => (float)str_replace(',', '', $productItem['rate'] ?? 0),
                            'amount' => (float)str_replace(',', '', $productItem['amount']),
                        ]);
                    }
                }

                // 2. Update the Journal Entry
                $journalEntry->update([
                    'date' => $request->billDate,
                    'reference' => $request->billNo,
                    'description' => $request->memo,
                    'payee_id' => $request->supplier,
                    'total_amount' => $totalAmount,
                ]);

                $journalEntry->lines->each->delete();

                // Debits (Expenses/Assets) - Categories
                foreach ($categoryItems as $lineItem) {
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $lineItem['category'],
                        'debit' => (float)str_replace(',', '', $lineItem['amount']),
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

                // Credit (Accounts Payable)
                $apAccount = ChartOfAcc::getOrCreateDefault('accounts-payable');

                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $apAccount->id,
                    'debit' => 0,
                    'credit' => $totalAmount,
                    'memo' => $request->memo,
                ]);
            });

            return $this->handleActionRedirect($request, 'bill', $journalEntry->id, 'Bill updated successfully.');
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == '22003') {
                return redirect()->back()->withErrors(['error' => 'Total amount is too large. Please enter a smaller value.']);
            }
            return redirect()->back()->withErrors(['error' => 'A database error occurred.']);
        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }   
    }

    public function destroy(JournalEntry $journalEntry)
    {
        $chartOfAccountId = $journalEntry->lines->first()?->chart_of_acc_id 
            ?? $journalEntry->lines->first()?->chart_of_account_id 
            ?? $journalEntry->lines->first()?->account_id;

        DB::transaction(function () use ($journalEntry) {
            $bill = Bill::find($journalEntry->transactionable_id);

            if ($bill) {
                foreach ($bill->items->whereNotNull('item_id') as $oldItem) {
                    $itemModel = \App\Models\Item::find($oldItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->decrement('quantity_on_hand', $oldItem->quantity);
                    }
                }
                $bill->items()->delete();
                $bill->delete();
            }

            $journalEntry->lines->each->delete();
            $journalEntry->delete();
        });

        if ($chartOfAccountId) {
            return redirect()->route('chart-of-account.history', ['chart_of_account' => $chartOfAccountId])
                ->with('success', 'Bill deleted successfully.');
        }

        return redirect()->route('chart-of-account.index')
            ->with('success', 'Bill deleted successfully.');
    }

    public function print(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $bill = Bill::with('items.item', 'items.chartOfAccount', 'supplier', 'company')->findOrFail($journalEntry->transactionable_id);
        $company = $bill->company ?? \App\Models\Company::current();

        $tableItems = [];
        foreach ($bill->items as $item) {
            $desc = "<div class='font-semibold text-gray-800'>" . ($item->item->name ?? $item->chartOfAccount->name ?? 'Item') . "</div>";
            if ($item->description) {
                $desc .= "<div class='text-sm text-gray-500 mt-1'>" . $item->description . "</div>";
            }
            $tableItems[] = [
                $desc,
                $item->quantity + 0,
                ($company?->home_currency_prefix ? $company?->home_currency_prefix . ' ' : '') . number_format($item->rate, 2),
                ($company?->home_currency_prefix ? $company?->home_currency_prefix . ' ' : '') . number_format($item->amount, 2),
            ];
        }

        $printSetting = \App\Models\PrintSetting::getForPrint('bill');

        return view('print.document', [
            'printSetting' => $printSetting,
            'title' => $printSetting?->custom_title ?: 'Purchase Bill',
            'headerAlignment' => $printSetting?->header_alignment ?: 'left',
            'staticFooterContent' => $printSetting?->static_footer_content ?: null,
            'layoutConfig' => $printSetting?->layout_config,
            'primaryColor' => $printSetting?->primary_color,
            'textColor' => $printSetting?->text_color,
            'pageSetup' => $printSetting?->page_setup,
            'blockStyles' => $printSetting?->block_styles,
            'documentNo' => $bill->bill_no,
            'date' => $bill->bill_date,
            'dueDate' => $bill->due_date,
            'partyLabel' => 'Billed From',
            'partyName' => $bill->supplier->display_name ?? $bill->supplier->company_name,
            'partyAddress' => '',
            'partyEmail' => $bill->supplier->email ?? '',
            'tableHeaders' => ['Description', 'Qty', 'Rate', 'Amount'],
            'tableItems' => $tableItems,
            'totalAmount' => $bill->total_amount,
            'memo' => $bill->memo,
            'statementMessage' => null,
            'company' => $company,
        ]);
    }
}

