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
            $table->string('status')->default('pending'); // pending, confirmed, processing, shipped, delivered, cancelled

            // Snapshot địa chỉ giao hàng tại thời điểm đặt hàng (không dùng FK để tránh mất dữ liệu khi user sửa địa chỉ)
            $table->string('recipient_name');
            $table->string('recipient_phone', 20);
            $table->string('shipping_address'); // Địa chỉ đầy đủ: số nhà, phường, quận, tỉnh/thành

            $table->foreignId('voucher_id')->nullable()->constrained('vouchers')->onDelete('set null'); // Nếu xóa voucher, đơn hàng cũ giữ nguyên và cột này nhận giá trị null
            $table->decimal('discount_amount', 15, 2)->default(0); // Snapshot số tiền đã giảm thực tế tại thời điểm đặt

            $table->string('payment_method'); // cod, vietqr, vnpay, momo...
            $table->decimal('shipping_fee', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2); // Tổng tiền sau khi trừ discount + cộng shipping_fee
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
