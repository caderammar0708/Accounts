<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Accounting\BankImport;
use App\Models\Accounting\BankImportLine;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class BankController extends Controller
{
    public function index(Request $request)
    {
        $uncategorized = BankImportLine::with('import')->where('status', 'uncategorized')->orderBy('transaction_date', 'desc')->get();
        $moved = BankImportLine::with(['import', 'assignedAccount'])->where('status', 'moved')->orderBy('transaction_date', 'desc')->get();
        $closed = BankImportLine::with(['import', 'assignedAccount'])->where('status', 'closed')->orderBy('transaction_date', 'desc')->get();
        
        $accounts = ChartOfAcc::where('is_active', true)->get(['id', 'name', 'account_type', 'account_code']);
        $bankAccounts = ChartOfAcc::where('is_active', true)
            ->where(function ($q) {
                $q->where('sub_type', 'bank')
                  ->orWhere('account_type', 'Bank')
                  ->orWhere('account_type', 'like', '%bank%')
                  ->orWhere('name', 'like', '%bank%');
            })
            ->get(['id', 'name', 'account_type', 'account_code']);

        if ($bankAccounts->isEmpty()) {
            $bankAccounts = $accounts;
        }

        return Inertia::render('Transaction/Bank/Index', [
            'uncategorized' => $uncategorized,
            'moved' => $moved,
            'closed' => $closed,
            'accounts' => $accounts,
            'bankAccounts' => $bankAccounts
        ]);
    }

    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="bank_import_template.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Date', 'Ref Number', 'Debit', 'Credit', 'Description']);
            fputcsv($file, ['29/01/2026', 'SD49395', '', '25000.00', 'CEFT-RASLY INVESTMENT TO GROWDIGITEC']);
            fputcsv($file, ['30/01/2026', 'SD49396', '150.00', '', 'Bank Fee']);
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:csv,txt|max:5120',
            'bank_account_id' => 'required|exists:chart_of_accs,id',
        ]);

        $file = $request->file('file');
        $csvData = array_map('str_getcsv', file($file->getRealPath()));
        $header = array_shift($csvData);

        if (
            strpos(strtolower(trim($header[0] ?? '')), 'date') === false ||
            strpos(strtolower(trim($header[1] ?? '')), 'ref') === false ||
            strpos(strtolower(trim($header[2] ?? '')), 'debit') === false ||
            strpos(strtolower(trim($header[3] ?? '')), 'credit') === false ||
            strpos(strtolower(trim($header[4] ?? '')), 'description') === false
        ) {
            return back()->with('error', 'Invalid CSV format. Please download and use the template.');
        }

        DB::beginTransaction();
        try {
            $company = auth()->user()->company ?? auth()->user()->currentCompany();
            $import = BankImport::create([
                'company_id' => $company ? $company->id : null,
                'bank_account_id' => $request->bank_account_id,
                'import_date' => now(),
                'filename' => $file->getClientOriginalName(),
                'created_by' => auth()->id()
            ]);

            foreach ($csvData as $row) {
                if (count($row) < 5 || empty($row[0])) continue;

                // Handle date format d/m/Y (e.g. 29/01/2026)
                $dateStr = str_replace('/', '-', $row[0]);
                $transactionDate = date('Y-m-d', strtotime($dateStr));
                
                $refNumber = $row[1] ?? '';
                $debit = (float) str_replace(',', '', $row[2] ?? '0');
                $credit = (float) str_replace(',', '', $row[3] ?? '0');
                $description = $row[4] ?? '';

                // Calculate single amount for the line (Deposits positive, Payments negative)
                // Assuming Debit on a bank statement means money OUT (negative to us) 
                // and Credit means money IN (positive to us).
                $amount = $credit - $debit;

                BankImportLine::create([
                    'bank_import_id' => $import->id,
                    'transaction_date' => $transactionDate,
                    'description' => $description,
                    'reference' => $refNumber,
                    'amount' => $amount,
                    'status' => 'uncategorized'
                ]);
            }

            DB::commit();
            return back()->with('success', 'Bank statement imported successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error importing statement: ' . $e->getMessage());
        }
    }

    public function move(Request $request, BankImportLine $line)
    {
        $request->validate([
            'account_id' => 'required|exists:chart_of_accs,id',
            'bank_account_id' => 'required|exists:chart_of_accs,id' // The actual bank account chart of account
        ]);

        DB::beginTransaction();
        try {
            $company = auth()->user()->company;
            
            // Create Journal Entry
            $je = JournalEntry::create([
                'company_id' => $company ? $company->id : null,
                'date' => $line->transaction_date,
                'reference' => $line->reference ?? 'BANK-IMP-' . strtoupper(substr(uniqid(), -5)),
                'description' => 'Bank Reconciled: ' . $line->description,
                'created_by' => auth()->id(),
                'status' => 'posted'
            ]);

            $isDeposit = $line->amount > 0;
            $absAmount = abs($line->amount);

            // Bank Account Line
            JournalEntryLine::create([
                'journal_entry_id' => $je->id,
                'chart_of_acc_id' => $request->bank_account_id,
                'debit' => $isDeposit ? $absAmount : 0,
                'credit' => $isDeposit ? 0 : $absAmount,
                'memo' => 'Bank Import'
            ]);

            // Selected Category Line
            JournalEntryLine::create([
                'journal_entry_id' => $je->id,
                'chart_of_acc_id' => $request->account_id,
                'debit' => $isDeposit ? 0 : $absAmount,
                'credit' => $isDeposit ? $absAmount : 0,
                'memo' => $line->description
            ]);

            $line->update([
                'status' => 'moved',
                'assigned_account_id' => $request->account_id,
                'journal_entry_id' => $je->id
            ]);

            DB::commit();
            return back()->with('success', 'Transaction moved successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error moving transaction: ' . $e->getMessage());
        }
    }

    public function close(BankImportLine $line)
    {
        if ($line->status !== 'moved') {
            return back()->with('error', 'Only moved transactions can be closed.');
        }

        $line->update(['status' => 'closed']);
        return back()->with('success', 'Transaction closed successfully.');
    }

    public function reverse(BankImportLine $line)
    {
        DB::beginTransaction();
        try {
            if ($line->journal_entry_id) {
                $je = JournalEntry::find($line->journal_entry_id);
                if ($je) {
                    $je->lines()->delete();
                    $je->delete();
                }
            }
            
            $line->update([
                'status' => 'uncategorized',
                'assigned_account_id' => null,
                'journal_entry_id' => null
            ]);
            
            DB::commit();
            return back()->with('success', 'Transaction reversed and moved to uncategorized.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error reversing transaction: ' . $e->getMessage());
        }
    }

    public function destroy(BankImportLine $line)
    {
        DB::beginTransaction();
        try {
            if ($line->journal_entry_id) {
                $je = JournalEntry::find($line->journal_entry_id);
                if ($je) {
                    $je->lines()->delete();
                    $je->delete();
                }
            }
            $line->delete();
            DB::commit();
            return back()->with('success', 'Transaction deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error deleting transaction: ' . $e->getMessage());
        }
    }
}
