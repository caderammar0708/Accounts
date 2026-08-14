<?php

namespace Tests\Unit;

use App\Models\ServiceStation\Warranty;
use App\Models\ServiceStation\WarrantyPolicy;
use App\Models\Accounting\SalesInvoiceItem;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Tests\TestCase;

class WarrantyTest extends TestCase
{
    public function test_it_calculates_expiry_dates_from_policy_rules(): void
    {
        $policy = new WarrantyPolicy([
            'duration_days' => 30,
            'duration_km' => 1000,
            'expiry_rule' => 'whichever_first',
        ]);

        $expiry = Warranty::calculateExpiryDates($policy, '2026-07-28', 10000);

        $this->assertSame('2026-08-27', $expiry['end_date']);
        $this->assertSame(11000, $expiry['end_odometer']);
    }

    public function test_sales_invoice_item_has_invoice_relationship(): void
    {
        $item = new SalesInvoiceItem();

        $relation = $item->invoice();

        $this->assertInstanceOf(BelongsTo::class, $relation);
    }
}
