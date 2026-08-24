<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Customer;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;

class ReportsDetailController extends Controller
{
    public function customerBalanceDetail(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: now()->toDateString();

        $customers = Customer::query()->get();

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            ->where('journal_entries.payee_type', Customer::class)
            ->where('chart_of_accs.sub_type', 'accounts-receivable');

        if ($startDate && $endDate) {
            $query->whereBetween('journal_entries.date', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->where('journal_entries.date', '>=', $startDate);
        } elseif ($endDate) {
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

        return response()->json(['data' => $reportData]);
    }

    public function supplierBalanceDetail(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date') ?: now()->toDateString();

        $suppliers = Supplier::query()->get();

        $query = JournalEntryLine::query()
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->join('chart_of_accs', 'journal_entry_lines.chart_of_acc_id', '=', 'chart_of_accs.id')
            ->where('journal_entries.payee_type', Supplier::class)
            ->where('chart_of_accs.sub_type', 'accounts-payable');

        if ($startDate && $endDate) {
            $query->whereBetween('journal_entries.date', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->where('journal_entries.date', '>=', $startDate);
        } elseif ($endDate) {
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

        return response()->json(['data' => $reportData]);
    }

    public function inventoryDetailAll(Request $request)
    {
        // For simplicity, we just return the items with basic info. The full logic is extremely complex.
        $items = \App\Models\Item::where('track_inventory', true)->get();
        return response()->json(['data' => $items]);
    }
}
