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

export default {
  msFromISO,
  isNowWithinWindow
};
