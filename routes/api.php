<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\LookupController;
use App\Http\Controllers\Api\ReportsController;
use App\Http\Controllers\Api\TransactionHistoryController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Mobile App Authentication (v1)
Route::prefix('v1')->group(function () {
    Route::post('/login-sso', [\App\Http\Controllers\Api\MobileAuthController::class, 'loginSso']);
    Route::get('/check-access', [\App\Http\Controllers\Api\MobileAuthController::class, 'checkAccess'])->middleware('auth:sanctum');
    Route::post('/logout', [\App\Http\Controllers\Api\MobileAuthController::class, 'logout'])->middleware('auth:sanctum');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/attendance/today', [\App\Http\Controllers\Api\AttendanceController::class, 'todayStatus']);
        Route::get('/attendance/history', [\App\Http\Controllers\Api\AttendanceController::class, 'history']);
        Route::post('/attendance/check-in', [\App\Http\Controllers\Api\AttendanceController::class, 'checkIn']);
        Route::post('/attendance/check-out', [\App\Http\Controllers\Api\AttendanceController::class, 'checkOut']);
        Route::post('/attendance/lunch-out', [\App\Http\Controllers\Api\AttendanceController::class, 'lunchOut']);
        Route::post('/attendance/lunch-in', [\App\Http\Controllers\Api\AttendanceController::class, 'lunchIn']);
        Route::post('/attendance/outside-out', [\App\Http\Controllers\Api\AttendanceController::class, 'outsideOut']);
        Route::post('/attendance/outside-in', [\App\Http\Controllers\Api\AttendanceController::class, 'outsideIn']);
        Route::post('/attendance/cancel-outside-log/{id}', [\App\Http\Controllers\Api\AttendanceController::class, 'cancelOutsideLog']);
        Route::post('/attendance/prayer-break', [\App\Http\Controllers\Api\AttendanceController::class, 'applyPrayerBreak']);
        Route::post('/attendance/time-adjustment', [\App\Http\Controllers\Api\AttendanceController::class, 'requestTimeAdjustment']);

        Route::post('/leave-request', [\App\Http\Controllers\Api\LeaveRequestController::class, 'store']);
        Route::get('/leave/history', [\App\Http\Controllers\Api\LeaveRequestController::class, 'history']);
        Route::get('/leave/balance', [\App\Http\Controllers\Api\LeaveRequestController::class, 'balance']);
        Route::get('/leave/types', [\App\Http\Controllers\Api\LeaveRequestController::class, 'types']);

        Route::get('/manager/dashboard', [\App\Http\Controllers\Api\ManagerController::class, 'dashboard']);
        Route::get('/manager/leaves', [\App\Http\Controllers\Api\ManagerController::class, 'getPendingLeaves']);
        Route::get('/manager/short-leaves', [\App\Http\Controllers\Api\ManagerController::class, 'getPendingShortLeaves']);
        Route::get('/manager/outside-logs', [\App\Http\Controllers\Api\ManagerController::class, 'getPendingOutsideLogs']);
        Route::get('/manager/remote-attendances', [\App\Http\Controllers\Api\ManagerController::class, 'getPendingRemoteAttendances']);
        Route::get('/manager/prayer-breaks', [\App\Http\Controllers\Api\ManagerController::class, 'getPendingPrayerBreaks']);
        Route::get('/manager/time-adjustments', [\App\Http\Controllers\Api\ManagerController::class, 'getPendingTimeAdjustments']);
        Route::post('/manager/approve-remote-attendance/{id}', [\App\Http\Controllers\Api\ManagerController::class, 'approveRemoteAttendance']);
        Route::post('/manager/approve-leave-request/{id}', [\App\Http\Controllers\Api\ManagerController::class, 'approveLeaveRequest']);
        Route::post('/manager/approve-outside-log/{id}', [\App\Http\Controllers\Api\ManagerController::class, 'approveOutsideLog']);
        Route::post('/manager/approve-prayer-break/{id}', [\App\Http\Controllers\Api\ManagerController::class, 'approvePrayerBreak']);
        Route::post('/manager/approve-time-adjustment/{id}', [\App\Http\Controllers\Api\ManagerController::class, 'approveTimeAdjustment']);

        Route::get('/payroll', [\App\Http\Controllers\Api\PayrollController::class, 'index']);
        Route::get('/payroll/{id}', [\App\Http\Controllers\Api\PayrollController::class, 'show']);
    });
});

Route::middleware(['auth:sanctum,web'])->group(function () {
    Route::get('/exchange-rate', [\App\Http\Controllers\Api\ExchangeRateController::class, 'getRate'])->name('api.exchange-rate');
    Route::get('/payees', [LookupController::class, 'payees'])->name('api.payees');
    Route::get('/currencies', [LookupController::class, 'currencies'])->name('api.currencies');
    Route::get('/locations', [LookupController::class, 'locations'])->name('api.locations');
    Route::get('/accounts', [LookupController::class, 'accounts'])->name('api.accounts');
    Route::get('/accounts/detail', [LookupController::class, 'accountDetails'])->name('api.accounts.detail');
    Route::get('/accounts/next-code', [LookupController::class, 'nextCode'])->name('api.accounts.next-code');
    Route::get('/accounts/check-code', [LookupController::class, 'checkCode'])->name('api.accounts.check-code');
    Route::post('/accounts/save-date', [LookupController::class, 'saveOpeningBalanceDate'])->name('api.accounts.save-date');
    Route::get('/payments/next-ref', [LookupController::class, 'nextExpenseRef'])->name('api.payments.next-ref');
    Route::get('/items', [LookupController::class, 'items'])->name('api.items');
    Route::get('/items/create-options', [LookupController::class, 'itemCreateOptions'])->name('api.items.create-options');
    Route::get('/customers/{customer}', [LookupController::class, 'customerInfo'])->name('api.customers.info');
    Route::get('/customers/{customer}/credit_invoices', [LookupController::class, 'customerInvoices'])->name('api.customers.credit_invoices');
    Route::get('/suppliers/{supplier}', [LookupController::class, 'supplierInfo'])->name('api.suppliers.info');
    Route::get('/suppliers/{supplier}/bills', [LookupController::class, 'supplierBills'])->name('api.suppliers.bills');
    Route::get('/categories', [LookupController::class, 'categories'])->name('api.categories');
    Route::get('/payment-methods', [LookupController::class, 'paymentMethods'])->name('api.payment-methods');
    Route::get('/vehicles', [LookupController::class, 'vehicles'])->name('api.vehicles');
    Route::get('/designations', [LookupController::class, 'designations'])->name('api.designations');
    // Store modal last URL in session (namespaced by modal name)
    Route::post('/session/modal-last-url', [LookupController::class, 'storeModalLastUrl'])->name('api.session.modal_last_url');
    Route::get('/history/{transactionType}', [TransactionHistoryController::class, 'index'])->name('api.history');
    Route::get('/outstanding-cheques', [LookupController::class, 'outstandingCheques'])->name('api.outstanding-cheques');

    Route::prefix('reports')->group(function () {
        Route::get('/dashboard-summary', [ReportsController::class, 'dashboardSummary'])->name('api.reports.dashboard-summary');
        Route::get('/customer-balance-detail', [\App\Http\Controllers\Api\ReportsDetailController::class, 'customerBalanceDetail'])->name('api.reports.customer-balance-detail');
        Route::get('/supplier-balance-detail', [\App\Http\Controllers\Api\ReportsDetailController::class, 'supplierBalanceDetail'])->name('api.reports.supplier-balance-detail');
        Route::get('/inventory-detail-all', [\App\Http\Controllers\Api\ReportsDetailController::class, 'inventoryDetailAll'])->name('api.reports.inventory-detail-all');
        Route::get('/profit-and-loss', [ReportsController::class, 'profitAndLoss'])->name('api.reports.profit-loss');
        Route::get('/account-history/{account}', [ReportsController::class, 'accountHistory'])->name('api.reports.account-history');
        Route::get('/balance-sheet', [ReportsController::class, 'balanceSheet'])->name('api.reports.balance-sheet');
        Route::get('/customer-balance', [ReportsController::class, 'customerBalance'])->name('api.reports.customer-balance');
        Route::get('/supplier-balance', [ReportsController::class, 'supplierBalance'])->name('api.reports.supplier-balance');
        Route::get('/inventory-summary', [ReportsController::class, 'inventorySummary'])->name('api.reports.inventory-summary');
        Route::get('/sales-by-item', [ReportsController::class, 'salesByItem'])->name('api.reports.sales-by-item');
        Route::get('/sales-by-customer', [ReportsController::class, 'salesByCustomer'])->name('api.reports.sales-by-customer');
        Route::get('/purchase-by-item-summary', [ReportsController::class, 'purchaseByItemSummary'])->name('api.reports.purchase-by-item-summary');
        Route::get('/purchase-by-item-detail', [ReportsController::class, 'purchaseByItemDetail'])->name('api.reports.purchase-by-item-detail');
        Route::get('/purchase-by-supplier', [ReportsController::class, 'purchaseBySupplier'])->name('api.reports.purchase-by-supplier');
    });
});

// SSO Server Endpoints
use App\Http\Controllers\Auth\SsoController;
Route::post('/sso/generate-token', [SsoController::class, 'generateToken']);
Route::post('/sso/validate-token', [SsoController::class, 'validateToken']);

// Hub Sync Routes
use App\Http\Controllers\Api\HubSyncController;
Route::get('/hub/export', [HubSyncController::class, 'export']);
Route::post('/hub/import-user', [HubSyncController::class, 'importUser']);

