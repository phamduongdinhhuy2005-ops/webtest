# File demo Công nghệ phần mềm

Dự án website bán điện thoại có frontend tĩnh và backend Node.js dùng Google Gemini cho chatbot AI.

## Chạy frontend

Mở `index.html` trực tiếp trong trình duyệt, hoặc dùng Live Server trong VS Code.

## Cấu hình backend Gemini

```bash
cd backend
npm install
copy .env.example .env
```

Mở file `backend/.env`, thay `your_api_key_here` bằng Gemini API key thật.

Chạy backend:

```bash
npm start
```

Kiểm tra backend:

```text
http://localhost:3000
```

Chatbot frontend đang gọi:

```text
POST http://localhost:3000/api/chat
```

## AI Recommendation Engine

Dự án có API gợi ý sản phẩm bằng AI:

```text
POST /api/ai-recommendations
```

Payload mẫu:

```text
{
  "need": "Tôi cần điện thoại pin tốt, chụp ảnh đẹp, giá dưới 20 triệu",
  "maxPrice": 20000000,
  "brand": "",
  "limit": 4
}
```

Giao diện gọi API này nằm trong trang `products.html`, tại khối **AI Recommendation** phía trên danh sách sản phẩm.

### Cách chạy cho người mới

1. Tạo file `.env` trong thư mục `backend`:

```bash
copy .env.example .env
```

2. Mở `backend/.env` và điền API key:

```env
GEMINI_API_KEY=api_key_cua_ban
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODELS=gemini-2.5-flash-lite,gemini-1.5-flash
PORT=3000
```

3. Chạy backend:

```bash
cd backend
npm start
```

4. Mở `products.html`, nhập nhu cầu như:

```text
Tôi cần điện thoại pin tốt, chụp ảnh đẹp, giá dưới 20 triệu
```

5. Bấm **Gợi ý bằng AI** để xem danh sách sản phẩm được đề xuất.

### Test API bằng PowerShell

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/ai-recommendations" `
  -Method Post `
  -ContentType "application/json; charset=utf-8" `
  -Body '{"need":"pin tốt, chụp ảnh đẹp, giá dưới 20 triệu","maxPrice":20000000,"limit":4}'
```

### Ghi chú lỗi thường gặp

- Nếu báo thiếu `GEMINI_API_KEY`: kiểm tra file `backend/.env`.
- Nếu báo model quá tải `503 Service Unavailable`: thử lại sau ít phút hoặc đổi `GEMINI_MODEL=gemini-2.5-flash-lite`.
- Nếu giao diện không có kết quả: đảm bảo backend đang chạy ở `http://localhost:3000`.
- API chỉ chọn sản phẩm có trong `backend/data/products.js`, không tự tạo sản phẩm mới.
