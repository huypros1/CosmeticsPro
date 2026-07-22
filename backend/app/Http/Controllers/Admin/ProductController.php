<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Image;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'brand', 'variants.capacity', 'variants.images']);

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 10);
        return $query->latest()->paginate($perPage);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'content'     => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'brand_id'    => 'required|exists:brands,id',
            'is_featured' => 'boolean',
            'status'      => 'nullable|in:active,inactive',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',

            // Variants: phải có ít nhất 1 variant
            'variants'                  => 'required|array|min:1',
            'variants.*.price'          => 'required|numeric|min:1000',
            'variants.*.sale_price'     => 'nullable|numeric|min:0|lt:variants.*.price',
            'variants.*.stock'          => 'required|integer|min:0',
            'variants.*.capacity_value' => 'required|string|max:50',
            'variants.*.capacity_unit'  => 'required|string|max:20',
        ], [
            'name.required'                   => 'Tên sản phẩm là bắt buộc.',
            'name.max'                        => 'Tên sản phẩm không được vượt quá 255 ký tự.',
            'category_id.required'            => 'Vui lòng chọn danh mục.',
            'category_id.exists'              => 'Danh mục không tồn tại.',
            'brand_id.required'               => 'Vui lòng chọn thương hiệu.',
            'brand_id.exists'                 => 'Thương hiệu không tồn tại.',
            'image.image'                     => 'Tệp tải lên phải là ảnh.',
            'image.mimes'                     => 'Ảnh phải có định dạng jpeg, png, jpg, gif hoặc webp.',
            'image.max'                       => 'Kích thước ảnh không được vượt quá 5MB.',
            'variants.required'               => 'Sản phẩm phải có ít nhất một biến thể.',
            'variants.min'                    => 'Sản phẩm phải có ít nhất một biến thể.',
            'variants.*.price.required'       => 'Giá biến thể là bắt buộc.',
            'variants.*.price.min'            => 'Giá biến thể phải ít nhất 1,000đ.',
            'variants.*.sale_price.lt'        => 'Giá khuyến mãi phải nhỏ hơn giá gốc.',
            'variants.*.stock.required'       => 'Số lượng tồn kho là bắt buộc.',
            'variants.*.stock.min'            => 'Số lượng tồn kho không được âm.',
            'variants.*.capacity_value.required' => 'Giá trị dung tích là bắt buộc.',
            'variants.*.capacity_unit.required'  => 'Đơn vị dung tích là bắt buộc.',
        ]);

        // Slug tự động, không trùng
        $slug = Str::slug($validated['name']);
        $originalSlug = $slug;
        $count = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }
        $validated['slug'] = $slug;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        DB::beginTransaction();
        try {
            $product = Product::create($validated);

            foreach ($request->variants as $varData) {
                $capacity = \App\Models\Capacity::firstOrCreate([
                    'value' => $varData['capacity_value'],
                    'unit'  => $varData['capacity_unit'],
                ]);

                $product->variants()->create([
                    'capacity_id' => $capacity->id,
                    'price'       => $varData['price'],
                    'sale_price'  => $varData['sale_price'] ?? null,
                    'stock'       => $varData['stock'] ?? 0,
                ]);
            }

            DB::commit();
            return response()->json([
                'message' => 'Tạo sản phẩm thành công',
                'data'    => $product->load('variants.capacity'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Tạo sản phẩm thất bại',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        return Product::with(['category', 'brand', 'variants.capacity', 'variants.images'])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'content'     => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'brand_id'    => 'required|exists:brands,id',
            'is_featured' => 'boolean',
            'status'      => 'nullable|in:active,inactive',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',

            'variants'                  => 'required|array|min:1',
            'variants.*.id'             => 'nullable|exists:product_variants,id',
            'variants.*.price'          => 'required|numeric|min:1000',
            'variants.*.sale_price'     => 'nullable|numeric|min:0',
            'variants.*.stock'          => 'required|integer|min:0',
            'variants.*.capacity_value' => 'required|string|max:50',
            'variants.*.capacity_unit'  => 'required|string|max:20',
        ], [
            'name.required'                   => 'Tên sản phẩm là bắt buộc.',
            'category_id.required'            => 'Vui lòng chọn danh mục.',
            'category_id.exists'              => 'Danh mục không tồn tại.',
            'brand_id.required'               => 'Vui lòng chọn thương hiệu.',
            'brand_id.exists'                 => 'Thương hiệu không tồn tại.',
            'image.image'                     => 'Tệp tải lên phải là ảnh.',
            'image.mimes'                     => 'Ảnh phải có định dạng jpeg, png, jpg, gif hoặc webp.',
            'image.max'                       => 'Kích thước ảnh không được vượt quá 5MB.',
            'variants.required'               => 'Sản phẩm phải có ít nhất một biến thể.',
            'variants.*.price.required'       => 'Giá biến thể là bắt buộc.',
            'variants.*.price.min'            => 'Giá biến thể phải ít nhất 1,000đ.',
            'variants.*.stock.required'       => 'Số lượng tồn kho là bắt buộc.',
            'variants.*.stock.min'            => 'Số lượng tồn kho không được âm.',
            'variants.*.capacity_value.required' => 'Giá trị dung tích là bắt buộc.',
            'variants.*.capacity_unit.required'  => 'Đơn vị dung tích là bắt buộc.',
        ]);

        // Validate sale_price < price từng variant (sau validate cơ bản)
        foreach ($request->variants as $idx => $varData) {
            if (!empty($varData['sale_price']) && $varData['sale_price'] >= $varData['price']) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors'  => [
                        "variants.{$idx}.sale_price" => ['Giá khuyến mãi phải nhỏ hơn giá gốc.'],
                    ],
                ], 422);
            }
        }

        if ($validated['name'] !== $product->name) {
            $slug = Str::slug($validated['name']);
            $originalSlug = $slug;
            $count = 1;
            while (Product::where('slug', $slug)->where('id', '!=', $product->id)->exists()) {
                $slug = $originalSlug . '-' . $count++;
            }
            $validated['slug'] = $slug;
        }

        if ($request->hasFile('image')) {
            if ($product->image) {
                $oldPath = str_replace('/storage/', '', $product->image);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        DB::beginTransaction();
        try {
            $product->update($validated);

            if ($request->has('variants')) {
                $incomingVariantIds = collect($request->variants)->pluck('id')->filter()->toArray();
                $product->variants()->whereNotIn('id', $incomingVariantIds)->delete();

                foreach ($request->variants as $varData) {
                    $capacity = \App\Models\Capacity::firstOrCreate([
                        'value' => $varData['capacity_value'],
                        'unit'  => $varData['capacity_unit'],
                    ]);

                    if (!empty($varData['id'])) {
                        $product->variants()->where('id', $varData['id'])->update([
                            'capacity_id' => $capacity->id,
                            'price'       => $varData['price'],
                            'sale_price'  => $varData['sale_price'] ?? null,
                            'stock'       => $varData['stock'] ?? 0,
                        ]);
                    } else {
                        $product->variants()->create([
                            'capacity_id' => $capacity->id,
                            'price'       => $varData['price'],
                            'sale_price'  => $varData['sale_price'] ?? null,
                            'stock'       => $varData['stock'] ?? 0,
                        ]);
                    }
                }
            }

            DB::commit();
            return response()->json([
                'message' => 'Cập nhật sản phẩm thành công',
                'data'    => $product->load('variants.capacity'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Cập nhật sản phẩm thất bại',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $product = Product::withTrashed()->findOrFail($id);

        // Chặn xóa nếu có đơn hàng còn hiệu lực
        $hasActiveOrders = \App\Models\OrderItem::whereHas('variant', fn($q) => $q->where('product_id', $product->id))
            ->whereHas('order', fn($q) => $q->whereNotIn('status', ['cancelled', 'delivered']))
            ->exists();

        if ($hasActiveOrders) {
            return response()->json([
                'message' => 'Không thể xóa sản phẩm đang có trong đơn hàng chưa hoàn tất.',
            ], 422);
        }

        if ($product->image) {
            $oldPath = str_replace('/storage/', '', $product->image);
            Storage::disk('public')->delete($oldPath);
        }

        $product->delete(); // soft delete
        return response()->json(['message' => 'Xóa sản phẩm thành công']);
    }

    public function toggleStatus($id)
    {
        $product = Product::findOrFail($id);
        $product->status = $product->status === 'active' ? 'inactive' : 'active';
        $product->save();

        return response()->json([
            'message' => 'Đã cập nhật trạng thái sản phẩm',
            'status'  => $product->status,
        ]);
    }
}
