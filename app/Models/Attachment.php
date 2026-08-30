<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Attachment extends Model
{
    use HasUuids;

    protected $fillable = [
        'attachable_id',
        'attachable_type',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'uploaded_by',
    ];

    protected $appends = [
        'url',
        'download_url',
        'formatted_size',
        'extension',
    ];

    public function attachable(): MorphTo
    {
        return $this->morphTo();
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }

    public function getDownloadUrlAttribute(): string
    {
        return route('attachments.download', $this->id);
    }

    public function getExtensionAttribute(): string
    {
        return strtolower(pathinfo($this->file_name, PATHINFO_EXTENSION));
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->file_size;
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 1) . ' KB';
        }
        return $bytes . ' B';
    }

    protected static function booted()
    {
        static::deleted(function ($attachment) {
            if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
                Storage::disk('public')->delete($attachment->file_path);
            }
        });
    }
}
