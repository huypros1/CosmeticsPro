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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade'); // Xóa đơn hàng (nếu có lệnh xóa) thì xóa luôn item đơn đó
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('restrict'); // Chặn xóa biến thể nếu biến thể đó đã nằm trong đơn hàng của khách
            $table->integer('quantity');
            $table->decimal('price', 15, 2); // Snapshot giá thực tế lúc mua
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
