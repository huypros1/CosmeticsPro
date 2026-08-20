<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use App\Models\Order;
use Illuminate\Http\Request;
use Carbon\Carbon;

class VoucherController extends Controller
{
    /**
     * API: POST /vouchers/validate
     * Kiểm tra và tính toán mã giảm giá cho user tại trang checkout.
     *
     * Request body:
     *   - code        (string)  : Mã voucher (vd: SALE50)
     *   - order_value (numeric) : Tổng tiền giỏ hàng (subtotal, chưa phí ship)
     */
    public function validateVoucher(Request $request)
    {
        $request->validate([
            'code'        => 'required|string|max:50',
            'order_value' => 'required|numeric|min:0',
        ]);

        $orderValue = (float) $request->order_value;

        /* ────────────────────────────────────────────────────────────
         | BƯỚC 1: Tìm voucher — Mã có tồn tại không?
         ──────────────────────────────────────────────────────────── */
        $voucher = Voucher::where('code', strtoupper(trim($request->code)))->first();

        if (!$voucher) {
            return response()->json([
                'message' => 'Mã giảm giá không tồn tại.',
            ], 404);
        }

        /* ────────────────────────────────────────────────────────────
         | BƯỚC 2: Kiểm tra trạng thái — status có phải 'active' không?
         ──────────────────────────────────────────────────────────── */
        if ($voucher->status !== 'active') {
            return response()->json([
                'message' => 'Mã giảm giá hiện không hoạt động.',
            ], 400);
        }

        /* ────────────────────────────────────────────────────────────
         | BƯỚC 3: Kiểm tra thời hạn — start_date <= now <= end_date
         ──────────────────────────────────────────────────────────── */
        $now = Carbon::now();

        if ($voucher->start_date && $now->lt($voucher->start_date)) {
            return response()->json([
                'message' => 'Mã giảm giá chưa đến ngày có hiệu lực.',
            ], 400);
        }

        if ($voucher->end_date && $now->gt($voucher->end_date)) {
            return response()->json([
                'message' => 'Mã giảm giá đã hết hạn sử dụng.',
            ], 400);
        }

        /* ────────────────────────────────────────────────────────────
         | BƯỚC 4: Kiểm tra giá trị đơn hàng tối thiểu
         ──────────────────────────────────────────────────────────── */
        if ($voucher->min_order_value && $orderValue < $voucher->min_order_value) {
            $minFormatted = number_format($voucher->min_order_value, 0, ',', '.') . 'đ';
            return response()->json([
                'message' => "Đơn hàng chưa đạt giá trị tối thiểu {$minFormatted} để áp dụng mã này.",
            ], 400);
        }

        /* ────────────────────────────────────────────────────────────
         | BƯỚC 5: Kiểm tra tổng lượt dùng toàn hệ thống
         ──────────────────────────────────────────────────────────── */
        if (!$voucher->hasRemainingUsage()) {
            return response()->json([
                'message' => 'Mã giảm giá đã hết lượt sử dụng.',
            ], 400);
        }

        /* ────────────────────────────────────────────────────────────
         | BƯỚC 6: Kiểm tra số lần user hiện tại đã dùng voucher này
         | (Đếm đơn hàng có voucher_id này của user, loại trừ đơn cancelled)
         ──────────────────────────────────────────────────────────── */
        if ($request->user() && $voucher->max_uses_per_user) {
            $userUsedCount = Order::where('user_id', $request->user()->id)
                ->where('voucher_id', $voucher->id)
                ->whereNotIn('status', ['cancelled'])
                ->count();

            if ($userUsedCount >= $voucher->max_uses_per_user) {
                return response()->json([
                    'message' => "Bạn đã dùng mã này tối đa {$voucher->max_uses_per_user} lần.",
                ], 400);
            }
        }

        /* ────────────────────────────────────────────────────────────
         | TÍNH TOÁN: Số tiền được giảm
         | Dùng helper method từ Voucher model để tái sử dụng được ở nhiều nơi
         ──────────────────────────────────────────────────────────── */
        $discountAmount = $voucher->calculateDiscount($orderValue);
        $finalTotal     = max(0, $orderValue - $discountAmount);

        return response()->json([
            'message'         => 'Áp dụng mã giảm giá thành công!',
            'voucher'         => [
                'id'                  => $voucher->id,
                'code'                => $voucher->code,
                'description'         => $voucher->description,
                'discount_type'       => $voucher->discount_type,
                'discount_value'      => $voucher->discount_value,
                'max_discount_amount' => $voucher->max_discount_amount,
            ],
            'discount_amount' => $discountAmount,
            'original_total'  => $orderValue,
            'final_total'     => $finalTotal,
        ]);
    }
}
