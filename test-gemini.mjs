import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';

// Read .env manually
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

async function test() {
  try {
    const prompt = `Create a 4-week step-by-step roadmap to learn machine language starting from Beginner level to achieve: for fun. Include resources and a mini project for each week. Output in JSON.`;
    console.log("Calling Gemini API with key:", env.GEMINI_API_KEY ? "Loaded" : "Missing");
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
    console.log("Success! Response text:", response.text);
  } catch (e) {
    console.error("API Error details:", e);
    console.error("Message:", e.message);
  }
}
test();
