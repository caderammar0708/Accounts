<?php

namespace App\Http\Controllers\Accounting\Reports;

use App\Http\Controllers\Controller;
use App\Services\Reports\ReportDataService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BalanceSheetController extends Controller
{
    protected ReportDataService $reportDataService;

    public function __construct(ReportDataService $reportDataService)
    {
        $this->reportDataService = $reportDataService;
    }

    public function balanceSheet(Request $request)
    {
        $data = $this->reportDataService->balanceSheetData($request);
        return Inertia::render('Reports/BalanceSheet', $data);
    }
}