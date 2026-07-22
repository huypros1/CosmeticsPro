<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Mail\OrderPlaced;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::all();

        return response()->json([
            'data' => $orders
        ]);
    }

    public function show(Request $request, $id)
    {
        $order = Order::with(['order_items.variant.product', 'order_items.variant.capacity', 'order_items.variant.images', 'voucher'])
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return new OrderResource($order);
    }

    public function store(Request $request)
    {
        $request->validate([
            'recipient_name'    => 'required|string|max:255',
            'recipient_phone'   => 'required|string|max:20',
            'shipping_address'  => 'required|string|max:500',
            'payment_method'    => 'required|string',
            'items'             => 'required|array|min:1',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity'  => 'required|integer|min:1',
            'items.*.price'     => 'required|numeric',
            'total_amount'      => 'required|numeric',
        ]);

        DB::beginTransaction();
        try {
            // ─── Tính subtotal từ items thực tế (không tin client) ───────────
            $itemsTotal = 0;
            foreach ($request->items as $item) {
                $variant = \App\Models\ProductVariant::findOrFail($item['variant_id']);
                // Lấy giá thực tế từ DB (không tin price từ client)
                $realPrice = $variant->sale_price ?? $variant->price;
                $itemsTotal += $realPrice * $item['quantity'];
            }

            // ─── Tính shipping fee ─────────────────────────────────────────────
            $shippingFee = $itemsTotal >= 500000 ? 0 : 30000;

            // ─── Tính discount từ voucher (server-side, không tin client) ──────
            $discountAmount = 0;
            $voucher        = null;

            if ($request->voucher_id) {
                $voucher = \App\Models\Voucher::find($request->voucher_id);

                if (!$voucher || $voucher->status !== 'active') {
                    return response()->json(['message' => 'Mã giảm giá không hợp lệ hoặc đã ngừng hoạt động'], 422);
                }

                $now = now();
                if ($voucher->start_date && $now->lt($voucher->start_date)) {
                    return response()->json(['message' => 'Mã giảm giá chưa có hiệu lực'], 422);
                }
                if ($voucher->end_date && $now->gt($voucher->end_date)) {
                    return response()->json(['message' => 'Mã giảm giá đã hết hạn'], 422);
                }
                if ($voucher->usage_limit && $voucher->used_count >= $voucher->usage_limit) {
                    return response()->json(['message' => 'Mã giảm giá đã hết lượt sử dụng'], 422);
                }
                if ($itemsTotal < $voucher->min_order_value) {
                    return response()->json([
                        'message' => 'Đơn hàng chưa đạt giá trị tối thiểu ' . number_format($voucher->min_order_value, 0, ',', '.') . 'đ để dùng mã này',
                    ], 422);
                }

                // Tính discount trên subtotal (tiền hàng), không tính trên total
                if ($voucher->discount_type === 'fixed') {
                    $discountAmount = min($voucher->discount_value, $itemsTotal); // không giảm vượt tiền hàng
                } elseif ($voucher->discount_type === 'percent') {
                    $discountAmount = ($itemsTotal * $voucher->discount_value) / 100;
                    if ($voucher->max_discount_amount && $discountAmount > $voucher->max_discount_amount) {
                        $discountAmount = $voucher->max_discount_amount;
                    }
                }

                $discountAmount = round($discountAmount, 2);
            }

            // ─── Tổng tiền thực = server tự tính, không tin client ───────────
            $totalAmount = max(0, $itemsTotal + $shippingFee - $discountAmount);

            $order = Order::create([
                'user_id'          => $request->user()->id,
                'recipient_name'   => $request->recipient_name,
                'recipient_phone'  => $request->recipient_phone,
                'shipping_address' => $request->shipping_address,
                'payment_method'   => $request->payment_method,
                'voucher_id'       => $request->voucher_id ?? null,
                'discount_amount'  => $discountAmount,
                'shipping_fee'     => $shippingFee,
                'total_amount'     => $totalAmount,
                'status'           => 'pending',
                'payment_status'   => 'unpaid',
            ]);

            if ($voucher) {
                $voucher->increment('used_count');
            }

            foreach ($request->items as $item) {
                $variant = \App\Models\ProductVariant::findOrFail($item['variant_id']);
                $realPrice = $variant->sale_price ?? $variant->price;

                OrderItem::create([
                    'order_id'           => $order->id,
                    'product_variant_id' => $item['variant_id'],
                    'quantity'           => $item['quantity'],
                    'price'              => $realPrice, // Lưu giá thực tế từ DB
                ]);

                // Decrement stock
                if ($variant->stock >= $item['quantity']) {
                    $variant->decrement('stock', $item['quantity']);
                }
            }

            // Clear cart
            Cart::where('user_id', $request->user()->id)->delete();

            DB::commit();

            // Simulate VNPay / MoMo success url directly for testing purposes
            $paymentUrl = null;
            if (in_array($request->payment_method, ['vnpay', 'momo'])) {
                $order->payment_status = 'paid';
                $order->save();
            }

            // Send order confirmation email
            try {
                $orderWithRelations = $order->load([
                    'user',
                    'order_items.variant.product',
                    'order_items.variant.capacity',
                ]);
                Mail::to($request->user()->email)->send(new OrderPlaced($orderWithRelations));
            } catch (\Exception $mailEx) {
                // Don't fail order if mail fails
                \Log::warning('Order email failed: ' . $mailEx->getMessage());
            }

            return response()->json([
                'message'     => 'Đặt hàng thành công',
                'order'       => new OrderResource($order),
                'payment_url' => $paymentUrl
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Có lỗi xảy ra khi đặt hàng: ' . $e->getMessage()], 500);
        }
    }

    public function cancel(Request $request, $id)
    {
        $order = Order::where('user_id', $request->user()->id)->findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Không thể hủy đơn hàng ở trạng thái này'], 400);
        }

        $order->status = 'cancelled';
        $order->save();

        return response()->json([
            'message' => 'Đã hủy đơn hàng',
            'order'   => new OrderResource($order)
        ]);
    }
}
