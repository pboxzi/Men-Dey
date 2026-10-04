type SupabaseAuthError = {
  message: string;
  status?: number;
  code?: string;
};

const FRIENDLY_MESSAGES: Array<{match: RegExp; message: string}> = [
  {
    match: /acknowledgement required before account creation/i,
    message: 'Please read and accept the acknowledgement before creating an account.',
  },
  {
    match: /acknowledgement version is not valid|not published/i,
    message: 'The acknowledgement could not be verified. Please read the current version again.',
  },
  {
    match: /already registered|already been registered/i,
    message: 'An account with this email already exists. Try signing in instead.',
  },
  {
    match: /password should be at least|password.*too short/i,
    message: 'Password must be at least 8 characters long.',
  },
  {
    match: /invalid login credentials/i,
    message: 'Email or password is incorrect.',
  },
  {
    match: /email not confirmed/i,
    message: 'Please verify your email address before signing in.',
  },
  {
    match: /otp.*expired|token.*expired|link.*expired|has expired/i,
    message: 'This verification link has expired or is invalid. Request a new one below.',
  },
  {
    match: /already.*verified|already.*confirmed/i,
    message: 'This email address is already verified. You can sign in now.',
  },
  {
    match: /rate limit|too many requests/i,
    message: 'Too many attempts. Please wait a moment and try again.',
  },
  {
    match: /failed to fetch|network/i,
    message: 'Connection problem. Please check your network and try again.',
  },
  {
    match: /you cannot remove your own administrator role/i,
    message: 'You cannot remove your own administrator role.',
  },
  {
    match: /role changes must be made by an administrator/i,
    message: 'Only administrators can change account roles.',
  },
  {
    match: /not authorized to change account status/i,
    message: 'You are not authorized to change account status.',
  },
  {
    match: /user already has this role/i,
    message: 'That user already has this role.',
  },
];

export function toFriendlyMessage(error: unknown): string {
  const raw =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : (error as SupabaseAuthError | null)?.message ?? '';

  for (const entry of FRIENDLY_MESSAGES) {
    if (entry.match.test(raw)) return entry.message;
  }

  if (!raw) return 'Something went wrong. Please try again.';
  return raw;
}

export function isAckError(error: unknown): boolean {
  const raw =
    typeof error === 'string' ? error : error instanceof Error ? error.message : '';
  return /acknowledgement/i.test(raw);
}
