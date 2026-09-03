<?php

use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Garage\JobCardController;

// Accounting Controllers
use App\Http\Controllers\Accounting\PaymentController;
use App\Http\Controllers\Accounting\TaxRateController;
use App\Http\Controllers\Accounting\TransferController;
use App\Http\Controllers\Payroll\AttendanceController;
use App\Http\Controllers\Payroll\LeaveRequestController;
use App\Http\Controllers\Payroll\LeaveTypeController;
use App\Http\Controllers\Payroll\PayrollController;
use App\Http\Controllers\Payroll\LeaveBalanceController;
use App\Http\Controllers\Payroll\AdvanceSalaryController;
use App\Http\Controllers\Admin\ApprovalController;
use App\Http\Controllers\Accounting\BankDepositController;
use App\Http\Controllers\Accounting\InvoiceReturnController;
use App\Http\Controllers\Accounting\BillReturnController;
use App\Http\Controllers\Accounting\ChequeController;
use App\Http\Controllers\Accounting\ChartOfAccController;
use App\Http\Controllers\Accounting\PayBillController;
use App\Http\Controllers\Accounting\JournalEntryController;
use App\Http\Controllers\Accounting\CreditInvoiceController;
use App\Http\Controllers\Accounting\BillController;
use App\Http\Controllers\Accounting\ReceivePaymentController;
use App\Http\Controllers\Accounting\SalesInvoiceController;
use App\Http\Controllers\Accounting\ReportController;
use App\Http\Controllers\Accounting\BankController;
use App\Http\Controllers\Accounting\BankReconciliationController;
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
use App\Http\Controllers\ImportController;
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

     // Users & Roles
    Route::resource('users', UserController::class);
    Route::post('/users/{user}/resend-invite', [UserController::class, 'resendInvitation'])->name('users.resend-invite');
    Route::resource('roles', RoleController::class);
    Route::post('/roles/{role}/permissions', [RoleController::class, 'syncPermissions'])->name('roles.sync-permissions');

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
            Route::post('/branches-layout', 'updateBranchesEnabled')->name('layout.branches.update');
            Route::post('/hr-module', 'updateHrModuleEnabled')->name('layout.hr.update');
            Route::post('/attachments-layout', 'updateAttachmentsEnabled')->name('layout.attachments.update');
            Route::post('/business-type-layout', 'updateBusinessType')->name('layout.business_type.update');
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
        
        // HR Settings
        Route::controller(\App\Http\Controllers\Settings\HRSettingsController::class)->prefix('hr')->name('settings.hr.')->group(function () {
            Route::get('/remote-checkin', 'remoteCheckin')->name('remote-checkin');
            Route::post('/remote-checkin', 'updateRemoteCheckin')->name('remote-checkin.update');
            Route::get('/leave-notification', 'leaveNotification')->name('leave-notification');
            Route::post('/leave-notification', 'updateLeaveNotification')->name('leave-notification.update');
            Route::get('/payroll', 'payroll')->name('payroll');
            Route::post('/payroll', 'updatePayroll')->name('payroll.update');
            Route::get('/qr', 'qr')->name('qr');
            Route::post('/qr', 'updateQr')->name('qr.update');
        });

        Route::prefix('hr')->name('settings.hr.')->group(function () {
            Route::resource('attendance-locations', \App\Http\Controllers\Settings\AttendanceLocationController::class)->except(['show']);
            Route::resource('shifts', \App\Http\Controllers\Settings\ShiftController::class)->except(['show']);
            Route::resource('leave-types', \App\Http\Controllers\Settings\LeaveTypeController::class)->except(['show']);
        });
    });

    // HR & Payroll
    Route::get('/calendar', [\App\Http\Controllers\HR\CalendarController::class, 'index'])->name('calendar.index');

    // Import Tools
    Route::controller(ImportController::class)->as('import.')->prefix('import')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/template/{type}', 'downloadTemplate')->name('template');
        Route::post('/customers', 'importCustomers')->name('customers');
        Route::post('/suppliers', 'importSuppliers')->name('suppliers');
        Route::post('/employees', 'importEmployees')->name('employees');
        Route::post('/chart-of-accounts', 'importChartOfAccounts')->name('chart-of-accounts');
    });

    // Inventory
    Route::get('items/{item}/print-barcode', [ItemController::class, 'printBarcode'])->name('items.print-barcode');
    Route::post('items/reorder', [ItemController::class, 'reorder'])->name('items.reorder');
    Route::resource('items', ItemController::class);
    Route::post('item-categories/reorder', [ItemCategoryController::class, 'reorder'])->name('item-categories.reorder');
    Route::resource('item-categories', ItemCategoryController::class);
    Route::controller(InventoryQuantityAdjustmentController::class)
        ->as('inventory-adjustment.')->prefix('inventory-adjustment')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::post('/{journalEntry}/void', 'void')->name('void');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Contacts
    Route::resource('customers', CustomerController::class);
    Route::resource('suppliers', SupplierController::class);
    Route::resource('employees', EmployeeController::class);
    Route::get('employees/{employee}/salary', [EmployeeController::class, 'editSalary'])->name('employees.salary.edit');
    Route::put('employees/{employee}/salary', [EmployeeController::class, 'updateSalary'])->name('employees.salary.update');
    
    Route::get('employees/{employee}/attendance', [EmployeeController::class, 'editAttendance'])->name('employees.attendance.edit');
    
    Route::get('employees/{employee}/documents', [EmployeeController::class, 'editDocuments'])->name('employees.documents.edit');
    Route::put('employees/{employee}/documents', [EmployeeController::class, 'updateDocuments'])->name('employees.documents.update');
    
    Route::get('employees/{employee}/security', [EmployeeController::class, 'editSecurity'])->name('employees.security.edit');
    Route::put('employees/{employee}/security', [EmployeeController::class, 'updateSecurity'])->name('employees.security.update');
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
        Route::post('/journal-entries/{journalEntry}/void', 'void')->name('journal-entries.void');
    });
    Route::resource('journal-entries', JournalEntryController::class);

    // Accounting - Bank Import
    Route::controller(BankController::class)
        ->as('bank.')->prefix('bank')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/upload', 'upload')->name('upload');
        Route::get('/template', 'downloadTemplate')->name('template');
        Route::post('/{line}/move', 'move')->name('move');
        Route::post('/{line}/close', 'close')->name('close');
        Route::post('/{line}/reverse', 'reverse')->name('reverse');
        Route::delete('/{line}', 'destroy')->name('destroy');
    });

    // Accounting - Bank Reconciliation
    Route::controller(BankReconciliationController::class)
        ->as('bank-reconciliation.')->prefix('bank-reconciliation')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/create', 'create')->name('create');
        Route::get('/opening-balance', 'getOpeningBalance')->name('opening-balance');
        Route::post('/', 'store')->name('store');
        Route::delete('/{reconciliation}', 'destroy')->name('destroy');
        Route::get('/{reconciliation}/process', 'process')->name('process');
        Route::post('/{reconciliation}/lines/{line}/toggle', 'toggleClear')->name('toggleClear');
        Route::post('/{reconciliation}/finish', 'finish')->name('finish');
    });

    // POS
    Route::controller(POSController::class)
        ->as('pos.')->prefix('pos')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::post('/{journalEntry}/void', 'void')->name('void');
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
        Route::post('/{journalEntry}/void', 'void')->name('void');
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
        Route::post('/{journalEntry}/void', 'void')->name('void');
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
        Route::post('/{journalEntry}/void', 'void')->name('void');
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
        Route::post('/{journalEntry}/void', 'void')->name('void');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Expense
    Route::controller(PaymentController::class)
        ->as('payment.')->prefix('payment')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::post('/{journalEntry}/void', 'void')->name('void');
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
        Route::post('/{journalEntry}/void', 'void')->name('void');
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
        Route::post('/{journalEntry}/void', 'void')->name('void');
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
        Route::post('/{journalEntry}/void', 'void')->name('void');
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
        Route::post('/{journalEntry}/void', 'void')->name('void');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    
    // Accounting - Transfer
    Route::controller(TransferController::class)
        ->as('transfer.')->prefix('transfer')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::post('/{journalEntry}/void', 'void')->name('void');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Bank Deposit
    Route::controller(BankDepositController::class)
        ->as('bank-deposit.')->prefix('bank-deposit')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::post('/{journalEntry}/void', 'void')->name('void');
        Route::delete('/{journalEntry}', 'destroy')->name('destroy');
    });

    // Accounting - Cheque Deposit
    Route::controller(\App\Http\Controllers\Accounting\ChequeDepositController::class)
        ->as('cheque-deposit.')->prefix('cheque-deposit')->group(function () {
        Route::get('/', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{journalEntry}/edit', 'edit')->name('edit');
        Route::patch('/{journalEntry}', 'update')->name('update');
        Route::post('/{journalEntry}/void', 'void')->name('void');
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

        // Fuel Station Modules
        Route::resource('tanks', \App\Http\Controllers\Inventory\TankController::class);
        Route::resource('tank-dip-readings', \App\Http\Controllers\Inventory\TankDipReadingController::class);
        Route::resource('pumps', \App\Http\Controllers\Inventory\PumpController::class);
        Route::get('shifts/{shift}/edit-active', [\App\Http\Controllers\Inventory\PumpShiftController::class, 'editActive'])->name('shifts.edit-active');
        Route::put('shifts/{shift}/update-active', [\App\Http\Controllers\Inventory\PumpShiftController::class, 'updateActive'])->name('shifts.update-active');
        Route::get('shifts/{shift}/collections', [\App\Http\Controllers\Inventory\PumpShiftController::class, 'editCollections'])->name('shifts.collections.edit');
        Route::post('shifts/{shift}/draft', [\App\Http\Controllers\Inventory\PumpShiftController::class, 'saveDraft'])->name('shifts.draft');
        Route::post('shifts/{shift}/reopen', [\App\Http\Controllers\Inventory\PumpShiftController::class, 'reopen'])->name('shifts.reopen');
        Route::get('shifts/{shift}/export-csv', [\App\Http\Controllers\Inventory\PumpShiftController::class, 'exportCsv'])->name('shifts.export-csv');
        Route::post('shifts/{shift}/settle', [\App\Http\Controllers\Inventory\PumpShiftController::class, 'settle'])->name('shifts.settle');
        Route::get('shifts/{shift}/export-pdf', [\App\Http\Controllers\Inventory\PumpShiftController::class, 'exportPdf'])->name('shifts.export-pdf');
        Route::resource('shifts', \App\Http\Controllers\Inventory\PumpShiftController::class);

        // Stock Shifts Module (Mobile Shop)
        Route::get('stock-shifts/{stockShift}/edit-active', [\App\Http\Controllers\Inventory\StockShiftController::class, 'editActive'])->name('stock-shifts.edit-active');
        Route::put('stock-shifts/{stockShift}/update-active', [\App\Http\Controllers\Inventory\StockShiftController::class, 'updateActive'])->name('stock-shifts.update-active');
        Route::get('stock-shifts/{stockShift}/collections', [\App\Http\Controllers\Inventory\StockShiftController::class, 'editCollections'])->name('stock-shifts.collections.edit');
        Route::post('stock-shifts/{stockShift}/draft', [\App\Http\Controllers\Inventory\StockShiftController::class, 'saveDraft'])->name('stock-shifts.draft');
        Route::post('stock-shifts/{stockShift}/reopen', [\App\Http\Controllers\Inventory\StockShiftController::class, 'reopen'])->name('stock-shifts.reopen');
        Route::get('stock-shifts/{stockShift}/export-csv', [\App\Http\Controllers\Inventory\StockShiftController::class, 'exportCsv'])->name('stock-shifts.export-csv');
        Route::post('stock-shifts/{stockShift}/settle', [\App\Http\Controllers\Inventory\StockShiftController::class, 'settle'])->name('stock-shifts.settle');
        Route::resource('stock-shifts', \App\Http\Controllers\Inventory\StockShiftController::class)->parameters(['stock-shifts' => 'stockShift']);

        // Warranty Module
        Route::resource('warranties', WarrantyController::class);

        // Sales
        Route::get('/sales-by-item', [\App\Http\Controllers\Accounting\Reports\SalesReportController::class, 'salesByItem'])->name('reports.sales-by-item');
        Route::get('/sales-by-customer', [\App\Http\Controllers\Accounting\Reports\SalesReportController::class, 'salesByCustomer'])->name('reports.sales-by-customer');

        // Purchases
        Route::get('/purchase-by-item-summary', [\App\Http\Controllers\Accounting\Reports\PurchaseReportController::class, 'purchaseByItemSummary'])->name('reports.purchase-by-item-summary');
        Route::get('/purchase-by-item-detail', [\App\Http\Controllers\Accounting\Reports\PurchaseReportController::class, 'purchaseByItemDetail'])->name('reports.purchase-by-item-detail');
        Route::get('/purchase-by-supplier', [\App\Http\Controllers\Accounting\Reports\PurchaseReportController::class, 'purchaseBySupplier'])->name('reports.purchase-by-supplier');
    });

    // History
    Route::get('/history/{transactionType}', [TransactionHistoryController::class, 'page'])->name('history.index');

    // Location Switcher
    Route::post('/locations/switch', [\App\Http\Controllers\LocationController::class, 'switchLocation'])->name('locations.switch');

    // Admin Locations Management
    Route::controller(\App\Http\Controllers\LocationController::class)->prefix('settings/locations')->as('locations.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::put('/{location}', 'update')->name('update');
        Route::delete('/{location}', 'destroy')->name('destroy');
        Route::post('/{location}/assign-user', 'assignUser')->name('assign-user');
        Route::post('/unassign-user', 'unassignUser')->name('unassign-user');
    });

    // Attachments
    Route::controller(\App\Http\Controllers\AttachmentController::class)->prefix('attachments')->as('attachments.')->group(function () {
        Route::post('/', 'store')->name('store');
        Route::delete('/{attachment}', 'destroy')->name('destroy');
        Route::get('/{attachment}/download', 'download')->name('download');
    });

    // HR & Payroll
    Route::resource('payroll', PayrollController::class);
    Route::get('payroll/{payroll}/export', [PayrollController::class, 'export'])->name('payroll.export');
    Route::get('payroll/{payroll}/export-epf', [PayrollController::class, 'exportEpf'])->name('payroll.export.epf');
    Route::get('payroll/{payroll}/export-etf', [PayrollController::class, 'exportEtf'])->name('payroll.export.etf');
    Route::get('payroll/{payroll}/export-tax', [PayrollController::class, 'exportTax'])->name('payroll.export.tax');
    Route::post('payroll/{payroll}/pay', [PayrollController::class, 'pay'])->name('payroll.pay');
    
    Route::put('payslip/{payslip}/adjustments', [PayrollController::class, 'updatePayslipAdjustments'])->name('payslip.adjustments.update');
    Route::get('payslip/{payslip}/pdf', [PayrollController::class, 'downloadPdf'])->name('payslip.pdf');
    
    Route::resource('leave-type', LeaveTypeController::class);
    Route::post('leave-type/{id}/restore', [LeaveTypeController::class, 'restore'])->name('leave-type.restore');
    
    Route::resource('leave-request', LeaveRequestController::class);
    Route::put('leave-request/{leave_request}/status', [LeaveRequestController::class, 'updateStatus'])->name('leave-request.update-status');
    
    Route::get('leave-balance', [LeaveBalanceController::class, 'index'])->name('leave-balance.index');
    Route::post('leave-balance/assign', [LeaveBalanceController::class, 'assign'])->name('leave-balance.assign');
    Route::get('leave-balance/export', [LeaveBalanceController::class, 'export'])->name('leave-balance.export');
    
    Route::resource('advance-salary', AdvanceSalaryController::class)->only(['index', 'store', 'destroy']);
    
    Route::get('salary-revision', [PayrollController::class, 'salaryRevisionIndex'])->name('salary-revision.index');
    
    Route::get('attendance/report', [AttendanceController::class, 'report'])->name('attendance.report');
    Route::resource('attendance', AttendanceController::class);
    Route::put('attendance/outside-log/{id}/status', [AttendanceController::class, 'updateOutsideLogStatus'])->name('attendance.outside-log.update-status');

    Route::prefix('approvals')->name('approvals.')->controller(ApprovalController::class)->group(function () {
        Route::put('/short-leave/{id}/status', 'updateShortLeaveStatus')->name('short-leave.status');
        Route::put('/time-adjustment/{id}/status', 'updateTimeAdjustmentStatus')->name('time-adjustment.status');
        Route::get('/', 'index')->name('index');
    });
    
});

// SSO Routes
use App\Http\Controllers\Auth\SsoController;
Route::middleware('auth')->get('/sso/companies', [SsoController::class, 'getCompanies'])->name('sso.companies');
Route::middleware('auth')->post('/sso/switch', [SsoController::class, 'switchCompany'])->name('sso.switch');
Route::get('/sso/callback', [SsoController::class, 'callback'])->name('sso.callback');

require __DIR__.'/auth.php';

Route::get('/sso/auto-login', [\App\Http\Controllers\Auth\SsoController::class, 'autoLogin'])->name('sso.autologin');
