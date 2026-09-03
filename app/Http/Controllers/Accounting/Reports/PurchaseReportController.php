<?php

namespace App\Http\Controllers\Accounting\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PurchaseReportController extends Controller
{
    public function purchaseByItemSummary(Request $request)
    {
        $type = $request->query('type');
        if (!$type && !$request->has('start_date') && !$request->has('end_date')) {
            $type = 'all_dates';
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: now()->toDateString();
        $displayBy = $request->query('display_by', 'total');

        $billsQuery = DB::table('bill_items')
            ->join('bills', 'bill_items.bill_id', '=', 'bills.id')
            ->join('items', 'bill_items.item_id', '=', 'items.id')
            ->leftJoin('item_categories', 'items.item_category_id', '=', 'item_categories.id')
            ->where('bills.status', 'posted');

        $expensesQuery = DB::table('payment_items')
            ->join('payments', 'payment_items.payment_id', '=', 'payments.id')
            ->join('items', 'payment_items.item_id', '=', 'items.id')
            ->leftJoin('item_categories', 'items.item_category_id', '=', 'item_categories.id')
            ->where('payments.status', 'posted');

        if (session()->has('current_location_id')) {
            $locId = session('current_location_id');
            if ($locId && $locId !== 'all') {
                $billsQuery->where(function($q) use ($locId) {
                    $q->where('bills.location_id', $locId)
                      ->orWhereNull('bills.location_id');
                });
            }
        }

        if ($type !== 'all_dates') {
            if ($startDate) {
                $billsQuery->whereBetween('bills.bill_date', [$startDate, $endDate]);
                $expensesQuery->whereBetween('payments.payment_date', [$startDate, $endDate]);
            } else {
                $billsQuery->where('bills.bill_date', '<=', $endDate);
                $expensesQuery->where('payments.payment_date', '<=', $endDate);
            }
        }

        $months = [];
        if ($displayBy === 'month') {
            $minBillDate = (clone $billsQuery)->min('bills.bill_date');
            $minExpDate = (clone $expensesQuery)->min('payments.payment_date');
            $minDates = array_filter([$minBillDate, $minExpDate]);
            $minDate = $startDate ?: (!empty($minDates) ? min($minDates) : $endDate);
            
            $startDt = new \DateTime(substr($minDate, 0, 7) . '-01');
            $endDt = new \DateTime(substr($endDate, 0, 7) . '-01');
            while ($startDt <= $endDt) {
                $months[] = $startDt->format('Y-m');
                $startDt->modify('+1 month');
            }
        }

        $billsData = $billsQuery->select(
                'bill_items.item_id',
                'items.name as item_name',
                'items.sku as item_sku',
                'item_categories.name as category_name',
                'bill_items.quantity',
                'bill_items.amount',
                'bills.bill_date as date'
            )->get();

        $expensesData = $expensesQuery->select(
                'payment_items.item_id',
                'items.name as item_name',
                'items.sku as item_sku',
                'item_categories.name as category_name',
                'payment_items.quantity',
                'payment_items.amount',
                'payments.payment_date as date'
            )->get();

        $allLines = $billsData->concat($expensesData);

        $itemsGrouped = $allLines->groupBy('item_id')->map(function ($lines, $itemId) use ($displayBy, $months) {
            $firstLine = $lines->first();
            $itemData = [
                'id' => $itemId,
                'name' => $firstLine->item_name,
                'sku' => $firstLine->item_sku,
                'category_name' => $firstLine->category_name ?: 'Uncategorized',
                'total_qty' => (float) $lines->sum('quantity'),
                'total_amount' => (float) $lines->sum('amount'),
            ];

            if ($displayBy === 'month') {
                $monthlyTotals = [];
                foreach ($months as $m) {
                    $monthlyTotals[$m] = ['qty' => 0, 'amount' => 0];
                }
                foreach ($lines as $l) {
                    $m = substr($l->date, 0, 7);
                    if (isset($monthlyTotals[$m])) {
                        $monthlyTotals[$m]['qty'] += (float)$l->quantity;
                        $monthlyTotals[$m]['amount'] += (float)$l->amount;
                    }
                }
                $itemData['monthly_totals'] = $monthlyTotals;
            }

            return $itemData;
        })->values();

        $reportData = $itemsGrouped->groupBy('category_name')->map(function ($items, $categoryName) {
            return [
                'category' => $categoryName,
                'items' => $items->map(function ($item) {
                    unset($item['category_name']);
                    return $item;
                })->values(),
            ];
        })->values();

        return Inertia::render('Reports/PurchaseByItemSummary', [
            'reportData' => $reportData,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'display_by' => $displayBy,
                'months' => $months,
                'type' => $type,
            ],
        ]);
    }

    public function purchaseByItemDetail(Request $request)
    {
        $type = $request->query('type');
        if (!$type && !$request->has('start_date') && !$request->has('end_date')) {
            $type = 'all_dates';
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: now()->toDateString();

        $billsQuery = DB::table('bill_items')
            ->join('bills', 'bill_items.bill_id', '=', 'bills.id')
            ->leftJoin('suppliers', 'bills.supplier_id', '=', 'suppliers.id')
            ->join('items', 'bill_items.item_id', '=', 'items.id')
            ->leftJoin('journal_entries', function($join) {
                $join->on('bills.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\Bill');
            })
            ->where('bills.status', 'posted');

        $expensesQuery = DB::table('payment_items')
            ->join('payments', 'payment_items.payment_id', '=', 'payments.id')
            ->leftJoin('suppliers', 'payments.payee_id', '=', 'suppliers.id')
            ->join('items', 'payment_items.item_id', '=', 'items.id')
            ->where('payments.status', 'posted');

        if (session()->has('current_location_id')) {
            $locId = session('current_location_id');
            if ($locId && $locId !== 'all') {
                $billsQuery->where(function($q) use ($locId) {
                    $q->where('bills.location_id', $locId)
                      ->orWhereNull('bills.location_id');
                });
            }
        }

        if ($type !== 'all_dates') {
            if ($startDate) {
                $billsQuery->whereBetween('bills.bill_date', [$startDate, $endDate]);
                $expensesQuery->whereBetween('payments.payment_date', [$startDate, $endDate]);
            } else {
                $billsQuery->where('bills.bill_date', '<=', $endDate);
                $expensesQuery->where('payments.payment_date', '<=', $endDate);
            }
        }

        $itemIds = $request->query('item_ids');
        if ($itemIds && is_string($itemIds)) {
            $itemIds = explode(',', $itemIds);
        }
        if (!empty($itemIds) && is_array($itemIds)) {
            $itemIds = array_filter($itemIds);
            if (!empty($itemIds)) {
                $billsQuery->whereIn('bill_items.item_id', $itemIds);
                $expensesQuery->whereIn('payment_items.item_id', $itemIds);
            }
        }

        $billsData = $billsQuery->select(
                'bill_items.id as line_id',
                'bill_items.item_id',
                'items.name as item_name',
                'items.sku as item_sku',
                'bill_items.quantity',
                'bill_items.rate',
                'bill_items.amount',
                'bills.bill_no as reference',
                'bills.bill_date as date',
                DB::raw('COALESCE(journal_entries.id, bills.id) as journal_entry_id'),
                'suppliers.display_name as supplier_name',
                DB::raw("'bill' as transaction_type")
            )->get();

        $expensesData = $expensesQuery->select(
                'payment_items.id as line_id',
                'payment_items.item_id',
                'items.name as item_name',
                'items.sku as item_sku',
                'payment_items.quantity',
                'payment_items.rate',
                'payment_items.amount',
                'payments.reference_no as reference',
                'payments.payment_date as date',
                'payments.id as journal_entry_id',
                'suppliers.display_name as supplier_name',
                DB::raw("'payment' as transaction_type")
            )->get();

        $allLines = $billsData->concat($expensesData)->sortBy('date')->values();

        $reportData = $allLines->groupBy('item_id')->map(function ($lines, $itemId) {
            $firstLine = $lines->first();
            $itemData = [
                'id' => $itemId,
                'name' => $firstLine->item_name,
                'sku' => $firstLine->item_sku,
                'total_qty' => (float) $lines->sum('quantity'),
                'total_amount' => (float) $lines->sum('amount'),
            ];

            $allLineItems = $lines->map(function ($line) {
                return [
                    'id' => $line->line_id,
                    'journal_entry_id' => $line->journal_entry_id,
                    'invoice_id' => $line->journal_entry_id,
                    'date' => $line->date,
                    'transaction_type' => $line->transaction_type,
                    'reference' => $line->reference,
                    'contact_name' => $line->supplier_name,
                    'qty' => (float) $line->quantity,
                    'rate' => (float) $line->rate,
                    'amount' => (float) $line->amount,
                ];
            })->values();

            return [
                'item' => $itemData,
                'lines' => $allLineItems,
            ];
        })->values();

        return Inertia::render('Reports/PurchaseByItemDetail', [
            'reportData' => $reportData,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'type' => $type,
            ],
            'allInventoryItems' => \App\Models\Item::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function purchaseBySupplier(Request $request)
    {
        $type = $request->query('type');
        if (!$type && !$request->has('start_date') && !$request->has('end_date')) {
            $type = 'all_dates';
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: now()->toDateString();
        $displayBy = $request->query('display_by', 'total');

        $billsQuery = DB::table('bills')
            ->join('suppliers', 'bills.supplier_id', '=', 'suppliers.id')
            ->leftJoin('journal_entries', function($join) {
                $join->on('bills.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\Bill');
            })
            ->where('bills.status', 'posted');
            
        $expensesQuery = DB::table('payments')
            ->join('suppliers', 'payments.payee_id', '=', 'suppliers.id')
            ->leftJoin('journal_entries', function($join) {
                $join->on('payments.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\Payment');
            })
            ->where('payments.payee_type', \App\Models\Supplier::class)
            ->where('payments.status', 'posted');

        if (session()->has('current_location_id')) {
            $locId = session('current_location_id');
            if ($locId && $locId !== 'all') {
                $billsQuery->where(function($q) use ($locId) {
                    $q->where('bills.location_id', $locId)
                      ->orWhereNull('bills.location_id');
                });
            }
        }

        if ($type !== 'all_dates') {
            if ($startDate) {
                $billsQuery->whereBetween('bills.bill_date', [$startDate, $endDate]);
                $expensesQuery->whereBetween('payments.payment_date', [$startDate, $endDate]);
            } else {
                $billsQuery->where('bills.bill_date', '<=', $endDate);
                $expensesQuery->where('payments.payment_date', '<=', $endDate);
            }
        }

        $months = [];
        if ($displayBy === 'month') {
            $minBillDate = (clone $billsQuery)->min('bills.bill_date');
            $minExpDate = (clone $expensesQuery)->min('payments.payment_date');
            $minDates = array_filter([$minBillDate, $minExpDate]);
            $minDate = $startDate ?: (!empty($minDates) ? min($minDates) : $endDate);
            
            $startDt = new \DateTime(substr($minDate, 0, 7) . '-01');
            $endDt = new \DateTime(substr($endDate, 0, 7) . '-01');
            while ($startDt <= $endDt) {
                $months[] = $startDt->format('Y-m');
                $startDt->modify('+1 month');
            }
        }

        $billsData = $billsQuery->select(
                'bills.supplier_id',
                'suppliers.display_name as supplier_name',
                'bills.bill_date as date',
                'bills.bill_no as reference',
                'bills.total_amount as amount',
                'bills.id as tx_id',
                DB::raw('COALESCE(journal_entries.id, bills.id) as journal_entry_id'),
                DB::raw("COALESCE(journal_entries.transaction_type, 'bill') as transaction_type")
            )->get();
            
        $expensesData = $expensesQuery->select(
                'payments.payee_id as supplier_id',
                'suppliers.display_name as supplier_name',
                'payments.payment_date as date',
                'payments.reference_no as reference',
                'payments.total_amount as amount',
                'payments.id as tx_id',
                DB::raw('COALESCE(journal_entries.id, payments.id) as journal_entry_id'),
                DB::raw("COALESCE(journal_entries.transaction_type, 'payment') as transaction_type")
            )->get();

        $allLines = $billsData->concat($expensesData)->sortBy('date')->values();

        $reportData = $allLines->groupBy('supplier_id')->map(function ($lines, $supplierId) use ($displayBy, $months) {
            $supplierName = $lines->first()->supplier_name;
            $allLineItems = $lines->map(function ($line) {
                return [
                    'id' => $line->tx_id,
                    'journal_entry_id' => $line->journal_entry_id,
                    'invoice_id' => $line->journal_entry_id,
                    'date' => $line->date,
                    'transaction_type' => $line->transaction_type,
                    'reference' => $line->reference,
                    'contact_name' => $line->supplier_name,
                    'amount' => (float) $line->amount,
                ];
            })->values();

            $monthlyTotals = [];
            if ($displayBy === 'month') {
                foreach ($months as $m) {
                    $monthlyTotals[$m] = ['tx_count' => 0, 'amount' => 0, 'lines' => []];
                }
                foreach ($allLineItems as $l) {
                    $m = substr($l['date'], 0, 7);
                    if (isset($monthlyTotals[$m])) {
                        $monthlyTotals[$m]['tx_count'] += 1;
                        $monthlyTotals[$m]['amount'] += (float)$l['amount'];
                        $monthlyTotals[$m]['lines'][] = $l;
                    }
                }
            }

            return [
                'supplier_id' => $supplierId,
                'supplier_name' => $supplierName,
                'tx_count' => $lines->count(),
                'total_amount' => (float) $lines->sum('amount'),
                'monthly_totals' => $monthlyTotals,
                'lines' => $allLineItems,
            ];
        })->values()->sortByDesc('total_amount')->values();

        return Inertia::render('Reports/PurchaseBySupplier', [
            'reportData' => $reportData,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'display_by' => $displayBy,
                'months' => $months,
                'type' => $type,
            ],
        ]);
    }
}
