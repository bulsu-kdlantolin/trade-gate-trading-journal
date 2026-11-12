import { SessionStatus, DEFAULT_CRYPTO_SESSIONS, TradingSession } from '../types/session';

export function getSavedTradingSessions(): TradingSession[] {
  try {
    const raw = localStorage.getItem('tradegate_custom_sessions');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: TradingSession) => {
          const def = DEFAULT_CRYPTO_SESSIONS.find((d) => d.id === s.id);
          return def ? { ...s, color: def.color } : s;
        });
      }
    }
  } catch { }
  return DEFAULT_CRYPTO_SESSIONS;
}

export function saveTradingSessions(sessions: TradingSession[]): void {
  try {
    localStorage.setItem('tradegate_custom_sessions', JSON.stringify(sessions));
    window.dispatchEvent(new Event('tradegate_sessions_updated'));
  } catch { }
}

export function resetTradingSessions(): TradingSession[] {
  try {
    localStorage.removeItem('tradegate_custom_sessions');
    window.dispatchEvent(new Event('tradegate_sessions_updated'));
  } catch { }
  return DEFAULT_CRYPTO_SESSIONS;
}

/**
 * Converts UTC hour and minute into the user's auto-detected local device time.
 */
export function getLocalFromUtc(utcHour: number, utcMinute: number): {
  localHour24: number;
  localHour12: number;
  localMinute: number;
  period: 'AM' | 'PM';
  displayStr: string;
} {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, utcMinute));
  const localHour24 = d.getHours();
  const localMinute = d.getMinutes();
  const period = localHour24 >= 12 ? 'PM' : 'AM';
  const localHour12 = localHour24 % 12 === 0 ? 12 : localHour24 % 12;
  const displayStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

  return {
    localHour24,
    localHour12,
    localMinute,
    period,
    displayStr,
  };
}

/**
 * Converts user's local device hour and minute into UTC.
 */
export function getUtcFromLocal(localHour24: number, localMinute: number): {
  utcHour: number;
  utcMinute: number;
} {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), localHour24, localMinute);
  return {
    utcHour: d.getUTCHours(),
    utcMinute: d.getUTCMinutes(),
  };
}

export function formatSessionLocalRange(session: TradingSession): string {
  const start = getLocalFromUtc(session.utcStartHour, session.utcStartMinute);
  const end = getLocalFromUtc(session.utcEndHour, session.utcEndMinute);
  return `${start.displayStr} - ${end.displayStr}`;
}

export function format12Hour(hour24: number, minute: number): string {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minuteStr = minute.toString().padStart(2, '0');
  return `${hour12}:${minuteStr} ${period}`;
}

/**
 * Evaluates current time against trading session windows, formatted in auto-detected device local time with 12-hour AM/PM.
 */
export function getCurrentSessionStatuses(customSessions: TradingSession[] = getSavedTradingSessions()): SessionStatus[] {
  const now = new Date();
  const currentUtcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  return customSessions.map((session) => {
    const startMinutes = session.utcStartHour * 60 + session.utcStartMinute;
    const endMinutes = session.utcEndHour * 60 + session.utcEndMinute;

    let isActive = false;
    let minutesRemaining = 0;
    let elapsedMinutes = 0;

    if (startMinutes < endMinutes) {
      // Standard intraday session
      isActive = currentUtcMinutes >= startMinutes && currentUtcMinutes < endMinutes;
      if (isActive) {
        minutesRemaining = endMinutes - currentUtcMinutes;
        elapsedMinutes = currentUtcMinutes - startMinutes;
      }
    } else {
      // Overnight session (spanning UTC midnight)
      isActive = currentUtcMinutes >= startMinutes || currentUtcMinutes < endMinutes;
      if (isActive) {
        minutesRemaining =
          currentUtcMinutes >= startMinutes
            ? 24 * 60 - currentUtcMinutes + endMinutes
            : endMinutes - currentUtcMinutes;
        elapsedMinutes =
          currentUtcMinutes >= startMinutes
            ? currentUtcMinutes - startMinutes
            : 24 * 60 - startMinutes + currentUtcMinutes;
      }
    }

    const hoursLeft = Math.floor(minutesRemaining / 60);
    const minsLeft = minutesRemaining % 60;
    const timeRemainingStr = isActive ? `${hoursLeft}h ${minsLeft}m left` : 'Closed';

    const localRangeStr = formatSessionLocalRange(session);

    return {
      id: session.id,
      name: session.name,
      label: session.label,
      color: session.color,
      isActive,
      timeRemainingStr,
      utcRangeStr: localRangeStr,
      localRangeStr,
      elapsedMinutes,
    };
  });
}

/**
 * Returns the single current active session.
 * If multiple sessions overlap (e.g. Asia and London), selects the current NEW session that started most recently.
 */
export function getCurrentActiveSession(customSessions: TradingSession[] = getSavedTradingSessions()): SessionStatus | null {
  const statuses = getCurrentSessionStatuses(customSessions);
  const active = statuses.filter((s) => s.isActive);

  if (active.length === 0) return null;
  if (active.length === 1) return active[0];

  // Multiple active sessions: select the newly opened session (lowest elapsedMinutes)
  const sorted = [...active].sort((a, b) => a.elapsedMinutes - b.elapsedMinutes);
  return sorted[0];
}

/**
 * Formats time in the device's auto-detected local timezone with 12-hour AM/PM format (e.g. "1:45:22 PM").
 */
export function formatDeviceClock(date: Date = new Date()): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatUtcClock(date: Date = new Date()): string {
  return formatDeviceClock(date);
}

export function formatLocalClock(date: Date = new Date()): string {
  return formatDeviceClock(date);
}

export interface NextSessionCountdown {
  sessionName: string;
  hours: number;
  minutes: number;
  formattedStr: string;
}

/**
 * Calculates countdown string until the next upcoming trading session begins.
 */
export function getTimeUntilNextSession(customSessions: TradingSession[] = getSavedTradingSessions()): NextSessionCountdown {
  const now = new Date();
  const currentUtcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  let nextSession: TradingSession = customSessions[0];
  let minDiff = 24 * 60 + 1;

  for (const session of customSessions) {
    const startMinutes = session.utcStartHour * 60 + session.utcStartMinute;
    let diff = startMinutes - currentUtcMinutes;
    if (diff <= 0) {
      diff += 24 * 60;
    }
    if (diff < minDiff) {
      minDiff = diff;
      nextSession = session;
    }
  }

  const hours = Math.floor(minDiff / 60);
  const minutes = minDiff % 60;
  const formattedStr = `${nextSession.name} in ${hours}h ${minutes}m`;

  return {
    sessionName: nextSession.name,
    hours,
    minutes,
    formattedStr,
  };
}
