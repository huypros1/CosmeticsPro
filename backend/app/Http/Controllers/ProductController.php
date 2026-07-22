<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'brand', 'variants.capacity', 'variants.images'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->where('status', 'active');

        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }

        if ($request->filled('brand')) {
            $query->whereHas('brand', function ($q) use ($request) {
                $q->where('slug', $request->brand);
            });
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('sort')) {
            switch ($request->sort) {
                case 'price_asc':
                case 'price-asc':
                    $query->orderBy('id', 'asc');
                    break;
                case 'price_desc':
                case 'price-desc':
                    $query->orderBy('id', 'desc');
                    break;
                case 'popular':
                    $query->orderByDesc('reviews_count');
                    break;
                case 'newest':
                default:
                    $query->latest();
                    break;
            }
        } else {
            $query->latest();
        }

        $products = $query->paginate(12);

        return ProductResource::collection($products);
    }

    public function show($slug)
    {
        $product = Product::with(['category', 'brand', 'variants.capacity', 'variants.images', 'productImages'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();

        return new ProductResource($product);
    }

    public function featured()
    {
        $products = Product::with(['category', 'brand', 'variants.capacity', 'variants.images'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->where('is_featured', true)
            ->where('status', 'active')
            ->take(8)
            ->get();

        return ProductResource::collection($products);
    }

    public function newArrivals()
    {
        $products = Product::with(['category', 'brand', 'variants.capacity', 'variants.images'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->where('status', 'active')
            ->latest()
            ->take(8)
            ->get();

        return ProductResource::collection($products);
    }

    public function onSale()
    {
        $products = Product::with(['category', 'brand', 'variants.capacity', 'variants.images'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->where('status', 'active')
            ->whereHas('variants', function ($q) {
                $q->whereNotNull('sale_price')->where('sale_price', '>', 0);
            })
            ->take(8)
            ->get();

        return ProductResource::collection($products);
    }

    public function related(Request $request, $slug)
    {
        $product = Product::where('slug', $slug)->where('status', 'active')->firstOrFail();

        $related = Product::with(['category', 'brand', 'variants.capacity', 'variants.images'])
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->where('status', 'active')
            ->where('id', '!=', $product->id)
            ->where('category_id', $product->category_id)
            ->take(6)
            ->get();

        return ProductResource::collection($related);
    }
}
