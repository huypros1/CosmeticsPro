<?php

namespace Database\Factories;

use App\Models\Capacity;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'capacity_id' => Capacity::factory(),
            'price' => fake()->randomFloat(2, 100000, 5000000),
            'sale_price' => null,
            'stock' => fake()->numberBetween(10, 100),
        ];
    }

    /**
     * Set a sale price for the variant.
     */
    public function onSale(): static
    {
        return $this->state(function (array $attributes) {
            $price = $attributes['price'] ?? 1000000;
            return [
                'sale_price' => round($price * 0.8, 2),
            ];
        });
    }

    /**
     * Set stock to zero.
     */
    public function outOfStock(): static
    {
        return $this->state(fn(array $attributes) => [
            'stock' => 0,
        ]);
    }
}
