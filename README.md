<h1 align="center">💄 HQCosmetic</h1>

<p align="center">
  Website thương mại điện tử mỹ phẩm full-stack: <strong>Laravel 13</strong> (Backend API) + <strong>React 19 + Vite</strong> (Frontend)
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Sanctum-4-FF2D20?style=for-the-badge&logo=laravel&logoColor=white"/>
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>
  <img src="https://img.shields.io/badge/VietQR-Tích%20hợp-e11d48?style=for-the-badge"/>
</p>

---

## ✨ Tính năng nổi bật

### 🛍️ Người dùng
- Duyệt sản phẩm, tìm kiếm & lọc theo danh mục / thương hiệu
- Chi tiết sản phẩm với biến thể dung tích, đánh giá & xếp hạng sao
- Giỏ hàng, Danh sách yêu thích
- Thanh toán: **COD** hoặc **VietQR (Chuyển khoản ngân hàng)**
- Lịch sử đơn hàng, theo dõi trạng thái đơn
- Quản lý hồ sơ & địa chỉ giao hàng
- Blog / Bài viết làm đẹp

### 🏦 Thanh toán VietQR
- Sau khi đặt hàng, khách được **redirect sang trang QR riêng** (nền tối, sang trọng)
- Hiển thị **mã QR quét được bằng mọi app ngân hàng** nội địa Việt Nam
- **Tự động polling** mỗi 5 giây kiểm tra trạng thái thanh toán
- Khi Admin xác nhận → trang **tự động hiện thành công** + redirect đến đơn hàng

### 🔧 Admin
- Dashboard thống kê doanh thu, đơn hàng, người dùng
- Quản lý sản phẩm (CRUD), danh mục, thương hiệu
- Quản lý đơn hàng: cập nhật trạng thái, **xác nhận thanh toán VietQR**
- Quản lý người dùng: phân quyền, khoá tài khoản

---

## 📁 Cấu trúc dự án

```
CosmeticsPro/
├── backend/                        ← Laravel 13 API
│   ├── app/Http/Controllers/
│   │   ├── AuthController.php
│   │   ├── ProductController.php
│   │   ├── OrderController.php
│   │   ├── PaymentController.php   ← VietQR API
│   │   └── Admin/
│   ├── app/Models/
│   ├── app/Http/Resources/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/DatabaseSeeder.php
│   ├── routes/
│   │   └── api.php
│   └── .env.example
│
└── frontend/                       ← React 19 + Vite
    └── src/
        ├── api/
        │   ├── axiosClient.js      ← Axios + Bearer Token interceptor
        │   ├── productApi.js
        │   ├── orderApi.js
        │   └── paymentApi.js       ← VietQR API calls
        ├── context/                ← AuthContext, CartContext, ToastContext
        ├── layouts/                ← MainLayout, AdminLayout
        ├── components/
        │   ├── ProductCard.jsx
        │   ├── Navbar.jsx
        │   └── VietQRModal.jsx
        ├── pages/
        │   ├── user/
        │   │   ├── HomePage.jsx
        │   │   ├── ProductListPage.jsx
        │   │   ├── CheckoutPage.jsx
        │   │   ├── VietQRPaymentPage.jsx  ← Trang thanh toán QR
        │   │   └── OrderDetailPage.jsx
        │   └── admin/
        │       ├── Dashboard.jsx
        │       ├── ProductManagement.jsx
        │       └── OrderManagement.jsx
        └── styles/
            ├── main.css
            ├── components.css
            └── pages.css
```

---

## ⚙️ Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---------|-------------------|
| PHP | >= 8.2 |
| Composer | >= 2.x |
| Node.js | >= 18.x |
| npm | >= 9.x |
| MySQL | >= 8.0 |

> 💡 Khuyến nghị dùng [Laragon](https://laragon.org/) trên Windows để có PHP + MySQL sẵn.

---

## 🚀 Hướng dẫn cài đặt

### 1. Clone dự án

```bash
git clone https://github.com/huypros1/CosmeticsPro.git
cd CosmeticsPro
```

---

### 2. Cài đặt Backend (Laravel)

```bash
cd backend
```

#### 2.1. Cài dependencies PHP

```bash
composer install
```

#### 2.2. Tạo file `.env`

```bash
cp .env.example .env
```

#### 2.3. Chỉnh sửa file `.env`

Mở file `backend/.env` và cập nhật thông tin:

```env
APP_NAME=HQCosmetic
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=HQCosmetic      # ← Tên database của bạn
DB_USERNAME=root             # ← Username MySQL
DB_PASSWORD=                 # ← Password MySQL (để trống nếu dùng Laragon mặc định)

FRONTEND_URL=http://localhost:5174
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:5174
```

#### 2.4. Tạo database

```sql
CREATE DATABASE HQCosmetic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2.5. Generate App Key & chạy Migration + Seeder

```bash
php artisan key:generate
php artisan migrate:fresh --seed
```

> Lệnh `--seed` sẽ tự động tạo **15 sản phẩm mẫu**, **8 thương hiệu**, **5 danh mục**, tài khoản admin và user mẫu.

#### 2.6. Cấu hình VietQR (Thanh toán chuyển khoản)

Mở file `backend/app/Http/Controllers/PaymentController.php` và thay thông tin ngân hàng của bạn:

```php
private $bankConfig = [
    'bank_bin'       => '970422',          // 970436=VCB | 970415=VietinBank | 970418=BIDV | 970422=MBBank
    'account_number' => 'SO_TAI_KHOAN',   // ← Số tài khoản thật của bạn
    'account_name'   => 'TEN_CHU_TK',     // ← Tên chủ TK (VIET HOA KHONG DAU)
    'bank_name'      => 'MBBank',
];
```

#### 2.7. Khởi động Backend

```bash
php artisan serve
```

✅ Backend chạy tại: **http://localhost:8000**

---

### 3. Cài đặt Frontend (React)

Mở terminal mới:

```bash
cd frontend
npm install
```

#### 3.1. Tạo file `.env`

```env
VITE_APP_NAME=HQCosmetic
VITE_API_URL=http://localhost:8000/api
```

#### 3.2. Khởi động Frontend

```bash
npm run dev
```

✅ Frontend chạy tại: **http://localhost:5174**

---

## 🖥️ Sử dụng

### Tài khoản mẫu (sau khi seed)

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | `admin@hqcosmetic.vn` | `password` |
| Người dùng | `user@gmail.com` | `password` |

### Truy cập

| URL | Mô tả |
|-----|-------|
| http://localhost:5174 | 🛍️ Trang bán hàng (người dùng) |
| http://localhost:5174/admin | 🔧 Trang quản trị admin |
| http://localhost:5174/payment/vietqr/:id | 🏦 Trang thanh toán QR |
| http://localhost:8000/api | 📡 Laravel API |

---

## 📡 API Endpoints

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/auth/login` | Đăng nhập | ❌ |
| POST | `/auth/register` | Đăng ký | ❌ |
| GET | `/products` | Danh sách sản phẩm (filter, search, sort) | ❌ |
| GET | `/products/featured` | Sản phẩm nổi bật | ❌ |
| GET | `/products/{slug}` | Chi tiết sản phẩm | ❌ |
| GET | `/categories` | Danh sách danh mục | ❌ |
| GET | `/cart` | Xem giỏ hàng | ✅ |
| POST | `/cart` | Thêm vào giỏ hàng | ✅ |
| POST | `/orders` | Đặt hàng | ✅ |
| POST | `/payment/vietqr` | Tạo QR thanh toán | ✅ |
| GET | `/payment/status/{orderId}` | Kiểm tra trạng thái TT (polling) | ✅ |
| POST | `/admin/payment/{orderId}/confirm` | Admin xác nhận đã nhận TT | ✅ Admin |
| GET | `/admin/orders` | Danh sách đơn hàng (Admin) | ✅ Admin |

> Xem chi tiết trong [`backend/routes/api.php`](./backend/routes/api.php)

---

## 💳 Luồng thanh toán VietQR

```
Khách chọn "VietQR" → Nhấn Đặt hàng
        ↓
Tự động redirect → /payment/vietqr/{orderId}
        ↓
Hiển thị mã QR + thông tin chuyển khoản
(polling kiểm tra mỗi 5 giây)
        ↓
Khách mở app ngân hàng → Quét QR → Chuyển khoản
        ↓
Admin: Quản lý Đơn hàng → "✅ Xác nhận đã nhận TT"
        ↓
Backend: payment_status = 'paid', status = 'confirmed'
        ↓
Frontend polling phát hiện → Màn hình SUCCESS 🎉
→ Tự redirect sang trang chi tiết đơn hàng
```

---

## 📦 Thư viện sử dụng

### Backend
| Package | Mô tả |
|---------|-------|
| `laravel/framework` v13 | PHP framework |
| `laravel/sanctum` v4 | API token authentication |

### Frontend
| Package | Mô tả |
|---------|-------|
| `react` v19 | UI library |
| `react-router-dom` v7 | Client-side routing |
| `axios` | HTTP client với interceptor |
| `react-hook-form` | Form handling |
| `vietqr` | Tạo QR code thanh toán VietQR |

---

## 🔐 Authentication Flow

```
Người dùng đăng nhập
       ↓
POST /api/auth/login  →  Laravel trả về { token, user }
       ↓
Frontend lưu token vào localStorage
       ↓
Mọi request tiếp theo tự động gửi: Authorization: Bearer {token}
       ↓
Nếu token hết hạn (401) → tự động redirect về /login
```

---

## 🛠️ Các lệnh hữu ích

### Backend (Laravel)

```bash
# Chạy lại toàn bộ migration + seed
php artisan migrate:fresh --seed

# Xem danh sách routes
php artisan route:list

# Xoá cache
php artisan optimize:clear

# Tạo Model + Migration + Controller + Resource
php artisan make:model Product -mcr
```

### Frontend (React)

```bash
# Chạy dev server
npm run dev

# Build production
npm run build

# Preview bản build
npm run preview
```

---

## 🤝 Đóng góp

1. Fork repo này
2. Tạo branch mới: `git checkout -b feature/ten-tinh-nang`
3. Commit: `git commit -m "feat: mô tả thay đổi"`
4. Push: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

---

## 📄 License

MIT License © 2026 [huypros1](https://github.com/huypros1)
