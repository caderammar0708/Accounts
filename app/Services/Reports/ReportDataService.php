<?php

namespace App\Services\Reports;

use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Accounting\CreditInvoice;
use App\Models\Item;
use App\Models\Customer;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportDataService
{
    protected $treeBuilder;

    public function __construct(AccountTreeBuilder $treeBuilder)
    {
        $this->treeBuilder = $treeBuilder;
    }

        public function profitAndLossData(\Illuminate\Http\Request $request)
    {
        $displayBy = $request->get('display_by', 'total');
        $type = $request->get('type');
        $hasStart = $request->has('start_date') && $request->get('start_date') !== null && $request->get('start_date') !== '';
        $hasEnd = $request->has('end_date') && $request->get('end_date') !== null && $request->get('end_date') !== '';

        if ($type === 'all_dates' || (!$type && !$hasStart && !$hasEnd && $request->has('start_date') && $request->has('end_date'))) {
            $start = '';
            $end = '';
            $type = 'all_dates';
        } else {
            $start = $request->has('start_date') && $request->get('start_date') !== '' ? $request->get('start_date') : date('Y-01-01');
            $end = $request->has('end_date') && $request->get('end_date') !== '' ? $request->get('end_date') : date('Y-m-d');
            if (!$type) {
                $type = ($hasStart || $hasEnd) ? 'custom' : 'this_year';
            }
        }

        $sql = 'select journal_entry_lines.chart_of_acc_id, ';
        if ($displayBy === 'month') {
            $sql .= 'DATE_FORMAT(journal_entries.date, "%Y-%m") as month, ';
        }
        $sql .= 'sum(journal_entry_lines.debit) as total_debit, sum(journal_entry_lines.credit) as total_credit from journal_entry_lines join journal_entries on journal_entry_lines.journal_entry_id = journal_entries.id';
        
        $bindings = [];
        if ($type !== 'all_dates' && $start && $end) {
            $sql .= ' where journal_entries.date between ? and ?';
            $bindings = [$start, $end];
        } elseif ($type !== 'all_dates' && $start) {
            $sql .= ' where journal_entries.date >= ?';
            $bindings = [$start];
        } elseif ($type !== 'all_dates' && $end) {
            $sql .= ' where journal_entries.date <= ?';
            $bindings = [$end];
        }

        $sql .= ' group by journal_entry_lines.chart_of_acc_id';
        if ($displayBy === 'month') {
            $sql .= ', month';
        }

        $lines = collect(\Illuminate\Support\Facades\DB::select($sql, $bindings));

        $types = ['Income', 'Expense'];

        $months = [];
        if ($displayBy === 'month') {
            $calcStart = $start ?: (\App\Models\Accounting\JournalEntryLine::join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')->min('journal_entries.date') ?: date('Y-01-01'));
            $calcEnd = $end ?: (\App\Models\Accounting\JournalEntryLine::join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')->max('journal_entries.date') ?: date('Y-m-d'));
            $period = new \DateTime($calcStart);
            $endDt = new \DateTime($calcEnd);
            while ($period <= $endDt) {
                $months[] = $period->format('Y-m');
                $period->modify('+1 month');
            }
        }

        $tree = $this->treeBuilder->buildPnLTree($types, $lines, $displayBy, $months);

        return [
            'reportData' => $tree,
            'filters' => [
                'start_date' => $start,
                'end_date' => $end,
                'display_by' => $displayBy,
                'months' => $months,
                'type' => $type,
            ],
        ];
    }

    public function balanceSheetData(\Illuminate\Http\Request $request)
    {
        $displayBy = $request->get('display_by', 'total');
        $type = $request->get('type');
        $hasStart = $request->has('start_date') && $request->get('start_date') !== null && $request->get('start_date') !== '';
        $hasEnd = $request->has('end_date') && $request->get('end_date') !== null && $request->get('end_date') !== '';

        if ($type === 'all_dates' || (!$type && !$hasStart && !$hasEnd && $request->has('start_date') && $request->has('end_date'))) {
            $start = '';
            $end = '';
            $type = 'all_dates';
        } else {
            $start = $request->has('start_date') && $request->get('start_date') !== '' ? $request->get('start_date') : date('Y-01-01');
            $end = $request->has('end_date') && $request->get('end_date') !== '' ? $request->get('end_date') : date('Y-12-31');
            if (!$type) {
                $type = ($hasStart || $hasEnd) ? 'custom' : 'this_year';
            }
        }

        $sql = 'select journal_entry_lines.chart_of_acc_id, ';
        $sql .= 'DATE_FORMAT(journal_entries.date, "%Y-%m") as month, ';
        $sql .= 'sum(journal_entry_lines.debit) as total_debit, sum(journal_entry_lines.credit) as total_credit from journal_entry_lines join journal_entries on journal_entry_lines.journal_entry_id = journal_entries.id';
        
        $bindings = [];
        if ($type !== 'all_dates' && $end) {
            $sql .= ' where journal_entries.date <= ?';
            $bindings = [$end];
        }

        $sql .= ' group by journal_entry_lines.chart_of_acc_id, month';

        $lines = collect(\Illuminate\Support\Facades\DB::select($sql, $bindings));

        $types = ['Asset', 'Liability', 'Equity'];

        $months = [];
        if ($displayBy === 'month') {
            $calcStart = $start ?: (\App\Models\Accounting\JournalEntryLine::join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')->min('journal_entries.date') ?: date('Y-01-01'));
            $calcEnd = $end ?: (\App\Models\Accounting\JournalEntryLine::join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')->max('journal_entries.date') ?: date('Y-12-31'));
            $period = new \DateTime($calcStart);
            $endDt = new \DateTime($calcEnd);
            while ($period <= $endDt) {
                $months[] = $period->format('Y-m');
                $period->modify('+1 month');
            }
        }

        $tree = $this->treeBuilder->buildBalanceSheetTree($types, $lines, $displayBy, $months, $start);

        return [
            'reportData' => $tree,
            'filters' => [
                'start_date' => $start,
                'end_date' => $end,
                'display_by' => $displayBy,
                'months' => $months,
                'type' => $type,
            ],
        ];
    }

public function customerBalanceData($endDate = null)
    {
        $endDate = $endDate !== null && $endDate !== '' ? $endDate : now()->toDateString();

        $customers = Customer::query()->get();

        $lines = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            ->where(function ($q) {
                $q->where('journal_entries.payee_type', Customer::class)
                  ->orWhere('journal_entry_lines.payee_type', Customer::class);
            })
            ->where('chart_of_accs.sub_type', 'accounts-receivable')
            ->where('journal_entries.date', '<=', $endDate)
            ->select(
                DB::raw('COALESCE(journal_entry_lines.payee_id, journal_entries.payee_id) as payee_id'),
                DB::raw('SUM(journal_entry_lines.debit) as total_debit'),
                DB::raw('SUM(journal_entry_lines.credit) as total_credit')
            )
            ->groupBy(DB::raw('COALESCE(journal_entry_lines.payee_id, journal_entries.payee_id)'))
            ->get()
            ->keyBy('payee_id');

        return $customers->map(function ($customer) use ($lines) {
            $line = $lines->get($customer->id);
            $balance = $customer->opening_balance ?? 0;
            if ($line) {
                $balance += ($line->total_debit - $line->total_credit);
            }

            return (object) [
                'id' => $customer->id,
                'display_name' => $customer->display_name ?: $customer->company_name,
                'company_name' => $customer->company_name,
                'email' => $customer->email,
                'phone_number' => $customer->phone_number,
                'balance' => (float) $balance,
            ];
        })->filter(function ($item) {
            return $item->balance != 0;
        })->values();
    }

    public function supplierBalanceData($endDate = null)
    {
        $endDate = $endDate !== null && $endDate !== '' ? $endDate : now()->toDateString();
        $suppliers = Supplier::query()->get();

        $lines = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            ->where(function ($q) {
                $q->where('journal_entries.payee_type', Supplier::class)
                  ->orWhere('journal_entry_lines.payee_type', Supplier::class);
            })
            ->where('chart_of_accs.sub_type', 'accounts-payable')
            ->where('journal_entries.date', '<=', $endDate)
            ->select(
                DB::raw('COALESCE(journal_entry_lines.payee_id, journal_entries.payee_id) as payee_id'),
                DB::raw('SUM(journal_entry_lines.debit) as total_debit'),
                DB::raw('SUM(journal_entry_lines.credit) as total_credit')
            )
            ->groupBy(DB::raw('COALESCE(journal_entry_lines.payee_id, journal_entries.payee_id)'))
            ->get()
            ->keyBy('payee_id');

        return $suppliers->map(function ($supplier) use ($lines) {
            $line = $lines->get($supplier->id);
            $balance = $supplier->opening_balance ?? 0;
            if ($line) {
                $balance += ($line->total_credit - $line->total_debit);
            }

            return (object) [
                'id' => $supplier->id,
                'display_name' => $supplier->display_name ?: $supplier->company_name,
                'company_name' => $supplier->company_name,
                'email' => $supplier->email,
                'phone_number' => $supplier->phone_number,
                'balance' => (float) $balance,
            ];
        })->filter(function ($item) {
            return $item->balance != 0;
        })->values();
    }

    public function inventorySummaryData($startDate = null, $endDate = null)
    {
        $itemsQuery = Item::with('category')
            ->where('track_inventory', true)
            ->orderBy('name')
            ->get();

        if ($endDate && $endDate < date('Y-m-d')) {
            $query = DB::table('journal_entries')
                ->join('journal_entry_lines', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
                ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
                ->where('chart_of_accs.sub_type', 'inventory')
                ->where('journal_entries.date', '<=', $endDate);

            $allLines = $query->select('journal_entry_lines.memo', 'journal_entry_lines.debit', 'journal_entry_lines.credit')->get();

            $itemsQuery = $itemsQuery->map(function ($item) use ($allLines) {
                $qty = 0;
                $itemLines = $allLines->filter(function ($line) use ($item) {
                    return stripos($line->memo, $item->name) !== false;
                });

                if ($item->purchase_price > 0) {
                    foreach ($itemLines as $line) {
                        if ($line->debit > 0) {
                            $qty += $line->debit / $item->purchase_price;
                        } else if ($line->credit > 0) {
                            $qty -= $line->credit / $item->purchase_price;
                        }
                    }
                }

                $item->quantity_on_hand = round($qty, 2);
                return $item;
            });
        }

        $billData = DB::table('bill_items')
            ->join('bills', 'bill_items.bill_id', '=', 'bills.id')
            ->where('bills.status', 'posted')
            ->groupBy('item_id')
            ->selectRaw('item_id, SUM(quantity) as qty, SUM(quantity * rate) as val')
            ->get()->keyBy('item_id');

        $expenseData = DB::table('payment_items')
            ->join('payments', 'payment_items.payment_id', '=', 'payments.id')
            ->where('payments.status', 'posted')
            ->groupBy('item_id')
            ->selectRaw('item_id, SUM(quantity) as qty, SUM(quantity * rate) as val')
            ->get()->keyBy('item_id');

        $invoiceData = DB::table('credit_invoice_items')
            ->join('credit_invoices', 'credit_invoice_items.credit_invoice_id', '=', 'credit_invoices.id')
            ->where('credit_invoices.status', 'posted')
            ->groupBy('item_id')
            ->selectRaw('item_id, SUM(quantity) as qty')
            ->get()->keyBy('item_id');

        $receiptData = DB::table('sales_invoice_items')
            ->join('sales_invoices', 'sales_invoice_items.sales_invoice_id', '=', 'sales_invoices.id')
            ->where('sales_invoices.status', 'posted')
            ->groupBy('item_id')
            ->selectRaw('item_id, SUM(quantity) as qty')
            ->get()->keyBy('item_id');

        $creditData = DB::table('bill_return_items')
            ->join('bill_returns', 'bill_return_items.bill_return_id', '=', 'bill_returns.id')
            ->where('bill_returns.status', 'posted')
            ->groupBy('item_id')
            ->selectRaw('item_id, SUM(quantity) as qty')
            ->get()->keyBy('item_id');

        $adjData = DB::table('inventory_quantity_adjustment_items')
            ->join('inventory_quantity_adjustments', 'inventory_quantity_adjustment_items.inventory_quantity_adjustment_id', '=', 'inventory_quantity_adjustments.id')
            ->groupBy('item_id')
            ->selectRaw('item_id, SUM(change_in_qty) as qty')
            ->get()->keyBy('item_id');

        $groupedData = $itemsQuery->map(function ($item) use ($billData, $expenseData, $invoiceData, $receiptData, $creditData, $adjData) {
            $purchasedQty = ($billData[$item->id]->qty ?? 0) + ($expenseData[$item->id]->qty ?? 0);
            $purchasedVal = ($billData[$item->id]->val ?? 0) + ($expenseData[$item->id]->val ?? 0);

            $soldQty = ($invoiceData[$item->id]->qty ?? 0) + ($receiptData[$item->id]->qty ?? 0) + ($creditData[$item->id]->qty ?? 0);
            $adjQty = $adjData[$item->id]->qty ?? 0;
            if ($adjQty > 0) {
                $purchasedQty += $adjQty;
                $purchasedVal += ($adjQty * $item->purchase_price);
            }

            $initialQty = $item->quantity_on_hand + $soldQty - $purchasedQty - ($adjQty < 0 ? $adjQty : 0);
            if ($initialQty > 0) {
                $purchasedQty += $initialQty;
                $purchasedVal += ($initialQty * $item->purchase_price);
            }

            $calculatedAvgCost = $purchasedQty > 0 ? ($purchasedVal / $purchasedQty) : $item->purchase_price;

            return [
                'category' => $item->category ? $item->category->name : 'Uncategorized',
                'item' => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'qty_on_hand' => (float) $item->quantity_on_hand,
                    'avg_cost' => (float) $calculatedAvgCost,
                    'asset_value' => (float) ($item->quantity_on_hand * $calculatedAvgCost),
                ],
            ];
        })->groupBy('category')->map(function ($items, $categoryName) {
            return [
                'category' => $categoryName,
                'items' => $items->pluck('item')->values(),
            ];
        })->values();

        return $groupedData;
    }

    public function salesByItemData($startDate = null, $endDate = null)
    {
        $query = DB::table('credit_invoice_items')
            ->join('credit_invoices', 'credit_invoice_items.credit_invoice_id', '=', 'credit_invoices.id')
            ->join('journal_entries', function($join) {
                $join->on('journal_entries.transactionable_id', '=', 'credit_invoices.id')
                     ->where('journal_entries.transactionable_type', '=', \App\Models\Accounting\CreditInvoice::class);
            })
            ->join('items', 'credit_invoice_items.item_id', '=', 'items.id')
            ->join('customers', 'credit_invoices.customer_id', '=', 'customers.id')
            ->where('credit_invoices.status', 'posted');

        if ($startDate) {
            $query->whereBetween('credit_invoices.invoice_date', [$startDate, $endDate]);
        } else {
            $query->where('credit_invoices.invoice_date', '<=', $endDate ?: date('Y-m-d'));
        }

        $allLines = $query->select(
                'credit_invoice_items.id as line_id',
                'credit_invoice_items.quantity',
                'credit_invoice_items.rate',
                'credit_invoice_items.amount',
                'credit_invoices.invoice_no as reference',
                'credit_invoices.invoice_date as date',
                'items.id as item_id',
                'items.name as item_name',
                'items.sku as item_sku',
                'customers.display_name as customer_name',
                'journal_entries.id as journal_entry_id'
            )
            ->orderBy('credit_invoices.invoice_date', 'asc')
            ->get();

        return $allLines->groupBy('item_id')->map(function ($lines, $itemId) {
            $firstLine = $lines->first();
            return [
                'item' => [
                    'id' => $itemId,
                    'name' => $firstLine->item_name,
                    'sku' => $firstLine->item_sku,
                    'total_qty' => $lines->sum('quantity'),
                    'total_amount' => $lines->sum('amount'),
                ],
                'lines' => $lines->map(function ($line) {
                    return [
                        'id' => $line->line_id,
                        'journal_entry_id' => $line->journal_entry_id,
                        'date' => $line->date,
                        'transaction_type' => 'credit_invoice',
                        'reference' => $line->reference,
                        'contact_name' => $line->customer_name,
                        'qty' => (float) $line->quantity,
                        'rate' => (float) $line->rate,
                        'amount' => (float) $line->amount,
                    ];
                })->values(),
            ];
        })->values();
    }

    public function salesByCustomerData($startDate = null, $endDate = null)
    {
        $query = DB::table('credit_invoices')
            ->join('customers', 'credit_invoices.customer_id', '=', 'customers.id')
            ->where('credit_invoices.status', 'posted');

        if ($startDate) {
            $query->whereBetween('credit_invoices.invoice_date', [$startDate, $endDate ?: date('Y-m-d')]);
        } else {
            $query->where('credit_invoices.invoice_date', '<=', $endDate ?: date('Y-m-d'));
        }

        return $query->select(
                'customers.display_name as customer_name',
                DB::raw('COUNT(credit_invoices.id) as invoice_count'),
                DB::raw('SUM(credit_invoices.total_amount) as total_amount')
            )
            ->groupBy('customers.id', 'customers.display_name')
            ->orderByDesc('total_amount')
            ->get();
    }

    public function purchaseByItemData($startDate = null, $endDate = null)
    {
        $billsQuery = DB::table('bill_items')
            ->join('bills', 'bill_items.bill_id', '=', 'bills.id')
            ->join('journal_entries', function($join) {
                $join->on('journal_entries.transactionable_id', '=', 'bills.id')
                     ->where('journal_entries.transactionable_type', '=', \App\Models\Accounting\Bill::class);
            })
            ->join('items', 'bill_items.item_id', '=', 'items.id')
            ->join('suppliers', 'bills.supplier_id', '=', 'suppliers.id')
            ->where('bills.status', 'posted');

        if ($startDate) {
            $billsQuery->whereBetween('bills.bill_date', [$startDate, $endDate ?: date('Y-m-d')]);
        } else {
            $billsQuery->where('bills.bill_date', '<=', $endDate ?: date('Y-m-d'));
        }

        $billsData = $billsQuery->select(
                'bill_items.id as line_id',
                'bill_items.quantity',
                'bill_items.rate',
                'bill_items.amount',
                'bills.bill_no as reference',
                'bills.bill_date as date',
                'items.id as item_id',
                'items.name as item_name',
                'items.sku as item_sku',
                'suppliers.display_name as supplier_name',
                'journal_entries.id as journal_entry_id',
                DB::raw("'Bill' as transaction_type")
            )->get();

        $expensesQuery = DB::table('payment_items')
            ->join('payments', 'payment_items.payment_id', '=', 'payments.id')
            ->join('journal_entries', function($join) {
                $join->on('journal_entries.transactionable_id', '=', 'payments.id')
                     ->where('journal_entries.transactionable_type', '=', \App\Models\Accounting\Payment::class);
            })
            ->join('items', 'payment_items.item_id', '=', 'items.id')
            ->leftJoin('suppliers', 'payments.payee_id', '=', 'suppliers.id')
            ->where('payments.status', 'posted');

        if ($startDate) {
            $expensesQuery->whereBetween('payments.payment_date', [$startDate, $endDate ?: date('Y-m-d')]);
        } else {
            $expensesQuery->where('payments.payment_date', '<=', $endDate ?: date('Y-m-d'));
        }

        $expensesData = $expensesQuery->select(
                'payment_items.id as line_id',
                'payment_items.quantity',
                'payment_items.rate',
                'payment_items.amount',
                'payments.expense_number as reference',
                'payments.payment_date as date',
                'items.id as item_id',
                'items.name as item_name',
                'items.sku as item_sku',
                'suppliers.display_name as supplier_name',
                'journal_entries.id as journal_entry_id',
                DB::raw("'Payment' as transaction_type")
            )->get();

        $allLines = $billsData->concat($expensesData)->sortBy('date')->values();

        return $allLines->groupBy('item_id')->map(function ($lines, $itemId) {
            $firstLine = $lines->first();
            return [
                'item' => [
                    'id' => $itemId,
                    'name' => $firstLine->item_name,
                    'sku' => $firstLine->item_sku,
                    'total_qty' => $lines->sum('quantity'),
                    'total_amount' => $lines->sum('amount'),
                ],
                'lines' => $lines->map(function ($line) {
                    return [
                        'id' => $line->line_id,
                        'journal_entry_id' => $line->journal_entry_id,
                        'date' => $line->date,
                        'transaction_type' => strtolower($line->transaction_type),
                        'reference' => $line->reference,
                        'contact_name' => $line->supplier_name,
                        'qty' => (float) $line->quantity,
                        'rate' => (float) $line->rate,
                        'amount' => (float) $line->amount,
                    ];
                })->values(),
            ];
        })->values();
    }

    public function purchaseBySupplierData($startDate = null, $endDate = null)
    {
        $billsQuery = DB::table('bills')
            ->join('suppliers', 'bills.supplier_id', '=', 'suppliers.id')
            ->where('bills.status', 'posted');

        if ($startDate) {
            $billsQuery->whereBetween('bills.bill_date', [$startDate, $endDate ?: date('Y-m-d')]);
        } else {
            $billsQuery->where('bills.bill_date', '<=', $endDate ?: date('Y-m-d'));
        }

        $billsData = $billsQuery->select(
                'suppliers.id as supplier_id',
                'suppliers.display_name as supplier_name',
                DB::raw('COUNT(bills.id) as tx_count'),
                DB::raw('SUM(bills.total_amount) as total_amount')
            )
            ->groupBy('suppliers.id', 'suppliers.display_name')
            ->get();

        $expensesQuery = DB::table('payments')
            ->join('suppliers', 'payments.payee_id', '=', 'suppliers.id')
            ->where('payments.payee_type', Supplier::class)
            ->where('payments.status', 'posted');

        if ($startDate) {
            $expensesQuery->whereBetween('payments.payment_date', [$startDate, $endDate ?: date('Y-m-d')]);
        } else {
            $expensesQuery->where('payments.payment_date', '<=', $endDate ?: date('Y-m-d'));
        }

        $expensesData = $expensesQuery->select(
                'suppliers.id as supplier_id',
                'suppliers.display_name as supplier_name',
                DB::raw('COUNT(payments.id) as tx_count'),
                DB::raw('SUM(payments.total_amount) as total_amount')
            )
            ->groupBy('suppliers.id', 'suppliers.display_name')
            ->get();

        $supplierMap = [];
        foreach ($billsData as $row) {
            $supplierMap[$row->supplier_id] = [
                'supplier_id' => $row->supplier_id,
                'supplier_name' => $row->supplier_name,
                'tx_count' => $row->tx_count,
                'total_amount' => $row->total_amount,
            ];
        }

        foreach ($expensesData as $row) {
            if (isset($supplierMap[$row->supplier_id])) {
                $supplierMap[$row->supplier_id]['tx_count'] += $row->tx_count;
                $supplierMap[$row->supplier_id]['total_amount'] += $row->total_amount;
            } else {
                $supplierMap[$row->supplier_id] = [
                    'supplier_id' => $row->supplier_id,
                    'supplier_name' => $row->supplier_name,
                    'tx_count' => $row->tx_count,
                    'total_amount' => $row->total_amount,
                ];
            }
        }

        return collect(array_values($supplierMap))->sortByDesc('total_amount')->values();
    }
}
