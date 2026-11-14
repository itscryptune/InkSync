const pad = document.querySelector('#pad');
const ctx = pad.getContext('2d');
const authorInput = document.querySelector('#author');
const statusEl = document.querySelector('#status');
const latestMeta = document.querySelector('#latest-meta');
const latestPreview = document.querySelector('#preview');
const sizeInput = document.querySelector('#size');
const sizeValue = document.querySelector('#size-value');
const undoButton = document.querySelector('#undo');
const redoButton = document.querySelector('#redo');
const penButton = document.querySelector('#pen');
const eraserButton = document.querySelector('#eraser');
const sendButton = document.querySelector('#send');
const strokes = [];
const undoStack = [];
const redoStack = [];
let activePointer = null;
let currentStroke = null;
let tool = 'pen';

function showDraft() {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, pad.width, pad.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    if (!stroke.points.length) continue;
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#fff' : '#111';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = stroke.size;
    if (stroke.points.length === 1) {
      ctx.beginPath();
      ctx.arc(...stroke.points[0], stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(...stroke.points[0]);
    for (const point of stroke.points.slice(1)) ctx.lineTo(...point);
    ctx.stroke();
  }
  undoButton.disabled = activePointer !== null || undoStack.length === 0;
  redoButton.disabled = activePointer !== null || redoStack.length === 0;
}

function getPoint(event) {
  const bounds = pad.getBoundingClientRect();
  return [
    Math.round(Math.max(0, Math.min(719, (event.clientX - bounds.left) * 720 / bounds.width))),
    Math.round(Math.max(0, Math.min(319, (event.clientY - bounds.top) * 320 / bounds.height)))
  ];
}
function totalPoints() {
  return strokes.reduce((total, stroke) => total + stroke.points.length, 0);
}
function setTool(next) {
  if (activePointer !== null) return;
  tool = next;
  penButton.classList.toggle('selected', tool === 'pen');
  eraserButton.classList.toggle('selected', tool === 'eraser');
  penButton.setAttribute('aria-pressed', String(tool === 'pen'));
  eraserButton.setAttribute('aria-pressed', String(tool === 'eraser'));
}
penButton.addEventListener('click', () => setTool('pen'));
eraserButton.addEventListener('click', () => setTool('eraser'));
sizeInput.addEventListener('input', () => { sizeValue.textContent = `${sizeInput.value} px`; });

pad.addEventListener('pointerdown', event => {
  if (activePointer !== null || strokes.length >= 120 || totalPoints() >= 4000) {
    statusEl.textContent = 'Drawing limit reached. Undo or clear to make room.';
    return;
  }
  if (event.button !== 0 && event.pointerType === 'mouse') return;
  activePointer = event.pointerId;
  currentStroke = { tool, size: Number(sizeInput.value), points: [getPoint(event)] };
  redoStack.length = 0;
  undoStack.push({ kind: 'stroke', stroke: currentStroke });
  strokes.push(currentStroke);
  pad.setPointerCapture(event.pointerId);
  showDraft();
});
pad.addEventListener('pointermove', event => {
  if (event.pointerId !== activePointer || !currentStroke) return;
  if (totalPoints() >= 4000) return;
  const next = getPoint(event);
  const previous = currentStroke.points[currentStroke.points.length - 1];
  if (previous[0] !== next[0] || previous[1] !== next[1]) {
    currentStroke.points.push(next);
    showDraft();
  }
});
function finishStroke(event) {
  if (event.pointerId !== activePointer) return;
  activePointer = null;
  currentStroke = null;
  showDraft();
}
pad.addEventListener('pointerup', finishStroke);
pad.addEventListener('pointercancel', finishStroke);
undoButton.addEventListener('click', () => {
  if (activePointer !== null || !undoStack.length) return;
  const action = undoStack.pop();
  if (action.kind === 'clear') strokes.push(...action.strokes);
  else strokes.pop();
  redoStack.push(action);
  showDraft();
});
redoButton.addEventListener('click', () => {
  if (activePointer !== null || !redoStack.length) return;
  const action = redoStack.pop();
  if (action.kind === 'clear') strokes.length = 0;
  else strokes.push(action.stroke);
  undoStack.push(action);
  showDraft();
});
document.querySelector('#clear').addEventListener('click', () => {
  if (activePointer !== null || !strokes.length) return;
  undoStack.push({ kind: 'clear', strokes: strokes.splice(0) });
  redoStack.length = 0;
  showDraft();
});
sendButton.addEventListener('click', async () => {
  const author = authorInput.value.trim();
  if (!author || author.length > 32) {
    statusEl.textContent = 'Enter a name (up to 32 characters).';
    authorInput.focus();
    return;
  }
  if (activePointer !== null) return;
  if (!strokes.some(stroke => stroke.tool === 'pen')) {
    statusEl.textContent = 'Draw something before sending.';
    return;
  }
  sendButton.disabled = true;
  statusEl.textContent = 'Sending your sketch…';
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, strokes })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to send.');
    statusEl.textContent = 'Saved! The display updates at its next refresh.';
    await loadLatest();
  } catch (error) {
    statusEl.textContent = error.message;
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
    await navigator.clipboard.writeText(window.location.origin + '/draw');
    statusEl.textContent = 'Drawing link copied.';
  } catch (error) {
    statusEl.textContent = 'Could not copy the link; copy it from the address bar.';
  }
});
setTool('pen');
showDraft();
if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') loadLatest();
