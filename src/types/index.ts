// ==========================================
// DATABASE ROW TYPES
// ==========================================

export interface Household {
  id: number
  name: string
  created_at: string
}

export interface HouseholdMember {
  id: number
  household_id: number
  user_id: string
  role: 'parent' | 'admin'
  created_at: string
}

export interface HouseholdSettings {
  id: number
  household_id: number
  show_affirmation: boolean
  show_saint: boolean
  show_bible_passage: boolean
}

export interface Child {
  id: number
  household_id: number
  name: string
  avatar_color: string
  birthdate: string | null
  created_at: string
}

export interface ChoreTemplate {
  id: number
  household_id: number
  title: string
  icon: string
  description: string | null
  points: number
  time_of_day: 'MORNING' | 'AFTERNOON' | 'ALL_DAY'
  active: boolean
  sort_order: number
  created_at: string
}

export interface ChoreAssignmentRule {
  id: number
  chore_template_id: number
  child_id: number
  days_of_week: string
  active: boolean
  created_at: string
}

export interface ChoreCompletion {
  id: number
  child_id: number
  chore_template_id: number
  date: string
  completed: boolean
  points_awarded: number
  completed_at: string
}

export interface Challenge {
  id: number
  household_id: number
  title: string
  goal_description: string
  target_count: number
  points_per_unit: number
  active: boolean
  created_at: string
}

export interface ChallengeAssignment {
  id: number
  challenge_id: number
  child_id: number
}

export interface ChallengeProgressEntry {
  id: number
  challenge_id: number
  child_id: number
  date: string
  delta_count: number
  note: string | null
}

export interface PiggyTransaction {
  id: number
  child_id: number
  category: 'FUN' | 'SAVINGS' | 'DONATE'
  amount_cents: number
  title: string
  date: string
  created_at: string
}

export interface RecurringPiggyRule {
  id: number
  household_id: number
  category: 'FUN' | 'SAVINGS' | 'DONATE'
  amount_cents: number
  title: string
  cadence: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  start_date: string
  end_date: string | null
  next_run_date: string
  active: boolean
  created_at: string
}

export interface RecurringPiggyRuleAssignment {
  id: number
  rule_id: number
  child_id: number
}

export interface PiggyGoal {
  id: number
  child_id: number
  category: 'SAVINGS' | 'DONATE'
  title: string
  target_amount_cents: number
  active: boolean
  created_at: string
}

export interface Reward {
  id: number
  child_id: number
  title: string
  target_points: number
  active: boolean
  redeemed: boolean
  created_at: string
}

export interface PointAdjustment {
  id: number
  child_id: number
  points: number
  reason: string
  date: string
  created_at: string
}

// ==========================================
// COMPUTED / AGGREGATE TYPES
// ==========================================

export interface DailyChore {
  choreTemplateId: number
  title: string
  icon: string
  points: number
  timeOfDay: 'MORNING' | 'AFTERNOON' | 'ALL_DAY'
  completed: boolean
  completionId: number | null
}

export interface ChildChallengeProgress {
  challengeId: number
  title: string
  goalDescription: string
  targetCount: number
  pointsPerUnit: number
  currentCount: number
}

export interface PiggyBalances {
  FUN: number
  SAVINGS: number
  DONATE: number
}

export interface PointsSummary {
  chorePoints: number
  challengePoints: number
  adjustmentPoints: number
  totalPoints: number
}

export interface LeaderboardEntry {
  childId: number
  childName: string
  avatarColor: string
  totalPoints: number
}

export interface RecurringRuleWithChildren extends RecurringPiggyRule {
  childIds: number[]
}

export interface ChoreTemplateWithRules extends ChoreTemplate {
  rules: (ChoreAssignmentRule & { child_name?: string })[]
}

export interface ChallengeWithAssignments extends Challenge {
  childIds: number[]
  progress?: Record<number, number>
}

// ==========================================
// API REQUEST TYPES
// ==========================================

export interface CreateChildRequest {
  name: string
  avatarColor?: string
  birthdate?: string
}

export interface CreateChoreRequest {
  title: string
  icon?: string
  description?: string
  points?: number
  timeOfDay?: 'MORNING' | 'AFTERNOON' | 'ALL_DAY'
  assignments?: Array<{ childId: number; daysOfWeek: number[] }>
}

export interface CreateChallengeRequest {
  title: string
  goalDescription: string
  targetCount: number
  pointsPerUnit: number
  active?: boolean
  childIds?: number[]
}

export interface CreatePiggyTransactionRequest {
  childId: number
  category: 'FUN' | 'SAVINGS' | 'DONATE'
  amountCents: number
  title: string
  date: string
}

export interface CreateRecurringRuleRequest {
  category: 'FUN' | 'SAVINGS' | 'DONATE'
  amountCents: number
  title: string
  cadence: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  startDate: string
  endDate?: string
  nextRunDate: string
  active?: boolean
  childIds: number[]
}

export interface CreatePiggyGoalRequest {
  childId: number
  category: 'SAVINGS' | 'DONATE'
  title: string
  targetAmountCents: number
  active?: boolean
}

export interface CreateRewardRequest {
  childId: number
  title: string
  targetPoints: number
  active?: boolean
  redeemed?: boolean
}

export interface CreatePointAdjustmentRequest {
  childId: number
  points: number
  reason: string
  date: string
}

// ==========================================
// AUTH TYPES
// ==========================================

export interface AuthUser {
  type: 'household'
  id: number
  name: string
  email: string
}

export interface AdminAuthUser {
  type: 'admin'
}

export type AppUser = AuthUser | AdminAuthUser
