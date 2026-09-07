# ReflectAI 🧠

> **Capture → Remember → Understand → Improve.**

ReflectAI is a production-quality, AI-powered voice notes and personal activity analyzer. It lets you capture thoughts instantly by voice or text, enhance them with Google Gemini AI, and then reflect on your month with honest, evidence-based personal feedback.

---

## Problem

Writing down thoughts manually can require time and effort, causing people to lose useful ideas, plans, or memories during busy days. And even when people do take notes, they rarely revisit them in a structured way to understand their own behavior over time.

## Solution

ReflectAI allows users to:
1. **Speak** naturally and have it transcribed in real-time.
2. **Enhance** the raw transcription using Google Gemini AI — fixing grammar, structure, and readability, without changing the meaning.
3. **Save** notes with automatic timestamps and metadata.
4. **Analyze** a full month of notes using AI to extract accomplishments, intentions, pending tasks, and behavioral patterns.
5. **Chat** with an AI assistant that uses your own notes as its source of truth.

---

## Core Features

- 🎙️ **Voice Notes** — Browser-native Speech Recognition (Web Speech API), real-time transcription
- ✍️ **Typed Notes** — Full text editor with optional AI enhancement
- 🤖 **AI Enhancement** — Gemini-powered cleanup: removes filler words, fixes grammar, structures thoughts
- 🔍 **Side-by-Side Review** — Always see raw vs. enhanced before saving
- 📅 **Chronological Timeline** — Notes organized by date with timeline UI
- 🔎 **Search** — Full-text search across all notes
- 📊 **Monthly AI Analysis** — Accomplishments, intentions, pending items, patterns
- ⭐ **Personal Feedback** — "What you did well" / "What to improve" / "Recommendations"
- 💬 **AI Chat** — Ask questions about your own notes ("What did I work on this week?")
- 🔐 **Authentication** — Email/password auth with auto-registration for local dev
- 🎮 **Gaming Aesthetic** — Subtle XP/level system, glassmorphism, dark mode, vibrant purple theme

---

## AI Architecture

### Note Enhancement Pipeline
```
User speaks / types
      ↓
Raw text captured
      ↓
POST /api/enhance → Gemini AI
      ↓
AI cleans text, preserves meaning
      ↓
Side-by-side review (Raw vs. Enhanced)
      ↓
User edits & approves
      ↓
Saved to database
```

### Monthly Analysis Pipeline
```
User selects month
      ↓
All notes fetched from DB
      ↓
POST /api/analysis → Gemini AI
      ↓
AI extracts: accomplishments, intentions, pending, patterns, feedback
      ↓
JSON structured response
      ↓
Rendered in Analysis Dashboard
```

### AI Chat
```
User asks question
      ↓
Last 200 notes fetched as context
      ↓
POST /api/chat → Gemini AI (with conversation history)
      ↓
Evidence-based answer
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database ORM | Prisma v5 |
| Database (Dev) | SQLite |
| Database (Prod) | PostgreSQL (Supabase / Vercel Postgres) |
| Auth | NextAuth.js (Auth.js) |
| AI | Google Gemini API (`gemini-1.5-flash`) |
| Speech-to-Text | Web Speech API (browser-native, free) |
| Deployment | Vercel |

---

## Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?
  name      String?
  notes     Note[]
  createdAt DateTime @default(now())
}

model Note {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  title           String?
  rawContent      String?       // Original voice transcription
  enhancedContent String?       // AI-cleaned version
  finalContent    String        // What the user actually saved
  inputMethod     String        // "VOICE" or "TYPED"
  tags            String?
  category        String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth handlers
│   │   ├── enhance/             # AI note enhancement
│   │   ├── analysis/            # Monthly AI analysis
│   │   └── chat/                # AI assistant chat
│   ├── analysis/                # Monthly reflection page
│   ├── chat/                    # AI chat interface
│   ├── login/                   # Authentication page
│   ├── notes/
│   │   ├── [id]/                # Note detail view
│   │   ├── new/                 # Create typed note
│   │   ├── voice/               # Voice recording page
│   │   └── page.tsx             # All notes timeline
│   ├── layout.tsx
│   ├── page.tsx                 # Dashboard
│   └── globals.css
├── actions/
│   └── notes.ts                 # Server actions (CRUD)
├── auth.ts                      # NextAuth configuration
├── components/
│   ├── navbar.tsx               # Auth-aware navigation
│   ├── providers.tsx            # SessionProvider wrapper
│   └── ui/                      # shadcn/ui components
├── lib/
│   └── prisma.ts                # Prisma singleton
└── types/
    └── next-auth.d.ts           # Session type augmentation
```

---

## Environment Variables

Create a `.env` file from `.env.example`:

```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your-google-gemini-api-key"
AUTH_SECRET="a-long-random-secret-string"
NEXTAUTH_URL="http://localhost:3000"
```

Get your Gemini API key from: https://aistudio.google.com/app/apikey

---

## Local Development

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/reflect-ai.git
cd reflect-ai

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your GEMINI_API_KEY in .env

# 4. Initialize the database
npx prisma db push
npx prisma generate

# 5. Start the development server
npm run dev
```

Visit `http://localhost:3000`. Enter any email + password (min 6 chars) to auto-register and start using the app.

> ⚠️ **Note:** Voice recording works best on Chrome or Edge. Safari has partial support. Firefox does not support the Web Speech API.

---

## Vercel Deployment

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set up a PostgreSQL database (e.g., [Supabase](https://supabase.com) or Vercel Postgres).
4. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Run migrations: `npx prisma migrate dev --name init`
6. Add all environment variables in Vercel project settings:
   - `DATABASE_URL` — your PostgreSQL connection string
   - `GEMINI_API_KEY` — your Gemini API key
   - `AUTH_SECRET` — a strong random secret
   - `NEXTAUTH_URL` — your production URL (e.g., `https://your-app.vercel.app`)
7. Deploy!

---

## Privacy

- Notes are stored in your own database (local SQLite in dev, your own Postgres in production).
- API keys are server-side only and never exposed to the client.
- AI processing is ephemeral — notes are sent to Gemini only during active requests.
- Authentication is session-based with JWT tokens.
- No note content is placed in URLs.

---

## Future Improvements

- [ ] Tags and categories for notes
- [ ] Weekly and custom date-range analysis
- [ ] Note editing (update existing notes)
- [ ] Export notes as Markdown/PDF
- [ ] OAuth providers (Google, GitHub sign-in)
- [ ] Push notifications for daily note reminders
- [ ] Semantic/vector search for smarter note retrieval
- [ ] Mobile app (React Native / PWA)

---

## Contributing

Pull requests are welcome! Please open an issue first to discuss major changes.
