import express, { type Request, type Response } from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 2 }
});

// Development-only API. Keep CORS unrestricted locally so Vite can use a
// fallback port (for example 5174) if 5173 is already occupied.
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok', mlApiUrl: ML_API_URL }));

app.post('/api/ml/predict', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const image = files?.file?.[0];
  const audio = files?.audio?.[0];
  if (!image || !audio) return res.status(400).json({ message: 'Both an image file and an audio file are required.' });
  if (!image.mimetype.startsWith('image/') || !audio.mimetype.startsWith('audio/')) {
    return res.status(400).json({ message: 'Upload a valid image and audio file.' });
  }

  const toBlob = (file: Express.Multer.File) => {
    // Copy Buffer data into a browser-compatible typed array for Node's FormData.
    const bytes = new Uint8Array(file.buffer.byteLength);
    bytes.set(file.buffer);
    return new Blob([bytes], { type: file.mimetype });
  };
  const formData = new FormData();
  formData.append('file', toBlob(image), image.originalname || 'animal-photo.jpg');
  formData.append('audio', toBlob(audio), audio.originalname || 'voice-message.webm');

  try {
    const mlResponse = await fetch(`${ML_API_URL}/predict`, { method: 'POST', body: formData });
    const payload = await mlResponse.json().catch(() => null);
    if (!mlResponse.ok) return res.status(mlResponse.status).json(payload || { message: 'ML service rejected the upload.' });
    return res.json(payload);
  } catch (error) {
    console.error('ML API request failed:', error);
    return res.status(502).json({ message: 'The ML service is unavailable. Confirm it is running and try again.' });
  }
});

app.listen(PORT, () => console.log(`Fake OTP backend listening on http://localhost:${PORT}`));
