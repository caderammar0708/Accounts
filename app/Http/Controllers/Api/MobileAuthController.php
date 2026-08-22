<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\User;

class MobileAuthController extends Controller
{
    /**
     * Authenticate the mobile app using an SSO token from the Hub
     */
    public function loginSso(Request $request)
    {
        $request->validate([
            'sso_token' => 'required|string',
        ]);

        $authServerUrl = config('sso.auth_server_url') ?: env('SSO_AUTH_SERVER_URL', 'https://jbooks.cloud');
        $authServerUrl = rtrim($authServerUrl, '/');
        $secret = config('sso.client_secret') ?: env('SSO_CLIENT_SECRET');

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $secret,
            'Accept' => 'application/json',
        ])->post($authServerUrl . '/api/sso/validate-token', [
            'token' => $request->sso_token,
        ]);

        if ($response->successful()) {
            $email = $response->json('email');
            
            $user = User::where('email', $email)->first();
            if ($user) {
                if (!$user->mobile_access) {
                    return response()->json(['error' => 'Mobile access is disabled for your account on this domain.'], 403);
                }

                $token = $user->createToken('mobile-app-token')->plainTextToken;
                
                $company = \App\Models\Company::with('homeCurrency')->first();
                $currencySymbol = $company && $company->homeCurrency ? $company->homeCurrency->symbol : '$';

                return response()->json([
                    'token' => $token,
                    'user' => $user,
                    'currency_symbol' => $currencySymbol
                ]);
            } else {
                return response()->json(['error' => 'User not found in this domain.'], 404);
            }
        }

        return response()->json(['error' => 'Invalid or expired SSO token.'], 401);
    }

    /**
     * Check access for an already authenticated mobile user
     */
    public function checkAccess(Request $request)
    {
        $user = $request->user();
        if (!$user->mobile_access) {
            // Revoke current token
            $user->currentAccessToken()->delete();
            return response()->json(['error' => 'Mobile access disabled.'], 403);
        }

        return response()->json(['message' => 'Access granted.', 'user' => $user]);
    }
}
