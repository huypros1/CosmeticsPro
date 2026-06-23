<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['product_id', 'capacity_id', 'price', 'sale_price', 'stock'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function capacity()
    {
        return $this->belongsTo(Capacity::class);
    }

    public function images()
    {
        return $this->hasMany(Image::class, 'variant_id');
    }
}
