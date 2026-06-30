<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\ShippingAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $user->name = $request->name;
        $user->save();

        return response()->json([
            'message' => 'Cập nhật thông tin thành công',
            'user' => new UserResource($user)
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar && str_starts_with($user->avatar, '/storage/')) {
            $old = str_replace('/storage/', '', $user->avatar);
            Storage::disk('public')->delete($old);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->avatar = '/storage/' . $path;
        $user->save();

        return response()->json([
            'message' => 'Cập nhật ảnh đại diện thành công',
            'user' => new UserResource($user),
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mật khẩu hiện tại không đúng.'],
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Đổi mật khẩu thành công']);
    }

    public function getAddresses(Request $request)
    {
        $addresses = ShippingAddress::where('user_id', $request->user()->id)->get();
        return response()->json($addresses);
    }

    public function addAddress(Request $request)
    {
        $request->validate([
            'address_line' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
        ]);

        $address = ShippingAddress::create([
            'user_id' => $request->user()->id,
            'address_line' => $request->address_line,
            'phone' => $request->phone,
            'status' => ShippingAddress::where('user_id', $request->user()->id)->count() === 0 // default if first
        ]);

        return response()->json([
            'message' => 'Thêm địa chỉ thành công',
            'address' => $address
        ], 201);
    }

    public function deleteAddress(Request $request, $id)
    {
        $address = ShippingAddress::where('user_id', $request->user()->id)->findOrFail($id);
        $address->delete();

        return response()->json(['message' => 'Đã xóa địa chỉ']);
    }

    public function setDefaultAddress(Request $request, $id)
    {
        $address = ShippingAddress::where('user_id', $request->user()->id)->findOrFail($id);

        ShippingAddress::where('user_id', $request->user()->id)->update(['status' => false]);
        $address->status = true;
        $address->save();

        return response()->json(['message' => 'Đã đặt địa chỉ mặc định']);
    }
}
