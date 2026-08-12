<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrintSetting extends Model
{
    protected $fillable = [
        'document_type',
        'template_name',
        'is_default',
        'letterhead_image_path',
        'html_template',
        'custom_title',
        'header_alignment',
        'static_footer_content',
        'layout_config',
        'primary_color',
        'text_color',
        'page_setup',
        'block_styles',
    ];

    protected $casts = [
        'layout_config' => 'array',
        'page_setup' => 'array',
        'block_styles' => 'array',
        'is_default' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(\App\Models\Company::class);
    }

    public static function getDefault($documentType)
    {
        return static::where('document_type', $documentType)->where('is_default', true)->first()
            ?? static::where('document_type', $documentType)->first();
    }

    public static function getForPrint($documentType)
    {
        if ($id = request('template_id')) {
            return static::find($id);
        }
        return static::getDefault($documentType);
    }
}
