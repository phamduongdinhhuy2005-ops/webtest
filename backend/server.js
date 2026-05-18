require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
// Cho phép frontend ở localhost khác port gọi API mà không bị lỗi CORS
app.use(cors());
app.use(express.json());

// Khởi tạo kết nối với Google Gemini sử dụng API Key từ file .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cấu hình tính cách cho AI
const systemInstruction = `Bạn là nhân viên tư vấn nhiệt tình của cửa hàng PhoneStore.
Hãy tư vấn cho khách hàng về các dòng điện thoại. 
Trả lời thật ngắn gọn, súc tích (dưới 50 từ), có dùng icon và cực kỳ lịch sự.`;

const model = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest",
  systemInstruction: systemInstruction 
});

app.post('/api/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    
    if (!userMessage) {
      return res.status(400).json({ error: "Tin nhắn không được để trống" });
    }

    // Gọi API của Google Gemini
    const result = await model.generateContent(userMessage);
    const reply = result.response.text();

    // Trả câu trả lời về cho Web Frontend
    res.json({ reply });

  } catch (error) {
    console.error("Lỗi Google Gemini:", error);
    res.status(500).json({ error: "Lỗi kết nối đến hệ thống AI." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend AI (Gemini) đang chạy tại http://localhost:${PORT}`);
  console.log(`⚠️ Nhớ dán GEMINI_API_KEY của bạn vào file .env nhé!`);
});
