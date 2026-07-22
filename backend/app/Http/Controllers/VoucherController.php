<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use Illuminate\Http\Request;
use Carbon\Carbon;

class VoucherController extends Controller
{
    public function validateVoucher(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'order_value' => 'required|numeric'
        ]);

        $voucher = Voucher::where('code', $request->code)->first();

        if (!$voucher) {
            return response()->json(['message' => 'Mã giảm giá không tồn tại'], 404);
        }

        if ($voucher->status !== 'active') {
            return response()->json(['message' => 'Mã giảm giá không còn hoạt động'], 400);
        }

        $now = Carbon::now();
        if ($voucher->start_date && $now->lt($voucher->start_date)) {
            return response()->json(['message' => 'Mã giảm giá chưa có hiệu lực'], 400);
        }

        if ($voucher->end_date && $now->gt($voucher->end_date)) {
            return response()->json(['message' => 'Mã giảm giá đã hết hạn'], 400);
        }

        if ($voucher->usage_limit && $voucher->used_count >= $voucher->usage_limit) {
            return response()->json(['message' => 'Mã giảm giá đã hết lượt sử dụng'], 400);
        }

        // Kiểm tra số lần user đã dùng voucher này
        if ($request->user()) {
            $userUsedCount = \App\Models\Order::where('user_id', $request->user()->id)
                ->where('voucher_id', $voucher->id)
                ->whereNotIn('status', ['cancelled'])
                ->count();

            if ($userUsedCount >= $voucher->max_uses_per_user) {
                return response()->json(['message' => 'Bạn đã sử dụng mã giảm giá này tối đa ' . $voucher->max_uses_per_user . ' lần'], 400);
            }
        }

        if ($request->order_value < $voucher->min_order_value) {
            return response()->json(['message' => 'Đơn hàng chưa đạt giá trị tối thiểu'], 400);
        }

        // Calculate discount
        $discountAmount = 0;
        if ($voucher->discount_type === 'fixed') {
            $discountAmount = $voucher->discount_value;
        } else if ($voucher->discount_type === 'percent') {
            $discountAmount = ($request->order_value * $voucher->discount_value) / 100;
            if ($voucher->max_discount_amount && $discountAmount > $voucher->max_discount_amount) {
                $discountAmount = $voucher->max_discount_amount;
            }
        }

        return response()->json([
            'message' => 'Áp dụng mã thành công',
            'voucher' => $voucher,
            'discount_amount' => $discountAmount
        ]);
    }
}
