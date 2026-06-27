<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = Order::with(['order_items.variant.product', 'order_items.variant.capacity', 'order_items.variant.images'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return OrderResource::collection($orders);
    }

    public function show(Request $request, $id)
    {
        $order = Order::with(['order_items.variant.product', 'order_items.variant.capacity', 'order_items.variant.images', 'shipping_address', 'voucher'])
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return new OrderResource($order);
    }

    public function store(Request $request)
    {
        $request->validate([
            'shipping_address_id' => 'required|exists:shipping_addresses,id',
            'payment_method' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'total_amount' => 'required|numeric',
        ]);

        DB::beginTransaction();
        try {
            $order = Order::create([
                'user_id' => $request->user()->id,
                'shipping_address_id' => $request->shipping_address_id,
                'payment_method' => $request->payment_method,
                'voucher_id' => $request->voucher_id,
                'shipping_fee' => $request->shipping_fee ?? 0,
                'total_amount' => $request->total_amount,
                'status' => 'pending',
                'payment_status' => 'unpaid',
            ]);

            foreach ($request->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                ]);
            }

            // Clear cart
            Cart::where('user_id', $request->user()->id)->delete();

            DB::commit();

            // Simulate VNPay / MoMo success url directly for testing purposes
            $paymentUrl = null;
            if (in_array($request->payment_method, ['vnpay', 'momo'])) {
                // In a real app, you would call VNPay/MoMo API here.
                // For now, we simulate success by returning the frontend order detail URL.
                $order->payment_status = 'paid';
                $order->save();
            }

            return response()->json([
                'message' => 'Đặt hàng thành công',
                'order' => new OrderResource($order),
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
            'order' => new OrderResource($order)
        ]);
    }
}
