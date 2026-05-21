const products = require('./data/products');
const { getAiRecommendations } = require('./services/aiRecommendationService');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODEL_NAMES = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-2.5-flash-lite,gemini-1.5-flash')
  .split(',')
  .map(name => name.trim())
  .filter(Boolean)
  .filter(name => name !== MODEL_NAME);
const hasApiKey = Boolean(process.env.GEMINI_API_KEY);

if (!hasApiKey) {
  console.warn('Cảnh báo: Chưa cấu hình GEMINI_API_KEY trong file .env');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `Bạn là nhân viên tư vấn điện thoại của cửa hàng PhoneStore.

Luôn trả lời bằng tiếng Việt có dấu.

Khi tư vấn sản phẩm, hãy trình bày theo cấu trúc:

Tóm tắt:
Viết 1-2 câu ngắn về nhu cầu của khách.

Gợi ý phù hợp:
1. Tên sản phẩm
   - Lý do phù hợp: ...
   - Cần lưu ý: ...

2. Tên sản phẩm
   - Lý do phù hợp: ...
   - Cần lưu ý: ...

Kết luận:
Đưa ra lựa chọn đáng mua nhất trong 1 câu.

Quy tắc:
- Xuống dòng rõ ràng.
- Không viết đoạn dài quá 3 dòng.
- Hạn chế icon/emoji.
- Không bịa thông số nếu chưa có dữ liệu.`;

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction
});

const recommendationModels = [MODEL_NAME, ...FALLBACK_MODEL_NAMES].map(name => ({
  name,
  model: genAI.getGenerativeModel({ model: name })
}));

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PhoneStore Gemini Backend',
    model: MODEL_NAME,
    fallbackModels: FALLBACK_MODEL_NAMES,
    chatEndpoint: '/api/chat',
    recommendationEndpoint: '/api/ai-recommendations',
    hasApiKey
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!hasApiKey) {
      return res.status(500).json({ error: 'Backend chưa cấu hình GEMINI_API_KEY trong file .env' });
    }

    if (!userMessage) {
      return res.status(400).json({ error: 'Tin nhắn không được để trống' });
    }

    const result = await model.generateContent(userMessage);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error('Lỗi Google Gemini:', error);
    res.status(500).json({ error: 'Lỗi kết nối đến hệ thống AI.' });
  }
});

app.post('/api/ai-recommendations', async (req, res) => {
  try {
    if (!hasApiKey) {
      return res.status(500).json({
        error: 'Backend chưa cấu hình GEMINI_API_KEY trong file .env'
      });
    }

    const { need, maxPrice, brand, limit } = req.body;

    if (!need) {
      return res.status(400).json({
        error: 'Vui lòng nhập nhu cầu cần tư vấn'
      });
    }

    const result = await getAiRecommendations(recommendationModels, products, {
      need,
      maxPrice,
      brand,
      limit
    });

    res.json({
      count: result.recommendations.length,
      modelUsed: result.modelUsed,
      recommendations: result.recommendations
    });
  } catch (error) {
    console.error('Lỗi AI Recommendation:', error);
    const status = error.status || error.response?.status;
    const isBusy = [429, 500, 502, 503, 504].includes(status) || /high demand|service unavailable|overloaded/i.test(error.message || '');

    res.status(500).json({
      error: isBusy
        ? 'Model AI đang quá tải. Vui lòng thử lại sau ít phút hoặc đổi GEMINI_MODEL sang gemini-2.5-flash-lite trong file .env.'
        : 'Không thể tạo gợi ý sản phẩm lúc này.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend AI (Gemini) đang chạy tại http://localhost:${PORT}`);
  console.log(`Model đang dùng: ${MODEL_NAME}`);
  console.log(`Model dự phòng cho Recommendation: ${FALLBACK_MODEL_NAMES.join(', ') || 'không có'}`);
  if (!hasApiKey) {
    console.log('Nhớ tạo file .env và thêm GEMINI_API_KEY trước khi gọi /api/chat');
  }
});
