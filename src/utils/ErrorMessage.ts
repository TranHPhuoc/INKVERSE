export function mapAuthError(message?: string | null): string {
  if (!message) return "Đã xảy ra lỗi, vui lòng thử lại.";

  const msg = message.toLowerCase();

  // Sai email / mật khẩu
  if (msg.includes("badcredentialsexception")) {
    return "Email hoặc mật khẩu không chính xác.";
  }

  // Độ dài mật khẩu
  if (msg.includes("password must be between") && msg.includes("6") && msg.includes("20")) {
    return "Mật khẩu phải từ 6 đến 20 ký tự.";
  }

  // Email đã tồn tại
  if (msg.includes("email already exists")) {
    return "Email này đã được đăng ký, vui lòng dùng email khác hoặc đăng nhập.";
  }

  // Username đã tồn tại
  if (msg.includes("username already exists")) {
    return "Tên người dùng đã tồn tại, vui lòng chọn tên khác.";
  }

  // fallback
  return "Đã xảy ra lỗi, vui lòng thử lại.";
}
