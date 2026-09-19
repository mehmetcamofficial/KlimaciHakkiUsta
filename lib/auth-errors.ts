/**
 * Maps raw Supabase Auth errors to a friendly Turkish message. Never surface
 * the raw Postgres/GoTrue error text to the user — only to development logs.
 */
export function mapAuthError(error: { message?: string; status?: number }): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "E-posta veya şifre hatalı.";
  }
  if (message.includes("email not confirmed")) {
    return "E-posta adresinizi onaylamanız gerekiyor. Gelen kutunuzu kontrol edin.";
  }
  if (message.includes("user already registered") || message.includes("already registered")) {
    return "Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.";
  }
  if (message.includes("password") && message.includes("6")) {
    return "Şifre en az 6 karakter olmalıdır.";
  }
  if (message.includes("rate limit") || error.status === 429) {
    return "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Bağlantı sorunu oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.";
  }
  if (message.includes("valid email")) {
    return "Lütfen geçerli bir e-posta adresi girin.";
  }

  return "Bir sorun oluştu. Lütfen tekrar deneyin.";
}

/**
 * Maps the `error`/`error_code`/`error_description` query params Supabase
 * appends to a deep-link redirect (e.g. an expired confirmation or password
 * recovery link) to a friendly Turkish message. Separate from mapAuthError
 * because this data comes from a URL, not a GoTrueError object.
 */
export function mapAuthCallbackError(result: {
  error?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
}): string {
  const code = (result.errorCode ?? "").toLowerCase();
  const description = (result.errorDescription ?? "").toLowerCase();

  if (code.includes("otp_expired") || description.includes("expired")) {
    return "Bağlantının süresi dolmuş. Lütfen yeni bir bağlantı isteyin.";
  }
  if (result.error === "access_denied") {
    return "Bağlantı geçersiz veya erişim reddedildi. Lütfen tekrar deneyin.";
  }
  if (result.error || code) {
    return "Bağlantı geçersiz. Lütfen tekrar deneyin.";
  }
  return "Bir sorun oluştu. Lütfen tekrar deneyin.";
}
