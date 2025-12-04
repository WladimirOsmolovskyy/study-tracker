alter table settings 
add column if not exists grade_colors jsonb default '[{"min": 80, "color": "#22c55e"}, {"min": 50, "color": "#eab308"}, {"min": 0, "color": "#ef4444"}]'::jsonb,
add column if not exists undefined_color text default '#71717a';
