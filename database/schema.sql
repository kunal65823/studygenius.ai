-- ============================================================
-- StudyGenius AI – Supabase PostgreSQL Schema
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for full-text search

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  avatar_url    text,
  email         text unique not null,
  study_streak  integer default 0,
  last_active   date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- NOTES / UPLOADS
-- ============================================================
create table public.notes (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  file_name     text not null,
  file_type     text not null check (file_type in ('pdf','docx','txt','pptx')),
  file_url      text not null,
  file_size     bigint,
  page_count    integer,
  word_count    integer,
  raw_text      text,
  is_processed  boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_notes_user_id on public.notes(user_id);
create index idx_notes_title_trgm on public.notes using gin(title gin_trgm_ops);

-- ============================================================
-- SUMMARIES
-- ============================================================
create table public.summaries (
  id            uuid primary key default uuid_generate_v4(),
  note_id       uuid not null references public.notes(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  summary_type  text not null check (summary_type in ('short','detailed','bullet','chapter','concepts')),
  mode          text not null check (mode in ('easy','exam','quick')),
  content       text not null,
  created_at    timestamptz default now()
);

create index idx_summaries_note_id on public.summaries(note_id);
create index idx_summaries_user_id on public.summaries(user_id);

-- ============================================================
-- FLASHCARDS
-- ============================================================
create table public.flashcard_sets (
  id            uuid primary key default uuid_generate_v4(),
  note_id       uuid references public.notes(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  created_at    timestamptz default now()
);

create table public.flashcards (
  id            uuid primary key default uuid_generate_v4(),
  set_id        uuid not null references public.flashcard_sets(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  front         text not null,
  back          text not null,
  status        text default 'new' check (status in ('new','known','unknown','review')),
  last_reviewed timestamptz,
  created_at    timestamptz default now()
);

create index idx_flashcards_set_id on public.flashcards(set_id);
create index idx_flashcards_user_id on public.flashcards(user_id);

-- ============================================================
-- MCQs
-- ============================================================
create table public.mcq_sets (
  id            uuid primary key default uuid_generate_v4(),
  note_id       uuid references public.notes(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  difficulty    text default 'medium' check (difficulty in ('easy','medium','hard')),
  count         integer not null,
  created_at    timestamptz default now()
);

create table public.mcqs (
  id            uuid primary key default uuid_generate_v4(),
  set_id        uuid not null references public.mcq_sets(id) on delete cascade,
  question      text not null,
  options       jsonb not null,   -- ["A","B","C","D"]
  correct_index integer not null, -- 0-3
  explanation   text,
  created_at    timestamptz default now()
);

create index idx_mcqs_set_id on public.mcqs(set_id);

-- ============================================================
-- QUIZ RESULTS
-- ============================================================
create table public.quiz_results (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  mcq_set_id    uuid references public.mcq_sets(id) on delete set null,
  score         integer not null,
  total         integer not null,
  time_taken    integer, -- seconds
  answers       jsonb,   -- [{question_id, selected, correct}]
  created_at    timestamptz default now()
);

create index idx_quiz_results_user_id on public.quiz_results(user_id);

-- ============================================================
-- CHAT HISTORY
-- ============================================================
create table public.chat_sessions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  note_id       uuid references public.notes(id) on delete cascade,
  title         text default 'New Chat',
  created_at    timestamptz default now()
);

create table public.chat_messages (
  id            uuid primary key default uuid_generate_v4(),
  session_id    uuid not null references public.chat_sessions(id) on delete cascade,
  role          text not null check (role in ('user','assistant')),
  content       text not null,
  sources       jsonb, -- [{page, excerpt}]
  created_at    timestamptz default now()
);

create index idx_chat_messages_session_id on public.chat_messages(session_id);
create index idx_chat_sessions_user_id   on public.chat_sessions(user_id);

-- ============================================================
-- BOOKMARKS
-- ============================================================
create table public.bookmarks (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  item_type     text not null check (item_type in ('summary','flashcard_set','mcq_set','quiz_result')),
  item_id       uuid not null,
  created_at    timestamptz default now(),
  unique(user_id, item_type, item_id)
);

-- ============================================================
-- STUDY GOALS
-- ============================================================
create table public.study_goals (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  target_date   date,
  daily_minutes integer default 30,
  progress      integer default 0,  -- percentage
  status        text default 'active' check (status in ('active','completed','paused')),
  created_at    timestamptz default now()
);

-- ============================================================
-- STUDY SESSIONS (time tracking)
-- ============================================================
create table public.study_sessions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  note_id       uuid references public.notes(id) on delete set null,
  duration      integer not null, -- minutes
  activity_type text not null check (activity_type in ('reading','quiz','flashcards','chat','summary')),
  created_at    timestamptz default now()
);

create index idx_study_sessions_user_id on public.study_sessions(user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  type          text not null,
  title         text not null,
  message       text,
  is_read       boolean default false,
  created_at    timestamptz default now()
);

create index idx_notifications_user_id on public.notifications(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.notes          enable row level security;
alter table public.summaries      enable row level security;
alter table public.flashcard_sets enable row level security;
alter table public.flashcards     enable row level security;
alter table public.mcq_sets       enable row level security;
alter table public.mcqs           enable row level security;
alter table public.quiz_results   enable row level security;
alter table public.chat_sessions  enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.bookmarks      enable row level security;
alter table public.study_goals    enable row level security;
alter table public.study_sessions enable row level security;
alter table public.notifications  enable row level security;

-- Policies: users can only access their own data
create policy "own_profile"   on public.profiles       for all using (auth.uid() = id);
create policy "own_notes"     on public.notes          for all using (auth.uid() = user_id);
create policy "own_summaries" on public.summaries      for all using (auth.uid() = user_id);
create policy "own_fc_sets"   on public.flashcard_sets for all using (auth.uid() = user_id);
create policy "own_fc"        on public.flashcards     for all using (auth.uid() = user_id);
create policy "own_mcq_sets"  on public.mcq_sets       for all using (auth.uid() = user_id);
create policy "own_mcqs"      on public.mcqs           for all using (
  set_id in (select id from public.mcq_sets where user_id = auth.uid())
);
create policy "own_quiz_res"  on public.quiz_results   for all using (auth.uid() = user_id);
create policy "own_chat_sess" on public.chat_sessions  for all using (auth.uid() = user_id);
create policy "own_chat_msg"  on public.chat_messages  for all using (
  session_id in (select id from public.chat_sessions where user_id = auth.uid())
);
create policy "own_bookmarks" on public.bookmarks      for all using (auth.uid() = user_id);
create policy "own_goals"     on public.study_goals    for all using (auth.uid() = user_id);
create policy "own_sessions"  on public.study_sessions for all using (auth.uid() = user_id);
create policy "own_notifs"    on public.notifications  for all using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: update study streak
-- ============================================================
create or replace function public.update_streak()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles
  set
    last_active = current_date,
    study_streak = case
      when last_active = current_date - 1 then study_streak + 1
      when last_active = current_date     then study_streak
      else 1
    end,
    updated_at = now()
  where id = new.user_id;
  return new;
end;
$$;

create trigger on_study_session
  after insert on public.study_sessions
  for each row execute procedure public.update_streak();
