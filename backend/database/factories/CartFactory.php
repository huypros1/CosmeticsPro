<?php

namespace Database\Factories;

use App\Models\Cart;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Cart>
 */
class CartFactory extends Factory
{
    protected $model = Cart::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'variant_id' => ProductVariant::factory(),
            'quantity' => fake()->numberBetween(1, 5),
            'price' => fake()->randomFloat(2, 100000, 5000000),
        ];
    }
}
