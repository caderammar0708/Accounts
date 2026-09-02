<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Supplier;
use App\Models\BundleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Accounting\BillItem;
use App\Models\Accounting\CreditInvoiceItem;
use App\Models\Accounting\PaymentItem;
use App\Models\Accounting\JournalEntryLine;

class ItemController extends Controller
{
    public function index(Request $request)
    {
                $query = Item::with(['category', 'incomeAccount', 'expenseAccount', 'inventoryAccount', 'preferredSupplier', 'bundleComponents.item'])
            ;

        // Calculate counts before pagination
        $lowStockCount = (clone $query)->where('items.track_inventory', true)
            ->whereNotNull('items.reorder_point')
            ->whereRaw('items.quantity_on_hand <= items.reorder_point')
            ->where('items.quantity_on_hand', '>', 0)
            ->count();
            
        $outOfStockCount = (clone $query)->where('items.track_inventory', true)
            ->where('items.quantity_on_hand', '<=', 0)
            ->count();

        if ($request->filled('search')) {
            $query->where('items.name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('items.type', $request->type);
        }

        if ($request->filled('stock_status')) {
            if ($request->stock_status === 'low') {
                $query->where('items.track_inventory', true)
                    ->whereNotNull('items.reorder_point')
                    ->whereRaw('items.quantity_on_hand <= items.reorder_point')
                    ->where('items.quantity_on_hand', '>', 0);
            } else if ($request->stock_status === 'out') {
                $query->where('items.track_inventory', true)
                    ->where('items.quantity_on_hand', '<=', 0);
            }
        }

        // To group by category, we order by category sort_order and name then item sort_order and name
        $query->leftJoin('item_categories', 'items.item_category_id', '=', 'item_categories.id')
            ->orderBy('item_categories.sort_order', 'asc')
            ->orderBy('item_categories.name', 'asc')
            ->orderBy('items.sort_order', 'asc')
            ->orderBy('items.name', 'asc')
            ->select('items.*');

        $items = $query->paginate(20)->withQueryString();

        return Inertia::render('Inventory/ItemList', [
            'items' => $items,
            'filters' => request()->all('search', 'type', 'stock_status'),
            'counts' => [
                'low_stock' => $lowStockCount,
                'out_of_stock' => $outOfStockCount,
            ]
        ]);
    }

    private function getCommonItemProps()
    {
        return [
            'categories' => ItemCategory::all(),
            'incomeAccounts' => ChartOfAcc::whereIn('account_type', ['income', 'other_income'])->get(),
            'expenseAccounts' => ChartOfAcc::whereIn('account_type', ['expense', 'cost_of_goods_sold'])->get(),
            'inventoryAccounts' => ChartOfAcc::whereIn('account_type', ['asset', 'other_current_asset', 'fixed_asset', 'current_asset', 'inventory'])->get(),
            'suppliers' => Supplier::all(),
            'allItems' => Item::all(),
            'locations' => \App\Models\Location::all(),
        ];
    }

    private function getNextSku()
    {
        $lastItem = Item::orderBy('id', 'desc')->first();
        if (!$lastItem) return '1';
        
        $num = (int) preg_replace('/[^0-9]/', '', $lastItem->sku ?? $lastItem->id);
        return (string)($num + 1);
    }

    public function create()
    {
        $props = $this->getCommonItemProps();
        $props['nextSku'] = $this->getNextSku();
        return Inertia::render('Inventory/ItemForm', $props);
    }

    private function sanitizePrices(Request $request)
    {
        if ($request->has('sale_price')) {
            $request->merge([
                'sale_price' => str_replace(',', '', $request->input('sale_price'))
            ]);
        }
        if ($request->has('purchase_price')) {
            $request->merge([
                'purchase_price' => str_replace(',', '', $request->input('purchase_price'))
            ]);
        }
        if ($request->has('quantity_on_hand')) {
            $request->merge([
                'quantity_on_hand' => str_replace(',', '', $request->input('quantity_on_hand'))
            ]);
        }
        if ($request->has('reorder_point')) {
            $request->merge([
                'reorder_point' => str_replace(',', '', $request->input('reorder_point'))
            ]);
        }
    }

    public function store(Request $request)
    {
        $this->sanitizePrices($request);

        $validated = $request->validate([
            'type' => 'required|string|in:service,inventory,non-inventory,bundle',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'image' => 'nullable',
            'description' => 'nullable|string',
            'sale_price' => 'nullable|numeric|min:0',
            'item_category_id' => 'nullable|exists:item_categories,id',
            'income_account_id' => 'nullable|exists:chart_of_accs,id',
            'purchase_price' => 'nullable|numeric|min:0',
            'purchase_description' => 'nullable|string',
            'expense_account_id' => 'nullable|exists:chart_of_accs,id',
            'preferred_supplier_id' => 'nullable|exists:suppliers,id',
            'track_inventory' => 'nullable|boolean',
            'quantity_on_hand' => 'nullable|numeric',
            'as_of_date' => 'nullable|date',
            'reorder_point' => 'nullable|numeric|min:0',
            'inventory_account_id' => 'nullable|exists:chart_of_accs,id',
            'is_sold' => 'nullable|boolean',
            'is_purchased' => 'nullable|boolean',
            'bundle_items' => 'nullable|array',
            'bundle_items.*.item_id' => 'required_with:bundle_items|exists:items,id',
            'bundle_items.*.quantity' => 'required_with:bundle_items|numeric|min:0.01',
            'location_id' => 'nullable|exists:locations,id',
        ]);

                        $validated['track_inventory'] = ($request->input('type') === 'inventory');

        if ($request->hasFile('image')) {
            $companyId = request()->user()->currentCompany()->id;
            $path = $request->file('image')->store($companyId . '/products', 'public');
            $validated['image'] = Storage::url($path);
        } else {
            $validated['image'] = $request->input('image');
        }

        // Default toggles based on type if not explicitly set
        if ($validated['type'] === 'inventory') {
            $validated['is_sold'] = true;
            $validated['is_purchased'] = true;
        } else {
            $validated['is_sold'] = $request->boolean('is_sold', true);
            $validated['is_purchased'] = $request->boolean('is_purchased', false);
        }

        $item = new Item($validated);
        if ($request->has('quantity_on_hand')) {
            $item->quantity_on_hand = str_replace(',', '', $request->input('quantity_on_hand'));
        }
        $item->save();

        if ($request->has('quantity_on_hand')) {
            $this->syncOpeningBalance($item, $item->quantity_on_hand, $request->input('as_of_date'));
        }

        if ($validated['type'] === 'bundle') {
            $bundleItems = $request->input('bundle_items', []);
            foreach ($bundleItems as $bi) {
                BundleItem::create([
                    'bundle_id' => $item->id,
                    'item_id' => $bi['item_id'],
                    'quantity' => $bi['quantity'],
                ]);
            }
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'item' => $item->load(['category', 'incomeAccount', 'expenseAccount', 'inventoryAccount', 'preferredSupplier', 'bundleComponents.item']),
            ]);
        }

        $redirectUrl = $request->query('redirect_to', route('items.index'));
        return redirect()->to($redirectUrl)->with('success', 'Item created successfully');
    }

    public function edit(Item $item)
    {
        $item->load('bundleComponents.item');
        $props = $this->getCommonItemProps();
        $props['item'] = $item;

        return Inertia::render('Inventory/ItemForm', $props);
    }

    public function update(Request $request, Item $item)
    {
        $this->sanitizePrices($request);

        $validated = $request->validate([
            'type' => 'required|string|in:service,inventory,non-inventory,bundle',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'image' => 'nullable',
            'description' => 'nullable|string',
            'sale_price' => 'nullable|numeric|min:0',
            'item_category_id' => 'nullable|exists:item_categories,id',
            'income_account_id' => 'nullable|exists:chart_of_accs,id',
            'purchase_price' => 'nullable|numeric|min:0',
            'purchase_description' => 'nullable|string',
            'expense_account_id' => 'nullable|exists:chart_of_accs,id',
            'preferred_supplier_id' => 'nullable|exists:suppliers,id',
            'track_inventory' => 'nullable|boolean',
            'quantity_on_hand' => 'nullable|numeric',
            'as_of_date' => 'nullable|date',
            'reorder_point' => 'nullable|numeric|min:0',
            'inventory_account_id' => 'nullable|exists:chart_of_accs,id',
            'is_sold' => 'nullable|boolean',
            'is_purchased' => 'nullable|boolean',
            'bundle_items' => 'nullable|array',
            'bundle_items.*.item_id' => 'required_with:bundle_items|exists:items,id',
            'bundle_items.*.quantity' => 'required_with:bundle_items|numeric|min:0.01',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        $validated['track_inventory'] = ($request->input('type') === 'inventory');

        if ($request->hasFile('image')) {
            if ($item->image && str_starts_with($item->image, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $item->image);
                Storage::disk('public')->delete($oldPath);
            }
            $companyId = request()->user()->currentCompany()->id;
            $path = $request->file('image')->store($companyId . '/products', 'public');
            $validated['image'] = Storage::url($path);
        } else {
            if ($request->input('image') === null || $request->input('image') === '') {
                if ($item->image && str_starts_with($item->image, '/storage/')) {
                    $oldPath = str_replace('/storage/', '', $item->image);
                    Storage::disk('public')->delete($oldPath);
                }
                $validated['image'] = null;
            } else {
                $validated['image'] = $request->input('image');
            }
        }

        if ($validated['type'] === 'inventory') {
            $validated['is_sold'] = true;
            $validated['is_purchased'] = true;
        } else {
            $validated['is_sold'] = $request->boolean('is_sold', true);
            $validated['is_purchased'] = $request->boolean('is_purchased', false);
        }

        $oldIncomeAccount = $item->income_account_id;
        $oldExpenseAccount = $item->expense_account_id;
        $oldInventoryAccount = $item->inventory_account_id;

        DB::transaction(function () use ($item, $validated, $request, $oldIncomeAccount, $oldExpenseAccount, $oldInventoryAccount) {
            $item->fill($validated);
            if ($request->has('quantity_on_hand')) {
                $item->quantity_on_hand = str_replace(',', '', $request->input('quantity_on_hand'));
            }
            $item->save();
            
            if ($request->has('quantity_on_hand')) {
                $this->syncOpeningBalance($item, $item->quantity_on_hand, $request->input('as_of_date'));
            }

            if ($validated['type'] === 'bundle') {
                $item->bundleComponents()->delete();
                $bundleItems = $request->input('bundle_items', []);
                foreach ($bundleItems as $bi) {
                    BundleItem::create([
                        'bundle_id' => $item->id,
                        'item_id' => $bi['item_id'],
                        'quantity' => $bi['quantity'],
                    ]);
                }
            } else {
                $item->bundleComponents()->delete();
            }

            if ($request->boolean('update_historical')) {
                // Update Bills and Expenses (direct chart_of_acc_id on items)
                if ($oldExpenseAccount && $oldExpenseAccount !== $item->expense_account_id) {
                    // Update BillItems and their JournalEntryLines
                    $billItems = BillItem::where('item_id', $item->id)->where('chart_of_acc_id', $oldExpenseAccount)->get();
                    foreach ($billItems as $bi) {
                        $bi->update(['chart_of_acc_id' => $item->expense_account_id]);
                        // Bill creates JournalEntry where transactionable is the Bill. We find the JournalEntryLine with old account
                        $je = $bi->bill?->journalEntry;
                        if ($je) {
                            JournalEntryLine::where('journal_entry_id', $je->id)
                                ->where('chart_of_acc_id', $oldExpenseAccount)
                                ->update(['chart_of_acc_id' => $item->expense_account_id]);
                        }
                    }

                    // Update ExpenseItems and their JournalEntryLines
                    $expenseItems = PaymentItem::where('item_id', $item->id)->where('chart_of_acc_id', $oldExpenseAccount)->get();
                    foreach ($expenseItems as $ei) {
                        $ei->update(['chart_of_acc_id' => $item->expense_account_id]);
                        $je = $ei->expense?->journalEntry;
                        if ($je) {
                            JournalEntryLine::where('journal_entry_id', $je->id)
                                ->where('chart_of_acc_id', $oldExpenseAccount)
                                ->update(['chart_of_acc_id' => $item->expense_account_id]);
                        }
                    }
                }

                // Update Invoices (they don't store chart_of_acc_id directly on credit_invoice_items, they rely on item accounts)
                if (($oldIncomeAccount && $oldIncomeAccount !== $item->income_account_id) || 
                    ($oldExpenseAccount && $oldExpenseAccount !== $item->expense_account_id) ||
                    ($oldInventoryAccount && $oldInventoryAccount !== $item->inventory_account_id)) {
                    
                    $invoiceItems = CreditInvoiceItem::where('item_id', $item->id)->get();
                    foreach ($invoiceItems as $ii) {
                        $je = $ii->invoice?->journalEntry;
                        if ($je) {
                            if ($oldIncomeAccount && $oldIncomeAccount !== $item->income_account_id) {
                                JournalEntryLine::where('journal_entry_id', $je->id)
                                    ->where('chart_of_acc_id', $oldIncomeAccount)
                                    ->update(['chart_of_acc_id' => $item->income_account_id]);
                            }
                            if ($item->type === 'inventory') {
                                if ($oldExpenseAccount && $oldExpenseAccount !== $item->expense_account_id) {
                                    JournalEntryLine::where('journal_entry_id', $je->id)
                                        ->where('chart_of_acc_id', $oldExpenseAccount)
                                        ->update(['chart_of_acc_id' => $item->expense_account_id]);
                                }
                                if ($oldInventoryAccount && $oldInventoryAccount !== $item->inventory_account_id) {
                                    JournalEntryLine::where('journal_entry_id', $je->id)
                                        ->where('chart_of_acc_id', $oldInventoryAccount)
                                        ->update(['chart_of_acc_id' => $item->inventory_account_id]);
                                }
                            }
                        }
                    }
                }
            }
        });

        $redirectUrl = $request->query('redirect_to', route('items.index'));
        return redirect()->to($redirectUrl)->with('success', 'Item updated successfully');
    }

    public function printBarcode(Request $request, Item $item)
    {
        $count = $request->query('count', 10);
        return Inertia::render('Inventory/PrintBarcodes', [
            'item' => $item,
            'count' => (int) $count,
        ]);
    }

    public function destroy(Request $request, Item $item)
    {
        $item->delete();
        $redirectUrl = $request->query('redirect_to', route('items.index'));
        return redirect()->to($redirectUrl)->with('success', 'Item deleted successfully');
    }

    private function syncOpeningBalance(Item $item, $quantity, $asOfDate)
    {
        if ($item->type !== 'inventory') {
            return;
        }

        $qty = (float) $quantity;
        if ($qty <= 0) {
            $existing = \App\Models\Accounting\InventoryQuantityAdjustment::where('adjustment_reason', 'Opening Balance')
                ->whereHas('items', function ($q) use ($item) {
                    $q->where('item_id', $item->id);
                })->first();
                
            if ($existing) {
                \App\Models\Accounting\JournalEntry::where('transactionable_type', \App\Models\Accounting\InventoryQuantityAdjustment::class)
                    ->where('transactionable_id', $existing->id)
                    ->delete();
                $existing->delete();
            }
            return;
        }

        $openingBalanceEquity = \App\Models\Accounting\ChartOfAcc::getOrCreateDefault('opening-balance-equity');
        
        $adjustment = \App\Models\Accounting\InventoryQuantityAdjustment::where('adjustment_reason', 'Opening Balance')
            ->whereHas('items', function ($q) use ($item) {
                $q->where('item_id', $item->id);
            })->first();

        $cost = (float) $item->purchase_price;
        $totalAmount = $qty * $cost;
        $adjDate = $asOfDate ? \Carbon\Carbon::parse($asOfDate) : \Carbon\Carbon::today();

        if (!$adjustment) {
            $adjustment = \App\Models\Accounting\InventoryQuantityAdjustment::create([
                'adjustment_date' => $adjDate->format('Y-m-d'),
                'reference_number' => 'OB-' . ($item->sku ?: substr($item->id, 0, 8)),
                'adjustment_reason' => 'Opening Balance',
                'inventory_adjustment_account_id' => $openingBalanceEquity->id,
                'memo' => 'Opening balance for ' . $item->name,
            ]);

            $adjustment->items()->create([
                'item_id' => $item->id,
                'qty_on_hand' => 0,
                'new_qty' => $qty,
                'change_in_qty' => $qty,
            ]);
            
            $this->createOpeningBalanceJournal($adjustment, $item, $totalAmount, $openingBalanceEquity->id);
        } else {
            $adjustment->update([
                'adjustment_date' => $adjDate->format('Y-m-d'),
            ]);
            
            $adjItem = $adjustment->items()->where('item_id', $item->id)->first();
            if ($adjItem) {
                $adjItem->update([
                    'new_qty' => $qty,
                    'change_in_qty' => $qty,
                ]);
            }

            $je = \App\Models\Accounting\JournalEntry::where('transactionable_type', \App\Models\Accounting\InventoryQuantityAdjustment::class)
                ->where('transactionable_id', $adjustment->id)->first();
                
            if ($je) {
                $je->update([
                    'date' => $adjDate->format('Y-m-d'),
                    'total_amount' => $totalAmount,
                ]);
                
                $je->lines()->delete(); 
                $this->createJournalLines($je, $item, $totalAmount, $openingBalanceEquity->id);
            } else {
                $this->createOpeningBalanceJournal($adjustment, $item, $totalAmount, $openingBalanceEquity->id);
            }
        }
    }
    
    private function createOpeningBalanceJournal($adjustment, $item, $totalAmount, $equityAccountId)
    {
        if ($totalAmount <= 0) return;
        
        $je = \App\Models\Accounting\JournalEntry::create([
            'date' => $adjustment->adjustment_date,
            'reference' => $adjustment->reference_number,
            'description' => $adjustment->memo,
            'transaction_type' => 'inventory_adjustment',
            'total_amount' => $totalAmount,
            'status' => 'posted',
            'created_by' => \Illuminate\Support\Facades\Auth::id(),
            'transactionable_id' => $adjustment->id,
            'transactionable_type' => \App\Models\Accounting\InventoryQuantityAdjustment::class,
        ]);
        
        $this->createJournalLines($je, $item, $totalAmount, $equityAccountId);
    }
    
    private function createJournalLines($je, $item, $totalAmount, $equityAccountId)
    {
        if ($totalAmount <= 0) return;
        
        $inventoryAccountId = $item->inventory_account_id ?? 
            (\App\Models\Accounting\ChartOfAcc::where('sub_type', 'inventory')->first()?->id ?? 
             \App\Models\Accounting\ChartOfAcc::getOrCreateDefault('inventory')->id);
             
        $memo = 'Opening balance for ' . $item->name;
        
        $je->lines()->create([
            'chart_of_acc_id' => $inventoryAccountId,
            'debit' => $totalAmount,
            'credit' => 0,
            'memo' => $memo,
        ]);
        
        $je->lines()->create([
            'chart_of_acc_id' => $equityAccountId,
            'debit' => 0,
            'credit' => $totalAmount,
            'memo' => $memo,
        ]);
    }
}
