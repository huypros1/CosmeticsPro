<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'min_order_value',
        'max_discount_amount',
        'start_date',
        'end_date',
        'usage_limit',
        'used_count',
        'max_uses_per_user',
        'status',
    ];

    /**
     * Cast kiểu dữ liệu:
     * - dates: Carbon instance để so sánh dễ dàng
     * - numeric: đảm bảo tính toán chính xác
     * - status: string enum ('active' | 'inactive')
     */
    protected $casts = [
        'start_date'          => 'datetime',
        'end_date'            => 'datetime',
        'discount_value'      => 'float',
        'min_order_value'     => 'float',
        'max_discount_amount' => 'float',
        'usage_limit'         => 'integer',
        'used_count'          => 'integer',
        'max_uses_per_user'   => 'integer',
    ];

    /* ──────────────────────────────
     | Relationships
     ────────────────────────────── */

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /* ──────────────────────────────
     | Helper Scopes
     ────────────────────────────── */

    /**
     * Scope: chỉ lấy voucher đang active và trong hạn sử dụng.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                     ->where('start_date', '<=', now())
                     ->where('end_date', '>=', now());
    }

    /* ──────────────────────────────
     | Business Logic Helpers
     ────────────────────────────── */

    /**
     * Tính số tiền được giảm dựa trên tổng đơn hàng.
     *
     * @param  float $orderValue  Tổng tiền đơn hàng (chưa tính phí ship)
     * @return float              Số tiền được giảm thực tế
     */
    public function calculateDiscount(float $orderValue): float
    {
        if ($this->discount_type === 'fixed') {
            // Giảm cố định — không được giảm nhiều hơn tổng đơn
            return min((float) $this->discount_value, $orderValue);
        }

        // Giảm theo phần trăm
        $discount = $orderValue * $this->discount_value / 100;

        // Áp trần max_discount_amount nếu có
        if ($this->max_discount_amount && $discount > $this->max_discount_amount) {
            $discount = $this->max_discount_amount;
        }

        return round($discount, 2);
    }

    /**
     * Kiểm tra voucher còn lượt dùng không.
     */
    public function hasRemainingUsage(): bool
    {
        // Nếu usage_limit = null → không giới hạn
        if (is_null($this->usage_limit)) {
            return true;
        }

        return $this->used_count < $this->usage_limit;
    }
}
