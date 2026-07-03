<?php

namespace Database\Factories;

use App\Models\Capacity;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Capacity>
 */
class CapacityFactory extends Factory
{
    protected $model = Capacity::class;

    public function definition(): array
    {
        return [
            'value' => fake()->randomElement(['50', '100', '150', '200', '250', '500']),
            'unit' => fake()->randomElement(['ml', 'g']),
        ];
    }
}
