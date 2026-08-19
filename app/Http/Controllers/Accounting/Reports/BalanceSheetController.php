<?php

namespace App\Http\Controllers\Accounting\Reports;

use App\Http\Controllers\Controller;
use App\Services\Reports\AccountTreeBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BalanceSheetController extends Controller
{
    protected $treeBuilder;

    public function __construct(AccountTreeBuilder $treeBuilder)
    {
        $this->treeBuilder = $treeBuilder;
    }

    public function balanceSheet(Request $request)
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
            $start = $request->has('start_date') ? $request->get('start_date') : date('Y-01-01');
            $end = $request->has('end_date') ? $request->get('end_date') : date('Y-12-31');
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

        $lines = collect(DB::select($sql, $bindings));

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

        $tree = $this->treeBuilder->buildBalanceSheetTree($types, $lines, $displayBy, $months);

        return Inertia::render('Reports/BalanceSheet', [
            'reportData' => $tree,
            'filters' => [
                'start_date' => $start,
                'end_date' => $end,
                'display_by' => $displayBy,
                'months' => $months,
                'type' => $type,
            ],
        ]);
    }
}
