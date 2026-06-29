<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Brand;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class BrandController extends Controller
{
    public function index()
    {
        return Brand::latest()->paginate(10);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('brands', 'public');
            $validated['logo'] = '/storage/' . $path;
        }

        $brand = Brand::create($validated);
        return response()->json($brand, 201);
    }

    public function show($id)
    {
        return Brand::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $brand = Brand::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        if (isset($validated['name']) && $validated['name'] !== $brand->name) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($brand->logo) {
                $oldPath = str_replace('/storage/', '', $brand->logo);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('logo')->store('brands', 'public');
            $validated['logo'] = '/storage/' . $path;
        }

        $brand->update($validated);
        return response()->json($brand);
    }

    public function destroy($id)
    {
        $brand = Brand::findOrFail($id);
        
        if ($brand->logo) {
            $oldPath = str_replace('/storage/', '', $brand->logo);
            Storage::disk('public')->delete($oldPath);
        }

        $brand->delete();
        return response()->json(['message' => 'Brand deleted']);
    }
}
