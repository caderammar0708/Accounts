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
        
        $accounts = [
            ['code' => '1000', 'name' => 'Cash on Hand', 'type' => 'asset', 'sub' => 'cash-and-cash-equivalents'],
            ['code' => '1005', 'name' => 'Cheque in Hand', 'type' => 'asset', 'sub' => 'cash-and-cash-equivalents', 'is_locked' => true],
            ['code' => '1010', 'name' => 'Main Bank Account', 'type' => 'asset', 'sub' => 'bank'],
            ['code' => '1100', 'name' => 'Accounts Receivable', 'type' => 'asset', 'sub' => 'accounts-receivable', 'is_locked' => true],
            ['code' => '1200', 'name' => 'Inventory Asset', 'type' => 'asset', 'sub' => 'current-assets'],
            ['code' => '1300', 'name' => 'Inventory Asset', 'type' => 'asset', 'sub' => 'accounts-receivable', 'is_locked' => true],
            ['code' => '2000', 'name' => 'Accounts Payable', 'type' => 'liability', 'sub' => 'accounts-payable', 'is_locked' => true],
            ['code' => '2100', 'name' => 'Credit Card', 'type' => 'liability', 'sub' => 'credit-card'],
            ['code' => '3000', 'name' => 'Opening Balance Equity', 'type' => 'equity', 'sub' => 'owners-equity', 'is_locked' => true],
            ['code' => '3100', 'name' => 'Retained Earnings', 'type' => 'equity', 'sub' => 'owners-equity'],
            ['code' => '4000', 'name' => 'uncategorized-income', 'type' => 'income', 'sub' => 'income', 'is_locked' => true],
            ['code' => '4100', 'name' => 'Sales Income', 'type' => 'income', 'sub' => 'income'],
            ['code' => '4200', 'name' => 'Service Income', 'type' => 'income', 'sub' => 'income'],
            ['code' => '5000', 'name' => 'Uncategorized Expense', 'type' => 'expense', 'sub' => 'expense', 'is_locked' => true],
            ['code' => '5100', 'name' => 'Cost of Goods Sold', 'type' => 'expense', 'sub' => 'expense'],
            ['code' => '5200', 'name' => 'Rent Expense', 'type' => 'expense', 'sub' => 'expense'],
            ['code' => '5300', 'name' => 'Utilities Expense', 'type' => 'expense', 'sub' => 'expense'],
            ['code' => '5400', 'name' => 'Office Expense', 'type' => 'expense', 'sub' => 'expense'],
        ];

        foreach ($accounts as $acc) {
            ChartOfAcc::updateOrCreate(
                ['account_code' => $acc['code']],
                [
                    'name' => $acc['name'],
                    'account_type' => $acc['type'],
                    'sub_type' => $acc['sub'],
                    'is_locked' => $acc['is_locked'] ?? false,
                ]
            );
        }

        $this->call([
            CurrenciesTableSeeder::class,
            PaymentMethodSeeder::class,
        ]);
    }
}