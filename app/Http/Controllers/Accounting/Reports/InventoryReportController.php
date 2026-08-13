<?php

namespace App\Http\Controllers\Accounting\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class InventoryReportController extends Controller
{
    public function inventorySummary(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: date('Y-m-d');
        $displayBy = $request->query('display_by', 'total');

        $items = \App\Models\Item::with('category')
            ->where('track_inventory', true)
            ->orderBy('name')
            ->get();

        $invoices = DB::table('credit_invoice_items')
            ->join('credit_invoices', 'credit_invoice_items.credit_invoice_id', '=', 'credit_invoices.id')
            ->join('journal_entries', function($join) {
                $join->on('credit_invoices.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\CreditInvoice');
            })
            ->where('credit_invoices.invoice_date', '<=', $endDate)
            ->select('item_id', 'credit_invoices.invoice_date as date', DB::raw('-(quantity) as qty_change'));

        $salesInvoices = DB::table('sales_invoice_items')
            ->join('sales_invoices', 'sales_invoice_items.sales_invoice_id', '=', 'sales_invoices.id')
            ->join('journal_entries', function($join) {
                $join->on('sales_invoices.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\SalesInvoice');
            })
            ->where('sales_invoices.receipt_date', '<=', $endDate)
            ->select('item_id', 'sales_invoices.receipt_date as date', DB::raw('-(quantity) as qty_change'));

        $invoiceReturns = DB::table('invoice_return_items')
            ->join('invoice_returns', 'invoice_return_items.invoice_return_id', '=', 'invoice_returns.id')
            ->join('journal_entries', function($join) {
                $join->on('invoice_returns.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\InvoiceReturn');
            })
            ->where('invoice_returns.date', '<=', $endDate)
            ->select('item_id', 'invoice_returns.date as date', 'quantity as qty_change');

        $payments = DB::table('payment_items')
            ->join('payments', 'payment_items.payment_id', '=', 'payments.id')
            ->join('journal_entries', function($join) {
                $join->on('payments.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\Payment');
            })
            ->where('payments.payment_date', '<=', $endDate)
            ->select('item_id', 'payments.payment_date as date', 'quantity as qty_change');

        $bills = DB::table('bill_items')
            ->join('bills', 'bill_items.bill_id', '=', 'bills.id')
            ->join('journal_entries', function($join) {
                $join->on('bills.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\Bill');
            })
            ->where('bills.bill_date', '<=', $endDate)
            ->select('item_id', 'bills.bill_date as date', 'quantity as qty_change');

        $billReturns = DB::table('bill_return_items')
            ->join('bill_returns', 'bill_return_items.bill_return_id', '=', 'bill_returns.id')
            ->join('journal_entries', function($join) {
                $join->on('bill_returns.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\BillReturn');
            })
            ->where('bill_returns.date', '<=', $endDate)
            ->select('item_id', 'bill_returns.date as date', DB::raw('-(quantity) as qty_change'));

        $adjustments = DB::table('inventory_quantity_adjustment_items')
            ->join('inventory_quantity_adjustments', 'inventory_quantity_adjustment_items.inventory_quantity_adjustment_id', '=', 'inventory_quantity_adjustments.id')
            ->join('journal_entries', function($join) {
                $join->on('inventory_quantity_adjustments.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\InventoryQuantityAdjustment');
            })
            ->where('inventory_quantity_adjustments.adjustment_date', '<=', $endDate)
            ->select('item_id', 'inventory_quantity_adjustments.adjustment_date as date', 'change_in_qty as qty_change');

        $allLinesQuery = $invoices->unionAll($salesInvoices)->unionAll($invoiceReturns)->unionAll($payments)->unionAll($bills)->unionAll($billReturns)->unionAll($adjustments);

        $months = [];
        if ($displayBy === 'month') {
            $minDate = $startDate ?: (clone $allLinesQuery)->min('date') ?: $endDate;
            $startDt = new \DateTime(substr($minDate, 0, 7) . '-01');
            $endDt = new \DateTime(substr($endDate, 0, 7) . '-01');
            while ($startDt <= $endDt) {
                $months[] = $startDt->format('Y-m');
                $startDt->modify('+1 month');
            }
            
            $lines = $allLinesQuery->get();
            $linesByItem = $lines->groupBy('item_id');

            $groups = $items->groupBy(function ($item) {
                return $item->category ? $item->category->name : 'Uncategorized';
            })->map(function ($items, $category) use ($linesByItem, $months) {
                return [
                    'category' => $category,
                    'items' => $items->map(function ($item) use ($linesByItem, $months) {
                        $itemLines = $linesByItem->get($item->id, collect());
                        $monthlyBalances = [];
                        $cumulative = 0;
                        
                        if (!empty($months)) {
                            $firstMonth = $months[0];
                            foreach ($itemLines as $line) {
                                if (substr($line->date, 0, 7) < $firstMonth) {
                                    $cumulative += $line->qty_change;
                                }
                            }
                        }

                        foreach ($months as $m) {
                            foreach ($itemLines as $line) {
                                if (substr($line->date, 0, 7) === $m) {
                                    $cumulative += $line->qty_change;
                                }
                            }
                            $monthlyBalances[$m] = $cumulative * $item->purchase_price;
                        }

                        $finalQty = 0;
                        foreach ($itemLines as $line) {
                            $finalQty += $line->qty_change;
                        }

                        return [
                            'id' => $item->id,
                            'name' => $item->name,
                            'sku' => $item->sku,
                            'qty_on_hand' => (float)$finalQty,
                            'avg_cost' => (float)$item->purchase_price,
                            'asset_value' => (float)($finalQty * $item->purchase_price),
                            'monthly_balances' => $monthlyBalances,
                        ];
                    })->values()
                ];
            })->values();
        } else {
            $lines = $allLinesQuery->get();
            $linesByItem = $lines->groupBy('item_id');

            $groups = $items->groupBy(function ($item) {
                return $item->category ? $item->category->name : 'Uncategorized';
            })->map(function ($items, $category) use ($linesByItem) {
                return [
                    'category' => $category,
                    'items' => $items->map(function ($item) use ($linesByItem) {
                        $itemLines = $linesByItem->get($item->id, collect());
                        $finalQty = 0;
                        foreach ($itemLines as $line) {
                            $finalQty += $line->qty_change;
                        }
                        return [
                            'id' => $item->id,
                            'name' => $item->name,
                            'sku' => $item->sku,
                            'qty_on_hand' => (float)$finalQty,
                            'avg_cost' => (float)$item->purchase_price,
                            'asset_value' => (float)($finalQty * $item->purchase_price),
                        ];
                    })->values()
                ];
            })->values();
        }

        return Inertia::render('Reports/InventorySummary', [
            'reportData' => $groups,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'display_by' => $displayBy,
                'months' => $months,
                'type' => $request->query('type')
            ]
        ]);
    }

    public function inventoryDetailAll(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: date('Y-m-d');
        $itemIds = $request->query('item_ids');
        if ($itemIds && is_string($itemIds)) {
            $itemIds = explode(',', $itemIds);
        }
        if (!is_array($itemIds)) {
            $itemIds = [];
        }

        $itemsQuery = \App\Models\Item::query()
            ->where('track_inventory', true)
            ->orderBy('name');
            
        if (!empty($itemIds)) {
            $itemsQuery->whereIn('id', $itemIds);
        }
        
        $items = $itemsQuery->get();

        $invoices = DB::table('credit_invoice_items')
            ->join('credit_invoices', 'credit_invoice_items.credit_invoice_id', '=', 'credit_invoices.id')
            ->join('journal_entries', function($join) {
                $join->on('credit_invoices.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\CreditInvoice');
            })
            ->select(
                'credit_invoice_items.item_id',
                'credit_invoices.invoice_date as date',
                'credit_invoices.invoice_no as reference',
                'credit_invoice_items.description as memo',
                DB::raw('-(credit_invoice_items.quantity) as qty_change'),
                'credit_invoice_items.rate',
                DB::raw("'credit_invoice' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('0 as debit'),
                DB::raw('(credit_invoice_items.quantity * credit_invoice_items.rate) as credit')
            );

        $salesInvoices = DB::table('sales_invoice_items')
            ->join('sales_invoices', 'sales_invoice_items.sales_invoice_id', '=', 'sales_invoices.id')
            ->join('journal_entries', function($join) {
                $join->on('sales_invoices.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\SalesInvoice');
            })
            ->select(
                'sales_invoice_items.item_id',
                'sales_invoices.receipt_date as date',
                'sales_invoices.receipt_no as reference',
                'sales_invoice_items.description as memo',
                DB::raw('-(sales_invoice_items.quantity) as qty_change'),
                'sales_invoice_items.rate',
                DB::raw("'sales_invoice' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('0 as debit'),
                DB::raw('(sales_invoice_items.quantity * sales_invoice_items.rate) as credit')
            );

        $invoiceReturns = DB::table('invoice_return_items')
            ->join('invoice_returns', 'invoice_return_items.invoice_return_id', '=', 'invoice_returns.id')
            ->join('journal_entries', function($join) {
                $join->on('invoice_returns.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\InvoiceReturn');
            })
            ->select(
                'invoice_return_items.item_id',
                'invoice_returns.date as date',
                DB::raw("'' as reference"),
                'invoice_return_items.description as memo',
                'invoice_return_items.quantity as qty_change',
                'invoice_return_items.rate',
                DB::raw("'invoice_return' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('(invoice_return_items.quantity * invoice_return_items.rate) as debit'),
                DB::raw('0 as credit')
            );

        $payments = DB::table('payment_items')
            ->join('payments', 'payment_items.payment_id', '=', 'payments.id')
            ->join('journal_entries', function($join) {
                $join->on('payments.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\Payment');
            })
            ->select(
                'payment_items.item_id',
                'payments.payment_date as date',
                'payments.reference_no as reference',
                'payment_items.description as memo',
                'payment_items.quantity as qty_change',
                'payment_items.rate',
                DB::raw("'payment' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('(payment_items.quantity * payment_items.rate) as debit'),
                DB::raw('0 as credit')
            );

        $bills = DB::table('bill_items')
            ->join('bills', 'bill_items.bill_id', '=', 'bills.id')
            ->join('journal_entries', function($join) {
                $join->on('bills.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\Bill');
            })
            ->select(
                'bill_items.item_id',
                'bills.bill_date as date',
                'bills.bill_no as reference',
                'bill_items.description as memo',
                'bill_items.quantity as qty_change',
                'bill_items.rate',
                DB::raw("'bill' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('(bill_items.quantity * bill_items.rate) as debit'),
                DB::raw('0 as credit')
            );

        $billReturns = DB::table('bill_return_items')
            ->join('bill_returns', 'bill_return_items.bill_return_id', '=', 'bill_returns.id')
            ->join('journal_entries', function($join) {
                $join->on('bill_returns.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\BillReturn');
            })
            ->select(
                'bill_return_items.item_id',
                'bill_returns.date as date',
                DB::raw("'' as reference"),
                'bill_return_items.description as memo',
                DB::raw('-(bill_return_items.quantity) as qty_change'),
                'bill_return_items.rate',
                DB::raw("'bill_return' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('0 as debit'),
                DB::raw('(bill_return_items.quantity * bill_return_items.rate) as credit')
            );

        $adjustments = DB::table('inventory_quantity_adjustment_items')
            ->join('inventory_quantity_adjustments', 'inventory_quantity_adjustment_items.inventory_quantity_adjustment_id', '=', 'inventory_quantity_adjustments.id')
            ->join('journal_entries', function($join) {
                $join->on('inventory_quantity_adjustments.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\InventoryQuantityAdjustment');
            })
            ->select(
                'inventory_quantity_adjustment_items.item_id',
                'inventory_quantity_adjustments.adjustment_date as date',
                'inventory_quantity_adjustments.reference_number as reference',
                'inventory_quantity_adjustments.memo as memo',
                'inventory_quantity_adjustment_items.change_in_qty as qty_change',
                DB::raw('0 as rate'),
                DB::raw("'inventory_adjustment' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('0 as debit'),
                DB::raw('0 as credit')
            );


        if ($startDate) {
            $invoices->whereBetween('credit_invoices.invoice_date', [$startDate, $endDate]);
            $salesInvoices->whereBetween('sales_invoices.receipt_date', [$startDate, $endDate]);
            $invoiceReturns->whereBetween('invoice_returns.date', [$startDate, $endDate]);
            $payments->whereBetween('payments.payment_date', [$startDate, $endDate]);
            $bills->whereBetween('bills.bill_date', [$startDate, $endDate]);
            $billReturns->whereBetween('bill_returns.date', [$startDate, $endDate]);
            $adjustments->whereBetween('inventory_quantity_adjustments.adjustment_date', [$startDate, $endDate]);
        } else {
            $invoices->where('credit_invoices.invoice_date', '<=', $endDate);
            $salesInvoices->where('sales_invoices.receipt_date', '<=', $endDate);
            $invoiceReturns->where('invoice_returns.date', '<=', $endDate);
            $payments->where('payments.payment_date', '<=', $endDate);
            $bills->where('bills.bill_date', '<=', $endDate);
            $billReturns->where('bill_returns.date', '<=', $endDate);
            $adjustments->where('inventory_quantity_adjustments.adjustment_date', '<=', $endDate);
        }

        if (!empty($itemIds)) {
            $invoices->whereIn('credit_invoice_items.item_id', $itemIds);
            $salesInvoices->whereIn('sales_invoice_items.item_id', $itemIds);
            $invoiceReturns->whereIn('invoice_return_items.item_id', $itemIds);
            $payments->whereIn('payment_items.item_id', $itemIds);
            $bills->whereIn('bill_items.item_id', $itemIds);
            $billReturns->whereIn('bill_return_items.item_id', $itemIds);
            $adjustments->whereIn('inventory_quantity_adjustment_items.item_id', $itemIds);
        }

        $allLines = $invoices->unionAll($salesInvoices)->unionAll($invoiceReturns)->unionAll($payments)->unionAll($bills)->unionAll($billReturns)->unionAll($adjustments)
            ->orderBy('date', 'asc')
            ->get();

        $linesByItemId = $allLines->groupBy('item_id');

        $reportData = $items->map(function ($item) use ($linesByItemId) {
            $itemLines = $linesByItemId->get($item->id, collect())->map(function ($line, $index) use ($item) {
                return [
                    'id' => $line->journal_entry_id . '-' . $index,
                    'date' => $line->date,
                    'transaction_type' => $line->transaction_type,
                    'reference' => $line->reference,
                    'memo' => $line->memo,
                    'qty_change' => (float)$line->qty_change,
                    'debit' => (float)$line->debit,
                    'credit' => (float)$line->credit,
                    'rate' => (float)$line->rate,
                    'journal_entry_id' => $line->journal_entry_id,
                ];
            })->values();

            return [
                'item' => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'opening_qty' => 0, 
                    'opening_value' => 0,
                    'purchase_price' => (float)$item->purchase_price,
                    'qty_on_hand' => (float)$item->quantity_on_hand,
                    'asset_value' => (float)($item->quantity_on_hand * $item->purchase_price),
                ],
                'lines' => $itemLines,
            ];
        })->filter(function ($group) {
            return $group['lines']->isNotEmpty() || $group['item']['qty_on_hand'] > 0;
        })->values();

        $allInventoryItems = \App\Models\Item::where('track_inventory', true)
            ->select('id', 'name', 'sku')
            ->orderBy('name')
            ->get();

        return Inertia::render('Reports/AllInventoryDetail', [
            'reportData' => $reportData,
            'allInventoryItems' => $allInventoryItems,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'type' => $request->query('type'),
                'item_ids' => $itemIds,
            ]
        ]);
    }

    public function inventoryDetail(Request $request, \App\Models\Item $item)
    {
        if (!$item->track_inventory) {
            abort(404);
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: date('Y-m-d');

        $invoices = DB::table('credit_invoice_items')
            ->join('credit_invoices', 'credit_invoice_items.credit_invoice_id', '=', 'credit_invoices.id')
            ->join('journal_entries', function($join) {
                $join->on('credit_invoices.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\CreditInvoice');
            })
            ->where('credit_invoice_items.item_id', $item->id)
            ->select(
                'credit_invoice_items.item_id',
                'credit_invoices.invoice_date as date',
                'credit_invoices.invoice_no as reference',
                'credit_invoice_items.description as memo',
                DB::raw('-(credit_invoice_items.quantity) as qty_change'),
                'credit_invoice_items.rate',
                DB::raw("'credit_invoice' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('0 as debit'),
                DB::raw('(credit_invoice_items.quantity * credit_invoice_items.rate) as credit')
            );

        $salesInvoices = DB::table('sales_invoice_items')
            ->join('sales_invoices', 'sales_invoice_items.sales_invoice_id', '=', 'sales_invoices.id')
            ->join('journal_entries', function($join) {
                $join->on('sales_invoices.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\SalesInvoice');
            })
            ->where('sales_invoice_items.item_id', $item->id)
            ->select(
                'sales_invoice_items.item_id',
                'sales_invoices.receipt_date as date',
                'sales_invoices.receipt_no as reference',
                'sales_invoice_items.description as memo',
                DB::raw('-(sales_invoice_items.quantity) as qty_change'),
                'sales_invoice_items.rate',
                DB::raw("'sales_invoice' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('0 as debit'),
                DB::raw('(sales_invoice_items.quantity * sales_invoice_items.rate) as credit')
            );

        $invoiceReturns = DB::table('invoice_return_items')
            ->join('invoice_returns', 'invoice_return_items.invoice_return_id', '=', 'invoice_returns.id')
            ->join('journal_entries', function($join) {
                $join->on('invoice_returns.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\InvoiceReturn');
            })
            ->where('invoice_return_items.item_id', $item->id)
            ->select(
                'invoice_return_items.item_id',
                'invoice_returns.date as date',
                DB::raw("'' as reference"),
                'invoice_return_items.description as memo',
                'invoice_return_items.quantity as qty_change',
                'invoice_return_items.rate',
                DB::raw("'invoice_return' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('(invoice_return_items.quantity * invoice_return_items.rate) as debit'),
                DB::raw('0 as credit')
            );

        $payments = DB::table('payment_items')
            ->join('payments', 'payment_items.payment_id', '=', 'payments.id')
            ->join('journal_entries', function($join) {
                $join->on('payments.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\Payment');
            })
            ->where('payment_items.item_id', $item->id)
            ->select(
                'payment_items.item_id',
                'payments.payment_date as date',
                'payments.reference_no as reference',
                'payment_items.description as memo',
                'payment_items.quantity as qty_change',
                'payment_items.rate',
                DB::raw("'payment' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('(payment_items.quantity * payment_items.rate) as debit'),
                DB::raw('0 as credit')
            );

        $bills = DB::table('bill_items')
            ->join('bills', 'bill_items.bill_id', '=', 'bills.id')
            ->join('journal_entries', function($join) {
                $join->on('bills.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\Bill');
            })
            ->where('bill_items.item_id', $item->id)
            ->select(
                'bill_items.item_id',
                'bills.bill_date as date',
                'bills.bill_no as reference',
                'bill_items.description as memo',
                'bill_items.quantity as qty_change',
                'bill_items.rate',
                DB::raw("'bill' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('(bill_items.quantity * bill_items.rate) as debit'),
                DB::raw('0 as credit')
            );

        $billReturns = DB::table('bill_return_items')
            ->join('bill_returns', 'bill_return_items.bill_return_id', '=', 'bill_returns.id')
            ->join('journal_entries', function($join) {
                $join->on('bill_returns.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\BillReturn');
            })
            ->where('bill_return_items.item_id', $item->id)
            ->select(
                'bill_return_items.item_id',
                'bill_returns.date as date',
                DB::raw("'' as reference"),
                'bill_return_items.description as memo',
                DB::raw('-(bill_return_items.quantity) as qty_change'),
                'bill_return_items.rate',
                DB::raw("'bill_return' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('0 as debit'),
                DB::raw('(bill_return_items.quantity * bill_return_items.rate) as credit')
            );

        $adjustments = DB::table('inventory_quantity_adjustment_items')
            ->join('inventory_quantity_adjustments', 'inventory_quantity_adjustment_items.inventory_quantity_adjustment_id', '=', 'inventory_quantity_adjustments.id')
            ->join('journal_entries', function($join) {
                $join->on('inventory_quantity_adjustments.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\InventoryQuantityAdjustment');
            })
            ->where('inventory_quantity_adjustment_items.item_id', $item->id)
            ->select(
                'inventory_quantity_adjustment_items.item_id',
                'inventory_quantity_adjustments.adjustment_date as date',
                'inventory_quantity_adjustments.reference_number as reference',
                'inventory_quantity_adjustments.memo as memo',
                'inventory_quantity_adjustment_items.change_in_qty as qty_change',
                DB::raw('0 as rate'),
                DB::raw("'inventory_adjustment' as transaction_type"),
                'journal_entries.id as journal_entry_id',
                DB::raw('0 as debit'),
                DB::raw('0 as credit')
            );

        $openingQty = 0;
        if ($startDate) {
            $invQty = DB::table('credit_invoice_items')
                ->join('credit_invoices', 'credit_invoice_items.credit_invoice_id', '=', 'credit_invoices.id')
                ->where('credit_invoice_items.item_id', $item->id)
                ->where('credit_invoices.invoice_date', '<', $startDate)
                ->sum(DB::raw('-(credit_invoice_items.quantity)'));

            $salesInvQty = DB::table('sales_invoice_items')
                ->join('sales_invoices', 'sales_invoice_items.sales_invoice_id', '=', 'sales_invoices.id')
                ->where('sales_invoice_items.item_id', $item->id)
                ->where('sales_invoices.receipt_date', '<', $startDate)
                ->sum(DB::raw('-(sales_invoice_items.quantity)'));

            $invRetQty = DB::table('invoice_return_items')
                ->join('invoice_returns', 'invoice_return_items.invoice_return_id', '=', 'invoice_returns.id')
                ->where('invoice_return_items.item_id', $item->id)
                ->where('invoice_returns.date', '<', $startDate)
                ->sum('invoice_return_items.quantity');

            $payQty = DB::table('payment_items')
                ->join('payments', 'payment_items.payment_id', '=', 'payments.id')
                ->where('payment_items.item_id', $item->id)
                ->where('payments.payment_date', '<', $startDate)
                ->sum('payment_items.quantity');

            $billQty = DB::table('bill_items')
                ->join('bills', 'bill_items.bill_id', '=', 'bills.id')
                ->where('bill_items.item_id', $item->id)
                ->where('bills.bill_date', '<', $startDate)
                ->sum('bill_items.quantity');

            $billRetQty = DB::table('bill_return_items')
                ->join('bill_returns', 'bill_return_items.bill_return_id', '=', 'bill_returns.id')
                ->where('bill_return_items.item_id', $item->id)
                ->where('bill_returns.date', '<', $startDate)
                ->sum(DB::raw('-(bill_return_items.quantity)'));

            $adjQty = DB::table('inventory_quantity_adjustment_items')
                ->join('inventory_quantity_adjustments', 'inventory_quantity_adjustment_items.inventory_quantity_adjustment_id', '=', 'inventory_quantity_adjustments.id')
                ->where('inventory_quantity_adjustment_items.item_id', $item->id)
                ->where('inventory_quantity_adjustments.adjustment_date', '<', $startDate)
                ->sum('inventory_quantity_adjustment_items.change_in_qty');

            $openingQty = (float)$invQty + (float)$salesInvQty + (float)$invRetQty + (float)$payQty + (float)$billQty + (float)$billRetQty + (float)$adjQty;
        }

        if ($startDate) {
            $invoices->whereBetween('credit_invoices.invoice_date', [$startDate, $endDate]);
            $salesInvoices->whereBetween('sales_invoices.receipt_date', [$startDate, $endDate]);
            $invoiceReturns->whereBetween('invoice_returns.date', [$startDate, $endDate]);
            $payments->whereBetween('payments.payment_date', [$startDate, $endDate]);
            $bills->whereBetween('bills.bill_date', [$startDate, $endDate]);
            $billReturns->whereBetween('bill_returns.date', [$startDate, $endDate]);
            $adjustments->whereBetween('inventory_quantity_adjustments.adjustment_date', [$startDate, $endDate]);
        } else {
            $invoices->where('credit_invoices.invoice_date', '<=', $endDate);
            $salesInvoices->where('sales_invoices.receipt_date', '<=', $endDate);
            $invoiceReturns->where('invoice_returns.date', '<=', $endDate);
            $payments->where('payments.payment_date', '<=', $endDate);
            $bills->where('bills.bill_date', '<=', $endDate);
            $billReturns->where('bill_returns.date', '<=', $endDate);
            $adjustments->where('inventory_quantity_adjustments.adjustment_date', '<=', $endDate);
        }

        $lines = $invoices->unionAll($salesInvoices)->unionAll($invoiceReturns)->unionAll($payments)->unionAll($bills)->unionAll($billReturns)->unionAll($adjustments)
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($line, $index) {
                return [
                    'id' => $line->journal_entry_id . '-' . $index,
                    'date' => $line->date,
                    'transaction_type' => $line->transaction_type,
                    'reference' => $line->reference,
                    'memo' => $line->memo,
                    'qty_change' => (float)$line->qty_change,
                    'debit' => (float)$line->debit,
                    'credit' => (float)$line->credit,
                    'rate' => (float)$line->rate,
                    'journal_entry_id' => $line->journal_entry_id,
                ];
            });

        return Inertia::render('Reports/InventoryDetail', [
            'item' => [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'opening_qty' => (float)$openingQty,
            ],
            'lines' => $lines,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'type' => $request->query('type')
            ]
        ]);
    }
}

