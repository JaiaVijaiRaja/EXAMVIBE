# V AI LABS - Engineering Student Assistant

A powerful AI-driven study assistant designed specifically for engineering students.

## Features
- **Smart Notes:** Generate structured engineering notes from topics.
- **Study Planner:** Automated daily study plans based on exam dates.
- **Assignment Helper:** Step-by-step solutions for complex engineering questions.
- **Skill Roadmap:** 4-week learning paths for any technical skill.
- **Predictor:** Predict important exam questions based on syllabus.
- **Flashcards:** AI-generated revision cards.

## Deployment on Vercel

To deploy this application on Vercel, follow these steps:

### 1. Environment Variables
You must configure the following environment variables in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anonymous API Key |
| `GEMINI_API_KEY` | Your Google Gemini API Key |

### 2. Build Settings
Vercel should automatically detect the Vite configuration, but ensure these settings are correct:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 3. Case Sensitivity
This project uses PascalCase for components (e.g., `Layout.tsx`). Ensure your Git configuration is set to track case changes:
```bash
git config core.ignorecase false
```

## Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **AI:** Google Gemini API
- **Backend/Auth:** Supabase
- **Animations:** Motion (Framer Motion)
