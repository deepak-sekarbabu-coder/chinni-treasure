export function sanitize(input: string): string {
  // Only strip HTML angle brackets to prevent XSS.
  // Do NOT encode HTML entities — React escapes output via JSX.
  return input.trim().replace(/[<>]/g, "");
}

