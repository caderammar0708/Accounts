<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Accounting\BillReturn;
use App\Models\Accounting\BillReturnItem;
use App\Models\Supplier;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Item;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\Accounting\BillReturnRequest;

class BillReturnController extends Controller
{
    use \App\Traits\AccountingControllerTrait;
    // public function index()
    // {
    //     return Inertia::render('Transaction/SupplierCredit', [
    //         'credits' => BillReturn::with('supplier')
    //             ->latest()
    //             ->get(),

    //         'suppliers' => Supplier::orderBy('display_name')->get(),
    //         'accounts' => ChartOfAcc::orderBy('name')->get(),
    //     ]);
    // }

    public function create(Request $request)
    {
        if ($copyId = $request->query('copy')) {
            $journalEntry = JournalEntry::findOrFail($copyId);
            $invoiceReturn = BillReturn::find($journalEntry->transactionable_id);

            if (!$invoiceReturn) {
                abort(404, 'Bill Return not found');
            }

            $invoiceReturn->load('items');

            $invoiceReturnData = [
                'id' => null,
                'supplier' => $invoiceReturn->supplier_id,
                'date' => $invoiceReturn->date,
                'reference' => (string)$this->getNextNo(),
                'memo' => $invoiceReturn->memo,
                'items' => $invoiceReturn->items->whereNull('item_id')->map(function ($item) {
                    return [
                        'category' => $item->chart_of_acc_id,
                        'description' => $item->description,
                        'amount' => number_format($item->amount, 2, '.', ''),
                    ];
                })->values()->toArray(),
                'itemDetails' => $invoiceReturn->items->whereNotNull('item_id')->map(function ($item) {
                    return [
                        'product' => $item->item_id,
                        'description' => $item->description,
                        'qty' => $item->quantity,
                        'rate' => number_format($item->rate, 2, '.', ''),
                        'amount' => number_format($item->amount, 2, '.', ''),
                    ];
                })->values()->toArray(),
            ];

            return Inertia::render('Transaction/BillReturn/BillReturnForm', [
                'credit' => $invoiceReturnData,
                'ref' => (string)$this->getNextNo(),
            ]);
        }

        return Inertia::render('Transaction/BillReturn/BillReturnForm', [
            'nextRef' => (string)$this->getNextNo()
        ]);
    }

    public function store(BillReturnRequest $request)
    {
        $request->validated();
        $this->checkBooksLock($request->date, $request->books_pin);

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
                    return (float) str_replace(',', '', $item['amount']);
                }) + $productItems->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                });

                // 1. Create Credit Note
                $invoiceReturn = BillReturn::create([
                    'supplier_id' => $request->supplier,
                    'date' => $request->date,
                    'total_amount' => $totalAmount,
                    'memo' => $request->memo,
                    'status' => 'posted',
                ]);

                // Create Credit Note Items (Categories)
                foreach ($categoryItems as $lineItem) {
                    BillReturnItem::create([
                        'bill_return_id' => $invoiceReturn->id,
                        'chart_of_acc_id' => $lineItem['category'],
                        'description' => $lineItem['description'] ?? '',
                        'quantity' => 1,
                        'rate' => (float) str_replace(',', '', $lineItem['amount']),
                        'amount' => (float) str_replace(',', '', $lineItem['amount']),
                    ]);
                }

                // Create Credit Note Items (Products)
                foreach ($productItems as $productItem) {
                    $itemModel = Item::find($productItem['product']);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $qty = (float)str_replace(',', '', $productItem['qty'] ?? 1);
                        $itemModel->decrement('quantity_on_hand', $qty);
                    }

                    $chartOfAccId = $itemModel?->type === 'inventory'
                        ? ($itemModel->inventory_account_id ?? (ChartOfAcc::query()->where('sub_type', 'inventory')->first()?->id ?? ChartOfAcc::getOrCreateDefault('inventory')->id))
                        : ($itemModel?->expense_account_id ?? (ChartOfAcc::query()->where('account_type', 'expense')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-expense')->id));

                    if (!$chartOfAccId) {
                        $chartOfAccId = ChartOfAcc::query()->where('account_type', 'expense')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-expense')->id;
                    }

                    BillReturnItem::create([
                        'bill_return_id' => $invoiceReturn->id,
                        'item_id' => $productItem['product'],
                        'chart_of_acc_id' => $chartOfAccId,
                        'description' => $productItem['description'] ?? '',
                        'quantity' => (float)str_replace(',', '', $productItem['qty'] ?? 1),
                        'rate' => (float)str_replace(',', '', $productItem['rate'] ?? 0),
                        'amount' => (float)str_replace(',', '', $productItem['amount']),
                    ]);
                }

                // 2. Financial Entry
                $journalEntry = JournalEntry::create([
                    'date' => $request->date,
                    'reference' => $request->reference,
                    'description' => $request->memo,
                    'transaction_type' => 'bill_return',
                    'payee_id' => $request->supplier,
                    'payee_type' => Supplier::class,
                    'total_amount' => $totalAmount,
                    'status' => 'posted',
                    'created_by' => Auth::id(),
                    'transactionable_id' => $invoiceReturn->id,
                    'transactionable_type' => BillReturn::class,
                ]);

                // Debit Accounts Payable (Reducing what we owe)
                $apAccount = ChartOfAcc::getOrCreateDefault('accounts-payable');

                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $apAccount->id,
                    'debit' => $totalAmount,
                    'credit' => 0,
                    'memo' => $request->memo,
                ]);

                // Credit Expense/Inventory - Categories
                foreach ($categoryItems as $lineItem) {
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $lineItem['category'],
                        'debit' => 0,
                        'credit' => (float) str_replace(',', '', $lineItem['amount']),
                        'memo' => $lineItem['description'] ?? $request->memo,
                    ]);
                }

                // Credit Expense/Inventory - Products
                foreach ($productItems as $productItem) {
                    $itemModel = Item::find($productItem['product']);
                    $chartOfAccId = $itemModel?->type === 'inventory'
                        ? ($itemModel->inventory_account_id ?? (ChartOfAcc::query()->where('sub_type', 'inventory')->first()?->id ?? ChartOfAcc::getOrCreateDefault('inventory')->id))
                        : ($itemModel?->expense_account_id ?? (ChartOfAcc::query()->where('account_type', 'expense')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-expense')->id));

                    if (!$chartOfAccId) {
                        $chartOfAccId = ChartOfAcc::query()->where('account_type', 'expense')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-expense')->id;
                    }

                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $chartOfAccId,
                        'debit' => 0,
                        'credit' => (float) str_replace(',', '', $productItem['amount']),
                        'memo' => $productItem['description'] ?? $request->memo,
                    ]);
                }

                return $journalEntry;
            });

            $action = $request->input('action', 'save');

            if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'Bill Return saved successfully.'); }

            if ($action === 'new') {
                return redirect()->route('bill-return.create')->with('success', 'Bill Return saved successfully.');
            }

            return redirect()->route('bill-return.edit', $journalEntry->id)->with('success', 'Bill Return saved successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function edit(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $billReturn = BillReturn::find($journalEntry->transactionable_id);

        if (!$billReturn) {
            abort(404, 'Bill Return not found');
        }

        $billReturn->load('items');

        $billReturnData = [
            'id' => $journalEntry->id,
            'supplier' => $billReturn->supplier_id,
            'date' => $billReturn->date,
            'reference' => $journalEntry->reference,
            'memo' => $billReturn->memo,
            'items' => $billReturn->items->whereNull('item_id')->map(function ($item) {
                return [
                    'category' => $item->chart_of_acc_id,
                    'description' => $item->description,
                    'amount' => number_format($item->amount, 2, '.', ''),
                ];
            })->values()->toArray(),
            'itemDetails' => $billReturn->items->whereNotNull('item_id')->map(function ($item) {
                return [
                    'product' => $item->item_id,
                    'description' => $item->description,
                    'qty' => $item->quantity,
                    'rate' => number_format($item->rate, 2, '.', ''),
                    'amount' => number_format($item->amount, 2, '.', ''),
                ];
            })->values()->toArray(),
        ];

        return Inertia::render('Transaction/BillReturn/BillReturnForm', [
            'billReturn' => $billReturnData,
            'nextRef' => $this->getNextNo()
        ]);
    }

    public function update(BillReturnRequest $request, JournalEntry $journalEntry)
    {
        $request->validated();
        $this->checkBooksLock($journalEntry->date, $request->books_pin);
        $this->checkBooksLock($request->date, $request->books_pin);

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
                    return (float) str_replace(',', '', $item['amount']);
                }) + $productItems->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                });

                // 1. Update Credit Note
                $billReturn = BillReturn::find($journalEntry->transactionable_id);
                if (!$billReturn) {
                    throw new \Exception("Bill Return not found");
                }
                $billReturn->update([
                    'supplier_id' => $request->supplier,
                    'date' => $request->date,
                    'total_amount' => $totalAmount,
                    'memo' => $request->memo,
                ]);

                // Re-create items
                foreach ($billReturn->items->whereNotNull('item_id') as $oldItem) {
                    $itemModel = \App\Models\Item::find($oldItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->increment('quantity_on_hand', $oldItem->quantity);
                    }
                }
                $billReturn->items()->delete();

                // Create Credit Note Items (Categories)
                foreach ($categoryItems as $lineItem) {
                    BillReturnItem::create([
                        'bill_return_id' => $billReturn->id,
                        'chart_of_acc_id' => $lineItem['category'],
                        'description' => $lineItem['description'] ?? '',
                        'quantity' => 1,
                        'rate' => (float) str_replace(',', '', $lineItem['amount']),
                        'amount' => (float) str_replace(',', '', $lineItem['amount']),
                    ]);
                }

                // Create Credit Note Items (Products)
                foreach ($productItems as $productItem) {
                    $itemModel = Item::find($productItem['product']);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $qty = (float)str_replace(',', '', $productItem['qty'] ?? 1);
                        $itemModel->decrement('quantity_on_hand', $qty);
                    }

                    $chartOfAccId = $itemModel?->type === 'inventory'
                        ? ($itemModel->inventory_account_id ?? (ChartOfAcc::query()->where('sub_type', 'inventory')->first()?->id ?? ChartOfAcc::getOrCreateDefault('inventory')->id))
                        : ($itemModel?->expense_account_id ?? (ChartOfAcc::query()->where('account_type', 'expense')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-expense')->id));

                    if (!$chartOfAccId) {
                        $chartOfAccId = ChartOfAcc::query()->where('account_type', 'expense')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-expense')->id;
                    }

                    BillReturnItem::create([
                        'bill_return_id' => $billReturn->id,
                        'item_id' => $productItem['product'],
                        'chart_of_acc_id' => $chartOfAccId,
                        'description' => $productItem['description'] ?? '',
                        'quantity' => (float)str_replace(',', '', $productItem['qty'] ?? 1),
                        'rate' => (float)str_replace(',', '', $productItem['rate'] ?? 0),
                        'amount' => (float)str_replace(',', '', $productItem['amount']),
                    ]);
                }

                // 2. Update Financial Entry
                $journalEntry->update([
                    'date' => $request->date,
                    'reference' => $request->reference,
                    'description' => $request->memo,
                    'payee_id' => $request->supplier,
                    'total_amount' => $totalAmount,
                ]);

                $journalEntry->lines->each->delete();

                // Debit Accounts Payable (Reducing what we owe)
                $apAccount = ChartOfAcc::getOrCreateDefault('accounts-payable');

                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $apAccount->id,
                    'debit' => $totalAmount,
                    'credit' => 0,
                    'memo' => $request->memo,
                ]);

                // Credit Expense/Inventory - Categories
                foreach ($categoryItems as $lineItem) {
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $lineItem['category'],
                        'debit' => 0,
                        'credit' => (float) str_replace(',', '', $lineItem['amount']),
                        'memo' => $lineItem['description'] ?? $request->memo,
                    ]);
                }

                // Credit Expense/Inventory - Products
                foreach ($productItems as $productItem) {
                    $itemModel = Item::find($productItem['product']);
                    $chartOfAccId = $itemModel?->type === 'inventory'
                        ? ($itemModel->inventory_account_id ?? (ChartOfAcc::query()->where('sub_type', 'inventory')->first()?->id ?? ChartOfAcc::getOrCreateDefault('inventory')->id))
                        : ($itemModel?->expense_account_id ?? (ChartOfAcc::query()->where('account_type', 'expense')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-expense')->id));

                    if (!$chartOfAccId) {
                        $chartOfAccId = ChartOfAcc::query()->where('account_type', 'expense')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-expense')->id;
                    }

                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $chartOfAccId,
                        'debit' => 0,
                        'credit' => (float) str_replace(',', '', $productItem['amount']),
                        'memo' => $productItem['description'] ?? $request->memo,
                    ]);
                }
            });

            $action = $request->input('action', 'save');

            if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'Bill Return updated successfully.'); }

            if ($action === 'new') {
                return redirect()->route('bill-return.create')->with('success', 'Bill Return updated successfully.');
            }

            return redirect()->route('bill-return.edit', $journalEntry->id)->with('success', 'Bill Return updated successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(JournalEntry $journalEntry)
    {
        $this->checkBooksLock($journalEntry->date, request()->input('books_pin'));
        $chartOfAccountId = $journalEntry->lines->first()?->chart_of_acc_id 
            ?? $journalEntry->lines->first()?->chart_of_account_id 
            ?? $journalEntry->lines->first()?->account_id;

        DB::transaction(function () use ($journalEntry) {
            $billReturn = BillReturn::find($journalEntry->transactionable_id);

            if ($billReturn) {
                foreach ($billReturn->items->whereNotNull('item_id') as $oldItem) {
                    $itemModel = \App\Models\Item::find($oldItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->increment('quantity_on_hand', $oldItem->quantity);
                    }
                }
                $billReturn->items()->delete();
                $billReturn->delete();
            }

            $journalEntry->lines->each->delete();
            $journalEntry->delete();
        });
        if ($chartOfAccountId) {
            return redirect()->route('chart-of-account.history', ['chart_of_account' => $chartOfAccountId])
                ->with('success', 'Bill Return deleted successfully.');
        }

        return redirect()->route('chart-of-account.index')
            ->with('success', 'Bill Return deleted successfully.');
    }

    public function print(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $billReturn = BillReturn::with('items.item', 'items.chartOfAccount', 'supplier', 'company')->findOrFail($journalEntry->transactionable_id);
        $company = $billReturn->company;

        $tableItems = [];
        foreach ($billReturn->items as $item) {
            $desc = "<div class='font-semibold text-gray-800'>" . ($item->item->name ?? $item->chartOfAccount->name ?? 'Item') . "</div>";
            if ($item->description) {
                $desc .= "<div class='text-sm text-gray-500 mt-1'>" . $item->description . "</div>";
            }
            $tableItems[] = [
                $desc,
                $item->quantity,
                ($company->home_currency_prefix ? $company->home_currency_prefix . ' ' : '') . number_format($item->rate, 2),
                ($company->home_currency_prefix ? $company->home_currency_prefix . ' ' : '') . number_format($item->amount, 2),
            ];
        }

        $printSetting = \App\Models\PrintSetting::query()
            ->where('document_type', 'bill_return')
            ->first();

        return view('print.document', [
            'title' => $printSetting?->custom_title ?: 'Bill Return Note',
            'headerAlignment' => $printSetting?->header_alignment ?: 'left',
            'staticFooterContent' => $printSetting?->static_footer_content ?: null,
            'layoutConfig' => $printSetting?->layout_config,
            'primaryColor' => $printSetting?->primary_color,
            'textColor' => $printSetting?->text_color,
            'pageSetup' => $printSetting?->page_setup,
            'blockStyles' => $printSetting?->block_styles,
            'documentNo' => 'BR-' . str_pad($billReturn->id, 4, '0', STR_PAD_LEFT),
            'date' => $billReturn->date,
            'dueDate' => null,
            'partyLabel' => 'Supplier',
            'partyName' => $billReturn->supplier->display_name ?? $billReturn->supplier->company_name,
            'partyAddress' => '',
            'partyEmail' => $billReturn->supplier->email ?? '',
            'tableHeaders' => ['Description', 'Qty', 'Rate', 'Amount'],
            'tableItems' => $tableItems,
            'totalAmount' => $billReturn->total_amount,
            'memo' => $billReturn->memo,
            'statementMessage' => null,
            'company' => $company,
        ]);
    }

    private function getNextNo()
    {
        $last = BillReturn::query()->latest()->first();
        return $last ? (int)filter_var($last->id, FILTER_SANITIZE_NUMBER_INT) + 1 : 1001;
    }
}
