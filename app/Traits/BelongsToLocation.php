<?php

namespace App\Traits;

use App\Models\Location;
use App\Scopes\LocationScope;

trait BelongsToLocation
{
    /**
     * Boot the BelongsToLocation trait for a model.
     */
    public static function bootBelongsToLocation(): void
    {
        static::addGlobalScope(new LocationScope());

        static::creating(function ($model) {
            if (!$model->location_id && session()->has('current_location_id')) {
                $model->location_id = session('current_location_id');
            }
        });
    }

    /**
     * Relationship to the Location model.
     */
    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}
