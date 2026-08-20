<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Supplier;
use App\Models\Customer;
use App\Models\Employee;

class LookupController extends Controller
{
    /**
     * Unified endpoint to fetch payees (Suppliers, Customers, Employees)
     */
    public function payees(Request $request)
    {
        $search = $request->query('search');
        $requestedType = $request->query('type');

        $query = null;

        if (!$requestedType || $requestedType === 'Supplier') {
            $suppliers = Supplier::select('id', 'display_name as label')
                ->selectRaw("NULL as currency_id")
                ->selectRaw("'Supplier' as type")
                ->when($search, fn($q) => $q->where('display_name', 'like', "%{$search}%"));
            $query = $suppliers;
        }

        if (!$requestedType || $requestedType === 'Customer') {
            $customers = Customer::select('id', 'display_name as label')
                ->selectRaw("NULL as currency_id")
                ->selectRaw("'Customer' as type")
                ->when($search, fn($q) => $q->where('display_name', 'like', "%{$search}%"));
            $query = $query ? $query->union($customers) : $customers;
        }

        if (!$requestedType || $requestedType === 'Employee') {
            $employees = Employee::select('id', 'name as label')
                ->selectRaw("NULL as currency_id")
                ->selectRaw("'Employee' as type")
                ->when($search, fn($q) => $q->where('name', 'like', "%{$search}%"));
            $query = $query ? $query->union($employees) : $employees;
        }

        $payees = $query->orderBy('label')
            ->get()
            ->map(function($p) {
                return [
                    'value' => $p->id,
                    'label' => $p->label,
                    'type' => $p->type,
                    'currency_id' => $p->currency_id
                ];
            });

        return response()->json($payees);
    }

    /**
     * Fetch distinct designations used across employees
     */
    public function designations(Request $request)
    {
        $search = $request->query('search');

        $query = Employee::query()
            ->whereNotNull('designation')
            ->where('designation', '!=', '')
            ->select('designation')
            ->distinct();

        if ($search) {
            $query->where('designation', 'like', "%{$search}%");
        }

        $designations = $query->orderBy('designation')
            ->pluck('designation')
            ->map(function ($d) {
                return [
                    'value' => $d,
                    'label' => $d,
                ];
            });

        return response()->json($designations);
    }

    /**
     * Endpoint to fetch accounts from Chart of Accounts
     */
    public function accounts(Request $request)
    {
        $search = $request->query('search');
        $type = $request->query('type'); // optional: filter by account_type or special bank-only keyword
        $subType = $request->query('sub_type'); // optional: filter by detail type
        $bankOnly = $request->boolean('bank_only') || strtolower((string) $type) === 'bank_only';
        $includeSelectedId = $request->query('include_selected_id');

        $settings = class_exists(\App\Models\CompanySetting::class) ? \App\Models\CompanySetting::current() : null;
        $company = \App\Models\Company::current();
        $homeCurrencyId = $company?->home_currency_id;
        $isMultiCurrency = $company?->multi_currency_enabled;
        
        $homeCurrency = $homeCurrencyId ? \App\Models\Currency::find($homeCurrencyId) : null;
        $homeCurrencyCode = $homeCurrency?->code ?: '';
        $homeCurrencySymbol = $homeCurrency?->symbol ?: '';

        $accounts = \App\Models\Accounting\ChartOfAcc::select('id', 'name', 'account_code', 'balance', 'account_type', 'sub_type', 'currency_id')
            ->withSum('journalLines', 'debit')
            ->withSum('journalLines', 'credit')
            ->with('currency')
            ->when($search, function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('account_code', 'like', "%{$search}%");
            })
            ->when($bankOnly, function($q) {
                $q->where('account_type', 'asset')
                  ->where('sub_type', 'bank');
            })
            ->when(!$bankOnly && $type && strtolower($type) !== 'bank_only', fn($q) => $q->where('account_type', $type))
            ->when(!$bankOnly, fn($q) => $q->when($subType, fn($q2) => $q2->where('sub_type', $subType)))
            ->when($includeSelectedId, function($q) use ($includeSelectedId) {
                $q->orWhere('id', $includeSelectedId);
            })
            ->withSum('journalLines', 'debit')
            ->withSum('journalLines', 'credit')
            ->orderBy('account_code')
            ->get()
            ->map(function($acc) use ($homeCurrencyId, $isMultiCurrency, $homeCurrencyCode, $homeCurrencySymbol) {
                $currencyCode = $acc->currency ? $acc->currency->code : $homeCurrencyCode;
                $currencySymbol = $acc->currency ? $acc->currency->symbol : $homeCurrencySymbol;
                
                $isForeignCurrency = $isMultiCurrency && $acc->currency_id && $acc->currency_id !== $homeCurrencyId;

                return [
                    'value' => $acc->id,
                    'label' => "{$acc->account_code} - {$acc->name}",
                    'balance' => $acc->balance,
                    'account_type' => $acc->account_type,
                    'currency_code' => $currencyCode,
                    'currency_symbol' => $currencySymbol,
                    'is_foreign_currency' => $isForeignCurrency,
                    'currency_id' => $acc->currency_id,
                ];
            });

        return response()->json($accounts);
    }

    public function accountDetails(Request $request)
    {
        $accountId = $request->query('account_id');
        if (!$accountId) {
            return response()->json([ 'error' => 'Account ID is required.' ], 422);
        }

        $account = \App\Models\Accounting\ChartOfAcc::select('id', 'currency_id')->with('currency')->find($accountId);
        if (!$account) {
            return response()->json([ 'error' => 'Account not found.' ], 404);
        }

        $settings = class_exists(\App\Models\CompanySetting::class) ? \App\Models\CompanySetting::current() : null;
        $company = \App\Models\Company::current();
        $homeCurrencyId = $company?->home_currency_id;
        $isMultiCurrency = $company?->multi_currency_enabled;
        
        $homeCurrency = $homeCurrencyId ? \App\Models\Currency::find($homeCurrencyId) : null;
        $currencyCode = $account->currency ? $account->currency->code : ($homeCurrency?->code ?: '');
        $currencySymbol = $account->currency ? $account->currency->symbol : ($homeCurrency?->symbol ?: '');
        
        $isForeignCurrency = $isMultiCurrency && $account->currency_id && $account->currency_id !== $homeCurrencyId;

        return response()->json([
            'is_foreign_currency' => $isForeignCurrency,
            'currency_code' => $currencyCode,
            'currency_symbol' => $currencySymbol,
            'currency_id' => $account->currency_id,
            'flag' => $this->currencyFlagEmoji($currencyCode),
        ]);
    }

    private function currencyFlagEmoji(?string $code): string
    {
        return match ($code) {
            'USD' => '🇺🇸',
            'EUR' => '🇪🇺',
            'INR' => '🇮🇳',
            'GBP' => '🇬🇧',
            'AUD' => '🇦🇺',
            'AED' => '🇦🇪',
            'QAR' => '🇶🇦',
            default => '',
        };
    }

    /**
     * Endpoint to fetch active currencies
     */
    public function currencies(Request $request)
    {
        $currencies = \App\Models\Currency::where('is_active', true)
            ->get(['id', 'code', 'symbol', 'name']);
            
        return response()->json($currencies);
    }

    /**
     * Endpoint to fetch active locations
     */
    public function locations(Request $request)
    {
        $locations = \App\Models\Location::where('is_active', true)
            ->get(['id', 'name', 'code']);
            
        return response()->json($locations);
    }

    /**
     * Endpoint to fetch items (Products/Services)
     */
    public function items(Request $request)
    {
        $search = $request->query('search');

        $items = \App\Models\Item::select('id', 'name', 'sale_price', 'purchase_price', 'description')
            ->when($search, function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->get()
            ->map(function($item) {
                return [
                    'value' => $item->id,
                    'label' => $item->name,
                    'rate' => $item->sale_price,
                    'purchase_price' => $item->purchase_price,
                    'description' => $item->description
                ];
            });

        return response()->json($items);
    }

    /**
     * Endpoint to fetch item categories
     */
    public function categories(Request $request)
    {
        $categories = \App\Models\ItemCategory::select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * Endpoint to get the next account code based on selected account type
     */
    public function nextCode(Request $request)
    {
        $type = $request->query('type', 'asset');

        $defaults = [
            'asset' => 1000,
            'liability' => 2000,
            'equity' => 3000,
            'income' => 4000,
            'expense' => 5000,
        ];

        $defaultCode = $defaults[strtolower($type)] ?? 1000;

        // Fetch all account codes of this type for the active company
        $codes = \App\Models\Accounting\ChartOfAcc::where('account_type', $type)
            ->pluck('account_code');

        $numericCodes = $codes->filter(function($code) {
            return is_numeric($code) && preg_match('/^\d+$/', $code);
        })->map(function($code) {
            return (int)$code;
        });

        $nextCode = $numericCodes->isEmpty() ? $defaultCode : $numericCodes->max() + 1;

        return response()->json([
            'next_code' => (string)$nextCode
        ]);
    }

    /**
     * Endpoint to get the next expense reference number by payment account
     */
    public function nextExpenseRef(Request $request)
    {
        $accountId = $request->query('account_id');
        if (!$accountId) {
            return response()->json(['next_ref' => '1']);
        }

        $last = \App\Models\Accounting\Payment::query()
            ->where('payment_account_id', $accountId)
            ->whereNotNull('reference_no')
            ->whereRaw('reference_no REGEXP "^[0-9]+$"')
            ->orderByRaw('CAST(reference_no AS UNSIGNED) DESC')
            ->first();

        if ($last) {
            $num = (int) $last->reference_no;
            return response()->json(['next_ref' => (string)($num + 1)]);
        }

        return response()->json(['next_ref' => '1']);
    }

    /**
     * Save the last opening balance date to the session.
     */
    public function saveOpeningBalanceDate(Request $request)
    {
        $request->validate([
            'date' => 'required|date'
        ]);

        session(['last_opening_balance_date' => $request->input('date')]);

        return response()->json([
            'success' => true
        ]);
    }

    public function customerInfo(Customer $customer)
    {
        $addressString = $customer->address ?? '';

        return response()->json([
            'email' => $customer->email,
            'billing_address' => $addressString
        ]);
    }

    public function customerInvoices(Customer $customer, Request $request)
    {
        $paymentId = $request->query('receive_payment_id');
        $credit_invoices = \App\Models\Accounting\CreditInvoice::where('customer_id', $customer->id)
            ->where('status', 'posted')
            ->with('journalEntry')
            ->get()
            ->map(function($creditInvoice) use ($paymentId) {
                $query = \App\Models\Accounting\ReceivePaymentAllocation::where('credit_invoice_id', $creditInvoice->id);
                if ($paymentId) {
                    $query->where('receive_payment_id', '!=', $paymentId);
                }
                $allocatedAmount = $query->sum('amount');
                $openBalance = $creditInvoice->total_amount - $allocatedAmount;

                $applied = 0;
                if ($paymentId) {
                    $applied = \App\Models\Accounting\ReceivePaymentAllocation::where('credit_invoice_id', $creditInvoice->id)
                        ->where('receive_payment_id', $paymentId)
                        ->sum('amount');
                }

                return [
                    'id' => $creditInvoice->id,
                    'journal_entry_id' => $creditInvoice->journalEntry?->id,
                    'invoice_no' => $creditInvoice->invoice_no,
                    'invoice_date' => $creditInvoice->invoice_date,
                    'due_date' => $creditInvoice->due_date,
                    'total_amount' => $creditInvoice->total_amount,
                    'open_balance' => $openBalance,
                    'applied' => (float)$applied
                ];
            })
            ->filter(fn($inv) => $inv['open_balance'] > 0.01 || $inv['applied'] > 0.01)
            ->values();

        return response()->json($credit_invoices);
    }

    public function supplierInfo(Supplier $supplier)
    {
        $addressString = $supplier->address ?? '';

        return response()->json([
            'email' => $supplier->email,
            'billing_address' => $addressString
        ]);
    }

    public function supplierBills(Supplier $supplier, Request $request)
    {
        $paymentId = $request->query('receive_payment_id');
        $bills = \App\Models\Accounting\Bill::where('supplier_id', $supplier->id)
            ->where('status', 'posted')
            ->with('journalEntry')
            ->get()
            ->map(function($bill) use ($paymentId) {
                $query = \App\Models\Accounting\BillPaymentAllocation::where('bill_id', $bill->id);
                if ($paymentId) {
                    $query->where('bill_payment_id', '!=', $paymentId);
                }
                $allocatedAmount = $query->sum('amount_applied');
                $openBalance = $bill->total_amount - $allocatedAmount;

                $applied = 0;
                if ($paymentId) {
                    $applied = \App\Models\Accounting\BillPaymentAllocation::where('bill_id', $bill->id)
                        ->where('bill_payment_id', $paymentId)
                        ->sum('amount_applied');
                }

                return [
                    'id' => $bill->id,
                    'journal_entry_id' => $bill->journalEntry?->id,
                    'bill_no' => $bill->bill_no,
                    'bill_date' => $bill->bill_date,
                    'due_date' => $bill->due_date,
                    'total_amount' => $bill->total_amount,
                    'open_balance' => $openBalance,
                    'applied' => (float)$applied
                ];
            })
            ->filter(fn($b) => $b['open_balance'] > 0.01 || $b['applied'] > 0.01)
            ->values();

        return response()->json($bills);
    }

    public function itemCreateOptions()
    {
        $categories = \App\Models\ItemCategory::orderBy('name')->get();
        $incomeAccounts = \App\Models\Accounting\ChartOfAcc::whereIn('account_type', ['income', 'other_income'])->orderBy('account_code')->get();
        $expenseAccounts = \App\Models\Accounting\ChartOfAcc::whereIn('account_type', ['expense', 'cost_of_goods_sold'])->orderBy('account_code')->get();
        $inventoryAccounts = \App\Models\Accounting\ChartOfAcc::whereIn('account_type', ['asset', 'other_current_asset', 'fixed_asset', 'current_asset', 'inventory'])->orderBy('account_code')->get();
        $suppliers = \App\Models\Supplier::orderBy('display_name')->get()
            ->map(fn($s) => ['id' => $s->id, 'name' => $s->display_name]);
        $allItems = \App\Models\Item::where('type', '!=', 'bundle')->orderBy('name')->get();

        return response()->json([
            'categories' => $categories,
            'incomeAccounts' => $incomeAccounts,
            'expenseAccounts' => $expenseAccounts,
            'inventoryAccounts' => $inventoryAccounts,
            'suppliers' => $suppliers,
            'allItems' => $allItems,
        ]);
    }

    /**
     * Endpoint to fetch payment methods
     */
    public function paymentMethods()
    {
        
        $paymentMethods = \App\Models\PaymentMethod::withoutGlobalScopes()
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function($pm) {
                return [
                    'value' => $pm->id,
                    'label' => $pm->name,
                ];
            });

        return response()->json($paymentMethods);
    }

    /**
     * Store last modal URL in session under a namespaced key
     */
    public function storeModalLastUrl(Request $request)
    {
        $request->validate([
            'modalName' => 'required|string',
            'url' => 'required|string'
        ]);

        $key = 'last_modal_url:' . $request->input('modalName');
        session([$key => $request->input('url')]);

        return response()->json(['success' => true]);
    }

    /**
     * Endpoint to fetch vehicles
     */
    public function vehicles(Request $request)
    {
        abort_if(!class_exists(\App\Models\CompanySetting::class) || !(\App\Models\CompanySetting::first()?->vehicles_enabled ?? true), 403, 'Vehicles feature is disabled.');

        $search = $request->query('search');
        
        $vehicles = \App\Models\ServiceStation\Vehicle::with('customer')
            ->when($search, function($query, $search) {
                $query->where('vehicle_no', 'like', "%{$search}%")
                      ->orWhere('brand', 'like', "%{$search}%")
                      ->orWhere('model', 'like', "%{$search}%")
                      ->orWhereHas('customer', function($q) use ($search) {
                          $q->where('display_name', 'like', "%{$search}%");
                      });
            })
            ->orderBy('vehicle_no')
            ->limit(50)
            ->get()
            ->map(function($v) {
                $custName = $v->customer ? $v->customer->display_name : 'No Customer';
                return [
                    'value' => $v->id,
                    'label' => "{$v->vehicle_no} - {$v->brand} {$v->model} ({$custName})",
                    'customer_id' => $v->customer_id,
                ];
            });

        return response()->json($vehicles);
    }
    public function outstandingCheques(Request $request)
    {
        $chequeInHand = \App\Models\Accounting\ChartOfAcc::where('name', 'Cheque in Hand')->first();
        if (!$chequeInHand) {
            return response()->json([]);
        }

        $query = \App\Models\Accounting\ReceivePayment::with('customer')
            ->where('deposit_to_account_id', $chequeInHand->id)
            ->whereNull('cheque_deposit_id')
            ->orderBy('payment_date', 'desc');

        if ($request->has('cheque_deposit_id')) {
            $query->orWhere('cheque_deposit_id', $request->cheque_deposit_id);
        }

        $cheques = $query->get()->map(fn($rp) => [
            'id' => $rp->id,
            'customer_name' => $rp->customer->display_name ?? $rp->customer->company_name ?? 'Unknown',
            'check_date' => $rp->check_date,
            'check_number' => $rp->check_number,
            'reference_no' => $rp->reference_no,
            'amount' => $rp->amount,
            'payment_date' => $rp->payment_date,
        ]);

        return response()->json($cheques);
    }
}
