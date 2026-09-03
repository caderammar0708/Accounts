<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Location;
use App\Models\CompanySetting;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ReportAccountCodesTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $location;
    protected $incomeAccount;
    protected $assetAccount;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::connection()->getPdo()->sqliteCreateFunction('DATE_FORMAT', function ($date, $format) {
                if (!$date) return null;
                $phpFormat = str_replace(['%Y', '%m', '%d'], ['Y', 'm', 'd'], $format);
                return date($phpFormat, strtotime($date));
            }, 2);

            DB::connection()->getPdo()->sqliteCreateFunction('FIELD', function (...$args) {
                $val = array_shift($args);
                $pos = array_search($val, $args);
                return $pos === false ? 0 : $pos + 1;
            });
        }

        CompanySetting::create([
            'branches_enabled' => true,
            'business_type' => 'Normal',
        ]);

        $this->location = Location::create([
            'name' => 'Main Branch',
            'code' => 'MAIN',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'location_id' => null,
        ]);

        $this->incomeAccount = ChartOfAcc::create([
            'name' => 'Sales Card - Chilaw',
            'account_type' => 'Income',
            'sub_type' => 'sales',
            'account_code' => '4022',
            'location_id' => $this->location->id,
        ]);

        $this->assetAccount = ChartOfAcc::create([
            'name' => 'Cash at Bank',
            'account_type' => 'Asset',
            'sub_type' => 'cash-and-cash-equivalents',
            'account_code' => '1010',
            'location_id' => $this->location->id,
        ]);

        // Create journal entry with lines so accounts have balances
        $entry = JournalEntry::create([
            'date' => date('Y-m-d'),
            'reference' => 'JE-001',
            'location_id' => $this->location->id,
            'created_by' => $this->user->id,
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $entry->id,
            'chart_of_acc_id' => $this->assetAccount->id,
            'debit' => 5000,
            'credit' => 0,
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $entry->id,
            'chart_of_acc_id' => $this->incomeAccount->id,
            'debit' => 0,
            'credit' => 5000,
        ]);
    }

    public function test_profit_and_loss_report_includes_account_code_and_accepts_show_codes(): void
    {
        $response = $this->actingAs($this->user)
            ->get(route('reports.profit-loss', ['show_codes' => '1']));

        $response->assertStatus(200);
        $response->assertInertia(function ($page) {
            $page->component('Reports/ProfitAndLoss')
                ->where('reportData.income.0.account_code', '4022')
                ->where('reportData.income.0.name', 'Sales Card - Chilaw')
                ->where('filters.show_codes', true);
        });
    }

    public function test_balance_sheet_report_includes_account_code_and_accepts_show_codes(): void
    {
        $response = $this->actingAs($this->user)
            ->get(route('reports.balance-sheet', ['show_codes' => '1']));

        $response->assertStatus(200);
        $response->assertInertia(function ($page) {
            $page->component('Reports/BalanceSheet')
                ->where('reportData.asset.0.account_code', '1010')
                ->where('reportData.asset.0.name', 'Cash at Bank')
                ->where('filters.show_codes', true);
        });
    }
}
