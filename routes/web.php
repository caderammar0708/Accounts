<?php

use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Garage\JobCardController;

// Accounting Controllers
use App\Http\Controllers\Accounting\PaymentController;
use App\Http\Controllers\Accounting\PayBillController;
use App\Http\Controllers\Accounting\JournalEntryController;
use App\Http\Controllers\Accounting\TransferController;
use App\Http\Controllers\Accounting\CreditInvoiceController;
use App\Http\Controllers\Accounting\BillController;
use App\Http\Controllers\Accounting\ReceivePaymentController;
use App\Http\Controllers\Accounting\SalesInvoiceController;
use App\Http\Controllers\Accounting\BankDepositController;
use App\Http\Controllers\Accounting\InvoiceReturnController;
use App\Http\Controllers\Accounting\BillReturnController;
use App\Http\Controllers\Accounting\ChequeController;
use App\Http\Controllers\Accounting\ChartOfAccController;
use App\Http\Controllers\Accounting\ReportController;
use App\Http\Controllers\Api\TransactionHistoryController;

// Inventory Controllers
use App\Http\Controllers\Inventory\ItemController;
use App\Http\Controllers\Inventory\ItemCategoryController;
use App\Http\Controllers\Inventory\InventoryQuantityAdjustmentController;

// Contacts Controllers
use App\Http\Controllers\Contacts\CustomerController;
use App\Http\Controllers\Contacts\SupplierController;
use App\Http\Controllers\Contacts\EmployeeController;

// Settings Controllers
use App\Http\Controllers\Settings\CompanySettingsController;
use App\Http\Controllers\Settings\PrintSettingController;
use App\Http\Controllers\Garage\VehicleController;
use App\Http\Controllers\WarrantyController;
use App\Http\Controllers\WarrantyPolicyController;
use App\Http\Controllers\WarrantyClaimController;
// ...
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
})->name('welcome');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    // Profile
    Route::controller(ProfileController::class)->prefix('profile')->as('profile.')->group(function () {
        Route::get('/', 'edit')->name('edit');
        Route::patch('/', 'update')->name('update');
        Route::delete('/', 'destroy')->name('destroy');
    });

     // Users
    Route::resource('users', UserController::class);
    Route::post('/users/{user}/resend-invite', [UserController::class, 'resendInvitation'])->name('users.resend-invite');

    // Settings
    Route::prefix('settings')->group(function () {
        Route::get('/company', [CompanySettingsController::class, 'index'])->name('settings.company');
        Route::get('/print', [PrintSettingController::class, 'index'])->name('settings.print');
        
        Route::controller(CompanySettingsController::class)->group(function () {
            Route::post('/company', 'update')->name('company.update');
            Route::post('/legal', 'updateLegal')->name('legal.update');
            Route::post('/accounting', 'updateAccounting')->name('accounting.update');
            Route::post('/layout', 'updateLayout')->name('layout.update');
            Route::post('/warranty-layout', 'updateWarrantyLayout')->name('layout.warranty.update');
            Route::post('/job-layout', 'updateJobLayout')->name('layout.job.update');
            Route::post('/customer-layout', 'updateCustomerLayout')->name('layout.customer.update');
            Route::post('/reports-display-style', 'updateReportsDisplayStyle')->name('layout.reports.update');
            Route::post('/vehicles-layout', 'updateVehiclesEnabled')->name('layout.vehicles.update');
            Route::post('/alerts', 'updateAlerts')->name('alerts.update');
            Route::post('/time', 'updateTime')->name('time.settings.update');
            Route::post('/currency', 'updateCurrency')->name('currency.settings.update');
            Route::post('/logo', 'uploadLogo')->name('logo.upload');
        });
        Route::get('/print/templates', [PrintSettingController::class, 'getTemplates'])->name('print.settings.templates');
        Route::post('/print', [PrintSettingController::class, 'store'])->name('print.settings.store');
        Route::post('/print/{printSetting}', [PrintSettingController::class, 'update'])->name('print.settings.update');
        Route::delete('/print/{printSetting}', [PrintSettingController::class, 'destroy'])->name('print.settings.destroy');
        // Quick routes for settings-managed resources
        Route::post('/payment-methods', [\App\Http\Controllers\Settings\PaymentMethodController::class, 'store'])->name('payment-methods.store');
    });

    // Inventory
    Route::get('items/{item}/print-barcode', [ItemController::class, 'printBarcode'])->name('items.print-barcode');
    Route::resource('items', ItemController::class);
    Route::resource('item-categories', ItemCategoryController::class);
    Route::controller(InventoryQuantityAdjustmentController::class)
        ->as('inventory-adjustment.')->prefix('inventory-adjustment')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Contacts
    Route::resource('customers', CustomerController::class);
    Route::resource('suppliers', SupplierController::class);
    Route::resource('employees', EmployeeController::class);
    Route::resource('job-cards', JobCardController::class);
    Route::resource('vehicles', VehicleController::class);

    // Warranty
    Route::controller(WarrantyPolicyController::class)
        ->as('warranty-policies.')->prefix('warranty-policies')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/create', 'create')->name('create');
            Route::post('/', 'store')->name('store');
            Route::get('/{warrantyPolicy}/edit', 'edit')->name('edit');
            Route::patch('/{warrantyPolicy}', 'update')->name('update');
            Route::delete('/{warrantyPolicy}', 'destroy')->name('destroy');
        });

    Route::controller(WarrantyController::class)
        ->as('warranties.')->prefix('warranties')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/{warranty}', 'show')->name('show');
        });

    Route::controller(WarrantyClaimController::class)
        ->as('warranty-claims.')->prefix('warranty-claims')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/{warranty}', 'store')->name('store');
            Route::patch('/{warrantyClaim}', 'update')->name('update');
        });

    // Accounting - Chart of Accounts
    Route::get('chart-of-account/{chart_of_account}/history', [ChartOfAccController::class, 'history'])->name('chart-of-account.history');
    Route::resource('chart-of-account', ChartOfAccController::class);

    // Accounting - Journal Entries
    Route::controller(JournalEntryController::class)->group(function () {
        Route::get('/journal', 'create')->name('journal');
        Route::post('/journal-entries/{journalEntry}/quick-update', 'quickUpdate')->name('journal-entries.quick-update');
    });
    Route::resource('journal-entries', JournalEntryController::class);

    // POS
    Route::controller(POSController::class)
        ->as('pos.')->prefix('pos')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Sales Invoice (formerly Sales invoice)
    Route::controller(SalesInvoiceController::class)
        ->as('sales-invoice.')->prefix('sales-invoice')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::get('/{journalEntry}/print', 'print')->name('print');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Credit Invoice
    Route::controller(CreditInvoiceController::class)
        ->as('credit-invoice.')->prefix('credit-invoice')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::get('/{journalEntry}/print', 'print')->name('print');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - invoice-return
    Route::controller(InvoiceReturnController::class)
        ->as('invoice-return.')->prefix('invoice-return')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::get('/{journalEntry}/print', 'print')->name('print');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Receive Payment
    Route::controller(ReceivePaymentController::class)
        ->as('receive-payment.')->prefix('receive-payment')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::get('/{journalEntry}/print', 'print')->name('print');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Expense
    Route::controller(PaymentController::class)
        ->as('payment.')->prefix('payment')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Bill
    Route::controller(BillController::class)
        ->as('bill.')->prefix('bill')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::get('/{journalEntry}/print', 'print')->name('print');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Pay Bill
    Route::controller(PayBillController::class)
        ->as('pay-bill.')->prefix('pay-bill')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::get('/{journalEntry}/print', 'print')->name('print');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Bill Return
    Route::controller(BillReturnController::class)
        ->as('bill-return.')->prefix('bill-return')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::get('/{journalEntry}/print', 'print')->name('print');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Cheque
    Route::controller(ChequeController::class)
        ->as('cheque.')->prefix('cheque')->group(function () {
        Route::get('/list', 'index')->name('index');
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    
    // Accounting - Transfer
    Route::controller(TransferController::class)
        ->as('transfer.')->prefix('transfer')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Bank Deposit
    Route::controller(BankDepositController::class)
        ->as('bank-deposit.')->prefix('bank-deposit')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Cheque Deposit
    Route::controller(\App\Http\Controllers\Accounting\ChequeDepositController::class)
        ->as('cheque-deposit.')->prefix('cheque-deposit')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/', [\App\Http\Controllers\Accounting\ReportController::class, 'index'])->name('reports.index');
        Route::get('/vehicle-history', [\App\Http\Controllers\Accounting\ReportController::class, 'vehicleHistory'])->name('reports.vehicle-history');

        Route::get('/profit-loss', [\App\Http\Controllers\Accounting\Reports\ProfitAndLossController::class, 'profitAndLoss'])->name('reports.profit-loss');
        Route::get('/balance-sheet', [\App\Http\Controllers\Accounting\Reports\BalanceSheetController::class, 'balanceSheet'])->name('reports.balance-sheet');

        // Contact balances
        Route::get('/customer-balance', [\App\Http\Controllers\Accounting\Reports\ContactBalanceController::class, 'customerBalance'])->name('reports.customer-balance');
        Route::get('/customer-balance-detail', [\App\Http\Controllers\Accounting\Reports\ContactBalanceController::class, 'customerBalanceDetailAll'])->name('reports.customer-balance-detail');
        Route::get('/customer-balance/{customer}', [\App\Http\Controllers\Accounting\Reports\ContactBalanceController::class, 'customerDetail'])->name('reports.customer-detail');
        Route::get('/supplier-balance', [\App\Http\Controllers\Accounting\Reports\ContactBalanceController::class, 'supplierBalance'])->name('reports.supplier-balance');
        Route::get('/supplier-balance-detail', [\App\Http\Controllers\Accounting\Reports\ContactBalanceController::class, 'supplierBalanceDetailAll'])->name('reports.supplier-balance-detail');
        Route::get('/supplier-balance/{supplier}', [\App\Http\Controllers\Accounting\Reports\ContactBalanceController::class, 'supplierDetail'])->name('reports.supplier-detail');

        // Inventory
        Route::get('/inventory-summary', [\App\Http\Controllers\Accounting\Reports\InventoryReportController::class, 'inventorySummary'])->name('reports.inventory-summary');
        Route::get('/inventory-detail-all', [\App\Http\Controllers\Accounting\Reports\InventoryReportController::class, 'inventoryDetailAll'])->name('reports.inventory-detail-all');
        Route::get('/inventory-detail/{item}', [\App\Http\Controllers\Accounting\Reports\InventoryReportController::class, 'inventoryDetail'])->name('reports.inventory-detail');

        // Sales
        Route::get('/sales-by-item', [\App\Http\Controllers\Accounting\Reports\SalesReportController::class, 'salesByItem'])->name('reports.sales-by-item');
        Route::get('/sales-by-customer', [\App\Http\Controllers\Accounting\Reports\SalesReportController::class, 'salesByCustomer'])->name('reports.sales-by-customer');

        // Purchases
        Route::get('/purchase-by-item', [\App\Http\Controllers\Accounting\Reports\PurchaseReportController::class, 'purchaseByItem'])->name('reports.purchase-by-item');
        Route::get('/purchase-by-supplier', [\App\Http\Controllers\Accounting\Reports\PurchaseReportController::class, 'purchaseBySupplier'])->name('reports.purchase-by-supplier');
    });

    // History
    Route::get('/history/{transactionType}', [TransactionHistoryController::class, 'page'])->name('history.index');
});

// SSO Routes
use App\Http\Controllers\Auth\SsoController;
Route::middleware('auth')->post('/sso/switch', [SsoController::class, 'switchCompany'])->name('sso.switch');
Route::get('/sso/callback', [SsoController::class, 'callback'])->name('sso.callback');

require __DIR__.'/auth.php';
