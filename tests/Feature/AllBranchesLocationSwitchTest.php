<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Location;
use App\Models\CompanySetting;
use App\Models\Accounting\ChartOfAcc;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AllBranchesLocationSwitchTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $lockedUser;
    protected $mannarLocation;
    protected $chilawLocation;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure branches enabled in company setting
        CompanySetting::create([
            'branches_enabled' => true,
            'business_type' => 'Normal',
        ]);

        $this->mannarLocation = Location::create([
            'name' => 'Mannar',
            'code' => 'MNR',
            'is_active' => true,
        ]);

        $this->chilawLocation = Location::create([
            'name' => 'Chilaw',
            'code' => 'CHL',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'location_id' => null, // Unrestricted user
        ]);

        $this->lockedUser = User::factory()->create([
            'location_id' => $this->mannarLocation->id, // Locked to Mannar
        ]);
    }

    public function test_unrestricted_user_can_switch_to_all_branches(): void
    {
        $response = $this->actingAs($this->user)
            ->post(route('locations.switch'), [
                'location_id' => 'all',
            ]);

        $response->assertSessionHas('current_location_id', 'all');
        $response->assertSessionHas('success', 'Switched to All Branches.');
    }

    public function test_locked_user_cannot_switch_branches(): void
    {
        $response = $this->actingAs($this->lockedUser)
            ->post(route('locations.switch'), [
                'location_id' => 'all',
            ]);

        $response->assertSessionHas('error', 'You are locked to a specific branch and cannot switch branches.');
    }

    public function test_set_current_location_middleware_preserves_all_branches(): void
    {
        $response = $this->actingAs($this->user)
            ->withSession(['current_location_id' => 'all'])
            ->get(route('dashboard'));

        $response->assertOk();
        $this->assertEquals('all', session('current_location_id'));
    }

    public function test_location_scope_skips_filter_when_all_branches_selected(): void
    {
        $mannarAcc = ChartOfAcc::create([
            'name' => 'Mannar Office Supplies',
            'account_type' => 'expense',
            'account_code' => '5401',
            'location_id' => $this->mannarLocation->id,
        ]);

        $chilawAcc = ChartOfAcc::create([
            'name' => 'Chilaw Rent Expense',
            'account_type' => 'expense',
            'account_code' => '5402',
            'location_id' => $this->chilawLocation->id,
        ]);

        $commonAcc = ChartOfAcc::create([
            'name' => 'Common Bank Charges',
            'account_type' => 'expense',
            'account_code' => '5403',
            'location_id' => null,
        ]);

        // 1. Scoped to Mannar
        session(['current_location_id' => $this->mannarLocation->id]);
        $mannarAccounts = ChartOfAcc::pluck('name')->toArray();
        $this->assertContains('Mannar Office Supplies', $mannarAccounts);
        $this->assertContains('Common Bank Charges', $mannarAccounts);
        $this->assertNotContains('Chilaw Rent Expense', $mannarAccounts);

        // 2. Scoped to Chilaw
        session(['current_location_id' => $this->chilawLocation->id]);
        $chilawAccounts = ChartOfAcc::pluck('name')->toArray();
        $this->assertContains('Chilaw Rent Expense', $chilawAccounts);
        $this->assertContains('Common Bank Charges', $chilawAccounts);
        $this->assertNotContains('Mannar Office Supplies', $chilawAccounts);

        // 3. Scoped to All Branches
        session(['current_location_id' => 'all']);
        $allAccounts = ChartOfAcc::pluck('name')->toArray();
        $this->assertContains('Mannar Office Supplies', $allAccounts);
        $this->assertContains('Chilaw Rent Expense', $allAccounts);
        $this->assertContains('Common Bank Charges', $allAccounts);
    }

    public function test_can_create_account_with_common_location_when_in_all_branches(): void
    {
        $response = $this->actingAs($this->user)
            ->withSession(['current_location_id' => 'all'])
            ->post(route('chart-of-account.store'), [
                'name' => 'Global Utility Expense',
                'account_type' => 'expense',
                'account_code' => '5499',
                'location_id' => null,
            ]);

        $response->assertSessionHasNoErrors();

        // Scope to all to find it
        session(['current_location_id' => 'all']);
        $createdAccount = ChartOfAcc::where('name', 'Global Utility Expense')->first();
        $this->assertNotNull($createdAccount);
        $this->assertNull($createdAccount->location_id);
    }

    public function test_can_create_account_with_specific_location_when_in_all_branches(): void
    {
        $response = $this->actingAs($this->user)
            ->withSession(['current_location_id' => 'all'])
            ->post(route('chart-of-account.store'), [
                'name' => 'Mannar Specific Fuel',
                'account_type' => 'expense',
                'account_code' => '5498',
                'location_id' => $this->mannarLocation->id,
            ]);

        $response->assertSessionHasNoErrors();

        session(['current_location_id' => 'all']);
        $createdAccount = ChartOfAcc::where('name', 'Mannar Specific Fuel')->first();
        $this->assertNotNull($createdAccount);
        $this->assertEquals($this->mannarLocation->id, $createdAccount->location_id);
    }
}
