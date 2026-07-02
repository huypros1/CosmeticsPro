<?php

namespace App\Http\Controllers;

use App\Models\FlashSale;
use Illuminate\Http\Request;

class FlashSaleController extends Controller
{
    // GET /flash-sales/active — trả về flash sale đang chạy hiện tại
    public function active()
    {
        $sale = FlashSale::active()
            ->with([
                'items.product.category',
                'items.product.brand',
                'items.variant.capacity',
                'items.variant.images',
            ])
            ->first();

        if (!$sale) {
            return response()->json(null);
        }

        return response()->json($sale);
    }
}
