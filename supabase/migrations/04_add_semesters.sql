create table semesters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

alter table semesters enable row level security;

create policy "Users can view their own semesters"
  on semesters for select
  using (auth.uid() = user_id);

create policy "Users can insert their own semesters"
  on semesters for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own semesters"
  on semesters for update
  using (auth.uid() = user_id);

create policy "Users can delete their own semesters"
  on semesters for delete
  using (auth.uid() = user_id);
