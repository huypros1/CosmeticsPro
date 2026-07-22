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
        Schema::table('vouchers', function (Blueprint $table) {
            $table->renameColumn('min_order', 'min_order_value');
            $table->decimal('max_discount_amount', 15, 2)->nullable()->after('min_order_value');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->renameColumn('min_order_value', 'min_order');
            $table->dropColumn('max_discount_amount');
        });
    }
};
