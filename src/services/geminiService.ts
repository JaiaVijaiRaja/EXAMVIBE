
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = typeof process !== 'undefined' && process.env.GEMINI_API_KEY 
  ? process.env.GEMINI_API_KEY 
  : import.meta.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const parseJSON = (text: string) => {
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned || '[]');
  } catch (e) {
    console.error("Failed to parse JSON response:", text);
    return [];
  }
};

const withRetry = async <T>(fn: (model: string) => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  const models = ['gemini-3.5-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    let currentRetries = retries;
    let currentDelay = delay;
    
    while (currentRetries >= 0) {
      try {
        return await fn(model);
      } catch (error: any) {
        lastError = error;
        // Don't retry on 400 (Bad Request / Safety) or 404 (Not Found)
        if (error.status === 400 || error.status === 404) {
          throw error;
        }
        
        if (currentRetries === 0) break;
        
        console.warn(`[${model}] API call failed, retrying in ${currentDelay}ms... (${currentRetries} retries left)`, error.message);
        await new Promise(res => setTimeout(res, currentDelay));
        currentRetries--;
        currentDelay *= 2;
      }
    }
    console.warn(`Model ${model} exhausted retries or hit quota. Switching to next model...`);
  }
  
  throw lastError;
};

export const geminiService = {
  async generateStudyPlan(subjects: string[], examDate: string) {
    const response = await withRetry((model) => ai.models.generateContent({
      model,
      contents: `Generate a daily study plan for these subjects: ${subjects.join(', ')}. The final exam is on ${examDate}. Focus on engineering student needs. Output in JSON format.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['day', 'tasks']
          }
        }
      }
    }));
    return parseJSON(response.text || '[]');
  },

  async generateNotes(topic: string, type: 'short' | 'detailed' | 'exam-ready') {
    const prompt = `You are an expert engineering tutor. Generate structured, exam-ready study notes for the engineering topic: "${topic}". 
Always use markdown formatting with clear headings and bullet points. Avoid walls of text, and keep explanations concise and exam-focused.

Ensure the notes strictly follow this structure:
# ${topic}
## 1. Introduction
## 2. Key Concepts
## 3. Working Principle
## 4. Important Formulas (if applicable)
## 5. Real World Applications
## 6. Quick Revision Points

Generate the ${type} version of these notes.`;
    const response = await withRetry((model) => ai.models.generateContent({
      model,
      contents: prompt,
    }));
    return response.text || '';
  },

  async solveAssignment(question: string) {
    const prompt = `Solve this assignment question with a structured, professional engineering response: "${question}". Include Introduction, Step-by-Step explanation, and Conclusion. Use Markdown.`;
    const response = await withRetry((model) => ai.models.generateContent({
      model,
      contents: prompt,
    }));
    return response.text || '';
  },

  async predictQuestions(subject: string, syllabus: string) {
    const prompt = `Based on the following syllabus for ${subject}, predict 10 important questions likely to appear in the exam. Provide brief reasons for each prediction. Syllabus: ${syllabus}`;
    const response = await withRetry((model) => ai.models.generateContent({
      model,
      contents: prompt,
    }));
    return response.text || '';
  },

  async generateRoadmap(skill: string, level: string, goal: string) {
    const prompt = `Create a 4-week step-by-step roadmap STRICTLY to learn the specific skill/topic "${skill}" starting from ${level} level to achieve: "${goal}". 
CRITICAL INSTRUCTION: Do NOT provide a generic Computer Science roadmap. Every week's topic, description, and project must be heavily focused on "${skill}" ONLY. 
For resources, provide specific items formatted exactly as markdown links: "[Resource Name](https://actual-link.com)". Output in JSON.`;
    const response = await withRetry((model) => ai.models.generateContent({
      model,
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
    }));
    return parseJSON(response.text || '[]');
  },

  async generateChallenge(skill: string) {
    const prompt = `Generate a 7-day micro-learning challenge for ${skill}. Each day should have a specific goal, an action item, and a suggested material. Output in JSON.`;
    const response = await withRetry((model) => ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER },
              goal: { type: Type.STRING },
              action: { type: Type.STRING },
              material: { type: Type.STRING }
            },
            required: ['day', 'goal', 'action', 'material']
          }
        }
      }
    }));
    return parseJSON(response.text || '[]');
  },

  async generateFlashcards(topics: string[]) {
    const prompt = `Generate 10 revision flashcards for the following engineering topics: ${topics.join(', ')}. Each flashcard should have a 'question' and an 'answer'. Output in JSON format.`;
    const response = await withRetry((model) => ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING }
            },
            required: ['question', 'answer']
          }
        }
      }
    }));
    return parseJSON(response.text || '[]');
  },

  async generateQuiz(topic: string, content: string) {
    const prompt = `You are an expert quiz generator for ANY subject (technical, non-technical, arts, soft skills, editing, etc.). Generate a 5-question multiple-choice quiz based on the following topic context: "${topic}" and this content: "${content.substring(0, 2000)}". 
CRITICAL INSTRUCTIONS: 
- Ensure these questions are UNIQUE and randomly selected from the material (Random Seed: ${Math.random()}). Do NOT generate the exact same questions if asked again.
- Each question must have exactly 4 options and one correctAnswer. 
- You MUST generate the quiz regardless of the topic domain.
- Output ONLY valid JSON, with no markdown formatting outside the JSON array.`;
    const response = await withRetry((model) => ai.models.generateContent({
      model,
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
    }));
    return parseJSON(response.text || '[]');
  }
};
