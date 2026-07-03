<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\CategoryPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $query = Post::with(['author', 'category'])->latest();

        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category_post_id')) {
            $query->where('category_post_id', $request->category_post_id);
        }

        return $query->paginate(10);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'content'          => 'nullable|string',
            'status'           => 'required|in:draft,published',
            'category_post_id' => 'nullable|exists:category_posts,id',
            'thumbnail'        => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ]);

        $validated['slug']      = Str::slug($validated['title']) . '-' . Str::random(5);
        $validated['author_id'] = $request->user()->id;

        if ($request->hasFile('thumbnail')) {
            $path = $request->file('thumbnail')->store('posts', 'public');
            $validated['thumbnail'] = '/storage/' . $path;
        }

        $post = Post::create($validated);
        return response()->json($post->load(['author', 'category']), 201);
    }

    public function show($id)
    {
        return Post::with(['author', 'category'])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'content'          => 'nullable|string',
            'status'           => 'required|in:draft,published',
            'category_post_id' => 'nullable|exists:category_posts,id',
            'thumbnail'        => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
        ]);

        if ($validated['title'] !== $post->title) {
            $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(5);
        }

        if ($request->hasFile('thumbnail')) {
            if ($post->thumbnail) {
                $old = str_replace('/storage/', '', $post->thumbnail);
                Storage::disk('public')->delete($old);
            }
            $path = $request->file('thumbnail')->store('posts', 'public');
            $validated['thumbnail'] = '/storage/' . $path;
        }

        $post->update($validated);
        return response()->json($post->load(['author', 'category']));
    }

    public function destroy($id)
    {
        $post = Post::findOrFail($id);
        if ($post->thumbnail) {
            $old = str_replace('/storage/', '', $post->thumbnail);
            Storage::disk('public')->delete($old);
        }
        $post->delete();
        return response()->json(['message' => 'Post deleted']);
    }

    public function categories()
    {
        return response()->json(CategoryPost::all());
    }
}
