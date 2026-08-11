<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Load all module migrations automatically
        $modulesPath = database_path('migrations/modules');
        if (is_dir($modulesPath)) {
            $directories = glob($modulesPath . '/*', GLOB_ONLYDIR);
            $this->loadMigrationsFrom($directories);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        \App\Models\Accounting\JournalEntryLine::observe(\App\Observers\JournalEntryLineObserver::class);
        \App\Models\Accounting\JournalEntry::observe(\App\Observers\JournalEntryObserver::class);
        \App\Models\Company::observe(\App\Observers\CompanyObserver::class);
        \App\Models\User::observe(\App\Observers\UserObserver::class);
    }
}
