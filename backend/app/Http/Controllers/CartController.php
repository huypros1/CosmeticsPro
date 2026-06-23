<?php

namespace App\Http\Controllers;

use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $cartItems = Cart::with(['variant.product', 'variant.capacity'])
            ->where('user_id', $request->user()->id)
            ->get();

        return CartResource::collection($cartItems);
    }

    public function add(Request $request)
    {
        $request->validate([
            'variant_id' => 'required|exists:product_variants,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $variant = ProductVariant::findOrFail($request->variant_id);

        if ($variant->stock < $request->quantity) {
            throw ValidationException::withMessages([
                'quantity' => ['Số lượng sản phẩm trong kho không đủ.'],
            ]);
        }

        $cartItem = Cart::where('user_id', $request->user()->id)
            ->where('variant_id', $request->variant_id)
            ->first();

        if ($cartItem) {
            $cartItem->quantity += $request->quantity;
            $cartItem->price = $variant->sale_price ?? $variant->price;
            $cartItem->save();
        } else {
            $cartItem = Cart::create([
                'user_id' => $request->user()->id,
                'variant_id' => $request->variant_id,
                'quantity' => $request->quantity,
                'price' => $variant->sale_price ?? $variant->price,
            ]);
        }

        return response()->json([
            'message' => 'Đã thêm vào giỏ hàng',
            'item' => new CartResource($cartItem->load(['variant.product', 'variant.capacity']))
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cartItem = Cart::where('user_id', $request->user()->id)->findOrFail($id);
        $variant = ProductVariant::findOrFail($cartItem->variant_id);

        if ($variant->stock < $request->quantity) {
             throw ValidationException::withMessages([
                'quantity' => ['Số lượng sản phẩm trong kho không đủ.'],
            ]);
        }

        $cartItem->quantity = $request->quantity;
        $cartItem->save();

        return response()->json([
            'message' => 'Đã cập nhật giỏ hàng',
            'item' => new CartResource($cartItem->load(['variant.product', 'variant.capacity']))
        ]);
    }

    public function remove(Request $request, $id)
    {
        $cartItem = Cart::where('user_id', $request->user()->id)->findOrFail($id);
        $cartItem->delete();

        return response()->json(['message' => 'Đã xóa khỏi giỏ hàng']);
    }

    public function clear(Request $request)
    {
        Cart::where('user_id', $request->user()->id)->delete();

        return response()->json(['message' => 'Đã làm sạch giỏ hàng']);
    }
}
