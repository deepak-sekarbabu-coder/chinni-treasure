export function sanitize(input: string): string {
  return input.trim().replace(/<[^>]*>/g, "");
}

