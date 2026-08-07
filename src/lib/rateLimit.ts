type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

// Periyodik temizlik: Süresi dolmuş kayıtları hafızadan temizler
if (typeof setInterval !== "undefined") {
  const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 dakika
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  if (timer.unref) {
    timer.unref();
  }
}

/**
 * Kullanıcı veya IP bazlı sliding window rate limit kontrolü
 * @param key Benzersiz anahtar (Örn: user_id veya IP)
 * @param limit İzin verilen maksimum istek sayısı (varsayılan: 10)
 * @param windowMs Zaman penceresi milisaniye cinsinden (varsayılan: 60000ms = 1 dakika)
 */
export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60 * 1000,
): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSec: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.ceil(Math.max(0, record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSec: Math.ceil(Math.max(0, record.resetAt - now) / 1000),
  };
}
