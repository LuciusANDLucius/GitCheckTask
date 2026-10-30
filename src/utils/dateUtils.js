/**
 * Date & Time Utilities
 * Pure helper functions for formatting relative timestamps and task deadlines.
 */

export function relativeTime(dateInput) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const diff = Date.now() - date.getTime();
  const secs  = Math.floor(diff / 1000);
  const mins  = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);

  if (secs < 60)  return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDueDate(dateInput) {
  if (!dateInput) return 'No deadline';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;
  const startOfTomorrow = endOfToday + 1;
  const endOfTomorrow = startOfTomorrow + 24 * 60 * 60 * 1000 - 1;
  const dueTime = date.getTime();

  if (dueTime >= startOfToday && dueTime <= endOfToday) {
    return 'Today';
  }
  if (dueTime >= startOfTomorrow && dueTime <= endOfTomorrow) {
    return 'Tomorrow';
  }

  const diffDays = Math.ceil((dueTime - endOfToday) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return absDays === 1 ? 'Yesterday (Overdue)' : `${absDays}d Overdue`;
  }
  if (diffDays <= 7) {
    return `In ${diffDays} days`;
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getDeadlineStatus(dateInput) {
  if (!dateInput) return { type: 'none', label: 'No deadline', isOverdue: false, isToday: false };
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return { type: 'none', label: 'Invalid date', isOverdue: false, isToday: false };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;
  const dueTime = date.getTime();

  if (dueTime < startOfToday) {
    return { type: 'overdue', label: formatDueDate(date), isOverdue: true, isToday: false };
  }
  if (dueTime >= startOfToday && dueTime <= endOfToday) {
    return { type: 'today', label: 'Today', isOverdue: false, isToday: true };
  }
  return { type: 'upcoming', label: formatDueDate(date), isOverdue: false, isToday: false };
}
