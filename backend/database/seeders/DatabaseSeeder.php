<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Capacity;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Voucher;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Review;
use App\Models\WishlistItem;
use App\Models\Cart;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ═══════════════════════════════════
        // 1. USERS
        // ═══════════════════════════════════
        $admin = User::create([
            'name'     => 'HQCosmetic Admin',
            'email'    => 'admin@hqcosmetic.vn',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'status'   => 'active',
        ]);

        $users = [];
        $userData = [
            ['name' => 'Nguyễn Thị Lan', 'email' => 'lan.nguyen@gmail.com'],
            ['name' => 'Trần Minh Hùng', 'email' => 'hung.tran@gmail.com'],
            ['name' => 'Lê Thị Mai',      'email' => 'mai.le@gmail.com'],
            ['name' => 'Phạm Quỳnh Anh',  'email' => 'quynhanh@gmail.com'],
            ['name' => 'Hoàng Văn Nam',   'email' => 'nam.hoang@gmail.com'],
        ];
        foreach ($userData as $u) {
            $users[] = User::create([
                'name'     => $u['name'],
                'email'    => $u['email'],
                'password' => Hash::make('password'),
                'role'     => 'user',
                'status'   => 'active',
            ]);
        }

        // ═══════════════════════════════════
        // 2. CATEGORIES
        // ═══════════════════════════════════
        $categories = [];
        $catData = [
            ['name' => 'Chăm sóc da mặt', 'slug' => 'cham-soc-da-mat',  'image' => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop',  'description' => 'Các sản phẩm chăm sóc da mặt chuyên sâu'],
            ['name' => 'Trang điểm',       'slug' => 'trang-diem',       'image' => 'https://images.unsplash.com/photo-1512496115841-db0aaf528000?q=80&w=600&auto=format&fit=crop', 'description' => 'Mỹ phẩm trang điểm cao cấp'],
            ['name' => 'Chăm sóc cơ thể', 'slug' => 'cham-soc-co-the',  'image' => 'https://images.unsplash.com/photo-1556228720-1c27bef1dc1f?q=80&w=600&auto=format&fit=crop', 'description' => 'Sản phẩm dưỡng thể và chăm sóc toàn thân'],
            ['name' => 'Nước hoa',         'slug' => 'nuoc-hoa',         'image' => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop', 'description' => 'Nước hoa nam và nữ cao cấp'],
            ['name' => 'Dụng cụ làm đẹp', 'slug' => 'dung-cu-lam-dep',  'image' => 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop', 'description' => 'Cọ trang điểm, máy rửa mặt và các dụng cụ làm đẹp'],
        ];
        foreach ($catData as $c) {
            $categories[] = Category::create($c);
        }

        // ═══════════════════════════════════
        // 3. BRANDS
        // ═══════════════════════════════════
        $brands = [];
        $brandData = [
            ['name' => 'La Roche-Posay', 'slug' => 'la-roche-posay', 'logo' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/La_Roche-Posay_logo.svg/320px-La_Roche-Posay_logo.svg.png'],
            ['name' => "L'Oreal Paris",  'slug' => 'loreal-paris',   'logo' => null],
            ['name' => 'M.A.C',          'slug' => 'mac',            'logo' => null],
            ['name' => 'Vichy',          'slug' => 'vichy',          'logo' => null],
            ['name' => 'Chanel',         'slug' => 'chanel',         'logo' => null],
            ['name' => 'Dior',           'slug' => 'dior',           'logo' => null],
            ['name' => 'Estee Lauder',   'slug' => 'estee-lauder',   'logo' => null],
            ['name' => 'Innisfree',      'slug' => 'innisfree',      'logo' => null],
        ];
        foreach ($brandData as $b) {
            $brands[] = Brand::create($b);
        }

        // ═══════════════════════════════════
        // 4. CAPACITIES
        // ═══════════════════════════════════
        $caps = [];
        $capData = [
            ['value' => '15',  'unit' => 'g'],
            ['value' => '30',  'unit' => 'ml'],
            ['value' => '50',  'unit' => 'ml'],
            ['value' => '100', 'unit' => 'ml'],
            ['value' => '125', 'unit' => 'g'],
            ['value' => '150', 'unit' => 'ml'],
            ['value' => '200', 'unit' => 'ml'],
            ['value' => '500', 'unit' => 'ml'],
        ];
        foreach ($capData as $c) {
            $caps[] = Capacity::create($c);
        }
        // Index: 0=15g, 1=30ml, 2=50ml, 3=100ml, 4=125g, 5=150ml, 6=200ml, 7=500ml

        // ═══════════════════════════════════
        // 5. PRODUCTS & VARIANTS
        // ═══════════════════════════════════
        $productsData = [
            [
                'name'        => 'Kem Chống Nắng La Roche-Posay Anthelios',
                'description' => 'Kem chống nắng kiểm soát bóng nhờn, bảo vệ da toàn diện trước tia UVA/UVB. SPF50+ với công thức dịu nhẹ phù hợp cho da nhạy cảm.',
                'image'       => 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[0]->id,
                'brand_id'    => $brands[0]->id,
                'is_featured' => true,
                'variants'    => [
                    ['capacity_id' => $caps[2]->id, 'price' => 450000, 'sale_price' => 395000, 'stock' => 100],
                ],
            ],
            [
                'name'        => 'Tinh Chất Khoáng Vichy Mineral 89',
                'description' => 'Dưỡng chất cô đặc giúp phục hồi và bảo vệ hàng rào bảo vệ da, đem lại làn da căng mịn.',
                'image'       => 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[0]->id,
                'brand_id'    => $brands[3]->id,
                'is_featured' => true,
                'variants'    => [
                    ['capacity_id' => $caps[1]->id, 'price' => 620000, 'sale_price' => 550000, 'stock' => 50],
                    ['capacity_id' => $caps[2]->id, 'price' => 980000, 'sale_price' => null,   'stock' => 30],
                ],
            ],
            [
                'name'        => 'Son Thỏi M.A.C Matte Lipstick',
                'description' => 'Son thỏi với chất son lì mịn, màu sắc chuẩn xác và lâu trôi. Hơn 30 màu sắc đa dạng.',
                'image'       => 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[1]->id,
                'brand_id'    => $brands[2]->id,
                'is_featured' => true,
                'variants'    => [
                    ['capacity_id' => $caps[4]->id, 'price' => 550000, 'sale_price' => null, 'stock' => 200],
                ],
            ],
            [
                'name'        => 'Nước Hoa Nữ Chanel Coco Mademoiselle EDP',
                'description' => 'Mùi hương phương Đông hiện đại, tươi mát và gợi cảm dành cho phái đẹp.',
                'image'       => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[3]->id,
                'brand_id'    => $brands[4]->id,
                'is_featured' => true,
                'variants'    => [
                    ['capacity_id' => $caps[2]->id, 'price' => 3200000, 'sale_price' => 2990000, 'stock' => 15],
                    ['capacity_id' => $caps[3]->id, 'price' => 4500000, 'sale_price' => null,    'stock' => 10],
                ],
            ],
            [
                'name'        => "Kem Dưỡng Ẩm L'Oreal Revitalift Hyaluronic Acid",
                'description' => 'Kem dưỡng ẩm siêu cấp nước với HA, giúp da căng mướt rạng rỡ.',
                'image'       => 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[0]->id,
                'brand_id'    => $brands[1]->id,
                'is_featured' => true,
                'variants'    => [
                    ['capacity_id' => $caps[2]->id, 'price' => 350000, 'sale_price' => 280000, 'stock' => 120],
                ],
            ],
            [
                'name'        => 'Sữa Tắm Dưỡng Ẩm Innisfree Jeju',
                'description' => 'Sữa tắm với chiết xuất tảo xanh Jeju giúp làm sạch nhẹ nhàng và cấp ẩm sâu.',
                'image'       => 'https://images.unsplash.com/photo-1608248593856-11b981d0f8d0?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[2]->id,
                'brand_id'    => $brands[7]->id,
                'is_featured' => false,
                'variants'    => [
                    ['capacity_id' => $caps[7]->id, 'price' => 250000, 'sale_price' => null, 'stock' => 80],
                ],
            ],
            [
                'name'        => 'Nước Hoa Nam Dior Sauvage EDP',
                'description' => 'Hương thơm nam tính, mạnh mẽ và hoang dã. Sự kết hợp của cam Bergamot và tiêu Ambroxide.',
                'image'       => 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[3]->id,
                'brand_id'    => $brands[5]->id,
                'is_featured' => true,
                'variants'    => [
                    ['capacity_id' => $caps[3]->id, 'price' => 3800000, 'sale_price' => null, 'stock' => 25],
                ],
            ],
            [
                'name'        => 'Phấn Nền Dior Forever Skin Glow',
                'description' => 'Kem nền mang lại lớp nền căng bóng tự nhiên, rạng rỡ suốt 24h. Độ che phủ vừa phải.',
                'image'       => 'https://images.unsplash.com/photo-1512496115841-db0aaf528000?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[1]->id,
                'brand_id'    => $brands[5]->id,
                'is_featured' => true,
                'variants'    => [
                    ['capacity_id' => $caps[1]->id, 'price' => 1500000, 'sale_price' => 1350000, 'stock' => 40],
                ],
            ],
            [
                'name'        => 'Tinh Chất Phục Hồi Estee Lauder Advanced Night Repair',
                'description' => 'Serum chống lão hóa huyền thoại, phục hồi và cấp ẩm chuyên sâu ban đêm.',
                'image'       => 'https://images.unsplash.com/photo-1615397323282-393282363189?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[0]->id,
                'brand_id'    => $brands[6]->id,
                'is_featured' => true,
                'variants'    => [
                    ['capacity_id' => $caps[1]->id, 'price' => 2500000, 'sale_price' => 2300000, 'stock' => 50],
                    ['capacity_id' => $caps[3]->id, 'price' => 3500000, 'sale_price' => null,    'stock' => 20],
                ],
            ],
            [
                'name'        => 'Mặt Nạ Đất Sét Innisfree Super Volcanic Pore',
                'description' => 'Mặt nạ đất sét tro núi lửa làm sạch sâu lỗ chân lông và tẩy tế bào chết.',
                'image'       => 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[0]->id,
                'brand_id'    => $brands[7]->id,
                'is_featured' => false,
                'variants'    => [
                    ['capacity_id' => $caps[4]->id, 'price' => 350000, 'sale_price' => 310000, 'stock' => 150],
                ],
            ],
            [
                'name'        => 'Phấn Phủ Bột Chanel Poudre Universelle Libre',
                'description' => 'Phấn phủ dạng bột mỏng nhẹ, kiềm dầu tức thì và làm mịn màng làn da.',
                'image'       => 'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[1]->id,
                'brand_id'    => $brands[4]->id,
                'is_featured' => true,
                'variants'    => [
                    ['capacity_id' => $caps[0]->id, 'price' => 1700000, 'sale_price' => null, 'stock' => 60],
                ],
            ],
            [
                'name'        => 'Sữa Rửa Mặt Tạo Bọt La Roche-Posay Effaclar',
                'description' => 'Sữa rửa mặt dạng gel tạo bọt, nhẹ nhàng làm sạch da dầu và da mụn.',
                'image'       => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[0]->id,
                'brand_id'    => $brands[0]->id,
                'is_featured' => false,
                'variants'    => [
                    ['capacity_id' => $caps[6]->id, 'price' => 380000, 'sale_price' => 320000, 'stock' => 200],
                ],
            ],
            [
                'name'        => 'Son Dưỡng Dior Addict Lip Glow',
                'description' => 'Son dưỡng màu tự nhiên giúp làm mềm và bảo vệ đôi môi. Tạo màu theo nhiệt độ môi.',
                'image'       => 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[1]->id,
                'brand_id'    => $brands[5]->id,
                'is_featured' => true,
                'variants'    => [
                    ['capacity_id' => $caps[4]->id, 'price' => 850000, 'sale_price' => 810000, 'stock' => 120],
                ],
            ],
            [
                'name'        => 'Kem Nền Estee Lauder Double Wear',
                'description' => 'Kem nền kiềm dầu với độ che phủ hoàn hảo lên đến 24 giờ, bền màu mọi điều kiện.',
                'image'       => 'https://images.unsplash.com/photo-1512496115841-db0aaf528000?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[1]->id,
                'brand_id'    => $brands[6]->id,
                'is_featured' => false,
                'variants'    => [
                    ['capacity_id' => $caps[1]->id, 'price' => 1350000, 'sale_price' => null, 'stock' => 85],
                ],
            ],
            [
                'name'        => "Nước Tẩy Trang L'Oreal Micellar Water",
                'description' => 'Nước tẩy trang dịu nhẹ 3 trong 1: làm sạch, giữ ẩm và mềm mịn da.',
                'image'       => 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[0]->id,
                'brand_id'    => $brands[1]->id,
                'is_featured' => false,
                'variants'    => [
                    ['capacity_id' => $caps[7]->id, 'price' => 210000, 'sale_price' => 165000, 'stock' => 300],
                ],
            ],
            [
                'name'        => 'Serum Vitamin C La Roche-Posay Pure Vitamin C10',
                'description' => 'Serum vitamin C 10% nguyên chất kết hợp axit hyaluronic giúp da sáng mịn, mờ thâm.',
                'image'       => 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
                'category_id' => $categories[0]->id,
                'brand_id'    => $brands[0]->id,
                'is_featured' => true,
                'variants'    => [
                    ['capacity_id' => $caps[1]->id, 'price' => 850000, 'sale_price' => 780000, 'stock' => 75],
                ],
            ],
        ];

        $products = [];
        $allVariants = [];
        foreach ($productsData as $data) {
            $product = Product::create([
                'name'        => $data['name'],
                'slug'        => Str::slug($data['name']) . '-' . Str::random(5),
                'description' => $data['description'],
                'image'       => $data['image'],
                'category_id' => $data['category_id'],
                'brand_id'    => $data['brand_id'],
                'is_featured' => $data['is_featured'],
                'status'      => 'active',
            ]);
            $products[] = $product;

            foreach ($data['variants'] as $vData) {
                $variant = ProductVariant::create([
                    'product_id'  => $product->id,
                    'capacity_id' => $vData['capacity_id'],
                    'price'       => $vData['price'],
                    'sale_price'  => $vData['sale_price'],
                    'stock'       => $vData['stock'],
                ]);
                $allVariants[] = $variant;
            }
        }

        // ═══════════════════════════════════
        // 6. VOUCHERS
        // ═══════════════════════════════════
        $vouchers = [];

        $vouchers[] = Voucher::create([
            'code'              => 'WELCOME10',
            'description'       => 'Giảm 10% cho đơn hàng đầu tiên',
            'discount_type'     => 'percent',
            'discount_value'    => 10,
            'min_order_value'   => 0,
            'max_discount_amount' => 100000,
            'start_date'        => now()->subDays(10),
            'end_date'          => now()->addMonths(2),
            'usage_limit'       => 200,
            'used_count'        => 0,
            'max_uses_per_user' => 1,
            'status'            => 'active',
        ]);

        $vouchers[] = Voucher::create([
            'code'              => 'SALE50K',
            'description'       => 'Giảm 50.000đ cho đơn từ 500.000đ',
            'discount_type'     => 'fixed',
            'discount_value'    => 50000,
            'min_order_value'   => 500000,
            'max_discount_amount' => null,
            'start_date'        => now()->subDays(5),
            'end_date'          => now()->addMonths(1),
            'usage_limit'       => 100,
            'used_count'        => 0,
            'max_uses_per_user' => 2,
            'status'            => 'active',
        ]);

        $vouchers[] = Voucher::create([
            'code'              => 'VIP20',
            'description'       => 'Ưu đãi VIP giảm 20% tối đa 200.000đ',
            'discount_type'     => 'percent',
            'discount_value'    => 20,
            'min_order_value'   => 1000000,
            'max_discount_amount' => 200000,
            'start_date'        => now(),
            'end_date'          => now()->addMonths(3),
            'usage_limit'       => 50,
            'used_count'        => 0,
            'max_uses_per_user' => 1,
            'status'            => 'active',
        ]);

        $vouchers[] = Voucher::create([
            'code'              => 'EXPIRED',
            'description'       => 'Voucher đã hết hạn (test)',
            'discount_type'     => 'fixed',
            'discount_value'    => 30000,
            'min_order_value'   => 200000,
            'max_discount_amount' => null,
            'start_date'        => now()->subMonths(2),
            'end_date'          => now()->subDays(1),
            'usage_limit'       => 50,
            'used_count'        => 50,
            'max_uses_per_user' => 1,
            'status'            => 'inactive',
        ]);

        // ═══════════════════════════════════
        // 7. ORDERS
        // ═══════════════════════════════════
        $statuses        = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        $paymentMethods  = ['cod', 'vietqr'];
        $paymentStatuses = ['unpaid', 'paid'];

        $addresses = [
            ['name' => 'Nguyễn Thị Lan',  'phone' => '0901234567', 'addr' => '123 Nguyễn Huệ, P.Bến Nghé, Q.1, TP.HCM'],
            ['name' => 'Trần Minh Hùng',  'phone' => '0912345678', 'addr' => '45 Lê Lợi, P.Bến Thành, Q.1, TP.HCM'],
            ['name' => 'Lê Thị Mai',       'phone' => '0923456789', 'addr' => '78 Trần Hưng Đạo, P.Phạm Ngũ Lão, Q.1, TP.HCM'],
            ['name' => 'Phạm Quỳnh Anh',  'phone' => '0934567890', 'addr' => '90 Hoàng Diệu, P.4, Q.Phú Nhuận, TP.HCM'],
            ['name' => 'Hoàng Văn Nam',   'phone' => '0945678901', 'addr' => '12 Đinh Tiên Hoàng, P.1, Q.Bình Thạnh, TP.HCM'],
        ];

        $ordersCreated = [];
        foreach ($users as $i => $user) {
            $numOrders = rand(2, 4);
            $addr = $addresses[$i];

            for ($j = 0; $j < $numOrders; $j++) {
                $status        = $statuses[array_rand($statuses)];
                $paymentMethod = $paymentMethods[array_rand($paymentMethods)];
                $paymentStatus = ($paymentMethod === 'vietqr' || $status === 'delivered') ? 'paid' : 'unpaid';

                // Chọn ngẫu nhiên 1-3 variant
                $selectedVariants = collect($allVariants)->random(rand(1, 3));
                $itemsTotal = 0;
                $orderItems = [];

                foreach ($selectedVariants as $variant) {
                    $qty   = rand(1, 3);
                    $price = $variant->sale_price ?? $variant->price;
                    $itemsTotal += $qty * $price;
                    $orderItems[] = ['variant' => $variant, 'qty' => $qty, 'price' => $price];
                }

                $shippingFee    = $itemsTotal >= 500000 ? 0 : 30000;
                $discountAmount = 0;
                $voucherId      = null;

                // Áp voucher ngẫu nhiên cho ~40% đơn
                if (rand(1, 10) <= 4 && $itemsTotal >= 500000) {
                    $v = $vouchers[0]; // WELCOME10
                    $disc = ($itemsTotal * $v->discount_value) / 100;
                    if ($v->max_discount_amount && $disc > $v->max_discount_amount) {
                        $disc = $v->max_discount_amount;
                    }
                    $discountAmount = $disc;
                    $voucherId = $v->id;
                    $v->increment('used_count');
                }

                $totalAmount = $itemsTotal + $shippingFee - $discountAmount;

                $order = Order::create([
                    'user_id'          => $user->id,
                    'status'           => $status,
                    'recipient_name'   => $addr['name'],
                    'recipient_phone'  => $addr['phone'],
                    'shipping_address' => $addr['addr'],
                    'voucher_id'       => $voucherId,
                    'discount_amount'  => $discountAmount,
                    'payment_method'   => $paymentMethod,
                    'shipping_fee'     => $shippingFee,
                    'total_amount'     => $totalAmount,
                    'payment_status'   => $paymentStatus,
                    'created_at'       => now()->subDays(rand(1, 90)),
                ]);

                foreach ($orderItems as $item) {
                    OrderItem::create([
                        'order_id'           => $order->id,
                        'product_variant_id' => $item['variant']->id,
                        'quantity'           => $item['qty'],
                        'price'              => $item['price'],
                    ]);
                }

                $ordersCreated[] = ['order' => $order, 'items' => $orderItems, 'user' => $user];
            }
        }

        // ═══════════════════════════════════
        // 8. REVIEWS (chỉ đơn delivered)
        // ═══════════════════════════════════
        $reviewTexts = [
            5 => [
                'Sản phẩm tuyệt vời, mình rất hài lòng! Chất lượng đúng như mô tả.',
                'Giao hàng nhanh, đóng gói cẩn thận. Sản phẩm thơm, dùng xong da mềm hẳn!',
                'Mua lần 2 rồi vẫn thấy ưng, sẽ tiếp tục ủng hộ shop.',
                'Sản phẩm chính hãng, mùi thơm dễ chịu, da mình cải thiện rõ rệt.',
                'Đúng hàng, dùng rất mịn và thấm vào da nhanh. Highly recommend!',
            ],
            4 => [
                'Sản phẩm khá tốt, nhưng mình thấy hộp hơi móp một chút khi nhận.',
                'Hàng chính hãng, dùng ổn, chỉ tiếc là giao hơi trễ so với dự kiến.',
                'Chất lượng tốt, mùi thơm nhẹ nhàng. Sẽ mua lại.',
                'Ưng sản phẩm nhưng cần cải thiện thêm về bao bì vận chuyển.',
            ],
            3 => [
                'Sản phẩm tạm ổn, chưa thấy hiệu quả rõ rệt sau 1 tuần dùng.',
                'Không phải gu của mình lắm nhưng chất lượng được.',
                'Giao đúng hàng nhưng thời gian giao hơi lâu.',
            ],
        ];

        foreach ($ordersCreated as $od) {
            if ($od['order']->status !== 'delivered') continue;

            foreach ($od['items'] as $item) {
                if (rand(1, 10) <= 7) { // 70% xác suất để lại review
                    $stars = [5, 5, 5, 4, 4, 3][array_rand([5, 5, 5, 4, 4, 3])];
                    $pool  = $reviewTexts[$stars];
                    Review::create([
                        'user_id'    => $od['user']->id,
                        'product_id' => $item['variant']->product_id,
                        'rating'     => $stars,
                        'content'    => $pool[array_rand($pool)],
                        'created_at' => $od['order']->created_at->addDays(rand(1, 5)),
                    ]);
                }
            }
        }

        // ═══════════════════════════════════
        // 9. WISHLIST
        // ═══════════════════════════════════
        foreach ($users as $user) {
            $wishProducts = collect($products)->random(rand(2, 5));
            foreach ($wishProducts as $product) {
                WishlistItem::firstOrCreate([
                    'user_id'    => $user->id,
                    'product_id' => $product->id,
                ]);
            }
        }

        // ═══════════════════════════════════
        // 10. CART (user đầu tiên)
        // ═══════════════════════════════════
        $cartVariants = collect($allVariants)->random(3);
        foreach ($cartVariants as $variant) {
            Cart::create([
                'user_id'    => $users[0]->id,
                'variant_id' => $variant->id,
                'quantity'   => rand(1, 2),
                'price'      => $variant->sale_price ?? $variant->price,
            ]);
        }

        // ═══════════════════════════════════
        // 11. POSTS (Blog)
        // ═══════════════════════════════════
        $postCat = \App\Models\CategoryPost::create([
            'name' => 'Bí quyết làm đẹp',
            'slug' => 'bi-quyet-lam-dep',
        ]);

        $postCat2 = \App\Models\CategoryPost::create([
            'name' => 'Review sản phẩm',
            'slug' => 'review-san-pham',
        ]);

        $posts = [
            [
                'title'            => '5 bước skincare mỗi ngày cho làn da tỏa sáng',
                'slug'             => Str::slug('5 buoc skincare moi ngay cho lan da toa sang'),
                'content'          => "Quy trình chăm sóc da cơ bản mà ai cũng nên biết để giữ làn da luôn tươi trẻ, mềm mịn và căng mọng. Không cần quá cầu kỳ, chỉ cần bạn thực hiện đúng và đều đặn các bước sau đây.\n\n**Bước 1: Làm sạch da** - Dùng sữa rửa mặt phù hợp với loại da, rửa 2 lần/ngày sáng tối.\n\n**Bước 2: Tẩy tế bào chết** - 2-3 lần/tuần để loại bỏ bụi bẩn, bã nhờn.\n\n**Bước 3: Cấp ẩm với toner** - Giúp cân bằng độ pH và chuẩn bị cho các bước tiếp theo.\n\n**Bước 4: Dưỡng ẩm với serum/essence** - Chọn loại phù hợp với vấn đề da.\n\n**Bước 5: Chống nắng ban ngày** - Không thể bỏ qua bước này, SPF50+ là lựa chọn tốt nhất.",
                'thumbnail'        => 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop',
                'category_post_id' => $postCat->id,
                'status'           => 'published',
            ],
            [
                'title'            => 'Bí mật đằng sau những mùi hương kinh điển',
                'slug'             => Str::slug('Bi mat dang sau nhung mui huong kinh dien'),
                'content'          => "Nước hoa không chỉ là mùi hương mà còn là một tác phẩm nghệ thuật. Cùng khám phá hành trình tạo nên những chai nước hoa huyền thoại như Chanel No.5, Dior Sauvage...\n\nMỗi chai nước hoa có cấu trúc 3 tầng hương: top note (hương đầu), middle note (hương giữa) và base note (hương cuối). Sự phối hợp tinh tế giữa các tầng hương tạo nên cá tính riêng của mỗi dòng nước hoa.",
                'thumbnail'        => 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop',
                'category_post_id' => $postCat->id,
                'status'           => 'published',
            ],
            [
                'title'            => 'Lớp nền hoàn hảo: Chọn foundation như thế nào?',
                'slug'             => Str::slug('Lop nen hoan hao chon foundation nhu the nao'),
                'content'          => "Một lớp nền đẹp bắt đầu từ việc chọn đúng loại foundation phù hợp với tông da và loại da. Bài viết này sẽ hướng dẫn bạn cách chọn kem nền chuẩn không cần chỉnh.\n\n**Da dầu**: Chọn foundation dạng bột hoặc kiềm dầu, coverage từ medium đến full.\n\n**Da khô**: Nên dùng foundation dạng lỏng có thành phần dưỡng ẩm.\n\n**Da hỗn hợp**: Foundation dạng cushion hoặc dạng kem nhẹ là lựa chọn an toàn.",
                'thumbnail'        => 'https://images.unsplash.com/photo-1512496115841-db0aaf528000?q=80&w=600&auto=format&fit=crop',
                'category_post_id' => $postCat->id,
                'status'           => 'published',
            ],
            [
                'title'            => 'Review: Estee Lauder Advanced Night Repair có thực sự hiệu quả?',
                'slug'             => Str::slug('Review Estee Lauder Advanced Night Repair co thuc su hieu qua'),
                'content'          => "Sau 4 tuần sử dụng Estee Lauder Advanced Night Repair, mình nhận thấy da cải thiện rõ rệt về độ ẩm và độ mịn màng. Đây là serum chống lão hóa huyền thoại đã có mặt trên thị trường hơn 40 năm.\n\n**Ưu điểm**: Thấm nhanh, không nhờn rít, mùi thơm nhẹ, da căng mọng sau 1 tuần.\n\n**Nhược điểm**: Giá cao, lọ nhỏ dùng không được lâu.\n\n**Điểm tổng kết**: 9/10 - Xứng đáng với số tiền bỏ ra.",
                'thumbnail'        => 'https://images.unsplash.com/photo-1615397323282-393282363189?q=80&w=600&auto=format&fit=crop',
                'category_post_id' => $postCat2->id,
                'status'           => 'published',
            ],
        ];

        foreach ($posts as $post) {
            \App\Models\Post::create([
                'title'            => $post['title'],
                'slug'             => $post['slug'],
                'content'          => $post['content'],
                'thumbnail'        => $post['thumbnail'],
                'category_post_id' => $post['category_post_id'],
                'author_id'        => $admin->id,
                'status'           => $post['status'],
            ]);
        }

        $this->command->info('✅ Seeder hoàn tất!');
        $this->command->table(
            ['Bảng', 'Số bản ghi'],
            [
                ['users',            User::count()],
                ['categories',       Category::count()],
                ['brands',           Brand::count()],
                ['capacities',       Capacity::count()],
                ['products',         Product::count()],
                ['product_variants', ProductVariant::count()],
                ['vouchers',         Voucher::count()],
                ['orders',           Order::count()],
                ['order_items',      OrderItem::count()],
                ['reviews',          Review::count()],
                ['wishlist_items',   WishlistItem::count()],
                ['carts',            Cart::count()],
            ]
        );
    }
}
