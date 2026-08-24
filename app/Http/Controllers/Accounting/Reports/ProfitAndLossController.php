<?php

namespace App\Http\Controllers\Accounting\Reports;

use App\Http\Controllers\Controller;
use App\Services\Reports\ReportDataService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfitAndLossController extends Controller
{
    protected ReportDataService $reportDataService;

    public function __construct(ReportDataService $reportDataService)
    {
        $this->reportDataService = $reportDataService;
    }

    public function profitAndLoss(Request $request)
    {
        $data = $this->reportDataService->profitAndLossData($request);
        return Inertia::render('Reports/ProfitAndLoss', $data);
    }
}