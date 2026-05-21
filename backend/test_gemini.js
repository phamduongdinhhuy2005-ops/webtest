require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY in .env');
    }

    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('hello');
    console.log('SUCCESS:', result.response.text());
  } catch (error) {
    console.error('ERROR:', error.message);
  }
}

test();
