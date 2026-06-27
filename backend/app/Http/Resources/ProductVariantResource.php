<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'capacity' => $this->whenLoaded('capacity', function () {
                return [
                    'id' => $this->capacity->id,
                    'value' => $this->capacity->value,
                    'unit' => $this->capacity->unit,
                ];
            }),
            'product' => $this->whenLoaded('product', function () {
                return [
                    'id' => $this->product->id,
                    'name' => $this->product->name,
                    'slug' => $this->product->slug,
                    'image' => $this->product->image
                        ? (str_starts_with($this->product->image, 'http')
                            ? $this->product->image
                            : url('storage/' . $this->product->image))
                        : null,
                ];
            }),
            'price' => $this->price,
            'sale_price' => $this->sale_price,
            'stock' => $this->stock,
            'images' => $this->whenLoaded('images', function () {
                return $this->images->map(fn ($img) => url('storage/' . $img->url));
            }),
        ];
    }
}
