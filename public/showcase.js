const display = document.querySelector('#display');
const displayWrap = document.querySelector('#display-wrap');
const displayHost = document.querySelector('#display-host');
const message = document.querySelector('#message');
const sketch = document.querySelector('#sketch');
const author = document.querySelector('#author');
const sent = document.querySelector('#sent');
const qr = document.querySelector('#qr');
const sizes = {
  full: [800, 480],
  'half-horizontal': [800, 240],
  'half-vertical': [400, 480],
  quadrant: [400, 240]
};
let layout = 'full';

function fitDisplay() {
  const [width, height] = sizes[layout];
  const scale = Math.min(1, displayWrap.clientWidth / width);
  displayHost.style.width = `${width * scale}px`;
  displayHost.style.height = `${height * scale}px`;
  display.style.transform = `scale(${scale})`;
}
async function refresh() {
  message.textContent = 'Refreshing the latest drawing…';
  try {
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load the latest drawing.');
    const state = await response.json();
    sketch.src = state.ink_url;
    qr.src = state.qr_url;
    author.textContent = state.sketch_author;
    sent.textContent = state.sketch_sent_at;
    message.textContent = state.has_sketch
      ? `Showing the latest sketch by ${state.sketch_author}. The preview approximates the TRMNL layout.`
      : 'Nothing sent yet. The preview approximates the TRMNL layout.';
  } catch (error) {
    message.textContent = error.message;
  }
}
for (const button of document.querySelectorAll('[data-layout]')) {
  button.addEventListener('click', () => {
    layout = button.dataset.layout;
    display.className = `display ${layout}`;
    for (const tab of document.querySelectorAll('[data-layout]')) {
      tab.classList.toggle('active', tab === button);
      tab.setAttribute('aria-pressed', String(tab === button));
    }
    fitDisplay();
  });
}
document.querySelector('#refresh').addEventListener('click', refresh);
window.addEventListener('resize', fitDisplay);
fitDisplay();
refresh();