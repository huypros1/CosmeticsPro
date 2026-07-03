<?php

namespace Database\Factories;

use App\Models\Voucher;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Voucher>
 */
class VoucherFactory extends Factory
{
    protected $model = Voucher::class;

    public function definition(): array
    {
        return [
            'code' => strtoupper(Str::random(8)),
            'discount_type' => 'fixed',
            'discount_value' => 50000,
            'start_date' => now()->subDay(),
            'end_date' => now()->addMonth(),
            'usage_limit' => 100,
            'used_count' => 0,
            'min_order' => 200000,
            'status' => 'active',
        ];
    }

    /**
     * Create a percent-based voucher.
     */
    public function percent(float $value = 10): static
    {
        return $this->state(fn(array $attributes) => [
            'discount_type' => 'percent',
            'discount_value' => $value,
        ]);
    }

    /**
     * Create an expired voucher.
     */
    public function expired(): static
    {
        return $this->state(fn(array $attributes) => [
            'start_date' => now()->subMonth(),
            'end_date' => now()->subDay(),
        ]);
    }

    /**
     * Create a not-yet-active voucher.
     */
    public function future(): static
    {
        return $this->state(fn(array $attributes) => [
            'start_date' => now()->addDay(),
            'end_date' => now()->addMonth(),
        ]);
    }

    /**
     * Create an inactive voucher.
     */
    public function inactive(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    /**
     * Create a fully used voucher.
     */
    public function exhausted(): static
    {
        return $this->state(fn(array $attributes) => [
            'usage_limit' => 10,
            'used_count' => 10,
        ]);
    }
}
