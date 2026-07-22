<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BrandResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        if (is_null($this->resource)) {
            return [
                'id' => 0,
                'name' => 'Chưa phân loại',
                'slug' => 'chua-phan-loai',
                'description' => null,
                'logo' => null,
            ];
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'logo' => $this->logo ? (str_starts_with($this->logo, 'http') ? $this->logo : url($this->logo)) : null,
        ];
    }
}
