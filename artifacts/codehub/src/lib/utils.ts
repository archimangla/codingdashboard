import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatTime(dateStr: string | undefined | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function getDifficultyColor(difficulty: string | null | undefined) {
  if (!difficulty) return 'text-muted-foreground';
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'difficulty-easy';
    case 'medium': return 'difficulty-medium';
    case 'hard': return 'difficulty-hard';
    default: return 'text-muted-foreground';
  }
}

export function getDifficultyBg(difficulty: string | null | undefined) {
  if (!difficulty) return 'bg-muted text-muted-foreground border-transparent';
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'bg-difficulty-easy border';
    case 'medium': return 'bg-difficulty-medium border';
    case 'hard': return 'bg-difficulty-hard border';
    default: return 'bg-muted text-muted-foreground border-transparent';
  }
}
