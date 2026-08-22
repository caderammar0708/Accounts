<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Reports\BalanceSheetResource;
use App\Http\Resources\Reports\CustomerBalanceResource;
use App\Http\Resources\Reports\InventorySummaryResource;
use App\Http\Resources\Reports\ProfitAndLossResource;
use App\Http\Resources\Reports\PurchaseByItemResource;
use App\Http\Resources\Reports\PurchaseBySupplierResource;
use App\Http\Resources\Reports\SalesByCustomerResource;
use App\Http\Resources\Reports\SalesByItemResource;
use App\Http\Resources\Reports\SupplierBalanceResource;
use App\Services\Reports\ReportDataService;
use Illuminate\Http\Request;

class ReportsController extends Controller
{
    protected ReportDataService $reportDataService;

    public function __construct(ReportDataService $reportDataService)
    {
        $this->reportDataService = $reportDataService;
    }

        public function profitAndLoss(Request $request)
    {
        $reportData = $this->reportDataService->profitAndLossData($request);
        return new ProfitAndLossResource($reportData);
    }

        public function balanceSheet(Request $request)
    {
        $reportData = $this->reportDataService->balanceSheetData($request);
        return new BalanceSheetResource($reportData);
    }

    public function customerBalance(Request $request)
    {
        return CustomerBalanceResource::collection($this->reportDataService->customerBalanceData());
    }

    public function supplierBalance(Request $request)
    {
        return SupplierBalanceResource::collection($this->reportDataService->supplierBalanceData());
    }

    public function inventorySummary(Request $request)
    {
        return InventorySummaryResource::collection(
            $this->reportDataService->inventorySummaryData(
                $request->query('start_date'),
                $request->query('end_date')
            )
        );
    }

    public function salesByItem(Request $request)
    {
        return SalesByItemResource::collection($this->reportDataService->salesByItemData());
    }

    public function salesByCustomer(Request $request)
    {
        return SalesByCustomerResource::collection($this->reportDataService->salesByCustomerData());
    }

    public function purchaseByItem(Request $request)
    {
        return PurchaseByItemResource::collection($this->reportDataService->purchaseByItemData());
    }

        public function purchaseBySupplier(Request $request)
    {
        return PurchaseBySupplierResource::collection($this->reportDataService->purchaseBySupplierData());
    }

    public function accountHistory(Request $request, \App\Models\Accounting\ChartOfAcc $account)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = \App\Models\Accounting\JournalEntryLine::with(['journalEntry.creator', 'journalEntry.transactionable'])
            ->where('chart_of_acc_id', $account->id)
            ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->select('journal_entry_lines.*', 'journal_entries.date as journal_date')
            ->orderBy('journal_entries.date')
            ->orderBy('journal_entries.created_at');

        $openingBalance = 0;
        
        if ($startDate) {
            $priorLines = \App\Models\Accounting\JournalEntryLine::where('chart_of_acc_id', $account->id)
                ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
                ->where('journal_entries.date', '<', $startDate)
                ->selectRaw('SUM(journal_entry_lines.debit) as total_debit, SUM(journal_entry_lines.credit) as total_credit')
                ->first();

            $totalDebit = (float)($priorLines->total_debit ?? 0);
            $totalCredit = (float)($priorLines->total_credit ?? 0);

            $isNormalDebit = in_array(strtolower($account->account_type), ['asset', 'expense']);
            $openingBalance = $isNormalDebit ? ($totalDebit - $totalCredit) : ($totalCredit - $totalDebit);
            
            $query->where('journal_entries.date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('journal_entries.date', '<=', $endDate);
        }

        $lines = $query->get()->map(function ($line) {
            return [
                'id' => $line->id,
                'date' => $line->journal_date,
                'reference' => $line->journalEntry->reference,
                'memo' => $line->memo ?? $line->journalEntry->description,
                'debit' => (float)$line->debit,
                'credit' => (float)$line->credit,
            ];
        });

        return response()->json([
            'account' => $account,
            'opening_balance' => $openingBalance,
            'is_normal_debit' => in_array(strtolower($account->account_type), ['asset', 'expense']),
            'lines' => $lines
        ]);
    }
}

