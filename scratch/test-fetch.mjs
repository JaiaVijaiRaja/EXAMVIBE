const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;

const topic = "editing - Week 1: Advanced Pacing, Narrative Editing";
const content = "Learn to integrate motion graphics, kinetic typography, and seamless custom transitions to elevate production value. Study audio design, including noise reduction, EQ, and mastering audio levels to industry standards (e.g., -14 LUFS) for online platforms.\nProject: Create a high-energy, 30-second social media promotional video featuring custom motion graphics, dynamic transitions, and polished audio.";

const promptText = `You are an expert quiz generator for ANY subject (technical, non-technical, arts, soft skills, editing, etc.). Generate a 5-question multiple-choice quiz based on the following topic context: "${topic}" and this content: "${content.substring(0, 2000)}". \nCRITICAL INSTRUCTIONS: \n- Each question must have exactly 4 options and one correctAnswer. \n- You MUST generate the quiz regardless of the topic domain.\n- Output ONLY valid JSON, with no markdown formatting outside the JSON array.`;

async function test() {
  const req = {
    contents: [{ role: "user", parts: [{ text: promptText }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING" },
            options: { type: "ARRAY", items: { type: "STRING" } },
            correctAnswer: { type: "STRING" }
          },
          required: ["question", "options", "correctAnswer"]
        }
      }
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
test();
