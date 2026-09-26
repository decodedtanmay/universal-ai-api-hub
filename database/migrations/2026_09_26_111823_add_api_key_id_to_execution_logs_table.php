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
        Schema::table('execution_logs', function (Blueprint $table) {
            $table->foreignId('api_key_id')->nullable()->after('connector_id')->constrained('connector_api_keys')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('execution_logs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('api_key_id');
        });
    }
};
