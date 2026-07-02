<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FlashSale extends Model
{
    protected $fillable = ['name', 'start_time', 'end_time', 'status'];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time'   => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(FlashSaleItem::class);
    }

    // Scope: flash sale đang diễn ra
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                     ->where('start_time', '<=', now())
                     ->where('end_time', '>=', now());
    }
}
