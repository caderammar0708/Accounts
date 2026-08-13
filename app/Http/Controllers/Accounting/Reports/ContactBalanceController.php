<?php

namespace App\Http\Controllers\Accounting\Reports;

use App\Http\Controllers\Controller;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Customer;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ContactBalanceController extends Controller
{
    public function customerBalance(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $endDate = $endDate !== null && $endDate !== '' ? $endDate : now()->toDateString();
        $displayBy = $request->query('display_by', 'total');

        $customers = Customer::query()->get();

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            ->where('journal_entries.payee_type', Customer::class)
            ->where('chart_of_accs.sub_type', 'accounts-receivable')
            ->where('journal_entries.date', '<=', $endDate);

        $months = [];
        if ($displayBy === 'month') {
            $minDate = $startDate ?: (clone $query)->min('journal_entries.date') ?: $endDate;
            $startDt = new \DateTime(substr($minDate, 0, 7) . '-01');
            $endDt = new \DateTime(substr($endDate, 0, 7) . '-01');
            while ($startDt <= $endDt) {
                $months[] = $startDt->format('Y-m');
                $startDt->modify('+1 month');
            }

            $lines = $query->select(
                    'journal_entries.payee_id',
                    DB::raw('SUBSTRING(journal_entries.date, 1, 7) as month'),
                    DB::raw('SUM(journal_entry_lines.debit) as total_debit'),
                    DB::raw('SUM(journal_entry_lines.credit) as total_credit')
                )
                ->groupBy('journal_entries.payee_id', DB::raw('SUBSTRING(journal_entries.date, 1, 7)'))
                ->get();

            $linesByCustomer = $lines->groupBy('payee_id');

            $reportData = $customers->map(function ($customer) use ($linesByCustomer, $months) {
                $customerLines = $linesByCustomer->get($customer->id, collect());
                
                $monthlyBalances = [];
                $cumulative = $customer->opening_balance ?? 0;
                
                // First calculate cumulative balance before the first month
                if (!empty($months)) {
                    $firstMonth = $months[0];
                    foreach ($customerLines as $cl) {
                        if ($cl->month < $firstMonth) {
                            $cumulative += ($cl->total_debit - $cl->total_credit);
                        }
                    }
                }

                // Now calculate cumulative balance for each month
                foreach ($months as $m) {
                    foreach ($customerLines as $cl) {
                        if ($cl->month === $m) {
                            $cumulative += ($cl->total_debit - $cl->total_credit);
                        }
                    }
                    $monthlyBalances[$m] = $cumulative;
                }
                
                // Final balance
                $finalBalance = $customer->opening_balance ?? 0;
                foreach ($customerLines as $cl) {
                    $finalBalance += ($cl->total_debit - $cl->total_credit);
                }

                return [
                    'id' => $customer->id,
                    'name' => $customer->display_name ?: $customer->company_name,
                    'email' => $customer->email,
                    'phone' => $customer->phone_number,
                    'balance' => (float) $finalBalance,
                    'monthly_balances' => $monthlyBalances,
                ];
            })->filter(function ($item) {
                return $item['balance'] != 0;
            })->values();

        } else {
            $lines = $query->select(
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
                    'balance' => (float) $balance,
                ];
            })->filter(function ($item) {
                return $item['balance'] != 0;
            })->values();
        }

        return Inertia::render('Reports/CustomerBalance', [
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
            ->select(
                'journal_entry_lines.*',
                'journal_entries.date',
                'journal_entries.reference',
                'journal_entries.transaction_type',
                'journal_entries.due_date',
                'journal_entries.payee_id',
                'journal_entries.id as journal_entry_id',
                'journal_entries.description as memo'
            )
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
                'type' => $request->query('type')
            ]
        ]);
    }

    public function customerDetail(Request $request, $customerId)
    {
        $customer = Customer::findOrFail($customerId);
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date', now()->toDateString());

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            ->where('journal_entries.payee_type', Customer::class)
            ->where('journal_entries.payee_id', $customerId)
            ->where('chart_of_accs.sub_type', 'accounts-receivable');

        if ($startDate) {
            $query->whereBetween('journal_entries.date', [$startDate, $endDate]);
        } else {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        $lines = $query
            ->orderBy('journal_entries.date', 'asc')
            ->orderBy('journal_entries.id', 'asc')
            ->select(
                'journal_entry_lines.*',
                'journal_entries.date',
                'journal_entries.due_date',
                'journal_entries.reference',
                'journal_entries.transaction_type',
                'journal_entries.payee_id',
                'journal_entries.id as journal_entry_id',
                'journal_entries.description as memo'
            )
            ->get();

        return Inertia::render('Reports/ContactBalanceDetail', [
            'contact'     => $customer,
            'contactType' => 'Customer',
            'lines'       => $lines,
            'filters'     => [
                'start_date' => $startDate ?? '',
                'end_date'   => $endDate,
                'type'       => $request->query('type'),
            ],
        ]);
    }

    public function supplierBalance(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $endDate = $endDate !== null && $endDate !== '' ? $endDate : now()->toDateString();
        $displayBy = $request->query('display_by', 'total');

        $suppliers = Supplier::query()->get();

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            ->where('journal_entries.payee_type', Supplier::class)
            ->where('chart_of_accs.sub_type', 'accounts-payable')
            ->where('journal_entries.date', '<=', $endDate);

        $months = [];
        if ($displayBy === 'month') {
            $minDate = $startDate ?: (clone $query)->min('journal_entries.date') ?: $endDate;
            $startDt = new \DateTime(substr($minDate, 0, 7) . '-01');
            $endDt = new \DateTime(substr($endDate, 0, 7) . '-01');
            while ($startDt <= $endDt) {
                $months[] = $startDt->format('Y-m');
                $startDt->modify('+1 month');
            }

            $lines = $query->select(
                    'journal_entries.payee_id',
                    DB::raw('SUBSTRING(journal_entries.date, 1, 7) as month'),
                    DB::raw('SUM(journal_entry_lines.debit) as total_debit'),
                    DB::raw('SUM(journal_entry_lines.credit) as total_credit')
                )
                ->groupBy('journal_entries.payee_id', DB::raw('SUBSTRING(journal_entries.date, 1, 7)'))
                ->get();

            $linesBySupplier = $lines->groupBy('payee_id');

            $reportData = $suppliers->map(function ($supplier) use ($linesBySupplier, $months) {
                $supplierLines = $linesBySupplier->get($supplier->id, collect());
                
                $monthlyBalances = [];
                $cumulative = $supplier->opening_balance ?? 0;
                
                if (!empty($months)) {
                    $firstMonth = $months[0];
                    foreach ($supplierLines as $sl) {
                        if ($sl->month < $firstMonth) {
                            $cumulative += ($sl->total_credit - $sl->total_debit);
                        }
                    }
                }

                foreach ($months as $m) {
                    foreach ($supplierLines as $sl) {
                        if ($sl->month === $m) {
                            $cumulative += ($sl->total_credit - $sl->total_debit);
                        }
                    }
                    $monthlyBalances[$m] = $cumulative;
                }
                
                $finalBalance = $supplier->opening_balance ?? 0;
                foreach ($supplierLines as $sl) {
                    $finalBalance += ($sl->total_credit - $sl->total_debit);
                }

                return [
                    'id' => $supplier->id,
                    'name' => $supplier->display_name ?: $supplier->company_name,
                    'email' => $supplier->email,
                    'phone' => $supplier->phone_number,
                    'balance' => (float) $finalBalance,
                    'monthly_balances' => $monthlyBalances,
                ];
            })->filter(function ($item) {
                return $item['balance'] != 0;
            })->values();

        } else {
            $lines = $query->select(
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
                if ($line) {
                    $balance += ($line->total_credit - $line->total_debit);
                }

                return [
                    'id' => $supplier->id,
                    'name' => $supplier->display_name ?: $supplier->company_name,
                    'email' => $supplier->email,
                    'phone' => $supplier->phone_number,
                    'balance' => (float) $balance,
                ];
            })->filter(function ($item) {
                return $item['balance'] != 0;
            })->values();
        }

        return Inertia::render('Reports/SupplierBalance', [
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
            ->select(
                'journal_entry_lines.*',
                'journal_entries.date',
                'journal_entries.reference',
                'journal_entries.transaction_type',
                'journal_entries.due_date',
                'journal_entries.payee_id',
                'journal_entries.id as journal_entry_id',
                'journal_entries.description as memo'
            )
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
                'type' => $request->query('type')
            ]
        ]);
    }

    public function supplierDetail(Request $request, $supplierId)
    {
        $supplier = Supplier::findOrFail($supplierId);
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date', now()->toDateString());

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            ->where('journal_entries.payee_type', Supplier::class)
            ->where('journal_entries.payee_id', $supplierId)
            ->where('chart_of_accs.sub_type', 'accounts-payable');

        if ($startDate) {
            $query->whereBetween('journal_entries.date', [$startDate, $endDate]);
        } else {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        $lines = $query
            ->orderBy('journal_entries.date', 'asc')
            ->orderBy('journal_entries.id', 'asc')
            ->select(
                'journal_entry_lines.*',
                'journal_entries.date',
                'journal_entries.due_date',
                'journal_entries.reference',
                'journal_entries.transaction_type',
                'journal_entries.payee_id',
                'journal_entries.id as journal_entry_id',
                'journal_entries.description as memo'
            )
            ->get();

        return Inertia::render('Reports/ContactBalanceDetail', [
            'contact'     => $supplier,
            'contactType' => 'Supplier',
            'lines'       => $lines,
            'filters'     => [
                'start_date' => $startDate ?? '',
                'end_date'   => $endDate,
                'type'       => $request->query('type'),
            ],
        ]);
    }
}
