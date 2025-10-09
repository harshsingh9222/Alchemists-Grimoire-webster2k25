// Client-side time helpers to match server behavior
export const msFromISO = (value) => {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
};

export const isNowWithinWindow = (scheduled, minutesBefore = 15) => {
  const scheduledMs = msFromISO(scheduled);
  if (scheduledMs === null) return false;
  const windowStart = scheduledMs - minutesBefore * 60 * 1000;
  return Date.now() >= windowStart;
};

export default { msFromISO, isNowWithinWindow };
