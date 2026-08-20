<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use App\Models\User;
use Inertia\Inertia;

class SsoController extends Controller
{
    /**
     * Get available SSO companies for the authenticated user
     */
    public function getCompanies(Request $request)
    {
        $user = $request->user();
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
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('SSO Companies Fetch Error: ' . $e->getMessage());
        }

        return response()->json(['companies' => $ssoCompanies]);
    }
    /**
     * Client: Switch to another company
     * User selects a company and we request a token from the auth server.
     */
    public function switchCompany(Request $request)
    {
        $request->validate([
            'target_domain' => 'required|url',
        ]);

        $targetDomain = rtrim($request->target_domain, '/');
        $authServerUrl = config('sso.auth_server_url') ?: env('SSO_AUTH_SERVER_URL', 'https://jbooks.cloud');
        $authServerUrl = rtrim($authServerUrl, '/');
        
        $secret = config('sso.client_secret') ?: env('SSO_CLIENT_SECRET');
        $user = Auth::user();

        // Request a short-lived token from the central auth server
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $secret,
            'Accept' => 'application/json',
        ])->post($authServerUrl . '/api/sso/generate-token', [
            'email' => $user->email,
            'target_domain' => $targetDomain,
        ]);

        if ($response->successful()) {
            $token = $response->json('token');
            return Inertia::location($targetDomain . '/sso/callback?token=' . $token);
        }

        return back()->with('error', 'Failed to generate SSO token.');
    }

    /**
     * Client: Callback from auth server
     * We receive the token, validate it via API, and log the user in.
     */
    public function callback(Request $request)
    {
        $token = $request->query('token');
        if (!$token) {
            abort(400, 'Missing SSO token.');
        }

        $authServerUrl = config('sso.auth_server_url') ?: env('SSO_AUTH_SERVER_URL', 'https://jbooks.cloud');
        $authServerUrl = rtrim($authServerUrl, '/');
        
        $secret = config('sso.client_secret') ?: env('SSO_CLIENT_SECRET');

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $secret,
            'Accept' => 'application/json',
        ])->post($authServerUrl . '/api/sso/validate-token', [
            'token' => $token,
        ]);

        if ($response->successful()) {
            $email = $response->json('email');
            
            // Find the user locally and log them in
            $user = User::where('email', $email)->first();
            if ($user) {
                Auth::login($user);
                return redirect()->route('dashboard');
            } else {
                \Illuminate\Support\Facades\Log::error('SSO Callback Failed: User with email ' . $email . ' not found in local database.');
                return redirect()->route('login')->with('error', 'User not found in this company.');
            }
        }

        \Illuminate\Support\Facades\Log::error('SSO Callback Failed: Validate token API failed with status ' . $response->status() . ' and body ' . $response->body());
        return redirect()->route('login')->with('error', 'Invalid or expired SSO token.');
    }

    /**
     * Iframe auto-login from JobAlign wrapper
     */
    public function autoLogin(\Illuminate\Http\Request $request)
    {
        $email = $request->query('email');
        $time = $request->query('time');
        $hash = $request->query('hash');

        if (!$email || !$time || !$hash) {
            abort(400, 'Missing SSO parameters.');
        }

        if (time() - $time > 300) {
            abort(403, 'SSO link expired.');
        }

        $secret = config('sso.client_secret') ?: env('SSO_CLIENT_SECRET');
        $payload = $email . '|' . $time;
        $expectedHash = hash_hmac('sha256', $payload, $secret);

        if (!hash_equals($expectedHash, $hash)) {
            abort(403, 'Invalid SSO signature.');
        }

        $user = \App\Models\User::where('email', $email)->first();

        if (!$user) {
            abort(403, 'Your account does not exist in the Accounting system.');
        }

        \Illuminate\Support\Facades\Auth::login($user);

        return redirect()->route('dashboard');
    }
}