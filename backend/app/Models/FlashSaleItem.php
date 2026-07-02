<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FlashSaleItem extends Model
{
    protected $fillable = [
        'flash_sale_id', 'product_id', 'product_variant_id',
        'sale_price', 'quantity', 'sold',
    ];

    public function flashSale()
    {
        return $this->belongsTo(FlashSale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class)->with(['variants.capacity', 'variants.images']);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id')->with(['capacity', 'images']);
    }
}
