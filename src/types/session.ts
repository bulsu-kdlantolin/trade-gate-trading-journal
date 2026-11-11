export interface TradingSession {
  id: string;
  name: string;
  label: string;
  utcStartHour: number; // in UTC hours e.g. 0
  utcStartMinute: number;
  utcEndHour: number;   // in UTC hours e.g. 8
  utcEndMinute: number;
  color: string;
  isDefault?: boolean;
}

export interface SessionStatus {
  id: string;
  name: string;
  label: string;
  color: string;
  isActive: boolean;
  timeRemainingStr: string;
  utcRangeStr: string;
  localRangeStr: string;
  elapsedMinutes: number;
}

export const DEFAULT_CRYPTO_SESSIONS: TradingSession[] = [
  {
    id: 'asia',
    name: 'Asia',
    label: 'ASIA',
    utcStartHour: 0,
    utcStartMinute: 0,
    utcEndHour: 8,
    utcEndMinute: 0,
    color: '#FFFFFF', // Asia: White
    isDefault: true
  },
  {
    id: 'london',
    name: 'London',
    label: 'LONDON',
    utcStartHour: 7,
    utcStartMinute: 0,
    utcEndHour: 15,
    utcEndMinute: 0,
    color: '#3B82F6', // London: Blue
    isDefault: true
  },
  {
    id: 'ny_am',
    name: 'NY AM',
    label: 'NY AM',
    utcStartHour: 13,
    utcStartMinute: 0,
    utcEndHour: 18,
    utcEndMinute: 0,
    color: '#3B82F6', // NY AM: Institutional Electric Blue
    isDefault: true
  },
  {
    id: 'ny_pm',
    name: 'NY PM',
    label: 'NY PM',
    utcStartHour: 18,
    utcStartMinute: 0,
    utcEndHour: 22,
    utcEndMinute: 0,
    color: '#F87171', // NY PM: Light Red
    isDefault: true
  }
];

