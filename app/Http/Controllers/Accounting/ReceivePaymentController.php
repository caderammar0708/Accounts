<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Requests\Accounting\ReceivePaymentRequest;
use App\Traits\AccountingControllerTrait;

class ReceivePaymentController extends Controller
{
    use AccountingControllerTrait;

    public function create(Request $request)
    {
        $lastRef = JournalEntry::where('transaction_type', 'receive_payment')
            ->whereNotNull('reference')
            ->orderByRaw('CAST(reference AS UNSIGNED) DESC')
            ->first();

        $nextPaymentNo = ($lastRef && is_numeric($lastRef->reference)) ? (int) $lastRef->reference + 1 : 1001;
        $nextPaymentNoLabel = (string) str_pad($nextPaymentNo, 4, '0', STR_PAD_LEFT);

        if ($copyId = $request->query('copy')) {
            $journalEntry = JournalEntry::findOrFail($copyId);
            $receivePayment = \App\Models\Accounting\ReceivePayment::find($journalEntry->transactionable_id);

            if (!$receivePayment) {
                abort(404, 'ReceivePayment not found');
            }

            $paymentData = [
                'id' => null,
                'receive_payment_id' => null,
                'customer' => $receivePayment->customer_id,
                'email' => $receivePayment->customer->email ?? '',
                'amountReceived' => number_format($receivePayment->amount, 2, '.', ''),
                'paymentDate' => $receivePayment->payment_date,
                'paymentMethod' => $receivePayment->payment_method_id,
                'depositTo' => $receivePayment->deposit_to_account_id,
                'referenceNo' => $nextPaymentNoLabel,
                'memo' => $receivePayment->memo,
                'exchange_rate' => $receivePayment->exchange_rate ?? 1,
                'currency_id' => $receivePayment->currency_id ?? "",
            ];

            return Inertia::render('Transaction/ReceivePayment/ReceivePaymentForm', [
                'payment' => $paymentData,
                'paymentMethods' => $this->paymentMethods(),
                'nextPaymentNo' => $nextPaymentNoLabel,
            ]);
        }

        return Inertia::render('Transaction/ReceivePayment/ReceivePaymentForm', [
            'paymentMethods' => $this->paymentMethods(),
            'nextPaymentNo' => $nextPaymentNoLabel,
        ]);
    }

    public function store(ReceivePaymentRequest $request)
    {
        $validated = $request->validated();

        try {
            \App\Services\BooksLockService::check($request->paymentDate, $request->books_pin);
            $journalEntry = DB::transaction(function() use ($request) {
                $amount = (float) str_replace(',', '', $request->amountReceived);
                $exchangeRate = $request->input('exchange_rate', 1);
                $currencyId = $request->input('currency_id');
                $homeAmount = $amount * $exchangeRate;

                // 1. Create Business Document (Payment)
                $receivePayment = \App\Models\Accounting\ReceivePayment::create([
                    'customer_id' => $request->customer,
                    'amount' => $amount,
                    'payment_date' => $request->paymentDate,
                    'payment_method_id' => $request->paymentMethod,
                    'deposit_to_account_id' => $request->depositTo,
                    'reference_no' => $request->referenceNo,
                    'memo' => $request->memo,
                    'check_date' => $request->checkDate,
                    'check_number' => $request->checkNumber,
                    'currency_id' => $currencyId,
                    'exchange_rate' => $exchangeRate,
                ]);

                // Allocations (Business Details)
                if ($request->has('credit_invoices')) {
                    $allocationsData = [];
                    $now = now();
                    foreach ($request->credit_invoices as $inv) {
                        if ((float)$inv['amount'] > 0) {
                            $allocationsData[] = [
                                'id' => \Illuminate\Support\Str::uuid()->toString(),
                                'receive_payment_id' => $receivePayment->id,
                                'credit_invoice_id' => $inv['id'],
                                'amount' => (float)$inv['amount'],
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];
                        }
                    }
                    if (!empty($allocationsData)) {
                        \App\Models\Accounting\ReceivePaymentAllocation::insert($allocationsData);
                    }
                }

                // 2. Create Financial Truth (Journal Entry)
                $journalEntry = JournalEntry::create([
                    'date' => $request->paymentDate,
                    'reference' => $request->referenceNo,
                    'description' => $request->memo,
                    'transaction_type' => 'receive_payment',
                    'payee_id' => $request->customer,
                    'payee_type' => Customer::class,
                    'total_amount' => $homeAmount,
                    'status' => 'posted',
                    'created_by' => Auth::id(),
                    'transactionable_id' => $receivePayment->id,
                    'transactionable_type' => \App\Models\Accounting\ReceivePayment::class,
                ]);

                $linesData = [];
                $now = now();

                // Cash/Bank Account (Debit)
                $linesData[] = [
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $request->depositTo,
                    'debit' => $homeAmount,
                    'credit' => 0,
                    'fc_currency_id' => $currencyId,
                    'fc_debit' => $currencyId ? $amount : null,
                    'exchange_rate' => $exchangeRate,
                    'memo' => $request->memo,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                // Accounts Receivable (Credit)
                $arAccount = ChartOfAcc::getOrCreateDefault('accounts-receivable');
                $linesData[] = [
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $arAccount->id,
                    'debit' => 0,
                    'credit' => $homeAmount,
                    'fc_currency_id' => $currencyId,
                    'fc_credit' => $currencyId ? $amount : null,
                    'exchange_rate' => $exchangeRate,
                    'memo' => $request->memo,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                JournalEntryLine::insert($linesData);

                return $journalEntry;
            });

            return $this->handleActionRedirect($request, 'receive-payment', $journalEntry->id, 'ReceivePayment received successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function edit(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $receivePayment = \App\Models\Accounting\ReceivePayment::find($journalEntry->transactionable_id);

        if (!$receivePayment) {
            abort(404, 'ReceivePayment not found');
        }

        $paymentData = [
            'id' => $journalEntry->id,
            'receive_payment_id' => $receivePayment->id,
            'customer' => $receivePayment->customer_id,
            'email' => $receivePayment->customer->email ?? '',
            'amountReceived' => number_format($receivePayment->amount, 2, '.', ''),
            'paymentDate' => $receivePayment->payment_date,
            'paymentMethod' => $receivePayment->payment_method_id,
            'depositTo' => $receivePayment->deposit_to_account_id,
            'referenceNo' => $receivePayment->reference_no,
            'memo' => $receivePayment->memo,
            'checkDate' => $receivePayment->check_date,
            'checkNumber' => $receivePayment->check_number,
            'exchange_rate' => $receivePayment->exchange_rate ?? 1,
            'currency_id' => $receivePayment->currency_id ?? "",
        ];

        return Inertia::render('Transaction/ReceivePayment/ReceivePaymentForm', [
            'payment' => $paymentData,
            'paymentMethods' => $this->paymentMethods()
        ]);
    }

    public function update(ReceivePaymentRequest $request, JournalEntry $journalEntry)
    {
        $validated = $request->validated();

        try {
            \App\Services\BooksLockService::check($journalEntry->date, $request->books_pin);
            if (date('Y-m-d', strtotime($journalEntry->date)) !== date('Y-m-d', strtotime($request->paymentDate))) {
                \App\Services\BooksLockService::check($request->paymentDate, $request->books_pin);
            }

            DB::transaction(function() use ($request, $journalEntry) {
                $amount = (float) str_replace(',', '', $request->amountReceived);
                $exchangeRate = $request->input('exchange_rate', 1);
                $currencyId = $request->input('currency_id');
                $homeAmount = $amount * $exchangeRate;

                // 1. Update Business Document (Payment)
                $receivePayment = \App\Models\Accounting\ReceivePayment::find($journalEntry->transactionable_id);
                if (!$receivePayment) {
                    throw new \Exception('ReceivePayment document not found');
                }

                $receivePayment->update([
                    'customer_id' => $request->customer,
                    'amount' => $amount,
                    'payment_date' => $request->paymentDate,
                    'payment_method_id' => $request->paymentMethod,
                    'deposit_to_account_id' => $request->depositTo,
                    'reference_no' => $request->referenceNo,
                    'memo' => $request->memo,
                    'check_date' => $request->checkDate,
                    'check_number' => $request->checkNumber,
                    'currency_id' => $currencyId,
                    'exchange_rate' => $exchangeRate,
                ]);

                // 2. Re-create Allocations
                $receivePayment->allocations()->delete();
                if ($request->has('credit_invoices')) {
                    $allocationsData = [];
                    $now = now();
                    foreach ($request->credit_invoices as $inv) {
                        if ((float)$inv['amount'] > 0) {
                            $allocationsData[] = [
                                'id' => \Illuminate\Support\Str::uuid()->toString(),
                                'receive_payment_id' => $receivePayment->id,
                                'credit_invoice_id' => $inv['id'],
                                'amount' => (float)$inv['amount'],
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];
                        }
                    }
                    if (!empty($allocationsData)) {
                        \App\Models\Accounting\ReceivePaymentAllocation::insert($allocationsData);
                    }
                }

                // 3. Update Financial Truth (Journal Entry)
                $journalEntry->update([
                    'date' => $request->paymentDate,
                    'reference' => $request->referenceNo,
                    'description' => $request->memo,
                    'payee_id' => $request->customer,
                    'total_amount' => $homeAmount,
                ]);

                // Re-create lines
                $journalEntry->lines->each->delete();

                $linesData = [];
                $now = now();

                // Cash/Bank Account (Debit)
                $linesData[] = [
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $request->depositTo,
                    'debit' => $homeAmount,
                    'credit' => 0,
                    'fc_currency_id' => $currencyId,
                    'fc_debit' => $currencyId ? $amount : null,
                    'exchange_rate' => $exchangeRate,
                    'memo' => $request->memo,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                // Accounts Receivable (Credit)
                $arAccount = ChartOfAcc::getOrCreateDefault('accounts-receivable');
                $linesData[] = [
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $arAccount->id,
                    'debit' => 0,
                    'credit' => $homeAmount,
                    'fc_currency_id' => $currencyId,
                    'fc_credit' => $currencyId ? $amount : null,
                    'exchange_rate' => $exchangeRate,
                    'memo' => $request->memo,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                JournalEntryLine::insert($linesData);
            });

            return $this->handleActionRedirect($request, 'receive-payment', $journalEntry->id, 'ReceivePayment updated successfully.');
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
            $receivePayment = \App\Models\Accounting\ReceivePayment::find($journalEntry->transactionable_id);

            if ($receivePayment) {
                $receivePayment->allocations()->delete();
                $receivePayment->delete();
            }

            $journalEntry->lines->each->delete();
            $journalEntry->delete();
        });

        if ($chartOfAccountId) {
            return redirect()->route('chart-of-account.history', ['chart_of_account' => $chartOfAccountId])
                ->with('success', 'ReceivePayment deleted successfully.');
        }

        return redirect()->route('dashboard')
            ->with('success', 'ReceivePayment deleted successfully.');
    }

    public function print(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $receivePayment = \App\Models\Accounting\ReceivePayment::with('customer', 'company', 'allocations.invoice')->findOrFail($journalEntry->transactionable_id);
        $company = $receivePayment->company ?? \App\Models\Company::current();

        $tableItems = [];
        $totalInvoiceAmount = 0;
        if ($receivePayment->allocations && $receivePayment->allocations->count() > 0) {
            foreach ($receivePayment->allocations as $alloc) {
                $invAmt = $alloc->invoice ? $alloc->invoice->total_amount : 0;
                $totalInvoiceAmount += $invAmt;
                $tableItems[] = [
                    "Payment for Invoice #" . ($alloc->invoice->invoice_no ?? 'Unknown'),
                    ($company?->home_currency_prefix ? $company?->home_currency_prefix . ' ' : '') . number_format($invAmt, 2),
                    ($company?->home_currency_prefix ? $company?->home_currency_prefix . ' ' : '') . number_format($alloc->amount, 2),
                ];
            }
        } else {
            $tableItems[] = [
                "Receive Payment Received",
                "-",
                ($company?->home_currency_prefix ? $company?->home_currency_prefix . ' ' : '') . number_format($receivePayment->amount, 2),
            ];
        }

        $printSetting = \App\Models\PrintSetting::getForPrint('payment_receipt');

        return view('print.document', [
            'printSetting' => $printSetting,
            'title' => $printSetting?->custom_title ?: 'Receive Payment Receipt',
            'headerAlignment' => $printSetting?->header_alignment ?: 'left',
            'staticFooterContent' => $printSetting?->static_footer_content ?: null,
            'layoutConfig' => $printSetting?->layout_config,
            'primaryColor' => $printSetting?->primary_color,
            'textColor' => $printSetting?->text_color,
            'pageSetup' => $printSetting?->page_setup,
            'blockStyles' => $printSetting?->block_styles,
            'documentNo' => $receivePayment->reference_no ?? '-',
            'date' => $receivePayment->payment_date,
            'dueDate' => null,
            'partyLabel' => 'Received From',
            'partyName' => $receivePayment->customer->display_name ?? $receivePayment->customer->company_name,
            'partyAddress' => $receivePayment->customer->billing_address ?? '',
            'partyEmail' => $receivePayment->customer->email ?? '',
            'tableHeaders' => ['Description', 'Invoice Amount', 'Payment Amount'],
            'tableItems' => $tableItems,
            'totalAmount' => $receivePayment->amount,
            'memo' => $receivePayment->memo,
            'statementMessage' => null,
            'company' => $company,
        ]);
    }
}
