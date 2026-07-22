<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'content' => $this->content,
            'image' => $this->image ? (str_starts_with($this->image, 'http') ? $this->image : url($this->image)) : null,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'brand' => new BrandResource($this->whenLoaded('brand')),
            'is_featured' => $this->is_featured,
            'status' => $this->status,
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'reviews' => ReviewResource::collection($this->whenLoaded('reviews')),
            'rating_avg' => $this->when($this->reviews_avg_rating !== null, round($this->reviews_avg_rating, 1)),
            'reviews_count' => $this->when($this->reviews_count !== null, $this->reviews_count),
            'product_images' => $this->whenLoaded('productImages', function () {
                return $this->productImages->map(fn($img) => [
                    'id'         => $img->id,
                    'url'        => str_starts_with($img->url, 'http') ? $img->url : url($img->url),
                    'sort_order' => $img->sort_order,
                ]);
            }),
        ];
    }
}
