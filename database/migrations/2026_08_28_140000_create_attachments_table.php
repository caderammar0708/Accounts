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
        Schema::create('attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('attachable_id')->nullable()->index();
            $table->string('attachable_type')->nullable()->index();
            $table->string('file_path');
            $table->string('file_name');
            $table->unsignedBigInteger('file_size'); // Size in bytes
            $table->string('mime_type')->nullable();
            $table->foreignUuid('uploaded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['attachable_type', 'attachable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
