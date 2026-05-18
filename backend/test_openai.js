require('dotenv').config();
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "hello" }],
      max_tokens: 10
    });
    console.log("SUCCESS:", response.choices[0].message.content);
  } catch (error) {
    console.error("ERROR_MESSAGE:", error.message);
    if(error.response) console.error("ERROR_DATA:", error.response.data);
  }
}
test();
