-- Add sort_order to chore_templates
ALTER TABLE chore_templates
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows: preserve creation order per household
UPDATE chore_templates ct
SET sort_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY household_id ORDER BY created_at) - 1 AS rn
  FROM chore_templates
) sub
WHERE ct.id = sub.id;

-- Index for fast ordering
CREATE INDEX IF NOT EXISTS idx_chore_templates_household_sort
  ON chore_templates (household_id, sort_order);
