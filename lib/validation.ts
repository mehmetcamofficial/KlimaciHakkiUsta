const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Matches the minimum length Supabase's project default enforces at signup. */
export function isValidPassword(value: string): boolean {
  return value.length >= 6;
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password.length > 0 && password === confirmPassword;
}
