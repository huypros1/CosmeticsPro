<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'description', 'content', 'image',
        'category_id', 'brand_id', 'is_featured', 'status'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        return $this->hasManyThrough(Image::class, ProductVariant::class, 'product_id', 'variant_id');
    }

    /** Ảnh gắn trực tiếp với sản phẩm (không qua variant) */
    public function productImages()
    {
        return $this->hasMany(Image::class)->whereNotNull('product_id')->orderBy('sort_order');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}
