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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->string('status')->default('pending'); // pending, processing, shipped, delivered, cancelled
            $table->decimal('total_amount', 15, 2);
            $table->foreignId('shipping_address_id')->constrained('shipping_addresses')->onDelete('restrict');
            $table->foreignId('voucher_id')->nullable()->constrained('vouchers')->onDelete('set null'); // Nếu xóa voucher, đơn hàng cũ giữ nguyên và cột này nhận giá trị null
            $table->string('payment_method'); // cod, vnpay, momo...
            $table->decimal('shipping_fee', 15, 2)->default(0);
            $table->string('payment_status')->default('unpaid'); // unpaid, paid, refunded
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
