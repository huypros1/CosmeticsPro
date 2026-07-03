<?php

namespace Database\Factories;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);
        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->paragraph(),
            'image' => null,
            'category_id' => Category::factory(),
            'brand_id' => Brand::factory(),
            'is_featured' => false,
            'status' => 'active',
        ];
    }

    /**
     * Mark product as featured.
     */
    public function featured(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_featured' => true,
        ]);
    }

    /**
     * Mark product as inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'inactive',
        ]);
    }
}
