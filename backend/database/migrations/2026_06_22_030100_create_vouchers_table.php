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
            $table->string('description')->nullable(); // Mô tả ngắn về voucher
            $table->string('discount_type'); // fixed, percent
            $table->decimal('discount_value', 15, 2);
            $table->decimal('min_order_value', 15, 2)->default(0); // Giá trị đơn hàng tối thiểu để áp dụng
            $table->decimal('max_discount_amount', 15, 2)->nullable(); // Mức giảm tối đa (dùng khi discount_type = percent)
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->integer('usage_limit')->default(0); // 0 = không giới hạn tổng lượt dùng
            $table->integer('used_count')->default(0); // Tổng số lần đã dùng
            $table->integer('max_uses_per_user')->default(1); // Mỗi user tối đa dùng N lần (1 = chỉ dùng 1 lần)
            $table->string('status')->default('active'); // active, inactive
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
