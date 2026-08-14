<?php

namespace App\Http\Controllers\Accounting\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SalesReportController extends Controller
{
    public function salesByItem(Request $request)
    {
        $type = $request->query('type');
        if (!$type && !$request->has('start_date') && !$request->has('end_date')) {
            $type = 'all_dates';
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: now()->toDateString();
        $displayBy = $request->query('display_by', 'total');

        $salesQuery = DB::table('sales_invoice_items')
            ->join('sales_invoices', 'sales_invoice_items.sales_invoice_id', '=', 'sales_invoices.id')
            ->join('customers', 'sales_invoices.customer_id', '=', 'customers.id')
            ->join('items', 'sales_invoice_items.item_id', '=', 'items.id')
            ->leftJoin('journal_entries', function($join) {
                $join->on('sales_invoices.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\SalesInvoice');
            })
            ->where('sales_invoices.status', 'posted');

        $creditQuery = DB::table('credit_invoice_items')
            ->join('credit_invoices', 'credit_invoice_items.credit_invoice_id', '=', 'credit_invoices.id')
            ->join('customers', 'credit_invoices.customer_id', '=', 'customers.id')
            ->join('items', 'credit_invoice_items.item_id', '=', 'items.id')
            ->leftJoin('journal_entries', function($join) {
                $join->on('credit_invoices.id', '=', 'journal_entries.transactionable_id')
                     ->where('journal_entries.transactionable_type', '=', 'App\\Models\\Accounting\\CreditInvoice');
            })
            ->where('credit_invoices.status', 'posted');

        if ($type !== 'all_dates') {
            if ($startDate) {
                $salesQuery->whereBetween('sales_invoices.receipt_date', [$startDate, $endDate]);
                $creditQuery->whereBetween('credit_invoices.invoice_date', [$startDate, $endDate]);
            } else {
                $salesQuery->where('sales_invoices.receipt_date', '<=', $endDate);
                $creditQuery->where('credit_invoices.invoice_date', '<=', $endDate);
            }
        }

        $salesQuery->select(
            'sales_invoice_items.id as line_id',
            'sales_invoice_items.item_id',
            'items.name as item_name',
            'items.sku as item_sku',
            'sales_invoice_items.quantity',
            'sales_invoice_items.rate',
            'sales_invoice_items.amount',
            'sales_invoices.receipt_no as reference',
            'sales_invoices.receipt_date as date',
            DB::raw('COALESCE(journal_entries.id, sales_invoices.id) as invoice_id'),
            'customers.display_name as customer_name',
            DB::raw("'sales_invoice' as transaction_type")
        );

        $creditQuery->select(
            'credit_invoice_items.id as line_id',
            'credit_invoice_items.item_id',
            'items.name as item_name',
            'items.sku as item_sku',
            'credit_invoice_items.quantity',
            'credit_invoice_items.rate',
            'credit_invoice_items.amount',
            'credit_invoices.invoice_no as reference',
            'credit_invoices.invoice_date as date',
            DB::raw('COALESCE(journal_entries.id, credit_invoices.id) as invoice_id'),
            'customers.display_name as customer_name',
            DB::raw("'credit_invoice' as transaction_type")
        );

        $combinedQuery = DB::query()->fromSub($salesQuery->unionAll($creditQuery), 'combined');

        $months = [];
        if ($displayBy === 'month') {
            $minDate = $startDate ?: (clone $combinedQuery)->min('date') ?: $endDate;
            $startDt = new \DateTime(substr($minDate, 0, 7) . '-01');
            $endDt = new \DateTime(substr($endDate, 0, 7) . '-01');
            while ($startDt <= $endDt) {
                $months[] = $startDt->format('Y-m');
                $startDt->modify('+1 month');
            }
        }

        $allLines = $combinedQuery->orderBy('date', 'asc')->get();

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
                        'journal_entry_id' => $line->invoice_id,
                        'date' => $line->date,
                        'transaction_type' => $line->transaction_type,
                        'reference' => $line->reference,
                        'contact_name' => $line->customer_name,
                        'qty' => (float) $line->quantity,
                        'rate' => (float) $line->rate,
                        'amount' => (float) $line->amount,
                    ];
                })->values(),
            ];
        })->values();

        return Inertia::render('Reports/SalesByItem', [
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

    public function salesByCustomer(Request $request)
    {
        $type = $request->query('type');
        if (!$type && !$request->has('start_date') && !$request->has('end_date')) {
            $type = 'all_dates';
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: now()->toDateString();
        $displayBy = $request->query('display_by', 'total');

        $salesQuery = DB::table('sales_invoices')
            ->join('customers', 'sales_invoices.customer_id', '=', 'customers.id')
            ->where('sales_invoices.status', 'posted');

        $creditQuery = DB::table('credit_invoices')
            ->join('customers', 'credit_invoices.customer_id', '=', 'customers.id')
            ->where('credit_invoices.status', 'posted');

        if ($type !== 'all_dates') {
            if ($startDate) {
                $salesQuery->whereBetween('sales_invoices.receipt_date', [$startDate, $endDate]);
                $creditQuery->whereBetween('credit_invoices.invoice_date', [$startDate, $endDate]);
            } else {
                $salesQuery->where('sales_invoices.receipt_date', '<=', $endDate);
                $creditQuery->where('credit_invoices.invoice_date', '<=', $endDate);
            }
        }

        $salesQuery->select(
            'sales_invoices.customer_id',
            'customers.display_name as customer_name',
            'sales_invoices.receipt_date as date',
            'sales_invoices.total_amount',
            'sales_invoices.id'
        );

        $creditQuery->select(
            'credit_invoices.customer_id',
            'customers.display_name as customer_name',
            'credit_invoices.invoice_date as date',
            'credit_invoices.total_amount',
            'credit_invoices.id'
        );

        $combinedQuery = DB::query()->fromSub($salesQuery->unionAll($creditQuery), 'combined');

        $months = [];
        if ($displayBy === 'month') {
            $minDate = $startDate ?: (clone $combinedQuery)->min('date') ?: $endDate;
            $startDt = new \DateTime(substr($minDate, 0, 7) . '-01');
            $endDt = new \DateTime(substr($endDate, 0, 7) . '-01');
            while ($startDt <= $endDt) {
                $months[] = $startDt->format('Y-m');
                $startDt->modify('+1 month');
            }
        }

        if ($displayBy === 'month') {
            $reportData = $combinedQuery->select(
                    'customer_id',
                    'customer_name',
                    'date',
                    'total_amount',
                    'id'
                )
                ->get()
                ->groupBy('customer_id')
                ->map(function ($invoices, $customerId) use ($months) {
                    $customerName = $invoices->first()->customer_name;
                    $monthlyTotals = [];
                    foreach ($months as $m) {
                        $monthlyTotals[$m] = ['invoice_count' => 0, 'amount' => 0];
                    }
                    foreach ($invoices as $inv) {
                        $m = substr($inv->date, 0, 7);
                        if (isset($monthlyTotals[$m])) {
                            $monthlyTotals[$m]['invoice_count'] += 1;
                            $monthlyTotals[$m]['amount'] += (float)$inv->total_amount;
                        }
                    }
                    return [
                        'customer_id' => $customerId,
                        'customer_name' => $customerName,
                        'invoice_count' => $invoices->count(),
                        'total_amount' => $invoices->sum('total_amount'),
                        'monthly_totals' => $monthlyTotals,
                    ];
                })->values()->sortByDesc('total_amount')->values();
        } else {
            $reportData = $combinedQuery->select(
                    'customer_id',
                    'customer_name',
                    DB::raw('COUNT(id) as invoice_count'),
                    DB::raw('SUM(total_amount) as total_amount')
                )
                ->groupBy('customer_id', 'customer_name')
                ->orderByDesc('total_amount')
                ->get();
        }

        return Inertia::render('Reports/SalesByCustomer', [
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
