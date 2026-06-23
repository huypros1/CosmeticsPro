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
                return $this->capacity->value . ' ' . $this->capacity->unit;
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
