import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { msFromISO, isNowWithinWindow } from '../src/Utils/time.helper.js';

describe('time.helper', () => {
  it('msFromISO handles Date, number, ISO string', () => {
    const d = new Date('2025-10-09T12:00:00Z');
    expect(msFromISO(d)).toBe(d.getTime());
    expect(msFromISO(d.getTime())).toBe(d.getTime());
    expect(msFromISO('2025-10-09T12:00:00Z')).toBe(d.getTime());
    expect(msFromISO('invalid')).toBe(null);
  });

  it('isNowWithinWindow boundary exactly 15 minutes', () => {
    // scheduled 15 minutes from now -> windowStart = now -> allowed
    const now = Date.now();
    const scheduledMs = now + 15 * 60 * 1000;
    vi.setSystemTime(now);
    expect(isNowWithinWindow(scheduledMs, 15)).toBe(true);
    // scheduled 15 minutes + 1ms -> windowStart = now + 1ms -> not allowed
    const scheduledMs2 = now + 15 * 60 * 1000 + 1;
    expect(isNowWithinWindow(scheduledMs2, 15)).toBe(false);
  });

  it('DST-like scenario: fixed timestamps work regardless of local tz', () => {
    // pick two instants that represent the same wall-clock local time before/after DST
    // but we assert the helper works on absolute instants
    const before = Date.parse('2025-03-09T01:30:00Z');
    const after = Date.parse('2025-03-09T02:30:00Z');
    vi.setSystemTime(before);
    expect(isNowWithinWindow(before + 10 * 60 * 1000, 15)).toBe(true);
    vi.setSystemTime(after);
    expect(isNowWithinWindow(after + 10 * 60 * 1000, 15)).toBe(true);
  });
});
