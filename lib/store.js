import { randomUUID } from 'node:crypto';

const KEY = 'inksync:latest';

export function baseUrl() {
  const value = process.env.PUBLIC_BASE_URL;
  if (!value || !/^https:\/\/[^\s/]+\/?$/.test(value)) {
    throw new Error('PUBLIC_BASE_URL must be an HTTPS site origin.');
  }
  return value.replace(/\/$/, '');
}

async function redis(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Redis environment variables are missing.');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`Redis returned HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error('Redis rejected the command.');
  return payload.result;
}

export async function getSketch() {
  const saved = await redis(['GET', KEY]);
  return saved ? JSON.parse(saved) : { strokes: [], author: '', sentAt: null, version: '0' };
}

export async function putSketch(strokes, author) {
  const record = {
    strokes,
    author,
    sentAt: new Date().toISOString(),
    version: randomUUID().replaceAll('-', '').slice(0, 12)
  };
  await redis(['SET', KEY, JSON.stringify(record)]);
  return record;
}