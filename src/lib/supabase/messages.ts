import { copy } from '@/lib/copy';

const authRules: [RegExp, string][] = [
  [/invalid login credentials|password authentication failed|wrong email or password/i, copy['COPY-01']],
  [/user already registered|already registered|already been registered/i, copy['COPY-02']],
  [/email not confirmed/i, copy['COPY-137']],
  [/password should be at least|password is too weak|weak password/i, copy['COPY-03']],
  [/rate limit|too many requests|too many attempts/i, copy['COPY-138']],
  [/failed to fetch|networkerror|network request failed/i, copy['COPY-139']],
  [/authentication required|jwt|token/i, copy['COPY-140']],
];

const saveRules: [RegExp, string][] = [
  [/not-null constraint|null value in column/i, copy['COPY-142']],
  [/unique constraint|duplicate key/i, copy['COPY-143']],
  [/foreign key constraint/i, copy['COPY-144']],
  [/row-level security policy|permission denied/i, copy['COPY-145']],
  [/invalid shopping data/i, copy['COPY-146']],
  [/checklist items must be an array/i, copy['COPY-147']],
  [/checklist items must not be empty/i, copy['COPY-148']],
  [/no active checklist/i, copy['COPY-149']],
  [/date range is required/i, copy['COPY-121']],
  [/date_from must be <= date_to/i, copy['COPY-122']],
];

function match(rules: [RegExp, string][], message: string, fallback: string): string {
  for (const [pattern, text] of rules) {
    if (pattern.test(message)) return text;
  }
  return fallback;
}

/** Thông báo lỗi đăng nhập/đăng ký bằng tiếng Việt. */
export function authErrorMessage(message: string): string {
  return match(authRules, message, copy['COPY-141']);
}

/** Thông báo lỗi khi lưu dữ liệu lên Supabase bằng tiếng Việt. */
export function saveErrorMessage(message: string): string {
  return match(saveRules, message, copy['COPY-150']);
}
