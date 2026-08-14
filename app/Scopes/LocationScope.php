<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class LocationScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $currentLocationId = session('current_location_id');

        if ($currentLocationId) {
            $table = $model->getTable();
            $builder->where(function ($query) use ($table, $currentLocationId) {
                $query->where($table . '.location_id', $currentLocationId)
                      ->orWhereNull($table . '.location_id');
            });
        }
    }
}
