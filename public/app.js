const pad = document.querySelector('#pad');
const ctx = pad.getContext('2d');
const strokes = [];
let drawing = false;

function showDraft() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, pad.width, pad.height);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    ctx.beginPath();
    ctx.moveTo(...stroke[0]);
    for (const point of stroke.slice(1)) ctx.lineTo(...point);
    ctx.stroke();
  }
}
function getPoint(event) {
  const bounds = pad.getBoundingClientRect();
  return [
    Math.round((event.clientX - bounds.left) * pad.width / bounds.width),
    Math.round((event.clientY - bounds.top) * pad.height / bounds.height)
  ];
}
pad.addEventListener('mousedown', event => {
  drawing = true;
  strokes.push([getPoint(event)]);
  showDraft();
});
pad.addEventListener('mousemove', event => {
  if (!drawing) return;
  strokes[strokes.length - 1].push(getPoint(event));
  showDraft();
});
window.addEventListener('mouseup', () => { drawing = false; });
document.querySelector('#undo').addEventListener('click', () => {
  strokes.pop();
  showDraft();
});
document.querySelector('#clear').addEventListener('click', () => {
  strokes.length = 0;
  showDraft();
});
document.querySelector('#send').addEventListener('click', () => {
  document.querySelector('#status').textContent = 'The Send API comes in a later step.';
});
showDraft();