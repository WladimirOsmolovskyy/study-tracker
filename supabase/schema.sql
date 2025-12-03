-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Courses Table
create table courses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  code text not null,
  color text not null,
  semester text,
  created_at timestamptz default now()
);

-- Events Table
create table events (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  title text not null,
  type text not null,
  date bigint not null,
  is_completed boolean default false,
  created_at timestamptz default now()
);

-- Trackers Table
create table trackers (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  name text not null,
  value numeric default 0
);

-- Row Level Security (RLS)
alter table courses enable row level security;
alter table events enable row level security;
alter table trackers enable row level security;

-- Policies for Courses
create policy "Users can view their own courses"
  on courses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own courses"
  on courses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own courses"
  on courses for delete
  using (auth.uid() = user_id);

-- Policies for Events
create policy "Users can view their own events"
  on events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own events"
  on events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own events"
  on events for update
  using (auth.uid() = user_id);

create policy "Users can delete their own events"
  on events for delete
  using (auth.uid() = user_id);

-- Policies for Trackers (Implicitly owned via event -> course -> user, but direct check is easier if we store user_id or join)
-- For simplicity, let's just trust the cascade from event, but RLS requires a direct check or a join.
-- To keep it simple and secure, we'll add user_id to trackers too, or do a join check.
-- Let's add user_id to trackers for easier RLS.

alter table trackers add column user_id uuid references auth.users not null;

create policy "Users can view their own trackers"
  on trackers for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trackers"
  on trackers for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own trackers"
  on trackers for update
  using (auth.uid() = user_id);

create policy "Users can delete their own trackers"
  on trackers for delete
  using (auth.uid() = user_id);
