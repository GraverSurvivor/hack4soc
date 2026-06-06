# NeuroSpark 🧠

An AI-powered inclusive learning platform that transforms teacher-uploaded course materials into personalised learning experiences for students with ADHD, Dyslexia, and Autism Spectrum conditions.

## Features

- **Teacher Upload & AI Pipeline** — Upload PDF/DOCX/PPTX/TXT, Claude generates 3 learning modes per unit
- **Brain Profile Quiz** — 10-question learning style discovery (Story / Calm / Game)
- **Three Distinct Learning Modes** — Story Mode (ADHD), Calm Visual Mode (Autism), Game Mode (Dyslexia)
- **AI Tutor (Spark)** — Context-aware Q&A using course content only
- **Teacher Dashboard** — Analytics, heatmaps, at-risk alerts, IEP/504 panel
- **Class Community Chat** — Real-time Socket.io chat with AI moderation
- **Gamification** — XP, streaks, 20+ badges, leaderboard-ready

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Next.js 15 App Router + API Routes |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth (credentials + Google OAuth) |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Real-time | Socket.io |
| Charts | Recharts |

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Anthropic API key

## Setup

### 1. Clone and install

```bash
cd hack4soc
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/neurospark"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-here"
ANTHROPIC_API_KEY="sk-ant-..."
SOCKET_PORT=3001
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Generate a secret:
```bash
openssl rand -base64 32
```

### 3. Set up database

```bash
npm run db:push
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

This starts:
- Next.js on `http://localhost:3000`
- Socket.io server on `http://localhost:3001`

## Seed Data

After running `npm run db:seed`:

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher@neurospark.edu | password123 |
| Student | alex@student.edu | password123 |
| Student | jordan@student.edu | password123 |
| Student | casey@student.edu | password123 |
| Student | riley@student.edu | password123 |
| Student | taylor@student.edu | password123 |

- **Classroom invite code:** `SPARK1`
- **Sample course:** Introduction to Photosynthesis (3 AI-generated units)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | App URL for auth callbacks |
| `NEXTAUTH_SECRET` | Yes | JWT encryption secret |
| `ANTHROPIC_API_KEY` | Yes | Claude API key for AI features |
| `SOCKET_PORT` | No | Socket.io port (default: 3001) |
| `NEXT_PUBLIC_SOCKET_URL` | No | Socket.io client URL |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth secret |

## Project Structure

```
app/
  (auth)/login, register
  teacher/dashboard, courses, students, alerts, settings, onboarding
  student/home, courses, learn/[unitId], quiz/brain-profile, community, badges, profile
  api/                  # All REST API routes
components/
  ui/                   # Base UI components
  learn/                # StoryMode, CalmMode, GameMode
  dashboard/            # Teacher analytics
  chat/                 # AI Tutor + Community Chat
  shared/               # Nav, providers, theme
lib/
  claude.ts             # Anthropic SDK wrapper
  parser.ts             # PDF/DOCX/PPTX extraction
  prompts.ts            # Claude prompt templates
  db.ts, auth.ts, gamification.ts, dashboard.ts
prisma/
  schema.prisma
  seed.ts
server/
  socket.ts             # Socket.io server
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/classrooms` | Create classroom (teacher) |
| GET | `/api/classrooms` | List classrooms |
| POST | `/api/classrooms/join/join` | Join via invite code |
| POST | `/api/courses/upload` | Upload + AI generate course |
| GET | `/api/units/:id` | Get unit with all modes |
| POST | `/api/units/:id/progress` | Save student progress |
| GET/POST | `/api/quiz/brain-profile` | Brain profile quiz |
| POST | `/api/ai/tutor` | Streaming AI tutor |
| GET | `/api/dashboard/:classroomId` | Teacher dashboard data |
| POST | `/api/chat/message` | Send chat message |
| POST | `/api/iep/:studentId` | Save IEP/504 notes |

## Learning Modes

### Story Mode (ADHD-friendly)
Warm amber palette, serif fonts, paginated narrative with Spark as guide

### Calm Visual Mode (Autism-friendly)
Cool blue minimalist UI, one concept per card, Focus Mode, predictable layout

### Game Mode (Dyslexia-friendly)
Dark space theme, OpenDyslexic font, level-based quests with XP rewards

## IEP/504 Accommodations

When flagged by teacher:
- Plain language (Grade 4 level)
- Extended time warnings
- Larger default font
- Text-to-speech toggle (Web Speech API)
- Accommodation notes injected into AI tutor context

## Scripts

```bash
npm run dev          # Start dev server + socket
npm run build        # Production build
npm run db:push      # Push schema to database
npm run db:seed      # Seed test data
npm run db:studio    # Open Prisma Studio
```

## License

MIT

## Live Demo
https://hack4soc-git-main-purohitdhruv07-9469s-projects.vercel.app/
