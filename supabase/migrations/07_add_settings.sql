create table settings (
  user_id uuid references auth.users not null primary key,
  workdays jsonb default '[1, 2, 3, 4, 5]'::jsonb,
  created_at timestamp with time zone default now()
);

alter table settings enable row level security;

create policy "Users can view their own settings"
  on settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on settings for update
  using (auth.uid() = user_id);
