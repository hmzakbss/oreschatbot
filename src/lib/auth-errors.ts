/** Supabase Auth hata mesajlarını kullanıcı dostu Türkçeye çevirir. */
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "E-posta veya şifre hatalı.";
  }
  if (m.includes("email not confirmed")) {
    return "E-posta henüz doğrulanmamış. Gelen kutundaki bağlantıya tıklayın.";
  }
  if (m.includes("user already registered")) {
    return "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.";
  }
  if (m.includes("password should be at least")) {
    return "Şifre en az 6 karakter olmalı.";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "Geçerli bir e-posta adresi girin.";
  }
  if (m.includes("signup is disabled")) {
    return "Yeni kayıt şu an kapalı.";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Bağlantı hatası. İnternetinizi kontrol edip tekrar deneyin.";
  }
  if (m.includes("for security purposes")) {
    return "Güvenlik nedeniyle biraz bekleyip tekrar deneyin.";
  }

  return message;
}
