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
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: now()->toDateString();
        $displayBy = $request->query('display_by', 'total');

        $query = DB::table('bill_items')
            ->join('bills', 'bill_items.bill_id', '=', 'bills.id')
            ->join('suppliers', 'bills.supplier_id', '=', 'suppliers.id')
            ->join('items', 'bill_items.item_id', '=', 'items.id')
            ->where('bills.status', 'posted');

        if ($startDate) {
            $query->whereBetween('bills.bill_date', [$startDate, $endDate]);
        } else {
            $query->where('bills.bill_date', '<=', $endDate);
        }

        $months = [];
        if ($displayBy === 'month') {
            $minDate = $startDate ?: (clone $query)->min('bills.bill_date') ?: $endDate;
            $startDt = new \DateTime(substr($minDate, 0, 7) . '-01');
            $endDt = new \DateTime(substr($endDate, 0, 7) . '-01');
            while ($startDt <= $endDt) {
                $months[] = $startDt->format('Y-m');
                $startDt->modify('+1 month');
            }
        }

        $allLines = $query->select(
                'bill_items.id as line_id',
                'bill_items.item_id',
                'items.name as item_name',
                'items.sku as item_sku',
                'bill_items.quantity',
                'bill_items.rate',
                'bill_items.amount',
                'bills.bill_no as reference',
                'bills.bill_date as date',
                'bills.id as bill_id',
                'suppliers.display_name as supplier_name'
            )
            ->orderBy('bills.bill_date', 'asc')
            ->get();

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
                        'journal_entry_id' => $line->bill_id,
                        'date' => $line->date,
                        'transaction_type' => 'bill',
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
                'type' => $request->query('type'),
            ],
        ]);
    }

    public function purchaseBySupplier(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: now()->toDateString();
        $displayBy = $request->query('display_by', 'total');

        $query = DB::table('bills')
            ->join('suppliers', 'bills.supplier_id', '=', 'suppliers.id')
            ->where('bills.status', 'posted');

        if ($startDate) {
            $query->whereBetween('bills.bill_date', [$startDate, $endDate]);
        } else {
            $query->where('bills.bill_date', '<=', $endDate);
        }

        $months = [];
        if ($displayBy === 'month') {
            $minDate = $startDate ?: (clone $query)->min('bills.bill_date') ?: $endDate;
            $startDt = new \DateTime(substr($minDate, 0, 7) . '-01');
            $endDt = new \DateTime(substr($endDate, 0, 7) . '-01');
            while ($startDt <= $endDt) {
                $months[] = $startDt->format('Y-m');
                $startDt->modify('+1 month');
            }
        }

        if ($displayBy === 'month') {
            $reportData = $query->select(
                    'bills.supplier_id',
                    'suppliers.display_name as supplier_name',
                    'bills.bill_date as date',
                    'bills.total_amount',
                    'bills.id'
                )
                ->get()
                ->groupBy('supplier_id')
                ->map(function ($bills, $supplierId) use ($months) {
                    $supplierName = $bills->first()->supplier_name;
                    $monthlyTotals = [];
                    foreach ($months as $m) {
                        $monthlyTotals[$m] = ['tx_count' => 0, 'amount' => 0];
                    }
                    foreach ($bills as $bill) {
                        $m = substr($bill->date, 0, 7);
                        if (isset($monthlyTotals[$m])) {
                            $monthlyTotals[$m]['tx_count'] += 1;
                            $monthlyTotals[$m]['amount'] += (float)$bill->total_amount;
                        }
                    }
                    return [
                        'supplier_id' => $supplierId,
                        'supplier_name' => $supplierName,
                        'tx_count' => $bills->count(),
                        'total_amount' => $bills->sum('total_amount'),
                        'monthly_totals' => $monthlyTotals,
                    ];
                })->values()->sortByDesc('total_amount')->values();
        } else {
            $reportData = $query->select(
                    'bills.supplier_id',
                    'suppliers.display_name as supplier_name',
                    DB::raw('COUNT(bills.id) as tx_count'),
                    DB::raw('SUM(bills.total_amount) as total_amount')
                )
                ->groupBy('bills.supplier_id', 'suppliers.display_name')
                ->orderByDesc('total_amount')
                ->get();
        }

        return Inertia::render('Reports/PurchaseBySupplier', [
            'reportData' => $reportData,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'display_by' => $displayBy,
                'months' => $months,
                'type' => $request->query('type'),
            ],
        ]);
    }
}
