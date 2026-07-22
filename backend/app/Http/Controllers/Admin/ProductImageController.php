<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Image;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    /**
     * Lấy danh sách ảnh của sản phẩm.
     * GET /admin/products/{id}/images
     */
    public function index($productId)
    {
        $product = Product::findOrFail($productId);
        return response()->json($product->productImages);
    }

    /**
     * Upload một hoặc nhiều ảnh cho sản phẩm.
     * POST /admin/products/{id}/images
     */
    public function store(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);

        $request->validate([
            'images'   => 'required|array|min:1|max:10',
            'images.*' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ], [
            'images.required'   => 'Vui lòng chọn ít nhất 1 ảnh.',
            'images.max'        => 'Tối đa 10 ảnh mỗi lần upload.',
            'images.*.image'    => 'Tệp tải lên phải là ảnh.',
            'images.*.mimes'    => 'Ảnh phải có định dạng jpeg, png, jpg, gif hoặc webp.',
            'images.*.max'      => 'Mỗi ảnh không được vượt quá 5MB.',
        ]);

        // Lấy sort_order tiếp theo
        $maxOrder = Image::where('product_id', $productId)->max('sort_order') ?? -1;

        $uploaded = [];
        foreach ($request->file('images') as $file) {
            $path = $file->store("products/{$productId}/gallery", 'public');
            $uploaded[] = Image::create([
                'product_id' => $productId,
                'url'        => '/storage/' . $path,
                'sort_order' => ++$maxOrder,
            ]);
        }

        return response()->json([
            'message' => count($uploaded) . ' ảnh đã được tải lên',
            'images'  => $uploaded,
        ], 201);
    }

    /**
     * Xóa một ảnh.
     * DELETE /admin/products/{id}/images/{imageId}
     */
    public function destroy($productId, $imageId)
    {
        $image = Image::where('product_id', $productId)->findOrFail($imageId);

        // Xóa file khỏi storage
        $path = str_replace('/storage/', '', $image->url);
        Storage::disk('public')->delete($path);

        $image->delete();

        return response()->json(['message' => 'Đã xóa ảnh']);
    }

    /**
     * Cập nhật thứ tự ảnh (drag & drop reorder).
     * PUT /admin/products/{id}/images/reorder
     */
    public function reorder(Request $request, $productId)
    {
        $request->validate([
            'order'   => 'required|array',
            'order.*' => 'integer|exists:images,id',
        ]);

        foreach ($request->order as $sortOrder => $imageId) {
            Image::where('id', $imageId)
                 ->where('product_id', $productId)
                 ->update(['sort_order' => $sortOrder]);
        }

        return response()->json(['message' => 'Đã cập nhật thứ tự ảnh']);
    }
}
