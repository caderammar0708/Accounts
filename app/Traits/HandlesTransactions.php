<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;
use Throwable;

trait HandlesTransactions
{
    /**
     * Run the given callback within a database transaction.
     *
     * @param \Closure $callback
     * @return mixed
     * @throws \Throwable
     */
    public function withTransaction(\Closure $callback)
    {
        try {
            return DB::transaction(fn () => $callback());
        } catch (Throwable $e) {
            throw $e;
        }
    }
}
