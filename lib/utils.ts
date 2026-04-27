import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const YESTERDAY = (() => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
})();

export const TOMORROW = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
})();
