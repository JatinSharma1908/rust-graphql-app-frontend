// In-memory OTP store — swap with Redis in production
// e.g. @upstash/redis

interface OtpEntry {
    otp: string;
    expiresAt: number; // unix ms
}

const store = new Map<string, OtpEntry>();

export function saveOtp(email: string, otp: string, ttlMs = 5 * 60 * 1000) {
    store.set(email, { otp, expiresAt: Date.now() + ttlMs });
}

export function verifyOtp(email: string, otp: string): boolean {
    const entry = store.get(email);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
        store.delete(email);
        return false;
    }
    if (entry.otp !== otp) return false;
    store.delete(email); // one-time use
    return true;
}