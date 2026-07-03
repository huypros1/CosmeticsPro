<?php

namespace Database\Factories;

use App\Models\ShippingAddress;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShippingAddress>
 */
class ShippingAddressFactory extends Factory
{
    protected $model = ShippingAddress::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'address_line' => fake()->address(),
            'phone' => fake()->phoneNumber(),
            'status' => false,
        ];
    }

    /**
     * Mark as default address.
     */
    public function default(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => true,
        ]);
    }
}
