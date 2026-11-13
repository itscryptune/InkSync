const pad = document.querySelector('#pad');
const ctx = pad.getContext('2d');
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
document.querySelector('#send').addEventListener('click', () => {
  document.querySelector('#status').textContent = 'The Send API comes in a later step.';
});
showDraft();