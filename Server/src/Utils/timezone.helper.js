import { DateTime } from 'luxon';

/**
 * Convert a local wall-clock time (HH:mm) on a given date and IANA timezone
 * into a UTC Date instance representing that instant.
 *
 * @param {string|Date} date - date or ISO string representing the target date (date part used)
 * @param {string} timeHHMM - time string like '08:30' or '8:30'
 * @param {string} timezone - IANA timezone like 'Asia/Kolkata' or 'America/Los_Angeles'
 * @returns {Date} - JS Date in UTC for that local instant
 */
function localTimeToUTCDate(date, timeHHMM, timezone) {
  const dt = DateTime.fromISO((new Date(date)).toISOString(), { zone: 'utc' });
  // extract date parts in the target timezone by parsing date in that zone
  const parts = DateTime.fromObject(
    { year: dt.year, month: dt.month, day: dt.day },
    { zone: timezone }
  );

  const [hourStr, minStr] = timeHHMM.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);

  const local = DateTime.fromObject(
    { year: parts.year, month: parts.month, day: parts.day, hour, minute },
    { zone: timezone }
  );

  // Return JS Date in UTC
  return new Date(local.toUTC().toISO());

}

export { localTimeToUTCDate };
