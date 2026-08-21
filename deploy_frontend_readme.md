# HƯỚNG DẪN DEPLOY FRONTEND LÊN TINOHOSTING (myjobpoly.site)

Tôi đã sửa lỗi config build và test build thành công ở máy của bạn.
Dưới đây là các bước để bạn đưa frontend lên cPanel:

## Bước 1: Build Frontend ở máy của bạn
1. Mở Terminal tại thư mục `c:\laragon\www\frontend`.
2. Chạy lệnh:
   ```bash
   npm run build
   ```
3. Sau khi chạy xong, một thư mục tên là `dist` sẽ được tạo ra tại `c:\laragon\www\frontend\dist`.

## Bước 2: Nén thư mục dist
1. Vào thư mục `c:\laragon\www\frontend\dist`.
2. Chọn toàn bộ các file bên trong thư mục này (bao gồm thư mục `assets`, file `index.html`, file `.htaccess`,...).
3. Nén chúng lại thành một file `.zip` (ví dụ: `frontend.zip`).
   *Lưu ý: Không nén cả thư mục cha `dist`, chỉ nén các file ruột bên trong.*

## Bước 3: Upload lên cPanel Tino
1. Đăng nhập vào cPanel của Tino.
2. Truy cập vào **File Manager** (Trình quản lý tệp).
3. Tìm đến thư mục chạy tên miền của bạn (thường là thư mục `public_html` cho domain chính `myjobpoly.site`).
4. Nhấn **Upload** ở thanh công cụ phía trên và tải file `frontend.zip` lên.
5. Giải nén (Extract) file `frontend.zip` trực tiếp tại thư mục đó.
   *Sau khi giải nén, file `index.html` và `.htaccess` phải nằm trực tiếp trong thư mục root chạy domain (ví dụ: `public_html/index.html`).*

## Bước 4: Kiểm tra cấu hình router (Đã làm sẵn)
React sử dụng Router dạng SPA, nên khi F5 trang con sẽ bị lỗi 404 nếu không có cấu hình điều hướng.
Tôi đã tạo sẵn file `.htaccess` trong thư mục `public/` chứa nội dung sau (nó đã được tự động copy sang thư mục `dist` sau khi build):
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```
Bạn chỉ cần chắc chắn file này có tồn tại trong thư mục root sau khi giải nén trên cPanel.

---
Chúc bạn deploy thành công! Nếu gặp lỗi gì trong quá trình thực hiện hãy nhắn tôi.
