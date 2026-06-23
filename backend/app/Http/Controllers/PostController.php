<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostResource;
use App\Models\Post;

class PostController extends Controller
{
    public function index()
    {
        $posts = Post::with(['author', 'category'])
            ->where('status', 'published')
            ->latest()
            ->paginate(9);

        return PostResource::collection($posts);
    }

    public function show($slug)
    {
        $post = Post::with(['author', 'category'])
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        return new PostResource($post);
    }
}
