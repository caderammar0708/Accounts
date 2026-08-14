<?php

namespace App\Http\Controllers\Accounting\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PurchaseReportController extends Controller
{
    public function purchaseByItem(Request $request)
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
            $billsQuery->where(function($q) use ($locId) {
                $q->where('bills.location_id', $locId)
                  ->orWhereNull('bills.location_id');
            });
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
                'payments.expense_number as reference',
                'payments.payment_date as date',
                'payments.id as journal_entry_id',
                'suppliers.display_name as supplier_name',
                DB::raw("'payment' as transaction_type")
            )->get();

        $allLines = $billsData->concat($expensesData)->sortBy('date')->values();

        $reportData = $allLines->groupBy('item_id')->map(function ($lines, $itemId) use ($displayBy, $months) {
            $firstLine = $lines->first();
            $itemData = [
                'id' => $itemId,
                'name' => $firstLine->item_name,
                'sku' => $firstLine->item_sku,
                'total_qty' => $lines->sum('quantity'),
                'total_amount' => $lines->sum('amount'),
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

            return [
                'item' => $itemData,
                'lines' => $displayBy === 'month' ? [] : $lines->map(function ($line) {
                    return [
                        'id' => $line->line_id,
                        'journal_entry_id' => $line->journal_entry_id,
                        'date' => $line->date,
                        'transaction_type' => $line->transaction_type,
                        'reference' => $line->reference,
                        'contact_name' => $line->supplier_name,
                        'qty' => (float) $line->quantity,
                        'rate' => (float) $line->rate,
                        'amount' => (float) $line->amount,
                    ];
                })->values(),
            ];
        })->values();

        return Inertia::render('Reports/PurchaseByItem', [
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
            ->where('bills.status', 'posted');
            
        $expensesQuery = DB::table('payments')
            ->join('suppliers', 'payments.payee_id', '=', 'suppliers.id')
            ->where('payments.payee_type', \App\Models\Supplier::class)
            ->where('payments.status', 'posted');

        if (session()->has('current_location_id')) {
            $locId = session('current_location_id');
            $billsQuery->where(function($q) use ($locId) {
                $q->where('bills.location_id', $locId)
                  ->orWhereNull('bills.location_id');
            });
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

        if ($displayBy === 'month') {
            $billsData = $billsQuery->select(
                    'bills.supplier_id',
                    'suppliers.display_name as supplier_name',
                    'bills.bill_date as date',
                    'bills.total_amount',
                    'bills.id as tx_id'
                )->get();
                
            $expensesData = $expensesQuery->select(
                    'payments.payee_id as supplier_id',
                    'suppliers.display_name as supplier_name',
                    'payments.payment_date as date',
                    'payments.total_amount',
                    'payments.id as tx_id'
                )->get();

            $reportData = $billsData->concat($expensesData)
                ->groupBy('supplier_id')
                ->map(function ($txs, $supplierId) use ($months) {
                    $supplierName = $txs->first()->supplier_name;
                    $monthlyTotals = [];
                    foreach ($months as $m) {
                        $monthlyTotals[$m] = ['tx_count' => 0, 'amount' => 0];
                    }
                    foreach ($txs as $tx) {
                        $m = substr($tx->date, 0, 7);
                        if (isset($monthlyTotals[$m])) {
                            $monthlyTotals[$m]['tx_count'] += 1;
                            $monthlyTotals[$m]['amount'] += (float)$tx->total_amount;
                        }
                    }
                    return [
                        'supplier_id' => $supplierId,
                        'supplier_name' => $supplierName,
                        'tx_count' => $txs->count(),
                        'total_amount' => $txs->sum('total_amount'),
                        'monthly_totals' => $monthlyTotals,
                    ];
                })->values()->sortByDesc('total_amount')->values();
        } else {
            $billsData = $billsQuery->select(
                    'bills.supplier_id',
                    'suppliers.display_name as supplier_name',
                    DB::raw('COUNT(bills.id) as tx_count'),
                    DB::raw('SUM(bills.total_amount) as total_amount')
                )
                ->groupBy('bills.supplier_id', 'suppliers.display_name')
                ->get();
                
            $expensesData = $expensesQuery->select(
                    'payments.payee_id as supplier_id',
                    'suppliers.display_name as supplier_name',
                    DB::raw('COUNT(payments.id) as tx_count'),
                    DB::raw('SUM(payments.total_amount) as total_amount')
                )
                ->groupBy('payments.payee_id', 'suppliers.display_name')
                ->get();
                
            $reportData = collect();
            foreach ([$billsData, $expensesData] as $data) {
                foreach ($data as $row) {
                    $existing = $reportData->firstWhere('supplier_id', $row->supplier_id);
                    if ($existing) {
                        $existing->tx_count += $row->tx_count;
                        $existing->total_amount += $row->total_amount;
                    } else {
                        $row->tx_count = (int)$row->tx_count;
                        $row->total_amount = (float)$row->total_amount;
                        $reportData->push($row);
                    }
                }
            }
            $reportData = $reportData->sortByDesc('total_amount')->values();
        }

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
