<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Order;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['user'])->latest();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return $query->paginate(15);
    }

    public function show($id)
    {
        return Order::with(['user', 'shipping_address', 'voucher', 'order_items.product', 'order_items.variant.capacity'])
            ->findOrFail($id);
    }

    public function updateStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'nullable|in:pending,processing,shipped,delivered,cancelled',
            'payment_status' => 'nullable|in:pending,paid,failed,refunded'
        ]);

        if (isset($validated['status'])) {
            $order->status = $validated['status'];
        }
        
        if (isset($validated['payment_status'])) {
            $order->payment_status = $validated['payment_status'];
        }

        $order->save();
        
        return response()->json($order);
    }
}
