<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use App\Models\Review;

class DashboardController extends Controller
{
    public function index()
    {
        // Basic stats
        $totalUsers    = User::count();
        $totalOrders   = Order::count();
        $totalProducts = Product::where('status', 'active')->count();
        $totalReviews  = Review::count();

        // Revenue from delivered orders
        $totalRevenue = Order::where('status', 'delivered')->sum('total_amount');

        // Pending orders count
        $pendingOrders = Order::where('status', 'pending')->count();

        // Recent orders (last 10)
        $recentOrders = Order::with('user')->latest()->take(10)->get();

        // Monthly sales for chart (last 6 months)
        $monthlySales = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $sales = Order::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->where('status', '!=', 'cancelled')
                ->sum('total_amount');

            $monthlySales[] = [
                'month' => $month->format('M Y'),
                'sales' => $sales,
            ];
        }

        // Top selling products (by order items count)
        $topProducts = \DB::table('order_items')
            ->join('product_variants', 'order_items.product_variant_id', '=', 'product_variants.id')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
            ->select('products.name', \DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'total_users'    => $totalUsers,
                'total_orders'   => $totalOrders,
                'total_products' => $totalProducts,
                'total_reviews'  => $totalReviews,
                'total_revenue'  => $totalRevenue,
                'pending_orders' => $pendingOrders,
            ],
            'recent_orders'  => $recentOrders,
            'monthly_sales'  => $monthlySales,
            'top_products'   => $topProducts,
        ]);
    }
}
