<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Tenant;
use App\Models\Company;

class User extends Authenticatable
{
    use HasFactory, Notifiable, \Illuminate\Database\Eloquent\Concerns\HasUuids;

    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     *
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'is_active',
        'hire_date',
        'manager_id',
        'invite_token',
        'invite_expires_at',
        'is_invited',
        'location_id',
        'mobile_access',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'invite_expires_at' => 'datetime',
        'is_invited' => 'boolean',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
    ];

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function employees()
    {
        return $this->hasMany(User::class, 'manager_id');
    }

    public function currentCompany()
    {
        return Company::current();
    }
}
