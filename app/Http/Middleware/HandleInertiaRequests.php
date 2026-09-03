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
                    'transfer.', 'bank-deposit.', 'cheque-deposit.', 'inventory-adjustment.',
                    'journal-entries.'
                ];
                
                $isTransactionForm = ($routeName === 'journal');
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

    public function share(Request $request): array
    {
        $companySetting = class_exists(\App\Models\CompanySetting::class) ? \App\Models\CompanySetting::current() : null;
        $userCompany = $request->user()?->currentCompany();

        $user = $request->user();
        $userData = null;
        if ($user) {
            $userData = array_merge($user->toArray(), [
                'roles' => $user->getRoleNames()->toArray(),
                'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                'is_admin' => $user->hasRole('Admin') || strtolower($user->role ?? '') === 'admin',
            ]);
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user'    => $userData,
                'company' => $userCompany,
                'financial_year_start_month' => $companySetting?->fin_year_start ?? 'January',
                'business_type'           => $companySetting?->business_type ?? 'Normal',
                'currency'                => [
                    'prefix'         => $userCompany?->homeCurrency?->symbol ?? '',
                    'multi_enabled'  => (bool) $userCompany?->multi_currency_enabled,
                    'home_id'        => $userCompany?->home_currency_id,
                ],
                'books_lock_date'         => $companySetting?->books_lock_date,
                'has_books_pin'           => !empty($companySetting?->books_lock_pin),
                'location'                => ($companySetting?->business_type === 'Dealership' || (bool) $companySetting?->branches_enabled) ? [
                    'current_id'          => session('current_location_id'),
                    'current'             => session('current_location_id') === 'all'
                        ? ['id' => 'all', 'name' => 'All Branches', 'code' => 'ALL']
                        : (session('current_location_id') ? \App\Models\Location::find(session('current_location_id')) : null),
                    'is_locked'           => (bool) $request->user()?->location_id,
                ] : null,
                'pos_layout_enabled'      => (bool) $companySetting?->pos_layout_enabled,
                'reports_display_as_buttons' => (bool) ($companySetting?->reports_display_as_buttons ?? true),
                'attachments_enabled'     => (bool) ($companySetting?->attachments_enabled ?? true),
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
