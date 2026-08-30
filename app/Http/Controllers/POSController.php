<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Item;
use App\Models\Customer;
use App\Models\PaymentMethod;
use App\Models\ServiceStation\Warranty;
use App\Models\ServiceStation\WarrantyPolicy;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Accounting\SalesInvoice;
use App\Models\Accounting\SalesInvoiceItem;
use App\Models\Accounting\CreditInvoice;
use App\Models\Accounting\CreditInvoiceItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\Accounting\SalesInvoiceRequest;

class POSController extends Controller
{
    public function index()
    {
        $settings = \App\Models\CompanySetting::first();
        if (!$settings || !$settings->pos_layout_enabled) {
            abort(403, 'POS feature is disabled. Enable it from Layout Settings.');
        }

        // Fetch Items (Inventory, Service, Bundle, Non-Inventory)
        $items = Item::query()
            ->whereIn('type', ['inventory', 'service', 'bundle', 'non-inventory'])
            ->orderBy('name')
            ->get();

        $paymentMethods = $this->paymentMethods();
        $warrantyPolicies = WarrantyPolicy::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'applies_to', 'duration_days', 'duration_km', 'expiry_rule']);

        // Pre-select default deposit account (first bank or asset account)
        $defaultDepositAccount = ChartOfAcc::query()
            ->whereIn('account_type', ['bank', 'asset'])
            ->orderBy('id')
            ->first(['id', 'name']);

        return Inertia::render('POS/Index', [
            'items'                 => $items,
            'paymentMethods'        => $paymentMethods,
            'warrantyPolicies'      => $warrantyPolicies,
            'nextReceiptNo'         => $this->getNextReceiptNo(),
            'existingReceipt'       => null,
            'defaultDepositAccount' => $defaultDepositAccount,
        ]);
    }

    public function store(SalesInvoiceRequest $request)
    {
        $validated = $request->validated();
        try {
            \App\Services\BooksLockService::check($request->receiptDate, $request->books_pin);
            $journalEntry = DB::transaction(function() use ($request) {
                // Filter out empty items
                $items = collect($request->items)->filter(function($item) {
                    return !empty($item['product']) && isset($item['amount']) && $item['amount'] !== '';
                })->values()->all();

                if (empty($items)) {
                    throw new \Exception('At least one item with product and amount is required.');
                }

                $repairingCost = (float)($request->repairingCost ?? 0);
                
                $totalAmount = collect($items)->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                }) + $repairingCost;

                $customerId = $request->customer;
                if ($request->vehicle_id) {
                    $vehicle = \App\Models\ServiceStation\Vehicle::find($request->vehicle_id);
                    if ($vehicle && $vehicle->customer_id) {
                        $customerId = $vehicle->customer_id;
                    }
                }

                if (!$customerId || !\App\Models\Customer::where('id', $customerId)->exists()) {
                    $walkIn = \App\Models\Customer::firstOrCreate(
                        ['display_name' => 'Walk-in Customer'],
                        ['first_name' => 'Walk-in', 'last_name' => 'Customer']
                    );
                    $customerId = $walkIn->id;
                }

                // 1. Save Document (Business Details)
                if ($request->action === 'credit_sale') {
                    $receipt = CreditInvoice::create([
                        'invoice_no' => $request->receiptNo,
                        'customer_id' => $customerId,
                        'email' => $request->email,
                        'invoice_date' => $request->receiptDate,
                        'due_date' => $request->receiptDate, // For POS, due date is same as invoice date
                        'total_amount' => $totalAmount,
                        'memo' => $request->memo,
                        'status' => 'posted',
                    ]);

                    foreach ($items as $itemData) {
                        CreditInvoiceItem::create([
                            'credit_invoice_id' => $receipt->id,
                            'item_id' => $itemData['product'],
                            'description' => $itemData['description'] ?? '',
                            'quantity' => (float)str_replace(',', '', $itemData['qty'] ?? 1),
                            'rate' => (float)str_replace(',', '', $itemData['rate'] ?? 0),
                            'amount' => (float) str_replace(',', '', $itemData['amount']),
                            'service_date' => $itemData['serviceDate'] ?? null,
                        ]);
                    }
                } else {
                    $receipt = SalesInvoice::create([
                        'receipt_no' => $request->receiptNo,
                        'customer_id' => $customerId,
                        'vehicle_id' => $request->vehicle_id,
                        'email' => $request->email,
                        'receipt_date' => $request->receiptDate,
                        'payment_method_id' => $request->paymentMethod,
                        'deposit_to_account_id' => $request->depositTo,
                        'total_amount' => $totalAmount,
                        'memo' => $request->memo,
                        'statement_message' => $request->statementMessage,
                        'status' => 'posted',
                    ]);

                    foreach ($items as $itemData) {
                        $invoiceItem = SalesInvoiceItem::create([
                            'sales_invoice_id' => $receipt->id,
                            'item_id' => $itemData['product'],
                            'description' => $itemData['description'] ?? '',
                            'quantity' => (float)str_replace(',', '', $itemData['qty'] ?? 1),
                            'rate' => (float)str_replace(',', '', $itemData['rate'] ?? 0),
                            'amount' => (float) str_replace(',', '', $itemData['amount']),
                            'service_date' => $itemData['serviceDate'] ?? null,
                        ]);

                        $this->createWarrantyForInvoiceItem($itemData, $invoiceItem, $receipt);
                    }
                }

                // 2. Save Financial Truth (Journal Entry)
                $journalEntry = JournalEntry::create([
                    'date' => $request->receiptDate,
                    'reference' => $request->receiptNo,
                    'description' => $request->memo,
                    'transaction_type' => 'pos', // For POS, transaction type is always 'pos'
                    'payee_id' => $customerId,
                    'payee_type' => Customer::class,
                    'total_amount' => $totalAmount,
                    'status' => 'posted',
                    'created_by' => Auth::id(),
                    'transactionable_id' => $receipt->id,
                    'transactionable_type' => $request->action === 'credit_sale' ? CreditInvoice::class : SalesInvoice::class,
                ]);

                if ($request->action === 'credit_sale') {
                    $arAccount = ChartOfAcc::getOrCreateDefault('accounts-receivable');
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $arAccount->id,
                        'debit' => $totalAmount,
                        'credit' => 0,
                        'memo' => $request->memo,
                    ]);
                } else {
                    // Debit Cash/Bank (Deposit To)
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $request->depositTo,
                        'debit' => $totalAmount,
                        'credit' => 0,
                        'memo' => $request->memo,
                    ]);
                }

                // Credit Income accounts
                foreach ($items as $itemData) {
                    $itemModel = Item::find($itemData['product']);
                    $incomeAccount = $itemModel?->income_account_id ?? (ChartOfAcc::where('account_type', 'income')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-income')->id);
                    $lineAmount = (float) str_replace(',', '', $itemData['amount']);

                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $incomeAccount,
                        'debit' => 0,
                        'credit' => $lineAmount,
                        'memo' => $itemData['description'] ?? $request->memo,
                    ]);

                    if ($itemModel && $itemModel->type === 'inventory') {
                        $qty = (float) str_replace(',', '', $itemData['qty'] ?? 1);
                        $itemModel->decrement('quantity_on_hand', $qty);
                        $cogsAmount = $qty * (float) $itemModel->purchase_price;

                        if ($cogsAmount > 0) {
                            $cogsAccount = $itemModel->expense_account_id ?? ChartOfAcc::getOrCreateDefault('cost-of-goods-sold')->id;
                            $inventoryAccount = $itemModel->inventory_account_id ?? ChartOfAcc::getOrCreateDefault('inventory')->id;

                            JournalEntryLine::create([
                                'journal_entry_id' => $journalEntry->id,
                                'chart_of_acc_id' => $cogsAccount,
                                'debit' => $cogsAmount,
                                'credit' => 0,
                                'memo' => 'Cost of goods sold: ' . ($itemData['description'] ?? $itemModel->name) . " (Qty: {$qty})",
                            ]);

                            JournalEntryLine::create([
                                'journal_entry_id' => $journalEntry->id,
                                'chart_of_acc_id' => $inventoryAccount,
                                'debit' => 0,
                                'credit' => $cogsAmount,
                                'memo' => 'Inventory reduction: ' . ($itemData['description'] ?? $itemModel->name) . " (Qty: {$qty})",
                            ]);
                        }
                    }
                }

                if ($repairingCost > 0) {
                    $serviceIncomeAcc = ChartOfAcc::getOrCreateDefault('service-income')->id;
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $serviceIncomeAcc,
                        'debit' => 0,
                        'credit' => $repairingCost,
                        'memo' => 'Additional Repairing Cost',
                    ]);
                }

                return $journalEntry;
            });

            $printUrl = null;
            if ($request->action === 'credit_sale') {
                $printUrl = route('credit-invoice.print', $journalEntry->id);
            } else {
                $printUrl = route('sales-invoice.print', $journalEntry->id);
            }

            return redirect()->back()->with('success', 'Sale saved successfully.')->with('print_url', $printUrl);
        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            \Log::error('POS save error: ' . $e->getMessage(), [
                'data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function edit(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        if ($journalEntry->transactionable_type === CreditInvoice::class) {
            $receipt = CreditInvoice::find($journalEntry->transactionable_id);
            $isCreditSale = true;
        } else {
            $receipt = SalesInvoice::find($journalEntry->transactionable_id);
            $isCreditSale = false;
        }

        if (!$receipt) {
            abort(404, 'POS document not found');
        }

        // Fetch Items (Inventory, Service, Bundle, Non-Inventory)
        $items = Item::query()
            ->whereIn('type', ['inventory', 'service', 'bundle', 'non-inventory'])
            ->orderBy('name')
            ->get();

        $paymentMethods = $this->paymentMethods();
        $warrantyPolicies = WarrantyPolicy::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'applies_to', 'duration_days', 'duration_km', 'expiry_rule']);

        // Calculate repairing cost if any (from lines)
        $serviceIncomeAcc = ChartOfAcc::getOrCreateDefault('service-income')->id;
        $repairingCostLine = $journalEntry->lines->where('chart_of_acc_id', $serviceIncomeAcc)->first();
        $repairingCost = $repairingCostLine ? $repairingCostLine->credit : 0;

        $receiptData = [
            'id' => $journalEntry->id,
            'receipt_id' => $receipt->id,
            'customer' => $receipt->customer_id,
            'vehicle_id' => $isCreditSale ? null : $receipt->vehicle_id,
            'email' => $receipt->email,
            'receiptDate' => $isCreditSale ? $receipt->invoice_date : $receipt->receipt_date,
            'receiptNo' => $isCreditSale ? $receipt->invoice_no : $receipt->receipt_no,
            'paymentMethod' => $isCreditSale ? null : $receipt->payment_method_id,
            'depositTo' => $isCreditSale ? null : $receipt->deposit_to_account_id,
            'memo' => $receipt->memo,
            'statementMessage' => $receipt->statement_message,
            'repairingCost' => $repairingCost,
            'items' => $receipt->items->map(function ($item) {
                return [
                    'product' => $item->item_id,
                    'name' => $item->item->name ?? '',
                    'description' => $item->description,
                    'qty' => $item->quantity,
                    'rate' => number_format($item->rate, 2, '.', ''),
                    'amount' => number_format($item->amount, 2, '.', ''),
                    'discount' => 0,
                ];
            })->toArray(),
        ];

        return Inertia::render('POS/Index', [
            'items' => $items,
            'paymentMethods' => $paymentMethods,
            'warrantyPolicies' => $warrantyPolicies,
            'nextReceiptNo' => $isCreditSale ? $receipt->invoice_no : $receipt->receipt_no,
            'existingReceipt' => $receiptData,
        ]);
    }

    private function createWarrantyForInvoiceItem(array $itemData, SalesInvoiceItem $invoiceItem, SalesInvoice $receipt): void
    {
        if (empty($itemData['warranty']) || !is_array($itemData['warranty'])) {
            return;
        }

        $warrantyData = $itemData['warranty'];
        $policy = WarrantyPolicy::find($warrantyData['policy_id'] ?? null);
        if (!$policy) {
            throw new \Exception('Selected warranty policy not found.');
        }

        $startDate = $warrantyData['start_date'] ?? now()->toDateString();
        $expiryDates = Warranty::calculateExpiryDates($policy, $startDate, null);

        Warranty::create([
            'warranty_policy_id' => $policy->id,
            'invoice_item_id' => $invoiceItem->id,
            'vehicle_id' => $receipt->vehicle_id,
            'customer_id' => $receipt->customer_id,
            'start_date' => $startDate,
            'start_odometer' => null,
            'end_date' => $expiryDates['end_date'],
            'end_odometer' => $expiryDates['end_odometer'],
            'status' => 'active',
        ]);
    }

    public function update(SalesInvoiceRequest $request, JournalEntry $journalEntry)
    {
        $validated = $request->validated();

        try {
            \App\Services\BooksLockService::check($journalEntry->date, $request->books_pin);
            if (date('Y-m-d', strtotime($journalEntry->date)) !== date('Y-m-d', strtotime($request->receiptDate))) {
                \App\Services\BooksLockService::check($request->receiptDate, $request->books_pin);
            }

            DB::transaction(function() use ($request, $journalEntry) {
                // Filter out empty items
                $items = collect($request->items)->filter(function($item) {
                    return !empty($item['product']) && isset($item['amount']) && $item['amount'] !== '';
                })->values()->all();

                if (empty($items)) {
                    throw new \Exception('At least one item with product and amount is required.');
                }

                $repairingCost = (float)($request->repairingCost ?? 0);

                $totalAmount = collect($items)->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                }) + $repairingCost;

                $customerId = $request->customer;
                if ($request->vehicle_id) {
                    $vehicle = \App\Models\ServiceStation\Vehicle::find($request->vehicle_id);
                    if ($vehicle && $vehicle->customer_id) {
                        $customerId = $vehicle->customer_id;
                    }
                }

                if (!$customerId || !\App\Models\Customer::where('id', $customerId)->exists()) {
                    $walkIn = \App\Models\Customer::firstOrCreate(
                        ['display_name' => 'Walk-in Customer'],
                        ['first_name' => 'Walk-in', 'last_name' => 'Customer']
                    );
                    $customerId = $walkIn->id;
                }

                // 1. Update Business Document (SalesInvoice or CreditInvoice)
                if ($journalEntry->transactionable_type === CreditInvoice::class) {
                    $receipt = CreditInvoice::find($journalEntry->transactionable_id);
                    if (!$receipt) {
                        throw new \Exception('Credit invoice document not found');
                    }
                    $receipt->update([
                        'invoice_no' => $request->receiptNo,
                        'customer_id' => $customerId,
                        'email' => $request->email,
                        'invoice_date' => $request->receiptDate,
                        'due_date' => $request->receiptDate,
                        'total_amount' => $totalAmount,
                        'memo' => $request->memo,
                        'statement_message' => $request->statementMessage,
                    ]);
                } else {
                    $receipt = SalesInvoice::find($journalEntry->transactionable_id);
                    if (!$receipt) {
                        throw new \Exception('Sales invoice document not found');
                    }
                    $receipt->update([
                        'receipt_no' => $request->receiptNo,
                        'customer_id' => $customerId,
                        'vehicle_id' => $request->vehicle_id,
                        'email' => $request->email,
                        'receipt_date' => $request->receiptDate,
                        'payment_method_id' => $request->paymentMethod,
                        'deposit_to_account_id' => $request->depositTo,
                        'total_amount' => $totalAmount,
                        'memo' => $request->memo,
                        'statement_message' => $request->statementMessage,
                    ]);
                }

                foreach ($receipt->items as $oldItem) {
                    $itemModel = \App\Models\Item::find($oldItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->increment('quantity_on_hand', $oldItem->quantity);
                    }
                }
                $receipt->items()->delete();
                foreach ($items as $itemData) {
                    if ($journalEntry->transactionable_type === CreditInvoice::class) {
                        CreditInvoiceItem::create([
                            'credit_invoice_id' => $receipt->id,
                            'item_id' => $itemData['product'],
                            'description' => $itemData['description'] ?? '',
                            'quantity' => (float)str_replace(',', '', $itemData['qty'] ?? 1),
                            'rate' => (float)str_replace(',', '', $itemData['rate'] ?? 0),
                            'amount' => (float) str_replace(',', '', $itemData['amount']),
                            'service_date' => $itemData['serviceDate'] ?? null,
                        ]);
                    } else {
                        $invoiceItem = SalesInvoiceItem::create([
                            'sales_invoice_id' => $receipt->id,
                            'item_id' => $itemData['product'],
                            'description' => $itemData['description'] ?? '',
                            'quantity' => (float)str_replace(',', '', $itemData['qty'] ?? 1),
                            'rate' => (float)str_replace(',', '', $itemData['rate'] ?? 0),
                            'amount' => (float) str_replace(',', '', $itemData['amount']),
                            'service_date' => $itemData['serviceDate'] ?? null,
                        ]);

                        $this->createWarrantyForInvoiceItem($itemData, $invoiceItem, $receipt);
                    }
                }

                // 2. Update Financial Truth (Journal Entry)
                $journalEntry->update([
                    'date' => $request->receiptDate,
                    'reference' => $request->receiptNo,
                    'description' => $request->memo,
                    'payee_id' => $customerId,
                    'total_amount' => $totalAmount,
                ]);

                $journalEntry->lines->each->delete();

                if ($journalEntry->transactionable_type === CreditInvoice::class) {
                    $arAccount = ChartOfAcc::getOrCreateDefault('accounts-receivable');
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $arAccount->id,
                        'debit' => $totalAmount,
                        'credit' => 0,
                        'memo' => $request->memo,
                    ]);
                } else {
                    // Debit Cash/Bank (Deposit To)
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $request->depositTo,
                        'debit' => $totalAmount,
                        'credit' => 0,
                        'memo' => $request->memo,
                    ]);
                }

                // Credit Income accounts
                foreach ($items as $itemData) {
                    $itemModel = Item::find($itemData['product']);
                    $incomeAccount = $itemModel?->income_account_id ?? (ChartOfAcc::where('account_type', 'income')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-income')->id);

                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $incomeAccount,
                        'debit' => 0,
                        'credit' => (float) str_replace(',', '', $itemData['amount']),
                        'memo' => $itemData['description'] ?? $request->memo,
                    ]);

                    if ($itemModel && $itemModel->type === 'inventory') {
                        $qty = (float) str_replace(',', '', $itemData['qty'] ?? 1);
                        $itemModel->decrement('quantity_on_hand', $qty);
                        $cogsAmount = $qty * (float) $itemModel->purchase_price;

                        if ($cogsAmount > 0) {
                            $cogsAccount = $itemModel->expense_account_id ?? ChartOfAcc::getOrCreateDefault('cost-of-goods-sold')->id;
                            $inventoryAccount = $itemModel->inventory_account_id ?? ChartOfAcc::getOrCreateDefault('inventory')->id;

                            JournalEntryLine::create([
                                'journal_entry_id' => $journalEntry->id,
                                'chart_of_acc_id' => $cogsAccount,
                                'debit' => $cogsAmount,
                                'credit' => 0,
                                'memo' => 'Cost of goods sold: ' . ($itemData['description'] ?? $itemModel->name) . " (Qty: {$qty})",
                            ]);

                            JournalEntryLine::create([
                                'journal_entry_id' => $journalEntry->id,
                                'chart_of_acc_id' => $inventoryAccount,
                                'debit' => 0,
                                'credit' => $cogsAmount,
                                'memo' => 'Inventory reduction: ' . ($itemData['description'] ?? $itemModel->name) . " (Qty: {$qty})",
                            ]);
                        }
                    }
                }
                
                if ($repairingCost > 0) {
                    $serviceIncomeAcc = ChartOfAcc::getOrCreateDefault('service-income')->id;
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $serviceIncomeAcc,
                        'debit' => 0,
                        'credit' => $repairingCost,
                        'memo' => 'Additional Repairing Cost',
                    ]);
                }
            });

            return redirect()->back()->with('success', 'Sale updated successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function void(Request $request, JournalEntry $journalEntry)
    {
        \App\Services\BooksLockService::check($journalEntry->date, $request->input('books_pin'));

        DB::transaction(function () use ($journalEntry) {
            if ($journalEntry->transactionable_type === CreditInvoice::class) {
                $receipt = CreditInvoice::find($journalEntry->transactionable_id);
            } else {
                $receipt = SalesInvoice::find($journalEntry->transactionable_id);
            }

            if ($receipt) {
                foreach ($receipt->items as $oldItem) {
                    $itemModel = \App\Models\Item::find($oldItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->increment('quantity_on_hand', $oldItem->quantity);
                    }
                }
                $receipt->update(['status' => 'void', 'voided_at' => now()]);
            }

            $journalEntry->update(['status' => 'void', 'total_amount' => 0, 'voided_at' => now()]);
            $journalEntry->lines()->update(['debit' => 0, 'credit' => 0, 'fc_debit' => 0, 'fc_credit' => 0]);
        });

        return redirect()->back()->with('success', 'POS transaction voided successfully.');
    }

    public function destroy(Request $request, JournalEntry $journalEntry)
    {
        \App\Services\BooksLockService::check($journalEntry->date, $request->input('books_pin'));

        $chartOfAccountId = $journalEntry->lines->first()?->chart_of_acc_id
            ?? $journalEntry->lines->first()?->chart_of_account_id
            ?? $journalEntry->lines->first()?->account_id;

        DB::transaction(function () use ($journalEntry) {
            if ($journalEntry->transactionable_type === CreditInvoice::class) {
                $receipt = CreditInvoice::find($journalEntry->transactionable_id);
            } else {
                $receipt = SalesInvoice::find($journalEntry->transactionable_id);
            }

            if ($receipt) {
                foreach ($receipt->items as $oldItem) {
                    $itemModel = \App\Models\Item::find($oldItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->increment('quantity_on_hand', $oldItem->quantity);
                    }
                }
                $receipt->items()->delete();
                $receipt->delete();
            }

            $journalEntry->lines->each->delete();
            $journalEntry->delete();
        });
        
        return redirect()->back()->with('success', 'POS transaction deleted successfully.');
    }

    private function getNextReceiptNo()
    {
        $lastReceipt = SalesInvoice::query()->latest()->first();
        $number = 1;
        if ($lastReceipt && preg_match('/\d+/', $lastReceipt->receipt_no, $matches)) {
            $number = (int)$matches[0] + 1;
        }
        return 'RCPT-' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }
}
