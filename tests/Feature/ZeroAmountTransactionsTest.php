<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Company;
use App\Models\Supplier;
use App\Models\Customer;
use App\Models\Item;
use App\Models\Accounting\ChartOfAcc;
use App\Models\PaymentMethod;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ZeroAmountTransactionsTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Company $company;
    protected ChartOfAcc $bankAccount;
    protected ChartOfAcc $expenseAccount;
    protected ChartOfAcc $incomeAccount;
    protected ChartOfAcc $arAccount;
    protected ChartOfAcc $apAccount;
    protected Supplier $supplier;
    protected Customer $customer;
    protected Item $productItem;
    protected PaymentMethod $paymentMethod;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::first() ?? Company::create(['company_name' => 'Test Company']);
        $this->user = User::first() ?? User::factory()->create();
        $this->actingAs($this->user);

        $currency = \App\Models\Currency::first() ?? \App\Models\Currency::create([
            'code' => 'USD',
            'name' => 'US Dollar',
            'symbol' => '$',
            'is_active' => true,
        ]);

        $this->bankAccount = ChartOfAcc::where('sub_type', 'bank')->first()
            ?? ChartOfAcc::create([
                'name' => 'Test Bank',
                'account_code' => '1000',
                'account_type' => 'asset',
                'sub_type' => 'bank',
                'is_active' => true,
                'currency_id' => $currency->id,
                'company_id' => $this->company->id,
            ]);

        $this->expenseAccount = ChartOfAcc::where('account_type', 'expense')->first()
            ?? ChartOfAcc::create([
                'name' => 'Test Expense',
                'account_code' => '5000',
                'account_type' => 'expense',
                'is_active' => true,
                'currency_id' => $currency->id,
                'company_id' => $this->company->id,
            ]);

        $this->incomeAccount = ChartOfAcc::where('account_type', 'revenue')->first()
            ?? ChartOfAcc::create([
                'name' => 'Test Income',
                'account_code' => '4000',
                'account_type' => 'revenue',
                'sub_type' => 'sales-revenue',
                'is_active' => true,
                'currency_id' => $currency->id,
                'company_id' => $this->company->id,
            ]);

        $this->supplier = Supplier::first() ?? Supplier::create([
            'display_name' => 'Test Supplier',
            'company_name' => 'Test Supplier',
            'company_id' => $this->company->id,
        ]);

        $this->customer = Customer::first() ?? Customer::create([
            'display_name' => 'Test Customer',
            'company_id' => $this->company->id,
        ]);

        $this->productItem = Item::first() ?? Item::create([
            'name' => 'Test Product',
            'type' => 'service',
            'expense_account_id' => $this->expenseAccount->id,
            'income_account_id' => $this->incomeAccount->id,
            'company_id' => $this->company->id,
        ]);

        $this->paymentMethod = PaymentMethod::first() ?? PaymentMethod::create([
            'name' => 'Cash',
            'slug' => 'cash',
        ]);
    }

    public function test_journal_entry_with_zero_amount(): void
    {
        $response = $this->post(route('journal-entries.store'), [
            'date' => now()->toDateString(),
            'reference_no' => 'JE-ZERO-1',
            'description' => 'Zero amount journal entry',
            'lines' => [
                [
                    'account_id' => $this->bankAccount->id,
                    'debit' => 0,
                    'credit' => 0,
                ],
                [
                    'account_id' => $this->expenseAccount->id,
                    'debit' => 0,
                    'credit' => 0,
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('journal_entries', [
            'reference' => 'JE-ZERO-1',
            'total_amount' => 0,
        ]);
    }

    public function test_transfer_with_zero_amount(): void
    {
        $response = $this->post(route('transfer.store'), [
            'transfer_from' => $this->bankAccount->id,
            'transfer_to' => $this->expenseAccount->id,
            'amount' => 0,
            'date' => now()->toDateString(),
            'memo' => 'Zero transfer',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('transfers', [
            'amount' => 0,
            'memo' => 'Zero transfer',
        ]);
    }

    public function test_payment_expense_with_zero_amount(): void
    {
        $response = $this->post(route('payment.store'), [
            'account' => $this->bankAccount->id,
            'date' => now()->toDateString(),
            'method' => $this->paymentMethod->id,
            'ref' => 'EXP-ZERO-1',
            'items' => [
                [
                    'category' => $this->expenseAccount->id,
                    'description' => 'Zero expense',
                    'amount' => '0.00',
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('payments', [
            'reference_no' => 'EXP-ZERO-1',
            'total_amount' => 0,
        ]);
    }

    public function test_cheque_with_zero_amount(): void
    {
        $response = $this->post(route('cheque.store'), [
            'account' => $this->bankAccount->id,
            'date' => now()->toDateString(),
            'cheque_no' => 'CHQ-ZERO-1',
            'items' => [
                [
                    'category' => $this->expenseAccount->id,
                    'description' => 'Zero cheque',
                    'amount' => '0.00',
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('cheques', [
            'cheque_no' => 'CHQ-ZERO-1',
            'total_amount' => 0,
        ]);
    }

    public function test_bill_with_zero_amount(): void
    {
        $response = $this->post(route('bill.store'), [
            'supplier' => $this->supplier->id,
            'billDate' => now()->toDateString(),
            'billNo' => 'BILL-ZERO-1',
            'items' => [
                [
                    'category' => $this->expenseAccount->id,
                    'description' => 'Zero bill item',
                    'amount' => '0.00',
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('bills', [
            'bill_no' => 'BILL-ZERO-1',
            'total_amount' => 0,
        ]);
    }

    public function test_bill_return_with_zero_amount(): void
    {
        $response = $this->post(route('bill-return.store'), [
            'supplier' => $this->supplier->id,
            'date' => now()->toDateString(),
            'reference' => 'BR-ZERO-1',
            'items' => [
                [
                    'category' => $this->expenseAccount->id,
                    'description' => 'Zero bill return',
                    'amount' => '0.00',
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('bill_returns', [
            'total_amount' => 0,
        ]);
    }

    public function test_bank_deposit_with_zero_amount(): void
    {
        $response = $this->post(route('bank-deposit.store'), [
            'depositTo' => $this->bankAccount->id,
            'depositDate' => now()->toDateString(),
            'depositNo' => 'DEP-ZERO-1',
            'items' => [
                [
                    'account' => $this->incomeAccount->id,
                    'amount' => '0.00',
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('bank_deposits', [
            'deposit_no' => 'DEP-ZERO-1',
            'total_amount' => 0,
        ]);
    }

    public function test_sales_invoice_with_zero_amount(): void
    {
        $response = $this->post(route('sales-invoice.store'), [
            'customer' => $this->customer->id,
            'receiptDate' => now()->toDateString(),
            'receiptNo' => 'INV-ZERO-1',
            'depositTo' => $this->bankAccount->id,
            'items' => [
                [
                    'product' => $this->productItem->id,
                    'amount' => '0.00',
                    'qty' => 1,
                    'rate' => '0.00',
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('sales_invoices', [
            'receipt_no' => 'INV-ZERO-1',
            'total_amount' => 0,
        ]);
    }

    public function test_receive_payment_with_zero_amount(): void
    {
        $response = $this->post(route('receive-payment.store'), [
            'customer' => $this->customer->id,
            'amountReceived' => '0.00',
            'paymentDate' => now()->toDateString(),
            'depositTo' => $this->bankAccount->id,
            'paymentMethod' => $this->paymentMethod->id,
            'referenceNo' => 'RP-ZERO-1',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('receive_payments', [
            'reference_no' => 'RP-ZERO-1',
            'amount' => 0,
        ]);
    }

    public function test_pay_bill_with_zero_amount(): void
    {
        $response = $this->post(route('pay-bill.store'), [
            'supplier' => $this->supplier->id,
            'amount' => '0.00',
            'paymentDate' => now()->toDateString(),
            'paymentAccount' => $this->bankAccount->id,
            'referenceNo' => 'PB-ZERO-1',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('bill_payments', [
            'reference_no' => 'PB-ZERO-1',
            'amount' => 0,
        ]);
    }
}
