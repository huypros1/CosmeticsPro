<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'rating'           => $this->rating,
            'content'          => $this->content,
            'image'            => $this->image ? (str_starts_with($this->image, 'http') ? $this->image : url($this->image)) : null,
            'admin_reply'      => $this->admin_reply,
            'admin_replied_at' => $this->admin_replied_at,
            'created_at'       => $this->created_at,
            'user'             => new UserResource($this->whenLoaded('user')),
        ];
    }
}
