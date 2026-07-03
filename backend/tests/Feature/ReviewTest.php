<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewTest extends TestCase
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
    | View Reviews Tests
    |--------------------------------------------------------------------------
    */

    public function test_can_view_reviews_for_product(): void
    {
        Review::factory()->count(3)->create([
            'product_id' => $this->product->id,
        ]);

        $response = $this->getJson("/api/reviews/{$this->product->id}");

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_reviews_are_empty_for_product_without_reviews(): void
    {
        $response = $this->getJson("/api/reviews/{$this->product->id}");

        $response->assertStatus(200);
        $this->assertCount(0, $response->json('data'));
    }

    /*
    |--------------------------------------------------------------------------
    | Create Review Tests
    |--------------------------------------------------------------------------
    */

    public function test_authenticated_user_can_create_review(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/reviews', [
                'product_id' => $this->product->id,
                'rating' => 5,
                'content' => 'Sản phẩm rất tốt, đáng mua!',
            ]);

        $response->assertStatus(201)
            ->assertJson(['message' => 'Đánh giá đã được gửi']);

        $this->assertDatabaseHas('reviews', [
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
            'rating' => 5,
        ]);
    }

    public function test_review_fails_with_missing_required_fields(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/reviews', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['product_id', 'rating', 'content']);
    }

    public function test_review_fails_with_rating_below_1(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/reviews', [
                'product_id' => $this->product->id,
                'rating' => 0,
                'content' => 'Test review',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    }

    public function test_review_fails_with_rating_above_5(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/reviews', [
                'product_id' => $this->product->id,
                'rating' => 6,
                'content' => 'Test review',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    }

    public function test_unauthenticated_user_cannot_create_review(): void
    {
        $response = $this->postJson('/api/reviews', [
            'product_id' => $this->product->id,
            'rating' => 5,
            'content' => 'Test review',
        ]);

        $response->assertStatus(401);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Review Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_delete_own_review(): void
    {
        $review = Review::factory()->create([
            'user_id' => $this->user->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/reviews/{$review->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Đã xóa đánh giá']);

        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    public function test_user_cannot_delete_another_users_review(): void
    {
        $otherUser = User::factory()->create();
        $review = Review::factory()->create([
            'user_id' => $otherUser->id,
            'product_id' => $this->product->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/reviews/{$review->id}");

        // Should fail because query filters by user_id
        $response->assertStatus(404);
    }
}
