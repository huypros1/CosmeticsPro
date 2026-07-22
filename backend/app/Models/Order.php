<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'recipient_name',
        'recipient_phone',
        'shipping_address',
        'voucher_id',
        'discount_amount',
        'payment_method',
        'shipping_fee',
        'total_amount',
        'payment_status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function voucher()
    {
        return $this->belongsTo(Voucher::class);
    }

    public function order_items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
