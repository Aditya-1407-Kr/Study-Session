# StudyOS — Setup Guide

## 1. Supabase Project Setup

Go to https://supabase.com → New Project

Copy your **Project URL** and **anon/public API key** from:
Settings → API → Project URL & Project API Keys

---

## 2. Database Schema (Run in SQL Editor)

Go to: Supabase Dashboard → SQL Editor → New Query

Paste and run this SQL:

```sql
-- SUBJECTS
create table subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  subject_name text not null,
  created_at timestamptz default now()
);

-- MODULES
create table modules (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade,
  module_name text not null,
  module_title text,
  created_at timestamptz default now()
);

-- TOPICS
create table topics (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade,
  topic_name text not null,
  is_completed boolean default false,
  priority text default 'medium' check (priority in ('low','medium','high')),
  notes text,
  created_at timestamptz default now()
);

-- STUDY SESSIONS
create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  module_id uuid references modules(id) on delete set null,
  duration_minutes integer not null,
  date date not null,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table subjects enable row level security;
alter table modules enable row level security;
alter table topics enable row level security;
alter table study_sessions enable row level security;

-- SUBJECTS POLICIES
create policy "Users see own subjects" on subjects for select using (auth.uid() = user_id);
create policy "Users insert own subjects" on subjects for insert with check (auth.uid() = user_id);
create policy "Users update own subjects" on subjects for update using (auth.uid() = user_id);
create policy "Users delete own subjects" on subjects for delete using (auth.uid() = user_id);

-- MODULES POLICIES (access via subject ownership)
create policy "Users see own modules" on modules for select
  using (exists (select 1 from subjects where subjects.id = modules.subject_id and subjects.user_id = auth.uid()));
create policy "Users insert own modules" on modules for insert
  with check (exists (select 1 from subjects where subjects.id = modules.subject_id and subjects.user_id = auth.uid()));
create policy "Users update own modules" on modules for update
  using (exists (select 1 from subjects where subjects.id = modules.subject_id and subjects.user_id = auth.uid()));
create policy "Users delete own modules" on modules for delete
  using (exists (select 1 from subjects where subjects.id = modules.subject_id and subjects.user_id = auth.uid()));

-- TOPICS POLICIES (access via module → subject ownership)
create policy "Users see own topics" on topics for select
  using (exists (
    select 1 from modules m
    join subjects s on s.id = m.subject_id
    where m.id = topics.module_id and s.user_id = auth.uid()
  ));
create policy "Users insert own topics" on topics for insert
  with check (exists (
    select 1 from modules m
    join subjects s on s.id = m.subject_id
    where m.id = topics.module_id and s.user_id = auth.uid()
  ));
create policy "Users update own topics" on topics for update
  using (exists (
    select 1 from modules m
    join subjects s on s.id = m.subject_id
    where m.id = topics.module_id and s.user_id = auth.uid()
  ));
create policy "Users delete own topics" on topics for delete
  using (exists (
    select 1 from modules m
    join subjects s on s.id = m.subject_id
    where m.id = topics.module_id and s.user_id = auth.uid()
  ));

-- SESSIONS POLICIES
create policy "Users see own sessions" on study_sessions for select using (auth.uid() = user_id);
create policy "Users insert own sessions" on study_sessions for insert with check (auth.uid() = user_id);
create policy "Users delete own sessions" on study_sessions for delete using (auth.uid() = user_id);
```

---

## 3. Connect Supabase to the App

Open **both** `index.html` and `dashboard.html` and replace:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

With your actual credentials from Supabase Dashboard → Settings → API.

---

## 4. Authentication Setup

In Supabase Dashboard:
- Go to **Authentication → Providers**
- Email is enabled by default ✓
- Optional: Disable "Confirm email" for development (Auth → Settings → "Enable email confirmations" → OFF)

---

## 5. Run Locally

Option A — Simple (no server needed):
```bash
# Install a static server
npx serve .
# or
python3 -m http.server 8080
```
Then open: http://localhost:8080

Option B — VS Code:
- Install "Live Server" extension
- Right-click index.html → "Open with Live Server"

---

## File Structure

```
study-os/
├── index.html        ← Login / Signup page
├── dashboard.html    ← Main app (all views)
└── SETUP.md          ← This file
```

---

## Features Included

- ✅ Auth (Login/Signup with Supabase)
- ✅ Dashboard with stats, goal ring, week chart
- ✅ Subject management (create, delete, progress)
- ✅ Module system (collapsible, progress %)
- ✅ Topic system (add/edit/delete, priority tags, completion)
- ✅ Smart Syllabus Parser (auto-detects Module I/II/III + topics)
- ✅ Study Timer (timestamp-accurate, auto-saves sessions)
- ✅ Analytics (subject/module progress, weekly chart)
- ✅ Focus Mode (minimal full-screen timer)
- ✅ Notes per topic
- ✅ Daily Goal with progress ring
- ✅ Study Streak counter
- ✅ Light/Dark mode (persisted)
- ✅ Responsive design
- ✅ Toast notifications
