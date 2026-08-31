"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = require("crypto");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT || 4000);
const OTP_TTL_MS = 5 * 60 * 1000;
const otpStore = new Map();
// Development-only API. Keep CORS unrestricted locally so Vite can use a
// fallback port (for example 5174) if 5173 is already occupied.
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const normalisePhone = (phone = '') => {
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10)
        return `+91${digits}`;
    return digits.length >= 11 && digits.length <= 15 ? `+${digits}` : null;
};
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.post('/api/auth/send-otp', (req, res) => {
    const phone = normalisePhone(req.body.phone);
    if (!phone)
        return res.status(400).json({ message: 'Enter a valid phone number.' });
    const otp = (0, crypto_1.randomInt)(100000, 1000000).toString();
    otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_TTL_MS });
    console.log(`[DEV ONLY] OTP for ${phone}: ${otp}`);
    // devOtp is deliberately returned only by this local fake backend. Never do
    // this with a real SMS provider or production deployment.
    return res.json({ message: 'OTP generated for development.', expiresInSeconds: OTP_TTL_MS / 1000, devOtp: otp });
});
app.post('/api/auth/verify-otp', (req, res) => {
    const phone = normalisePhone(req.body.phone);
    const otp = String(req.body.otp || '');
    const record = phone && otpStore.get(phone);
    if (!record || record.expiresAt < Date.now()) {
        if (phone)
            otpStore.delete(phone);
        return res.status(400).json({ message: 'OTP is invalid or has expired. Request a new code.' });
    }
    if (record.otp !== otp)
        return res.status(400).json({ message: 'Incorrect OTP.' });
    otpStore.delete(phone);
    return res.json({ user: { id: `mock-${Buffer.from(phone).toString('base64url')}`, phone, role: req.body.role || 'Farmer' } });
});
app.listen(PORT, () => console.log(`Fake OTP backend listening on http://localhost:${PORT}`));
//# sourceMappingURL=index.js.map