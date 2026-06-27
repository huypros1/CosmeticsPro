<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Capacity;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Image;
use App\Models\Voucher;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Users
        User::create([
            'name' => 'HQCosmetic Admin',
            'email' => 'admin@hqcosmetic.vn',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Khách hàng',
            'email' => 'user@gmail.com',
            'password' => Hash::make('password'),
            'role' => 'user',
        ]);

        // 2. Categories
        $cats = [
            ['name' => 'Chăm sóc da mặt', 'slug' => 'cham-soc-da-mat', 'image' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop'],
            ['name' => 'Trang điểm', 'slug' => 'trang-diem', 'image' => 'https://images.unsplash.com/photo-1512496115841-db0aaf528000?q=80&w=600&auto=format&fit=crop'],
            ['name' => 'Chăm sóc cơ thể', 'slug' => 'cham-soc-co-the', 'image' => 'https://images.unsplash.com/photo-1556228720-1c27bef1dc1f?q=80&w=600&auto=format&fit=crop'],
            ['name' => 'Nước hoa', 'slug' => 'nuoc-hoa', 'image' => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'],
        ];
        foreach ($cats as $cat) { Category::create($cat); }

        // 3. Brands
        $brands = [
            ['name' => 'La Roche-Posay', 'slug' => 'la-roche-posay'],
            ['name' => 'L\'Oreal Paris', 'slug' => 'loreal-paris'],
            ['name' => 'M.A.C', 'slug' => 'mac'],
            ['name' => 'Vichy', 'slug' => 'vichy'],
            ['name' => 'Chanel', 'slug' => 'chanel'],
            ['name' => 'Dior', 'slug' => 'dior'],
        ];
        foreach ($brands as $brand) { Brand::create($brand); }

        // 4. Capacities
        $capacities = [
            ['value' => '30', 'unit' => 'ml'],
            ['value' => '50', 'unit' => 'ml'],
            ['value' => '100', 'unit' => 'ml'],
            ['value' => '150', 'unit' => 'ml'],
            ['value' => '200', 'unit' => 'ml'],
            ['value' => '500', 'unit' => 'ml'],
            ['value' => '125', 'unit' => 'g'],
        ];
        foreach ($capacities as $cap) { Capacity::create($cap); }

        // 5. Products & Variants
        $productsData = [
            [
                'name' => 'Kem Chống Nắng La Roche-Posay Anthelios',
                'description' => 'Kem chống nắng kiểm soát bóng nhờn, bảo vệ da toàn diện trước tia UVA/UVB.',
                'image' => 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
                'category_id' => 1,
                'brand_id' => 1,
                'is_featured' => true,
                'variants' => [
                    ['capacity_id' => 2, 'price' => 450000, 'sale_price' => 395000, 'stock' => 100],
                ]
            ],
            [
                'name' => 'Tinh Chất Khoáng Vichy Mineral 89',
                'description' => 'Dưỡng chất cô đặc giúp phục hồi và bảo vệ hàng rào bảo vệ da, đem lại làn da căng mịn.',
                'image' => 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop',
                'category_id' => 1,
                'brand_id' => 4,
                'is_featured' => true,
                'variants' => [
                    ['capacity_id' => 1, 'price' => 620000, 'sale_price' => 550000, 'stock' => 50],
                    ['capacity_id' => 2, 'price' => 980000, 'sale_price' => null, 'stock' => 30],
                ]
            ],
            [
                'name' => 'Son Thỏi M.A.C Matte Lipstick',
                'description' => 'Son thỏi với chất son lì mịn, màu sắc chuẩn xác và lâu trôi.',
                'image' => 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=800&auto=format&fit=crop',
                'category_id' => 2,
                'brand_id' => 3,
                'is_featured' => true,
                'variants' => [
                    ['capacity_id' => 7, 'price' => 550000, 'sale_price' => null, 'stock' => 200],
                ]
            ],
            [
                'name' => 'Nước Hoa Nữ Chanel Coco Mademoiselle EDP',
                'description' => 'Mùi hương phương Đông hiện đại, tươi mát và gợi cảm dành cho phái đẹp.',
                'image' => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
                'category_id' => 4,
                'brand_id' => 5,
                'is_featured' => true,
                'variants' => [
                    ['capacity_id' => 2, 'price' => 3200000, 'sale_price' => 2990000, 'stock' => 15],
                    ['capacity_id' => 3, 'price' => 4500000, 'sale_price' => null, 'stock' => 10],
                ]
            ],
            [
                'name' => 'Kem Dưỡng Ẩm L\'Oreal Revitalift Hyaluronic Acid',
                'description' => 'Kem dưỡng ẩm siêu cấp nước với HA, giúp da căng mướt rạng rỡ.',
                'image' => 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=800&auto=format&fit=crop',
                'category_id' => 1,
                'brand_id' => 2,
                'is_featured' => false,
                'variants' => [
                    ['capacity_id' => 2, 'price' => 350000, 'sale_price' => 280000, 'stock' => 120],
                ]
            ],
            [
                'name' => 'Sữa Tắm Dưỡng Ẩm Chăm Sóc Cơ Thể',
                'description' => 'Sữa tắm với chiết xuất thiên nhiên giúp làm sạch nhẹ nhàng và cấp ẩm sâu.',
                'image' => 'https://images.unsplash.com/photo-1608248593856-11b981d0f8d0?q=80&w=800&auto=format&fit=crop',
                'category_id' => 3,
                'brand_id' => 1,
                'is_featured' => false,
                'variants' => [
                    ['capacity_id' => 6, 'price' => 250000, 'sale_price' => null, 'stock' => 80],
                ]
            ],
            [
                'name' => 'Nước Hoa Nam Dior Sauvage EDP',
                'description' => 'Hương thơm nam tính, mạnh mẽ và hoang dã. Sự kết hợp của cam Bergamot và tiêu.',
                'image' => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
                'category_id' => 4,
                'brand_id' => 6,
                'is_featured' => true,
                'variants' => [
                    ['capacity_id' => 3, 'price' => 3800000, 'sale_price' => null, 'stock' => 25],
                ]
            ],
            [
                'name' => 'Phấn Nền Dior Forever Skin Glow',
                'description' => 'Kem nền mang lại lớp nền căng bóng tự nhiên, rạng rỡ suốt 24h.',
                'image' => 'https://images.unsplash.com/photo-1512496115841-db0aaf528000?q=80&w=800&auto=format&fit=crop',
                'category_id' => 2,
                'brand_id' => 6,
                'is_featured' => true,
                'variants' => [
                    ['capacity_id' => 1, 'price' => 1500000, 'sale_price' => 1350000, 'stock' => 40],
                ]
            ],
        ];

        foreach ($productsData as $data) {
            $product = Product::create([
                'name' => $data['name'],
                'slug' => Str::slug($data['name']),
                'description' => $data['description'],
                'image' => $data['image'],
                'category_id' => $data['category_id'],
                'brand_id' => $data['brand_id'],
                'is_featured' => $data['is_featured'],
                'status' => 'active',
            ]);

            foreach ($data['variants'] as $vData) {
                ProductVariant::create([
                    'product_id' => $product->id,
                    'capacity_id' => $vData['capacity_id'],
                    'price' => $vData['price'],
                    'sale_price' => $vData['sale_price'],
                    'stock' => $vData['stock'],
                ]);
            }
        }

        // 6. Vouchers
        Voucher::create([
            'code' => 'WELCOME10',
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'start_date' => now(),
            'end_date' => now()->addMonths(1),
            'min_order' => 0,
            'usage_limit' => 100,
            'status' => 'active'
        ]);

        Voucher::create([
            'code' => 'FREESHIP',
            'discount_type' => 'fixed',
            'discount_value' => 30000,
            'start_date' => now(),
            'end_date' => now()->addMonths(1),
            'min_order' => 500000,
            'usage_limit' => 50,
            'status' => 'active'
        ]);
        
        // 7. Posts
        $postCat = \App\Models\CategoryPost::create([
            'name' => 'Bí quyết làm đẹp',
            'slug' => 'bi-quyet-lam-dep'
        ]);
        
        \App\Models\Post::create([
            'title' => '5 bước skincare mỗi ngày cho làn da tỏa sáng',
            'slug' => Str::slug('5 bước skincare mỗi ngày cho làn da tỏa sáng'),
            'content' => 'Quy trình chăm sóc da cơ bản mà ai cũng nên biết...',
            'thumbnail' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop',
            'category_post_id' => $postCat->id,
            'author_id' => 1,
            'status' => 'published'
        ]);
    }
}
