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
        Schema::table('print_settings', function (Blueprint $table) {
            $table->string('template_name')->nullable()->after('document_type');
            $table->boolean('is_default')->default(false)->after('template_name');
            $table->string('letterhead_image_path')->nullable()->after('static_footer_content');
            $table->longText('html_template')->nullable()->after('block_styles');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('print_settings', function (Blueprint $table) {
            $table->dropColumn(['template_name', 'is_default', 'letterhead_image_path', 'html_template']);
        });
    }
};
