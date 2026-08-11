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
        $companySetting = class_exists(\App\Models\CompanySetting::class) ? \App\Models\CompanySetting::current() : null;
        $userCompany = $request->user()?->currentCompany();

        return [
            ...parent::share($request),
            'auth' => [
                'user'    => $request->user(),
                'company' => $userCompany,
                'pos_layout_enabled'      => (bool) $companySetting?->pos_layout_enabled,
                'warranties_enabled'      => (bool) $companySetting?->warranty_layout_enabled,
                'job_enabled'             => (bool) $companySetting?->job_layout_enabled,
                'customer_layout_modal'      => (bool) $companySetting?->customer_layout_modal,
                'reports_display_as_buttons' => $companySetting?->reports_display_as_buttons ?? true,
                'vehicles_enabled'           => $companySetting?->vehicles_enabled ?? true,
                'currency_prefix'         => $companySetting?->homeCurrency?->symbol ?? $userCompany?->home_currency_prefix ?? 'Rs.',
                'financial_year_start_month' => $companySetting?->fin_year_start ?? 'January',
                'multi_currency_enabled' => (bool) $companySetting?->multi_currency_enabled,
                'home_currency_id' => $companySetting?->home_currency_id,
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
