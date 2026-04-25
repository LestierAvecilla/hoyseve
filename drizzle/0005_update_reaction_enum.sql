-- Idempotent migration: update reaction_type enum from legacy to expressive values
-- Mapping: like→hype, love→sadness, surprise→plot_twist, angry→skip
-- Safe to run multiple times: skips if already migrated

DO $$ 
BEGIN
  -- Check if already migrated (has 'hype' value = already updated)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'reaction_type'
    AND e.enumlabel = 'hype'
  ) THEN
    -- Step 1: Create new enum type with expressive values
    CREATE TYPE reaction_type_new AS ENUM ('hype', 'sadness', 'plot_twist', 'skip');

    -- Step 2: Alter column with CASE mapping
    ALTER TABLE review_reactions
      ALTER COLUMN reaction_type TYPE reaction_type_new
      USING (
        CASE reaction_type::text
          WHEN 'like'     THEN 'hype'
          WHEN 'love'     THEN 'sadness'
          WHEN 'surprise' THEN 'plot_twist'
          WHEN 'angry'    THEN 'skip'
        END
      )::reaction_type_new;

    -- Step 3: Drop old enum and rename new one
    DROP TYPE reaction_type;
    ALTER TYPE reaction_type_new RENAME TO reaction_type;

    RAISE NOTICE 'reaction_type enum migrated successfully';
  ELSE
    RAISE NOTICE 'reaction_type enum already migrated (hype value exists), skipping';
  END IF;
END $$;