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
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('meta_description', 'like', '%' . $request->search . '%');
            });
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
            'content'          => 'required|string|min:50',
            'excerpt'          => 'nullable|string|max:300',
            'status'           => 'required|in:draft,published',
            'category_post_id' => 'nullable|exists:category_posts,id',
            'thumbnail'        => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',

            // SEO fields
            'meta_title'       => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
            'meta_keywords'    => 'nullable|string|max:255',
            'canonical_url'    => 'nullable|url|max:500',
            'og_image'         => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',

            'published_at'     => 'nullable|date',
        ], [
            'title.required'       => 'Tiêu đề bài viết là bắt buộc.',
            'title.max'            => 'Tiêu đề không được vượt quá 255 ký tự.',
            'content.required'     => 'Nội dung bài viết là bắt buộc.',
            'content.min'          => 'Nội dung bài viết phải có ít nhất 50 ký tự.',
            'meta_title.max'       => 'Meta Title SEO tối đa 60 ký tự (chuẩn Google).',
            'meta_description.max' => 'Meta Description SEO tối đa 160 ký tự (chuẩn Google).',
            'canonical_url.url'    => 'Canonical URL phải là đường dẫn hợp lệ.',
            'thumbnail.image'      => 'Thumbnail phải là ảnh.',
            'thumbnail.mimes'      => 'Thumbnail phải có định dạng jpeg, png, jpg, gif hoặc webp.',
            'thumbnail.max'        => 'Thumbnail không được vượt quá 4MB.',
        ]);

        // Tạo slug unique
        $slug = Str::slug($validated['title']);
        $baseSlug = $slug;
        $count = 1;
        while (Post::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $count++;
        }
        $validated['slug'] = $slug;

        $validated['author_id']    = $request->user()->id;
        $validated['reading_time'] = Post::calcReadingTime($validated['content']);

        // Tự điền excerpt nếu để trống
        if (empty($validated['excerpt']) && $validated['content']) {
            $validated['excerpt'] = Str::limit(strip_tags($validated['content']), 250);
        }

        // Tự điền meta_title nếu để trống
        if (empty($validated['meta_title'])) {
            $validated['meta_title'] = Str::limit($validated['title'], 60);
        }

        // Tự điền meta_description nếu để trống
        if (empty($validated['meta_description']) && !empty($validated['excerpt'])) {
            $validated['meta_description'] = Str::limit($validated['excerpt'], 160);
        }

        // Xử lý thời gian đăng
        if ($validated['status'] === 'published' && empty($validated['published_at'])) {
            $validated['published_at'] = now();
        }

        if ($request->hasFile('thumbnail')) {
            $path = $request->file('thumbnail')->store('posts', 'public');
            $validated['thumbnail'] = '/storage/' . $path;
        }

        if ($request->hasFile('og_image')) {
            $path = $request->file('og_image')->store('posts/og', 'public');
            $validated['og_image'] = '/storage/' . $path;
        }

        $post = Post::create($validated);

        return response()->json([
            'message' => 'Tạo bài viết thành công',
            'data'    => $post->load(['author', 'category']),
        ], 201);
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
            'content'          => 'required|string|min:50',
            'excerpt'          => 'nullable|string|max:300',
            'status'           => 'required|in:draft,published',
            'category_post_id' => 'nullable|exists:category_posts,id',
            'thumbnail'        => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',

            // SEO
            'meta_title'       => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
            'meta_keywords'    => 'nullable|string|max:255',
            'canonical_url'    => 'nullable|url|max:500',
            'og_image'         => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',

            'published_at'     => 'nullable|date',
        ], [
            'title.required'       => 'Tiêu đề bài viết là bắt buộc.',
            'content.required'     => 'Nội dung bài viết là bắt buộc.',
            'content.min'          => 'Nội dung bài viết phải có ít nhất 50 ký tự.',
            'meta_title.max'       => 'Meta Title SEO tối đa 60 ký tự (chuẩn Google).',
            'meta_description.max' => 'Meta Description SEO tối đa 160 ký tự (chuẩn Google).',
            'canonical_url.url'    => 'Canonical URL phải là đường dẫn hợp lệ.',
        ]);

        // Cập nhật slug nếu đổi tiêu đề
        if ($validated['title'] !== $post->title) {
            $slug = Str::slug($validated['title']);
            $baseSlug = $slug;
            $count = 1;
            while (Post::where('slug', $slug)->where('id', '!=', $post->id)->exists()) {
                $slug = $baseSlug . '-' . $count++;
            }
            $validated['slug'] = $slug;
        }

        $validated['reading_time'] = Post::calcReadingTime($validated['content']);

        // Tự điền excerpt nếu để trống
        if (empty($validated['excerpt'])) {
            $validated['excerpt'] = Str::limit(strip_tags($validated['content']), 250);
        }

        // Tự điền meta nếu để trống
        if (empty($validated['meta_title'])) {
            $validated['meta_title'] = Str::limit($validated['title'], 60);
        }
        if (empty($validated['meta_description']) && !empty($validated['excerpt'])) {
            $validated['meta_description'] = Str::limit($validated['excerpt'], 160);
        }

        // Set published_at lần đầu đăng
        if ($validated['status'] === 'published' && !$post->published_at) {
            $validated['published_at'] = $validated['published_at'] ?? now();
        }

        if ($request->hasFile('thumbnail')) {
            if ($post->thumbnail) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $post->thumbnail));
            }
            $path = $request->file('thumbnail')->store('posts', 'public');
            $validated['thumbnail'] = '/storage/' . $path;
        }

        if ($request->hasFile('og_image')) {
            if ($post->og_image) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $post->og_image));
            }
            $path = $request->file('og_image')->store('posts/og', 'public');
            $validated['og_image'] = '/storage/' . $path;
        }

        $post->update($validated);

        return response()->json([
            'message' => 'Cập nhật bài viết thành công',
            'data'    => $post->load(['author', 'category']),
        ]);
    }

    public function destroy($id)
    {
        $post = Post::findOrFail($id);

        if ($post->thumbnail) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $post->thumbnail));
        }
        if ($post->og_image) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $post->og_image));
        }

        $post->delete();
        return response()->json(['message' => 'Xóa bài viết thành công']);
    }

    public function categories()
    {
        return response()->json(CategoryPost::all());
    }
}
