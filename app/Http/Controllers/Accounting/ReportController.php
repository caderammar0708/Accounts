<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Customer;
use App\Models\Supplier;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Accounting\SalesInvoice;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('Reports/Index');
    }
    private function buildAccountTree($types, $lines, $isBalanceSheet = false)
    {
        $allAccounts = ChartOfAcc::query()
            ->whereIn('account_type', $types)
            ->orderByRaw('FIELD(account_type, "Asset", "Liability", "Equity", "Income", "Expense")')
            ->orderBy('sub_type')
            ->orderBy('name')
            ->get();

        $accountBalances = [];
        foreach ($allAccounts as $account) {
            $line = $lines->get($account->id);
            $total_debit = $line ? $line->total_debit : 0;
            $total_credit = $line ? $line->total_credit : 0;

            $type = strtolower($account->account_type);
            if ($type === 'income' || $type === 'liability' || $type === 'equity') {
                $balance = $total_credit - $total_debit;
            } else if ($type === 'expense' || $type === 'asset') {
                $balance = $total_debit - $total_credit;
            } else {
                $balance = 0;
            }

            $accountBalances[$account->id] = [
                'id' => $account->id,
                'name' => $account->name,
                'account_type' => $type,
                'sub_type' => $account->sub_type,
                'parent_id' => $account->parent_id,
                'balance' => (float) $balance,
                'total_balance' => (float) $balance,
                'children' => []
            ];
        }

        $tree = [];
        // First pass, assign to parents
        foreach ($accountBalances as $id => &$node) {
            if ($node['parent_id'] && isset($accountBalances[$node['parent_id']])) {
                $accountBalances[$node['parent_id']]['children'][] = &$node;
            } else {
                $tree[] = &$node;
            }
        }

        // Helper to roll up balances
        $rollup = function(&$node) use (&$rollup) {
            $total = $node['balance'];
            foreach ($node['children'] as &$child) {
                $total += $rollup($child);
            }
            $node['total_balance'] = $total;
            return $total;
        };

        foreach ($tree as &$node) {
            $rollup($node);
        }

        // Filter out nodes with 0 total_balance to keep report clean
        $filterZero = function($nodes) use (&$filterZero) {
            $result = [];
            foreach ($nodes as $node) {
                $node['children'] = $filterZero($node['children']);
                if ($node['total_balance'] != 0 || count($node['children']) > 0) {
                    $result[] = $node;
                }
            }
            return $result;
        };

        $tree = $filterZero($tree);

        return collect($tree)->groupBy('account_type');
    }

    private function buildBalanceSheetTree($types, $lines, $displayBy, $months)
    {
        $allAccounts = ChartOfAcc::query()
            ->whereIn('account_type', $types)
            ->orderByRaw('FIELD(account_type, "Asset", "Liability", "Equity", "Income", "Expense")')
            ->orderBy('sub_type')
            ->orderBy('name')
            ->get();

        $accountBalances = [];
        foreach ($allAccounts as $account) {
            $accountLines = $lines->where('chart_of_acc_id', $account->id);
            $type = strtolower($account->account_type);

            $monthly_balances = [];
            $total_balance = 0;

            if ($displayBy === 'month') {
                $runningBalance = 0;
                foreach ($months as $month) {
                    $monthLine = $accountLines->firstWhere('month', $month);
                    $debit = $monthLine ? $monthLine->total_debit : 0;
                    $credit = $monthLine ? $monthLine->total_credit : 0;

                    if ($type === 'income' || $type === 'liability' || $type === 'equity') {
                        $runningBalance += ($credit - $debit);
                    } else {
                        $runningBalance += ($debit - $credit);
                    }

                    $monthly_balances[$month] = (float) $runningBalance;
                }
                $total_balance = $runningBalance;
            } else {
                $line = $accountLines->first();
                $debit = $line ? $line->total_debit : 0;
                $credit = $line ? $line->total_credit : 0;
                if ($type === 'income' || $type === 'liability' || $type === 'equity') {
                    $total_balance = $credit - $debit;
                } else {
                    $total_balance = $debit - $credit;
                }
            }

            $accountBalances[$account->id] = [
                'id' => $account->id,
                'name' => $account->name,
                'account_type' => $type,
                'sub_type' => $account->sub_type,
                'parent_id' => $account->parent_id,
                'balance' => (float) $total_balance,
                'total_balance' => (float) $total_balance,
                'monthly_balances' => $monthly_balances,
                'total_monthly_balances' => $monthly_balances,
                'children' => []
            ];
        }

        $tree = [];
        foreach ($accountBalances as $id => &$node) {
            if ($node['parent_id'] && isset($accountBalances[$node['parent_id']])) {
                $accountBalances[$node['parent_id']]['children'][] = &$node;
            } else {
                $tree[] = &$node;
            }
        }

        $rollup = function(&$node) use (&$rollup, $displayBy, $months) {
            $total = $node['balance'];
            $monthly = $node['monthly_balances'];

            foreach ($node['children'] as &$child) {
                $total += $rollup($child);
                if ($displayBy === 'month') {
                    foreach ($months as $m) {
                        $monthly[$m] = ($monthly[$m] ?? 0) + ($child['total_monthly_balances'][$m] ?? 0);
                    }
                }
            }

            $node['total_balance'] = $total;
            if ($displayBy === 'month') {
                $node['total_monthly_balances'] = $monthly;
            }
            return $total;
        };

        foreach ($tree as &$node) {
            $rollup($node);
        }

        $filterZero = function($nodes) use (&$filterZero) {
            $result = [];
            foreach ($nodes as $node) {
                $node['children'] = $filterZero($node['children']);
                if ($node['total_balance'] != 0 || count($node['children']) > 0) {
                    $result[] = $node;
                }
            }
            return $result;
        };

        $tree = $filterZero($tree);
        return collect($tree)->groupBy('account_type');
    }

    private function buildPnLTree($types, $lines, $displayBy, $months)
    {
        $allAccounts = ChartOfAcc::query()
            ->whereIn('account_type', $types)
            ->orderByRaw('FIELD(account_type, "Asset", "Liability", "Equity", "Income", "Expense")')
            ->orderBy('sub_type')
            ->orderBy('name')
            ->get();

        $accountBalances = [];
        foreach ($allAccounts as $account) {
            $accountLines = $lines->where('chart_of_acc_id', $account->id);
            $type = strtolower($account->account_type);

            $monthly_balances = [];
            $total_balance = 0;

            if ($displayBy === 'month') {
                foreach ($months as $month) {
                    $monthLine = $accountLines->firstWhere('month', $month);
                    $debit = $monthLine ? $monthLine->total_debit : 0;
                    $credit = $monthLine ? $monthLine->total_credit : 0;

                    if ($type === 'income') {
                        $balance = $credit - $debit;
                    } else {
                        $balance = $debit - $credit;
                    }
                    $monthly_balances[$month] = (float) $balance;
                    $total_balance += $balance;
                }
            } else {
                $line = $accountLines->first();
                $debit = $line ? $line->total_debit : 0;
                $credit = $line ? $line->total_credit : 0;
                if ($type === 'income') {
                    $total_balance = $credit - $debit;
                } else {
                    $total_balance = $debit - $credit;
                }
            }

            $accountBalances[$account->id] = [
                'id' => $account->id,
                'name' => $account->name,
                'account_type' => $type,
                'sub_type' => $account->sub_type,
                'parent_id' => $account->parent_id,
                'balance' => (float) $total_balance,
                'total_balance' => (float) $total_balance,
                'monthly_balances' => $monthly_balances,
                'total_monthly_balances' => $monthly_balances,
                'children' => []
            ];
        }

        $tree = [];
        foreach ($accountBalances as $id => &$node) {
            if ($node['parent_id'] && isset($accountBalances[$node['parent_id']])) {
                $accountBalances[$node['parent_id']]['children'][] = &$node;
            } else {
                $tree[] = &$node;
            }
        }

        $rollup = function(&$node) use (&$rollup, $displayBy, $months) {
            $total = $node['balance'];
            $monthly = $node['monthly_balances'];

            foreach ($node['children'] as &$child) {
                $total += $rollup($child);
                if ($displayBy === 'month') {
                    foreach ($months as $m) {
                        $monthly[$m] = ($monthly[$m] ?? 0) + ($child['total_monthly_balances'][$m] ?? 0);
                    }
                }
            }
            $node['total_balance'] = $total;
            if ($displayBy === 'month') {
                $node['total_monthly_balances'] = $monthly;
            }
            return $total;
        };

        foreach ($tree as &$node) {
            $rollup($node);
        }

        $filterZero = function($nodes) use (&$filterZero) {
            $result = [];
            foreach ($nodes as $node) {
                $node['children'] = $filterZero($node['children']);
                if ($node['total_balance'] != 0 || count($node['children']) > 0) {
                    $result[] = $node;
                }
            }
            return $result;
        };

        $tree = $filterZero($tree);

        return collect($tree)->groupBy(function ($item) {
            if ($item['sub_type'] === 'cost-of-goods-sold') {
                return 'cogs';
            }
            return $item['account_type'];
        });
    }

    public function profitAndLoss(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $displayBy = $request->query('display_by', 'total');

        if (!$request->has('start_date') && !$request->has('end_date')) {
            $startDate = now()->startOfMonth()->toDateString();
            $endDate = now()->endOfMonth()->toDateString();
        }

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            
            ->select(
                'journal_entry_lines.chart_of_acc_id',
                DB::raw('SUM(journal_entry_lines.debit) as total_debit'),
                DB::raw('SUM(journal_entry_lines.credit) as total_credit')
            );

        if ($startDate) {
            $query->where('journal_entries.date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        if ($displayBy === 'month') {
            $query->addSelect(DB::raw('DATE_FORMAT(journal_entries.date, "%Y-%m") as month'))
                  ->groupBy('journal_entry_lines.chart_of_acc_id', 'month');
        } else {
            $query->groupBy('journal_entry_lines.chart_of_acc_id');
        }

        $lines = $query->get();

        $months = [];
        if ($displayBy === 'month') {
            $actualStart = $startDate ? \Carbon\Carbon::parse($startDate) : ($lines->min('month') ? \Carbon\Carbon::createFromFormat('Y-m', $lines->min('month')) : now());
            $actualEnd = $endDate ? \Carbon\Carbon::parse($endDate) : ($lines->max('month') ? \Carbon\Carbon::createFromFormat('Y-m', $lines->max('month')) : now());
            
            $start = $actualStart->copy()->startOfMonth();
            $end = $actualEnd->copy()->startOfMonth();
            while ($start->lte($end)) {
                $months[] = $start->format('Y-m');
                $start->addMonth();
            }
        }

        $reportData = $this->buildPnLTree(['income', 'expense'], $lines, $displayBy, $months);

        return Inertia::render('Reports/ProfitAndLoss', [
            'reportData' => $reportData,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'display_by' => $displayBy,
                'months' => $months
            ]
        ]);
    }

    public function balanceSheet(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $displayBy = $request->query('display_by', 'total');

        if (!$request->has('start_date') && !$request->has('end_date')) {
            $startDate = now()->startOfMonth()->toDateString();
            $endDate = now()->endOfMonth()->toDateString();
        }

        $endDate = $endDate !== null && $endDate !== '' ? $endDate : now()->toDateString();

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->select(
                'journal_entry_lines.chart_of_acc_id',
                DB::raw('SUM(journal_entry_lines.debit) as total_debit'),
                DB::raw('SUM(journal_entry_lines.credit) as total_credit')
            );

        if ($startDate) {
            $query->where('journal_entries.date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        if ($displayBy === 'month') {
            $query->addSelect(DB::raw('DATE_FORMAT(journal_entries.date, "%Y-%m") as month'))
                  ->groupBy('journal_entry_lines.chart_of_acc_id', 'month');
        } else {
            $query->groupBy('journal_entry_lines.chart_of_acc_id');
        }

        $lines = $query->get();

        $months = [];
        if ($displayBy === 'month') {
            $actualStart = $startDate ? \Carbon\Carbon::parse($startDate) : ($lines->min('month') ? \Carbon\Carbon::createFromFormat('Y-m', $lines->min('month')) : now());
            $actualEnd = $endDate ? \Carbon\Carbon::parse($endDate) : ($lines->max('month') ? \Carbon\Carbon::createFromFormat('Y-m', $lines->max('month')) : now());

            $start = $actualStart->copy()->startOfMonth();
            $end = $actualEnd->copy()->startOfMonth();
            while ($start->lte($end)) {
                $months[] = $start->format('Y-m');
                $start->addMonth();
            }
        }

        $reportData = $this->buildBalanceSheetTree(['asset', 'liability', 'equity'], $lines, $displayBy, $months);

        $fiscalYearStart = \Carbon\Carbon::parse($endDate)->startOfYear()->toDateString();

        // 1. Prior Years Net Income (Retained Earnings)
        $priorNetIncomeResult = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            
            ->where('journal_entries.date', '<', $fiscalYearStart)
            ->whereIn('chart_of_accs.account_type', ['income', 'expense'])
            ->select(
                DB::raw('SUM(CASE WHEN chart_of_accs.account_type = "income" THEN journal_entry_lines.credit - journal_entry_lines.debit ELSE journal_entry_lines.credit - journal_entry_lines.debit END) as retained_earnings')
            )->first();

        $retainedEarningsAmount = $priorNetIncomeResult ? (float) $priorNetIncomeResult->retained_earnings : 0;

        // 2. Current Year Net Income
        $currentNetIncomeResult = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            
            ->whereBetween('journal_entries.date', [$fiscalYearStart, $endDate])
            ->whereIn('chart_of_accs.account_type', ['income', 'expense'])
            ->select(
                DB::raw('SUM(CASE WHEN chart_of_accs.account_type = "income" THEN journal_entry_lines.credit - journal_entry_lines.debit ELSE journal_entry_lines.credit - journal_entry_lines.debit END) as net_income')
            )->first();

        $netIncomeAmount = $currentNetIncomeResult ? (float) $currentNetIncomeResult->net_income : 0;

        $equity = $reportData->get('equity', collect());

        if ($retainedEarningsAmount != 0) {
            // Find existing retained earnings if any
            $existingReIdx = $equity->search(function ($item) {
                return strtolower($item['name']) === 'retained earnings';
            });

            if ($existingReIdx !== false) {
                $item = $equity->get($existingReIdx);
                $item['balance'] += $retainedEarningsAmount;
                $item['total_balance'] += $retainedEarningsAmount;
                $equity->put($existingReIdx, $item);
            } else {
                $equity->push([
                    'id' => 'retained_earnings_computed',
                    'name' => 'Retained Earnings',
                    'account_type' => 'equity',
                    'sub_type' => '',
                    'parent_id' => null,
                    'balance' => $retainedEarningsAmount,
                    'total_balance' => $retainedEarningsAmount,
                    'children' => []
                ]);
            }
        }

        if ($netIncomeAmount != 0) {
            $equity->push([
                'id' => 'net_income_computed',
                'name' => 'Net Income',
                'account_type' => 'equity',
                'sub_type' => '',
                'parent_id' => null,
                'balance' => $netIncomeAmount,
                'total_balance' => $netIncomeAmount,
                'children' => []
            ]);
        }

        $reportData->put('equity', $equity);

        return Inertia::render('Reports/BalanceSheet', [
            'reportData' => $reportData,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'display_by' => $displayBy,
                'months' => $months
            ]
        ]);
    }

    public function customerBalance(Request $request)
    {
        $endDate = $request->query('end_date');
        $endDate = $endDate !== null && $endDate !== '' ? $endDate : now()->toDateString();

        $customers = Customer::query()->get();

        $lines = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            
            ->where('journal_entries.payee_type', Customer::class)
            ->where('chart_of_accs.sub_type', 'accounts-receivable')
            ->where('journal_entries.date', '<=', $endDate)
            ->select(
                'journal_entries.payee_id',
                DB::raw('SUM(journal_entry_lines.debit) as total_debit'),
                DB::raw('SUM(journal_entry_lines.credit) as total_credit')
            )
            ->groupBy('journal_entries.payee_id')
            ->get()
            ->keyBy('payee_id');

        $reportData = $customers->map(function ($customer) use ($lines) {
            $line = $lines->get($customer->id);
            $balance = $customer->opening_balance ?? 0;
            if ($line) {
                $balance += ($line->total_debit - $line->total_credit);
            }

            return [
                'id' => $customer->id,
                'name' => $customer->display_name ?: $customer->company_name,
                'email' => $customer->email,
                'phone' => $customer->phone_number,
                'balance' => (float) $balance
            ];
        })->filter(function ($item) {
            return $item['balance'] != 0;
        })->values();

        return Inertia::render('Reports/CustomerBalance', [
            'reportData' => $reportData,
            'filters' => [
                'end_date' => $endDate
            ]
        ]);
    }

    public function supplierBalance(Request $request)
    {
        $endDate = $request->query('end_date');
        $endDate = $endDate !== null && $endDate !== '' ? $endDate : now()->toDateString();
        $suppliers = Supplier::query()->get();

        $lines = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            
            ->where('journal_entries.payee_type', Supplier::class)
            ->where('chart_of_accs.sub_type', 'accounts-payable')
            ->where('journal_entries.date', '<=', $endDate)
            ->select(
                'journal_entries.payee_id',
                DB::raw('SUM(journal_entry_lines.debit) as total_debit'),
                DB::raw('SUM(journal_entry_lines.credit) as total_credit')
            )
            ->groupBy('journal_entries.payee_id')
            ->get()
            ->keyBy('payee_id');

        $reportData = $suppliers->map(function ($supplier) use ($lines) {
            $line = $lines->get($supplier->id);
            $balance = $supplier->opening_balance ?? 0;
            // Liability: Credit - Debit
            if ($line) {
                $balance += ($line->total_credit - $line->total_debit);
            }

            return [
                'id' => $supplier->id,
                'name' => $supplier->display_name ?: $supplier->company_name,
                'email' => $supplier->email,
                'phone' => $supplier->phone_number,
                'balance' => (float) $balance
            ];
        })->filter(function ($item) {
            return $item['balance'] != 0;
        })->values();

        return Inertia::render('Reports/SupplierBalance', [
            'reportData' => $reportData,
            'filters' => [
                'end_date' => $endDate
            ]
        ]);
    }

    public function customerDetail(Request $request, Customer $customer)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date', now()->toDateString());

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            
            ->where('journal_entries.payee_type', Customer::class)
            ->where('journal_entries.payee_id', $customer->id)
            ->where('chart_of_accs.sub_type', 'accounts-receivable');

        if ($startDate) {
            $query->whereBetween('journal_entries.date', [$startDate, $endDate]);
        } else {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        $lines = $query->orderBy('journal_entries.date', 'asc')
            ->orderBy('journal_entries.id', 'asc')
            ->select('journal_entry_lines.*', 'journal_entries.date', 'journal_entries.reference', 'journal_entries.transaction_type', 'journal_entries.due_date')
            ->get();

        return Inertia::render('Reports/ContactBalanceDetail', [
            'contact' => $customer,
            'contactType' => 'Customer',
            'lines' => $lines,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate
            ]
        ]);
    }

    public function supplierDetail(Request $request, Supplier $supplier)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date', now()->toDateString());

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            
            ->where('journal_entries.payee_type', Supplier::class)
            ->where('journal_entries.payee_id', $supplier->id)
            ->where('chart_of_accs.sub_type', 'accounts-payable');

        if ($startDate) {
            $query->whereBetween('journal_entries.date', [$startDate, $endDate]);
        } else {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        $lines = $query->orderBy('journal_entries.date', 'asc')
            ->orderBy('journal_entries.id', 'asc')
            ->select('journal_entry_lines.*', 'journal_entries.date', 'journal_entries.reference', 'journal_entries.transaction_type', 'journal_entries.due_date')
            ->get();

        return Inertia::render('Reports/ContactBalanceDetail', [
            'contact' => $supplier,
            'contactType' => 'Supplier',
            'lines' => $lines,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate
            ]
        ]);
    }

    public function inventorySummary(Request $request)
    {
                $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $itemsQuery = \App\Models\Item::with('category')
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
            
            $items = $itemsQuery->map(function ($item) use ($allLines) {
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
        } else {
            $items = $itemsQuery;
        }

        $billQuery = DB::table('bill_items')
            ->join('bills', 'bill_items.bill_id', '=', 'bills.id')
            ->where('bills.status', 'posted');
        if ($endDate) {
            $billQuery->where('bills.bill_date', '<=', $endDate);
        }
        $billData = $billQuery->groupBy('item_id')
            ->selectRaw('item_id, SUM(quantity) as qty, SUM(quantity * rate) as val')
            ->get()->keyBy('item_id');

        $expenseQuery = DB::table('payment_items')
            ->join('payments', 'payment_items.payment_id', '=', 'payments.id')
            ->where('payments.status', 'posted');
        if ($endDate) {
            $expenseQuery->where('payments.payment_date', '<=', $endDate);
        }
        $expenseData = $expenseQuery->groupBy('item_id')
            ->selectRaw('item_id, SUM(quantity) as qty, SUM(quantity * rate) as val')
            ->get()->keyBy('item_id');

        $invoiceQuery = DB::table('credit_invoice_items')
            ->join('credit_invoices', 'credit_invoice_items.credit_invoice_id', '=', 'credit_invoices.id')
            ->where('credit_invoices.status', 'posted');
        if ($endDate) {
            $invoiceQuery->where('credit_invoices.invoice_date', '<=', $endDate);
        }
        $invoiceData = $invoiceQuery->groupBy('item_id')
            ->selectRaw('item_id, SUM(quantity) as qty')
            ->get()->keyBy('item_id');

        $receiptQuery = DB::table('sales_invoice_items')
            ->join('sales_invoices', 'sales_invoice_items.sales_invoice_id', '=', 'sales_invoices.id')
            ->where('sales_invoices.status', 'posted');
        if ($endDate) {
            $receiptQuery->where('sales_invoices.invoice_date', '<=', $endDate);
        }
        $receiptData = $receiptQuery->groupBy('item_id')
            ->selectRaw('item_id, SUM(quantity) as qty')
            ->get()->keyBy('item_id');

        $creditQuery = DB::table('bill_return_items')
            ->join('bill_returns', 'bill_return_items.bill_return_id', '=', 'bill_returns.id')
            ->where('bill_returns.status', 'posted');
        if ($endDate) {
            $creditQuery->where('bill_returns.return_date', '<=', $endDate);
        }
        $creditData = $creditQuery->groupBy('item_id')
            ->selectRaw('item_id, SUM(quantity) as qty')
            ->get()->keyBy('item_id');

        $adjQuery = DB::table('inventory_quantity_adjustment_items')
            ->join('inventory_quantity_adjustments', 'inventory_quantity_adjustment_items.inventory_quantity_adjustment_id', '=', 'inventory_quantity_adjustments.id');
        if ($endDate) {
            $adjQuery->where('inventory_quantity_adjustments.date', '<=', $endDate);
        }
        $adjData = $adjQuery->groupBy('item_id')
            ->selectRaw('item_id, SUM(change_in_qty) as qty')
            ->get()->keyBy('item_id');

        $mappedItems = $items->map(function ($item) use ($billData, $expenseData, $invoiceData, $receiptData, $creditData, $adjData) {
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
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'category' => $item->category ? $item->category->name : 'Uncategorized',
                'qty_on_hand' => (float)$item->quantity_on_hand,
                'avg_cost' => (float)$calculatedAvgCost,
                'asset_value' => (float)($item->quantity_on_hand * $calculatedAvgCost),
            ];
        });

        // Group by category name
        $groupedData = $mappedItems->groupBy('category')->map(function ($catItems, $categoryName) {
            return [
                'category' => $categoryName,
                'items' => $catItems->values(),
            ];
        })->values();

        return Inertia::render('Reports/InventorySummary', [
            'reportData' => $groupedData,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate ?? '',
                'type' => $request->query('type') ?? 'custom'
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

        $query = DB::table('journal_entries')
            ->join('journal_entry_lines', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            
            ->where('chart_of_accs.sub_type', 'inventory')
            ->where('journal_entry_lines.memo', 'like', '%' . $item->name . '%');

        if ($startDate) {
            $query->whereBetween('journal_entries.date', [$startDate, $endDate]);
        } else {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        $lines = $query->select('journal_entry_lines.*', 'journal_entries.date', 'journal_entries.reference', 'journal_entries.transaction_type')
            ->orderBy('journal_entries.date', 'asc')
            ->orderBy('journal_entries.id', 'asc')
            ->get()
            ->map(function ($line) use ($item) {
                // Approximate quantity change based on cost
                $qtyChange = 0;
                if ($item->purchase_price > 0) {
                    if ($line->debit > 0) {
                        $qtyChange = $line->debit / $item->purchase_price;
                    } else if ($line->credit > 0) {
                        $qtyChange = -($line->credit / $item->purchase_price);
                    }
                }

                return [
                    'id' => $line->id,
                    'date' => $line->date,
                    'transaction_type' => $line->transaction_type,
                    'reference' => $line->reference,
                    'memo' => $line->memo,
                    'qty_change' => round($qtyChange, 2),
                    'debit' => (float)$line->debit,
                    'credit' => (float)$line->credit,
                ];
            });

        return Inertia::render('Reports/InventoryDetail', [
            'item' => [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
            ],
            'lines' => $lines,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate
            ]
        ]);
    }

    public function inventoryDetailAll(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: date('Y-m-d');

        $items = \App\Models\Item::query()
            ->where('track_inventory', true)
            ->orderBy('name')
            ->get();

        $query = DB::table('journal_entries')
            ->join('journal_entry_lines', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            ->where('chart_of_accs.sub_type', 'inventory');

        if ($startDate) {
            $query->whereBetween('journal_entries.date', [$startDate, $endDate]);
        } else {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        $allLines = $query->select('journal_entry_lines.*', 'journal_entries.date', 'journal_entries.reference', 'journal_entries.transaction_type')
            ->orderBy('journal_entries.date', 'asc')
            ->orderBy('journal_entries.id', 'asc')
            ->get();

        $openingLines = collect();
        if ($startDate) {
            $openingLines = DB::table('journal_entries')
                ->join('journal_entry_lines', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
                ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
                ->where('chart_of_accs.sub_type', 'inventory')
                ->where('journal_entries.date', '<', $startDate)
                ->select('journal_entry_lines.memo', 'journal_entry_lines.debit', 'journal_entry_lines.credit')
                ->get();
        }

        $reportData = $items->map(function ($item) use ($allLines, $openingLines, $startDate) {
            $openingQty = 0;
            if ($startDate) {
                $itemOpeningLines = $openingLines->filter(function ($line) use ($item) {
                    return stripos($line->memo, $item->name) !== false;
                });
                if ($item->purchase_price > 0) {
                    foreach ($itemOpeningLines as $line) {
                        if ($line->debit > 0) {
                            $openingQty += $line->debit / $item->purchase_price;
                        } else if ($line->credit > 0) {
                            $openingQty -= $line->credit / $item->purchase_price;
                        }
                    }
                }
            }

            $itemLines = $allLines->filter(function ($line) use ($item) {
                return stripos($line->memo, $item->name) !== false;
            })->values()->map(function ($line) use ($item) {
                $qtyChange = 0;
                if ($item->purchase_price > 0) {
                    if ($line->debit > 0) {
                        $qtyChange = $line->debit / $item->purchase_price;
                    } else if ($line->credit > 0) {
                        $qtyChange = -($line->credit / $item->purchase_price);
                    }
                }
                return [
                    'id' => $line->id,
                    'date' => $line->date,
                    'transaction_type' => $line->transaction_type,
                    'reference' => $line->reference,
                    'memo' => $line->memo,
                    'qty_change' => round($qtyChange, 2),
                    'debit' => (float)$line->debit,
                    'credit' => (float)$line->credit,
                    'rate' => (float)$item->purchase_price
                ];
            });

            return [
                'item' => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'purchase_price' => (float)$item->purchase_price,
                    'opening_qty' => round($openingQty, 2),
                    'opening_value' => round($openingQty * $item->purchase_price, 2),
                    'qty_on_hand' => (float)$item->quantity_on_hand,
                    'asset_value' => (float)($item->quantity_on_hand * $item->purchase_price),
                ],
                'lines' => $itemLines
            ];
        })->filter(function ($group) {
            return $group['lines']->isNotEmpty() || $group['item']['qty_on_hand'] > 0 || $group['item']['opening_qty'] != 0;
        })->values();

        return Inertia::render('Reports/AllInventoryDetail', [
            'reportData' => $reportData,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'type' => $request->query('type') ?? 'custom'
            ]
        ]);
    }

    public function salesByItem(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: date('Y-m-d');
        
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
            $query->where('credit_invoices.invoice_date', '<=', $endDate);
        }

        $allLines = $query->select(
                'credit_invoice_items.id as line_id',
                'credit_invoice_items.quantity',
                'credit_invoice_items.rate',
                'credit_invoice_items.amount',
                'credit_invoices.invoice_number as reference',
                'credit_invoices.invoice_date as date',
                'items.id as item_id',
                'items.name as item_name',
                'items.sku as item_sku',
                'customers.display_name as customer_name',
                'journal_entries.id as journal_entry_id'
            )
            ->orderBy('credit_invoices.invoice_date', 'asc')
            ->get();
            
        // Group by item_id
        $reportData = $allLines->groupBy('item_id')->map(function ($lines, $itemId) {
            $firstLine = $lines->first();
            $totalQty = $lines->sum('quantity');
            $totalAmount = $lines->sum('amount');
            return [
                'item' => [
                    'id' => $itemId,
                    'name' => $firstLine->item_name,
                    'sku' => $firstLine->item_sku,
                    'total_qty' => $totalQty,
                    'total_amount' => $totalAmount,
                ],
                'lines' => $lines->map(function ($line) {
                    return [
                        'id' => $line->line_id,
                        'journal_entry_id' => $line->journal_entry_id,
                        'date' => $line->date,
                        'transaction_type' => 'credit_invoice',
                        'reference' => $line->reference,
                        'contact_name' => $line->customer_name,
                        'qty' => (float)$line->quantity,
                        'rate' => (float)$line->rate,
                        'amount' => (float)$line->amount
                    ];
                })->values()
            ];
        })->values()->sortByDesc('item.total_amount')->values();

        return Inertia::render('Reports/SalesByItem', [
            'reportData' => $reportData,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'type' => $request->query('type') ?? 'custom'
            ]
        ]);
    }

    public function salesByCustomer(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: date('Y-m-d');
        
        $query = DB::table('credit_invoices')
            ->join('customers', 'credit_invoices.customer_id', '=', 'customers.id')
            
            ->where('credit_invoices.status', 'posted');

        if ($startDate) {
            $query->whereBetween('credit_invoices.invoice_date', [$startDate, $endDate]);
        } else {
            $query->where('credit_invoices.invoice_date', '<=', $endDate);
        }

        $reportData = $query->select(
                'customers.display_name as customer_name',
                DB::raw('COUNT(credit_invoices.id) as invoice_count'),
                DB::raw('SUM(credit_invoices.total_amount) as total_amount')
            )
            ->groupBy('customers.id', 'customers.display_name')
            ->orderByDesc('total_amount')
            ->get();

        return Inertia::render('Reports/SalesByCustomer', [
            'reportData' => $reportData,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'type' => $request->query('type') ?? 'custom'
            ]
        ]);
    }

    public function purchaseByItem(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: date('Y-m-d');
        
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
            $billsQuery->whereBetween('bills.bill_date', [$startDate, $endDate]);
        } else {
            $billsQuery->where('bills.bill_date', '<=', $endDate);
        }

        $billsData = $billsQuery->select(
                'bill_items.id as line_id',
                'bill_items.quantity',
                'bill_items.rate',
                'bill_items.amount',
                'bills.bill_number as reference',
                'bills.bill_date as date',
                'items.id as item_id',
                'items.name as item_name',
                'items.sku as item_sku',
                'suppliers.display_name as supplier_name',
                'journal_entries.id as journal_entry_id',
                DB::raw("'Bill' as transaction_type")
            )->get();

        // Expenses
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
            $expensesQuery->whereBetween('payments.payment_date', [$startDate, $endDate]);
        } else {
            $expensesQuery->where('payments.payment_date', '<=', $endDate);
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

        // Group by item_id
        $reportData = $allLines->groupBy('item_id')->map(function ($lines, $itemId) {
            $firstLine = $lines->first();
            $totalQty = $lines->sum('quantity');
            $totalAmount = $lines->sum('amount');
            return [
                'item' => [
                    'id' => $itemId,
                    'name' => $firstLine->item_name,
                    'sku' => $firstLine->item_sku,
                    'total_qty' => $totalQty,
                    'total_amount' => $totalAmount,
                ],
                'lines' => $lines->map(function ($line) {
                    return [
                        'id' => $line->line_id,
                        'journal_entry_id' => $line->journal_entry_id,
                        'date' => $line->date,
                        'transaction_type' => strtolower($line->transaction_type),
                        'reference' => $line->reference,
                        'contact_name' => $line->supplier_name,
                        'qty' => (float)$line->quantity,
                        'rate' => (float)$line->rate,
                        'amount' => (float)$line->amount
                    ];
                })->values()
            ];
        })->values()->sortByDesc('item.total_amount')->values();

        return Inertia::render('Reports/PurchaseByItem', [
            'reportData' => $reportData,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'type' => $request->query('type') ?? 'custom'
            ]
        ]);
    }

    public function purchaseBySupplier(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: date('Y-m-d');
        
        // Purchases by supplier usually includes Bills and Expenses
        $billsQuery = DB::table('bills')
            ->join('suppliers', 'bills.supplier_id', '=', 'suppliers.id')
            
            ->where('bills.status', 'posted');

        if ($startDate) {
            $billsQuery->whereBetween('bills.bill_date', [$startDate, $endDate]);
        } else {
            $billsQuery->where('bills.bill_date', '<=', $endDate);
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
            
            ->where('payments.payee_type', \App\Models\Supplier::class)
            ->where('payments.status', 'posted');

        if ($startDate) {
            $expensesQuery->whereBetween('payments.payment_date', [$startDate, $endDate]);
        } else {
            $expensesQuery->where('payments.payment_date', '<=', $endDate);
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
                    'supplier_name' => $row->supplier_name,
                    'tx_count' => $row->tx_count,
                    'total_amount' => $row->total_amount,
                ];
            }
        }

        $reportData = collect(array_values($supplierMap))->sortByDesc('total_amount')->values();

        return Inertia::render('Reports/PurchaseBySupplier', [
            'reportData' => $reportData,
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'type' => $request->query('type') ?? 'custom'
            ]
        ]);
    }

    public function customerBalanceDetailAll(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date', now()->toDateString());

        $customers = Customer::query()->get();

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            
            ->where('journal_entries.payee_type', Customer::class)
            ->where('chart_of_accs.sub_type', 'accounts-receivable');

        if ($startDate) {
            $query->whereBetween('journal_entries.date', [$startDate, $endDate]);
        } else {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        $allLines = $query->orderBy('journal_entries.date', 'asc')
            ->orderBy('journal_entries.id', 'asc')
            ->select('journal_entry_lines.*', 'journal_entries.date', 'journal_entries.reference', 'journal_entries.transaction_type', 'journal_entries.due_date', 'journal_entries.payee_id')
            ->get()
            ->groupBy('payee_id');

        $reportData = $customers->map(function ($customer) use ($allLines) {
            $lines = $allLines->get($customer->id, collect());
            return [
                'contact' => $customer,
                'lines' => $lines
            ];
        })->filter(function ($group) {
            return $group['lines']->isNotEmpty() || ($group['contact']->opening_balance > 0);
        })->values();

        return Inertia::render('Reports/AllContactBalanceDetail', [
            'reportData' => $reportData,
            'contactType' => 'Customer',
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'type' => $request->query('type') ?? 'custom'
            ]
        ]);
    }

    public function supplierBalanceDetailAll(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date', now()->toDateString());

        $suppliers = Supplier::query()->get();

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            
            ->where('journal_entries.payee_type', Supplier::class)
            ->where('chart_of_accs.sub_type', 'accounts-payable');

        if ($startDate) {
            $query->whereBetween('journal_entries.date', [$startDate, $endDate]);
        } else {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        $allLines = $query->orderBy('journal_entries.date', 'asc')
            ->orderBy('journal_entries.id', 'asc')
            ->select('journal_entry_lines.*', 'journal_entries.date', 'journal_entries.reference', 'journal_entries.transaction_type', 'journal_entries.due_date', 'journal_entries.payee_id')
            ->get()
            ->groupBy('payee_id');

        $reportData = $suppliers->map(function ($supplier) use ($allLines) {
            $lines = $allLines->get($supplier->id, collect());
            return [
                'contact' => $supplier,
                'lines' => $lines
            ];
        })->filter(function ($group) {
            return $group['lines']->isNotEmpty() || ($group['contact']->opening_balance > 0);
        })->values();

        return Inertia::render('Reports/AllContactBalanceDetail', [
            'reportData' => $reportData,
            'contactType' => 'Supplier',
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate,
                'type' => $request->query('type') ?? 'custom'
            ]
        ]);
    }

    public function vehicleHistory(Request $request)
    {
        abort_if(!class_exists(\App\Models\CompanySetting::class) || !(\App\Models\CompanySetting::first()?->vehicles_enabled ?? true), 403, 'Vehicles feature is disabled.');

        $vehicleId = $request->query('vehicle_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = SalesInvoice::with(['items.item', 'vehicle', 'customer'])
            ->whereNotNull('vehicle_id');

        if ($vehicleId) {
            $query->where('vehicle_id', $vehicleId);
        }
        if ($startDate) {
            $query->where('receipt_date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('receipt_date', '<=', $endDate);
        }

        $receipts = $query->orderBy('receipt_date', 'desc')->get();

        return Inertia::render('Reports/VehicleHistory', [
            'receipts' => $receipts,
            'filters' => $request->all()
        ]);
    }
}
