<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function recent()
    {
        $reviews = Review::with(['user', 'product'])
            ->whereNotNull('content')
            ->latest()
            ->take(8)
            ->get();

        return response()->json($reviews);
    }

    public function index($productId)
    {
        $reviews = Review::with('user')
            ->where('product_id', $productId)
            ->latest()
            ->get();

        return ReviewResource::collection($reviews);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'content' => 'required|string|max:1000',
            'order_id' => 'nullable|exists:orders,id',
        ]);

        $userId = $request->user()->id;
        $productId = $request->product_id;

        // Kiểm tra user đã mua và nhận hàng thành công chưa
        $hasDeliveredOrder = Order::where('user_id', $userId)
            ->where('status', 'delivered')
            ->whereHas('order_items', function ($q) use ($productId) {
                $q->whereHas('variant', function ($q2) use ($productId) {
                    $q2->where('product_id', $productId);
                });
            })
            ->exists();

        if (!$hasDeliveredOrder) {
            return response()->json([
                'message' => 'Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã giao thành công'
            ], 403);
        }

        // Kiểm tra đã review sản phẩm này chưa
        $existingReview = Review::where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'Bạn đã đánh giá sản phẩm này rồi'
            ], 409);
        }

        $review = Review::create([
            'user_id' => $userId,
            'product_id' => $productId,
            'rating' => $request->rating,
            'content' => $request->content,
        ]);

        return response()->json([
            'message' => 'Đánh giá đã được gửi',
            'review' => new ReviewResource($review->load('user'))
        ], 201);
    }

    /**
     * Kiểm tra user có thể review những product nào từ một order
     */
    public function reviewableByOrder(Request $request, $orderId)
    {
        $userId = $request->user()->id;

        $order = Order::where('user_id', $userId)
            ->where('id', $orderId)
            ->with(['order_items.variant.product', 'order_items.variant.capacity'])
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
        }

        if ($order->status !== 'delivered') {
            return response()->json([
                'can_review' => false,
                'message' => 'Đơn hàng chưa giao thành công',
                'products' => [],
            ]);
        }

        // Lấy danh sách product_id từ order
        $productIds = $order->order_items
            ->pluck('variant.product.id')
            ->filter()
            ->unique()
            ->values();

        // Tìm những product đã review
        $reviewedProductIds = Review::where('user_id', $userId)
            ->whereIn('product_id', $productIds)
            ->pluck('product_id')
            ->toArray();

        $products = $order->order_items->map(function ($item) use ($reviewedProductIds) {
            $product = $item->variant?->product;
            if (!$product) return null;

            return [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'product_image' => $product->image,
                'variant_info' => $item->variant?->capacity
                    ? ($item->variant->capacity->value . ($item->variant->capacity->unit ?? ''))
                    : null,
                'quantity' => $item->quantity,
                'reviewed' => in_array($product->id, $reviewedProductIds),
            ];
        })->filter()->unique('product_id')->values();

        return response()->json([
            'can_review' => true,
            'products' => $products,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $review = Review::where('user_id', $request->user()->id)->findOrFail($id);
        $review->delete();

        return response()->json(['message' => 'Đã xóa đánh giá']);
    }
}
