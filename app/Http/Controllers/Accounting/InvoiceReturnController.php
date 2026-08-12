<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use App\Models\Accounting\InvoiceReturn;
use App\Models\Accounting\InvoiceReturnItem;
use App\Models\Customer;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Item;
use App\Http\Requests\Accounting\InvoiceReturnRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class InvoiceReturnController extends Controller
{
    use \App\Traits\AccountingControllerTrait;
    public function create(Request $request)
    {
        if ($copyId = $request->query('copy')) {
            $journalEntry = JournalEntry::findOrFail($copyId);
            $invoiceReturn = InvoiceReturn::find($journalEntry->transactionable_id);

            if (!$invoiceReturn) {
                abort(404, 'InvoiceReturn not found');
            }

            $invoiceReturn->load('items');

            $invoiceReturnData = [
                'id' => null,
                'customer' => $invoiceReturn->customer_id,
                'prefix' => $invoiceReturn->prefix ?? '',
                'email' => $invoiceReturn->email,
                'date' => $invoiceReturn->credit_note_date,
                'ref' => $this->getNextNo(),
                'memo' => $invoiceReturn->memo,
                'statementMessage' => $invoiceReturn->statement_message,
                'items' => $invoiceReturn->items->map(function ($item) {
                    return [
                        'product' => $item->item_id,
                        'description' => $item->description,
                        'qty' => $item->quantity,
                        'rate' => number_format($item->rate, 2, '.', ''),
                        'amount' => number_format($item->amount, 2, '.', ''),
                    ];
                })->toArray(),
            ];

            return Inertia::render('Transaction/InvoiceReturn/InvoiceReturnForm', [
                'invoiceReturn' => $invoiceReturnData,
                'nextRef' => $this->getNextNo(),
            ]);
        }

        return Inertia::render('Transaction/InvoiceReturn/InvoiceReturnForm', [
            'nextRef' => $this->getNextNo()
        ]);
    }

    public function store(InvoiceReturnRequest $request)
    {
        $validated = $request->validated();
        $this->checkBooksLock($request->date, $request->books_pin);

        try {
            $journalEntry = DB::transaction(function() use ($request) {
                $totalAmount = collect($request->items)->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                });

                // 1. Business Details
                $invoiceReturn = InvoiceReturn::create([
                    'customer_id' => $request->customer,
                    'email' => $request->email,
                    'date' => $request->date,
                    'total_amount' => $totalAmount,
                    'memo' => $request->memo,
                    'statement_message' => $request->statementMessage,
                    'status' => 'posted',
                    'prefix' => $request->prefix,
                ]);

                foreach ($request->items as $itemData) {
                    InvoiceReturnItem::create([
                        'invoice_return_id' => $invoiceReturn->id,
                        'item_id' => $itemData['product'],
                        'description' => $itemData['description'] ?? '',
                        'quantity' => $itemData['qty'] ?? 1,
                        'rate' => $itemData['rate'] ?? 0,
                        'amount' => (float) str_replace(',', '', $itemData['amount']),
                    ]);

                    $itemModel = \App\Models\Item::find($itemData['product']);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $qty = (float) str_replace(',', '', $itemData['qty'] ?? 1);
                        $itemModel->increment('quantity_on_hand', $qty);
                    }
                }

                // 2. Financial Truth (Journal Entry)
                $journalEntry = JournalEntry::create([
                    'date' => $request->date,
                    'reference' => $request->reference,
                    'description' => $request->memo,
                    'transaction_type' => 'invoice_return',
                    'payee_id' => $request->customer,
                    'payee_type' => Customer::class,
                    'total_amount' => $totalAmount,
                    'status' => 'posted',
                    'created_by' => Auth::id(),
                    'transactionable_id' => $invoiceReturn->id,
                    'transactionable_type' => InvoiceReturn::class,
                ]);

                // Credit Accounts Receivable (Reduce balance)
                $arAccount = ChartOfAcc::getOrCreateDefault('accounts-receivable');
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $arAccount->id,
                    'debit' => 0,
                    'credit' => $totalAmount,
                    'memo' => $request->memo,
                ]);

                // Debit Income / Returns account
                foreach ($request->items as $itemData) {
                    $itemModel = Item::find($itemData['product']);
                    $incomeAccount = $itemModel?->income_account_id ?? (ChartOfAcc::where('account_type', 'income')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-income')->id);

                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $incomeAccount,
                        'debit' => (float) str_replace(',', '', $itemData['amount']),
                        'credit' => 0,
                        'memo' => $itemData['description'] ?? $request->memo,
                    ]);
                }

                return $journalEntry;
            });

            $action = $request->input('action', 'save');
            if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'InvoiceReturn saved successfully.'); }

            if ($action === 'new') {
                return redirect()->route('invoice-return.create')->with('success', 'InvoiceReturn saved successfully.');
            }

            return redirect()->route('invoice-return.edit', $journalEntry->id)->with('success', 'InvoiceReturn saved successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function edit(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $invoiceReturn = InvoiceReturn::find($journalEntry->transactionable_id);

        if (!$invoiceReturn) {
            abort(404, 'InvoiceReturn not found');
        }

        $invoiceReturn->load('items');

        $invoiceReturnData = [
            'id' => $journalEntry->id,
            'customer' => $invoiceReturn->customer_id,
            'prefix' => $invoiceReturn->prefix ?? '',
            'email' => $invoiceReturn->email,
            'date' => $invoiceReturn->date,
            'reference' => $journalEntry->reference,
            'memo' => $invoiceReturn->memo,
            'statementMessage' => $invoiceReturn->statement_message,
            'items' => $invoiceReturn->items->map(function ($item) {
                return [
                    'product' => $item->item_id,
                    'description' => $item->description,
                    'qty' => $item->quantity,
                    'rate' => number_format($item->rate, 2, '.', ''),
                    'amount' => number_format($item->amount, 2, '.', ''),
                ];
            })->toArray(),
        ];

        return Inertia::render('Transaction/InvoiceReturn/InvoiceReturnForm', [
            'invoiceReturn' => $invoiceReturnData,
            'nextRef' => $this->getNextNo()
        ]);
    }

    public function update(InvoiceReturnRequest $request, JournalEntry $journalEntry)
    {
        $validated = $request->validated();
        $this->checkBooksLock($journalEntry->date, $request->books_pin);
        $this->checkBooksLock($request->date, $request->books_pin);

        try {
            DB::transaction(function() use ($request, $journalEntry) {
                $totalAmount = collect($request->items)->sum(function($item) {
                    return (float) str_replace(',', '', $item['amount']);
                });

                // 1. Update Business Details
                $invoiceReturn = InvoiceReturn::findOrFail($journalEntry->transactionable_id);
                $invoiceReturn->update([
                    'customer_id' => $request->customer,
                    'email' => $request->email,
                    'date' => $request->date,
                    'total_amount' => $totalAmount,
                    'memo' => $request->memo,
                    'statement_message' => $request->statementMessage,
                    'prefix' => $request->prefix,
                ]);

                // Recreate items
                foreach ($invoiceReturn->items as $oldItem) {
                    $itemModel = \App\Models\Item::find($oldItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->decrement('quantity_on_hand', $oldItem->quantity);
                    }
                }
                $invoiceReturn->items()->delete();
                foreach ($request->items as $itemData) {
                    InvoiceReturnItem::create([
                        'invoice_return_id' => $invoiceReturn->id,
                        'item_id' => $itemData['product'],
                        'description' => $itemData['description'] ?? '',
                        'quantity' => $itemData['qty'] ?? 1,
                        'rate' => $itemData['rate'] ?? 0,
                        'amount' => (float) str_replace(',', '', $itemData['amount']),
                    ]);

                    $itemModel = \App\Models\Item::find($itemData['product']);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $qty = (float) str_replace(',', '', $itemData['qty'] ?? 1);
                        $itemModel->increment('quantity_on_hand', $qty);
                    }
                }

                // 2. Update Financial Truth (Journal Entry)
                $journalEntry->update([
                    'date' => $request->date,
                    'reference' => $request->reference,
                    'description' => $request->memo,
                    'payee_id' => $request->customer,
                    'total_amount' => $totalAmount,
                ]);

                // Recreate lines
                $journalEntry->lines->each->delete();

                // Credit Accounts Receivable (Reduce balance)
                $arAccount = ChartOfAcc::getOrCreateDefault('accounts-receivable');
                JournalEntryLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_acc_id' => $arAccount->id,
                    'debit' => 0,
                    'credit' => $totalAmount,
                    'memo' => $request->memo,
                ]);

                // Debit Income / Returns account
                foreach ($request->items as $itemData) {
                    $itemModel = Item::find($itemData['product']);
                    $incomeAccount = $itemModel?->income_account_id ?? (ChartOfAcc::where('account_type', 'income')->first()?->id ?? ChartOfAcc::getOrCreateDefault('uncategorized-income')->id);

                    JournalEntryLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_acc_id' => $incomeAccount,
                        'debit' => (float) str_replace(',', '', $itemData['amount']),
                        'credit' => 0,
                        'memo' => $itemData['description'] ?? $request->memo,
                    ]);
                }
            });

            $action = $request->input('action', 'save');
            if ($action === 'close') { $lastValidRoute = session('last_valid_route', route('dashboard')); return redirect()->to($lastValidRoute)->with('success', 'InvoiceReturn updated successfully.'); } elseif ($action === 'new') {
                return redirect()->route('invoice-return')->with('success', 'InvoiceReturn updated successfully.');
            }

            return redirect()->route('invoice-return.edit', $journalEntry->id)->with('success', 'InvoiceReturn updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(JournalEntry $journalEntry)
    {
        $this->checkBooksLock($journalEntry->date, request()->input('books_pin'));
        $chartOfAccountId = $journalEntry->lines->first()?->chart_of_acc_id 
            ?? $journalEntry->lines->first()?->chart_of_account_id 
            ?? $journalEntry->lines->first()?->account_id;

        DB::transaction(function () use ($journalEntry) {
            $invoiceReturn = InvoiceReturn::find($journalEntry->transactionable_id);

            if ($invoiceReturn) {
                foreach ($invoiceReturn->items as $oldItem) {
                    $itemModel = \App\Models\Item::find($oldItem->item_id);
                    if ($itemModel && $itemModel->type === 'inventory') {
                        $itemModel->decrement('quantity_on_hand', $oldItem->quantity);
                    }
                }
                $invoiceReturn->items()->delete();
                $invoiceReturn->delete();
            }

            $journalEntry->lines->each->delete();
            $journalEntry->delete();
        });
        if ($chartOfAccountId) {
            return redirect()->route('chart-of-account.history', ['chart_of_account' => $chartOfAccountId])
                ->with('success', 'InvoiceReturn deleted successfully.');
        }

        return redirect()->route('chart-of-account.index')
            ->with('success', 'InvoiceReturn deleted successfully.');
    }

    public function print(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines');
        $invoiceReturn = InvoiceReturn::with('items.item', 'customer', 'company')->findOrFail($journalEntry->transactionable_id);
        $company = $invoiceReturn->company ?? \App\Models\Company::current();

        $tableItems = [];
        foreach ($invoiceReturn->items as $item) {
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

        $printSetting = \App\Models\PrintSetting::getForPrint('invoice_return');

        return view('print.document', [
            'printSetting' => $printSetting,
            'title' => $printSetting?->custom_title ?: 'Credit Note',
            'headerAlignment' => $printSetting?->header_alignment ?: 'left',
            'staticFooterContent' => $printSetting?->static_footer_content ?: null,
            'layoutConfig' => $printSetting?->layout_config,
            'primaryColor' => $printSetting?->primary_color,
            'textColor' => $printSetting?->text_color,
            'pageSetup' => $printSetting?->page_setup,
            'blockStyles' => $printSetting?->block_styles,
            'documentNo' => $journalEntry->reference,
            'date' => $invoiceReturn->date,
            'dueDate' => null,
            'partyLabel' => 'Credit To',
            'partyName' => $invoiceReturn->customer->display_name ?? $invoiceReturn->customer->company_name,
            'partyAddress' => '',
            'partyEmail' => $invoiceReturn->email ?? '',
            'tableHeaders' => ['Description', 'Qty', 'Rate', 'Amount'],
            'tableItems' => $tableItems,
            'totalAmount' => $invoiceReturn->total_amount,
            'memo' => $invoiceReturn->memo,
            'statementMessage' => $invoiceReturn->statement_message,
            'company' => $company,
        ]);
    }

    private function getNextNo()
    {
        $last = InvoiceReturn::query()->latest()->first();
        return $last ? (int)$last->reference + 1 : 1001;
    }
}
