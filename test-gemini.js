import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function test() {
  try {
    const prompt = `Create a 4-week step-by-step roadmap to learn machine language starting from Beginner level to achieve: for fun. Include resources and a mini project for each week. Output in JSON.`;
    console.log("Calling Gemini API...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              week: { type: Type.INTEGER },
              topic: { type: Type.STRING },
              description: { type: Type.STRING },
              resources: { type: Type.ARRAY, items: { type: Type.STRING } },
              project: { type: Type.STRING }
            },
            required: ['week', 'topic', 'description', 'resources', 'project']
          }
        }
      }
    });
    console.log("Response text:", response.text);
  } catch (e) {
    console.error("API Error:", e);
  }
}
test();
