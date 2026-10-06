import {supabase} from './supabase';

type SupabaseAuthError = {
  message: string;
  status?: number;
  code?: string;
};

export async function logClientError(context: string, error: unknown): Promise<void> {
  try {
    const message =
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : JSON.stringify(error);
    const where = typeof window === 'undefined' ? context : `${context} @ ${window.location.pathname}`;
    await supabase
      .from('client_error_logs')
      .insert({context: where, message: message.slice(0, 2000)});
  } catch {
    // logging failures must never reach the user
  }
}

export async function reportError(context: string, error: unknown): Promise<string> {
  await logClientError(context, error);
  return toFunctionErrorMessage(error);
}

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
    match: /rate limit|too many requests|too many emails/i,
    message: 'Too many attempts. Please wait a moment and try again.',
  },
  {
    match: /duplicate key value violates unique constraint/i,
    message: 'That already exists. Nothing was changed.',
  },
  {
    match: /permission denied for|row-level security|new row violates row-level/i,
    message: 'You do not have permission to do that.',
  },
  {
    match: /violates foreign key constraint/i,
    message: 'A related record is missing. Refresh and try again.',
  },
  {
    match: /violates check constraint|not-null constraint/i,
    message: 'A required value was missing or not allowed. Please try again.',
  },
  {
    match: /invalid input syntax|invalid uuid|invalid text representation/i,
    message: 'Some information was not in the expected format.',
  },
  {
    match: /statement timeout|canceling statement|due to request timeout/i,
    message: 'The request took too long. Please try again.',
  },
  {
    match: /does not exist/i,
    message: 'Something went wrong. Please try again.',
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

const POSTGREST_CODES: Record<string, string> = {
  '42501': 'You do not have permission to do that.',
  '23502': 'A required value was missing. Please try again.',
  '23503': 'A related record is missing. Refresh and try again.',
  '23505': 'That already exists. Nothing was changed.',
  '23514': 'That value is not allowed here.',
  '22P02': 'Some information was not in the expected format.',
  '57014': 'The request took too long. Please try again.',
  PGRST116: 'This record could not be found.',
  PGRST301: 'Your session has expired. Please sign in again.',
};

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

  const code = (error as {code?: unknown} | null)?.code;
  if (typeof code === 'string' && POSTGREST_CODES[code]) return POSTGREST_CODES[code];
  if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) {
    return 'Something went wrong. Please try again.';
  }

  if (!raw) return 'Something went wrong. Please try again.';
  return raw;
}

export function isAckError(error: unknown): boolean {
  const raw =
    typeof error === 'string' ? error : error instanceof Error ? error.message : '';
  return /acknowledgement/i.test(raw);
}

export async function toFunctionErrorMessage(error: unknown): Promise<string> {
  try {
    const context = (error as {context?: Response} | null)?.context;
    if (context && typeof context.clone === 'function') {
      const body = (await context.clone().json()) as {error?: {message?: string}} | null;
      const message = body?.error?.message;
      if (message) return toFriendlyMessage(message);
    }
  } catch {
    // no structured body available; use the generic mapping
  }
  return toFriendlyMessage(error);
}
