import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes without conflicts.
 * Essential for reusable UI components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats timestamps for chat bubbles (e.g., "12:45 PM" or "Yesterday")
 */
export function formatChatTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  
  const isToday = d.toDateString() === now.toDateString();
  
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Shortens a username or key for UI display (e.g., "Mmesoma..." or "0x123...abc")
 */
export function truncate(str: string, length: number = 20): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Generates a consistent color/avatar based on a username
 */
export function getAvatarColor(username: string): string {
  const colors = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 
    'bg-amber-500', 'bg-sky-500', 'bg-violet-500'
  ];
  const index = username.length % colors.length;
  return colors[index];
}