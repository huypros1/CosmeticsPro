<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // SEO Fields
            $table->string('meta_title', 60)->nullable()->after('thumbnail')
                  ->comment('SEO title — tối đa 60 ký tự, để trống sẽ dùng title');
            $table->string('meta_description', 160)->nullable()->after('meta_title')
                  ->comment('SEO description — tối đa 160 ký tự');
            $table->string('meta_keywords', 255)->nullable()->after('meta_description')
                  ->comment('Từ khóa SEO, phân cách bằng dấu phẩy');
            $table->string('canonical_url')->nullable()->after('meta_keywords')
                  ->comment('Canonical URL tùy chỉnh, để trống sẽ tự tạo');
            $table->string('og_image')->nullable()->after('canonical_url')
                  ->comment('Open Graph image riêng cho social share, để trống dùng thumbnail');

            // Content extras
            $table->string('excerpt', 300)->nullable()->after('og_image')
                  ->comment('Tóm tắt ngắn hiển thị ở danh sách');
            $table->integer('reading_time')->nullable()->after('excerpt')
                  ->comment('Thời gian đọc ước tính (phút), tự tính nếu để trống');
            $table->timestamp('published_at')->nullable()->after('reading_time')
                  ->comment('Thời điểm xuất bản thực tế');

            // Make category_post_id nullable (some posts may not have a category)
            $table->unsignedBigInteger('category_post_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn([
                'meta_title', 'meta_description', 'meta_keywords',
                'canonical_url', 'og_image', 'excerpt', 'reading_time', 'published_at',
            ]);
        });
    }
};
