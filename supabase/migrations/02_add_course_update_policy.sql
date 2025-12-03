-- Enable users to update their own courses
create policy "Users can update their own courses"
  on courses for update
  using (auth.uid() = user_id);
