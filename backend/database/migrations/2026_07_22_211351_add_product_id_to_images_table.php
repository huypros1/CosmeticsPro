<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('images', function (Blueprint $table) {
            // Cho phép ảnh gắn với sản phẩm (không nhất thiết phải có variant)
            $table->unsignedBigInteger('product_id')->nullable()->after('id');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');

            // Cho variant_id nullable để ảnh sản phẩm chung không cần variant
            $table->unsignedBigInteger('variant_id')->nullable()->change();

            // Thứ tự hiển thị
            $table->unsignedSmallInteger('sort_order')->default(0)->after('url');
        });
    }

    public function down(): void
    {
        Schema::table('images', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropColumn(['product_id', 'sort_order']);
        });
    }
};
