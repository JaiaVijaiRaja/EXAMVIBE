import { GoogleGenAI, Type } from '@google/genai';
import { config } from 'dotenv';
config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Generate a 5-question multiple-choice quiz based on the following topic: Advanced Pacing and content: Learn to edit videos with pacing. Each question should have 4 options and one correct answer. Output in JSON format.',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING }
            },
            required: ['question', 'options', 'correctAnswer']
          }
        }
      }
    });
    console.log('Success:', response.text);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
