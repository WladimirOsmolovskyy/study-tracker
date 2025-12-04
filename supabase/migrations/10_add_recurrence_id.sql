alter table events
add column if not exists recurrence_id uuid;
