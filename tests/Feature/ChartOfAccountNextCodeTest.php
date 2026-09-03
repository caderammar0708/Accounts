<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Location;
use App\Models\Accounting\ChartOfAcc;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ChartOfAccountNextCodeTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $mannarLocation;
    protected $chilawLocation;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

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
    }

    public function test_account_code_increments_globally_across_locations(): void
    {
        // 1. In Mannar branch: Create expense accounts with codes 5400 to 5405
        session(['current_location_id' => $this->mannarLocation->id]);

        for ($code = 5400; $code <= 5405; $code++) {
            ChartOfAcc::create([
                'name' => "Mannar Expense {$code}",
                'account_type' => 'expense',
                'account_code' => (string) $code,
                'location_id' => $this->mannarLocation->id,
            ]);
        }

        // Mannar branch should suggest 5406
        $responseMannar = $this->actingAs($this->user)
            ->withSession(['current_location_id' => $this->mannarLocation->id])
            ->getJson(route('api.accounts.next-code', ['type' => 'expense']));

        $responseMannar->assertOk();
        $this->assertEquals('5406', $responseMannar->json('next_code'));

        // 2. Switch to Chilaw branch: It should still suggest 5406 (not reset to 5000 or Chilaw's local max)
        $responseChilaw = $this->actingAs($this->user)
            ->withSession(['current_location_id' => $this->chilawLocation->id])
            ->getJson(route('api.accounts.next-code', ['type' => 'expense']));

        $responseChilaw->assertOk();
        $this->assertEquals('5406', $responseChilaw->json('next_code'));

        // 3. Create account 5406 in Chilaw
        ChartOfAcc::create([
            'name' => 'Chilaw Expense 5406',
            'account_type' => 'expense',
            'account_code' => '5406',
            'location_id' => $this->chilawLocation->id,
        ]);

        // 4. Now both branches should suggest 5407
        $responseChilawNext = $this->actingAs($this->user)
            ->withSession(['current_location_id' => $this->chilawLocation->id])
            ->getJson(route('api.accounts.next-code', ['type' => 'expense']));

        $responseChilawNext->assertOk();
        $this->assertEquals('5407', $responseChilawNext->json('next_code'));

        $responseMannarNext = $this->actingAs($this->user)
            ->withSession(['current_location_id' => $this->mannarLocation->id])
            ->getJson(route('api.accounts.next-code', ['type' => 'expense']));

        $responseMannarNext->assertOk();
        $this->assertEquals('5407', $responseMannarNext->json('next_code'));
    }

    public function test_chart_of_account_can_be_created_without_account_code(): void
    {
        // 1. Create first account with empty string account_code
        $response1 = $this->actingAs($this->user)
            ->post(route('chart-of-account.store'), [
                'name' => 'General Office Expense',
                'account_type' => 'expense',
                'sub_type' => 'office-supplies',
                'account_code' => '',
            ]);

        $response1->assertSessionHasNoErrors();
        $this->assertDatabaseHas('chart_of_accs', [
            'name' => 'General Office Expense',
            'account_code' => null,
            'account_type' => 'expense',
        ]);

        // 2. Create second account with null account_code (verify multiple null codes allowed)
        $response2 = $this->actingAs($this->user)
            ->post(route('chart-of-account.store'), [
                'name' => 'Travel Expense',
                'account_type' => 'expense',
                'sub_type' => 'travel',
                'account_code' => null,
            ]);

        $response2->assertSessionHasNoErrors();
        $this->assertDatabaseHas('chart_of_accs', [
            'name' => 'Travel Expense',
            'account_code' => null,
            'account_type' => 'expense',
        ]);

        // 3. Verify lookup API formats label correctly without " - " prefix
        $lookupResponse = $this->actingAs($this->user)
            ->getJson(route('api.accounts', ['search' => 'General Office Expense']));

        $lookupResponse->assertOk();
        $accounts = $lookupResponse->json();
        $matched = collect($accounts)->firstWhere('label', 'General Office Expense');
        $this->assertNotNull($matched);
    }
}

