<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Accounting\BankReconciliation;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntryLine;
use Illuminate\Support\Facades\DB;

class BankReconciliationController extends Controller
{
    public function index()
    {
        $reconciliations = BankReconciliation::with('account')->orderBy('end_date', 'desc')->get();
        return Inertia::render('Transaction/BankReconciliation/Index', [
            'reconciliations' => $reconciliations
        ]);
    }

    public function create()
    {
        $accounts = ChartOfAcc::where('is_active', true)
            ->where('sub_type', 'bank')
            ->get(['id', 'name', 'account_type', 'account_code']);
            
        return Inertia::render('Transaction/BankReconciliation/Create', [
            'accounts' => $accounts
        ]);
    }

    public function store(Request $request)
    {
        if ($request->has('opening_balance')) {
            $request->merge(['opening_balance' => str_replace(',', '', (string)$request->opening_balance)]);
        }
        if ($request->has('ending_balance')) {
            $request->merge(['ending_balance' => str_replace(',', '', (string)$request->ending_balance)]);
        }

        $request->validate([
            'account_id' => 'required|exists:chart_of_accs,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'opening_balance' => 'required|numeric',
            'ending_balance' => 'required|numeric',
        ]);
        
        // Prevent creating multiple reconciliations for the same account in the same month
        $endMonth = date('Y-m', strtotime($request->end_date));
        $exists = BankReconciliation::where('account_id', $request->account_id)
            ->whereRaw("DATE_FORMAT(end_date, '%Y-%m') = ?", [$endMonth])
            ->exists();
            
        if ($exists) {
            return back()->withErrors(['end_date' => 'A bank reconciliation already exists for this account in the selected month.']);
        }

        $company = auth()->user()->company;

        $reconciliation = BankReconciliation::create([
            'company_id' => $company ? $company->id : null,
            'account_id' => $request->account_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'opening_balance' => $request->opening_balance,
            'ending_balance' => $request->ending_balance,
            'cleared_balance' => $request->opening_balance, // Initially, cleared balance is just the opening balance
            'status' => 'draft',
            'created_by' => auth()->id()
        ]);

        return redirect()->route('bank-reconciliation.process', $reconciliation->id);
    }
    
    public function getOpeningBalance(Request $request)
    {
        $request->validate([
            'account_id' => 'required|exists:chart_of_accs,id',
            'start_date' => 'required|date',
        ]);

        // Find the most recent completed reconciliation before the start_date
        $lastReconciliation = BankReconciliation::where('account_id', $request->account_id)
            ->where('end_date', '<', $request->start_date)
            ->where('status', 'completed')
            ->orderBy('end_date', 'desc')
            ->first();

        return response()->json([
            'opening_balance' => $lastReconciliation ? $lastReconciliation->ending_balance : 0
        ]);
    }
    
    public function destroy(BankReconciliation $reconciliation)
    {
        if ($reconciliation->status !== 'draft') {
            return back()->with('error', 'Only draft reconciliations can be deleted.');
        }
        
        // Un-clear all journal entry lines that were cleared by this draft reconciliation
        JournalEntryLine::where('bank_reconciliation_id', $reconciliation->id)
            ->update([
                'is_cleared' => false,
                'bank_reconciliation_id' => null
            ]);
            
        $reconciliation->delete();
        
        return back()->with('success', 'Draft bank reconciliation deleted successfully.');
    }

    public function process(BankReconciliation $reconciliation)
    {
        // Load uncleared lines or lines cleared by this reconciliation
        $lines = JournalEntryLine::with('journalEntry')
            ->where('chart_of_acc_id', $reconciliation->account_id)
            ->whereHas('journalEntry', function($q) use ($reconciliation) {
                $q->where('date', '<=', $reconciliation->end_date);
            })
            ->where(function($q) use ($reconciliation) {
                $q->where('is_cleared', false)
                  ->orWhere('bank_reconciliation_id', $reconciliation->id);
            })
            ->get();
            
        return Inertia::render('Transaction/BankReconciliation/Process', [
            'reconciliation' => $reconciliation->load('account'),
            'lines' => $lines
        ]);
    }

    public function toggleClear(Request $request, BankReconciliation $reconciliation, JournalEntryLine $line)
    {
        if ($line->is_cleared && $line->bank_reconciliation_id !== $reconciliation->id) {
            return back()->with('error', 'This transaction is already cleared in another reconciliation.');
        }

        $line->is_cleared = !$line->is_cleared;
        $line->bank_reconciliation_id = $line->is_cleared ? $reconciliation->id : null;
        $line->save();

        // Update cleared balance
        $clearedDeposits = JournalEntryLine::where('bank_reconciliation_id', $reconciliation->id)->sum('debit');
        $clearedPayments = JournalEntryLine::where('bank_reconciliation_id', $reconciliation->id)->sum('credit');
        
        $reconciliation->cleared_balance = $reconciliation->opening_balance + $clearedDeposits - $clearedPayments;
        $reconciliation->save();

        return back();
    }

    public function finish(BankReconciliation $reconciliation)
    {
        $difference = $reconciliation->ending_balance - $reconciliation->cleared_balance;
        if (abs($difference) > 0.01) {
            return back()->with('error', 'Cannot finish reconciliation. The difference must be zero.');
        }

        $reconciliation->status = 'completed';
        $reconciliation->save();

        return redirect()->route('bank-reconciliation.index')->with('success', 'Bank account reconciled successfully.');
    }
}
