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
            'end_date' => 'required|date',
            'opening_balance' => 'required|numeric',
            'ending_balance' => 'required|numeric',
        ]);
        
        $company = auth()->user()->company;

        $reconciliation = BankReconciliation::create([
            'company_id' => $company ? $company->id : null,
            'account_id' => $request->account_id,
            'start_date' => '2000-01-01', // Dummy start date since it's not needed by user
            'end_date' => $request->end_date,
            'opening_balance' => $request->opening_balance,
            'ending_balance' => $request->ending_balance,
            'cleared_balance' => $request->opening_balance, // Initially, cleared balance is just the opening balance
            'status' => 'draft',
            'created_by' => auth()->id()
        ]);

        return redirect()->route('bank-reconciliation.process', $reconciliation->id);
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
