const authRules: [RegExp, string][] = [
  [/invalid login credentials|password authentication failed|wrong email or password/i, 'Email hoặc mật khẩu không đúng.'],
  [/user already registered|already registered|already been registered/i, 'Email này đã được đăng ký. Hãy đăng nhập.'],
  [/email not confirmed/i, 'Email chưa được xác nhận. Kiểm tra hộp thư để xác nhận rồi đăng nhập.'],
  [/password should be at least|password is too weak|weak password/i, 'Mật khẩu cần có ít nhất 6 ký tự.'],
  [/rate limit|too many requests|too many attempts/i, 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.'],
  [/failed to fetch|networkerror|network request failed/i, 'Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.'],
  [/authentication required|jwt|token/i, 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.'],
];

const saveRules: [RegExp, string][] = [
  [/not-null constraint|null value in column/i, 'Dữ liệu gửi lên không đủ thông tin bắt buộc.'],
  [/unique constraint|duplicate key/i, 'Dữ liệu bị trùng với dữ liệu đã có.'],
  [/foreign key constraint/i, 'Dữ liệu liên kết không còn tồn tại.'],
  [/row-level security policy|permission denied/i, 'Tài khoản này không được phép thực hiện thao tác đó.'],
  [/invalid shopping data/i, 'Dữ liệu kế hoạch không hợp lệ.'],
  [/checklist items must be an array/i, 'Checklist không hợp lệ.'],
  [/checklist items must not be empty/i, 'Checklist trống, không có gì để lưu.'],
  [/no active checklist/i, 'Checklist này đã kết thúc. Hãy tạo Checklist mới từ kế hoạch tuần.'],
  [/date range is required/i, 'Vui lòng nhập Từ ngày và Đến ngày.'],
  [/date_from must be <= date_to/i, 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.'],
];

function match(rules: [RegExp, string][], message: string, fallback: string): string {
  for (const [pattern, text] of rules) {
    if (pattern.test(message)) return text;
  }
  return fallback;
}

/** Thông báo lỗi đăng nhập/đăng ký bằng tiếng Việt. */
export function authErrorMessage(message: string): string {
  return match(authRules, message, 'Không thể xác thực tài khoản. Vui lòng thử lại.');
}

/** Thông báo lỗi khi lưu dữ liệu lên Supabase bằng tiếng Việt. */
export function saveErrorMessage(message: string): string {
  return match(saveRules, message, 'Không lưu được dữ liệu lên Supabase.');
}
