<?php

namespace App\Services;

use App\Models\CompanySetting;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class BooksLockService
{
    /**
     * Check if a transaction date is locked and if the provided PIN is valid.
     * Throws a ValidationException if locked and unauthorized.
     *
     * @param string|Carbon $date The date of the transaction
     * @param string|null $providedPin The PIN provided by the user to bypass the lock
     * @throws ValidationException
     */
    public static function check($date, ?string $providedPin = null): void
    {
        $settings = CompanySetting::first();
        if (!$settings || !$settings->books_lock_date) {
            return; // No lock active
        }

        $transactionDate = Carbon::parse($date)->startOfDay();
        $lockDate = Carbon::parse($settings->books_lock_date)->startOfDay();

        if ($transactionDate->lte($lockDate)) {
            if (!$settings->books_lock_pin) {
                throw ValidationException::withMessages([
                    "books_pin" => "This transaction is on or before the books lock date and cannot be modified."
                ]);
            }

            if (!$providedPin) {
                throw ValidationException::withMessages([
                    "books_pin" => "BOOKS_LOCKED_PIN_REQUIRED"
                ]);
            }

            if (!Hash::check($providedPin, $settings->books_lock_pin)) {
                throw ValidationException::withMessages([
                    "books_pin" => "The provided PIN is incorrect."
                ]);
            }
        }
    }
}
