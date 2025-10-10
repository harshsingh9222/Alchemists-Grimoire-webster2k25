// Small time helpers for canonicalizing scheduled times and window checks
export const msFromISO = (value) => {
  if (!value && value !== 0) return null;
  // Accept Date, number (ms), or ISO string
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  // string
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
};

// Returns true if now is at or after scheduled - minutesBefore
export const isNowWithinWindow = (scheduled, minutesBefore = 15) => {
  const scheduledMs = msFromISO(scheduled);
  if (scheduledMs === null) return false;
  const windowStart = scheduledMs - minutesBefore * 60 * 1000;
  return Date.now() >= windowStart;
};

// Returns a Date window around N minutes from now, expanded by a tolerance in minutes
export const windowAroundNow = (minutesAhead = 30, toleranceMinutes = 2) => {
  const nowMs = Date.now();
  const targetMs = nowMs + minutesAhead * 60 * 1000;
  const tolMs = toleranceMinutes * 60 * 1000;
  return {
    start: new Date(targetMs - tolMs),
    end: new Date(targetMs + tolMs),
  };
};

export default {
  msFromISO,
  isNowWithinWindow,
  windowAroundNow
};
