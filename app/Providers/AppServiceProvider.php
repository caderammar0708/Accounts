<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Module migrations are loaded dynamically via CompanySettingsController.
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') === 'production' || config('app.env') === 'prod') {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);
        \App\Models\Accounting\JournalEntryLine::observe(\App\Observers\JournalEntryLineObserver::class);
        \App\Models\Accounting\JournalEntry::observe(\App\Observers\JournalEntryObserver::class);
        \App\Models\Company::observe(\App\Observers\CompanyObserver::class);
        \App\Models\User::observe(\App\Observers\UserObserver::class);
    }
}
