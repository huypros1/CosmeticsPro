<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'slug', 'content', 'thumbnail',
        'status', 'category_post_id', 'author_id', 'image'
    ];

    public function category()
    {
        return $this->belongsTo(CategoryPost::class, 'category_post_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
