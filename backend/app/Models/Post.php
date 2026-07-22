<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'slug', 'content', 'thumbnail', 'status',
        'category_post_id', 'author_id', 'image',
        // SEO fields
        'meta_title', 'meta_description', 'meta_keywords',
        'canonical_url', 'og_image',
        // Content extras
        'excerpt', 'reading_time', 'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function category()
    {
        return $this->belongsTo(CategoryPost::class, 'category_post_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Tự tính thời gian đọc từ nội dung (dựa trên 200 từ/phút).
     */
    public static function calcReadingTime(?string $content): int
    {
        if (!$content) return 1;
        $wordCount = str_word_count(strip_tags($content));
        return max(1, (int) ceil($wordCount / 200));
    }
}
