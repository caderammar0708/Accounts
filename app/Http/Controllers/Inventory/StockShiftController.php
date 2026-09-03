<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Inventory\StockShift;
use App\Models\Inventory\StockShiftItem;
use App\Models\Inventory\StockShiftCollection;
use App\Models\Inventory\StockShiftCreditSale;
use App\Models\HR\Employee;
use App\Models\Location;
use App\Models\Item;
use App\Models\Customer;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Accounting\CreditInvoice;
use App\Models\Accounting\CreditInvoiceItem;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class StockShiftController extends Controller
{
    public function index(Request $request)
    {
        $activeQuery = StockShift::with(['employee', 'location', 'shiftItems.item'])
            ->where('status', 'open');
            
        $pendingQuery = StockShift::with(['employee', 'location', 'shiftItems.item'])
            ->where('status', 'pending_collection');
            
        $closedQuery = StockShift::with(['employee', 'location', 'shiftItems.item'])
            ->where('status', 'closed');

        if ($request->location_id) {
            $activeQuery->where('location_id', $request->location_id);
            $pendingQuery->where('location_id', $request->location_id);
            $closedQuery->where('location_id', $request->location_id);
        }

        if ($request->start_date) {
            $activeQuery->whereDate('start_time', '>=', $request->start_date);
            $pendingQuery->whereDate('start_time', '>=', $request->start_date);
            $closedQuery->whereDate('end_time', '>=', $request->start_date);
        }
        
        if ($request->end_date) {
            $activeQuery->whereDate('start_time', '<=', $request->end_date);
            $pendingQuery->whereDate('start_time', '<=', $request->end_date);
            $closedQuery->whereDate('end_time', '<=', $request->end_date);
        }
            
        $activeShifts = $activeQuery->latest('start_time')->get();
        $pendingShifts = $pendingQuery->latest('start_time')->get();
        $closedShifts = $closedQuery->latest('end_time')->limit(50)->get();
        $locations = Location::where('is_active', true)->get();
            
        return Inertia::render('StockShifts/Index', [
            'activeShifts' => $activeShifts,
            'pendingShifts' => $pendingShifts,
            'closedShifts' => $closedShifts,
            'locations' => $locations,
            'filters' => $request->only(['start_date', 'end_date', 'location_id'])
        ]);
    }

    public function create()
    {
        $locations = Location::where('is_active', true)->get();
        $employees = Employee::withoutGlobalScope(\App\Scopes\LocationScope::class)->get();
        $items = Item::withoutGlobalScope(\App\Scopes\LocationScope::class)
            ->select('id', 'name', 'sku', 'sale_price', 'purchase_price', 'quantity_on_hand', 'type', 'location_id')
            ->get();

        $lastShift = StockShift::latest('end_time')->first();
        $lastEndTime = $lastShift ? ($lastShift->end_time ?? $lastShift->start_time) : now();

        return Inertia::render('StockShifts/Create', [
            'locations' => $locations,
            'employees' => $employees,
            'items' => $items,
            'lastEndTime' => $lastEndTime,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'location_id' => 'required|exists:locations,id',
            'employee_id' => 'required|exists:employees,id',
            'start_time' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.issued_qty' => 'required|numeric|min:0.001'
        ]);

        DB::transaction(function() use ($request) {
            $shift = StockShift::create([
                'location_id' => $request->location_id,
                'employee_id' => $request->employee_id,
                'start_time' => $request->start_time ?? now(),
                'status' => 'open',
                'notes' => $request->notes
            ]);

            foreach ($request->items as $itemData) {
                $itemModel = Item::withoutGlobalScope(\App\Scopes\LocationScope::class)->find($itemData['item_id']);
                $price = $itemModel ? (float) $itemModel->sale_price : 0;
                $issuedQty = (float) $itemData['issued_qty'];

                StockShiftItem::create([
                    'stock_shift_id' => $shift->id,
                    'item_id' => $itemData['item_id'],
                    'issued_qty' => $issuedQty,
                    'unit_price' => $price,
                ]);

                // Deduct issued quantity immediately from stock
                if ($itemModel && $itemModel->type === 'inventory') {
                    $itemModel->decrement('quantity_on_hand', $issuedQty);
                }
            }
        });

        return redirect()->route('stock-shifts.index')->with('success', 'Stock shift started successfully.');
    }

    public function editActive(StockShift $stockShift)
    {
        $stockShift->load(['shiftItems.item', 'employee', 'location']);
        $locations = Location::where('is_active', true)->get();
        $employees = Employee::withoutGlobalScope(\App\Scopes\LocationScope::class)->get();
        $items = Item::withoutGlobalScope(\App\Scopes\LocationScope::class)
            ->select('id', 'name', 'sku', 'sale_price', 'purchase_price', 'quantity_on_hand', 'type', 'location_id')
            ->get();

        return Inertia::render('StockShifts/Create', [
            'shift' => $stockShift,
            'locations' => $locations,
            'employees' => $employees,
            'items' => $items
        ]);
    }

    public function updateActive(Request $request, StockShift $stockShift)
    {
        if ($stockShift->status !== 'open') {
            return redirect()->route('stock-shifts.index')->with('error', 'Only active shifts can be edited.');
        }

        $request->validate([
            'location_id' => 'required|exists:locations,id',
            'employee_id' => 'required|exists:employees,id',
            'start_time' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.issued_qty' => 'required|numeric|min:0.001'
        ]);

        DB::transaction(function() use ($request, $stockShift) {
            $stockShift->update([
                'location_id' => $request->location_id,
                'employee_id' => $request->employee_id,
                'start_time' => $request->start_time ?? now(),
                'notes' => $request->notes
            ]);

            // Reconcile stock for items removed or modified
            $existingShiftItems = $stockShift->shiftItems()->get()->keyBy('item_id');
            $requestedItemIds = collect($request->items)->pluck('item_id')->toArray();

            // Items being removed: refund full previous issued_qty back to stock
            foreach ($existingShiftItems as $itemId => $oldShiftItem) {
                if (!in_array($itemId, $requestedItemIds)) {
                    $itemModel = Item::withoutGlobalScope(\App\Scopes\LocationScope::class)->find($itemId);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->increment('quantity_on_hand', (float) $oldShiftItem->issued_qty);
                    }
                    $oldShiftItem->delete();
                }
            }

            // Items being added or updated
            foreach ($request->items as $itemData) {
                $itemId = $itemData['item_id'];
                $newIssuedQty = (float) $itemData['issued_qty'];
                $itemModel = Item::withoutGlobalScope(\App\Scopes\LocationScope::class)->find($itemId);

                if (isset($existingShiftItems[$itemId])) {
                    $oldShiftItem = $existingShiftItems[$itemId];
                    $oldIssuedQty = (float) $oldShiftItem->issued_qty;
                    $diff = $newIssuedQty - $oldIssuedQty;

                    if ($diff != 0 && $itemModel && $itemModel->type === 'inventory') {
                        if ($diff > 0) {
                            $itemModel->decrement('quantity_on_hand', $diff);
                        } else {
                            $itemModel->increment('quantity_on_hand', abs($diff));
                        }
                    }

                    $oldShiftItem->update([
                        'issued_qty' => $newIssuedQty,
                        'unit_price' => $itemModel ? (float) $itemModel->sale_price : $oldShiftItem->unit_price
                    ]);
                } else {
                    $price = $itemModel ? (float) $itemModel->sale_price : 0;
                    StockShiftItem::create([
                        'stock_shift_id' => $stockShift->id,
                        'item_id' => $itemId,
                        'issued_qty' => $newIssuedQty,
                        'unit_price' => $price,
                    ]);

                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->decrement('quantity_on_hand', $newIssuedQty);
                    }
                }
            }
        });

        return redirect()->route('stock-shifts.index')->with('success', 'Active stock shift updated successfully.');
    }

    public function edit(StockShift $stockShift)
    {
        $stockShift->load(['employee', 'location', 'shiftItems.item']);
        
        return Inertia::render('StockShifts/Close', [
            'shift' => $stockShift
        ]);
    }

    public function update(Request $request, StockShift $stockShift)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:stock_shift_items,id',
            'items.*.returned_qty' => 'required|numeric|min:0',
            'end_time' => 'nullable|date'
        ]);

        // Validate returned_qty <= issued_qty
        $errors = [];
        foreach ($request->items as $index => $iData) {
            $shiftItem = StockShiftItem::find($iData['id']);
            if ($shiftItem) {
                if ($iData['returned_qty'] > $shiftItem->issued_qty) {
                    $errors["items.{$index}.returned_qty"] = "Returned quantity cannot exceed issued quantity ({$shiftItem->issued_qty}).";
                }
            }
        }
        
        if (!empty($errors)) {
            throw \Illuminate\Validation\ValidationException::withMessages($errors);
        }

        DB::transaction(function() use ($request, $stockShift) {
            $totalSalesValue = 0;

            foreach ($request->items as $iData) {
                $shiftItem = StockShiftItem::find($iData['id']);
                if ($shiftItem && $shiftItem->stock_shift_id == $stockShift->id) {
                    $issued = (float) $shiftItem->issued_qty;
                    $returned = (float) $iData['returned_qty'];
                    $sold = max(0, $issued - $returned);
                    $value = $sold * $shiftItem->unit_price;

                    // If this shift was already closed or pending before (e.g. updating readings), adjust returned stock difference
                    $prevReturned = $shiftItem->returned_qty !== null ? (float) $shiftItem->returned_qty : 0;
                    $diffReturned = $returned - $prevReturned;

                    $shiftItem->update([
                        'returned_qty' => $returned,
                        'sold_qty' => $sold,
                        'total_value' => $value
                    ]);

                    // Add returned stock back to branch item inventory
                    $itemModel = Item::withoutGlobalScope(\App\Scopes\LocationScope::class)->find($shiftItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        if ($stockShift->status === 'open') {
                            $itemModel->increment('quantity_on_hand', $returned);
                        } elseif ($diffReturned != 0) {
                            if ($diffReturned > 0) {
                                $itemModel->increment('quantity_on_hand', $diffReturned);
                            } else {
                                $itemModel->decrement('quantity_on_hand', abs($diffReturned));
                            }
                        }
                    }

                    $totalSalesValue += $value;
                }
            }

            $stockShift->update([
                'end_time' => $request->end_time ?? now(),
                'status' => 'pending_collection',
                'total_sales_value' => $totalSalesValue,
            ]);
        });

        return redirect()->route('stock-shifts.index')->with('success', 'Stock returned. Please enter collections.');
    }

    public function editCollections(StockShift $stockShift)
    {
        $stockShift->load(['employee', 'location', 'shiftItems.item', 'collections.chartOfAccount', 'creditSales.customer']);
        
        $accounts = ChartOfAcc::get();
        $customers = Customer::get();

        return Inertia::render('StockShifts/Collections', [
            'shift' => $stockShift,
            'accounts' => $accounts,
            'customers' => $customers
        ]);
    }

    public function saveDraft(Request $request, StockShift $stockShift)
    {
        $request->validate([
            'collections' => 'nullable|array',
            'collections.*.chart_of_acc_id' => 'required|exists:chart_of_accs,id',
            'collections.*.amount' => 'required|numeric|min:0',
            'credit_sales' => 'nullable|array',
            'credit_sales.*.customer_id' => 'required|exists:customers,id',
            'credit_sales.*.amount' => 'required|numeric|min:0',
        ]);

        DB::transaction(function() use ($request, $stockShift) {
            $stockShift->collections()->delete();
            $stockShift->creditSales()->delete();

            if ($request->collections) {
                foreach ($request->collections as $collection) {
                    $amt = floatval($collection['amount'] ?? 0);
                    if ($amt > 0) {
                        StockShiftCollection::create([
                            'stock_shift_id' => $stockShift->id,
                            'chart_of_acc_id' => $collection['chart_of_acc_id'],
                            'description' => $collection['description'] ?? null,
                            'amount' => $amt
                        ]);
                    }
                }
            }

            if ($request->credit_sales) {
                foreach ($request->credit_sales as $sale) {
                    $amt = floatval($sale['amount'] ?? 0);
                    if ($amt > 0) {
                        StockShiftCreditSale::create([
                            'stock_shift_id' => $stockShift->id,
                            'customer_id' => $sale['customer_id'],
                            'description' => $sale['description'] ?? null,
                            'amount' => $amt
                        ]);
                    }
                }
            }
            $stockShift->update(['status' => 'pending_collection']);
        });

        return redirect()->route('stock-shifts.index')->with('success', 'Shift collections draft saved.');
    }

    public function reopen(StockShift $stockShift)
    {
        DB::transaction(function() use ($stockShift) {
            $jes = JournalEntry::where('transactionable_type', StockShift::class)
                ->where('transactionable_id', $stockShift->id)->get();
            foreach ($jes as $je) {
                $je->lines()->delete();
                $je->delete();
            }
            
            $invoices = CreditInvoice::where('source_id', $stockShift->id)->where('source_type', StockShift::class)->get();
            foreach ($invoices as $invoice) {
                $invJes = JournalEntry::where('transactionable_type', CreditInvoice::class)
                    ->where('transactionable_id', $invoice->id)->get();
                foreach ($invJes as $je) {
                    $je->lines()->delete();
                    $je->delete();
                }
                $invoice->items()->delete();
                $invoice->delete();
            }

            $stockShift->update(['status' => 'pending_collection']);
        });

        return redirect()->route('stock-shifts.collections.edit', $stockShift->id)->with('success', 'Shift reopened for editing.');
    }

    public function settle(Request $request, StockShift $stockShift)
    {
        $request->validate([
            'collections' => 'nullable|array',
            'collections.*.chart_of_acc_id' => 'required|exists:chart_of_accs,id',
            'collections.*.amount' => 'required|numeric|min:0',

            'credit_sales' => 'nullable|array',
            'credit_sales.*.customer_id' => 'required|exists:customers,id',
            'credit_sales.*.amount' => 'required|numeric|min:0',
        ]);

        DB::transaction(function() use ($request, $stockShift) {
            // Clean up old settlement records if re-settling
            $oldInvoices = CreditInvoice::where('source_id', $stockShift->id)->where('source_type', StockShift::class)->get();
            foreach ($oldInvoices as $inv) {
                $jes = JournalEntry::where('transactionable_type', CreditInvoice::class)
                    ->where('transactionable_id', $inv->id)
                    ->get();
                foreach ($jes as $je) {
                    $je->lines()->delete();
                    $je->delete();
                }
                CreditInvoiceItem::where('credit_invoice_id', $inv->id)->delete();
                $inv->delete();
            }

            $jes = JournalEntry::where('transactionable_type', StockShift::class)
                ->where('transactionable_id', $stockShift->id)
                ->get();
            foreach ($jes as $je) {
                $je->lines()->delete();
                $je->delete();
            }

            $stockShift->collections()->delete();
            $stockShift->creditSales()->delete();

            $totalCollections = 0;
            if ($request->collections) {
                foreach ($request->collections as $collection) {
                    $amt = floatval($collection['amount'] ?? 0);
                    if ($amt > 0) {
                        StockShiftCollection::create([
                            'stock_shift_id' => $stockShift->id,
                            'chart_of_acc_id' => $collection['chart_of_acc_id'],
                            'description' => $collection['description'] ?? null,
                            'amount' => $amt
                        ]);
                        $totalCollections += $amt;
                    }
                }
            }

            $totalCreditSales = 0;
            if ($request->credit_sales) {
                foreach ($request->credit_sales as $cs) {
                    $amt = floatval($cs['amount'] ?? 0);
                    if ($amt > 0) {
                        StockShiftCreditSale::create([
                            'stock_shift_id' => $stockShift->id,
                            'customer_id' => $cs['customer_id'],
                            'description' => $cs['description'] ?? null,
                            'amount' => $amt
                        ]);
                        $totalCreditSales += $amt;
                    }
                }
            }

            $totalCollected = $totalCollections + $totalCreditSales;
            $discrepancy = $totalCollected - (float) $stockShift->total_sales_value;

            if (abs($discrepancy) > 0.01) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'discrepancy' => ['Total collections and credit sales must exactly match Total Sales.']
                ]);
            }

            $stockShift->update([
                'status' => 'closed',
                'discrepancy' => $discrepancy
            ]);

            // Create Journal Entries for Financial Accounting
            if ($stockShift->total_sales_value > 0) {
                $settleJournal = JournalEntry::create([
                    'date' => $stockShift->end_time ? $stockShift->end_time->toDateString() : now()->toDateString(),
                    'reference' => 'Stock Shift ' . $stockShift->id,
                    'notes' => 'Settlement for Stock Shift #' . substr($stockShift->id, 0, 8),
                    'transactionable_type' => StockShift::class,
                    'transactionable_id' => $stockShift->id,
                ]);

                // Debit Collections (Cash/Bank)
                if ($request->collections) {
                    foreach ($request->collections as $collection) {
                        $amt = floatval($collection['amount'] ?? 0);
                        if ($amt > 0) {
                            JournalEntryLine::create([
                                'journal_entry_id' => $settleJournal->id,
                                'chart_of_acc_id' => $collection['chart_of_acc_id'],
                                'debit' => $amt,
                                'credit' => 0,
                                'memo' => 'Collection for Stock Shift ' . $stockShift->id,
                            ]);
                        }
                    }
                }

                // Credit Sales (Accounts Receivable)
                if ($request->credit_sales) {
                    $arAccount = ChartOfAcc::getOrCreateDefault('accounts-receivable')->id;
                    foreach ($request->credit_sales as $cs) {
                        $amt = floatval($cs['amount'] ?? 0);
                        if ($amt > 0) {
                            JournalEntryLine::create([
                                'journal_entry_id' => $settleJournal->id,
                                'chart_of_acc_id' => $arAccount,
                                'debit' => $amt,
                                'credit' => 0,
                                'memo' => 'Credit sale to Customer for Shift ' . $stockShift->id,
                            ]);
                        }
                    }
                }

                // Credit Revenue and Process COGS
                $stockShift->load('shiftItems.item');
                foreach ($stockShift->shiftItems as $sItem) {
                    $item = $sItem->item;
                    $soldQty = (float) $sItem->sold_qty;
                    $totalVal = (float) $sItem->total_value;

                    if ($item && $totalVal > 0) {
                        $incomeAccount = $item->income_account_id ?? ChartOfAcc::getOrCreateDefault('sales-income')->id;
                        JournalEntryLine::create([
                            'journal_entry_id' => $settleJournal->id,
                            'chart_of_acc_id' => $incomeAccount,
                            'debit' => 0,
                            'credit' => $totalVal,
                            'memo' => 'Revenue for ' . $item->name,
                        ]);

                        if ($item->type === 'inventory' && $soldQty > 0) {
                            $cogsAmount = $soldQty * (float) $item->purchase_price;
                            if ($cogsAmount > 0) {
                                $cogsAccount = $item->expense_account_id ?? ChartOfAcc::getOrCreateDefault('cost-of-goods-sold')->id;
                                $inventoryAccount = $item->inventory_account_id ?? ChartOfAcc::getOrCreateDefault('inventory')->id;

                                JournalEntryLine::create([
                                    'journal_entry_id' => $settleJournal->id,
                                    'chart_of_acc_id' => $cogsAccount,
                                    'debit' => $cogsAmount,
                                    'credit' => 0,
                                    'memo' => 'COGS for ' . $item->name,
                                ]);
                                JournalEntryLine::create([
                                    'journal_entry_id' => $settleJournal->id,
                                    'chart_of_acc_id' => $inventoryAccount,
                                    'debit' => 0,
                                    'credit' => $cogsAmount,
                                    'memo' => 'Inventory reduction for ' . $item->name,
                                ]);
                            }
                        }
                    }
                }
            }
        });

        return redirect()->route('stock-shifts.index')->with('success', 'Stock shift finalized and closed successfully.');
    }

    public function exportCsv(StockShift $stockShift)
    {
        $stockShift->load(['employee', 'location', 'shiftItems.item', 'collections.chartOfAccount', 'creditSales.customer']);

        $filename = "stock_shift_" . substr($stockShift->id, 0, 8) . ".csv";
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function() use ($stockShift) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Stock Shift Report', '#' . substr($stockShift->id, 0, 8)]);
            fputcsv($file, ['Branch', $stockShift->location->name ?? 'N/A']);
            fputcsv($file, ['Employee', $stockShift->employee->name ?? 'N/A']);
            fputcsv($file, ['Start Time', $stockShift->start_time]);
            fputcsv($file, ['End Time', $stockShift->end_time ?? 'N/A']);
            fputcsv($file, ['Status', strtoupper($stockShift->status)]);
            fputcsv($file, []);

            fputcsv($file, ['Item', 'Unit Price', 'Issued Qty', 'Returned Qty', 'Sold Qty', 'Total Value']);
            foreach ($stockShift->shiftItems as $si) {
                fputcsv($file, [
                    $si->item->name ?? 'Unknown',
                    number_format($si->unit_price, 2),
                    number_format($si->issued_qty, 3),
                    number_format($si->returned_qty ?? 0, 3),
                    number_format($si->sold_qty ?? 0, 3),
                    number_format($si->total_value ?? 0, 2),
                ]);
            }
            fputcsv($file, []);
            fputcsv($file, ['Total Sales Value', number_format($stockShift->total_sales_value, 2)]);
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function destroy(StockShift $stockShift)
    {
        DB::transaction(function() use ($stockShift) {
            // Restore inventory for active or pending shifts
            foreach ($stockShift->shiftItems as $si) {
                $itemModel = Item::withoutGlobalScope(\App\Scopes\LocationScope::class)->find($si->item_id);
                if ($itemModel && $itemModel->type === 'inventory') {
                    if ($stockShift->status === 'open') {
                        // All issued stock was deducted; refund it back
                        $itemModel->increment('quantity_on_hand', (float) $si->issued_qty);
                    } elseif ($stockShift->status === 'pending_collection') {
                        // Sold stock was net deducted; refund sold portion
                        $sold = (float) ($si->sold_qty ?? 0);
                        if ($sold > 0) {
                            $itemModel->increment('quantity_on_hand', $sold);
                        }
                    }
                }
            }

            // Cleanup journal entries and collections
            $jes = JournalEntry::where('transactionable_type', StockShift::class)
                ->where('transactionable_id', $stockShift->id)->get();
            foreach ($jes as $je) {
                $je->lines()->delete();
                $je->delete();
            }

            $stockShift->shiftItems()->delete();
            $stockShift->collections()->delete();
            $stockShift->creditSales()->delete();
            $stockShift->delete();
        });

        return redirect()->route('stock-shifts.index')->with('success', 'Stock shift deleted successfully.');
    }
}
