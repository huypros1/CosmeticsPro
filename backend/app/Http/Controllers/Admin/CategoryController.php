<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Category;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::latest();
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        return $query->paginate(10);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string|max:1000',
            'parent_id'   => 'nullable|exists:categories,id',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ], [
            'name.required'   => 'Tên danh mục là bắt buộc.',
            'name.max'        => 'Tên danh mục không được vượt quá 255 ký tự.',
            'name.unique'     => 'Tên danh mục đã tồn tại.',
            'parent_id.exists' => 'Danh mục cha không tồn tại.',
            'image.image'     => 'Tệp tải lên phải là ảnh.',
            'image.mimes'     => 'Ảnh phải có định dạng jpeg, png, jpg, gif hoặc webp.',
            'image.max'       => 'Kích thước ảnh không được vượt quá 5MB.',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        // Đảm bảo slug không bị trùng
        $originalSlug = $validated['slug'];
        $count = 1;
        while (Category::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $originalSlug . '-' . $count++;
        }

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('categories', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        $category = Category::create($validated);
        return response()->json([
            'message' => 'Tạo danh mục thành công',
            'data'    => $category,
        ], 201);
    }

    public function show($id)
    {
        return Category::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string|max:1000',
            'parent_id'   => [
                'nullable',
                'exists:categories,id',
                // Không cho phép đặt chính mình làm cha
                function ($attribute, $value, $fail) use ($category) {
                    if ($value == $category->id) {
                        $fail('Danh mục không thể là cha của chính nó.');
                    }
                },
            ],
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ], [
            'name.required'   => 'Tên danh mục là bắt buộc.',
            'name.max'        => 'Tên danh mục không được vượt quá 255 ký tự.',
            'name.unique'     => 'Tên danh mục đã tồn tại.',
            'parent_id.exists' => 'Danh mục cha không tồn tại.',
            'image.image'     => 'Tệp tải lên phải là ảnh.',
            'image.mimes'     => 'Ảnh phải có định dạng jpeg, png, jpg, gif hoặc webp.',
            'image.max'       => 'Kích thước ảnh không được vượt quá 5MB.',
        ]);

        if ($validated['name'] !== $category->name) {
            $slug = Str::slug($validated['name']);
            $originalSlug = $slug;
            $count = 1;
            while (Category::where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
                $slug = $originalSlug . '-' . $count++;
            }
            $validated['slug'] = $slug;
        }

        if ($request->hasFile('image')) {
            if ($category->image) {
                $oldPath = str_replace('/storage/', '', $category->image);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('categories', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        $category->update($validated);
        return response()->json([
            'message' => 'Cập nhật danh mục thành công',
            'data'    => $category,
        ]);
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        // Chặn xóa nếu còn sản phẩm trong danh mục
        if ($category->products()->count() > 0) {
            return response()->json([
                'message' => 'Không thể xóa danh mục đang có sản phẩm. Vui lòng chuyển sản phẩm sang danh mục khác trước.',
            ], 422);
        }

        // Chặn xóa nếu còn danh mục con
        if ($category->children()->count() > 0) {
            return response()->json([
                'message' => 'Không thể xóa danh mục đang có danh mục con.',
            ], 422);
        }

        if ($category->image) {
            $oldPath = str_replace('/storage/', '', $category->image);
            Storage::disk('public')->delete($oldPath);
        }

        $category->delete();
        return response()->json(['message' => 'Xóa danh mục thành công']);
    }
}
