<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
                $today = Carbon::today();
        
        $settings = \App\Models\CompanySetting::current();
        
        // Service Center Metrics
        $todaysJobs = 0;
        $pendingJobs = 0;
        
        if ($settings->job_layout_enabled && \Illuminate\Support\Facades\Schema::hasTable('job_cards')) {
            $todaysJobs = \App\Models\ServiceStation\JobCard::query()
                ->whereDate('service_date', $today)
                ->count();
                
            $pendingJobs = \App\Models\ServiceStation\JobCard::query()
                ->whereNotIn('status', ['Ready', 'Delivered', 'Cancelled'])
                ->count();
        }
            
        // Financial Metrics (simplified for Service Center)
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        $todaysRevenue = JournalEntryLine::whereHas('account', function($q) {
                $q->whereIn('account_type', ['income', 'other_income']);
            })
            ->whereHas('journalEntry', function($q) use ($today) {
                $q
                  ->whereDate('date', $today);
            })
            ->sum(DB::raw('credit - debit'));

        $monthlyRevenue = JournalEntryLine::whereHas('account', function($q) {
                $q->whereIn('account_type', ['income', 'other_income']);
            })
            ->whereHas('journalEntry', function($q) use ($currentMonth, $currentYear) {
                $q
                  ->whereYear('date', $currentYear)
                  ->whereMonth('date', $currentMonth);
            })
            ->sum(DB::raw('credit - debit'));

        $monthlyExpenses = JournalEntryLine::whereHas('account', function($q) {
                $q->whereIn('account_type', ['expense', 'cost_of_goods_sold']);
            })
            ->whereHas('journalEntry', function($q) use ($currentMonth, $currentYear) {
                $q
                  ->whereYear('date', $currentYear)
                  ->whereMonth('date', $currentMonth);
            })
            ->sum(DB::raw('debit - credit'));

        $monthlyProfit = $monthlyRevenue - $monthlyExpenses;

        $startDate = $today->copy()->subDays(6)->format('Y-m-d');
        $endDate = $today->copy()->endOfDay()->format('Y-m-d H:i:s');

        $revenueTrend = JournalEntryLine::select(DB::raw('DATE(journal_entries.date) as date_val'), DB::raw('SUM(journal_entry_lines.credit - journal_entry_lines.debit) as total'))
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('chart_of_accs', 'chart_of_accs.id', '=', 'journal_entry_lines.chart_of_acc_id')
            ->whereIn('chart_of_accs.account_type', ['income', 'other_income'])
            ->whereBetween('journal_entries.date', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(journal_entries.date)'))
            ->pluck('total', 'date_val');

        $expenseTrend = JournalEntryLine::select(DB::raw('DATE(journal_entries.date) as date_val'), DB::raw('SUM(journal_entry_lines.debit - journal_entry_lines.credit) as total'))
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('chart_of_accs', 'chart_of_accs.id', '=', 'journal_entry_lines.chart_of_acc_id')
            ->whereIn('chart_of_accs.account_type', ['expense', 'cost_of_goods_sold'])
            ->whereBetween('journal_entries.date', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(journal_entries.date)'))
            ->pluck('total', 'date_val');

        $trendData = collect(range(0, 6))->map(function ($dayIndex) use ($today, $revenueTrend, $expenseTrend) {
            $dateObj = $today->copy()->subDays(6 - $dayIndex);
            $dateKey = $dateObj->format('Y-m-d');

            return [
                'date' => $dateObj->format('M d'),
                'revenue' => (float) ($revenueTrend[$dateKey] ?? 0),
                'expense' => (float) ($expenseTrend[$dateKey] ?? 0),
            ];
        })->toArray();

        // Inventory Alerts (Items where qty < some threshold, say 5)
        $lowStockItems = \App\Models\Item::query()
            ->where('type', 'inventory')
            ->where('quantity_on_hand', '<=', 5)
            ->take(5)
            ->get(['id', 'name', 'quantity_on_hand']);

        // Recent Jobs
        $recentJobs = [];
        if ($settings->job_layout_enabled && \Illuminate\Support\Facades\Schema::hasTable('job_cards')) {
            $recentJobs = \App\Models\ServiceStation\JobCard::with(['customer', 'device'])
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();
        }

        return Inertia::render('Dashboard', [
            'metrics' => [
                'todays_jobs' => $todaysJobs,
                'pending_jobs' => $pendingJobs,
                'todays_revenue' => $todaysRevenue,
                'monthly_revenue' => $monthlyRevenue,
                'monthly_expenses' => $monthlyExpenses,
                'monthly_profit' => $monthlyProfit,
            ],
            'trendData' => $trendData,
            'lowStockItems' => $lowStockItems,
            'recentJobs' => $recentJobs
        ]);
    }
}
