const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function normalizeModels(models) {
  if (Array.isArray(models)) return models;
  return [{ name: 'default', model: models }];
}

function isRetryableAiError(error) {
  const status = error.status || error.response?.status;
  const message = error.message || '';
  return [429, 500, 502, 503, 504].includes(status) || /high demand|service unavailable|overloaded/i.test(message);
}

function parseJsonResponse(text) {
  const cleaned = text
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
    }
    throw error;
  }
}

async function getAiRecommendations(models, products, options = {}) {
  const { need, maxPrice, brand, limit = 4 } = options;

  let candidates = products;

  if (brand) {
    candidates = candidates.filter(p =>
      p.brand.toLowerCase() === brand.toLowerCase()
    );
  }

  if (maxPrice) {
    candidates = candidates.filter(p => p.price <= Number(maxPrice));
  }

  candidates = candidates.slice(0, 12).map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: p.price,
    rating: p.rating,
    specs: p.specs
  }));

  if (!candidates.length) {
    return { recommendations: [], modelUsed: null };
  }

  const prompt = `
Bạn là AI Recommendation Engine cho cửa hàng PhoneStore.

Nhu cầu khách hàng:
${need}

Danh sách sản phẩm:
${JSON.stringify(candidates, null, 2)}

Hãy chọn tối đa ${limit} sản phẩm phù hợp nhất.
Chỉ chọn id có trong danh sách sản phẩm.

Chỉ trả về JSON hợp lệ, không markdown:
{
  "recommendations": [
    {
      "id": 1,
      "reason": "Lý do đề xuất ngắn gọn bằng tiếng Việt"
    }
  ]
}
`;

  let lastError;
  const modelList = normalizeModels(models);

  for (const entry of modelList) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await entry.model.generateContent(prompt);
        const text = result.response.text().trim();
        const parsed = parseJsonResponse(text);

        const recommendations = (parsed.recommendations || [])
          .map(item => {
            const product = products.find(p => p.id === Number(item.id));
            if (!product) return null;

            return {
              ...product,
              reason: item.reason
            };
          })
          .filter(Boolean);

        return { recommendations, modelUsed: entry.name };
      } catch (error) {
        lastError = error;

        if (!isRetryableAiError(error) && !(error instanceof SyntaxError)) {
          throw error;
        }

        await sleep(500 * attempt);
      }
    }
  }

  throw lastError;
}

module.exports = { getAiRecommendations };
