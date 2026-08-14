<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Accounting\SalesInvoice;
use App\Models\Accounting\SalesInvoiceItem;
use App\Models\Customer;
use App\Models\Accounting\ChartOfAcc;
use App\Models\PaymentMethod;
use App\Models\Item;
use App\Models\Warranty;
use App\Models\Vehicle;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\Accounting\SalesInvoiceRequest;
use App\Traits\AccountingControllerTrait;

class SalesInvoiceController extends Controller
{
    use AccountingControllerTrait;

    public function create(Request $request)
    {
        if ($copyId = $request->query('copy')) {
            $journalEntry = JournalEntry::findOrFail($copyId);
            $receipt = SalesInvoice::find($journalEntry->transactionable_id);

            if (!$receipt) {
                abort(404, 'Sales invoice not found');
            }

            $receipt->load('customer');
            $customer = $receipt->customer;
            $billingAddress = $customer ? $customer->address : '';

            $receiptData = [
                'id' => null,
                'receipt_id' => null,
                'customer' => $receipt->customer_id,
                'prefix' => $receipt->prefix ?? '',
                'email' => $receipt->email,
                'billingAddress' => $billingAddress,
                'receiptDate' => $receipt->receipt_date,
                'receiptNo' => $this->getNextReceiptNo(),
                'paymentMethod' => $receipt->payment_method_id,
                'depositTo' => $receipt->deposit_to_account_id,
                'memo' => $receipt->memo,
                'memo_on_statement' => $receipt->memo_on_statement ?? '',
                'statementMessage' => $receipt->statement_message,
                'items' => $receipt->items->map(function ($item) {
                    return [
                        'product' => $item->item_id,
                        'serviceDate' => $item->service_date,
                        'description' => $item->description,
                        'qty' => $item->quantity,
                        'rate' => number_format($item->rate, 2, '.', ''),
                        'amount' => number_format($item->amount, 2, '.', ''),
                    ];
                })->toArray(),
                'discountType' => $receipt->discount_type ?? 'percent',
                'discountValue' => (float)$receipt->discount_value,
            ];

            return Inertia::render('Transaction/SalesInvoice/SalesInvoiceForm', [
                'receipt' => $receiptData,
                'paymentMethods' => $this->paymentMethods(),
                'nextReceiptNo' => $this->getNextReceiptNo(),
            ]);
        }

        return Inertia::render('Transaction/SalesInvoice/SalesInvoiceForm', [
            'paymentMethods' => $this->paymentMethods(),
            'nextReceiptNo' => $this->getNextReceiptNo()
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
                    return !empty($item['product']) && (float)str_replace(',', '', $item['amount']) > 0;
                })->values()->all();

                if (empty($items)) {
                    throw new \Exception('At least one item with product and amount is required.');
                }
                
                $subtotal = collect($items)->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                });

                $discountType = $request->discount_type ?? 'percent';
                $discountValue = (float)($request->discount_value ?? 0);
                
                $discountAmount = 0;
                if ($discountValue > 0) {
                    if ($discountType === 'percent') {
                        $discountAmount = $subtotal * ($discountValue / 100);
                    } else {
                        $discountAmount = $discountValue;
                    }
                }
                
                $totalAmount = $subtotal - $discountAmount;


                $customerId = $request->customer;
                if ($request->vehicle_id) {
                    $vehicle = \App\Models\Vehicle::find($request->vehicle_id);
                    if ($vehicle) {
                        $customerId = $vehicle->customer_id;
                    }
                }

                // 1. Save Document (Business Details)
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
                    'memo_on_statement' => $request->memo_on_statement,
                    'statement_message' => $request->statementMessage,
                    'check_date' => $request->checkDate,
                    'check_number' => $request->checkNumber,
                    'status' => 'posted',
                    'prefix' => $request->prefix,
                    'discount_type' => $discountType,
                    'discount_value' => $discountValue,
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
                }

                // 2. Save Financial Truth (Journal Entry)
                $journalEntry = JournalEntry::create([
                    'date' => $request->receiptDate,
                    'reference' => $request->receiptNo,
                    'description' => $request->memo,
                    'transaction_type' => 'sales_invoice',
                    'payee_id' => $customerId,
                    'payee_type' => Customer::class,
                    'total_amount' => $totalAmount,
                    'status' => 'posted',
                    'created_by' => Auth::id(),
                    'transactionable_id' => $receipt->id,
                    'transactionable_type' => SalesInvoice::class,
                ]);

                // Debit Cash/Bank (Deposit To)
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $request->depositTo,
                    'debit' => $totalAmount,
                    'credit' => 0,
                    'memo' => $request->memo,
                ]);

                // Debit Discounts Given if discount exists
                if ($discountAmount > 0) {
                    $discountAccount = ChartOfAcc::getOrCreateDefault('discounts-given');
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $discountAccount->id,
                        'debit' => $discountAmount,
                        'credit' => 0,
                        'memo' => 'Discount for ' . $request->receiptNo,
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

                return $journalEntry;
            });

            return $this->handleActionRedirect($request, 'sales-invoice', $journalEntry->id, 'Sale saved successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            \Log::error('Sales invoice save error: ' . $e->getMessage(), [
                'data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }


    }

    public function edit(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $receipt = SalesInvoice::find($journalEntry->transactionable_id);

        if (!$receipt) {
            abort(404, 'Sales invoice not found');
        }

        $receipt->load('customer');
        $customer = $receipt->customer;
        $billingAddress = $customer ? $customer->address : '';

        $receiptData = [
            'id' => $journalEntry->id,
            'receipt_id' => $receipt->id,
            'customer' => $receipt->customer_id,
            'prefix' => $receipt->prefix ?? '',
            'email' => $receipt->email,
            'billingAddress' => $billingAddress,
            'receiptDate' => $receipt->receipt_date,
            'receiptNo' => $receipt->receipt_no,
            'paymentMethod' => $receipt->payment_method_id,
            'depositTo' => $receipt->deposit_to_account_id,
            'memo' => $receipt->memo,
            'memo_on_statement' => $receipt->memo_on_statement ?? '',
            'statementMessage' => $receipt->statement_message,
            'checkDate' => $receipt->check_date,
            'checkNumber' => $receipt->check_number,
            'items' => $receipt->items->map(function ($item) {
                return [
                    'product' => $item->item_id,
                    'serviceDate' => $item->service_date,
                    'description' => $item->description,
                    'qty' => (float)$item->quantity,
                    'rate' => number_format($item->rate, 2, '.', ''),
                    'amount' => number_format($item->amount, 2, '.', ''),
                ];
            })->toArray(),
            'discountType' => $receipt->discount_type ?? 'percent',
            'discountValue' => (float)$receipt->discount_value,
        ];

        return Inertia::render('Transaction/SalesInvoice/SalesInvoiceForm', [
            'receipt' => $receiptData,
            'paymentMethods' => $this->paymentMethods(),
            'nextReceiptNo' => $this->getNextReceiptNo()
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
                    return !empty($item['product']) && (float)str_replace(',', '', $item['amount']) > 0;
                })->values()->all();

                if (empty($items)) {
                    throw new \Exception('At least one item with product and amount is required.');
                }

                $subtotal = collect($items)->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                });

                $discountType = $request->discount_type ?? 'percent';
                $discountValue = (float)($request->discount_value ?? 0);
                
                $discountAmount = 0;
                if ($discountValue > 0) {
                    if ($discountType === 'percent') {
                        $discountAmount = $subtotal * ($discountValue / 100);
                    } else {
                        $discountAmount = $discountValue;
                    }
                }
                
                $totalAmount = $subtotal - $discountAmount;


                $customerId = $request->customer;
                if ($request->vehicle_id) {
                    $vehicle = Vehicle::find($request->vehicle_id);
                    if ($vehicle) {
                        $customerId = $vehicle->customer_id;
                    }
                }

                // 1. Update Business Document
                $receipt = SalesInvoice::find($journalEntry->transactionable_id);
                if (!$receipt) {
                    throw new \Exception('Sales invoice document not found');
                }
                $receipt->update([
                    'receipt_no' => $request->receiptNo,
                    'customer_id' => $request->customer,
                    'email' => $request->email,
                    'receipt_date' => $request->receiptDate,
                    'payment_method_id' => $request->paymentMethod,
                    'deposit_to_account_id' => $request->depositTo,
                    'total_amount' => $totalAmount,
                    'memo' => $request->memo,
                    'memo_on_statement' => $request->memo_on_statement,
                    'statement_message' => $request->statementMessage,
                    'check_date' => $request->checkDate,
                    'check_number' => $request->checkNumber,
                    'prefix' => $request->prefix,
                    'discount_type' => $discountType,
                    'discount_value' => $discountValue,
                ]);


                foreach ($receipt->items as $oldItem) {
                    $itemModel = \App\Models\Item::find($oldItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->increment('quantity_on_hand', $oldItem->quantity);
                    }
                }
                $receipt->items()->delete();
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
                }

                // 2. Update Financial Truth (Journal Entry)
                $journalEntry->update([
                    'date' => $request->receiptDate,
                    'reference' => $request->receiptNo,
                    'description' => $request->memo,
                    'payee_id' => $request->customer,
                    'total_amount' => $totalAmount,
                ]);

                $journalEntry->lines->each->delete();

                // Debit Cash/Bank (Deposit To)
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $request->depositTo,
                    'debit' => $totalAmount,
                    'credit' => 0,
                    'memo' => $request->memo,
                ]);

                // Debit Discounts Given if discount exists
                if ($discountAmount > 0) {
                    $discountAccount = ChartOfAcc::getOrCreateDefault('discounts-given');
                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $discountAccount->id,
                        'debit' => $discountAmount,
                        'credit' => 0,
                        'memo' => 'Discount for ' . $request->receiptNo,
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
            });
            return $this->handleActionRedirect($request, 'sales-invoice', $journalEntry->id, 'Cash sale updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(Request $request, JournalEntry $journalEntry)
    {
        \App\Services\BooksLockService::check($journalEntry->date, $request->input('books_pin'));

        $chartOfAccountId = $journalEntry->lines->first()?->chart_of_acc_id
            ?? $journalEntry->lines->first()?->chart_of_account_id
            ?? $journalEntry->lines->first()?->account_id;

        DB::transaction(function () use ($journalEntry) {
            $receipt = SalesInvoice::find($journalEntry->transactionable_id);

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
        if ($chartOfAccountId) {
            return redirect()->route('chart-of-account.history', ['chart_of_account' => $chartOfAccountId])
                ->with('success', 'Sales invoice deleted successfully.');
        }

        return redirect()->route('chart-of-account.index')
            ->with('success', 'Sales invoice deleted successfully.');
    }

    private function getNextReceiptNo()
    {
        $lastInvoice = SalesInvoice::orderBy('id', 'desc')->first();
        if (!$lastInvoice) {
            return 'RCPT-0001';
        }

        $lastNumber = intval(str_replace('RCPT-', '', $lastInvoice->receipt_no));
        return 'RCPT-' . str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
    }

    public function print(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $salesInvoice = \App\Models\Accounting\SalesInvoice::with('items.item', 'customer', 'company', 'vehicle')->findOrFail($journalEntry->transactionable_id);
        $company = $salesInvoice->company ?? \App\Models\Company::current();

        $tableItems = [];
        foreach ($salesInvoice->items as $item) {
            $desc = "<div class='font-semibold text-gray-800'>" . ($item->item->name ?? 'Item') . "</div>";
            if ($item->description) {
                $desc .= "<div class='text-sm text-gray-500 mt-1'>" . $item->description . "</div>";
            }
            $tableItems[] = [
                $desc,
                $item->quantity + 0,
                ($company?->home_currency_prefix ? $company?->home_currency_prefix . ' ' : '') . number_format($item->rate, 2),
                ($company?->home_currency_prefix ? $company?->home_currency_prefix . ' ' : '') . number_format($item->amount, 2),
            ];
        }

        $printSetting = \App\Models\PrintSetting::getForPrint('invoice');

        return view('print.document', [
            'printSetting' => $printSetting,
            'title' => $printSetting?->custom_title ?: 'Receipt / Sales Invoice',
            'headerAlignment' => $printSetting?->header_alignment ?: 'left',
            'staticFooterContent' => $printSetting?->static_footer_content ?: null,
            'layoutConfig' => $printSetting?->layout_config,
            'pageSetup' => $printSetting?->page_setup,
            
            'company' => $company,
            'documentNo' => $salesInvoice->receipt_no,
            'date' => \Carbon\Carbon::parse($salesInvoice->receipt_date)->format('M d, Y'),
            
            'partyLabel' => 'Bill To',
            'partyPrefix' => $salesInvoice->prefix,
            'partyName' => $salesInvoice->customer?->display_name ?? $salesInvoice->customer?->company_name,
            'partyAddress' => trim(($salesInvoice->customer?->address ? $salesInvoice->customer->address . "\n" : '') . ($salesInvoice->customer?->phone_number ? $salesInvoice->customer->phone_number : '')),
            'partyEmail' => $salesInvoice->email,
            
            'tableHeaders' => ['PRODUCT/SERVICE', 'QTY', 'RATE', 'AMOUNT'],
            'tableItems' => $tableItems,
            
            'summaryInfo' => [
                'Total Amount' => ($company?->home_currency_prefix ? $company?->home_currency_prefix . ' ' : '') . number_format($salesInvoice->total_amount, 2)
            ],
            
            'amountInWords' => true,
            'totalAmount' => $salesInvoice->total_amount,
            'memo' => $salesInvoice->memo,
        ]);
    }
}
