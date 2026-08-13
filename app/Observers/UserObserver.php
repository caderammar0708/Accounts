<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UserObserver
{
    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        $this->syncWithHub($user, 'updated');
    }

    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        $this->syncWithHub($user, 'created');
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        $this->syncWithHub($user, 'deleted');
    }

    private function syncWithHub(User $user, string $action)
    {
        try {
            $authServerUrl = rtrim(config('sso.auth_server_url'), '/');
            $secret = config('sso.client_secret');

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $secret,
                'Accept' => 'application/json',
            ])->post($authServerUrl . '/api/sync/user', [
                'action' => $action,
                'email' => $user->email,
                'name' => $user->name,
                'company_id' => $user->currentCompany()?->id ?? null,
                'domain' => request()->getHost(),
            ]);

            if ($response->failed()) {
                Log::error('Failed to sync user to central hub (HTTP ' . $response->status() . '): ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('Failed to sync user to central hub (Exception): ' . $e->getMessage());
        }
    }
}
