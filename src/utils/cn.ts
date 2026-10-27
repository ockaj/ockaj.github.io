import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { withConcentric } from "tailwindcss-concentric/merge";

const twMerge = extendTailwindMerge(withConcentric);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
