const pad = document.querySelector('#pad');
const ctx = pad.getContext('2d');
const authorInput = document.querySelector('#author');
const status = document.querySelector('#status');
const latestMeta = document.querySelector('#latest-meta');
const latestPreview = document.querySelector('#preview');
const strokes = [];
let activePointer = null;
let currentStroke = null;

function showDraft() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, pad.width, pad.height);
  ctx.strokeStyle = '#111';
  ctx.fillStyle = '#111';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    if (stroke.length === 1) {
      ctx.beginPath();
      ctx.arc(...stroke[0], 1.6, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(...stroke[0]);
    for (const point of stroke.slice(1)) ctx.lineTo(...point);
    ctx.stroke();
  }
}


function getPoint(event) {
  const bounds = pad.getBoundingClientRect();
  return [
    Math.round(Math.max(0, Math.min(719, (event.clientX - bounds.left) * 720 / bounds.width))),
    Math.round(Math.max(0, Math.min(319, (event.clientY - bounds.top) * 320 / bounds.height)))
  ];
}

pad.addEventListener('pointerdown', event => {
  if (activePointer !== null || strokes.length >= 120) return;
  activePointer = event.pointerId;
  currentStroke = [getPoint(event)];
  strokes.push(currentStroke);
  pad.setPointerCapture(event.pointerId);
  showDraft();
});
pad.addEventListener('pointermove', event => {
  if (event.pointerId !== activePointer || !currentStroke) return;
  if (strokes.reduce((count, stroke) => count + stroke.length, 0) >= 4000) return;
  const next = getPoint(event);
  const previous = currentStroke[currentStroke.length - 1];
  if (previous[0] !== next[0] || previous[1] !== next[1]) {
    currentStroke.push(next);
    showDraft();
  }
});
function finishStroke(event) {
  if (event.pointerId === activePointer) {
    activePointer = null;
    currentStroke = null;
  }
}
pad.addEventListener('pointerup', finishStroke);
pad.addEventListener('pointercancel', finishStroke);
document.querySelector('#undo').addEventListener('click', () => {
  if (activePointer !== null) return; 
  strokes.pop();
  showDraft();
});
document.querySelector('#clear').addEventListener('click', () => {
  if (activePointer !== null) return;
  strokes.length = 0;
  showDraft();
});
const sendButton = document.querySelector('#send');
sendButton.addEventListener('click', async () => {
  const author = authorInput.value.trim();
  if (!author || author.length > 32) {
    status.textContent = 'Enter a name (up to 32 characters).';
    authorInput.focus();
    return;
  }
  if (activePointer !== null) return;
  if (!strokes.some(stroke => stroke.length)) {
    status.textContent = 'Draw something before sending.';
    return;
  }
  sendButton.disabled = true;
  status.textContent = 'Sending your sketch…';
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, strokes })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to send.');
    status.textContent = 'Saved! The display updates at its next refresh.';
    await loadLatest();
  } catch (error) {
    status.textContent = error.message;
  } finally {
    sendButton.disabled = false;
  }
});
async function loadLatest() {
  try {
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) throw new Error('Latest sketch is unavailable.');
    const state = await response.json();
    latestPreview.src = state.ink_url;
    latestMeta.textContent = state.has_sketch
      ? `Drawn by ${state.sketch_author} · Last sent ${state.sketch_sent_at}`
      : 'Nothing has been sent yet.';
  } catch (error) {
    latestMeta.textContent = 'Latest drawing is unavailable right now.';
  }
}
document.querySelector('#copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.origin + '/');
    status.textContent = 'Drawing link copied.';
  } catch (error) {
    status.textContent = 'Could not copy the link; copy it from the address bar.';
  }
});
if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
  loadLatest();
}
showDraft();