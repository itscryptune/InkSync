import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import send from './api/send.js';
import state from './api/state.js';
import ink from './api/ink.js';
import qr from './api/qr.js';

const app = express();
const publicDir = join(dirname(fileURLToPath(import.meta.url)), 'public');
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(express.json({ limit: '110kb' }));

app.all('/api/send', send);
app.all('/api/state', state);
app.all('/api/ink', ink);
app.all('/api/qr', qr);

app.get('/', (req, res) => {
  res.sendFile(join(publicDir, 'showcase.html'));
});

app.get(['/draw', '/draw/'], (req, res) => {
  res.sendFile(join(publicDir, 'index.html'));
});

app.get('/showcase.html', (req, res) => {
  res.redirect(301, '/');
});

app.get('/index.html', (req, res) => {
  res.redirect(301, '/draw');
});

app.use(express.static(publicDir));

app.use((req, res) => {
  res.status(404).send('Not found.');
});

app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'This sketch is too large.' });
  }
  console.error('Request failed:', error);
  return res.status(400).json({ error: 'Invalid request.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`InkSync listening on port ${port}`);
});