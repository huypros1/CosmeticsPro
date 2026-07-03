<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private ProductVariant $variant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $category = Category::factory()->create();
        $brand = Brand::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);
        $this->variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'price' => 500000,
            'stock' => 20,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | View Cart Tests
    |--------------------------------------------------------------------------
    */

    public function test_authenticated_user_can_view_cart(): void
    {
        Cart::factory()->create([
            'user_id' => $this->user->id,
            'variant_id' => $this->variant->id,
            'quantity' => 2,
            'price' => 500000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/cart');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_unauthenticated_user_cannot_view_cart(): void
    {
        $response = $this->getJson('/api/cart');

        $response->assertStatus(401);
    }

    /*
    |--------------------------------------------------------------------------
    | Add to Cart Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_add_product_to_cart(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/cart', [
                'variant_id' => $this->variant->id,
                'quantity' => 2,
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Đã thêm vào giỏ hàng']);

        $this->assertDatabaseHas('carts', [
            'user_id' => $this->user->id,
            'variant_id' => $this->variant->id,
            'quantity' => 2,
        ]);
    }

    public function test_adding_existing_product_increases_quantity(): void
    {
        Cart::factory()->create([
            'user_id' => $this->user->id,
            'variant_id' => $this->variant->id,
            'quantity' => 2,
            'price' => 500000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/cart', [
                'variant_id' => $this->variant->id,
                'quantity' => 3,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('carts', [
            'user_id' => $this->user->id,
            'variant_id' => $this->variant->id,
            'quantity' => 5,
        ]);
    }

    public function test_cannot_add_product_exceeding_stock(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/cart', [
                'variant_id' => $this->variant->id,
                'quantity' => 999,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);
    }

    public function test_cannot_add_nonexistent_variant(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/cart', [
                'variant_id' => 99999,
                'quantity' => 1,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['variant_id']);
    }

    /*
    |--------------------------------------------------------------------------
    | Update Cart Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_update_cart_item_quantity(): void
    {
        $cartItem = Cart::factory()->create([
            'user_id' => $this->user->id,
            'variant_id' => $this->variant->id,
            'quantity' => 2,
            'price' => 500000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/cart/{$cartItem->id}", [
                'quantity' => 5,
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Đã cập nhật giỏ hàng']);

        $this->assertDatabaseHas('carts', [
            'id' => $cartItem->id,
            'quantity' => 5,
        ]);
    }

    public function test_cannot_update_cart_item_exceeding_stock(): void
    {
        $cartItem = Cart::factory()->create([
            'user_id' => $this->user->id,
            'variant_id' => $this->variant->id,
            'quantity' => 2,
            'price' => 500000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/cart/{$cartItem->id}", [
                'quantity' => 999,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);
    }

    /*
    |--------------------------------------------------------------------------
    | Remove / Clear Cart Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_remove_item_from_cart(): void
    {
        $cartItem = Cart::factory()->create([
            'user_id' => $this->user->id,
            'variant_id' => $this->variant->id,
            'quantity' => 1,
            'price' => 500000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/cart/{$cartItem->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Đã xóa khỏi giỏ hàng']);

        $this->assertDatabaseMissing('carts', ['id' => $cartItem->id]);
    }

    public function test_user_can_clear_entire_cart(): void
    {
        Cart::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'variant_id' => $this->variant->id,
            'price' => 500000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson('/api/cart/clear');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Đã làm sạch giỏ hàng']);

        $this->assertEquals(0, Cart::where('user_id', $this->user->id)->count());
    }
}
