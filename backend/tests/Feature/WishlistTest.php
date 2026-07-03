<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WishlistTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $category = Category::factory()->create();
        $brand = Brand::factory()->create();
        $this->product = Product::factory()->create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | View Wishlist Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_view_wishlist(): void
    {
        WishlistItem::factory()->create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/wishlist');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_user_cannot_view_wishlist(): void
    {
        $response = $this->getJson('/api/wishlist');

        $response->assertStatus(401);
    }

    /*
    |--------------------------------------------------------------------------
    | Add to Wishlist Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_add_product_to_wishlist(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/wishlist', [
                'product_id' => $this->product->id,
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Đã thêm vào danh sách yêu thích']);

        $this->assertDatabaseHas('wishlist_items', [
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
        ]);
    }

    public function test_adding_duplicate_product_to_wishlist_does_not_create_duplicate(): void
    {
        WishlistItem::factory()->create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/wishlist', [
                'product_id' => $this->product->id,
            ]);

        $response->assertStatus(200);

        $this->assertEquals(
            1,
            WishlistItem::where('user_id', $this->user->id)
                ->where('product_id', $this->product->id)
                ->count()
        );
    }

    public function test_cannot_add_nonexistent_product_to_wishlist(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/wishlist', [
                'product_id' => 99999,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['product_id']);
    }

    /*
    |--------------------------------------------------------------------------
    | Remove from Wishlist Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_remove_product_from_wishlist(): void
    {
        WishlistItem::factory()->create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/wishlist/{$this->product->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Đã xóa khỏi danh sách yêu thích']);

        $this->assertDatabaseMissing('wishlist_items', [
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
        ]);
    }
}
