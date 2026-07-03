<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    private function createProductWithVariant(array $productAttrs = [], array $variantAttrs = []): Product
    {
        $category = Category::factory()->create();
        $brand = Brand::factory()->create();

        $product = Product::factory()->create(array_merge([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ], $productAttrs));

        ProductVariant::factory()->create(array_merge([
            'product_id' => $product->id,
        ], $variantAttrs));

        return $product;
    }

    /*
    |--------------------------------------------------------------------------
    | Product Listing Tests
    |--------------------------------------------------------------------------
    */

    public function test_can_get_paginated_product_list(): void
    {
        $category = Category::factory()->create();
        $brand = Brand::factory()->create();

        Product::factory()->count(15)->create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'links',
                'meta',
            ]);

        // Default pagination is 12
        $this->assertCount(12, $response->json('data'));
    }

    public function test_inactive_products_are_not_listed(): void
    {
        $this->createProductWithVariant(['status' => 'active']);
        $this->createProductWithVariant(['status' => 'inactive']);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_can_filter_products_by_category(): void
    {
        $cat1 = Category::factory()->create(['slug' => 'skincare']);
        $cat2 = Category::factory()->create(['slug' => 'makeup']);
        $brand = Brand::factory()->create();

        Product::factory()->count(3)->create([
            'category_id' => $cat1->id,
            'brand_id' => $brand->id,
        ]);
        Product::factory()->count(2)->create([
            'category_id' => $cat2->id,
            'brand_id' => $brand->id,
        ]);

        $response = $this->getJson('/api/products?category=skincare');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_can_filter_products_by_brand(): void
    {
        $category = Category::factory()->create();
        $brand1 = Brand::factory()->create(['slug' => 'loreal']);
        $brand2 = Brand::factory()->create(['slug' => 'innisfree']);

        Product::factory()->count(2)->create([
            'category_id' => $category->id,
            'brand_id' => $brand1->id,
        ]);
        Product::factory()->create([
            'category_id' => $category->id,
            'brand_id' => $brand2->id,
        ]);

        $response = $this->getJson('/api/products?brand=loreal');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_can_search_products_by_name(): void
    {
        $category = Category::factory()->create();
        $brand = Brand::factory()->create();

        Product::factory()->create([
            'name' => 'Kem dưỡng ẩm Vitamin C',
            'slug' => 'kem-duong-am-vitamin-c',
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);
        Product::factory()->create([
            'name' => 'Son môi đỏ',
            'slug' => 'son-moi-do',
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);

        $response = $this->getJson('/api/products?search=Vitamin');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_can_sort_products(): void
    {
        $category = Category::factory()->create();
        $brand = Brand::factory()->create();

        Product::factory()->create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);
        Product::factory()->create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);

        $response = $this->getJson('/api/products?sort=newest');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    /*
    |--------------------------------------------------------------------------
    | Product Detail Tests
    |--------------------------------------------------------------------------
    */

    public function test_can_view_product_detail_by_slug(): void
    {
        $product = $this->createProductWithVariant(['slug' => 'test-product']);

        $response = $this->getJson('/api/products/test-product');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['id', 'name', 'slug', 'description'],
            ]);
    }

    public function test_returns_404_for_nonexistent_product(): void
    {
        $response = $this->getJson('/api/products/nonexistent-slug');

        $response->assertStatus(404);
    }

    public function test_inactive_product_returns_404(): void
    {
        $this->createProductWithVariant([
            'slug' => 'inactive-product',
            'status' => 'inactive',
        ]);

        $response = $this->getJson('/api/products/inactive-product');

        $response->assertStatus(404);
    }

    /*
    |--------------------------------------------------------------------------
    | Featured / New / On Sale / Related Tests
    |--------------------------------------------------------------------------
    */

    public function test_can_get_featured_products(): void
    {
        $category = Category::factory()->create();
        $brand = Brand::factory()->create();

        Product::factory()->count(3)->create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'is_featured' => true,
        ]);
        Product::factory()->create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'is_featured' => false,
        ]);

        $response = $this->getJson('/api/products/featured');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_can_get_new_arrivals(): void
    {
        $category = Category::factory()->create();
        $brand = Brand::factory()->create();

        Product::factory()->count(5)->create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);

        $response = $this->getJson('/api/products/new-arrivals');

        $response->assertStatus(200);
        $this->assertCount(5, $response->json('data'));
    }

    public function test_can_get_on_sale_products(): void
    {
        $category = Category::factory()->create();
        $brand = Brand::factory()->create();

        // Product with sale price
        $product1 = Product::factory()->create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);
        ProductVariant::factory()->create([
            'product_id' => $product1->id,
            'sale_price' => 500000,
            'price' => 1000000,
        ]);

        // Product without sale price
        $product2 = Product::factory()->create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);
        ProductVariant::factory()->create([
            'product_id' => $product2->id,
            'sale_price' => null,
            'price' => 1000000,
        ]);

        $response = $this->getJson('/api/products/on-sale');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_can_get_related_products(): void
    {
        $category = Category::factory()->create();
        $brand = Brand::factory()->create();

        $product = Product::factory()->create([
            'slug' => 'main-product',
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);

        // Related products (same category)
        Product::factory()->count(3)->create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);

        // Different category
        $otherCategory = Category::factory()->create();
        Product::factory()->create([
            'category_id' => $otherCategory->id,
            'brand_id' => $brand->id,
        ]);

        $response = $this->getJson("/api/products/main-product/related");

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }
}
