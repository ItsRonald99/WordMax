# WordMax

A vocabulary learning app that helps you capture new words, practice them with AI-generated exercises, and retain them through spaced repetition.

## Features

- **Personal Dictionary** — save words with an example sentence and context
- **AI Exercises** — 3 exercise types generated per word (fill-in-the-blank, real-world usage, sentence rewrite) using GPT-4o-mini
- **Practice Mode** — work through exercises one at a time, reveal answers, and mark yourself correct or incorrect
- **Spaced Repetition** — correct answers double the review interval; incorrect answers reset it to 1 day

## Tech Stack

- **Frontend/Backend** — Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components** — shadcn/ui (Radix UI primitives)
- **Database & Auth** — Supabase (PostgreSQL + email/password auth)
- **AI** — OpenAI `gpt-4o-mini`
- **Deployment** — Vercel

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/ItsRonald99/WordMax.git
cd WordMax
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it
3. Copy your **Project URL** and **anon public** key from **Settings → API**

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
OPENAI_API_KEY=sk-...
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import this repo
3. Add the three environment variables from step 3 above in **Settings → Environment Variables**
4. Click **Deploy**

Vercel auto-detects Next.js — no build configuration needed.

## Project Structure

```
app/
  dashboard/     # Word list + stats
  add/           # Add word form
  practice/      # Practice session
  api/           # Route handlers (words, exercises, practice)
components/
  ui/            # shadcn-style UI primitives
lib/
  supabase/      # Browser + server Supabase clients
  openai.ts      # Exercise generation
  types.ts       # Shared TypeScript types
supabase/
  schema.sql     # Database schema + RLS policies
```
