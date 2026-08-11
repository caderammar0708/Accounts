<?php

namespace App\Observers;

use App\Models\Company;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CompanyObserver
{
    /**
     * Handle the Company "updated" event.
     */
    public function updated(Company $company): void
    {
        // Removed as per request: when company name change not need to change sync
        // $this->syncWithHub($company, 'updated');
    }

    /**
     * Handle the Company "created" event.
     */
    public function created(Company $company): void
    {
        $this->syncWithHub($company, 'created');
    }

    private function syncWithHub(Company $company, string $action)
    {
        try {
            $authServerUrl = rtrim(config('sso.auth_server_url'), '/');
            $secret = config('sso.client_secret');

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secret,
                'Accept' => 'application/json',
            ])->post($authServerUrl . '/api/sync/company', [
                'action' => $action,
                'company_id' => $company->id,
                'name' => $company->company_name, // Fixed: use company_name instead of name
                'domain' => request()->getHost(), // or store domain locally
            ]);

            if ($response->failed()) {
                Log::error('Failed to sync company to central hub (HTTP ' . $response->status() . '): ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Failed to sync company to central hub: ' . $e->getMessage());
        }
    }
}
