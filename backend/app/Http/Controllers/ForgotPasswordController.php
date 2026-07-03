<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\ResetPasswordMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ForgotPasswordController extends Controller
{
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'Không tìm thấy tài khoản với địa chỉ email này.',
        ]);

        $email = $request->email;
        $token = Str::random(64);

        // Delete any existing tokens for this email
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Create new token
        DB::table('password_reset_tokens')->insert([
            'email' => $email,
            'token' => $token,
            'created_at' => Carbon::now()
        ]);

        // Construct reset URL for frontend
        // Assuming frontend is running on http://localhost:5173
        // In production, this should come from config('app.frontend_url')
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $resetUrl = $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($email);

        // Send email
        Mail::to($email)->send(new ResetPasswordMail($resetUrl));

        return response()->json([
            'message' => 'Đường dẫn khôi phục mật khẩu đã được gửi đến email của bạn.'
        ]);
    }
}
