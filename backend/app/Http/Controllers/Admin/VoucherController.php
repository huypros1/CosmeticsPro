<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $vouchers = Voucher::orderBy('created_at', 'desc')->get();
        return response()->json([
            'data' => $vouchers
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:vouchers,code',
            'discount_type' => 'required|in:fixed,percent',
            'discount_value' => 'required|numeric|min:0',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'usage_limit' => 'nullable|integer|min:1',
            'status' => 'required|in:active,inactive'
        ]);

        $voucher = Voucher::create($request->all());

        return response()->json([
            'message' => 'Tạo mã giảm giá thành công',
            'data' => $voucher
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $voucher = Voucher::findOrFail($id);
        return response()->json([
            'data' => $voucher
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $voucher = Voucher::findOrFail($id);

        $request->validate([
            'code' => 'required|string|unique:vouchers,code,' . $voucher->id,
            'discount_type' => 'required|in:fixed,percent',
            'discount_value' => 'required|numeric|min:0',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'usage_limit' => 'nullable|integer|min:1',
            'status' => 'required|in:active,inactive'
        ]);

        $voucher->update($request->all());

        return response()->json([
            'message' => 'Cập nhật mã giảm giá thành công',
            'data' => $voucher
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $voucher = Voucher::findOrFail($id);
        $voucher->delete();

        return response()->json([
            'message' => 'Xóa mã giảm giá thành công'
        ]);
    }

    /**
     * Toggle status.
     */
    public function toggleStatus(string $id)
    {
        $voucher = Voucher::findOrFail($id);
        $voucher->status = $voucher->status === 'active' ? 'inactive' : 'active';
        $voucher->save();

        return response()->json([
            'message' => 'Đã thay đổi trạng thái mã giảm giá',
            'data' => $voucher
        ]);
    }
}
