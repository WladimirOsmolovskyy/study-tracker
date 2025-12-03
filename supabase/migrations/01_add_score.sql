-- Add score column to events table
ALTER TABLE events ADD COLUMN score INTEGER DEFAULT NULL;
ALTER TABLE events ADD CONSTRAINT score_range CHECK (score >= 0 AND score <= 100);
