<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Package;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Company;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        // DB::table('companies')->truncate();
        // DB::table('chart_of_accs')->truncate();
        // DB::table('item_categories')->truncate();
        // DB::table('items')->truncate();
        // DB::table('customers')->truncate();
        // DB::table('suppliers')->truncate();
        // DB::table('journal_entries')->truncate();
        // DB::table('journal_entry_lines')->truncate();
        // DB::table('users')->truncate();
        // DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // $testCompany = Company::updateOrCreate(
        //     ['id' => 1],
        //     [
        //         'company_name' => 'Test Company',
        //         'company_email' => 'hello@testcompany.example.com',
        //         'phone' => '+94 11 234 5678',
        //         'address' => '123 Business Road, Colombo, Sri Lanka',
        //         'website' => 'https://testcompany.example.com',
        //         'industry' => 'Financial Services',
        //     ]
        // );

        // 3. Create Users
        $ilhamsadath = User::updateOrCreate(
            ['email' => 'ilhamsadath29@gmail.com'],
            [
                'name' => 'Ilham Sadath',
                'password' => Hash::make('RoshanAara10'),
                'role' => 'admin',
                'is_active' => 1,
            ]
        );

        $Admin = User::updateOrCreate(
                    ['email' => 'admin@example.com '],
                    [
                        'name' => 'Admin',
                        'password' => Hash::make('admin123'),
                        'role' => 'admin',
                        'is_active' => 1,
                    ]
                );
        
        // // 4. Create Chart of Accounts for the single company
        // $accounts = [
        //     ['code' => '1000', 'name' => 'Cash on Hand', 'type' => 'asset', 'sub' => 'cash-and-cash-equivalents'],
        //     ['code' => '1005', 'name' => 'Cheque in Hand', 'type' => 'asset', 'sub' => 'cash-and-cash-equivalents'],
        //     ['code' => '1010', 'name' => 'Main Bank Account', 'type' => 'asset', 'sub' => 'bank'],
        //     ['code' => '1100', 'name' => 'Accounts Receivable', 'type' => 'asset', 'sub' => 'accounts-receivable'],
        //     ['code' => '1200', 'name' => 'Inventory Asset', 'type' => 'asset', 'sub' => 'current-assets'],
        //     ['code' => '2000', 'name' => 'Accounts Payable', 'type' => 'liability', 'sub' => 'accounts-payable'],
        //     ['code' => '2100', 'name' => 'Credit Card', 'type' => 'liability', 'sub' => 'credit-card'],
        //     ['code' => '3000', 'name' => 'Opening Balance Equity', 'type' => 'equity', 'sub' => 'owners-equity'],
        //     ['code' => '3100', 'name' => 'Retained Earnings', 'type' => 'equity', 'sub' => 'owners-equity'],
        //     ['code' => '4000', 'name' => 'Sales Income', 'type' => 'income', 'sub' => 'income'],
        //     ['code' => '4100', 'name' => 'Service Income', 'type' => 'income', 'sub' => 'income'],
        //     ['code' => '5000', 'name' => 'Cost of Goods Sold', 'type' => 'expense', 'sub' => 'expense'],
        //     ['code' => '5100', 'name' => 'Rent Expense', 'type' => 'expense', 'sub' => 'expense'],
        //     ['code' => '5200', 'name' => 'Utilities Expense', 'type' => 'expense', 'sub' => 'expense'],
        //     ['code' => '5300', 'name' => 'Office Expense', 'type' => 'expense', 'sub' => 'expense'],
        // ];

        // foreach ($accounts as $acc) {
        //     ChartOfAcc::updateOrCreate(
        //         ['account_code' => $acc['code']],
        //         [
        //             'name' => $acc['name'],
        //             'account_type' => $acc['type'],
        //             'sub_type' => $acc['sub'],
        //             'balance' => 0,
        //         ]
        //     );
        // }

        // $this->call([
        //     PaymentMethodSeeder::class,
        //     InventorySeeder::class,
        //     CustomerSeeder::class,
        //     AccountingReportSeeder::class,
        //     VehicleSeeder::class,
        //     JobCardSeeder::class,
        //     WarrantyPolicySeeder::class,
        // ]);
    }
}