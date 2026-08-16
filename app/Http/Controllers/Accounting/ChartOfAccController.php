<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Models\Accounting\ChartOfAcc;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\Accounting\ChartOfAccRequest;

class ChartOfAccController extends Controller
{
    public function index()
    {
        $accounts = ChartOfAcc::withSum('journalLines', 'debit')
            ->withSum('journalLines', 'credit')
            ->withSum('journalLines', 'fc_debit')
            ->withSum('journalLines', 'fc_credit')
            ->orderByRaw('FIELD(LOWER(account_type), "asset", "liability", "equity", "income", "expense")')
            ->orderBy('sub_type')
            ->orderBy('name')
            ->get();

        $chartOfAccounts = collect();
        $buildTree = function ($parentId) use (&$buildTree, $accounts, &$chartOfAccounts) {
            $children = $accounts->where('parent_id', $parentId);
            foreach ($children as $child) {
                $chartOfAccounts->push($child);
                $buildTree($child->id);
            }
        };
        $buildTree(null);

        $currencies = \App\Models\Company::current()?->multi_currency_enabled ? \App\Models\Currency::where('is_active', true)->get() : [];

        $chartOfAccounts = $chartOfAccounts->map(function ($account) {
            $account->currency_code = $account->currency_id ? $account->currency?->code : null;
            return $account;
        });

        return Inertia::render('Accounting/chart-of-acc-index', [
            'chartOfAccounts' => $chartOfAccounts,
            'currencies' => $currencies,
            'multi_currency_enabled' => \App\Models\Company::current()?->multi_currency_enabled,
            'home_currency_id' => \App\Models\Company::current()?->home_currency_id,
            'lastOpeningBalanceDate' => session('last_opening_balance_date', date('Y-m-d')),
        ]);
    }

    public function store(ChartOfAccRequest $request)
    {


        $request->validated();

        if ($request->filled('opening_balance_date')) {
            session(['last_opening_balance_date' => $request->input('opening_balance_date')]);
        }

        $account = ChartOfAcc::create([
            'account_code' => $request->input('account_code'),
            'name' => $request->input('name'),
            'account_type' => $request->input('account_type'),
            'sub_type' => $request->input('sub_type'),
            'balance' => 0,
            'description' => $request->input('description'),
            'is_active' => $request->boolean('is_active', true),
            'currency_id' => $request->input('currency_id') ?: \App\Models\Company::current()?->home_currency_id ?: null,
            'parent_id' => $request->input('is_subaccount') ? $request->input('parent_id') : null,
            'is_locked' => $request->boolean('is_locked', false),
        ]);

        // If opening balance > 0, create a Journal Entry
        // Only allow opening balance for Asset, Liability, and Equity
        $openingBalance = (float) $request->input('opening_balance', 0);
        $canHaveOpeningBalance = in_array($account->account_type, ['asset', 'liability', 'equity']);

        if ($openingBalance != 0 && $canHaveOpeningBalance) {
            $equityAccount = ChartOfAcc::firstOrCreate(
                [
                    'name' => 'Opening Balance Equity'
                ],
                [
                    'account_code' => '3000', // Typical equity code
                    'account_type' => 'equity',
                    'sub_type' => 'owners-equity',
                    'is_active' => true,
                ]
            );

            $journalEntry = \App\Models\Accounting\JournalEntry::create([
                'date' => $request->input('opening_balance_date', now()),
                'reference' => 'OPENING_BAL',
                'description' => 'Opening balance for ' . $account->name,
                'transaction_type' => 'opening_balance',
                'total_amount' => abs($openingBalance),
                'status' => 'posted',
                'created_by' => Auth::id(),
            ]);

            // Asset and Expense: Debit increases, Credit decreases
            // Liability, Equity, Income: Credit increases, Debit decreases
            $isDebitSide = in_array($account->account_type, ['asset', 'expense']);

            if ($openingBalance > 0) {
                $accountDebit = $isDebitSide ? $openingBalance : 0;
                $accountCredit = $isDebitSide ? 0 : $openingBalance;

                $equityDebit = $isDebitSide ? 0 : $openingBalance;
                $equityCredit = $isDebitSide ? $openingBalance : 0;
            } else {
                $accountDebit = $isDebitSide ? 0 : abs($openingBalance);
                $accountCredit = $isDebitSide ? abs($openingBalance) : 0;

                $equityDebit = $isDebitSide ? abs($openingBalance) : 0;
                $equityCredit = $isDebitSide ? 0 : abs($openingBalance);
            }

            $journalEntry->lines()->create([
                'chart_of_acc_id' => $account->id,
                'debit' => $accountDebit,
                'credit' => $accountCredit,
                'memo' => 'Opening balance',
            ]);

            $journalEntry->lines()->create([
                'chart_of_acc_id' => $equityAccount->id,
                'debit' => $equityDebit,
                'credit' => $equityCredit,
                'memo' => 'Opening balance offset',
            ]);
        }

        return redirect()->back()->with([
            'success' => 'Chart of account created successfully.',
            'new_account' => [
                'value' => $account->id,
                'label' => "{$account->account_code} - {$account->name}"
            ]
        ]);
    }

    public function update(ChartOfAccRequest $request, ChartOfAcc $chartOfAccount)
    {
        if ($chartOfAccount->isSystemAccount()) {
            if ($request->has('is_locked') && !$request->boolean('is_locked')) {
                return redirect()->back()->with('error', 'System accounts cannot be unlocked.');
            }
            if ($request->has('is_active') && !$request->boolean('is_active')) {
                return redirect()->back()->with('error', 'System accounts must remain active.');
            }
            if ($request->has('name') && (
                $request->input('name') !== $chartOfAccount->name ||
                $request->input('account_code') !== $chartOfAccount->account_code ||
                $request->input('account_type') !== $chartOfAccount->account_type ||
                $request->input('sub_type') !== $chartOfAccount->sub_type
            )) {
                return redirect()->back()->with('error', 'System account details cannot be modified.');
            }
        }

        if ($chartOfAccount->is_locked) {
            // Only allow updates if we are explicitly unlocking it
            if (!($request->has('is_locked') && !$request->boolean('is_locked'))) {
                return redirect()->back()->with('error', 'This account is locked and cannot be modified.');
            }
        }

        // Handle status toggle (active/inactive) from row action dropdown
        if ($request->has('is_active') && !$request->has('name')) {
            if ($chartOfAccount->isSystemAccount() && !$request->boolean('is_active')) {
                return redirect()->back()->with('error', 'System accounts must remain active.');
            }
            $chartOfAccount->update([
                'is_active' => $request->boolean('is_active')
            ]);
            return redirect()->route('chart-of-account.index')->with('success', 'Account status updated successfully.');
        }

        // Handle lock toggle from row action dropdown
        if ($request->has('is_locked') && !$request->has('name')) {
            if ($chartOfAccount->isSystemAccount() && !$request->boolean('is_locked')) {
                return redirect()->back()->with('error', 'System accounts cannot be unlocked.');
            }
            $chartOfAccount->update([
                'is_locked' => $request->boolean('is_locked')
            ]);
            $statusText = $chartOfAccount->is_locked ? 'locked' : 'unlocked';
            return redirect()->route('chart-of-account.index')->with('success', "Account {$statusText} successfully.");
        }

        $request->validated();

        $chartOfAccount->update([
            'account_code' => $request->input('account_code'),
            'name' => $request->input('name'),
            'account_type' => $request->input('account_type'),
            'sub_type' => $request->input('sub_type'),
            'description' => $request->input('description'),
            'currency_id' => $request->input('currency_id') ?: \App\Models\Company::current()?->home_currency_id ?: null,
            'parent_id' => $request->input('is_subaccount') ? $request->input('parent_id') : null,
            'is_locked' => $request->boolean('is_locked', false),
        ]);

        return redirect()->route('chart-of-account.index')->with('success', 'Chart of account updated successfully.');
    }

    public function history(Request $request, ChartOfAcc $chartOfAccount)
    {
        $query = \App\Models\Accounting\JournalEntryLine::with(['journalEntry.creator', 'journalEntry.lines.account'])
             ->where('chart_of_acc_id', $chartOfAccount->id)
             ->join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('journal_entries.date', [$request->start_date, $request->end_date]);
        }

        $lines = $query->orderBy('journal_entries.date', 'desc')
             ->select('journal_entry_lines.*')
             ->get();

        $accounts = ChartOfAcc::orderBy('account_code')->get();

        return Inertia::render('Accounting/AccountHistory', [
            'account' => $chartOfAccount,
            'lines' => $lines,
            'accounts' => $accounts,
            'filters' => [
                'start_date' => $request->start_date ?? date('Y-01-01'),
                'end_date' => $request->end_date ?? date('Y-m-d')
            ]
        ]);
    }

    public function destroy(ChartOfAcc $chartOfAccount)
    {
        if ($chartOfAccount->isSystemAccount()) {
            return redirect()->back()->with('error', 'This is a system account and cannot be deleted.');
        }

        if ($chartOfAccount->is_locked) {
            return redirect()->back()->with('error', 'This account is locked and cannot be deleted.');
        }

        $chartOfAccount->delete();

        return redirect()->route('chart-of-account.index')->with('success', 'Chart of account deleted successfully.');
    }
}
