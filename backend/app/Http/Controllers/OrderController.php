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

            if ($request->voucher_id) {
                $voucher = \App\Models\Voucher::find($request->voucher_id);
                if ($voucher) {
                    $voucher->increment('used_count');
                }
            }

            foreach ($request->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                ]);

                // Decrement stock
                $variant = \App\Models\ProductVariant::find($item['variant_id']);
                if ($variant && $variant->stock >= $item['quantity']) {
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
                    'shipping_address',
                ]);
                Mail::to($request->user()->email)->send(new OrderPlaced($orderWithRelations));
            } catch (\Exception $mailEx) {
                // Don't fail order if mail fails
                \Log::warning('Order email failed: ' . $mailEx->getMessage());
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
