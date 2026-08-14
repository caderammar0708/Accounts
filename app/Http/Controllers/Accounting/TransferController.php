<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Accounting\Transfer; 
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\Accounting\TransferRequest;

class TransferController extends Controller
{
    use \App\Traits\AccountingControllerTrait;

    public function create()
    {
        return Inertia::render('Transaction/Transfer/TransferForm');
    }

    public function store(TransferRequest $request)
    {
        $validated = $request->validated();
        $this->checkBooksLock($request->date, $request->books_pin);

        try {
            $journalEntry = DB::transaction(function() use ($request) {
                $amount = (float) $request->amount;

                // 1. Create Business Document (Transfer)
                $transfer = Transfer::create([
                    'from_account_id' => $request->transfer_from,
                    'to_account_id'   => $request->transfer_to,
                    'amount'          => $amount,
                    'date'            => $request->date,
                    'memo'            => $request->memo,
                    'reference_no'    => $request->referenceNo ?? 'TRF-' . time(),
                ]);

                // 2. Create Financial Truth (Journal Entry)
                $journalEntry = JournalEntry::create([
                    'date'                => $request->date,
                    'reference'           => $transfer->reference_no,
                    'description'         => $request->memo,
                    'transaction_type'    => 'transfer',
                    'total_amount'        => $amount,
                    'status'              => 'posted',
                    'created_by'          => Auth::id(),
                    'transactionable_id'  => $transfer->id,
                    'transactionable_type' => Transfer::class,
                ]);

                // From Account (Credit - Money leaving Asset)
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id'  => $request->transfer_from,
                    'debit'            => 0,
                    'credit'           => $amount,
                    'memo'             => $request->memo,
                ]);

                // To Account (Debit - Money entering Asset)
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id'  => $request->transfer_to,
                    'debit'            => $amount,
                    'credit'           => 0,
                    'memo'             => $request->memo,
                ]);
                return $journalEntry;
            });

            $action = $request->input('action', 'save');

            if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'Transfer saved successfully.'); }

            if ($action === 'new') {
                return redirect()->route('transfer.create')->with('success', 'Transfer saved successfully.');
            }

            return redirect()->route('transfer.edit', $journalEntry)->with('success', 'Transfer saved successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return response()->json(['message' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    public function edit(JournalEntry $journalEntry)
    {
        // Load the lines and the related Transfer model
        $journalEntry->load(['lines', 'transactionable']);

        $transfer = $journalEntry->transactionable;

        return Inertia::render('Transaction/Transfer/TransferForm', [
            'transfer' => [
                'id' => $journalEntry->id,
                'transfer_from' => $transfer->from_account_id,
                'transfer_to' => $transfer->to_account_id,
                'amount' => $transfer->amount,
                'date' => $transfer->date,
                'memo' => $transfer->memo,
                'referenceNo' => $transfer->reference_no,
            ]
        ]);
    }

    public function update(TransferRequest $request, JournalEntry $journalEntry)
    {
        $validated = $request->validated();
        $this->checkBooksLock($journalEntry->date, $request->books_pin);
        $this->checkBooksLock($request->date, $request->books_pin);

        try {
            DB::transaction(function() use ($request, $journalEntry) {
                $amount = (float) $request->amount;

                // 1. Update Business Document (Transfer)
                $transfer = $journalEntry->transactionable;
                $transfer->update([
                    'from_account_id' => $request->transfer_from,
                    'to_account_id'   => $request->transfer_to,
                    'amount'          => $amount,
                    'date'            => $request->date,
                    'memo'            => $request->memo,
                    'reference_no'    => $request->referenceNo ?? $transfer->reference_no,
                ]);

                // 2. Update Financial Truth (Journal Entry)
                $journalEntry->update([
                    'date'                => $request->date,
                    'reference'           => $transfer->reference_no,
                    'description'         => $request->memo,
                    'total_amount'        => $amount,
                ]);

                // Clear existing lines
                $journalEntry->lines->each->delete();

                // From Account (Credit - Money leaving Asset)
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id'  => $request->transfer_from,
                    'debit'            => 0,
                    'credit'           => $amount,
                    'memo'             => $request->memo,
                ]);

                // To Account (Debit - Money entering Asset)
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id'  => $request->transfer_to,
                    'debit'            => $amount,
                    'credit'           => 0,
                    'memo'             => $request->memo,
                ]);
            });

            $action = $request->input('action', 'save');

            if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'Transfer updated successfully.'); }

            if ($action === 'new') {
                return redirect()->route('transfer.create')->with('success', 'Transfer updated successfully.');
            }

            return redirect()->route('transfer.edit', $journalEntry)->with('success', 'Transfer updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return response()->json(['message' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(JournalEntry $journalEntry)
    {
        $this->checkBooksLock($journalEntry->date, request()->input('books_pin'));
        $chartOfAccountId = $journalEntry->lines->first()?->chart_of_acc_id
            ?? $journalEntry->lines->first()?->chart_of_account_id
            ?? $journalEntry->lines->first()?->account_id;

        DB::transaction(function () use ($journalEntry) {
            $transfer = Transfer::find($journalEntry->transactionable_id);

            if ($transfer) {
                $transfer->delete();
            }

            $journalEntry->lines()->delete();
            $journalEntry->delete();
        });

        if ($chartOfAccountId) {
            return redirect()->route('chart-of-account.history', ['chart_of_account' => $chartOfAccountId])
                ->with('success', 'Transfer deleted successfully.');
        }

        return redirect()->route('chart-of-account.index')
            ->with('success', 'Transfer deleted successfully.');
    }
}
