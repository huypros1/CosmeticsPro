<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ShippingAddress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private ProductVariant $variant;
    private ShippingAddress $address;

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
            'stock' => 50,
        ]);

        $this->address = ShippingAddress::factory()->create([
            'user_id' => $this->user->id,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Place Order Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_place_order_successfully(): void
    {
        // Add item to cart first
        Cart::factory()->create([
            'user_id' => $this->user->id,
            'variant_id' => $this->variant->id,
            'quantity' => 2,
            'price' => 500000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', [
                'shipping_address_id' => $this->address->id,
                'payment_method' => 'cod',
                'items' => [
                    [
                        'variant_id' => $this->variant->id,
                        'quantity' => 2,
                        'price' => 500000,
                    ],
                ],
                'total_amount' => 1000000,
            ]);

        $response->assertStatus(201)
            ->assertJson(['message' => 'Đặt hàng thành công']);

        $this->assertDatabaseHas('orders', [
            'user_id' => $this->user->id,
            'status' => 'pending',
            'total_amount' => 1000000,
        ]);
    }

    public function test_order_placement_clears_cart(): void
    {
        Cart::factory()->create([
            'user_id' => $this->user->id,
            'variant_id' => $this->variant->id,
            'quantity' => 1,
            'price' => 500000,
        ]);

        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', [
                'shipping_address_id' => $this->address->id,
                'payment_method' => 'cod',
                'items' => [
                    [
                        'variant_id' => $this->variant->id,
                        'quantity' => 1,
                        'price' => 500000,
                    ],
                ],
                'total_amount' => 500000,
            ]);

        $this->assertEquals(0, Cart::where('user_id', $this->user->id)->count());
    }

    public function test_order_placement_decrements_stock(): void
    {
        $originalStock = $this->variant->stock;

        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', [
                'shipping_address_id' => $this->address->id,
                'payment_method' => 'cod',
                'items' => [
                    [
                        'variant_id' => $this->variant->id,
                        'quantity' => 3,
                        'price' => 500000,
                    ],
                ],
                'total_amount' => 1500000,
            ]);

        $this->variant->refresh();
        $this->assertEquals($originalStock - 3, $this->variant->stock);
    }

    public function test_order_placement_fails_with_missing_data(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['shipping_address_id', 'payment_method', 'items', 'total_amount']);
    }

    public function test_vnpay_order_is_automatically_marked_as_paid(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/orders', [
                'shipping_address_id' => $this->address->id,
                'payment_method' => 'vnpay',
                'items' => [
                    [
                        'variant_id' => $this->variant->id,
                        'quantity' => 1,
                        'price' => 500000,
                    ],
                ],
                'total_amount' => 500000,
            ]);

        $response->assertStatus(201);

        $order = Order::where('user_id', $this->user->id)->first();
        $this->assertEquals('paid', $order->payment_status);
    }

    /*
    |--------------------------------------------------------------------------
    | View Orders Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_view_their_orders(): void
    {
        Order::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'shipping_address_id' => $this->address->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/orders');

        $response->assertStatus(200);
    }

    public function test_user_can_view_order_detail(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'shipping_address_id' => $this->address->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/orders/{$order->id}");

        $response->assertStatus(200);
    }

    /*
    |--------------------------------------------------------------------------
    | Cancel Order Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_cancel_pending_order(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'shipping_address_id' => $this->address->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/orders/{$order->id}/cancel");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Đã hủy đơn hàng']);

        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
    }

    public function test_user_cannot_cancel_non_pending_order(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->user->id,
            'shipping_address_id' => $this->address->id,
            'status' => 'processing',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/orders/{$order->id}/cancel");

        $response->assertStatus(400)
            ->assertJson(['message' => 'Không thể hủy đơn hàng ở trạng thái này']);
    }

    public function test_unauthenticated_user_cannot_place_order(): void
    {
        $response = $this->postJson('/api/orders', []);

        $response->assertStatus(401);
    }
}
