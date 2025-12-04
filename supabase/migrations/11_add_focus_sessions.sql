-- Create focus_sessions table
create table if not exists public.focus_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    course_id uuid references public.courses(id) on delete cascade not null,
    event_id uuid references public.events(id) on delete set null,
    duration integer not null, -- duration in seconds
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.focus_sessions enable row level security;

-- Create policies
create policy "Users can view their own focus sessions"
    on public.focus_sessions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own focus sessions"
    on public.focus_sessions for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own focus sessions"
    on public.focus_sessions for update
    using (auth.uid() = user_id);

create policy "Users can delete their own focus sessions"
    on public.focus_sessions for delete
    using (auth.uid() = user_id);
