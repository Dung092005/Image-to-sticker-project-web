# StickAI

StickAI tạo bộ sticker từ ảnh người dùng bằng **React + Vite**, API **Node.js**, **Supabase Postgres** và script Python kết nối Vertex AI.

## Chạy project

Yêu cầu: Node.js 20+ và Python 3 (nếu muốn tạo ảnh thật).

```bash
cd stickai-class
npm install
npm run server
```

Terminal thứ hai:

```bash
cd stickai-class
npm run web
```

Mở http://localhost:5173  

Vite proxy `/api` → Node `:3000`, nên React chỉ gọi `fetch("/api/...")`.

### Đăng nhập và quản trị

Đăng nhập production dùng Google OAuth. Đặt email quản trị trong biến `ADMIN_EMAILS`.

## Kiến trúc

```text
React (Vite :5173) --fetch /api--> Vite proxy --> Node server (:3000)
                                                      |
                                               Supabase Postgres
                                               (users, sessions, sticker_cards, generated_stickers)
                                                      |
                                               spawn Python
                                                      |
                                               Vertex AI / Gemini
```

Cần `DATABASE_URL` trong `.env.local` (connection string pooler Supabase). Session lưu bảng `sessions`; người dùng được tạo khi đăng nhập Google lần đầu. Đặt email quản trị trong `ADMIN_EMAILS`.

### Frontend (`web/src`)

- `main.jsx` — `BrowserRouter`
- `App.jsx` — routes và bảo vệ trang cần đăng nhập
- `pages/` — Landing, Collection, History, Admin
- `components/` — Header, DataTable
- `api.js` — `fetch` + `credentials: "include"` để gửi session cookie

### Backend (`server/server.js`)

Các route REST được xử lý theo method và path. `send()` đặt status, JSON và kết thúc response.

Session lưu trong bảng `sessions` trên Supabase (cookie chỉ giữ UUID).

### Database migrations (`server/migrations`)

Schema được chia thành các file SQL nhỏ và chạy theo thứ tự tên khi server khởi động lần đầu:

1. `001_users.sql` — tài khoản và quyền người dùng
2. `002_sessions.sql` — phiên đăng nhập
3. `003_sticker_cards.sql` — danh mục bộ sticker
4. `004_generated_stickers.sql` — các job/kết quả tạo sticker
5. `005_remove_password_credentials.sql` — xóa các cột thông tin đăng nhập bằng mật khẩu khỏi `users`
6. `006_remove_sticker_topic.sql` — xóa cột `topic` khỏi `sticker_cards`

Migration 005 xóa dữ liệu xác thực mật khẩu; các tài khoản cần đăng nhập bằng Google. Database được chia sẻ với Sticker-WEBAPP, nên ứng dụng đó cũng sẽ mất đăng nhập bằng mật khẩu nếu còn sử dụng các cột này.

Migration 006 xóa cột `topic` khỏi bảng dùng chung `sticker_cards`; các ứng dụng khác còn đọc cột này sẽ cần cập nhật.

Server ghi nhận file đã chạy trong bảng `schema_migrations`, nên lần khởi động sau chỉ chạy migration mới. `ADMIN_EMAILS` đồng bộ quyền quản trị lúc server khởi động.

## API contract

| Method + path | Status | Ý nghĩa |
| --- | --- | --- |
| `POST /api/auth/logout` | 200 | Xoá session |
| `GET /api/auth/me` | 200 / 401 | User hiện tại |
| `GET /api/cards` | 200 | Danh sách bộ sticker |
| `POST /api/generate` | 202 / 4xx | Nhận job tạo ảnh |
| `GET /api/history` | 200 / 401 | Lịch sử của user |
| `GET /api/generated/:id` | 200 / 404 | Ảnh PNG (chỉ owner) |
| `GET /api/admin` | 200 / 403 | Users + cards |
| `PUT /api/admin/cards/:id` | 200 / 403 | Admin sửa card |

## Vertex AI

File `.env.local` (đã có mẫu / có thể copy từ `.env.example`):

```bash
GCP_PROJECT_ID=project-3b0c96e7-a43e-4f65-8bd
GCP_LOCATION=us-central1
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
STICKAI_PYTHON=C:\Users\admin\AppData\Local\Programs\Python\Python312\python.exe
```

```bash
pip install -r scripts/requirements.txt
```

Cần Google Application Default Credentials (`gcloud auth application-default login`).  
`scripts/generate_image.py` lấy từ dự án gốc (có `build_prompt` 16 sticker). Node chỉ spawn Python.

Nếu thiếu env/credentials: History hiện `error` + message rõ, không treo im.

