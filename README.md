# Study OS — Setup Guide

## Folder Structure
```
studyos/
├── index.html          ← Login / Signup
├── dashboard.html      ← Main app (all views)
├── subject.html        ← Subject detail page
├── style.css           ← All styles
├── auth.js             ← Auth logic
├── db.js               ← All DB operations + Supabase client
├── parser.js           ← Syllabus text parser
├── timer.js            ← Accurate study timer
├── ui.js               ← UI helpers, toast, theme, streak, goal
└── README.md
```

---

## Step 1 — Create a Supabase Project

1. Go to https://supabase.com and sign up / log in
2. Click **New Project**
3. Give it a name (e.g. `studyos`), set a database password, choose a region
4. Wait for provisioning (~1 min)

---

## Step 2 — Create Tables

Go to **SQL Editor** in your Supabase dashboard and run the following:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SUBJECTS
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  color TEXT DEFAULT '#C4622D',
  icon TEXT DEFAULT '📚',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MODULES
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  module_title TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TOPICS
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDY SESSIONS
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  duration_minutes NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);
```

---

## Step 3 — Enable Row Level Security (RLS)

Run this in the SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- SUBJECTS: users own their own subjects
CREATE POLICY "Users manage own subjects" ON subjects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- STUDY SESSIONS: users own their own sessions
CREATE POLICY "Users manage own sessions" ON study_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- MODULES: accessible if parent subject belongs to user
CREATE POLICY "Users manage modules of their subjects" ON modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = modules.subject_id
        AND subjects.user_id = auth.uid()
    )
  );

-- TOPICS: accessible if parent module's subject belongs to user
CREATE POLICY "Users manage topics of their modules" ON topics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN subjects ON subjects.id = modules.subject_id
      WHERE modules.id = topics.module_id
        AND subjects.user_id = auth.uid()
    )
  );
```

---

<!-- Migration SQL removed. If you only want to add personal study rows, use the seed file at `seeds/add_my_sessions.sql` instead. -->

## Step 4 — Get Your API Keys

1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public key** (long JWT string)

---

## Step 5 — Add Keys to the App

Open `db.js` and replace the placeholders at the top:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

---

## Step 6 — Run Locally

Because the app uses ES Modules (`type="module"`), you **cannot** open `index.html` directly from the filesystem — browsers block module imports for `file://` URLs.

Use any of these:

### Option A — VS Code Live Server
Install the **Live Server** extension → right-click `index.html` → **Open with Live Server**

### Option B — Python
```bash
cd studyos
python3 -m http.server 8080
# Open http://localhost:8080
```

### Option C — Node.js (npx)
```bash
cd studyos
npx serve .
# Open the URL shown in terminal
```

### Option D — PHP
```bash
cd studyos
php -S localhost:8080
```

---

## Features Summary

| Feature | Status |
|---|---|
| Email Auth (login/signup) | ✅ |
| Subject management | ✅ |
| Module system (expandable) | ✅ |
| Topic CRUD + priority | ✅ |
| Topic completion toggle | ✅ |
| Topic notes editor | ✅ |
| Syllabus text parser | ✅ |
| Accurate study timer | ✅ |
| Focus mode overlay | ✅ |
| Session auto-save | ✅ |
| Daily goal + ring | ✅ |
| Streak counter | ✅ |
| Weekly study chart | ✅ |
| Analytics view | ✅ |
| Light / Dark mode | ✅ |
| Persistent sessions | ✅ |
| RLS (data isolation) | ✅ |

---

## Gamification (new)

- Files added: `gamification.js`, `gamification-ui.js`, `INTEGRATION.md` — a minimal XP/achievements layer that runs client-side with localStorage fallback.
- See `INTEGRATION.md` for quick integration steps (init on sign-in, award XP at session end, optional server sync).


## Notes

- The built-in Supabase client in `db.js` is a lightweight custom implementation — no external library needed.
- Timer state survives page refresh via `localStorage`.
- Theme, goal, and streak are stored in `localStorage`.
- All data is isolated per user via Supabase RLS policies.
