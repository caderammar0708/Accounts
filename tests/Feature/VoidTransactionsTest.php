<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Item;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Accounting\ReceivePayment;
use App\Models\Accounting\ReceivePaymentAllocation;
use App\Models\Accounting\SalesInvoice;
use App\Models\Accounting\SalesInvoiceItem;
use App\Models\Accounting\CreditInvoice;
use App\Models\Accounting\CreditInvoiceItem;
use App\Models\Accounting\Bill;
use App\Models\Accounting\BillItem;
use App\Models\Accounting\BillPayment;
use App\Models\Accounting\BillPaymentAllocation;
use App\Models\Accounting\Payment;
use App\Models\Accounting\PaymentItem;
use App\Models\Accounting\Transfer;
use App\Models\Accounting\Cheque;
use App\Models\Accounting\BankDeposit;
use App\Models\Accounting\ChequeDeposit;
use App\Models\Accounting\ChequeDepositItem;
use App\Models\Accounting\InvoiceReturn;
use App\Models\Accounting\InvoiceReturnItem;
use App\Models\Accounting\BillReturn;
use App\Models\Accounting\BillReturnItem;
use App\Models\Accounting\InventoryQuantityAdjustment;
use App\Models\Accounting\InventoryQuantityAdjustmentItem;

use Illuminate\Foundation\Testing\RefreshDatabase;

class VoidTransactionsTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $company;
    protected $bankAcc;
    protected $salesAcc;
    protected $expenseAcc;
    protected $arAcc;
    protected $apAcc;
    protected $inventoryAcc;
    protected $customer;
    protected $supplier;
    protected $inventoryItem;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::query()->first() ?: Company::create([
            'company_name' => 'Void Test Corp',
            'home_currency' => 'USD',
            'home_currency_prefix' => '$',
        ]);

        $this->user = User::query()->first() ?: User::factory()->create();

        $currency = \App\Models\Currency::query()->first() ?: \App\Models\Currency::create([
            'code' => 'USD',
            'name' => 'US Dollar',
            'symbol' => '$',
            'is_active' => true,
        ]);

        $this->bankAcc = ChartOfAcc::query()->where('sub_type', 'bank')->first()
            ?: ChartOfAcc::create([
                'name' => 'Void Test Bank',
                'account_type' => 'asset',
                'sub_type' => 'bank',
                'account_code' => 'VT-BANK',
                'currency_id' => $currency->id,
                'status' => 'active',
            ]);

        $this->salesAcc = ChartOfAcc::query()->where('account_type', 'revenue')->first()
            ?: ChartOfAcc::create([
                'name' => 'Void Test Sales',
                'account_type' => 'revenue',
                'sub_type' => 'sales-revenue',
                'account_code' => 'VT-REV',
                'currency_id' => $currency->id,
                'status' => 'active',
            ]);

        $this->expenseAcc = ChartOfAcc::query()->where('account_type', 'expense')->first()
            ?: ChartOfAcc::create([
                'name' => 'Void Test Expense',
                'account_type' => 'expense',
                'sub_type' => 'general-expense',
                'account_code' => 'VT-EXP',
                'currency_id' => $currency->id,
                'status' => 'active',
            ]);

        $this->arAcc = ChartOfAcc::getOrCreateDefault('accounts-receivable');
        $this->apAcc = ChartOfAcc::getOrCreateDefault('accounts-payable');
        $this->inventoryAcc = ChartOfAcc::getOrCreateDefault('inventory');

        $this->customer = Customer::query()->first() ?: Customer::create([
            'first_name' => 'Void',
            'last_name' => 'Customer',
            'display_name' => 'Void Customer',
            'company_id' => $this->company->id,
        ]);

        $this->supplier = Supplier::query()->first() ?: Supplier::create([
            'first_name' => 'Void',
            'last_name' => 'Supplier',
            'display_name' => 'Void Supplier',
            'company_id' => $this->company->id,
        ]);

        $this->inventoryItem = Item::create([
            'name' => 'Void Test Product',
            'type' => 'inventory',
            'sale_price' => 100,
            'purchase_price' => 50,
            'quantity_on_hand' => 10,
            'inventory_account_id' => $this->inventoryAcc->id,
            'income_account_id' => $this->salesAcc->id,
            'expense_account_id' => $this->expenseAcc->id,
        ]);
    }

    public function test_void_receive_payment(): void
    {
        $rp = ReceivePayment::create([
            'customer_id' => $this->customer->id,
            'amount' => 150,
            'payment_date' => now()->toDateString(),
            'deposit_to_account_id' => $this->bankAcc->id,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        $je = JournalEntry::create([
            'transaction_type' => 'receive_payment',
            'transactionable_type' => ReceivePayment::class,
            'transactionable_id' => $rp->id,
            'date' => now()->toDateString(),
            'total_amount' => 150,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        $line1 = JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'chart_of_acc_id' => $this->bankAcc->id,
            'debit' => 150,
            'credit' => 0,
        ]);

        $line2 = JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'chart_of_acc_id' => $this->arAcc->id,
            'debit' => 0,
            'credit' => 150,
        ]);

        $response = $this->actingAs($this->user)->post(route('receive-payment.void', $je->id));
        $response->assertSessionHas('success');

        $rp->refresh();
        $je->refresh();
        $line1->refresh();
        $line2->refresh();

        $this->assertEquals('void', $rp->status);
        $this->assertNotNull($rp->voided_at);
        $this->assertEquals('void', $je->status);
        $this->assertNotNull($je->voided_at);
        $this->assertEquals(0, $je->total_amount);
        $this->assertEquals(0, $line1->debit);
        $this->assertEquals(0, $line2->credit);
    }

    public function test_void_sales_invoice_reverts_inventory(): void
    {
        $initialQty = $this->inventoryItem->quantity_on_hand;

        $si = SalesInvoice::create([
            'customer_id' => $this->customer->id,
            'receipt_no' => 'SI-VOID-1',
            'receipt_date' => now()->toDateString(),
            'deposit_to_account_id' => $this->bankAcc->id,
            'total_amount' => 200,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        SalesInvoiceItem::create([
            'sales_invoice_id' => $si->id,
            'item_id' => $this->inventoryItem->id,
            'quantity' => 2,
            'rate' => 100,
            'amount' => 200,
        ]);

        // Simulating the inventory decrement that happens during sale
        $this->inventoryItem->decrement('quantity_on_hand', 2);
        $this->assertEquals($initialQty - 2, $this->inventoryItem->fresh()->quantity_on_hand);

        $je = JournalEntry::create([
            'transaction_type' => 'sales_invoice',
            'transactionable_type' => SalesInvoice::class,
            'transactionable_id' => $si->id,
            'date' => now()->toDateString(),
            'total_amount' => 200,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'chart_of_acc_id' => $this->bankAcc->id,
            'debit' => 200,
            'credit' => 0,
        ]);

        $response = $this->actingAs($this->user)->post(route('sales-invoice.void', $je->id));
        $response->assertSessionHas('success');

        $si->refresh();
        $je->refresh();

        $this->assertEquals('void', $si->status);
        $this->assertNotNull($si->voided_at);
        $this->assertEquals('void', $je->status);
        $this->assertEquals(0, $je->total_amount);
        $this->assertEquals($initialQty, $this->inventoryItem->fresh()->quantity_on_hand);
    }

    public function test_void_credit_invoice(): void
    {
        $ci = CreditInvoice::create([
            'customer_id' => $this->customer->id,
            'invoice_no' => 'CI-VOID-1',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'total_amount' => 300,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        CreditInvoiceItem::create([
            'credit_invoice_id' => $ci->id,
            'item_id' => $this->inventoryItem->id,
            'quantity' => 1,
            'rate' => 300,
            'amount' => 300,
        ]);

        $je = JournalEntry::create([
            'transaction_type' => 'credit_invoice',
            'transactionable_type' => CreditInvoice::class,
            'transactionable_id' => $ci->id,
            'date' => now()->toDateString(),
            'total_amount' => 300,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'chart_of_acc_id' => $this->arAcc->id,
            'debit' => 300,
            'credit' => 0,
        ]);

        $response = $this->actingAs($this->user)->post(route('credit-invoice.void', $je->id));
        $response->assertSessionHas('success');

        $ci->refresh();
        $je->refresh();

        $this->assertEquals('void', $ci->status);
        $this->assertNotNull($ci->voided_at);
        $this->assertEquals('void', $je->status);
        $this->assertEquals(0, $je->total_amount);
    }

    public function test_void_transfer(): void
    {
        $transfer = Transfer::create([
            'from_account_id' => $this->bankAcc->id,
            'to_account_id' => $this->arAcc->id,
            'amount' => 500,
            'date' => now()->toDateString(),
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        $je = JournalEntry::create([
            'transaction_type' => 'transfer',
            'transactionable_type' => Transfer::class,
            'transactionable_id' => $transfer->id,
            'date' => now()->toDateString(),
            'total_amount' => 500,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'chart_of_acc_id' => $this->bankAcc->id,
            'debit' => 0,
            'credit' => 500,
        ]);

        $response = $this->actingAs($this->user)->post(route('transfer.void', $je->id));
        $response->assertSessionHas('success');

        $transfer->refresh();
        $je->refresh();

        $this->assertEquals('void', $transfer->status);
        $this->assertNotNull($transfer->voided_at);
        $this->assertEquals('void', $je->status);
        $this->assertEquals(0, $je->total_amount);
    }

    public function test_void_journal_entry(): void
    {
        $je = JournalEntry::create([
            'transaction_type' => 'journal_entry',
            'date' => now()->toDateString(),
            'total_amount' => 450,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'chart_of_acc_id' => $this->expenseAcc->id,
            'debit' => 450,
            'credit' => 0,
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'chart_of_acc_id' => $this->bankAcc->id,
            'debit' => 0,
            'credit' => 450,
        ]);

        $response = $this->actingAs($this->user)->post(route('journal-entries.void', $je->id));
        $response->assertSessionHas('success');

        $je->refresh();

        $this->assertEquals('void', $je->status);
        $this->assertNotNull($je->voided_at);
        $this->assertEquals(0, $je->total_amount);
        $this->assertEquals(0, $je->lines()->sum('debit'));
        $this->assertEquals(0, $je->lines()->sum('credit'));
    }

    public function test_void_bill(): void
    {
        $initialQty = $this->inventoryItem->quantity_on_hand;

        $bill = Bill::create([
            'supplier_id' => $this->supplier->id,
            'bill_no' => 'BILL-VOID-1',
            'bill_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'total_amount' => 100,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        BillItem::create([
            'bill_id' => $bill->id,
            'item_id' => $this->inventoryItem->id,
            'chart_of_acc_id' => $this->inventoryAcc->id,
            'quantity' => 2,
            'rate' => 50,
            'amount' => 100,
        ]);

        $this->inventoryItem->increment('quantity_on_hand', 2);
        $this->assertEquals($initialQty + 2, $this->inventoryItem->fresh()->quantity_on_hand);

        $je = JournalEntry::create([
            'transaction_type' => 'bill',
            'transactionable_type' => Bill::class,
            'transactionable_id' => $bill->id,
            'date' => now()->toDateString(),
            'total_amount' => 100,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'chart_of_acc_id' => $this->inventoryAcc->id,
            'debit' => 100,
            'credit' => 0,
        ]);

        $response = $this->actingAs($this->user)->post(route('bill.void', $je->id));
        $response->assertSessionHas('success');

        $bill->refresh();
        $je->refresh();

        $this->assertEquals('void', $bill->status);
        $this->assertNotNull($bill->voided_at);
        $this->assertEquals('void', $je->status);
        $this->assertEquals(0, $je->total_amount);
        $this->assertEquals($initialQty, $this->inventoryItem->fresh()->quantity_on_hand);
    }

    public function test_void_payment(): void
    {
        $payment = Payment::create([
            'payee_id' => $this->supplier->id,
            'payee_type' => Supplier::class,
            'payment_account_id' => $this->bankAcc->id,
            'payment_date' => now()->toDateString(),
            'total_amount' => 75,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        $je = JournalEntry::create([
            'transaction_type' => 'payment',
            'transactionable_type' => Payment::class,
            'transactionable_id' => $payment->id,
            'date' => now()->toDateString(),
            'total_amount' => 75,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'chart_of_acc_id' => $this->expenseAcc->id,
            'debit' => 75,
            'credit' => 0,
        ]);

        $response = $this->actingAs($this->user)->post(route('payment.void', $je->id));
        $response->assertSessionHas('success');

        $payment->refresh();
        $je->refresh();

        $this->assertEquals('void', $payment->status);
        $this->assertNotNull($payment->voided_at);
        $this->assertEquals('void', $je->status);
        $this->assertEquals(0, $je->total_amount);
    }

    public function test_void_cheque(): void
    {
        $cheque = Cheque::create([
            'payee_id' => $this->supplier->id,
            'payee_type' => Supplier::class,
            'bank_account_id' => $this->bankAcc->id,
            'payment_date' => now()->toDateString(),
            'cheque_no' => 'CHQ-1001',
            'total_amount' => 120,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        $je = JournalEntry::create([
            'transaction_type' => 'cheque',
            'transactionable_type' => Cheque::class,
            'transactionable_id' => $cheque->id,
            'date' => now()->toDateString(),
            'total_amount' => 120,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'chart_of_acc_id' => $this->bankAcc->id,
            'debit' => 0,
            'credit' => 120,
        ]);

        $response = $this->actingAs($this->user)->post(route('cheque.void', $je->id));
        $response->assertSessionHas('success');

        $cheque->refresh();
        $je->refresh();

        $this->assertEquals('void', $cheque->status);
        $this->assertNotNull($cheque->voided_at);
        $this->assertEquals('void', $je->status);
        $this->assertEquals(0, $je->total_amount);
    }

    public function test_void_bank_deposit(): void
    {
        $deposit = BankDeposit::create([
            'deposit_no' => 'DEP-1001',
            'deposit_date' => now()->toDateString(),
            'deposit_to_account_id' => $this->bankAcc->id,
            'total_amount' => 600,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        $je = JournalEntry::create([
            'transaction_type' => 'bank_deposit',
            'transactionable_type' => BankDeposit::class,
            'transactionable_id' => $deposit->id,
            'date' => now()->toDateString(),
            'total_amount' => 600,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'chart_of_acc_id' => $this->bankAcc->id,
            'debit' => 600,
            'credit' => 0,
        ]);

        $response = $this->actingAs($this->user)->post(route('bank-deposit.void', $je->id));
        $response->assertSessionHas('success');

        $deposit->refresh();
        $je->refresh();

        $this->assertEquals('void', $deposit->status);
        $this->assertNotNull($deposit->voided_at);
        $this->assertEquals('void', $je->status);
        $this->assertEquals(0, $je->total_amount);
    }

    public function test_void_cheque_deposit_releases_cheques(): void
    {
        $rp = ReceivePayment::create([
            'customer_id' => $this->customer->id,
            'amount' => 250,
            'payment_date' => now()->toDateString(),
            'deposit_to_account_id' => $this->bankAcc->id,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        $deposit = ChequeDeposit::create([
            'deposit_no' => 'CD-1001',
            'deposit_date' => now()->toDateString(),
            'deposit_to_account_id' => $this->bankAcc->id,
            'total_amount' => 250,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        $rp->update(['cheque_deposit_id' => $deposit->id]);

        $je = JournalEntry::create([
            'transaction_type' => 'cheque_deposit',
            'transactionable_type' => ChequeDeposit::class,
            'transactionable_id' => $deposit->id,
            'date' => now()->toDateString(),
            'total_amount' => 250,
            'created_by' => $this->user->id,
            'status' => 'posted',
        ]);

        JournalEntryLine::create([
            'journal_entry_id' => $je->id,
            'chart_of_acc_id' => $this->bankAcc->id,
            'debit' => 250,
            'credit' => 0,
        ]);

        $response = $this->actingAs($this->user)->post(route('cheque-deposit.void', $je->id));
        $response->assertSessionHas('success');

        $deposit->refresh();
        $rp->refresh();
        $je->refresh();

        $this->assertEquals('void', $deposit->status);
        $this->assertNotNull($deposit->voided_at);
        $this->assertNull($rp->cheque_deposit_id);
        $this->assertEquals('void', $je->status);
        $this->assertEquals(0, $je->total_amount);
    }
}
