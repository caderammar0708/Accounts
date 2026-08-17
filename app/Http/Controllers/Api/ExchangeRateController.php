<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ExchangeRate;
use Illuminate\Support\Facades\Http;

class ExchangeRateController extends Controller
{
    /**
     * Get the exchange rate for a specific date.
     * Uses cached DB rate if available, otherwise fetches from API.
     */
    public function getRate(Request $request)
    {
        $request->validate([
            'base' => 'required|string|size:3',
            'quote' => 'required|string|size:3',
            'date' => 'nullable|date'
        ]);

        $base = strtoupper($request->query('base'));
        $quote = strtoupper($request->query('quote'));
        $date = $request->query('date') ?? now()->format('Y-m-d');
        $provider = 'CBSL'; 

        // 1. Check Database cache
        $cachedRate = ExchangeRate::where('base_currency', $base)
            ->where('quote_currency', $quote)
            ->where('date', $date)
            ->where('provider', $provider)
            ->first();

        if ($cachedRate) {
            return response()->json([
                'source' => 'cache',
                'date' => $date,
                'base' => $base,
                'quote' => $quote,
                'rate' => (float)$cachedRate->rate
            ]);
        }

        // 2. Fetch from external API
        $url = "https://api.frankfurter.dev/v2/rate/{$base}/{$quote}?providers={$provider}";
        
        try {
            $response = Http::timeout(10)->get($url);
            
            if ($response->successful()) {
                $data = $response->json();
                
                $rate = null;
                $apiDate = $date;
                
                if (isset($data['rate'])) {
                    $rate = $data['rate'];
                    $apiDate = $data['date'] ?? $date;
                } elseif (isset($data['rates'][$quote])) {
                    $rate = $data['rates'][$quote];
                    $apiDate = $data['date'] ?? $date;
                }
                
                if ($rate) {
                    ExchangeRate::updateOrCreate([
                        'base_currency' => $base,
                        'quote_currency' => $quote,
                        'date' => $apiDate,
                        'provider' => $provider
                    ], [
                        'rate' => $rate
                    ]);
                    
                    return response()->json([
                        'source' => 'api',
                        'date' => $apiDate,
                        'base' => $base,
                        'quote' => $quote,
                        'rate' => (float)$rate
                    ]);
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Exchange Rate API Error: ' . $e->getMessage());
        }
        
        return response()->json([
            'error' => 'Unable to fetch exchange rate'
        ], 500);
    }
}
