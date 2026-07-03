<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use App\Models\Review;

class DashboardController extends Controller
{
    public function index(Request $request)
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

        $timeframe = $request->get('timeframe', 'year'); // week, month, year
        $chartData = [];

        if ($timeframe === 'week') {
            // Last 7 days
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $sales = Order::whereDate('created_at', $date->format('Y-m-d'))
                    ->where('status', '!=', 'cancelled')
                    ->sum('total_amount');
                $chartData[] = [
                    'label' => $date->format('d/m'),
                    'sales' => (float) $sales,
                ];
            }
        } elseif ($timeframe === 'month') {
            // Last 30 days (grouped by chunks, or just 30 days. Let's do 30 days every 3 days maybe? Or just 30 days straight)
            // 30 days is okay for a chart, but maybe last 4 weeks is better. Let's just do last 30 days.
            for ($i = 29; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $sales = Order::whereDate('created_at', $date->format('Y-m-d'))
                    ->where('status', '!=', 'cancelled')
                    ->sum('total_amount');
                $chartData[] = [
                    'label' => $date->format('d/m'),
                    'sales' => (float) $sales,
                ];
            }
        } else {
            // Year: last 12 months
            for ($i = 11; $i >= 0; $i--) {
                $month = now()->subMonths($i);
                $sales = Order::whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->where('status', '!=', 'cancelled')
                    ->sum('total_amount');
                $chartData[] = [
                    'label' => $month->format('m/Y'),
                    'sales' => (float) $sales,
                ];
            }
        }

        // Top selling products (by order items count)
        $topProducts = DB::table('order_items')
            ->join('product_variants', 'order_items.product_variant_id', '=', 'product_variants.id')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        // Orders count by status
        $ordersByStatus = Order::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return response()->json([
            'stats' => [
                'total_users'    => $totalUsers,
                'total_orders'   => $totalOrders,
                'total_products' => $totalProducts,
                'total_reviews'  => $totalReviews,
                'total_revenue'  => $totalRevenue,
                'pending_orders' => $pendingOrders,
            ],
            'orders_by_status' => $ordersByStatus,
            'recent_orders'  => $recentOrders,
            'chart_data'     => $chartData,
            'top_products'   => $topProducts,
        ]);
    }
}
