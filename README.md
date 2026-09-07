# ReflectAI

## Overview
ReflectAI is a modern, AI-powered personal note-taking application designed to capture thoughts quickly, enhance them using AI, and provide intelligent reflection on your activity over time.

## Problem
Writing down thoughts manually can require time and effort, causing people to lose useful thoughts, activities, or ideas during busy days. 

## Solution
ReflectAI allows users to quickly speak their thoughts, convert them into text using browser-based transcription, enhance them using AI to structure and fix grammar, save them with timestamps, and later analyze their activities and intentions through an AI reflection system.

## Core Features
- **Fast Capture:** Voice-to-text recording or manual typing.
- **AI Enhancement:** Cleans up raw transcription into readable, structured notes without altering original meaning.
- **Monthly Reflection:** Analyzes a month's worth of notes to extract accomplishments, intentions, pending items, and patterns.
- **AI Assistant Chat:** Ask questions directly to an AI that uses your notes as its context.
- **Gaming-inspired Aesthetic:** Modern dark mode, glassmorphism UI, and subtle leveling/progress textures.

## AI Architecture
- **Voice-to-Text Pipeline:** Uses the browser's native Web Speech API for real-time transcription on the client side.
- **Enhancement Pipeline:** Raw text -> Sent to `/api/enhance` (Gemini API) -> Structured text -> User review -> Database.
- **Analysis Pipeline:** Notes fetched -> Sent to `/api/analysis` with strict JSON schema instructions -> Rendered on Dashboard.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS & shadcn/ui
- Prisma ORM & SQLite (Local)
- NextAuth.js (Auth.js)
- Google Gemini API

## Local Development
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Configure your `.env` file with `DATABASE_URL`, `GEMINI_API_KEY`, and `AUTH_SECRET`.
4. Run `npx prisma db push` to initialize the SQLite database.
5. Run `npx prisma generate` to generate the Prisma client.
6. Run `npm run dev` to start the development server.

## Vercel Deployment
To deploy on Vercel:
1. Push your repository to GitHub.
2. Import the project in Vercel.
3. Set up a PostgreSQL database (e.g., Vercel Postgres or Supabase).
4. Update `prisma/schema.prisma` provider to `"postgresql"` and run `npx prisma migrate dev`.
5. Add all Environment Variables in Vercel settings.
6. Deploy!

## Privacy
ReflectAI is designed to keep your notes private. Local development uses a local SQLite database, and API keys are stored securely on the server environment. The AI models process data ephemerally during requests.
