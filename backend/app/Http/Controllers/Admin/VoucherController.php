<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Models\Order;
use Illuminate\Http\Request;
use Carbon\Carbon;

class VoucherController extends Controller
{
    public function index()
    {
        $vouchers = Voucher::orderBy('created_at', 'desc')->get();
        return response()->json(['data' => $vouchers]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code'                => 'required|string|max:50|uppercase|regex:/^[A-Z0-9_]+$/|unique:vouchers,code',
            'description'         => 'nullable|string|max:255',
            'discount_type'       => 'required|in:fixed,percent',
            'discount_value'      => [
                'required', 'numeric', 'min:0.01',
                // Nếu percent, không được vượt quá 100
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->discount_type === 'percent' && $value > 100) {
                        $fail('Phần trăm giảm giá không được vượt quá 100%.');
                    }
                    if ($request->discount_type === 'fixed' && $value < 1000) {
                        $fail('Số tiền giảm giá cố định phải ít nhất 1,000đ.');
                    }
                },
            ],
            'min_order_value'     => 'nullable|numeric|min:0',
            'max_discount_amount' => [
                'nullable', 'numeric', 'min:0',
                // Chỉ có nghĩa khi discount_type = percent
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->discount_type === 'fixed' && !empty($value)) {
                        $fail('Giới hạn giảm tối đa chỉ áp dụng cho loại giảm theo phần trăm.');
                    }
                },
            ],
            'start_date'          => 'required|date|after_or_equal:today',
            'end_date'            => 'required|date|after:start_date',
            'usage_limit'         => 'nullable|integer|min:1|max:100000',
            'max_uses_per_user'   => 'nullable|integer|min:1|max:100',
            'status'              => 'required|in:active,inactive',
        ], [
            'code.required'             => 'Mã voucher là bắt buộc.',
            'code.max'                  => 'Mã voucher không được vượt quá 50 ký tự.',
            'code.regex'                => 'Mã voucher chỉ được chứa chữ cái in hoa, số và dấu gạch dưới.',
            'code.unique'               => 'Mã voucher này đã tồn tại.',
            'discount_type.required'    => 'Vui lòng chọn loại giảm giá.',
            'discount_type.in'          => 'Loại giảm giá phải là "fixed" (cố định) hoặc "percent" (phần trăm).',
            'discount_value.required'   => 'Giá trị giảm giá là bắt buộc.',
            'discount_value.min'        => 'Giá trị giảm giá phải lớn hơn 0.',
            'min_order_value.min'       => 'Giá trị đơn hàng tối thiểu không được âm.',
            'max_discount_amount.min'   => 'Giới hạn giảm tối đa không được âm.',
            'start_date.required'       => 'Ngày bắt đầu là bắt buộc.',
            'start_date.after_or_equal' => 'Ngày bắt đầu không được là ngày trong quá khứ.',
            'end_date.required'         => 'Ngày kết thúc là bắt buộc.',
            'end_date.after'            => 'Ngày kết thúc phải sau ngày bắt đầu.',
            'usage_limit.min'           => 'Giới hạn lượt dùng phải ít nhất là 1.',
            'usage_limit.max'           => 'Giới hạn lượt dùng không được vượt quá 100,000.',
            'max_uses_per_user.min'     => 'Số lần dùng tối đa mỗi user phải ít nhất là 1.',
            'max_uses_per_user.max'     => 'Số lần dùng tối đa mỗi user không được vượt quá 100.',
            'status.required'           => 'Trạng thái là bắt buộc.',
            'status.in'                 => 'Trạng thái phải là "active" hoặc "inactive".',
        ]);

        $voucher = Voucher::create($request->only([
            'code', 'description', 'discount_type', 'discount_value',
            'min_order_value', 'max_discount_amount', 'start_date', 'end_date',
            'usage_limit', 'max_uses_per_user', 'status',
        ]));

        return response()->json([
            'message' => 'Tạo mã giảm giá thành công',
            'data'    => $voucher,
        ], 201);
    }

    public function show(string $id)
    {
        $voucher = Voucher::findOrFail($id);
        return response()->json(['data' => $voucher]);
    }

    public function update(Request $request, string $id)
    {
        $voucher = Voucher::findOrFail($id);

        // Chặn sửa voucher đã được dùng nhiều (chỉ cho sửa thông tin không ảnh hưởng nghiệp vụ)
        $request->validate([
            'code'                => 'required|string|max:50|regex:/^[A-Z0-9_]+$/|unique:vouchers,code,' . $voucher->id,
            'description'         => 'nullable|string|max:255',
            'discount_type'       => 'required|in:fixed,percent',
            'discount_value'      => [
                'required', 'numeric', 'min:0.01',
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->discount_type === 'percent' && $value > 100) {
                        $fail('Phần trăm giảm giá không được vượt quá 100%.');
                    }
                    if ($request->discount_type === 'fixed' && $value < 1000) {
                        $fail('Số tiền giảm giá cố định phải ít nhất 1,000đ.');
                    }
                },
            ],
            'min_order_value'     => 'nullable|numeric|min:0',
            'max_discount_amount' => [
                'nullable', 'numeric', 'min:0',
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->discount_type === 'fixed' && !empty($value)) {
                        $fail('Giới hạn giảm tối đa chỉ áp dụng cho loại giảm theo phần trăm.');
                    }
                },
            ],
            'start_date'          => 'required|date',
            'end_date'            => 'required|date|after:start_date',
            'usage_limit'         => 'nullable|integer|min:1|max:100000',
            'max_uses_per_user'   => 'nullable|integer|min:1|max:100',
            'status'              => 'required|in:active,inactive',
        ], [
            'code.required'           => 'Mã voucher là bắt buộc.',
            'code.regex'              => 'Mã voucher chỉ được chứa chữ cái in hoa, số và dấu gạch dưới.',
            'code.unique'             => 'Mã voucher này đã tồn tại.',
            'discount_type.required'  => 'Vui lòng chọn loại giảm giá.',
            'discount_value.required' => 'Giá trị giảm giá là bắt buộc.',
            'end_date.after'          => 'Ngày kết thúc phải sau ngày bắt đầu.',
            'usage_limit.min'         => 'Giới hạn lượt dùng phải ít nhất là 1.',
            'status.required'         => 'Trạng thái là bắt buộc.',
        ]);

        // Không được giảm usage_limit xuống thấp hơn số lần đã dùng
        if ($request->filled('usage_limit') && $request->usage_limit < $voucher->used_count) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => [
                    'usage_limit' => ["Giới hạn lượt dùng ({$request->usage_limit}) không được nhỏ hơn số lần đã sử dụng ({$voucher->used_count})."],
                ],
            ], 422);
        }

        $voucher->update($request->only([
            'code', 'description', 'discount_type', 'discount_value',
            'min_order_value', 'max_discount_amount', 'start_date', 'end_date',
            'usage_limit', 'max_uses_per_user', 'status',
        ]));

        return response()->json([
            'message' => 'Cập nhật mã giảm giá thành công',
            'data'    => $voucher,
        ]);
    }

    public function destroy(string $id)
    {
        $voucher = Voucher::findOrFail($id);

        // Chặn xóa nếu voucher đã được dùng trong đơn hàng
        $usedInOrders = Order::where('voucher_id', $voucher->id)
            ->whereNotIn('status', ['cancelled'])
            ->count();

        if ($usedInOrders > 0) {
            return response()->json([
                'message' => "Không thể xóa mã giảm giá đã được sử dụng trong {$usedInOrders} đơn hàng. Vui lòng đặt trạng thái 'inactive' thay vì xóa.",
            ], 422);
        }

        $voucher->delete();
        return response()->json(['message' => 'Xóa mã giảm giá thành công']);
    }

    public function toggleStatus(string $id)
    {
        $voucher = Voucher::findOrFail($id);
        $voucher->status = $voucher->status === 'active' ? 'inactive' : 'active';
        $voucher->save();

        return response()->json([
            'message' => 'Đã thay đổi trạng thái mã giảm giá',
            'data'    => $voucher,
        ]);
    }
}
