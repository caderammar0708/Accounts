<?php

namespace App\Models;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    public static function current()
    {
        return once(fn() => \Illuminate\Support\Facades\Cache::rememberForever(
            'active_company_' . \Illuminate\Support\Facades\DB::connection()->getDatabaseName(),
            fn() => self::with('homeCurrency')->first()
        ));
    }

    protected static function booted()
    {
        static::saved(function ($company) {
            \Illuminate\Support\Facades\Cache::forget('active_company_' . \Illuminate\Support\Facades\DB::connection()->getDatabaseName());
        });
    }

    protected $fillable = [
        'company_name',
        'company_email',
        'phone',
        'address',
        'website',
        'industry',
        'logo_path',
        'legal_name',
        'tax_id',
        'business_type',
        'legal_address',
        'multi_currency_enabled',
        'home_currency_id',
    ];
    
    protected $casts = [
        'multi_currency_enabled' => 'boolean',
    ];
    

    protected $appends = ['logo_url', 'slug', 'home_currency_prefix'];

    public function getLogoUrlAttribute()
    {
        return $this->logo_path ? Storage::disk('public')->url($this->logo_path) : null;
    }

    public function getSlugAttribute()
    {
        return Str::slug($this->company_name);
    }

    public function getHomeCurrencyPrefixAttribute()
    {
        return $this->homeCurrency?->symbol ?? null;
    }

    public function homeCurrency()
    {
        return $this->belongsTo(Currency::class, 'home_currency_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }

    public function journalEntries()
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function suppliers()
    {
        return $this->hasMany(Supplier::class);
    }
}
