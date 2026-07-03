<?php

namespace Tests\Feature;

use App\Models\ShippingAddress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'password' => Hash::make('oldpassword123'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Update Profile Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_update_name(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson('/api/profile', [
                'name' => 'Tên Mới',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Cập nhật thông tin thành công']);

        $this->user->refresh();
        $this->assertEquals('Tên Mới', $this->user->name);
    }

    public function test_update_profile_fails_without_name(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson('/api/profile', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /*
    |--------------------------------------------------------------------------
    | Change Password Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_change_password(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson('/api/profile/password', [
                'current_password' => 'oldpassword123',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Đổi mật khẩu thành công']);

        $this->user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $this->user->password));
    }

    public function test_change_password_fails_with_wrong_current_password(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson('/api/profile/password', [
                'current_password' => 'wrongpassword',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_change_password_fails_with_short_new_password(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson('/api/profile/password', [
                'current_password' => 'oldpassword123',
                'password' => '1234567',
                'password_confirmation' => '1234567',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /*
    |--------------------------------------------------------------------------
    | Address Management Tests
    |--------------------------------------------------------------------------
    */

    public function test_user_can_get_addresses(): void
    {
        ShippingAddress::factory()->count(2)->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/profile/addresses');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json());
    }

    public function test_user_can_add_new_address(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/profile/addresses', [
                'address_line' => '123 Đường ABC, Quận 1, TP.HCM',
                'phone' => '0901234567',
            ]);

        $response->assertStatus(201)
            ->assertJson(['message' => 'Thêm địa chỉ thành công']);

        $this->assertDatabaseHas('shipping_addresses', [
            'user_id' => $this->user->id,
            'address_line' => '123 Đường ABC, Quận 1, TP.HCM',
            'phone' => '0901234567',
        ]);
    }

    public function test_first_address_is_set_as_default(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/profile/addresses', [
                'address_line' => '123 Đường ABC',
                'phone' => '0901234567',
            ]);

        $response->assertStatus(201);

        $address = ShippingAddress::where('user_id', $this->user->id)->first();
        $this->assertTrue((bool) $address->status);
    }

    public function test_user_can_delete_address(): void
    {
        $address = ShippingAddress::factory()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/profile/addresses/{$address->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Đã xóa địa chỉ']);

        $this->assertDatabaseMissing('shipping_addresses', ['id' => $address->id]);
    }

    public function test_user_can_set_default_address(): void
    {
        $address1 = ShippingAddress::factory()->create([
            'user_id' => $this->user->id,
            'status' => true,
        ]);
        $address2 = ShippingAddress::factory()->create([
            'user_id' => $this->user->id,
            'status' => false,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/profile/addresses/{$address2->id}/default");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Đã đặt địa chỉ mặc định']);

        $address1->refresh();
        $address2->refresh();
        $this->assertFalse((bool) $address1->status);
        $this->assertTrue((bool) $address2->status);
    }

    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $response = $this->putJson('/api/profile', ['name' => 'Test']);

        $response->assertStatus(401);
    }
}
