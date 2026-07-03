<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\ShippingAddress;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'shipping_address_id' => ShippingAddress::factory(),
            'payment_method' => fake()->randomElement(['cod', 'vnpay', 'momo']),
            'voucher_id' => null,
            'shipping_fee' => 30000,
            'total_amount' => fake()->randomFloat(2, 200000, 10000000),
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ];
    }

    /**
     * Set order as delivered.
     */
    public function delivered(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'delivered',
            'payment_status' => 'paid',
        ]);
    }

    /**
     * Set order as processing.
     */
    public function processing(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'processing',
        ]);
    }

    /**
     * Set order as cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'cancelled',
        ]);
    }
}
