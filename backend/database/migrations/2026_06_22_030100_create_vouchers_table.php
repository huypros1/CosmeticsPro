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
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('discount_type'); // fixed, percentage
            $table->decimal('discount_value', 15, 2);
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->integer('usage_limit')->default(0);
            $table->integer('used_count')->default(0);
            $table->decimal('min_order', 15, 2)->default(0);
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
