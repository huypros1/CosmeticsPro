<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'status', 'total_amount', 'shipping_address_id',
        'voucher_id', 'payment_method', 'shipping_fee', 'payment_status'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shipping_address()
    {
        return $this->belongsTo(ShippingAddress::class);
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
