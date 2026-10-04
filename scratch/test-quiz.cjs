const { GoogleGenAI, Type } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const topic = "editing - Week 1: Advanced Pacing, Narrative Editing";
    const content = "Learn to integrate motion graphics, kinetic typography, and seamless custom transitions to elevate production value. Study audio design, including noise reduction, EQ, and mastering audio levels to industry standards (e.g., -14 LUFS) for online platforms.\nProject: Create a high-energy, 30-second social media promotional video featuring custom motion graphics, dynamic transitions, and polished audio.";
    const prompt = `You are an expert quiz generator for ANY subject (technical, non-technical, arts, soft skills, editing, etc.). Generate a 5-question multiple-choice quiz based on the following topic context: "${topic}" and this content: "${content.substring(0, 2000)}". \nCRITICAL INSTRUCTIONS: \n- Ensure these questions are UNIQUE and randomly selected from the material (Random Seed: ${Math.random()}). Do NOT generate the exact same questions if asked again.\n- Each question must have exactly 4 options and one correctAnswer. \n- You MUST generate the quiz regardless of the topic domain.\n- Output ONLY valid JSON, with no markdown formatting outside the JSON array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-pro',
      contents: prompt,
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
    console.error('Error Details:', e);
  }
}
test();
