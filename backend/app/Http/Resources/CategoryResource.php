<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        if (is_null($this->resource)) {
            return [
                'id' => 0,
                'name' => 'Chưa phân loại',
                'slug' => 'chua-phan-loai',
                'description' => null,
                'image' => null,
            ];
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'image' => $this->image ? (str_starts_with($this->image, 'http') ? $this->image : url('storage/' . $this->image)) : null,
        ];
    }
}
