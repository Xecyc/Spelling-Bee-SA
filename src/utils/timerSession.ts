// Session-level persistence for contest countdown timer
// Persists user-entered duration across wheels and slides during the session,
// and resets to 40 seconds upon reset action or when the user exits the site.

export const DEFAULT_TIMER_SECONDS = 30;
export const ELEMENTARY_DEFAULT_TIMER_SECONDS = 30;
export const HIGH_SCHOOL_DEFAULT_TIMER_SECONDS = 40;

export function getDefaultTimerForGroup(group?: string): number {
  return group === 'elementary' ? ELEMENTARY_DEFAULT_TIMER_SECONDS : HIGH_SCHOOL_DEFAULT_TIMER_SECONDS;
}

const SESSION_TIMER_KEY = 'salto_angel_session_timer';

export function getSessionTimerDuration(defaultFallback = ELEMENTARY_DEFAULT_TIMER_SECONDS): number {
  if (typeof window === 'undefined') return defaultFallback;
  try {
    const val = sessionStorage.getItem(SESSION_TIMER_KEY);
    if (val) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed >= 5 && parsed <= 600) {
        return parsed;
      }
    }
  } catch {
    // Fallback if sessionStorage is blocked
  }
  return defaultFallback;
}

export function setSessionTimerDuration(seconds: number): void {
  if (typeof window === 'undefined') return;
  try {
    const clamped = Math.max(5, Math.min(600, Math.round(seconds)));
    sessionStorage.setItem(SESSION_TIMER_KEY, clamped.toString());
  } catch {
    // Ignore storage quota errors
  }
}

export function resetSessionTimerDuration(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_TIMER_KEY);
  } catch {
    // Ignore
  }
}
