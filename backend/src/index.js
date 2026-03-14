import express from 'express';
import cors from 'cors';
import sensorsRouter from './routes/sensors.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', sensorsRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
