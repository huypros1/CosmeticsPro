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
    public function index()
    {
        $sales = FlashSale::with(['items.product', 'items.variant'])
            ->latest()
            ->paginate(10);

        return response()->json($sales);
    }

    // POST /admin/flash-sales
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'start_time' => 'required|date',
            'end_time'   => 'required|date|after:start_time',
            'status'     => 'in:active,inactive',
            'items'      => 'required|array|min:1',
            'items.*.product_id'         => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.sale_price'         => 'required|numeric|min:0',
            'items.*.quantity'           => 'nullable|integer|min:0',
        ]);

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
                'product_variant_id' => $item['product_variant_id'] ?? null,
                'sale_price'         => $item['sale_price'],
                'quantity'           => $item['quantity'] ?? 0,
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
            'status'     => 'in:active,inactive',
            'items'      => 'required|array|min:1',
            'items.*.product_id'         => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.sale_price'         => 'required|numeric|min:0',
            'items.*.quantity'           => 'nullable|integer|min:0',
        ]);

        $sale->update([
            'name'       => $validated['name'],
            'start_time' => $validated['start_time'],
            'end_time'   => $validated['end_time'],
            'status'     => $validated['status'] ?? $sale->status,
        ]);

        // Replace all items
        $sale->items()->delete();
        foreach ($validated['items'] as $item) {
            FlashSaleItem::create([
                'flash_sale_id'      => $sale->id,
                'product_id'         => $item['product_id'],
                'product_variant_id' => $item['product_variant_id'] ?? null,
                'sale_price'         => $item['sale_price'],
                'quantity'           => $item['quantity'] ?? 0,
            ]);
        }

        return response()->json($sale->load('items.product', 'items.variant'));
    }

    // DELETE /admin/flash-sales/{id}
    public function destroy($id)
    {
        $sale = FlashSale::findOrFail($id);
        $sale->items()->delete();
        $sale->delete();

        return response()->json(['message' => 'Flash sale deleted']);
    }

    // Toggle status
    public function toggleStatus($id)
    {
        $sale = FlashSale::findOrFail($id);
        $sale->status = $sale->status === 'active' ? 'inactive' : 'active';
        $sale->save();

        return response()->json(['status' => $sale->status]);
    }
}
