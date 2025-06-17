import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Split a string containing one or more JSON objects into individual object strings
export function splitJsonObjects(text: string): string[] {
  const objects: string[] = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  let buffer = "";

  for (const char of text) {
    buffer += char;

    if (char === '"' && !escape) {
      inString = !inString;
    }

    escape = char === "\\" && !escape && inString;

    if (!inString) {
      if (char === "{") depth++;
      if (char === "}") depth--;
    }

    if (depth === 0 && buffer.trim()) {
      objects.push(buffer.trim());
      buffer = "";
    }
  }

  if (buffer.trim()) objects.push(buffer.trim());
  return objects;
}
