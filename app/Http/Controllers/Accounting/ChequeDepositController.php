<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\ChequeDeposit;
use App\Models\Accounting\ChequeDepositItem;
use App\Models\Accounting\ReceivePayment;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Http\Requests\Accounting\ChequeDepositRequest;
use App\Traits\AccountingControllerTrait;

class ChequeDepositController extends Controller
{
    use AccountingControllerTrait;

    /**
     * Look up the "Cheque in Hand" account by name (not hardcoded ID).
     */
    private function getChequeInHandAccount()
    {
        return ChartOfAcc::where('name', 'Cheque in Hand')->first();
    }

    /**
     * Get the next auto-incrementing deposit number.
     */
    private function getNextDepositNo()
    {
        return $this->getNextReferenceNumber('cheque_deposit', 1001);
    }

    /**
     * Show the create form with outstanding cheques.
     */
    public function create()
    {
        $chequeInHand = $this->getChequeInHandAccount();

        $outstandingCheques = [];
        if ($chequeInHand) {
            $outstandingCheques = ReceivePayment::with('customer')
                ->where('deposit_to_account_id', $chequeInHand->id)
                ->whereNull('cheque_deposit_id')
                ->orderBy('payment_date', 'desc')
                ->get()
                ->map(fn($rp) => [
                    'id' => $rp->id,
                    'customer_name' => $rp->customer->display_name ?? $rp->customer->company_name ?? 'Unknown',
                    'check_date' => $rp->check_date,
                    'check_number' => $rp->check_number,
                    'reference_no' => $rp->reference_no,
                    'amount' => $rp->amount,
                    'payment_date' => $rp->payment_date,
                ]);
        }

        return Inertia::render('Transaction/ChequeDeposit/ChequeDepositForm', [
            'nextDepositNo' => $this->getNextDepositNo(),
            'outstandingCheques' => $outstandingCheques,
        ]);
    }

    /**
     * Store a new cheque deposit.
     */
    public function store(ChequeDepositRequest $request)
    {
        $validated = $request->validated();
        $this->checkBooksLock($request->depositDate, $request->books_pin);

        try {
            $journalEntry = DB::transaction(function () use ($request) {
                $chequeInHand = $this->getChequeInHandAccount();
                if (!$chequeInHand) {
                    throw new \Exception('Cheque in Hand account not found. Please ensure it exists in your Chart of Accounts.');
                }

                // Calculate total from selected cheques
                $selectedPayments = ReceivePayment::whereIn('id', $request->selectedCheques)->get();
                $total = $selectedPayments->sum('amount');

                // 1. Create the Cheque Deposit record
                $deposit = ChequeDeposit::create([
                    'deposit_no' => $request->depositNo,
                    'deposit_date' => $request->depositDate,
                    'deposit_to_account_id' => $request->depositTo,
                    'total_amount' => $total,
                    'memo' => $request->memo,
                    'status' => 'posted',
                ]);

                // 2. Create deposit items and mark receive payments as deposited
                foreach ($selectedPayments as $rp) {
                    ChequeDepositItem::create([
                        'cheque_deposit_id' => $deposit->id,
                        'receive_payment_id' => $rp->id,
                        'amount' => $rp->amount,
                    ]);

                    $rp->update(['cheque_deposit_id' => $deposit->id]);
                }

                // 3. Create Journal Entry
                $journalEntry = JournalEntry::create([
                    'date' => $request->depositDate,
                    'reference' => $request->depositNo,
                    'description' => $request->memo,
                    'transaction_type' => 'cheque_deposit',
                    'total_amount' => $total,
                    'status' => 'posted',
                    'created_by' => Auth::id(),
                    'transactionable_id' => $deposit->id,
                    'transactionable_type' => ChequeDeposit::class,
                ]);

                // Debit: Selected Bank Account
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $request->depositTo,
                    'debit' => $total,
                    'credit' => 0,
                    'memo' => $request->memo,
                ]);

                // Credit: Cheque in Hand
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $chequeInHand->id,
                    'debit' => 0,
                    'credit' => $total,
                    'memo' => $request->memo,
                ]);

                return $journalEntry;
            });

            return $this->handleActionRedirect($request, 'cheque-deposit', $journalEntry->id, 'Cheque deposit saved successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Show the edit form for an existing cheque deposit.
     */
    public function edit(JournalEntry $journalEntry)
    {
        $deposit = ChequeDeposit::with('items.receivePayment.customer')
            ->find($journalEntry->transactionable_id);

        if (!$deposit) {
            abort(404, 'Cheque Deposit not found');
        }

        $chequeInHand = $this->getChequeInHandAccount();

        // Get currently linked cheques (for this deposit)
        $linkedCheques = $deposit->items->map(fn($item) => [
            'id' => $item->receivePayment->id,
            'customer_name' => $item->receivePayment->customer->display_name ?? $item->receivePayment->customer->company_name ?? 'Unknown',
            'check_date' => $item->receivePayment->check_date,
            'check_number' => $item->receivePayment->check_number,
            'reference_no' => $item->receivePayment->reference_no,
            'amount' => $item->receivePayment->amount,
            'payment_date' => $item->receivePayment->payment_date,
        ]);

        // Get other outstanding cheques (not linked to any deposit)
        $otherOutstanding = [];
        if ($chequeInHand) {
            $otherOutstanding = ReceivePayment::with('customer')
                ->where('deposit_to_account_id', $chequeInHand->id)
                ->whereNull('cheque_deposit_id')
                ->orderBy('payment_date', 'desc')
                ->get()
                ->map(fn($rp) => [
                    'id' => $rp->id,
                    'customer_name' => $rp->customer->display_name ?? $rp->customer->company_name ?? 'Unknown',
                    'check_date' => $rp->check_date,
                    'check_number' => $rp->check_number,
                    'reference_no' => $rp->reference_no,
                    'amount' => $rp->amount,
                    'payment_date' => $rp->payment_date,
                ]);
        }

        // Merge: linked cheques first (pre-selected), then other outstanding
        $allCheques = $linkedCheques->merge($otherOutstanding);
        $selectedIds = $linkedCheques->pluck('id')->toArray();

        return Inertia::render('Transaction/ChequeDeposit/ChequeDepositForm', [
            'deposit' => [
                'id' => $journalEntry->id,
                'cheque_deposit_id' => $deposit->id,
                'depositTo' => $deposit->deposit_to_account_id,
                'depositDate' => $deposit->deposit_date,
                'depositNo' => $deposit->deposit_no,
                'memo' => $deposit->memo,
            ],
            'outstandingCheques' => $allCheques,
            'selectedChequeIds' => $selectedIds,
            'nextDepositNo' => $deposit->deposit_no,
        ]);
    }

    /**
     * Update an existing cheque deposit.
     */
    public function update(ChequeDepositRequest $request, JournalEntry $journalEntry)
    {
        $validated = $request->validated();
        $this->checkBooksLock($journalEntry->date, $request->books_pin);
        $this->checkBooksLock($request->depositDate, $request->books_pin);

        try {
            DB::transaction(function () use ($request, $journalEntry) {
                $chequeInHand = $this->getChequeInHandAccount();
                if (!$chequeInHand) {
                    throw new \Exception('Cheque in Hand account not found.');
                }

                $deposit = ChequeDeposit::find($journalEntry->transactionable_id);
                if (!$deposit) {
                    throw new \Exception('Cheque Deposit document not found');
                }

                // 1. Unlink previously linked receive payments
                ReceivePayment::where('cheque_deposit_id', $deposit->id)
                    ->update(['cheque_deposit_id' => null]);

                // 2. Delete old deposit items
                $deposit->items()->delete();

                // 3. Recalculate total from new selection
                $selectedPayments = ReceivePayment::whereIn('id', $request->selectedCheques)->get();
                $total = $selectedPayments->sum('amount');

                // 4. Update the deposit record
                $deposit->update([
                    'deposit_no' => $request->depositNo,
                    'deposit_date' => $request->depositDate,
                    'deposit_to_account_id' => $request->depositTo,
                    'total_amount' => $total,
                    'memo' => $request->memo,
                ]);

                // 5. Re-create deposit items and mark receive payments
                foreach ($selectedPayments as $rp) {
                    ChequeDepositItem::create([
                        'cheque_deposit_id' => $deposit->id,
                        'receive_payment_id' => $rp->id,
                        'amount' => $rp->amount,
                    ]);

                    $rp->update(['cheque_deposit_id' => $deposit->id]);
                }

                // 6. Update Journal Entry
                $journalEntry->update([
                    'date' => $request->depositDate,
                    'reference' => $request->depositNo,
                    'description' => $request->memo,
                    'total_amount' => $total,
                ]);

                // 7. Re-create journal lines
                $journalEntry->lines->each->delete();

                // Debit: Bank Account
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $request->depositTo,
                    'debit' => $total,
                    'credit' => 0,
                    'memo' => $request->memo,
                ]);

                // Credit: Cheque in Hand
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $chequeInHand->id,
                    'debit' => 0,
                    'credit' => $total,
                    'memo' => $request->memo,
                ]);
            });

            return $this->handleActionRedirect($request, 'cheque-deposit', $journalEntry->id, 'Cheque deposit updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete a cheque deposit and release all linked cheques.
     */
    public function destroy(JournalEntry $journalEntry)
    {
        $this->checkBooksLock($journalEntry->date, request()->input('books_pin'));

        DB::transaction(function () use ($journalEntry) {
            $deposit = ChequeDeposit::find($journalEntry->transactionable_id);

            if ($deposit) {
                // Release linked receive payments
                ReceivePayment::where('cheque_deposit_id', $deposit->id)
                    ->update(['cheque_deposit_id' => null]);

                $deposit->items()->delete();
                $deposit->delete();
            }

            $journalEntry->lines->each->delete();
            $journalEntry->delete();
        });

        return redirect()->route('dashboard')->with('success', 'Cheque deposit deleted successfully.');
    }
}
