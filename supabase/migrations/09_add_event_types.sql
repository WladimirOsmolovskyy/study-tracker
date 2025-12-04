ALTER TABLE settings ADD COLUMN IF NOT EXISTS event_types TEXT[] DEFAULT ARRAY['lecture', 'homework', 'exam', 'lab', 'other'];
