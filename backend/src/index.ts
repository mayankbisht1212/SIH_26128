import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { randomInt } from 'crypto';

type OtpRecord = { otp: string; expiresAt: number };
type SendOtpBody = { phone?: string };
type VerifyOtpBody = { phone?: string; otp?: string; role?: string };

const app = express();
const PORT = Number(process.env.PORT || 4000);
const OTP_TTL_MS = 5 * 60 * 1000;
const otpStore = new Map<string, OtpRecord>();

// Development-only API. Keep CORS unrestricted locally so Vite can use a
// fallback port (for example 5174) if 5173 is already occupied.
app.use(cors());
app.use(express.json());

const normalisePhone = (phone = ''): string | null => {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? `+${digits}` : null;
};

app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

app.post('/api/auth/send-otp', (req: Request<object, object, SendOtpBody>, res: Response) => {
  const phone = normalisePhone(req.body.phone);
  if (!phone) return res.status(400).json({ message: 'Enter a valid phone number.' });

  const otp = randomInt(100000, 1000000).toString();
  otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_TTL_MS });
  console.log(`[DEV ONLY] OTP for ${phone}: ${otp}`);

  // devOtp is deliberately returned only by this local fake backend. Never do
  // this with a real SMS provider or production deployment.
  return res.json({ message: 'OTP generated for development.', expiresInSeconds: OTP_TTL_MS / 1000, devOtp: otp });
});

app.post('/api/auth/verify-otp', (req: Request<object, object, VerifyOtpBody>, res: Response) => {
  const phone = normalisePhone(req.body.phone);
  const otp = String(req.body.otp || '');
  const record = phone && otpStore.get(phone);
  if (!record || record.expiresAt < Date.now()) {
    if (phone) otpStore.delete(phone);
    return res.status(400).json({ message: 'OTP is invalid or has expired. Request a new code.' });
  }
  if (record.otp !== otp) return res.status(400).json({ message: 'Incorrect OTP.' });

  otpStore.delete(phone);
  return res.json({ user: { id: `mock-${Buffer.from(phone).toString('base64url')}`, phone, role: req.body.role || 'Farmer' } });
});

app.listen(PORT, () => console.log(`Fake OTP backend listening on http://localhost:${PORT}`));
