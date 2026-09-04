<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Define permissions grouped by module
        $modules = [
            'Dashboard' => [
                'dashboard.view' => 'View Dashboard & Analytics',
            ],
            'Customers' => [
                'customers.view' => 'View Customers',
                'customers.create' => 'Create Customers',
                'customers.edit' => 'Edit Customers',
                'customers.delete' => 'Delete Customers',
            ],
            'Suppliers' => [
                'suppliers.view' => 'View Suppliers',
                'suppliers.create' => 'Create Suppliers',
                'suppliers.edit' => 'Edit Suppliers',
                'suppliers.delete' => 'Delete Suppliers',
            ],
            'Employees' => [
                'employees.view' => 'View Employees',
                'employees.create' => 'Create Employees',
                'employees.edit' => 'Edit Employees',
                'employees.delete' => 'Delete Employees',
            ],
            'Inventory & Items' => [
                'items.view' => 'View Items & Categories',
                'items.create' => 'Create Items & Categories',
                'items.edit' => 'Edit Items & Categories',
                'items.delete' => 'Delete Items & Categories',
                'inventory-adjustments.view' => 'View Inventory Adjustments',
                'inventory-adjustments.create' => 'Create Inventory Adjustments',
            ],
            'Sales' => [
                'sales-invoices.view' => 'View Sales Invoices',
                'sales-invoices.create' => 'Create Sales Invoices',
                'sales-invoices.edit' => 'Edit Sales Invoices',
                'sales-invoices.delete' => 'Delete Sales Invoices',
                'credit-invoices.view' => 'View Credit Invoices',
                'credit-invoices.create' => 'Create Credit Invoices',
                'credit-invoices.edit' => 'Edit Credit Invoices',
                'credit-invoices.delete' => 'Delete Credit Invoices',
                'invoice-returns.view' => 'View Invoice Returns',
                'invoice-returns.create' => 'Create Invoice Returns',
                'invoice-returns.edit' => 'Edit Invoice Returns',
                'invoice-returns.delete' => 'Delete Invoice Returns',
                'receive-payments.view' => 'View Receive Payments',
                'receive-payments.create' => 'Create Receive Payments',
                'receive-payments.edit' => 'Edit Receive Payments',
                'receive-payments.delete' => 'Delete Receive Payments',
            ],
            'Purchases' => [
                'bills.view' => 'View Bills',
                'bills.create' => 'Create Bills',
                'bills.edit' => 'Edit Bills',
                'bills.delete' => 'Delete Bills',
                'bill-payments.view' => 'View Bill Payments',
                'bill-payments.create' => 'Create Bill Payments',
                'bill-payments.edit' => 'Edit Bill Payments',
                'bill-payments.delete' => 'Delete Bill Payments',
                'bill-returns.view' => 'View Bill Returns',
                'bill-returns.create' => 'Create Bill Returns',
                'bill-returns.edit' => 'Edit Bill Returns',
                'bill-returns.delete' => 'Delete Bill Returns',
                'payments.view' => 'View Expense Payments',
                'payments.create' => 'Create Expense Payments',
                'payments.edit' => 'Edit Expense Payments',
                'payments.delete' => 'Delete Expense Payments',
            ],
            'Banking & Accounting' => [
                'chart-of-accounts.view' => 'View Chart of Accounts',
                'chart-of-accounts.create' => 'Create Chart of Accounts',
                'chart-of-accounts.edit' => 'Edit Chart of Accounts',
                'chart-of-accounts.delete' => 'Delete Chart of Accounts',
                'bank-statements.view' => 'View Bank Statements',
                'bank-statements.categorize' => 'Categorize Bank Statements',
                'bank-reconciliation.view' => 'View Bank Reconciliation',
                'bank-reconciliation.create' => 'Process Bank Reconciliation',
                'transfers.view' => 'View Transfers',
                'transfers.create' => 'Create Transfers',
                'transfers.edit' => 'Edit Transfers',
                'transfers.delete' => 'Delete Transfers',
                'bank-deposits.view' => 'View Bank Deposits',
                'bank-deposits.create' => 'Create Bank Deposits',
                'bank-deposits.edit' => 'Edit Bank Deposits',
                'bank-deposits.delete' => 'Delete Bank Deposits',
                'cheques.view' => 'View Cheques',
                'cheques.create' => 'Create Cheques',
                'cheques.edit' => 'Edit Cheques',
                'cheques.delete' => 'Delete Cheques',
                'cheque-deposits.view' => 'View Cheque Deposits',
                'cheque-deposits.create' => 'Create Cheque Deposits',
                'cheque-deposits.edit' => 'Edit Cheque Deposits',
                'cheque-deposits.delete' => 'Delete Cheque Deposits',
                'journal-entries.view' => 'View Journal Entries',
                'journal-entries.create' => 'Create Journal Entries',
                'journal-entries.edit' => 'Edit Journal Entries',
                'journal-entries.delete' => 'Delete Journal Entries',
            ],
            'Reports' => [
                'reports.view' => 'View Reports Summary',
                'reports.profit-loss' => 'View Profit & Loss',
                'reports.balance-sheet' => 'View Balance Sheet',
                'reports.sales' => 'View Sales Reports',
                'reports.purchases' => 'View Purchase Reports',
                'reports.inventory' => 'View Inventory Reports',
            ],
            'Operations' => [
                'shifts.view' => 'View Pump Shifts',
                'shifts.create' => 'Create Pump Shifts',
                'shifts.edit' => 'Edit Pump Shifts',
                'shifts.settle' => 'Settle Pump Shifts',
                'warranties.view' => 'View Warranties',
                'warranties.create' => 'Create Warranties',
                'warranties.edit' => 'Edit Warranties',
                'warranties.delete' => 'Delete Warranties',
                'locations.view' => 'View Locations',
                'locations.create' => 'Create Locations',
                'locations.edit' => 'Edit Locations',
                'locations.delete' => 'Delete Locations',
            ],
            'Company Settings' => [
                'settings.company' => 'View & Access Company Settings',
                'settings.company.profile' => 'Manage Company Profile & Contact Info',
                'settings.company.legal' => 'Manage Legal Information & Tax ID',
                'settings.company.logo' => 'Upload & Update Company Logo',
                'settings.company.alerts' => 'Manage Low Stock Email Alerts',
                'settings.company.accounting' => 'Manage Accounting & Books Lock Date',
                'settings.company.currency' => 'Manage Currency & Multi-Currency',
                'settings.layout.business_type' => 'Configure Business Type',
                'settings.layout.pos' => 'Configure POS Layout Toggle',
                'settings.layout.customer_modal' => 'Configure Customer Modal Mode Toggle',
                'settings.layout.locations' => 'Configure Locations Layout Toggle',
                'settings.layout.reports_style' => 'Configure Reports & Quick Action Style Toggle',
                'settings.layout.attachments' => 'Configure Attachments Toggle',
                'settings.print' => 'Manage Print Settings & Templates',
            ],
            'Import Tools' => [
                'import.view' => 'Access Import Tools',
                'import.execute' => 'Execute Data Imports',
            ],
            'User & Role Administration' => [
                'users.view' => 'View Users',
                'users.create' => 'Create Users',
                'users.edit' => 'Edit Users',
                'users.delete' => 'Delete Users',
                'roles.view' => 'View Roles & Permissions',
                'roles.create' => 'Create Roles',
                'roles.edit' => 'Edit Roles',
                'roles.delete' => 'Delete Roles',
            ],
            'HR & Payroll' => [
                'manage-payroll' => 'Manage Payroll & Salary Operations',
                'view-payroll' => 'View Payroll',
                'manage-leave-requests' => 'Manage Leave Requests & Calendar',
                'manage-system' => 'Manage System Approvals',
                'view-attendance-report' => 'View Attendance Report',
            ],
        ];

        $allPermissionNames = [];

        foreach ($modules as $moduleName => $perms) {
            foreach ($perms as $permName => $permLabel) {
                Permission::findOrCreate($permName, 'web');
                $allPermissionNames[] = $permName;
            }
        }

        // Create Default Roles
        $adminRole = Role::findOrCreate('Admin', 'web');
        $adminRole->syncPermissions($allPermissionNames);

        $managerRole = Role::findOrCreate('Manager', 'web');
        $managerPermissions = array_filter($allPermissionNames, function ($p) {
            return !str_starts_with($p, 'roles.') && $p !== 'users.delete';
        });
        $managerRole->syncPermissions($managerPermissions);

        $accountantRole = Role::findOrCreate('Accountant', 'web');
        $accountantPermissions = array_filter($allPermissionNames, function ($p) {
            return str_starts_with($p, 'chart-of-accounts.') ||
                   str_starts_with($p, 'bank-') ||
                   str_starts_with($p, 'transfers.') ||
                   str_starts_with($p, 'cheques.') ||
                   str_starts_with($p, 'cheque-deposits.') ||
                   str_starts_with($p, 'journal-entries.') ||
                   str_starts_with($p, 'reports.') ||
                   str_starts_with($p, 'sales-invoices.') ||
                   str_starts_with($p, 'bills.') ||
                   str_starts_with($p, 'receive-payments.') ||
                   str_starts_with($p, 'payments.') ||
                   str_starts_with($p, 'customers.view') ||
                   str_starts_with($p, 'suppliers.view') ||
                   $p === 'dashboard.view';
        });
        $accountantRole->syncPermissions($accountantPermissions);

        $staffRole = Role::findOrCreate('Staff', 'web');
        $staffPermissions = [
            'dashboard.view',
            'customers.view',
            'customers.create',
            'suppliers.view',
            'items.view',
            'sales-invoices.view',
            'sales-invoices.create',
            'shifts.view',
            'shifts.create',
            'warranties.view',
            'warranties.create',
        ];
        $staffRole->syncPermissions($staffPermissions);

        // Assign existing users to roles
        $users = User::all();
        foreach ($users as $user) {
            if ($user->roles()->count() === 0) {
                if ($user->role === 'admin') {
                    $user->assignRole($adminRole);
                } else {
                    $user->assignRole($staffRole);
                }
            }
        }
    }
}
