import DOMPurify from "isomorphic-dompurify";

export function sanitize(input: string): string {
  return DOMPurify.sanitize(input.trim());
}

