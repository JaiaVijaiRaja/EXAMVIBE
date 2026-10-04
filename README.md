<div align="center">
  <br />
  <h1>ExamVibe</h1>
  <p><strong>The Ultimate AI-Driven Study Assistant for Engineering Students</strong></p>
</div>

<br />

ExamVibe is a powerful, modern, and highly interactive learning platform designed specifically to empower students with artificial intelligence. From automated study planners to dynamic flashcards and skill roadmaps, ExamVibe leverages cutting-edge generative AI to accelerate learning and preparation.

---

## ✨ Features

- 📝 **Smart Notes:** Instantly generate structured, exam-ready engineering notes tailored to any topic.
- 📅 **Study Planner:** Create automated, day-by-day study plans customized around your exam dates.
- 🤖 **Assignment Helper:** Get step-by-step, comprehensive solutions for complex engineering questions.
- 🗺️ **Skill Roadmap:** Generate detailed 4-week learning paths for any technical or soft skill, complete with resources and projects.
- 🎯 **Exam Predictor:** Predict the most important exam questions directly from your syllabus with analytical reasoning.
- 🃏 **AI Flashcards:** Automatically generate revision cards for active recall and spaced repetition.
- 📊 **Progress Tracking:** Interactive dashboards to visualize your completed roadmaps and overall study progress.

## 🚀 Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Modern Glassmorphism UI
- **Database & Auth:** Supabase
- **AI Integration:** Google Gemini API (`@google/genai`)

## 🛠️ Getting Started

Follow these steps to set up ExamVibe on your local machine.

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/examvibe.git
cd examvibe
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory and configure your environment variables. 
**Note:** Keep these values private and never commit your `.env` file to version control.

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Your application will be live at `http://localhost:3000`.

## 📦 Deployment (Vercel)

ExamVibe is fully optimized for Vercel deployment. 

1. Push your repository to GitHub.
2. Import the project into Vercel.
3. In the **Environment Variables** section of your Vercel project settings, securely add your Supabase and Gemini keys.
4. Deploy! Vercel will automatically detect the Vite build configuration.

## 📄 License

This project is open-source and available under the MIT License.
