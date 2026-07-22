<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'status'           => $this->status,
            // Thông tin giao hàng snapshot
            'recipient_name'   => $this->recipient_name,
            'recipient_phone'  => $this->recipient_phone,
            'shipping_address' => $this->shipping_address,
            // Thanh toán
            'payment_method'   => $this->payment_method,
            'payment_status'   => $this->payment_status,
            'shipping_fee'     => $this->shipping_fee,
            'discount_amount'  => $this->discount_amount,
            'total_amount'     => $this->total_amount,
            // Voucher
            'voucher'          => $this->whenLoaded('voucher'),
            // Items
            'items'            => OrderItemResource::collection($this->whenLoaded('order_items')),
            'created_at'       => $this->created_at,
        ];
    }
}
