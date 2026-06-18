# 🧠 StudyGenius AI

> **AI-powered study assistant** that helps students learn faster — upload notes, generate summaries, create flashcards, take quizzes, and chat with your documents using Google Gemini AI.

[![Live Demo](https://img.shields.io/badge/Live-Demo-6370f1?style=for-the-badge)](https://studygenius-ai.vercel.app)
[![Backend](https://img.shields.io/badge/API-Railway-0B0D0E?style=for-the-badge)](https://api.studygenius.railway.app/health)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/Node-20+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Document Upload** | Upload PDF, DOCX, TXT, PPTX with drag & drop — text extracted automatically |
| 🤖 **AI Summaries** | Short, Detailed, Bullet, Chapter-wise, Key Concepts in Easy / Exam / Quick mode |
| 🃏 **Flashcards** | AI generates flip-cards with Known/Unknown tracking and review mode |
| 🧪 **MCQ Generator** | 10–50 questions at Easy/Medium/Hard with explanations |
| ⏱ **Timed Quiz** | Timer, instant feedback, score tracking, retry, full answer review |
| 💬 **AI Chat (RAG)** | Ask questions answered *only* from your uploaded notes with source references |
| 💡 **Smart Insights** | Important topics, likely exam questions, key formulas, definitions |
| 📊 **Analytics** | Weekly study time, quiz score trends, activity breakdown charts |
| 🎯 **Study Goals** | Set goals with daily targets and track progress |
| 🔖 **Bookmarks** | Save summaries, flashcard sets, MCQ sets |
| 🔍 **Global Search** | Search across all notes, summaries, flashcards, MCQs |
| 🌙 **Dark Mode** | Full dark/light theme with persistent preference |
| 📱 **Responsive** | Fully mobile-friendly with collapsible sidebar |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend (Vite)               │
│   React Router · TanStack Query · Zustand · Framer  │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (Axios + JWT)
┌──────────────────────▼──────────────────────────────┐
│              Node.js / Express Backend               │
│   Auth · Notes · Summary · Flashcards · MCQ · Chat  │
│   Rate Limiting · Helmet · Input Validation          │
└───────┬──────────────────────────┬──────────────────┘
        │                          │
┌───────▼────────┐      ┌──────────▼──────────────────┐
│  Supabase      │      │      Google Gemini AI        │
│  PostgreSQL    │      │   gemini-1.5-flash           │
│  Auth          │      │   Summary · Flashcards       │
│  Storage       │      │   MCQs · Chat (RAG)          │
└────────────────┘      └─────────────────────────────-┘
```

---

## 🗄 Database Schema

```
profiles ──── notes ──── summaries
                 │
                 ├──── flashcard_sets ──── flashcards
                 │
                 ├──── mcq_sets ──── mcqs
                 │
                 └──── chat_sessions ──── chat_messages

profiles ──── quiz_results
          ├── bookmarks
          ├── study_goals
          ├── study_sessions
          └── notifications
```

All tables use Row Level Security (RLS) — users can only access their own data.

---

## 🛠 Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS (dark mode, custom design tokens)
- React Router v7
- TanStack Query (server state)
- Zustand (client state)
- Framer Motion (animations)
- Recharts (analytics charts)
- React Dropzone (file upload)
- React Markdown (AI content rendering)
- React Hot Toast (notifications)

**Backend**
- Node.js + Express.js (ESM)
- Multer (file uploads — memory storage)
- pdf-parse + mammoth (text extraction)
- Winston (structured logging)
- Helmet + express-rate-limit (security)
- XSS sanitization

**Database & Auth**
- Supabase PostgreSQL
- Supabase Auth (email + Google OAuth)
- Supabase Storage (file storage)
- Row Level Security on all tables

**AI**
- Google Gemini 1.5 Flash
- RAG pipeline for chat-with-notes
- Structured JSON output for MCQs & flashcards

**Deployment**
- Frontend → Vercel
- Backend → Railway
- Database → Supabase Cloud

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) Gemini API key

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/studygenius-ai.git
cd studygenius-ai
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full schema:
   ```
   database/schema.sql
   ```
3. Go to **Storage** and create a bucket named `notes` (set to **Public**)
4. Enable **Google OAuth** under Auth → Providers if needed

### 3. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in all values in .env
npm run dev
```

### 4. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm run dev
```

Visit `http://localhost:5173` 🎉

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...       # service_role key (never expose publicly)
SUPABASE_ANON_KEY=eyJ...

JWT_SECRET=your-32-char-secret
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=AIza...

MAX_FILE_SIZE_MB=25
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_MAX=100
AI_RATE_LIMIT_MAX=20
```

### Frontend (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:5000/api
```

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Or connect GitHub repo to Vercel, set root directory to /frontend
# Add all VITE_ environment variables in Vercel dashboard
```

### Backend → Railway
```bash
# Connect GitHub repo to Railway
# Set root directory to /backend
# Add all environment variables in Railway dashboard
# Railway auto-detects Node.js and runs npm start
```

> Set `FRONTEND_URL` on the backend to your Vercel URL to allow CORS.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register with email/password |
| POST | `/api/auth/signin` | Login |
| POST | `/api/auth/signout` | Logout |
| GET  | `/api/auth/profile` | Get user profile |
| PATCH| `/api/auth/profile` | Update profile |
| POST | `/api/auth/forgot-password` | Send reset email |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/notes` | List notes (search, paginate) |
| POST | `/api/notes` | Upload note (multipart/form-data) |
| GET  | `/api/notes/:id` | Get note with metadata |
| PATCH| `/api/notes/:id` | Rename note |
| DELETE | `/api/notes/:id` | Delete note |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/summary` | Generate summary |
| GET  | `/api/summary/note/:noteId` | List summaries for note |
| GET  | `/api/summary/insights/:noteId` | Smart insights (topics, exam Qs) |
| GET  | `/api/summary/eli5/:noteId` | Explain Like I'm 5 |
| POST | `/api/flashcards` | Generate flashcard set |
| POST | `/api/mcq` | Generate MCQ set |
| POST | `/api/quiz/submit` | Submit quiz result |
| POST | `/api/chat/message` | Send message to AI |

---

## 🔒 Security Features

- ✅ Supabase Row Level Security on all tables
- ✅ JWT via Supabase Auth (access + refresh tokens)
- ✅ Helmet HTTP security headers
- ✅ CORS restricted to known origin
- ✅ Rate limiting (100 req/15min global, 20 req/min for AI)
- ✅ File type validation (MIME + extension)
- ✅ File size limit (25 MB)
- ✅ XSS sanitization on user inputs
- ✅ Environment variables for all secrets
- ✅ Service-role key only on backend (never exposed to frontend)

---

## 📁 Project Structure

```
studygenius-ai/
├── database/
│   └── schema.sql                    # Complete Supabase schema
│
├── backend/
│   ├── src/
│   │   ├── server.js                 # Express app entry
│   │   ├── config/supabase.js        # Supabase client
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT + rate limit
│   │   │   └── upload.js             # Multer config
│   │   ├── services/
│   │   │   ├── gemini.js             # All AI functions
│   │   │   └── fileParser.js         # PDF/DOCX extraction
│   │   ├── controllers/
│   │   │   ├── notesController.js
│   │   │   ├── summaryController.js
│   │   │   ├── flashcardsController.js
│   │   │   ├── mcqController.js      # MCQ + Quiz
│   │   │   ├── chatController.js     # RAG chat
│   │   │   └── analyticsController.js
│   │   ├── routes/                   # Express routers
│   │   └── utils/logger.js
│   ├── .env.example
│   └── railway.json
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx                   # Routes
    │   ├── index.css                 # Tailwind + design system
    │   ├── components/
    │   │   └── layout/AppLayout.jsx  # Sidebar + topbar
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── DashboardPage.jsx     # Stats + charts
    │   │   ├── NotesPage.jsx         # Upload + list
    │   │   ├── NoteDetailPage.jsx    # AI action hub
    │   │   ├── FlashcardsPage.jsx
    │   │   ├── FlashcardReview.jsx   # Flip-card UX
    │   │   ├── MCQPage.jsx
    │   │   ├── QuizPage.jsx          # Timed quiz
    │   │   ├── QuizResultPage.jsx
    │   │   ├── ChatPage.jsx          # RAG chat UI
    │   │   ├── AnalyticsPage.jsx
    │   │   ├── GoalsPage.jsx
    │   │   ├── BookmarksPage.jsx
    │   │   ├── SearchPage.jsx
    │   │   └── ProfilePage.jsx
    │   ├── services/
    │   │   ├── api.js                # Axios + all API methods
    │   │   └── supabase.js
    │   └── store/
    │       ├── authStore.js          # Zustand auth state
    │       └── themeStore.js         # Dark mode
    ├── vercel.json
    └── .env.example
```

---

## 🔮 Future Improvements

- [ ] Vector embeddings (pgvector) for semantic search over notes
- [ ] Voice notes recording & speech-to-text
- [ ] Text-to-speech for summaries and flashcards
- [ ] PDF highlighting and annotation
- [ ] Export summaries & flashcards as PDF
- [ ] Collaborative notes & shared flashcards
- [ ] AI Mind Map generator
- [ ] Multi-language support (i18n)
- [ ] Spaced repetition algorithm for flashcards
- [ ] Study timer with Pomodoro mode
- [ ] Push notifications for study reminders

---

## 📄 Resume Highlights

> Use these bullet points when describing this project on your resume or LinkedIn:

- **Built a full-stack AI study platform** using React, Node.js, Supabase, and Google Gemini API with features including RAG-based chat, automated MCQ/flashcard generation, and real-time quiz scoring
- **Implemented a RAG (Retrieval-Augmented Generation) pipeline** that allows students to chat with their uploaded documents, with context-aware responses and source attribution
- **Designed and deployed a production-ready REST API** with JWT authentication, role-based access via Supabase RLS, rate limiting, and XSS protection
- **Engineered an AI document processing pipeline** supporting PDF, DOCX, PPTX, and TXT — extracting text, generating summaries in multiple modes, and creating structured flashcards/MCQs via Gemini 1.5 Flash
- **Deployed on Vercel + Railway + Supabase** with CI/CD, SPA routing, CORS configuration, and environment-based security

---

## 👨‍💻 Author

**Kunal** — B.Tech AI & Data Science  
Annasaheb Dange College of Engineering and Technology, Ashta  

[![GitHub](https://img.shields.io/badge/GitHub-Profile-181717?style=flat&logo=github)](https://github.com/YOUR_USERNAME)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/YOUR_PROFILE)

---

## 📝 License

MIT © 2025 — Free to use for learning and portfolio purposes.
