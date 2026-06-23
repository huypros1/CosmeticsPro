<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\WishlistItem;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $wishlistItems = WishlistItem::with(['product.category', 'product.brand', 'product.variants.capacity', 'product.variants.images'])
            ->where('user_id', $request->user()->id)
            ->get()
            ->pluck('product');

        return ProductResource::collection($wishlistItems);
    }

    public function add(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $item = WishlistItem::firstOrCreate([
            'user_id' => $request->user()->id,
            'product_id' => $request->product_id,
        ]);

        return response()->json(['message' => 'Đã thêm vào danh sách yêu thích']);
    }

    public function remove(Request $request, $productId)
    {
        WishlistItem::where('user_id', $request->user()->id)
            ->where('product_id', $productId)
            ->delete();

        return response()->json(['message' => 'Đã xóa khỏi danh sách yêu thích']);
    }
}
