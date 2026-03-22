import type { MeetingStatus } from '../types';

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

export function formatDistanceToNow(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;

  return d.toLocaleDateString();
}

export function buildMeetingScheduledAt(dateInput: string, timeInput: string): string | null {
  const [year, month, day] = dateInput.split('-').map(Number);
  const [hour, minute] = timeInput.split(':').map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    return null;
  }

  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

export function getMeetingDateKey(scheduledAt: string | Date): string {
  const date = typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt;

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function formatMeetingDateParts(scheduledAt: string) {
  const date = new Date(scheduledAt);

  return {
    date,
    dateKey: getMeetingDateKey(date),
    fullDate: date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
    monthDay: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}

export function formatMeetingDateKeyLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function isUpcomingMeeting(scheduledAt: string, now = new Date()) {
  return new Date(scheduledAt).getTime() >= now.getTime();
}

export function isMeetingWithinDays(scheduledAt: string, days: number, now = new Date()) {
  const diff = new Date(scheduledAt).getTime() - now.getTime();
  return diff >= 0 && diff < days * MILLISECONDS_IN_DAY;
}

export function sortMeetingsByScheduledAt<T extends { scheduled_at: string }>(meetings: T[]) {
  return [...meetings].sort(
    (left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime()
  );
}

export function getMeetingStatusClasses(status: MeetingStatus) {
  if (status === 'accepted') {
    return 'bg-green-100 text-green-700 border border-green-200';
  }

  if (status === 'rejected') {
    return 'bg-red-100 text-red-700 border border-red-200';
  }

  return 'bg-amber-100 text-amber-700 border border-amber-200';
}
