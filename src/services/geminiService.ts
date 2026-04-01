
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async generateStudyPlan(subjects: string[], examDate: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
    });
    return JSON.parse(response.text || '[]');
  },

  async generateNotes(topic: string, type: 'short' | 'detailed' | 'exam-ready') {
    const prompt = `Generate ${type} study notes for the engineering topic: "${topic}". Include key definitions, formulas, and a brief summary. Use Markdown formatting.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || '';
  },

  async solveAssignment(question: string) {
    const prompt = `Solve this assignment question with a structured, professional engineering response: "${question}". Include Introduction, Step-by-Step explanation, and Conclusion. Use Markdown.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || '';
  },

  async predictQuestions(subject: string, syllabus: string) {
    const prompt = `Based on the following syllabus for ${subject}, predict 10 important questions likely to appear in the exam. Provide brief reasons for each prediction. Syllabus: ${syllabus}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || '';
  },

  async generateRoadmap(skill: string, level: string, goal: string) {
    const prompt = `Create a 4-week step-by-step roadmap to learn ${skill} starting from ${level} level to achieve: ${goal}. Include resources and a mini project for each week. Output in JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
    return JSON.parse(response.text || '[]');
  },

  async generateChallenge(skill: string) {
    const prompt = `Generate a 7-day micro-learning challenge for ${skill}. Each day should have a specific goal, an action item, and a suggested material. Output in JSON.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
    });
    return JSON.parse(response.text || '[]');
  },

  async generateFlashcards(topics: string[]) {
    const prompt = `Generate 10 revision flashcards for the following engineering topics: ${topics.join(', ')}. Each flashcard should have a 'question' and an 'answer'. Output in JSON format.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
    });
    return JSON.parse(response.text || '[]');
  },

  async generateQuiz(topic: string, content: string) {
    const prompt = `Generate a 5-question multiple-choice quiz based on the following topic: "${topic}" and content: "${content.substring(0, 2000)}". Each question should have 4 options and one correct answer. Output in JSON format.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
    return JSON.parse(response.text || '[]');
  }
};
