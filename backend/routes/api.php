<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\VoucherController;

// Admin Controllers
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\BrandController as AdminBrandController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\UserController as AdminUserController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Auth
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Products & Catalog
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/featured', [ProductController::class, 'featured']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/reviews/{productId}', [ReviewController::class, 'index']);

// Blog
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{slug}', [PostController::class, 'show']);

// Vouchers (validation can be public or protected, but usually requires user auth for usage limit, so we protect it or just let it be public for checking)
Route::post('/vouchers/validate', [VoucherController::class, 'validateVoucher']);


/*
|--------------------------------------------------------------------------
| Protected Routes (Require Authentication)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Profile & Addresses
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);
    Route::get('/profile/addresses', [ProfileController::class, 'getAddresses']);
    Route::post('/profile/addresses', [ProfileController::class, 'addAddress']);
    Route::delete('/profile/addresses/{id}', [ProfileController::class, 'deleteAddress']);
    Route::put('/profile/addresses/{id}/default', [ProfileController::class, 'setDefaultAddress']);

    // Cart
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'add']);
    Route::put('/cart/{id}', [CartController::class, 'update']);
    Route::delete('/cart/clear', [CartController::class, 'clear']);
    Route::delete('/cart/{id}', [CartController::class, 'remove']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);

    // Wishlist
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist', [WishlistController::class, 'add']);
    Route::delete('/wishlist/{productId}', [WishlistController::class, 'remove']);

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Admin Protected Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Manage Categories
    Route::apiResource('categories', AdminCategoryController::class);

    // Manage Brands
    Route::apiResource('brands', AdminBrandController::class);

    // Manage Products
    Route::apiResource('products', AdminProductController::class);

    // Manage Orders
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
    Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);

    // Manage Users
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::put('/users/{id}/role', [AdminUserController::class, 'updateRole']);
    Route::put('/users/{id}/status', [AdminUserController::class, 'updateStatus']);
});

