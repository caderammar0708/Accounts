<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Item;
use App\Models\Location;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\InventoryQuantityAdjustment;
use App\Models\Accounting\JournalEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;

class InventoryQuantityAdjustmentTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $location;
    protected $adjustmentAccount;
    protected $inventoryAssetAccount;
    protected $item;

    protected function setUp(): void
    {
        parent::setUp();

        $this->location = Location::create([
            'name' => 'Main Branch',
            'code' => 'MAIN',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create();

        $this->adjustmentAccount = ChartOfAcc::create([
            'name' => 'Inventory Shrinkage',
            'account_type' => 'expense',
            'sub_type' => 'inventory_adjustment',
            'account_code' => '5100',
            'location_id' => $this->location->id,
        ]);

        $this->inventoryAssetAccount = ChartOfAcc::create([
            'name' => 'Inventory Asset',
            'account_type' => 'asset',
            'sub_type' => 'inventory',
            'account_code' => '1200',
            'location_id' => $this->location->id,
        ]);

        $this->item = Item::create([
            'type' => 'inventory',
            'name' => 'Test Brake Pad',
            'sku' => 'BP-001',
            'track_inventory' => true,
            'quantity_on_hand' => 20,
            'purchase_price' => 50,
            'inventory_account_id' => $this->inventoryAssetAccount->id,
            'location_id' => $this->location->id,
        ]);
    }

    public function test_store_fails_with_validation_errors_when_items_are_missing(): void
    {
        $response = $this->actingAs($this->user)
            ->withSession(['current_location_id' => $this->location->id])
            ->postJson(route('inventory-adjustment.store'), [
                'adjustment_date' => now()->toDateString(),
                'reference_number' => 'ADJ-101',
                'adjustment_reason' => 'Damaged Goods',
                'inventory_adjustment_account_id' => $this->adjustmentAccount->id,
                'items' => [],
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['items']);
        $this->assertStringContainsString('Please select at least one product', $response->json('errors.items.0'));
    }

    public function test_store_fails_with_validation_errors_when_adjustment_account_is_missing(): void
    {
        $response = $this->actingAs($this->user)
            ->withSession(['current_location_id' => $this->location->id])
            ->postJson(route('inventory-adjustment.store'), [
                'adjustment_date' => now()->toDateString(),
                'reference_number' => 'ADJ-102',
                'adjustment_reason' => 'Damaged Goods',
                'inventory_adjustment_account_id' => '',
                'items' => [
                    [
                        'item_id' => $this->item->id,
                        'qty_on_hand' => 20,
                        'new_qty' => 15,
                        'change_in_qty' => -5,
                    ]
                ],
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['inventory_adjustment_account_id']);
    }

    public function test_store_successfully_creates_adjustment_and_updates_item_quantity(): void
    {
        $response = $this->actingAs($this->user)
            ->withSession(['current_location_id' => $this->location->id])
            ->post(route('inventory-adjustment.store', ['action' => 'save']), [
                'adjustment_date' => now()->toDateString(),
                'reference_number' => 'ADJ-103',
                'adjustment_reason' => 'Stocktaking',
                'inventory_adjustment_account_id' => $this->adjustmentAccount->id,
                'memo' => 'Routine stock count',
                'items' => [
                    [
                        'item_id' => $this->item->id,
                        'description' => 'Count adjustment',
                        'qty_on_hand' => 20,
                        'new_qty' => 25,
                        'change_in_qty' => 5,
                    ]
                ],
            ]);

        $response->assertSessionHas('success');

        // Check Item quantity updated
        $this->item->refresh();
        $this->assertEquals(25, $this->item->quantity_on_hand);

        // Check InventoryQuantityAdjustment record created
        $adjustment = InventoryQuantityAdjustment::where('reference_number', 'ADJ-103')->first();
        $this->assertNotNull($adjustment);
        $this->assertEquals('Stocktaking', $adjustment->adjustment_reason);
        $this->assertCount(1, $adjustment->items);
        $this->assertEquals(25, $adjustment->items->first()->new_qty);
        $this->assertEquals(5, $adjustment->items->first()->change_in_qty);

        // Check JournalEntry created
        $je = JournalEntry::where('transactionable_id', $adjustment->id)
            ->where('transactionable_type', InventoryQuantityAdjustment::class)
            ->first();
        $this->assertNotNull($je);
        $this->assertEquals(250.0, (float) $je->total_amount); // 5 * 50
    }

    public function test_update_successfully_modifies_adjustment_and_item_quantity(): void
    {
        // 1. Create initial adjustment
        $createResponse = $this->actingAs($this->user)
            ->withSession(['current_location_id' => $this->location->id])
            ->post(route('inventory-adjustment.store', ['action' => 'save']), [
                'adjustment_date' => now()->toDateString(),
                'reference_number' => 'ADJ-104',
                'adjustment_reason' => 'Stocktaking',
                'inventory_adjustment_account_id' => $this->adjustmentAccount->id,
                'items' => [
                    [
                        'item_id' => $this->item->id,
                        'qty_on_hand' => 20,
                        'new_qty' => 30,
                        'change_in_qty' => 10,
                    ]
                ],
            ]);

        $createResponse->assertSessionHasNoErrors();

        $adjustment = InventoryQuantityAdjustment::where('reference_number', 'ADJ-104')->first();
        $this->assertNotNull($adjustment);
        $je = JournalEntry::where('transactionable_id', $adjustment->id)->first();

        // 2. Update adjustment to new qty 18 (change = -2 from original 20)
        $response = $this->actingAs($this->user)
            ->withSession(['current_location_id' => $this->location->id])
            ->patch(route('inventory-adjustment.update', ['journalEntry' => $je->id, 'action' => 'save']), [
                'adjustment_date' => now()->toDateString(),
                'reference_number' => 'ADJ-104',
                'adjustment_reason' => 'Damaged Goods',
                'inventory_adjustment_account_id' => $this->adjustmentAccount->id,
                'items' => [
                    [
                        'item_id' => $this->item->id,
                        'qty_on_hand' => 20,
                        'new_qty' => 18,
                        'change_in_qty' => -2,
                    ]
                ],
            ]);

        $response->assertSessionHas('success');

        $this->item->refresh();
        $this->assertEquals(18, $this->item->quantity_on_hand);

        $adjustment->refresh();
        $this->assertEquals('Damaged Goods', $adjustment->adjustment_reason);
        $this->assertEquals(18, $adjustment->items->first()->new_qty);
    }

    public function test_recent_records_endpoint_returns_inventory_adjustments(): void
    {
        $this->actingAs($this->user)
            ->withSession(['current_location_id' => $this->location->id])
            ->post(route('inventory-adjustment.store', ['action' => 'save']), [
                'adjustment_date' => '2026-09-01',
                'reference_number' => 'ADJ-HIST-1',
                'adjustment_reason' => 'Damaged Goods',
                'inventory_adjustment_account_id' => $this->adjustmentAccount->id,
                'memo' => 'Recent record memo test',
                'items' => [
                    [
                        'item_id' => $this->item->id,
                        'qty_on_hand' => 20,
                        'new_qty' => 15,
                        'change_in_qty' => -5,
                    ]
                ],
            ]);

        $response = $this->actingAs($this->user)
            ->withSession(['current_location_id' => $this->location->id])
            ->getJson(route('api.history', ['transactionType' => 'inventory_adjustment', 'limit' => 5]));

        $response->assertOk();
        $data = $response->json();
        $this->assertIsArray($data);
        $this->assertNotEmpty($data);

        $first = $data[0];
        $this->assertEquals('ADJ-HIST-1', $first['ref_no']);
        $this->assertEquals('2026-09-01', $first['date']);
        $this->assertStringContainsString('Recent record memo test', $first['memo']);
        $this->assertEquals(250.0, (float) $first['amount']); // 5 * 50
    }
}
