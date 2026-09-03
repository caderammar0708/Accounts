<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Supplier;
use App\Models\HR\Employee;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\BankImport;
use App\Models\Accounting\BankImportLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ImportController extends Controller
{
    public function index()
    {
        $bankAccounts = ChartOfAcc::where('is_active', true)
            ->where(function ($q) {
                $q->whereIn('sub_type', ['bank', 'cash-and-cash-equivalents'])
                  ->orWhere('account_type', 'asset');
            })
            ->orderBy('name')
            ->get(['id', 'name', 'account_code', 'account_type', 'sub_type']);

        $stats = [
            'customers' => Customer::count(),
            'suppliers' => Supplier::count(),
            'employees' => Employee::count(),
            'chart_of_accounts' => ChartOfAcc::count(),
            'bank_transactions' => BankImportLine::count(),
        ];

        return Inertia::render('Import/Index', [
            'bankAccounts' => $bankAccounts,
            'stats' => $stats,
        ]);
    }

    public function downloadTemplate(string $type)
    {
        $templates = [
            'customers' => [
                'filename' => 'customers_import_template.csv',
                'headers' => [
                    'Name',
                    'Company',
                    'Customer Type',
                    'Email',
                    'Phone',
                    'Mobile',
                    'Fax',
                    'Website',
                    'Street',
                    'City',
                    'Province/Region/State',
                    'Postal code',
                    'Country',
                    'Opening Balance',
                    'Date',
                    'Tax Reg Number',
                ],
                'sample' => [
                    [
                        'Acme Corporation',
                        'Acme Corp LLC',
                        'Commercial',
                        'billing@acmeco.com',
                        '+1 555-0199',
                        '+1 555-0188',
                        '+1 555-0177',
                        'https://acmeco.com',
                        '100 Enterprise Way, Suite 400',
                        'New York',
                        'NY',
                        '10001',
                        'United States',
                        '2500.00',
                        '2026-01-15',
                        'US-987654321',
                    ],
                    [
                        'John Doe',
                        '',
                        'Individual',
                        'john.doe@example.com',
                        '+1 555-0233',
                        '+1 555-0244',
                        '',
                        '',
                        '742 Evergreen Terrace',
                        'Springfield',
                        'OR',
                        '97477',
                        'United States',
                        '0.00',
                        '',
                        '',
                    ],
                ],
            ],
            'suppliers' => [
                'filename' => 'suppliers_import_template.csv',
                'headers' => [
                    'Name',
                    'Company',
                    'Supplier Type',
                    'Email',
                    'Phone',
                    'Mobile',
                    'Fax',
                    'Website',
                    'Street',
                    'City',
                    'Province/Region/State',
                    'Postal code',
                    'Country',
                    'Opening Balance',
                    'Date',
                    'Tax Reg Number',
                ],
                'sample' => [
                    [
                        'Apex Global Supplies',
                        'Apex Global Ltd',
                        'Distributor',
                        'orders@apex.com',
                        '+1 555-0311',
                        '+1 555-0322',
                        '+1 555-0333',
                        'https://apexglobal.com',
                        '789 Industrial Way',
                        'Boston',
                        'MA',
                        '02108',
                        'United States',
                        '0.00',
                        '2026-01-10',
                        'TAX-998877',
                    ],
                    [
                        'Parts Direct LLC',
                        'Parts Direct',
                        'Wholesale',
                        'sales@partsdirect.com',
                        '+1 555-0411',
                        '',
                        '',
                        '',
                        '500 Logistics Blvd',
                        'Chicago',
                        'IL',
                        '60601',
                        'United States',
                        '1250.00',
                        '2026-01-15',
                        '',
                    ],
                ],
            ],
            'employees' => [
                'filename' => 'employees_import_template.csv',
                'headers' => [
                    'Name',
                    'Employee ID',
                    'Designation',
                    'Department',
                    'Email',
                    'Phone',
                    'Mobile',
                    'Street',
                    'City',
                    'Province/Region/State',
                    'Postal code',
                    'Country',
                    'Date of Joining',
                    'Employment Type',
                ],
                'sample' => [
                    [
                        'Michael Scott',
                        'EMP-1001',
                        'Branch Manager',
                        'Management',
                        'michael.scott@example.com',
                        '+1 555-0511',
                        '+1 555-0522',
                        '1725 Slough Avenue',
                        'Scranton',
                        'PA',
                        '18503',
                        'United States',
                        '2025-01-10',
                        'Full Time',
                    ],
                    [
                        'Jim Halpert',
                        'EMP-1002',
                        'Sales Representative',
                        'Sales',
                        'jim.halpert@example.com',
                        '+1 555-0611',
                        '+1 555-0622',
                        '421 Linden Street',
                        'Scranton',
                        'PA',
                        '18503',
                        'United States',
                        '2025-03-01',
                        'Full Time',
                    ],
                ],
            ],
            'chart-of-accounts' => [
                'filename' => 'chart_of_accounts_template.csv',
                'headers' => [
                    'Account Name',
                    'Account Type',
                    'Detail Type',
                    'Account Number',
                    'Description',
                    'Opening Balance',
                    'As of Date',
                ],
                'sample' => [
                    [
                        'Main Checking Account',
                        'Bank',
                        'Cash and Cash Equivalents',
                        '1010',
                        'Primary operational bank account',
                        '25000.00',
                        '2026-01-01',
                    ],
                    [
                        'Expenses:Office Supplies',
                        'Expense',
                        'Office Expenses',
                        '5210',
                        'General stationery, printer supplies and paper',
                        '0.00',
                        '2026-01-01',
                    ],
                    [
                        'Current Assets:Inventory',
                        'Other Current Asset',
                        'Inventory Asset',
                        '1300',
                        'Finished products and parts stock inventory',
                        '15000.00',
                        '2026-01-01',
                    ],
                ],
            ],
            'bank' => [
                'filename' => 'bank_import_template.csv',
                'headers' => [
                    'Date',
                    'Description',
                    'Reference No',
                    'Debit',
                    'Credit',
                    'Balance',
                ],
                'sample' => [
                    ['29/01/2026', 'Customer Direct Deposit - Acme Corp', 'TXN-49395', '', '25000.00', '75000.00'],
                    ['30/01/2026', 'Monthly Bank Maintenance Fee', 'TXN-49396', '150.00', '', '74850.00'],
                ],
            ],
        ];

        if (!isset($templates[$type])) {
            abort(404, 'Template type not found.');
        }

        $template = $templates[$type];

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $template['filename'] . '"',
        ];

        $callback = function () use ($template) {
            $file = fopen('php://output', 'w');
            // Write UTF-8 BOM for Excel compatibility
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($file, $template['headers']);
            foreach ($template['sample'] as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function importCustomers(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120',
        ]);

        $rows = $this->parseCsvFile($request->file('file'));
        if (count($rows) < 2) {
            return back()->with('error', 'The uploaded file contains no data rows.');
        }

        $headers = array_map('strtolower', array_shift($rows));
        $headerMap = $this->mapHeaders($headers, [
            'name' => ['name', 'display name', 'display_name', 'customer name'],
            'company' => ['company', 'company name', 'company_name'],
            'customer_type' => ['customer type', 'customer_type', 'type'],
            'email' => ['email', 'email address'],
            'phone' => ['phone', 'phone number', 'phone_number', 'telephone'],
            'mobile' => ['mobile', 'mobile number', 'cell', 'cell phone'],
            'fax' => ['fax', 'fax number'],
            'website' => ['website', 'web', 'url', 'site'],
            'street' => ['street', 'street address', 'address 1', 'address line 1', 'address'],
            'city' => ['city', 'town'],
            'state' => ['province/region/state', 'province', 'region', 'state'],
            'postal_code' => ['postal code', 'postal_code', 'postal', 'zip', 'zip code', 'postcode'],
            'country' => ['country', 'nation'],
            'opening_balance' => ['opening balance', 'opening_balance', 'balance'],
            'date' => ['date', 'opening balance date', 'opening_balance_date', 'as of date'],
            'tax_reg_number' => ['tax reg number', 'tax_reg_number', 'tax number', 'tax reg no', 'tax id', 'tax_id', 'vat', 'tin', 'gst'],
        ]);

        if (!isset($headerMap['name']) && !isset($headerMap['company'])) {
            return back()->with('error', 'Required column "Name" (or Company) was not found in the file.');
        }

        $imported = 0;
        $maxNum = Customer::max('customer_number') ?: 1210;

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                $name = $this->getValue($row, $headerMap, 'name');
                $company = $this->getValue($row, $headerMap, 'company');

                if (empty($name)) {
                    $name = $company;
                }

                if (empty($name)) {
                    continue;
                }

                $maxNum++;

                // Build composite address from Street / City / Province/Region/State / Postal code / Country
                $street = $this->getValue($row, $headerMap, 'street');
                $city = $this->getValue($row, $headerMap, 'city');
                $state = $this->getValue($row, $headerMap, 'state');
                $postalCode = $this->getValue($row, $headerMap, 'postal_code');
                $country = $this->getValue($row, $headerMap, 'country');

                $addressParts = array_filter([$street, $city, $state, $postalCode, $country], fn($p) => trim((string)$p) !== '');
                $fullAddress = count($addressParts) > 0 ? implode(', ', $addressParts) : null;

                $phone = $this->getValue($row, $headerMap, 'phone');
                $mobile = $this->getValue($row, $headerMap, 'mobile');
                $mainPhone = $phone ?: $mobile;

                $dateStr = $this->getValue($row, $headerMap, 'date');
                $openingDate = null;
                if (!empty($dateStr)) {
                    $formattedDate = str_replace('/', '-', $dateStr);
                    $timestamp = strtotime($formattedDate);
                    if ($timestamp) {
                        $openingDate = date('Y-m-d', $timestamp);
                    }
                }

                $taxId = $this->getValue($row, $headerMap, 'tax_reg_number');

                Customer::create([
                    'display_name' => $name,
                    'company_name' => $company ?: null,
                    'customer_type' => $this->getValue($row, $headerMap, 'customer_type') ?: null,
                    'email' => $this->getValue($row, $headerMap, 'email') ?: null,
                    'phone_number' => $mainPhone ?: null,
                    'mobile' => $mobile ?: null,
                    'fax' => $this->getValue($row, $headerMap, 'fax') ?: null,
                    'website' => $this->getValue($row, $headerMap, 'website') ?: null,
                    'address' => $fullAddress,
                    'tax_id' => $taxId ?: null,
                    'opening_balance' => (float) str_replace(',', '', $this->getValue($row, $headerMap, 'opening_balance', '0')),
                    'opening_balance_date' => $openingDate,
                    'customer_number' => $maxNum,
                ]);

                $imported++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error importing customers: ' . $e->getMessage());
        }

        return back()->with('success', "Successfully imported {$imported} customer(s).");
    }

    public function importSuppliers(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120',
        ]);

        $rows = $this->parseCsvFile($request->file('file'));
        if (count($rows) < 2) {
            return back()->with('error', 'The uploaded file contains no data rows.');
        }

        $headers = array_map('strtolower', array_shift($rows));
        $headerMap = $this->mapHeaders($headers, [
            'name' => ['name', 'display name', 'display_name', 'supplier name', 'vendor name'],
            'company' => ['company', 'company name', 'company_name'],
            'supplier_type' => ['supplier type', 'supplier_type', 'vendor type', 'type'],
            'email' => ['email', 'email address'],
            'phone' => ['phone', 'phone number', 'phone_number', 'telephone'],
            'mobile' => ['mobile', 'mobile number', 'cell', 'cell phone'],
            'fax' => ['fax', 'fax number'],
            'website' => ['website', 'web', 'url', 'site'],
            'street' => ['street', 'street address', 'address 1', 'address line 1', 'address'],
            'city' => ['city', 'town'],
            'state' => ['province/region/state', 'province', 'region', 'state'],
            'postal_code' => ['postal code', 'postal_code', 'postal', 'zip', 'zip code', 'postcode'],
            'country' => ['country', 'nation'],
            'opening_balance' => ['opening balance', 'opening_balance', 'balance'],
            'date' => ['date', 'opening balance date', 'opening_balance_date', 'as of date'],
            'tax_reg_number' => ['tax reg number', 'tax_reg_number', 'tax number', 'tax reg no', 'tax id', 'tax_id', 'vat', 'tin', 'gst'],
        ]);

        if (!isset($headerMap['name']) && !isset($headerMap['company'])) {
            return back()->with('error', 'Required column "Name" (or Company) was not found in the file.');
        }

        $imported = 0;

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                $name = $this->getValue($row, $headerMap, 'name');
                $company = $this->getValue($row, $headerMap, 'company');

                if (empty($name)) {
                    $name = $company;
                }

                if (empty($name)) {
                    continue;
                }

                // Build composite address from Street / City / Province/Region/State / Postal code / Country
                $street = $this->getValue($row, $headerMap, 'street');
                $city = $this->getValue($row, $headerMap, 'city');
                $state = $this->getValue($row, $headerMap, 'state');
                $postalCode = $this->getValue($row, $headerMap, 'postal_code');
                $country = $this->getValue($row, $headerMap, 'country');

                $addressParts = array_filter([$street, $city, $state, $postalCode, $country], fn($p) => trim((string)$p) !== '');
                $fullAddress = count($addressParts) > 0 ? implode(', ', $addressParts) : null;

                $phone = $this->getValue($row, $headerMap, 'phone');
                $mobile = $this->getValue($row, $headerMap, 'mobile');
                $mainPhone = $phone ?: $mobile;

                $dateStr = $this->getValue($row, $headerMap, 'date');
                $openingDate = null;
                if (!empty($dateStr)) {
                    $formattedDate = str_replace('/', '-', $dateStr);
                    $timestamp = strtotime($formattedDate);
                    if ($timestamp) {
                        $openingDate = date('Y-m-d', $timestamp);
                    }
                }

                $taxId = $this->getValue($row, $headerMap, 'tax_reg_number');

                Supplier::create([
                    'display_name' => $name,
                    'company_name' => $company ?: null,
                    'supplier_type' => $this->getValue($row, $headerMap, 'supplier_type') ?: null,
                    'email' => $this->getValue($row, $headerMap, 'email') ?: null,
                    'phone_number' => $mainPhone ?: null,
                    'mobile' => $mobile ?: null,
                    'fax' => $this->getValue($row, $headerMap, 'fax') ?: null,
                    'website' => $this->getValue($row, $headerMap, 'website') ?: null,
                    'tax_id' => $taxId ?: null,
                    'address' => $fullAddress,
                    'opening_balance' => (float) str_replace(',', '', $this->getValue($row, $headerMap, 'opening_balance', '0')),
                    'opening_balance_date' => $openingDate,
                ]);

                $imported++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error importing suppliers: ' . $e->getMessage());
        }

        return back()->with('success', "Successfully imported {$imported} supplier(s).");
    }

    public function importEmployees(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120',
        ]);

        $rows = $this->parseCsvFile($request->file('file'));
        if (count($rows) < 2) {
            return back()->with('error', 'The uploaded file contains no data rows.');
        }

        $headers = array_map('strtolower', array_shift($rows));
        $headerMap = $this->mapHeaders($headers, [
            'name' => ['name', 'employee name', 'full name'],
            'employee_id' => ['employee id', 'employee_id', 'emp id', 'staff id', 'code'],
            'designation' => ['designation', 'position', 'role', 'job title'],
            'department' => ['department', 'dept', 'division'],
            'email' => ['email', 'email address'],
            'phone' => ['phone', 'phone number', 'phone_number', 'telephone'],
            'mobile' => ['mobile', 'mobile number', 'cell', 'cell phone'],
            'street' => ['street', 'street address', 'address 1', 'address line 1', 'address'],
            'city' => ['city', 'town'],
            'state' => ['province/region/state', 'province', 'region', 'state'],
            'postal_code' => ['postal code', 'postal_code', 'postal', 'zip', 'zip code', 'postcode'],
            'country' => ['country', 'nation'],
            'date_of_joining' => ['date of joining', 'date_of_joining', 'join date', 'join_date', 'hire date', 'start date'],
            'employment_type' => ['employment type', 'employment_type', 'job type', 'type'],
        ]);

        if (!isset($headerMap['name'])) {
            return back()->with('error', 'Required column "Name" was not found in the file.');
        }

        // Fetch existing designations for matching
        $existingDesignations = Employee::distinct()
            ->whereNotNull('designation')
            ->where('designation', '!=', '')
            ->pluck('designation')
            ->toArray();

        $imported = 0;

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                $name = $this->getValue($row, $headerMap, 'name');
                if (empty($name)) {
                    continue;
                }

                // Match designation case-insensitively or create/use new
                $rawDesignation = trim($this->getValue($row, $headerMap, 'designation'));
                $matchedDesignation = 'Staff Member';
                if (!empty($rawDesignation)) {
                    $found = null;
                    foreach ($existingDesignations as $ed) {
                        if (strcasecmp($ed, $rawDesignation) === 0) {
                            $found = $ed;
                            break;
                        }
                    }
                    $matchedDesignation = $found ?: $rawDesignation;
                    if (!$found) {
                        $existingDesignations[] = $rawDesignation;
                    }
                }

                $joinDateStr = $this->getValue($row, $headerMap, 'date_of_joining');
                $joinDate = null;
                if (!empty($joinDateStr)) {
                    $formattedDate = str_replace('/', '-', $joinDateStr);
                    $timestamp = strtotime($formattedDate);
                    if ($timestamp) {
                        $joinDate = date('Y-m-d', $timestamp);
                    }
                }

                $empId = $this->getValue($row, $headerMap, 'employee_id') ?: ('EMP-' . rand(1000, 9999));

                // Composite address
                $street = $this->getValue($row, $headerMap, 'street');
                $city = $this->getValue($row, $headerMap, 'city');
                $state = $this->getValue($row, $headerMap, 'state');
                $postalCode = $this->getValue($row, $headerMap, 'postal_code');
                $country = $this->getValue($row, $headerMap, 'country');

                $addressParts = array_filter([$street, $city, $state, $postalCode, $country], fn($p) => trim((string)$p) !== '');
                $fullAddress = count($addressParts) > 0 ? implode(', ', $addressParts) : null;

                $phone = $this->getValue($row, $headerMap, 'phone');
                $mobile = $this->getValue($row, $headerMap, 'mobile');

                Employee::create([
                    'name' => $name,
                    'email' => $this->getValue($row, $headerMap, 'email') ?: null,
                    'phone' => $phone ?: null,
                    'mobile' => $mobile ?: null,
                    'employee_id' => $empId,
                    'designation' => $matchedDesignation,
                    'department' => $this->getValue($row, $headerMap, 'department') ?: null,
                    'address' => $fullAddress,
                    'employment_type' => $this->getValue($row, $headerMap, 'employment_type') ?: null,
                    'join_date' => $joinDate,
                ]);

                $imported++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error importing employees: ' . $e->getMessage());
        }

        return back()->with('success', "Successfully imported {$imported} employee(s).");
    }

    public function importChartOfAccounts(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120',
        ]);

        $rows = $this->parseCsvFile($request->file('file'));
        if (count($rows) < 2) {
            return back()->with('error', 'The uploaded file contains no data rows.');
        }

        $headers = array_map('strtolower', array_shift($rows));
        $headerMap = $this->mapHeaders($headers, [
            'name' => ['account name', 'name', 'account_name'],
            'account_type' => ['account type', 'account_type', 'type'],
            'detail_type' => ['detail type', 'detail_type', 'sub type', 'sub_type', 'subtype'],
            'account_number' => ['account number', 'account_number', 'account code', 'account_code', 'code', 'number'],
            'description' => ['description', 'desc', 'notes'],
            'opening_balance' => ['opening balance', 'opening_balance', 'balance'],
            'as_of_date' => ['as of date', 'as_of_date', 'date', 'opening balance date'],
        ]);

        if (!isset($headerMap['name']) || !isset($headerMap['account_type'])) {
            return back()->with('error', 'Required columns "Account Name" and "Account Type" were not found in the file.');
        }

        // Map QuickBooks Account Types to JBooks internal base type & default sub_type
        $typeMapping = [
            'bank' => ['type' => 'asset', 'sub_type' => 'bank'],
            'accounts receivable' => ['type' => 'asset', 'sub_type' => 'accounts-receivable'],
            'other current asset' => ['type' => 'asset', 'sub_type' => 'other-current-asset'],
            'fixed asset' => ['type' => 'asset', 'sub_type' => 'fixed-asset'],
            'other asset' => ['type' => 'asset', 'sub_type' => 'other-asset'],
            'accounts payable' => ['type' => 'liability', 'sub_type' => 'accounts-payable'],
            'credit card' => ['type' => 'liability', 'sub_type' => 'credit-card'],
            'other current liability' => ['type' => 'liability', 'sub_type' => 'other-current-liability'],
            'long term liability' => ['type' => 'liability', 'sub_type' => 'long-term-liability'],
            'equity' => ['type' => 'equity', 'sub_type' => 'equity'],
            'income' => ['type' => 'income', 'sub_type' => 'income'],
            'cost of goods sold' => ['type' => 'expense', 'sub_type' => 'cost-of-goods-sold'],
            'expense' => ['type' => 'expense', 'sub_type' => 'expense'],
            'other income' => ['type' => 'income', 'sub_type' => 'other-income'],
            'other expense' => ['type' => 'expense', 'sub_type' => 'other-expense'],
        ];

        $imported = 0;

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                $rawFullName = $this->getValue($row, $headerMap, 'name');
                $rawAccountType = strtolower(trim($this->getValue($row, $headerMap, 'account_type')));

                if (empty($rawFullName) || empty($rawAccountType)) {
                    continue;
                }

                // Resolve type mapping
                $baseType = 'expense';
                $defaultSubType = 'expense';
                foreach ($typeMapping as $qbType => $mapped) {
                    if ($rawAccountType === $qbType || str_contains($rawAccountType, $qbType)) {
                        $baseType = $mapped['type'];
                        $defaultSubType = $mapped['sub_type'];
                        break;
                    }
                }

                $customDetailType = strtolower(trim($this->getValue($row, $headerMap, 'detail_type')));
                $subType = !empty($customDetailType) ? str_replace(' ', '-', $customDetailType) : $defaultSubType;

                // Support Sub-Accounts via "Parent:Sub-account" syntax
                $accountParts = array_map('trim', explode(':', $rawFullName));
                $parentId = null;

                for ($i = 0; $i < count($accountParts); $i++) {
                    $partName = $accountParts[$i];
                    if (empty($partName)) continue;

                    $isLeaf = ($i === count($accountParts) - 1);

                    // Check if this account already exists at this level
                    $existing = ChartOfAcc::whereRaw('LOWER(name) = ?', [strtolower($partName)])
                        ->when($parentId, fn($q) => $q->where('parent_id', $parentId))
                        ->when(!$parentId, fn($q) => $q->whereNull('parent_id'))
                        ->first();

                    if ($existing) {
                        $parentId = $existing->id;
                        if ($isLeaf) {
                            // Update balance/description if newly provided
                            $existing->update([
                                'description' => $this->getValue($row, $headerMap, 'description') ?: $existing->description,
                            ]);
                        }
                    } else {
                        // Generate account code
                        $code = '';
                        if ($isLeaf) {
                            $code = $this->getValue($row, $headerMap, 'account_number');
                        }

                        if (empty($code)) {
                            $prefixMap = ['asset' => '1', 'liability' => '2', 'equity' => '3', 'income' => '4', 'expense' => '5'];
                            $prefix = $prefixMap[$baseType] ?? '6';
                            $code = $prefix . rand(100, 999);
                            while (ChartOfAcc::withoutGlobalScope(\App\Scopes\LocationScope::class)->where('account_code', $code)->exists()) {
                                $code = $prefix . rand(1000, 9999);
                            }
                        }

                        $balance = $isLeaf ? (float) str_replace(',', '', $this->getValue($row, $headerMap, 'opening_balance', '0')) : 0;
                        $desc = $isLeaf ? $this->getValue($row, $headerMap, 'description') : null;

                        $newAcc = ChartOfAcc::create([
                            'account_code' => $code,
                            'name' => $partName,
                            'account_type' => $baseType,
                            'sub_type' => $subType,
                            'description' => $desc,
                            'balance' => $balance,
                            'parent_id' => $parentId,
                            'is_active' => true,
                            'is_locked' => false,
                        ]);

                        $parentId = $newAcc->id;
                        if ($isLeaf) {
                            $imported++;
                        }
                    }
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error importing Chart of Accounts: ' . $e->getMessage());
        }

        return back()->with('success', "Successfully imported {$imported} account(s).");
    }

    public function importBank(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120',
            'bank_account_id' => 'required|exists:chart_of_accs,id',
        ]);

        $file = $request->file('file');
        $csvData = $this->parseCsvFile($file);
        if (count($csvData) < 2) {
            return back()->with('error', 'The uploaded file contains no data rows.');
        }

        $headers = array_map('strtolower', array_shift($csvData));
        $headerMap = $this->mapHeaders($headers, [
            'date' => ['date', 'transaction date', 'trans date', 'posting date'],
            'description' => ['description', 'memo', 'payee', 'narrative', 'details'],
            'reference_no' => ['reference no', 'reference_no', 'ref no', 'ref number', 'reference', 'check no'],
            'debit' => ['debit', 'withdrawal', 'money out', 'spent', 'paid out'],
            'credit' => ['credit', 'deposit', 'money in', 'received', 'paid in'],
            'balance' => ['balance', 'running balance'],
        ]);

        if (!isset($headerMap['date']) || !isset($headerMap['description'])) {
            return back()->with('error', 'Required columns "Date" and "Description" were not found in the file.');
        }

        $imported = 0;

        DB::beginTransaction();
        try {
            $company = auth()->user()->company ?? null;
            $import = BankImport::create([
                'company_id' => $company ? $company->id : null,
                'bank_account_id' => $request->bank_account_id,
                'import_date' => now(),
                'filename' => $file->getClientOriginalName(),
                'created_by' => auth()->id(),
            ]);

            foreach ($csvData as $row) {
                $dateRaw = $this->getValue($row, $headerMap, 'date');
                $description = $this->getValue($row, $headerMap, 'description');

                if (empty($dateRaw) || empty($description)) {
                    continue;
                }

                $dateStr = str_replace('/', '-', $dateRaw);
                $transactionDate = date('Y-m-d', strtotime($dateStr));
                if (!$transactionDate || $transactionDate === '1970-01-01') {
                    $transactionDate = date('Y-m-d');
                }

                $refNumber = $this->getValue($row, $headerMap, 'reference_no');
                $debit = (float) str_replace(',', '', $this->getValue($row, $headerMap, 'debit', '0'));
                $credit = (float) str_replace(',', '', $this->getValue($row, $headerMap, 'credit', '0'));

                // Calculate single line amount (Credit = deposit/positive, Debit = withdrawal/negative)
                $amount = $credit > 0 ? $credit : ($debit > 0 ? -$debit : 0);

                BankImportLine::create([
                    'bank_import_id' => $import->id,
                    'transaction_date' => $transactionDate,
                    'reference_number' => $refNumber ?: null,
                    'description' => $description,
                    'amount' => $amount,
                    'status' => 'uncategorized',
                ]);

                $imported++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error importing bank transactions: ' . $e->getMessage());
        }

        return back()->with('success', "Successfully imported {$imported} bank transaction(s).");
    }

    private function parseCsvFile($file): array
    {
        $rows = [];
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle !== false) {
            $bom = fread($handle, 3);
            if ($bom !== "\xEF\xBB\xBF") {
                rewind($handle);
            }

            while (($data = fgetcsv($handle, 10000, ',')) !== false) {
                if (count(array_filter($data, fn($v) => trim((string)$v) !== '')) === 0) {
                    continue;
                }
                $rows[] = array_map(fn($v) => trim((string)$v), $data);
            }
            fclose($handle);
        }
        return $rows;
    }

    private function mapHeaders(array $fileHeaders, array $definitions): array
    {
        $map = [];
        foreach ($definitions as $field => $aliases) {
            foreach ($fileHeaders as $idx => $header) {
                $cleanHeader = strtolower(trim($header));
                foreach ($aliases as $alias) {
                    if ($cleanHeader === $alias || str_contains($cleanHeader, $alias)) {
                        $map[$field] = $idx;
                        break 2;
                    }
                }
            }
        }
        return $map;
    }

    private function getValue(array $row, array $map, string $field, string $default = ''): string
    {
        if (isset($map[$field]) && isset($row[$map[$field]])) {
            return trim((string) $row[$map[$field]]);
        }
        return $default;
    }
}
