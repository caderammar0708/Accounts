<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        
        // Fetch SSO companies from Auth Server (without cache during debugging)
        $ssoCompanies = [];
        try {
            $authServerUrl = config('sso.auth_server_url') ?: env('SSO_AUTH_SERVER_URL', 'https://jbooks.cloud');
            $authServerUrl = rtrim($authServerUrl, '/');
            
            $secret = config('sso.client_secret') ?: env('SSO_CLIENT_SECRET');
            
            if (!empty($secret)) {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $secret,
                    'Accept' => 'application/json',
                    'Connection' => 'keep-alive',
                ])->post($authServerUrl . '/api/sso/user-companies', [
                    'email' => $user->email,
                ]);

                if ($response->successful()) {
                    $ssoCompanies = $response->json('companies') ?? [];
                    $currentHost = request()->getHost();
                    $ssoCompanies = array_filter($ssoCompanies, function($company) use ($currentHost) {
                        $domain = $company['domain'] ?? '';
                        $parsedHost = parse_url((str_starts_with($domain, 'http') ? '' : 'https://') . $domain, PHP_URL_HOST);
                        return $parsedHost !== $currentHost && $domain !== $currentHost;
                    });
                    $ssoCompanies = array_values($ssoCompanies);
                } else {
                    \Illuminate\Support\Facades\Log::error('SSO fetch failed with status ' . $response->status() . ': ' . $response->body());
                }
            } else {
                \Illuminate\Support\Facades\Log::error('SSO Client Secret is empty. Cannot fetch companies.');
            }
        } catch (\Illuminate\Validation\ValidationException $e) { throw $e; } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('SSO Companies Fetch Error: ' . $e->getMessage());
        }

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'sso_companies' => $ssoCompanies,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
