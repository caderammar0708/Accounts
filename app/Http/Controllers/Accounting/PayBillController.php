<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Supplier;
use App\Models\Accounting\BillPayment;
use App\Models\Accounting\BillPaymentAllocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Traits\AccountingControllerTrait;

class PayBillController extends Controller
{
    use AccountingControllerTrait;

    public function create(Request $request)
    {
        return Inertia::render('Transaction/PayBill/PayBill', [
            'paymentMethods' => $this->paymentMethods()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier' => 'required|uuid',
            'amount' => 'required|numeric|min:0',
            'paymentDate' => 'required|date',
            'paymentMethod' => 'nullable|uuid',
            'paymentAccount' => 'required|uuid',
            'referenceNo' => 'nullable|string|max:255',
            'memo' => 'nullable|string',
            'bills' => 'nullable|array',
            'bills.*.id' => 'required|uuid',
            'bills.*.amount' => 'required|numeric|min:0',
        ]);

        $this->checkBooksLock($request->paymentDate, $request->books_pin);

        try {
            $journalEntry = DB::transaction(function() use ($request, $validated) {
                $amount = (float) $validated['amount'];

                $receivePayment = BillPayment::create([
                    'supplier_id' => $request->supplier,
                    'amount' => $amount,
                    'payment_date' => $request->paymentDate,
                    'payment_method_id' => $request->paymentMethod,
                    'payment_account_id' => $request->paymentAccount,
                    'reference_no' => $request->referenceNo,
                    'memo' => $request->memo,
                    'check_date' => $request->checkDate,
                    'check_number' => $request->checkNumber,
                    'currency_id' => $request->input('currency_id'),
                    'exchange_rate' => $request->input('exchange_rate', 1),
                ]);

                $exchangeRate = $request->input('exchange_rate', 1);
                $currencyId = $request->input('currency_id');
                $homeAmount = $amount * $exchangeRate;

                $totalAllocated = 0;
                if (!empty($request->bills)) {
                    foreach ($request->bills as $billData) {
                        $allocAmount = (float) $billData['amount'];
                        if ($allocAmount > 0) {
                            BillPaymentAllocation::create([
                                'bill_payment_id' => $receivePayment->id,
                                'bill_id' => $billData['id'],
                                'amount_applied' => $allocAmount,
                            ]);
                            $totalAllocated += $allocAmount;

                            $bill = \App\Models\Accounting\Bill::find($billData['id']);
                            if ($bill) {
                                $totalPaid = BillPaymentAllocation::where('bill_id', $bill->id)->sum('amount_applied');
                                if ($totalPaid >= $bill->total_amount - 0.01) {
                                    $bill->update(['status' => 'paid']);
                                } else {
                                    $bill->update(['status' => 'posted']);
                                }
                            }
                        }
                    }
                }

                $journalEntry = JournalEntry::create([
                    'date' => $request->paymentDate,
                    'reference' => $request->referenceNo,
                    'description' => $request->memo ?? 'Bill Payment',
                    'transaction_type' => 'pay_bill',
                    'payee_id' => $request->supplier,
                    'payee_type' => \App\Models\Supplier::class,
                    'transactionable_type' => BillPayment::class,
                    'transactionable_id' => $receivePayment->id,
                    'total_amount' => $homeAmount,
                    'status' => 'posted',
                    'created_by' => Auth::id(),
                    ]);

                // Credit Bank Account (Money leaving)
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $request->paymentAccount,
                    'description' => $request->memo ?? 'Bill Payment',
                    'credit' => $homeAmount,
                    'debit' => 0,
                    'fc_currency_id' => $currencyId,
                    'fc_credit' => $currencyId ? $amount : null,
                    'exchange_rate' => $exchangeRate,
                ]);

                // Debit Accounts Payable
                $apAccount = ChartOfAcc::where('account_type', 'liability')
                    ->where('name', 'like', '%Accounts Payable%')
                    ->first();

                if (!$apAccount) {
                    $apAccount = ChartOfAcc::where('account_type', 'liability')->first();
                }

                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $apAccount->id ?? ChartOfAcc::first()->id,
                    'description' => 'ReceivePayment for Bill(s)',
                    'debit' => $homeAmount,
                    'credit' => 0,
                    'fc_currency_id' => $currencyId,
                    'fc_debit' => $currencyId ? $amount : null,
                    'exchange_rate' => $exchangeRate,
                ]);

                $billPayment->attachAttachments($request->input('attachment_ids', []));
                $journalEntry->attachAttachments($request->input('attachment_ids', []));

                return $journalEntry;
            });

            return $this->handleActionRedirect($request, 'pay-bill', $journalEntry->id, 'Bill payment recorded successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function edit(JournalEntry $journalEntry)
    {
        $journalEntry->load(['lines', 'attachments']);
        $receivePayment = BillPayment::with(['allocations', 'attachments'])->find($journalEntry->transactionable_id);

        if (!$receivePayment) {
            abort(404, 'Bill payment not found');
        }

        $paymentData = [
            'id' => $journalEntry->id,
            'supplier' => $receivePayment->supplier_id,
            'amount' => number_format($receivePayment->amount, 2, '.', ''),
            'paymentDate' => $receivePayment->payment_date,
            'paymentMethod' => $receivePayment->payment_method_id,
            'paymentAccount' => $receivePayment->payment_account_id,
            'referenceNo' => $receivePayment->reference_no,
            'memo' => $receivePayment->memo,
            'checkDate' => $receivePayment->check_date,
            'checkNumber' => $receivePayment->check_number,
            'currency_id' => $receivePayment->currency_id ?? "",
            'exchange_rate' => $receivePayment->exchange_rate ?? 1,
            'allocations' => $receivePayment->allocations->map(function ($alloc) {
                return [
                    'bill_id' => $alloc->bill_id,
                    'amount_applied' => $alloc->amount_applied,
                ];
            })->toArray(),
            'attachments' => $receivePayment->attachments->isNotEmpty() ? $receivePayment->attachments : $journalEntry->attachments,
        ];

        return Inertia::render('Transaction/PayBill/PayBill', [
            'pay_bill' => $paymentData,
            'paymentMethods' => $this->paymentMethods()
        ]);
    }

    public function update(Request $request, JournalEntry $journalEntry)
    {
        $validated = $request->validate([
            'supplier' => 'required|uuid',
            'amount' => 'required|numeric|min:0',
            'paymentDate' => 'required|date',
            'paymentMethod' => 'nullable|uuid',
            'paymentAccount' => 'required|uuid',
            'referenceNo' => 'nullable|string|max:255',
            'memo' => 'nullable|string',
            'bills' => 'nullable|array',
            'bills.*.id' => 'required|uuid',
            'bills.*.amount' => 'required|numeric|min:0',
        ]);

        $this->checkBooksLock($journalEntry->date, $request->books_pin);
        $this->checkBooksLock($request->paymentDate, $request->books_pin);

        try {
            DB::transaction(function() use ($request, $validated, $journalEntry) {
                $amount = (float) $validated['amount'];

                $receivePayment = BillPayment::find($journalEntry->transactionable_id);
                if (!$receivePayment) {
                    throw new \Exception('Bill payment document not found');
                }

                // Delete old allocations
                foreach ($receivePayment->allocations as $alloc) {
                    $billId = $alloc->bill_id;
                    $alloc->delete();
                    $bill = \App\Models\Accounting\Bill::find($billId);
                    if ($bill) {
                        $totalPaid = BillPaymentAllocation::where('bill_id', $bill->id)->sum('amount_applied');
                        if ($totalPaid >= $bill->total_amount - 0.01) {
                            $bill->update(['status' => 'paid']);
                        } else {
                            $bill->update(['status' => 'posted']);
                        }
                    }
                }

                $receivePayment->update([
                    'supplier_id' => $request->supplier,
                    'amount' => $amount,
                    'payment_date' => $request->paymentDate,
                    'payment_method_id' => $request->paymentMethod,
                    'payment_account_id' => $request->paymentAccount,
                    'reference_no' => $request->referenceNo,
                    'memo' => $request->memo,
                    'check_date' => $request->checkDate,
                    'check_number' => $request->checkNumber,
                    'currency_id' => $request->input('currency_id'),
                    'exchange_rate' => $request->input('exchange_rate', 1),
                ]);

                $exchangeRate = $request->input('exchange_rate', 1);
                $currencyId = $request->input('currency_id');
                $homeAmount = $amount * $exchangeRate;

                // Create new allocations
                if (!empty($request->bills)) {
                    foreach ($request->bills as $billData) {
                        $allocAmount = (float) $billData['amount'];
                        if ($allocAmount > 0) {
                            BillPaymentAllocation::create([
                                'bill_payment_id' => $receivePayment->id,
                                'bill_id' => $billData['id'],
                                'amount_applied' => $allocAmount,
                            ]);

                            $bill = \App\Models\Accounting\Bill::find($billData['id']);
                            if ($bill) {
                                $totalPaid = BillPaymentAllocation::where('bill_id', $bill->id)->sum('amount_applied');
                                if ($totalPaid >= $bill->total_amount - 0.01) {
                                    $bill->update(['status' => 'paid']);
                                } else {
                                    $bill->update(['status' => 'posted']);
                                }
                            }
                        }
                    }
                }

                $journalEntry->update([
                    'date' => $request->paymentDate,
                    'reference' => $request->referenceNo,
                    'description' => $request->memo ?? 'Bill Payment',
                    'payee_id' => $request->supplier,
                    'payee_type' => \App\Models\Supplier::class,
                    'total_amount' => $homeAmount,
                ]);

                $journalEntry->lines->each->delete();

                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $request->paymentAccount,
                    'description' => $request->memo ?? 'Bill Payment',
                    'credit' => $homeAmount,
                    'debit' => 0,
                    'fc_currency_id' => $currencyId,
                    'fc_credit' => $currencyId ? $amount : null,
                    'exchange_rate' => $exchangeRate,
                ]);

                $apAccount = ChartOfAcc::where('account_type', 'liability')
                    ->where('name', 'like', '%Accounts Payable%')
                    ->first();
                if (!$apAccount) {
                    $apAccount = ChartOfAcc::where('account_type', 'liability')->first();
                }

                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $apAccount->id ?? ChartOfAcc::first()->id,
                    'description' => 'ReceivePayment for Bill(s)',
                    'debit' => $homeAmount,
                    'credit' => 0,
                    'fc_currency_id' => $currencyId,
                    'fc_debit' => $currencyId ? $amount : null,
                    'exchange_rate' => $exchangeRate,
                ]);

                $billPayment = BillPayment::find($journalEntry->transactionable_id);
                if ($billPayment) {
                    $billPayment->attachAttachments($request->input('attachment_ids', []));
                }
                $journalEntry->attachAttachments($request->input('attachment_ids', []));
            });

            return $this->handleActionRedirect($request, 'pay-bill', $journalEntry->id, 'Bill payment updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function void(Request $request, JournalEntry $journalEntry)
    {
        $this->checkBooksLock($journalEntry->date, $request->input('books_pin'));

        DB::transaction(function () use ($journalEntry) {
            $billPayment = BillPayment::find($journalEntry->transactionable_id);

            if ($billPayment) {
                $allocations = BillPaymentAllocation::where('bill_payment_id', $billPayment->id)->get();

                foreach ($allocations as $allocation) {
                    $billId = $allocation->bill_id;
                    $allocation->delete();

                    // Re-evaluate bill status
                    $bill = \App\Models\Accounting\Bill::find($billId);
                    if ($bill) {
                        $totalPaid = BillPaymentAllocation::where('bill_id', $bill->id)->sum('amount_applied');
                        if ($totalPaid >= $bill->total_amount - 0.01) {
                            $bill->update(['status' => 'paid']);
                        } else {
                            $bill->update(['status' => 'posted']);
                        }
                    }
                }

                $billPayment->update(['status' => 'void', 'voided_at' => now()]);
            }

            $journalEntry->update(['status' => 'void', 'total_amount' => 0, 'voided_at' => now()]);
            $journalEntry->lines()->update(['debit' => 0, 'credit' => 0, 'fc_debit' => 0, 'fc_credit' => 0]);
        });

        return redirect()->back()->with('success', 'Bill payment voided successfully.');
    }

    public function destroy(JournalEntry $journalEntry)
    {
        $this->checkBooksLock($journalEntry->date, request()->input('books_pin'));
        $chartOfAccountId = $journalEntry->lines->first()?->chart_of_acc_id
            ?? $journalEntry->lines->first()?->chart_of_account_id
            ?? $journalEntry->lines->first()?->account_id;

        DB::transaction(function () use ($journalEntry) {
            $receivePayment = BillPayment::find($journalEntry->transactionable_id);

            if ($receivePayment) {
                $allocations = BillPaymentAllocation::where('bill_payment_id', $receivePayment->id)->get();

                foreach ($allocations as $allocation) {
                    $billId = $allocation->bill_id;
                    $allocation->delete();

                    // Re-evaluate bill status
                    $bill = \App\Models\Accounting\Bill::find($billId);
                    if ($bill) {
                        $totalPaid = BillPaymentAllocation::where('bill_id', $bill->id)->sum('amount_applied');
                        if ($totalPaid >= $bill->total_amount - 0.01) {
                            $bill->update(['status' => 'paid']);
                        } else {
                            $bill->update(['status' => 'posted']);
                        }
                    }
                }
                $receivePayment->delete();
            }

            $journalEntry->lines()->delete();
            $journalEntry->delete();
        });

        if ($chartOfAccountId) {
            return redirect()->route('chart-of-account.history', ['chart_of_account' => $chartOfAccountId])
                ->with('success', 'Bill ReceivePayment deleted successfully.');
        }

        return redirect()->route('dashboard')
            ->with('success', 'Bill ReceivePayment deleted successfully.');
    }

    public function print(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $receivePayment = BillPayment::with('supplier', 'company', 'allocations.bill')->findOrFail($journalEntry->transactionable_id);
        $company = $receivePayment->company ?? \App\Models\Company::current();

        $tableItems = [];
        if ($receivePayment->allocations && $receivePayment->allocations->count() > 0) {
            foreach ($receivePayment->allocations as $alloc) {
                $tableItems[] = [
                    "ReceivePayment applied to Bill #" . ($alloc->bill->bill_no ?? 'Unknown'),
                    ($company?->home_currency_prefix ? $company?->home_currency_prefix . ' ' : '') . number_format($alloc->amount_applied, 2),
                ];
            }
        } else {
            $tableItems[] = [
                "ReceivePayment to Supplier",
                ($company?->home_currency_prefix ? $company?->home_currency_prefix . ' ' : '') . number_format($receivePayment->amount, 2),
            ];
        }

        $printSetting = \App\Models\PrintSetting::getForPrint('payment_voucher');

        return view('print.document', [
            'printSetting' => $printSetting,
            'title' => $printSetting?->custom_title ?: 'ReceivePayment Voucher',
            'headerAlignment' => $printSetting?->header_alignment ?: 'left',
            'staticFooterContent' => $printSetting?->static_footer_content ?: null,
            'layoutConfig' => $printSetting?->layout_config,
            'primaryColor' => $printSetting?->primary_color,
            'textColor' => $printSetting?->text_color,
            'pageSetup' => $printSetting?->page_setup,
            'blockStyles' => $printSetting?->block_styles,
            'documentNo' => $receivePayment->reference_no,
            'date' => $receivePayment->payment_date,
            'dueDate' => null,
            'partyLabel' => 'Paid To',
            'partyName' => $receivePayment->supplier->display_name ?? $receivePayment->supplier->company_name,
            'partyAddress' => '',
            'partyEmail' => $receivePayment->supplier->email ?? '',
            'tableHeaders' => ['Description', 'Amount'],
            'tableItems' => $tableItems,
            'totalAmount' => $receivePayment->amount,
            'memo' => $receivePayment->memo,
            'statementMessage' => null,
            'company' => $company,
        ]);
    }
}
