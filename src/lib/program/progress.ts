/**
 * Progress calculation utilities for the 4-week program.
 */

/**
 * Calculate week progress as a fraction (0-1) from milestone completion.
 */
export function calcWeekProgress(
  milestones: Array<{ completedAt: Date | null }>,
): number {
  if (milestones.length === 0) return 0;
  const completed = milestones.filter((m) => m.completedAt !== null).length;
  return completed / milestones.length;
}

/**
 * Calculate overall program progress as average of week progresses.
 */
export function calcOverallProgress(
  weeks: Array<{ progress: number }>,
): number {
  if (weeks.length === 0) return 0;
  return weeks.reduce((sum, w) => sum + w.progress, 0) / weeks.length;
}

/**
 * Check if the next week should be unlocked.
 * Requires 70% completion of the current week.
 */
export function shouldUnlockNextWeek(currentProgress: number): boolean {
  return currentProgress >= 0.7;
}
