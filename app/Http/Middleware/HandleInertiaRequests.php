<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Closure;

class HandleInertiaRequests extends Middleware
{
    /**
     * Prevent browser from caching Inertia JSON responses which causes the raw JSON bug on Back button.
     */
    public function handle(Request $request, Closure $next)
    {
        if ($request->isMethod('GET') && (!$request->ajax() || $request->header('X-Inertia'))) {
            $routeName = $request->route()?->getName();
            
            if ($routeName) {
                $transactionPrefixes = [
                    'sales-invoice.', 'credit-invoice.', 'invoice-return.', 'receive-payment.', 
                    'payment.', 'bill.', 'pay-bill.', 'bill-return.', 'cheque.', 
                    'transfer.', 'bank-deposit.', 'cheque-deposit.', 'inventory-adjustment.'
                ];
                
                $isTransactionForm = false;
                foreach ($transactionPrefixes as $prefix) {
                    if (str_starts_with($routeName, $prefix) && (str_ends_with($routeName, '.create') || str_ends_with($routeName, '.edit'))) {
                        $isTransactionForm = true;
                        break;
                    }
                }

                $isAuthRoute = in_array($routeName, ['login', 'register', 'password.request', 'password.reset']);

                if (!$isTransactionForm && !$isAuthRoute) {
                    $request->session()->put('last_valid_route', $request->fullUrl());
                }
            }
        }

        $response = parent::handle($request, $next);

        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

        return $response;
    }
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user'    => $request->user(),
                'company' => $request->user()?->currentCompany(),
                'pos_layout_enabled'      => class_exists(\App\Models\CompanySetting::class) ? (bool) \App\Models\CompanySetting::first()?->pos_layout_enabled : false,
                'warranties_enabled'      => class_exists(\App\Models\CompanySetting::class) ? (bool) \App\Models\CompanySetting::first()?->warranty_layout_enabled : false,
                'job_enabled'             => class_exists(\App\Models\CompanySetting::class) ? (bool) \App\Models\CompanySetting::first()?->job_layout_enabled : false,
                'customer_layout_modal'      => class_exists(\App\Models\CompanySetting::class) ? (bool) \App\Models\CompanySetting::first()?->customer_layout_modal : false,
                'reports_display_as_buttons' => class_exists(\App\Models\CompanySetting::class) ? ((\App\Models\CompanySetting::first()?->reports_display_as_buttons) ?? true) : true,
                'vehicles_enabled'           => class_exists(\App\Models\CompanySetting::class) ? ((\App\Models\CompanySetting::first()?->vehicles_enabled) ?? true) : true,
                'currency_prefix'         => $request->user()?->currentCompany()?->home_currency_prefix ?? '',
                'financial_year_start_month' => class_exists(\App\Models\CompanySetting::class) ? (\App\Models\CompanySetting::first()?->fin_year_start ?? 'January') : 'January',
                'books_lock_date'         => class_exists(\App\Models\CompanySetting::class) ? (\App\Models\CompanySetting::first()?->books_lock_date) : null,
                'has_books_pin'           => class_exists(\App\Models\CompanySetting::class) ? !empty(\App\Models\CompanySetting::first()?->books_lock_pin) : false,
            ],
            'appName' => config('app.name'),
            'flash' => [
                'success' => fn() => $request->session()->get('success'),
                'error' => fn() => $request->session()->get('error'),
                'warning' => fn() => $request->session()->get('warning'),
                'info' => fn() => $request->session()->get('info'),
                'new_customer' => fn() => $request->session()->get('new_customer'),
                'new_supplier' => fn() => $request->session()->get('new_supplier'),
                'new_employee' => fn() => $request->session()->get('new_employee'),
                'new_account' => fn() => $request->session()->get('new_account'),
                'new_method' => fn() => $request->session()->get('new_method'),
                'journal_entry_id' => fn() => $request->session()->get('journal_entry_id'),
],
        ];
    }
}
