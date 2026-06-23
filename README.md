<h1 align="center">💄 HQCosmetic</h1>

<p align="center">
  Website bán mỹ phẩm full-stack: <strong>Laravel 13</strong> (Backend API) + <strong>React + Vite</strong> (Frontend)
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Sanctum-4-FF2D20?style=for-the-badge&logo=laravel&logoColor=white"/>
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>
</p>

---

## 📁 Cấu trúc dự án

```
HQCosmetic/
├── backend/                  ← Laravel 13 API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Providers/
│   ├── database/
│   │   └── migrations/
│   ├── routes/
│   │   ├── api.php           ← API routes
│   │   └── web.php
│   ├── config/
│   └── .env.example
│
└── frontend/                 ← React + Vite
    └── src/
        ├── api/              ← Axios client & API calls
        ├── config/           ← Cấu hình chung
        ├── context/          ← React Context (Auth, ...)
        ├── layouts/          ← MainLayout, AdminLayout
        ├── components/       ← UI Components dùng chung
        ├── pages/            ← Trang người dùng
        └── pages/admin/      ← Trang quản trị admin
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
git clone https://github.com/huypros1/HQCosmetic.git
cd HQCosmetic
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

Mở file `backend/.env` và cập nhật thông tin database:

```env
APP_NAME=HQCosmetic
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=HQCosmetic      # ← Tên database của bạn
DB_USERNAME=root               # ← Username MySQL
DB_PASSWORD=                   # ← Password MySQL (để trống nếu dùng Laragon mặc định)

FRONTEND_URL=http://localhost:5174
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:5174
```

#### 2.4. Tạo database

Tạo database `HQCosmetic` trong MySQL (dùng phpMyAdmin hoặc terminal):

```sql
CREATE DATABASE HQCosmetic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2.5. Generate App Key & chạy Migration

```bash
php artisan key:generate
php artisan migrate
```

#### 2.6. (Tuỳ chọn) Chạy Seeder

```bash
php artisan db:seed
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
```

#### 3.1. Cài dependencies

```bash
npm install
```

#### 3.2. Tạo file `.env`

```bash
cp .env.example .env
```

> Nếu chưa có `.env.example`, tạo file `.env` với nội dung:

```env
VITE_APP_NAME=HQCosmetic
VITE_API_URL=http://localhost:8000/api
```

#### 3.3. Khởi động Frontend

```bash
npm run dev
```

✅ Frontend chạy tại: **http://localhost:5174**

---

## 🖥️ Sử dụng

### Khởi động nhanh (mỗi lần làm việc)

**Terminal 1 — Backend:**
```bash
cd backend
php artisan serve
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

### Truy cập

| URL | Mô tả |
|-----|-------|
| http://localhost:5174 | 🛍️ Trang bán hàng (người dùng) |
| http://localhost:5174/admin | 🔧 Trang quản trị admin |
| http://localhost:8000/api | 📡 Laravel API |
| http://localhost:8000/up | 💚 Health check |

---

## 📡 API

Base URL: `http://localhost:8000/api`

Tất cả các request cần gửi header:
```
Content-Type: application/json
Accept: application/json
```

Các route yêu cầu đăng nhập cần gửi thêm:
```
Authorization: Bearer {token}
```

> Xem chi tiết các API endpoint trong file [`backend/routes/api.php`](./backend/routes/api.php)

### Test Bằng Postman

Dự án có sẵn file **Postman Collection** để bạn test API dễ dàng:
1. Mở Postman
2. Import file `HQCosmetic_API.postman_collection.json` (nằm ở thư mục gốc của dự án)
3. Chạy API `Login` thành công, token sẽ tự động được lưu vào biến `{{token}}` để dùng cho các request cần xác thực.

---

## 📦 Thư viện sử dụng

### Backend
| Package | Mô tả |
|---------|-------|
| `laravel/framework` v13 | PHP framework |
| `laravel/sanctum` v4 | API token authentication |
| `laravel/tinker` | REPL tương tác |

### Frontend
| Package | Mô tả |
|---------|-------|
| `react` v19 | UI library |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client |
| `@tanstack/react-query` | Server state management |
| `zustand` | Client state management |
| `react-hook-form` | Form handling |

---

## 🗂️ Cấu trúc Frontend (`src/`)

| Thư mục | Vai trò |
|---------|---------|
| `api/` | `axiosClient.js` — cấu hình Axios, interceptor token & lỗi |
| `config/` | Hằng số, cấu hình toàn app |
| `context/` | React Context: `AuthContext` (quản lý đăng nhập) |
| `layouts/` | `MainLayout` (shop), `AdminLayout` (admin sidebar) |
| `components/` | UI components tái sử dụng |
| `pages/` | Các trang của người dùng (Home, Products, Cart...) |
| `pages/admin/` | Các trang admin (Dashboard, Products, Orders...) |

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
# Tạo migration mới
php artisan make:migration create_products_table

# Tạo Model + Migration + Controller + Resource
php artisan make:model Product -mcr

# Chạy lại toàn bộ migration
php artisan migrate:fresh --seed

# Xem danh sách routes
php artisan route:list

# Xoá cache
php artisan optimize:clear
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
