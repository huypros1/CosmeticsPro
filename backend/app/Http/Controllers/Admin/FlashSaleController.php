<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FlashSale;
use App\Models\FlashSaleItem;
use App\Models\Product;
use Illuminate\Http\Request;

class FlashSaleController extends Controller
{
    // GET /admin/flash-sales
    public function index(Request $request)
    {
        $query = FlashSale::with(['items.product', 'items.variant'])->latest();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(10));
    }

    // POST /admin/flash-sales
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'start_time' => 'required|date|after_or_equal:now',
            'end_time'   => 'required|date|after:start_time',
            'status'     => 'nullable|in:active,inactive',

            'items'                           => 'required|array|min:1',
            'items.*.product_id'              => 'required|exists:products,id',
            'items.*.product_variant_id'      => 'required|exists:product_variants,id',
            'items.*.sale_price'              => 'required|numeric|min:1000',
            'items.*.quantity'                => 'required|integer|min:1',
        ], [
            'name.required'                        => 'Tên chương trình Flash Sale là bắt buộc.',
            'name.max'                             => 'Tên không được vượt quá 255 ký tự.',
            'start_time.required'                  => 'Thời gian bắt đầu là bắt buộc.',
            'start_time.after_or_equal'            => 'Thời gian bắt đầu không được là thời điểm trong quá khứ.',
            'end_time.required'                    => 'Thời gian kết thúc là bắt buộc.',
            'end_time.after'                       => 'Thời gian kết thúc phải sau thời gian bắt đầu.',
            'items.required'                       => 'Flash Sale phải có ít nhất một sản phẩm.',
            'items.min'                            => 'Flash Sale phải có ít nhất một sản phẩm.',
            'items.*.product_id.required'          => 'Vui lòng chọn sản phẩm.',
            'items.*.product_id.exists'            => 'Sản phẩm không tồn tại.',
            'items.*.product_variant_id.required'  => 'Vui lòng chọn biến thể sản phẩm.',
            'items.*.product_variant_id.exists'    => 'Biến thể sản phẩm không tồn tại.',
            'items.*.sale_price.required'          => 'Giá flash sale là bắt buộc.',
            'items.*.sale_price.min'               => 'Giá flash sale phải ít nhất 1,000đ.',
            'items.*.quantity.required'            => 'Số lượng là bắt buộc.',
            'items.*.quantity.min'                 => 'Số lượng phải ít nhất là 1.',
        ]);

        // Validate: giá flash sale phải nhỏ hơn giá gốc của variant
        foreach ($request->items as $idx => $item) {
            $variant = \App\Models\ProductVariant::find($item['product_variant_id']);
            if ($variant) {
                $originalPrice = $variant->sale_price ?? $variant->price;
                if ($item['sale_price'] >= $originalPrice) {
                    return response()->json([
                        'message' => 'Validation failed',
                        'errors'  => [
                            "items.{$idx}.sale_price" => ["Giá Flash Sale ({$item['sale_price']}đ) phải nhỏ hơn giá hiện tại ({$originalPrice}đ) của biến thể."],
                        ],
                    ], 422);
                }

                // Validate số lượng flash sale không vượt quá tồn kho
                if ($item['quantity'] > $variant->stock) {
                    return response()->json([
                        'message' => 'Validation failed',
                        'errors'  => [
                            "items.{$idx}.quantity" => ["Số lượng flash sale ({$item['quantity']}) vượt quá tồn kho hiện tại ({$variant->stock})."],
                        ],
                    ], 422);
                }
            }
        }

        // Chặn thêm cùng 1 variant vào nhiều flash sale đang active
        $activeFlashSaleIds = FlashSale::where('status', 'active')
            ->where('end_time', '>', now())
            ->pluck('id');

        foreach ($request->items as $idx => $item) {
            $conflict = FlashSaleItem::whereIn('flash_sale_id', $activeFlashSaleIds)
                ->where('product_variant_id', $item['product_variant_id'])
                ->exists();

            if ($conflict) {
                $variant = \App\Models\ProductVariant::with('product', 'capacity')->find($item['product_variant_id']);
                $name = $variant?->product?->name . ' - ' . $variant?->capacity?->value . $variant?->capacity?->unit;
                return response()->json([
                    'message' => 'Validation failed',
                    'errors'  => [
                        "items.{$idx}.product_variant_id" => ["Biến thể \"{$name}\" đã có trong một Flash Sale đang diễn ra."],
                    ],
                ], 422);
            }
        }

        $sale = FlashSale::create([
            'name'       => $validated['name'],
            'start_time' => $validated['start_time'],
            'end_time'   => $validated['end_time'],
            'status'     => $validated['status'] ?? 'active',
        ]);

        foreach ($validated['items'] as $item) {
            FlashSaleItem::create([
                'flash_sale_id'      => $sale->id,
                'product_id'         => $item['product_id'],
                'product_variant_id' => $item['product_variant_id'],
                'sale_price'         => $item['sale_price'],
                'quantity'           => $item['quantity'],
            ]);
        }

        return response()->json($sale->load('items.product', 'items.variant'), 201);
    }

    // GET /admin/flash-sales/{id}
    public function show($id)
    {
        $sale = FlashSale::with(['items.product.variants.capacity', 'items.variant.capacity'])
            ->findOrFail($id);

        return response()->json($sale);
    }

    // PUT /admin/flash-sales/{id}
    public function update(Request $request, $id)
    {
        $sale = FlashSale::findOrFail($id);

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'start_time' => 'required|date',
            'end_time'   => 'required|date|after:start_time',
            'status'     => 'nullable|in:active,inactive',

            'items'                          => 'required|array|min:1',
            'items.*.product_id'             => 'required|exists:products,id',
            'items.*.product_variant_id'     => 'required|exists:product_variants,id',
            'items.*.sale_price'             => 'required|numeric|min:1000',
            'items.*.quantity'               => 'required|integer|min:1',
        ], [
            'name.required'                       => 'Tên chương trình Flash Sale là bắt buộc.',
            'end_time.after'                      => 'Thời gian kết thúc phải sau thời gian bắt đầu.',
            'items.required'                      => 'Flash Sale phải có ít nhất một sản phẩm.',
            'items.*.product_variant_id.required' => 'Vui lòng chọn biến thể sản phẩm.',
            'items.*.sale_price.required'         => 'Giá flash sale là bắt buộc.',
            'items.*.sale_price.min'              => 'Giá flash sale phải ít nhất 1,000đ.',
            'items.*.quantity.min'                => 'Số lượng phải ít nhất là 1.',
        ]);

        // Validate giá flash sale < giá gốc
        foreach ($request->items as $idx => $item) {
            $variant = \App\Models\ProductVariant::find($item['product_variant_id']);
            if ($variant) {
                $originalPrice = $variant->sale_price ?? $variant->price;
                if ($item['sale_price'] >= $originalPrice) {
                    return response()->json([
                        'message' => 'Validation failed',
                        'errors'  => [
                            "items.{$idx}.sale_price" => ["Giá Flash Sale phải nhỏ hơn giá hiện tại ({$originalPrice}đ) của biến thể."],
                        ],
                    ], 422);
                }
            }
        }

        // Chặn trùng variant với flash sale active khác (trừ chính nó)
        $activeFlashSaleIds = FlashSale::where('status', 'active')
            ->where('end_time', '>', now())
            ->where('id', '!=', $sale->id)
            ->pluck('id');

        foreach ($request->items as $idx => $item) {
            $conflict = FlashSaleItem::whereIn('flash_sale_id', $activeFlashSaleIds)
                ->where('product_variant_id', $item['product_variant_id'])
                ->exists();

            if ($conflict) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors'  => [
                        "items.{$idx}.product_variant_id" => ['Biến thể này đã có trong một Flash Sale đang diễn ra khác.'],
                    ],
                ], 422);
            }
        }

        $sale->update([
            'name'       => $validated['name'],
            'start_time' => $validated['start_time'],
            'end_time'   => $validated['end_time'],
            'status'     => $validated['status'] ?? $sale->status,
        ]);

        $sale->items()->delete();
        foreach ($validated['items'] as $item) {
            FlashSaleItem::create([
                'flash_sale_id'      => $sale->id,
                'product_id'         => $item['product_id'],
                'product_variant_id' => $item['product_variant_id'],
                'sale_price'         => $item['sale_price'],
                'quantity'           => $item['quantity'],
            ]);
        }

        return response()->json($sale->load('items.product', 'items.variant'));
    }

    // DELETE /admin/flash-sales/{id}
    public function destroy($id)
    {
        $sale = FlashSale::findOrFail($id);

        // Không cho xóa flash sale đang active và còn thời hạn
        if ($sale->status === 'active' && $sale->end_time > now()) {
            return response()->json([
                'message' => 'Không thể xóa Flash Sale đang diễn ra. Vui lòng tắt trạng thái trước khi xóa.',
            ], 422);
        }

        $sale->items()->delete();
        $sale->delete();

        return response()->json(['message' => 'Xóa Flash Sale thành công']);
    }

    // Toggle status
    public function toggleStatus($id)
    {
        $sale = FlashSale::findOrFail($id);
        $sale->status = $sale->status === 'active' ? 'inactive' : 'active';
        $sale->save();

        return response()->json([
            'message' => 'Đã cập nhật trạng thái Flash Sale',
            'status'  => $sale->status,
        ]);
    }
}
