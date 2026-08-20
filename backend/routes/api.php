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
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\FlashSaleController;

// Admin Controllers
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\BrandController as AdminBrandController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\PostController as AdminPostController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Admin\FlashSaleController as AdminFlashSaleController;
use App\Http\Controllers\Admin\ProductImageController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Auth
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login'])->name('login');
Route::post('/auth/forgot-password', [\App\Http\Controllers\ForgotPasswordController::class, 'sendResetLinkEmail']);
Route::post('/auth/reset-password', [\App\Http\Controllers\ResetPasswordController::class, 'reset']);

// Products & Catalog
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/featured', [ProductController::class, 'featured']);
Route::get('/products/new-arrivals', [ProductController::class, 'newArrivals']);
Route::get('/products/on-sale', [ProductController::class, 'onSale']);
Route::get('/products/{slug}/related', [ProductController::class, 'related']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/brands', [BrandController::class, 'index']);
Route::get('/reviews/{productId}', [ReviewController::class, 'index']);

// Blog
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{slug}', [PostController::class, 'show']);

// Vouchers
Route::post('/vouchers/validate', [VoucherController::class, 'validateVoucher']);

// Flash Sales (public)
Route::get('/flash-sales/active', [FlashSaleController::class, 'active']);


/*
|--------------------------------------------------------------------------
| Protected Routes (Require Authentication)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Profile
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);

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
    Route::get('/orders/{orderId}/reviewable', [ReviewController::class, 'reviewableByOrder']);

    // Payment - VietQR
    Route::post('/payment/vietqr', [PaymentController::class, 'generateVietQR']);
    Route::get('/payment/status/{orderId}', [PaymentController::class, 'checkStatus']);
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
    Route::patch('/products/{id}/toggle-status', [AdminProductController::class, 'toggleStatus']);

    // Manage Orders
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
    Route::put('/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);

    // Product Gallery Images
    Route::get('/products/{id}/images', [ProductImageController::class, 'index']);
    Route::post('/products/{id}/images', [ProductImageController::class, 'store']);
    Route::delete('/products/{id}/images/{imageId}', [ProductImageController::class, 'destroy']);
    Route::put('/products/{id}/images/reorder', [ProductImageController::class, 'reorder']);

    // Manage Users
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::put('/users/{id}/role', [AdminUserController::class, 'updateRole']);
    Route::put('/users/{id}/status', [AdminUserController::class, 'updateStatus']);

    // Manage Posts (Blog)
    Route::get('/posts/categories', [AdminPostController::class, 'categories']);
    Route::apiResource('posts', AdminPostController::class);

    // Manage Reviews
    Route::get('/reviews', [AdminReviewController::class, 'index']);
    Route::delete('/reviews/{id}', [AdminReviewController::class, 'destroy']);
    Route::post('/reviews/{id}/reply', [AdminReviewController::class, 'reply']);
    Route::delete('/reviews/{id}/reply', [AdminReviewController::class, 'deleteReply']);

    // Manage Flash Sales
    Route::apiResource('flash-sales', AdminFlashSaleController::class);
    Route::patch('/flash-sales/{id}/toggle-status', [AdminFlashSaleController::class, 'toggleStatus']);

    // Manage Vouchers
    Route::apiResource('vouchers', \App\Http\Controllers\Admin\VoucherController::class);
    Route::patch('/vouchers/{id}/toggle-status', [\App\Http\Controllers\Admin\VoucherController::class, 'toggleStatus']);

    // Payment Confirmation
    Route::post('/payment/{orderId}/confirm', [PaymentController::class, 'adminConfirmPayment']);
});
