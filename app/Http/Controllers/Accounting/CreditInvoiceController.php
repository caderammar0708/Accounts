<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Customer;
use App\Http\Requests\Accounting\CreditInvoiceRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class CreditInvoiceController extends Controller
{
    public function create(Request $request)
    {
        $lastRef = JournalEntry::where('transaction_type', 'credit_invoice')
            ->whereNotNull('reference')
            ->orderByRaw('CAST(reference AS UNSIGNED) DESC')
            ->first();

        $nextInvoiceNo = ($lastRef && is_numeric($lastRef->reference)) ? (int) $lastRef->reference + 1 : 1001;
        $nextInvoiceNoLabel = (string) str_pad($nextInvoiceNo, 4, '0', STR_PAD_LEFT);

        if ($copyId = $request->query('copy')) {
            $journalEntry = JournalEntry::findOrFail($copyId);
            $journalEntry->load('lines');
            $creditInvoice = \App\Models\Accounting\CreditInvoice::find($journalEntry->transactionable_id);

            $invoiceData = [
                'id' => null,
                'customer' => $journalEntry->payee_id,
                'prefix' => $creditInvoice?->prefix ?? '',
                'email' => $creditInvoice?->email ?? '',
                'billingAddress' => $creditInvoice?->billing_address ?? '',
                'terms' => $creditInvoice?->terms ?? 'Net 30',
                'invoiceNo' => $nextInvoiceNoLabel,
                'invoiceDate' => $journalEntry->date,
                'dueDate' => $journalEntry->due_date,
                'memo' => $journalEntry->description,
                'memo_on_statement' => $creditInvoice?->memo_on_statement ?? '',
                'statementMessage' => $creditInvoice?->statement_message ?? '',
                'items' => $creditInvoice?->items->map(function ($invoiceItem) {
                    return [
                        'product' => $invoiceItem->item_id,
                        'description' => $invoiceItem->description,
                        'serviceDate' => $invoiceItem->service_date,
                        'amount' => $invoiceItem->amount,
                        'qty' => $invoiceItem->quantity,
                        'rate' => $invoiceItem->rate,
                    ];
                })->toArray() ?? [],
                'discountType' => $creditInvoice?->discount_type ?? 'percent',
                'discountValue' => (float) ($creditInvoice?->discount_value ?? 0),
            ];

            return Inertia::render('Transaction/CreditInvoice/CreditInvoiceForm', [
                'nextInvoiceNo' => $nextInvoiceNoLabel,
                'invoice' => $invoiceData,
            ]);
        }

        return Inertia::render('Transaction/CreditInvoice/CreditInvoiceForm', [
            'nextInvoiceNo' => $nextInvoiceNoLabel
        ]);
    }

    public function store(CreditInvoiceRequest $request)
    {
        $validated = $request->validated();
        \App\Services\BooksLockService::check($request->invoiceDate, $request->books_pin);

        $journalEntry = DB::transaction(function () use ($request) {
            $subtotal = collect($request->items)->sum(function ($item) {
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


            // 1. Create Business Document (Invoice)
            $creditInvoice = \App\Models\Accounting\CreditInvoice::create([
                'customer_id' => $request->customer,
                'email' => $request->email,
                'billing_address' => $request->billingAddress,
                'terms' => $request->terms,
                'invoice_date' => $request->invoiceDate,
                'due_date' => $request->dueDate,
                'invoice_no' => $request->invoiceNo,
                'total_amount' => $totalAmount,
                'memo' => $request->memo,
                'memo_on_statement' => $request->memo_on_statement,
                'statement_message' => $request->statementMessage,
                'status' => 'posted',
                'prefix' => $request->prefix,
                'discount_type' => $discountType,
                'discount_value' => $discountValue,
            ]);


            $creditInvoiceItemsData = [];
            $now = now();
            foreach ($request->items as $lineItem) {
                $creditInvoiceItemsData[] = [
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'credit_invoice_id' => $creditInvoice->id,
                    'item_id' => $lineItem['product'],
                    'description' => $lineItem['description'] ?? '',
                    'quantity' => $lineItem['qty'] ?? 1,
                    'rate' => (float) str_replace(',', '', $lineItem['rate'] ?? 0),
                    'amount' => (float) str_replace(',', '', $lineItem['amount']),
                    'service_date' => $lineItem['serviceDate'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            if (!empty($creditInvoiceItemsData)) {
                \App\Models\Accounting\CreditInvoiceItem::insert($creditInvoiceItemsData);
            }

            // 2. Create Financial Truth (Journal Entry)
            $journalEntry = JournalEntry::create([
                'date' => $request->invoiceDate,
                'due_date' => $request->dueDate,
                'reference' => $request->invoiceNo,
                'description' => $request->memo,
                'transaction_type' => 'credit_invoice',
                'payee_id' => $request->customer,
                'payee_type' => Customer::class,
                'total_amount' => $totalAmount,
                'status' => 'posted',
                'created_by' => Auth::id(),
                'transactionable_id' => $creditInvoice->id,
                'transactionable_type' => \App\Models\Accounting\CreditInvoice::class,
            ]);

            $journalLinesData = [];

            // Income Credits
            foreach ($request->items as $lineItem) {
                $itemModel = \App\Models\Item::find($lineItem['product']);
                $incomeAccount = $itemModel?->income_account_id ?? (ChartOfAcc::where('account_type', 'income')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-income')->id);

                $journalLinesData[] = [
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $incomeAccount,
                    'debit' => 0,
                    'credit' => (float) str_replace(',', '', $lineItem['amount']),
                    'memo' => $lineItem['description'] ?? $request->memo,
                    'service_date' => $lineItem['serviceDate'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if ($itemModel && $itemModel->type === 'inventory') {
                    $qty = (float) str_replace(',', '', $lineItem['qty'] ?? 1);
                    $itemModel->decrement('quantity_on_hand', $qty);
                    $cogsAmount = $qty * (float) $itemModel->purchase_price;

                    if ($cogsAmount > 0) {
                        $cogsAccount = $itemModel->expense_account_id ?? ChartOfAcc::getOrCreateDefault('cost-of-goods-sold')->id;
                        $inventoryAccount = $itemModel->inventory_account_id ?? ChartOfAcc::getOrCreateDefault('inventory')->id;

                        $journalLinesData[] = [
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'journal_entry_id' => $journalEntry->id,
                            'chart_of_acc_id' => $cogsAccount,
                            'debit' => $cogsAmount,
                            'credit' => 0,
                            'memo' => 'Cost of goods sold: ' . ($lineItem['description'] ?? $itemModel->name) . " (Qty: {$qty})",
                            'service_date' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];

                        $journalLinesData[] = [
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'journal_entry_id' => $journalEntry->id,
                            'chart_of_acc_id' => $inventoryAccount,
                            'debit' => 0,
                            'credit' => $cogsAmount,
                            'memo' => 'Inventory reduction: ' . ($lineItem['description'] ?? $itemModel->name) . " (Qty: {$qty})",
                            'service_date' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
            }

            // Accounts Receivable Debit
            $arAccount = ChartOfAcc::getOrCreateDefault('accounts-receivable');
            $journalLinesData[] = [
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'journal_entry_id' => $journalEntry->id,
                'chart_of_acc_id' => $arAccount->id,
                'debit' => $totalAmount,
                'credit' => 0,
                'memo' => $request->memo,
                'service_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            // Debit Discounts Given if discount exists
            if ($discountAmount > 0) {
                $discountAccount = ChartOfAcc::getOrCreateDefault('discounts-given');
                $journalLinesData[] = [
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $discountAccount->id,
                    'debit' => $discountAmount,
                    'credit' => 0,
                    'memo' => 'Discount for ' . $request->invoiceNo,
                    'service_date' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($journalLinesData)) {
                JournalEntryLine::insert($journalLinesData);
            }


            $creditInvoice->attachAttachments($request->input('attachment_ids', []));
            $journalEntry->attachAttachments($request->input('attachment_ids', []));

            return $journalEntry;
        });

        $action = $request->input('action', 'save');

        if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'credit Sale saved successfully.'); }

        if ($action === 'new') {
            return redirect()->route('credit-invoice.create')->with('success', 'credit Sale saved successfully.');
        }

       return redirect()->route('credit-invoice.edit', $journalEntry->id)->with('success', 'Credit Sale saved successfully.');

    }

    public function edit(JournalEntry $journalEntry)
    {
        $journalEntry->load(['lines', 'attachments']);
        $creditInvoice = \App\Models\Accounting\CreditInvoice::with(['allocations.payment.journalEntry', 'attachments'])->find($journalEntry->transactionable_id);

        $invoiceData = [
            'id' => $journalEntry->id,
            'customer' => $journalEntry->payee_id,
            'prefix' => $creditInvoice?->prefix ?? '',
            'email' => $creditInvoice?->email ?? '',
            'billingAddress' => $creditInvoice?->billing_address ?? '',
            'terms' => $creditInvoice?->terms ?? 'Net 30',
            'invoiceNo' => $journalEntry->reference,
            'invoiceDate' => $journalEntry->date,
            'dueDate' => $journalEntry->due_date,
            'memo' => $journalEntry->description,
            'memo_on_statement' => $creditInvoice?->memo_on_statement ?? '',
            'statementMessage' => $creditInvoice?->statement_message ?? '',
            'items' => $creditInvoice?->items->map(function ($invoiceItem) {
                return [
                    'product' => $invoiceItem->item_id,
                    'description' => $invoiceItem->description,
                    'serviceDate' => $invoiceItem->service_date,
                    'amount' => $invoiceItem->amount,
                    'qty' => $invoiceItem->quantity,
                    'rate' => $invoiceItem->rate,
                ];
            })->toArray() ?? [],
            'discountType' => $creditInvoice?->discount_type ?? 'percent',
            'discountValue' => (float) ($creditInvoice?->discount_value ?? 0),
            'payments' => $creditInvoice?->allocations->map(function($alloc) {
                return [
                    'id' => $alloc->payment?->journalEntry?->id,
                    'reference' => $alloc->payment?->reference_no ?? '',
                    'date' => $alloc->payment?->payment_date ?? '',
                    'amount' => $alloc->amount,
                ];
            })->filter(fn($p) => !empty($p['id']))->toArray() ?? [],
            'attachments' => ($creditInvoice && $creditInvoice->attachments->isNotEmpty()) ? $creditInvoice->attachments : $journalEntry->attachments,
        ];

        return Inertia::render('Transaction/CreditInvoice/CreditInvoiceForm', [
            'customers' => Customer::orderBy('display_name')->get(),
            'accounts' => ChartOfAcc::orderBy('account_code')->get(),
            'items' => \App\Models\Item::orderBy('name')->get(),
            'invoice' => $invoiceData,
        ]);
    }

    public function print(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $creditInvoice = \App\Models\Accounting\CreditInvoice::with('items.item', 'customer', 'company')->findOrFail($journalEntry->transactionable_id);
        $company = $creditInvoice->company ?? \App\Models\Company::current();

        $tableItems = [];
        foreach ($creditInvoice->items as $item) {
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

        $subtotal = $creditInvoice->items->sum('amount');
        $discountAmount = 0;
        if ($creditInvoice->discount_type === 'percentage') {
            $discountAmount = $subtotal * ($creditInvoice->discount_value / 100);
        } elseif ($creditInvoice->discount_type === 'fixed') {
            $discountAmount = $creditInvoice->discount_value;
        }

        $currency = $company?->home_currency_prefix ? $company?->home_currency_prefix . ' ' : '';
        
        $summaryInfo = [
            'Subtotal' => $currency . number_format($subtotal, 2)
        ];

        if ($discountAmount > 0) {
            $summaryInfo['Discount' . ($creditInvoice->discount_type === 'percentage' ? " ({$creditInvoice->discount_value}%)" : '')] = '- ' . $currency . number_format($discountAmount, 2);
        }
        
        $summaryInfo['Total Amount'] = $currency . number_format($creditInvoice->total_amount, 2);

        $totalPayments = 0;
        $paymentsTable = [];
        $allocations = $creditInvoice->allocations()->with('payment')->get();
        foreach ($allocations as $alloc) {
            $totalPayments += $alloc->amount;
            $paymentsTable[] = [
                'date' => $alloc->payment->payment_date ?? '',
                'desc' => 'Payment' . ($alloc->payment->reference_no ? ' #' . $alloc->payment->reference_no : ''),
                'amount' => $currency . number_format($alloc->amount, 2),
            ];
        }

        if ($totalPayments > 0) {
            // $summaryInfo['Payments Applied'] = '- ' . $currency . number_format($totalPayments, 2);
            $summaryInfo['Balance Due'] = $currency . number_format($creditInvoice->total_amount - $totalPayments, 2);
        }

        return view('print.document', [
            'printSetting' => $printSetting,
            'title' => $printSetting?->custom_title ?: 'Credit Invoice',
            'headerAlignment' => $printSetting?->header_alignment ?: 'left',
            'staticFooterContent' => $printSetting?->static_footer_content ?: null,
            'layoutConfig' => $printSetting?->layout_config,
            'primaryColor' => $printSetting?->primary_color,
            'textColor' => $printSetting?->text_color,
            'pageSetup' => $printSetting?->page_setup,
            'blockStyles' => $printSetting?->block_styles,
            'documentNo' => $creditInvoice->invoice_no,
            'date' => $creditInvoice->invoice_date,
            'dueDate' => $creditInvoice->due_date,
            'partyLabel' => 'Bill To',
            'partyPrefix' => $creditInvoice->prefix,
            'partyName' => $creditInvoice->customer->display_name ?? $creditInvoice->customer->company_name,
            'partyAddress' => trim(($creditInvoice->customer?->address ? $creditInvoice->customer->address . "\n" : '') . ($creditInvoice->customer?->phone_number ? $creditInvoice->customer->phone_number : '')),
            'partyEmail' => $creditInvoice->email,
            'tableHeaders' => ['Description', 'Qty', 'Rate', 'Amount'],
            'tableItems' => $tableItems,
            'summaryInfo' => $summaryInfo,
            'paymentsTable' => $paymentsTable,
            'totalAmount' => $creditInvoice->total_amount,
            'balanceDue' => $creditInvoice->total_amount - $totalPayments,
            'memo' => $creditInvoice->memo,
            'statementMessage' => $creditInvoice->statement_message,
            'company' => $company,
        ]);
    }

    public function update(CreditInvoiceRequest $request, JournalEntry $journalEntry)
    {
        $validated = $request->validated();

        \App\Services\BooksLockService::check($journalEntry->date, $request->books_pin);
        if (date('Y-m-d', strtotime($journalEntry->date)) !== date('Y-m-d', strtotime($request->invoiceDate))) {
            \App\Services\BooksLockService::check($request->invoiceDate, $request->books_pin);
        }

        DB::transaction(function () use ($request, $journalEntry) {
            $subtotal = collect($request->items)->sum(function ($item) {
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
            \Log::info('CreditInvoiceController update - Request Items:', $request->items ?? []);

            // 1. Update Business Document
            $creditInvoice = \App\Models\Accounting\CreditInvoice::find($journalEntry->transactionable_id);
            if ($creditInvoice) {
                $creditInvoice->update([
                    'customer_id' => $request->customer,
                    'email' => $request->email,
                    'billing_address' => $request->billingAddress,
                    'terms' => $request->terms,
                    'invoice_date' => $request->invoiceDate,
                    'due_date' => $request->dueDate,
                    'invoice_no' => $request->invoiceNo,
                    'total_amount' => $totalAmount,
                    'memo' => $request->memo,
                    'memo_on_statement' => $request->memo_on_statement,
                    'statement_message' => $request->statementMessage,
                    'prefix' => $request->prefix,
                    'discount_type' => $discountType,
                    'discount_value' => $discountValue,
                ]);


                foreach ($creditInvoice->items as $oldItem) {
                    $itemModel = \App\Models\Item::find($oldItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->increment('quantity_on_hand', $oldItem->quantity);
                    }
                }
                $creditInvoice->items()->delete();
                $creditInvoiceItemsData = [];
                $now = now();
                foreach ($request->items as $lineItem) {
                    $creditInvoiceItemsData[] = [
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'credit_invoice_id' => $creditInvoice->id,
                        'item_id' => $lineItem['product'],
                        'description' => $lineItem['description'] ?? '',
                        'quantity' => $lineItem['qty'] ?? 1,
                        'rate' => (float) str_replace(',', '', $lineItem['rate'] ?? 0),
                        'amount' => (float) str_replace(',', '', $lineItem['amount']),
                        'service_date' => $lineItem['serviceDate'] ?? null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
                if (!empty($creditInvoiceItemsData)) {
                    \App\Models\Accounting\CreditInvoiceItem::insert($creditInvoiceItemsData);
                }
            }

            // 2. Update Financial Truth
            $journalEntry->update([
                'date' => $request->invoiceDate,
                'due_date' => $request->dueDate,
                'reference' => $request->invoiceNo,
                'description' => $request->memo,
                'payee_id' => $request->customer,
                'total_amount' => $totalAmount,
            ]);

            $journalEntry->lines->each->delete();

            $journalLinesData = [];

            foreach ($request->items as $lineItem) {
                $itemModel = \App\Models\Item::find($lineItem['product']);
                $incomeAccount = $itemModel?->income_account_id ?? (ChartOfAcc::where('account_type', 'income')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-income')->id);

                $journalLinesData[] = [
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $incomeAccount,
                    'debit' => 0,
                    'credit' => (float) str_replace(',', '', $lineItem['amount']),
                    'memo' => $lineItem['description'] ?? $request->memo,
                    'service_date' => $lineItem['serviceDate'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if ($itemModel && $itemModel->type === 'inventory') {
                    $qty = (float) str_replace(',', '', $lineItem['qty'] ?? 1);
                    $itemModel->decrement('quantity_on_hand', $qty);
                    $cogsAmount = $qty * (float) $itemModel->purchase_price;

                    if ($cogsAmount > 0) {
                        $cogsAccount = $itemModel->expense_account_id ?? ChartOfAcc::getOrCreateDefault('cost-of-goods-sold')->id;
                        $inventoryAccount = $itemModel->inventory_account_id ?? ChartOfAcc::getOrCreateDefault('inventory')->id;

                        $journalLinesData[] = [
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'journal_entry_id' => $journalEntry->id,
                            'chart_of_acc_id' => $cogsAccount,
                            'debit' => $cogsAmount,
                            'credit' => 0,
                            'memo' => 'Cost of goods sold: ' . ($lineItem['description'] ?? $itemModel->name) . " (Qty: {$qty})",
                            'service_date' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];

                        $journalLinesData[] = [
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'journal_entry_id' => $journalEntry->id,
                            'chart_of_acc_id' => $inventoryAccount,
                            'debit' => 0,
                            'credit' => $cogsAmount,
                            'memo' => 'Inventory reduction: ' . ($lineItem['description'] ?? $itemModel->name) . " (Qty: {$qty})",
                            'service_date' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }
            }

            $arAccount = ChartOfAcc::getOrCreateDefault('accounts-receivable');
            $journalLinesData[] = [
                'id' => \Illuminate\Support\Str::uuid()->toString(),
                'journal_entry_id' => $journalEntry->id,
                'chart_of_acc_id' => $arAccount->id,
                'debit' => $totalAmount,
                'credit' => 0,
                'memo' => $request->memo,
                'service_date' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            // Debit Discounts Given if discount exists
            if ($discountAmount > 0) {
                $discountAccount = ChartOfAcc::getOrCreateDefault('discounts-given');
                $journalLinesData[] = [
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $discountAccount->id,
                    'debit' => $discountAmount,
                    'credit' => 0,
                    'memo' => 'Discount for ' . $request->invoiceNo,
                    'service_date' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($journalLinesData)) {
                JournalEntryLine::insert($journalLinesData);
            }

            $creditInvoice = \App\Models\Accounting\CreditInvoice::find($journalEntry->transactionable_id);
            if ($creditInvoice) {
                $creditInvoice->attachAttachments($request->input('attachment_ids', []));
            }
            $journalEntry->attachAttachments($request->input('attachment_ids', []));
        });


        $action = $request->input('action', 'save');
        if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'CreditInvoice updated successfully.'); }
        if ($action === 'new') {
            return redirect()->route('credit-invoice.create')->with('success', 'CreditInvoice updated successfully.');
        }
        return redirect()->route('credit-invoice.edit', $journalEntry->id)->with('success', 'CreditInvoice updated successfully.');
    }


    public function void(Request $request, JournalEntry $journalEntry)
    {
        \App\Services\BooksLockService::check($journalEntry->date, $request->input('books_pin'));

        DB::transaction(function () use ($journalEntry) {
            $creditInvoice = \App\Models\Accounting\CreditInvoice::find($journalEntry->transactionable_id);

            if ($creditInvoice) {
                foreach ($creditInvoice->items as $oldItem) {
                    $itemModel = \App\Models\Item::find($oldItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->increment('quantity_on_hand', $oldItem->quantity);
                    }
                }
                $creditInvoice->allocations()->delete();
                $creditInvoice->update(['status' => 'void', 'voided_at' => now()]);
            }

            $journalEntry->update(['status' => 'void', 'total_amount' => 0, 'voided_at' => now()]);
            $journalEntry->lines()->update(['debit' => 0, 'credit' => 0, 'fc_debit' => 0, 'fc_credit' => 0]);
        });

        return redirect()->back()->with('success', 'Credit Invoice voided successfully.');
    }

    public function destroy(Request $request, JournalEntry $journalEntry)
    {
        \App\Services\BooksLockService::check($journalEntry->date, $request->input('books_pin'));

        $chartOfAccountId = $journalEntry->lines->first()?->chart_of_acc_id 
            ?? $journalEntry->lines->first()?->chart_of_account_id 
            ?? $journalEntry->lines->first()?->account_id;

        DB::transaction(function () use ($journalEntry) {
            $creditInvoice = \App\Models\Accounting\CreditInvoice::find($journalEntry->transactionable_id);

            if ($creditInvoice) {
                foreach ($creditInvoice->items as $oldItem) {
                    $itemModel = \App\Models\Item::find($oldItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->increment('quantity_on_hand', $oldItem->quantity);
                    }
                }
                $creditInvoice->items()->delete();
                $creditInvoice->delete();
            }

            $journalEntry->lines->each->delete();
            $journalEntry->delete();
        });
        if ($chartOfAccountId) {
            return redirect()->route('chart-of-account.history', ['chart_of_account' => $chartOfAccountId])
                ->with('success', 'CreditInvoice deleted successfully.');
        }

        return redirect()->route('chart-of-account.index')
            ->with('success', 'CreditInvoice deleted successfully.');
    }
}
