<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Order;
use App\Models\User;
use App\Models\Product;

class DashboardController extends Controller
{
    public function index()
    {
        // Basic stats
        $totalUsers = User::count();
        $totalOrders = Order::count();
        $totalProducts = Product::count();
        
        // Sum total amount of successful orders
        $totalRevenue = Order::where('status', 'delivered')->sum('total_amount');
        
        // Recent orders
        $recentOrders = Order::with('user')->latest()->take(5)->get();
        
        // Monthly sales for chart (last 6 months) - simplified approach
        $monthlySales = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $sales = Order::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->where('status', '!=', 'cancelled')
                ->sum('total_amount');
                
            $monthlySales[] = [
                'month' => $month->format('M Y'),
                'sales' => $sales
            ];
        }

        return response()->json([
            'stats' => [
                'total_users' => $totalUsers,
                'total_orders' => $totalOrders,
                'total_products' => $totalProducts,
                'total_revenue' => $totalRevenue
            ],
            'recent_orders' => $recentOrders,
            'monthly_sales' => $monthlySales
        ]);
    }
}
