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
- **Trang chủ hiện đại:** Các section chuyên biệt như Sản phẩm mới, Sản phẩm Flash Sale, Banner CTA, Đánh giá khách hàng tự động xoay (carousel), và Bản đồ cửa hàng (Google Maps).
- **Duyệt sản phẩm:** Tìm kiếm, lọc theo danh mục, thương hiệu, đánh giá sao.
- **Chi tiết sản phẩm toàn diện:** Quản lý biến thể (dung tích), gợi ý **Sản phẩm liên quan** (You may also like) và **Gợi ý mua theo bộ** (Complete the look).
- **Quản lý Hồ sơ cá nhân (Profile):** Cập nhật thông tin, thay đổi mật khẩu, **đổi ảnh đại diện (avatar)** dễ dàng bằng thao tác click.
- **Giỏ hàng & Danh sách yêu thích:** Lưu trữ và quản lý mua sắm tiện lợi.
- **Thanh toán:** Hỗ trợ **COD** và **VietQR (Chuyển khoản ngân hàng)**.
- **Lịch sử đơn hàng:** Theo dõi tình trạng, huỷ đơn.
- **Blog:** Xem danh sách bài viết chia sẻ bí quyết làm đẹp, tin tức.

### ✉️ Email Đặt hàng tự động
- Gửi email xác nhận với giao diện HTML/CSS bắt mắt, sang trọng mỗi khi đặt hàng thành công.
- Tuỳ biến dễ dàng với `App\Mail\OrderPlaced`.

### 🏦 Thanh toán VietQR
- Sau khi đặt hàng, khách được **redirect sang trang QR riêng** (nền tối, sang trọng).
- Hiển thị **mã QR quét được bằng mọi app ngân hàng** nội địa Việt Nam.
- **Tự động polling** mỗi 5 giây kiểm tra trạng thái thanh toán.
- Khi Admin xác nhận → trang **tự động hiện thành công** + redirect đến đơn hàng.

### 🔧 Quản trị viên (Admin)
- **Dashboard thống kê:** Giao diện trực quan với **Biểu đồ doanh thu 6 tháng**, hiển thị top sản phẩm bán chạy, và quản lý các đơn hàng gần nhất.
- **Quản lý Sản phẩm:** Thêm/sửa/xoá sản phẩm và **các biến thể dung tích/giá**.
- **Quản lý Đơn hàng:** Cập nhật trạng thái đơn hàng và thanh toán, **xác nhận thanh toán VietQR**.
- **Quản lý Danh mục & Thương hiệu (Brands).**
- **Quản lý Người dùng:** Phân quyền hệ thống, xem trạng thái người dùng.
- **Quản lý Blog (Tin tức):** Viết bài mới, tải lên ảnh thumbnail.
- **Quản lý Đánh giá (Reviews):** Xem và xoá các đánh giá vi phạm từ khách hàng.

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
│   │   ├── ProfileController.php   ← Avatar upload logic
│   │   └── Admin/
│   │       ├── DashboardController.php
│   │       ├── ProductController.php
│   │       ├── PostController.php  ← Quản lý bài viết
│   │       └── ReviewController.php
│   ├── app/Mail/
│   │   └── OrderPlaced.php         ← Mailable xác nhận đặt hàng
│   ├── app/Models/
│   ├── app/Http/Resources/
│   ├── resources/views/emails/     ← Blade template HTML Email
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/DatabaseSeeder.php
│   ├── routes/
│   │   └── api.php                 ← API Routes
│   └── .env.example
│
└── frontend/                       ← React 19 + Vite
    └── src/
        ├── api/
        │   ├── axiosClient.js      ← Axios + Bearer Token interceptor
        │   ├── productApi.js
        │   ├── orderApi.js
        │   ├── postApi.js
        │   ├── profileApi.js
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
        │   │   ├── ProfilePage.jsx
        │   │   ├── VietQRPaymentPage.jsx
        │   │   └── OrderDetailPage.jsx
        │   └── admin/
        │       ├── Dashboard.jsx
        │       ├── ProductManagement.jsx
        │       ├── OrderManagement.jsx
        │       ├── PostManagement.jsx
        │       └── ReviewManagement.jsx
        └── styles/
            ├── main.css
            ├── components.css
            ├── admin.css           ← File CSS UI Admin Dashboard
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
copy .env.example .env
```

#### 2.3. Chỉnh sửa file `.env`

Mở file `backend/.env` và cập nhật thông tin Database, và Email (để gửi mail xác nhận đơn):

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

# --- CẤU HÌNH GMAIL GỬI EMAIL ĐẶT HÀNG ---
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME="youremail@gmail.com"  # Email của bạn
MAIL_PASSWORD="xxyyzzkkmmnnaabb"     # Mật khẩu ứng dụng 16 số của Google (App Password)
MAIL_FROM_ADDRESS="youremail@gmail.com"
MAIL_FROM_NAME="${APP_NAME}"
```

#### 2.4. Khởi tạo Storage (cho Avatar & Ảnh bài viết)

```bash
php artisan storage:link
```

#### 2.5. Tạo database

```sql
CREATE DATABASE HQCosmetic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2.6. Generate App Key & chạy Migration + Seeder

```bash
php artisan key:generate
php artisan migrate:fresh --seed
```

> Lệnh `--seed` sẽ tự động tạo **15 sản phẩm mẫu**, **8 thương hiệu**, **5 danh mục**, tài khoản admin và user mẫu.

#### 2.7. Cấu hình VietQR (Thanh toán chuyển khoản)

Mở file `backend/app/Http/Controllers/PaymentController.php` và thay thông tin ngân hàng của bạn:

```php
private $bankConfig = [
    'bank_bin'       => '970422',          // 970436=VCB | 970415=VietinBank | 970418=BIDV | 970422=MBBank
    'account_number' => 'SO_TAI_KHOAN',   // ← Số tài khoản thật của bạn
    'account_name'   => 'TEN_CHU_TK',     // ← Tên chủ TK (VIET HOA KHONG DAU)
    'bank_name'      => 'MBBank',
];
```

#### 2.8. Khởi động Backend

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

## 📡 API Endpoints (Nổi bật)

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/auth/login` | Đăng nhập | ❌ |
| POST | `/auth/register` | Đăng ký | ❌ |
| GET | `/products` | Danh sách sản phẩm (filter, search, sort) | ❌ |
| GET | `/products/new-arrivals` | Lấy danh sách Sản phẩm mới | ❌ |
| GET | `/products/{slug}/related` | Sản phẩm Gợi ý / Cùng bộ | ❌ |
| POST | `/profile/avatar` | Đổi ảnh đại diện người dùng | ✅ |
| POST | `/orders` | Đặt hàng (tự động gửi email + cập nhật kho) | ✅ |
| POST | `/payment/vietqr` | Tạo QR thanh toán | ✅ |
| GET | `/payment/status/{orderId}` | Kiểm tra trạng thái TT (polling) | ✅ |
| POST | `/admin/payment/{orderId}/confirm` | Admin xác nhận đã nhận TT | ✅ Admin |
| GET | `/admin/dashboard` | API thống kê biểu đồ doanh thu (Admin) | ✅ Admin |

> Xem chi tiết trong [`backend/routes/api.php`](./backend/routes/api.php)

---

## 💳 Luồng thanh toán VietQR

```
Khách chọn "VietQR" → Nhấn Đặt hàng
        ↓
Tự động gửi thư Xác nhận Đặt hàng → Chuyển hướng sang /payment/vietqr/{orderId}
        ↓
Hiển thị mã QR + thông tin chuyển khoản (polling kiểm tra mỗi 5 giây)
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
Frontend lưu token vào localStorage và Context
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

# Link public storage (quan trọng để hiện thị ảnh đại diện, ảnh blog)
php artisan storage:link
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
