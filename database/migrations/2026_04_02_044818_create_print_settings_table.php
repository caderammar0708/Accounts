<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('print_settings')) {
            Schema::create('print_settings', function (Blueprint $table) {
                $table->id();
                $table->uuid('company_id')->nullable();
                $table->string('document_type'); // e.g. 'invoice', 'bill'
                $table->string('template_name')->nullable();
                $table->boolean('is_default')->default(false);
                $table->string('custom_title')->nullable();
                $table->string('header_alignment')->default('left');
                $table->text('static_footer_content')->nullable();
                $table->string('letterhead_image_path')->nullable();
                $table->json('layout_config')->nullable();
                $table->string('primary_color')->nullable();
                $table->string('text_color')->nullable();
                $table->json('page_setup')->nullable();
                $table->json('block_styles')->nullable();
                $table->longText('html_template')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('print_settings');
    }
};
