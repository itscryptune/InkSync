# InkSync

A  drawing app for sending sketches to a TRMNL e-ink display. Draw something, add your name, and send it. The latest sketch shows up on the display when it refreshes.

## Features
- Draw with mouse or touch
- Pen and eraser with adjustable sizes
- Undo, redo, and clear
- Scan a QR code to open the drawing page
- Show who drew it and when it was sent

## Running it locally

I built and tested this on Windows 11 using Docker and [TRMNL Preview](https://github.com/usetrmnl/trmnlp).

```powershell
git clone https://github.com/itscryptune/InkSync.git
cd InkSync
npm install
cp .env.example .env
```

Add your Upstash REST credentials to .env and set PUBLIC_BASE_URL to your public HTTPS site URL. Then run:
```powershell
node --env-file=.env server.mjs
```
Open http://localhost:3000 for the showcase or http://localhost:3000/draw to draw.


## What's missing
- Anyone with the drawing link can submit something. There's no sign-in or moderation yet.
- Updates depend on TRMNL's polling and device refresh schedule, not an instant push.

## Built with
- HTML, CSS, and JavaScript
- Node.js and Express
- Upstash Redis
- TRMNL Liquid templates
- Vercel
- Nest for hosting