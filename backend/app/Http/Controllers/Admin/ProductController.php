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
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'required|exists:brands,id',
            'is_featured' => 'boolean',
            'status' => 'nullable|in:active,inactive,0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'variants' => 'nullable|array', // Optional variants
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        DB::beginTransaction();
        try {
            $product = Product::create($validated);
            
            // Handle variants if provided
            if ($request->has('variants')) {
                foreach ($request->variants as $varData) {
                    $variant = $product->variants()->create([
                        'capacity_id' => $varData['capacity_id'] ?? null,
                        'price' => $varData['price'],
                        'sale_price' => $varData['sale_price'] ?? null,
                        'stock' => $varData['stock'] ?? 0,
                    ]);
                    
                    // Note: file upload for variant images in array format needs special handling
                    // This can be expanded later if needed.
                }
            }
            
            DB::commit();
            return response()->json($product->load('variants'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create product', 'error' => $e->getMessage()], 500);
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
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'required|exists:brands,id',
            'is_featured' => 'boolean',
            'status' => 'nullable|in:active,inactive,0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if (isset($validated['name']) && $validated['name'] !== $product->name) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if ($request->hasFile('image')) {
            if ($product->image) {
                $oldPath = str_replace('/storage/', '', $product->image);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('products', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        $product->update($validated);
        return response()->json($product);
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        
        if ($product->image) {
            $oldPath = str_replace('/storage/', '', $product->image);
            Storage::disk('public')->delete($oldPath);
        }
        
        // Product variants and images should cascade on delete or be soft deleted depending on migration setup
        $product->delete();
        return response()->json(['message' => 'Product deleted']);
    }
    public function toggleStatus($id)
    {
        $product = Product::findOrFail($id);
        $product->status = $product->status === 'active' ? '0' : 'active';
        $product->save();

        return response()->json([
            'message' => 'Status updated',
            'status'  => $product->status,
        ]);
    }
}
