<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Get grouped permissions matrix definition
     */
    public static function getGroupedPermissions(): array
    {
        return [
            'Dashboard' => [
                ['name' => 'dashboard.view', 'label' => 'View Dashboard & Analytics'],
            ],
            'Customers' => [
                ['name' => 'customers.view', 'label' => 'View Customers'],
                ['name' => 'customers.create', 'label' => 'Create Customers'],
                ['name' => 'customers.edit', 'label' => 'Edit Customers'],
                ['name' => 'customers.delete', 'label' => 'Delete Customers'],
            ],
            'Suppliers' => [
                ['name' => 'suppliers.view', 'label' => 'View Suppliers'],
                ['name' => 'suppliers.create', 'label' => 'Create Suppliers'],
                ['name' => 'suppliers.edit', 'label' => 'Edit Suppliers'],
                ['name' => 'suppliers.delete', 'label' => 'Delete Suppliers'],
            ],
            'Employees' => [
                ['name' => 'employees.view', 'label' => 'View Employees'],
                ['name' => 'employees.create', 'label' => 'Create Employees'],
                ['name' => 'employees.edit', 'label' => 'Edit Employees'],
                ['name' => 'employees.delete', 'label' => 'Delete Employees'],
            ],
            'Inventory & Items' => [
                ['name' => 'items.view', 'label' => 'View Items & Categories'],
                ['name' => 'items.create', 'label' => 'Create Items & Categories'],
                ['name' => 'items.edit', 'label' => 'Edit Items & Categories'],
                ['name' => 'items.delete', 'label' => 'Delete Items & Categories'],
                ['name' => 'inventory-adjustments.view', 'label' => 'View Inventory Adjustments'],
                ['name' => 'inventory-adjustments.create', 'label' => 'Create Inventory Adjustments'],
            ],
            'Sales' => [
                ['name' => 'sales-invoices.view', 'label' => 'View Sales Invoices'],
                ['name' => 'sales-invoices.create', 'label' => 'Create Sales Invoices'],
                ['name' => 'sales-invoices.edit', 'label' => 'Edit Sales Invoices'],
                ['name' => 'sales-invoices.delete', 'label' => 'Delete Sales Invoices'],
                ['name' => 'credit-invoices.view', 'label' => 'View Credit Invoices'],
                ['name' => 'credit-invoices.create', 'label' => 'Create Credit Invoices'],
                ['name' => 'credit-invoices.edit', 'label' => 'Edit Credit Invoices'],
                ['name' => 'credit-invoices.delete', 'label' => 'Delete Credit Invoices'],
                ['name' => 'invoice-returns.view', 'label' => 'View Invoice Returns'],
                ['name' => 'invoice-returns.create', 'label' => 'Create Invoice Returns'],
                ['name' => 'invoice-returns.edit', 'label' => 'Edit Invoice Returns'],
                ['name' => 'invoice-returns.delete', 'label' => 'Delete Invoice Returns'],
                ['name' => 'receive-payments.view', 'label' => 'View Receive Payments'],
                ['name' => 'receive-payments.create', 'label' => 'Create Receive Payments'],
                ['name' => 'receive-payments.edit', 'label' => 'Edit Receive Payments'],
                ['name' => 'receive-payments.delete', 'label' => 'Delete Receive Payments'],
            ],
            'Purchases' => [
                ['name' => 'bills.view', 'label' => 'View Bills'],
                ['name' => 'bills.create', 'label' => 'Create Bills'],
                ['name' => 'bills.edit', 'label' => 'Edit Bills'],
                ['name' => 'bills.delete', 'label' => 'Delete Bills'],
                ['name' => 'bill-payments.view', 'label' => 'View Bill Payments'],
                ['name' => 'bill-payments.create', 'label' => 'Create Bill Payments'],
                ['name' => 'bill-payments.edit', 'label' => 'Edit Bill Payments'],
                ['name' => 'bill-payments.delete', 'label' => 'Delete Bill Payments'],
                ['name' => 'bill-returns.view', 'label' => 'View Bill Returns'],
                ['name' => 'bill-returns.create', 'label' => 'Create Bill Returns'],
                ['name' => 'bill-returns.edit', 'label' => 'Edit Bill Returns'],
                ['name' => 'bill-returns.delete', 'label' => 'Delete Bill Returns'],
                ['name' => 'payments.view', 'label' => 'View Expense Payments'],
                ['name' => 'payments.create', 'label' => 'Create Expense Payments'],
                ['name' => 'payments.edit', 'label' => 'Edit Expense Payments'],
                ['name' => 'payments.delete', 'label' => 'Delete Expense Payments'],
            ],
            'Banking & Accounting' => [
                ['name' => 'chart-of-accounts.view', 'label' => 'View Chart of Accounts'],
                ['name' => 'chart-of-accounts.create', 'label' => 'Create Chart of Accounts'],
                ['name' => 'chart-of-accounts.edit', 'label' => 'Edit Chart of Accounts'],
                ['name' => 'chart-of-accounts.delete', 'label' => 'Delete Chart of Accounts'],
                ['name' => 'bank-statements.view', 'label' => 'View Bank Statements'],
                ['name' => 'bank-statements.categorize', 'label' => 'Categorize Bank Statements'],
                ['name' => 'bank-reconciliation.view', 'label' => 'View Bank Reconciliation'],
                ['name' => 'bank-reconciliation.create', 'label' => 'Process Bank Reconciliation'],
                ['name' => 'transfers.view', 'label' => 'View Transfers'],
                ['name' => 'transfers.create', 'label' => 'Create Transfers'],
                ['name' => 'transfers.edit', 'label' => 'Edit Transfers'],
                ['name' => 'transfers.delete', 'label' => 'Delete Transfers'],
                ['name' => 'bank-deposits.view', 'label' => 'View Bank Deposits'],
                ['name' => 'bank-deposits.create', 'label' => 'Create Bank Deposits'],
                ['name' => 'bank-deposits.edit', 'label' => 'Edit Bank Deposits'],
                ['name' => 'bank-deposits.delete', 'label' => 'Delete Bank Deposits'],
                ['name' => 'cheques.view', 'label' => 'View Cheques'],
                ['name' => 'cheques.create', 'label' => 'Create Cheques'],
                ['name' => 'cheques.edit', 'label' => 'Edit Cheques'],
                ['name' => 'cheques.delete', 'label' => 'Delete Cheques'],
                ['name' => 'cheque-deposits.view', 'label' => 'View Cheque Deposits'],
                ['name' => 'cheque-deposits.create', 'label' => 'Create Cheque Deposits'],
                ['name' => 'cheque-deposits.edit', 'label' => 'Edit Cheque Deposits'],
                ['name' => 'cheque-deposits.delete', 'label' => 'Delete Cheque Deposits'],
                ['name' => 'journal-entries.view', 'label' => 'View Journal Entries'],
                ['name' => 'journal-entries.create', 'label' => 'Create Journal Entries'],
                ['name' => 'journal-entries.edit', 'label' => 'Edit Journal Entries'],
                ['name' => 'journal-entries.delete', 'label' => 'Delete Journal Entries'],
            ],
            'Reports' => [
                ['name' => 'reports.view', 'label' => 'View Reports Summary'],
                ['name' => 'reports.profit-loss', 'label' => 'View Profit & Loss'],
                ['name' => 'reports.balance-sheet', 'label' => 'View Balance Sheet'],
                ['name' => 'reports.sales', 'label' => 'View Sales Reports'],
                ['name' => 'reports.purchases', 'label' => 'View Purchase Reports'],
                ['name' => 'reports.inventory', 'label' => 'View Inventory Reports'],
            ],
            'Operations' => [
                ['name' => 'shifts.view', 'label' => 'View Pump Shifts'],
                ['name' => 'shifts.create', 'label' => 'Create Pump Shifts'],
                ['name' => 'shifts.edit', 'label' => 'Edit Pump Shifts'],
                ['name' => 'shifts.settle', 'label' => 'Settle Pump Shifts'],
                ['name' => 'warranties.view', 'label' => 'View Warranties'],
                ['name' => 'warranties.create', 'label' => 'Create Warranties'],
                ['name' => 'warranties.edit', 'label' => 'Edit Warranties'],
                ['name' => 'warranties.delete', 'label' => 'Delete Warranties'],
                ['name' => 'locations.view', 'label' => 'View Locations'],
                ['name' => 'locations.create', 'label' => 'Create Locations'],
                ['name' => 'locations.edit', 'label' => 'Edit Locations'],
                ['name' => 'locations.delete', 'label' => 'Delete Locations'],
            ],
            'Company Settings' => [
                ['name' => 'settings.company', 'label' => 'View & Access Company Settings'],
                ['name' => 'settings.company.profile', 'label' => 'Manage Company Profile & Contact Info'],
                ['name' => 'settings.company.legal', 'label' => 'Manage Legal Information & Tax ID'],
                ['name' => 'settings.company.logo', 'label' => 'Upload & Update Company Logo'],
                ['name' => 'settings.company.alerts', 'label' => 'Manage Low Stock Email Alerts'],
                ['name' => 'settings.company.accounting', 'label' => 'Manage Accounting & Books Lock Date'],
                ['name' => 'settings.company.currency', 'label' => 'Manage Currency & Multi-Currency'],
                ['name' => 'settings.layout.business_type', 'label' => 'Configure Business Type'],
                ['name' => 'settings.layout.pos', 'label' => 'Configure POS Layout Toggle'],
                ['name' => 'settings.layout.customer_modal', 'label' => 'Configure Customer Modal Mode Toggle'],
                ['name' => 'settings.layout.locations', 'label' => 'Configure Locations Layout Toggle'],
                ['name' => 'settings.layout.reports_style', 'label' => 'Configure Reports & Quick Action Style Toggle'],
                ['name' => 'settings.print', 'label' => 'Manage Print Settings & Templates'],
            ],
            'Import Tools' => [
                ['name' => 'import.view', 'label' => 'Access Import Tools'],
                ['name' => 'import.execute', 'label' => 'Execute Data Imports'],
            ],
            'User & Role Administration' => [
                ['name' => 'users.view', 'label' => 'View Users'],
                ['name' => 'users.create', 'label' => 'Create Users'],
                ['name' => 'users.edit', 'label' => 'Edit Users'],
                ['name' => 'users.delete', 'label' => 'Delete Users'],
                ['name' => 'roles.view', 'label' => 'View Roles & Permissions'],
                ['name' => 'roles.create', 'label' => 'Create Roles'],
                ['name' => 'roles.edit', 'label' => 'Edit Roles'],
                ['name' => 'roles.delete', 'label' => 'Delete Roles'],
            ],
            'HR & Payroll' => [
                ['name' => 'manage-payroll', 'label' => 'Manage Payroll & Salary Operations'],
                ['name' => 'view-payroll', 'label' => 'View Payroll'],
                ['name' => 'manage-leave-requests', 'label' => 'Manage Leave Requests & Calendar'],
                ['name' => 'manage-system', 'label' => 'Manage System Approvals'],
                ['name' => 'view-attendance-report', 'label' => 'View Attendance Report'],
            ],
        ];
    }

    /**
     * List all roles
     */
    public function index(): Response
    {
        $roles = Role::withCount(['users', 'permissions'])
            ->with(['permissions:id,name'])
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'users_count' => $role->users_count,
                    'permissions_count' => $role->permissions_count,
                    'permissions' => $role->permissions->pluck('name'),
                    'is_admin' => strtolower($role->name) === 'admin',
                ];
            });

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
        ]);
    }

    /**
     * Show form to create a new role
     */
    public function create(): Response
    {
        return Inertia::render('Roles/Create', [
            'groupedPermissions' => self::getGroupedPermissions(),
        ]);
    }

    /**
     * Store new role
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        $role = Role::create([
            'name' => $request->name,
            'guard_name' => 'web',
        ]);

        if (!empty($request->permissions)) {
            foreach ($request->permissions as $permName) {
                Permission::findOrCreate($permName, 'web');
            }
            $role->syncPermissions($request->permissions);
        }

        return redirect()->route('roles.index')->with('success', "Role '{$role->name}' created successfully.");
    }

    /**
     * Show form to edit role
     */
    public function edit(Role $role): Response
    {
        return Inertia::render('Roles/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name'),
                'is_admin' => strtolower($role->name) === 'admin',
            ],
            'groupedPermissions' => self::getGroupedPermissions(),
        ]);
    }

    /**
     * Update role
     */
    public function update(Request $request, Role $role)
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:roles,name,' . $role->id,
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        $role->update([
            'name' => $request->name,
        ]);

        if (isset($request->permissions)) {
            foreach ($request->permissions as $permName) {
                Permission::findOrCreate($permName, 'web');
            }
            $role->syncPermissions($request->permissions);
        }

        return redirect()->route('roles.index')->with('success', "Role '{$role->name}' updated successfully.");
    }

    /**
     * Sync permissions to role endpoint
     */
    public function syncPermissions(Request $request, Role $role)
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string',
        ]);

        foreach ($request->permissions as $permName) {
            Permission::findOrCreate($permName, 'web');
        }

        $role->syncPermissions($request->permissions);

        return back()->with('success', "Permissions updated for role '{$role->name}'.");
    }

    /**
     * Delete role
     */
    public function destroy(Role $role)
    {
        if (strtolower($role->name) === 'admin') {
            return back()->with('error', 'The primary Admin role cannot be deleted.');
        }

        $userCount = $role->users()->count();
        if ($userCount > 0) {
            return back()->with('error', "Cannot delete role '{$role->name}' because it is currently assigned to {$userCount} user(s). Please reassign them to another role first.");
        }

        $roleName = $role->name;
        $role->delete();

        return redirect()->route('roles.index')->with('success', "Role '{$roleName}' deleted successfully.");
    }
}
