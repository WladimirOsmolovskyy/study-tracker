-- Add order_index column to courses table
ALTER TABLE courses ADD COLUMN order_index INTEGER DEFAULT 0;

-- Update existing courses to have an order based on creation time
WITH ordered_courses AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 as new_order
  FROM courses
)
UPDATE courses
SET order_index = ordered_courses.new_order
FROM ordered_courses
WHERE courses.id = ordered_courses.id;
