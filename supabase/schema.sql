-- Missionly Database Schema
-- Run this in the Supabase SQL Editor

-- ==========================================
-- TABLES
-- ==========================================

-- Households (multi-tenant root)
CREATE TABLE IF NOT EXISTS households (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Household members (links Supabase auth.users to households)
CREATE TABLE IF NOT EXISTS household_members (
  id SERIAL PRIMARY KEY,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'parent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Household settings (feature toggles)
CREATE TABLE IF NOT EXISTS household_settings (
  id SERIAL PRIMARY KEY,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE UNIQUE,
  show_affirmation BOOLEAN NOT NULL DEFAULT TRUE,
  show_saint BOOLEAN NOT NULL DEFAULT TRUE,
  show_bible_passage BOOLEAN NOT NULL DEFAULT TRUE
);

-- Children
CREATE TABLE IF NOT EXISTS children (
  id SERIAL PRIMARY KEY,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#7C3AED',
  birthdate TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chore templates (reusable chore definitions)
CREATE TABLE IF NOT EXISTS chore_templates (
  id SERIAL PRIMARY KEY,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'sparkles',
  description TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  time_of_day TEXT NOT NULL DEFAULT 'ALL_DAY' CHECK (time_of_day IN ('MORNING', 'AFTERNOON', 'ALL_DAY')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chore assignment rules (which child, which days)
CREATE TABLE IF NOT EXISTS chore_assignment_rules (
  id SERIAL PRIMARY KEY,
  chore_template_id INTEGER NOT NULL REFERENCES chore_templates(id) ON DELETE CASCADE,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  days_of_week TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chore completions (daily tracking)
CREATE TABLE IF NOT EXISTS chore_completions (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  chore_template_id INTEGER NOT NULL REFERENCES chore_templates(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenges (progress-based goals)
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal_description TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 10,
  points_per_unit INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge assignments
CREATE TABLE IF NOT EXISTS challenge_assignments (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  UNIQUE(challenge_id, child_id)
);

-- Challenge progress entries
CREATE TABLE IF NOT EXISTS challenge_progress_entries (
  id SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  delta_count INTEGER NOT NULL DEFAULT 1,
  note TEXT
);

-- Piggy transactions (money movements in cents)
CREATE TABLE IF NOT EXISTS piggy_transactions (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('FUN', 'SAVINGS', 'DONATE')),
  amount_cents INTEGER NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring piggy rules (allowance, regular deposits)
CREATE TABLE IF NOT EXISTS recurring_piggy_rules (
  id SERIAL PRIMARY KEY,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('FUN', 'SAVINGS', 'DONATE')),
  amount_cents INTEGER NOT NULL,
  title TEXT NOT NULL,
  cadence TEXT NOT NULL CHECK (cadence IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  start_date TEXT NOT NULL,
  end_date TEXT,
  next_run_date TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring piggy rule assignments
CREATE TABLE IF NOT EXISTS recurring_piggy_rule_assignments (
  id SERIAL PRIMARY KEY,
  rule_id INTEGER NOT NULL REFERENCES recurring_piggy_rules(id) ON DELETE CASCADE,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  UNIQUE(rule_id, child_id)
);

-- Piggy goals (savings targets)
CREATE TABLE IF NOT EXISTS piggy_goals (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('SAVINGS', 'DONATE')),
  title TEXT NOT NULL,
  target_amount_cents INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards (redeemable reward goals)
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_points INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  redeemed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Point adjustments (manual point corrections)
CREATE TABLE IF NOT EXISTS point_adjustments (
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE piggy_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_piggy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_piggy_rule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE piggy_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_adjustments ENABLE ROW LEVEL SECURITY;

-- Helper function: get the calling user's household_id
CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS INTEGER AS $$
  SELECT household_id FROM household_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- households: users can only see/modify their own household
CREATE POLICY "households_isolation" ON households
  FOR ALL USING (id = get_my_household_id());

-- household_members: see members of own household
CREATE POLICY "household_members_isolation" ON household_members
  FOR ALL USING (household_id = get_my_household_id());

-- household_settings
CREATE POLICY "household_settings_isolation" ON household_settings
  FOR ALL USING (household_id = get_my_household_id());

-- children
CREATE POLICY "children_isolation" ON children
  FOR ALL USING (household_id = get_my_household_id());

-- chore_templates
CREATE POLICY "chore_templates_isolation" ON chore_templates
  FOR ALL USING (household_id = get_my_household_id());

-- chore_assignment_rules: join through chore_templates
CREATE POLICY "chore_rules_isolation" ON chore_assignment_rules
  FOR ALL USING (
    chore_template_id IN (
      SELECT id FROM chore_templates WHERE household_id = get_my_household_id()
    )
  );

-- chore_completions: join through children
CREATE POLICY "chore_completions_isolation" ON chore_completions
  FOR ALL USING (
    child_id IN (
      SELECT id FROM children WHERE household_id = get_my_household_id()
    )
  );

-- challenges
CREATE POLICY "challenges_isolation" ON challenges
  FOR ALL USING (household_id = get_my_household_id());

-- challenge_assignments
CREATE POLICY "challenge_assignments_isolation" ON challenge_assignments
  FOR ALL USING (
    challenge_id IN (
      SELECT id FROM challenges WHERE household_id = get_my_household_id()
    )
  );

-- challenge_progress_entries
CREATE POLICY "challenge_progress_isolation" ON challenge_progress_entries
  FOR ALL USING (
    child_id IN (
      SELECT id FROM children WHERE household_id = get_my_household_id()
    )
  );

-- piggy_transactions
CREATE POLICY "piggy_transactions_isolation" ON piggy_transactions
  FOR ALL USING (
    child_id IN (
      SELECT id FROM children WHERE household_id = get_my_household_id()
    )
  );

-- recurring_piggy_rules
CREATE POLICY "recurring_rules_isolation" ON recurring_piggy_rules
  FOR ALL USING (household_id = get_my_household_id());

-- recurring_piggy_rule_assignments
CREATE POLICY "recurring_assignments_isolation" ON recurring_piggy_rule_assignments
  FOR ALL USING (
    rule_id IN (
      SELECT id FROM recurring_piggy_rules WHERE household_id = get_my_household_id()
    )
  );

-- piggy_goals
CREATE POLICY "piggy_goals_isolation" ON piggy_goals
  FOR ALL USING (
    child_id IN (
      SELECT id FROM children WHERE household_id = get_my_household_id()
    )
  );

-- rewards
CREATE POLICY "rewards_isolation" ON rewards
  FOR ALL USING (
    child_id IN (
      SELECT id FROM children WHERE household_id = get_my_household_id()
    )
  );

-- point_adjustments
CREATE POLICY "point_adjustments_isolation" ON point_adjustments
  FOR ALL USING (
    child_id IN (
      SELECT id FROM children WHERE household_id = get_my_household_id()
    )
  );
