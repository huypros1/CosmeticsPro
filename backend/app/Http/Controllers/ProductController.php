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

        if ($request->has('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }

        if ($request->has('brand')) {
            $query->whereHas('brand', function ($q) use ($request) {
                $q->where('slug', $request->brand);
            });
        }

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('sort')) {
            switch ($request->sort) {
                case 'price-asc':
                    // Sorting by variants price requires a join or subquery in real app.
                    // For simplicity, we just sort by ID here if we don't do complex joins.
                    $query->orderBy('id', 'asc');
                    break;
                case 'price-desc':
                    $query->orderBy('id', 'desc');
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
        $product = Product::with(['category', 'brand', 'variants.capacity', 'variants.images'])
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
}
