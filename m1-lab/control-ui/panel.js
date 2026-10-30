const selector = document.querySelector('#target');
const refresh = document.querySelector('#refresh');
const health = document.querySelector('#health-status');
const version = document.querySelector('#version');
const profile = document.querySelector('#profile');
const frame = document.querySelector('#application-frame');
const openApp = document.querySelector('#open-app');
const state = document.querySelector('#app-state');
let targets = null;
let applicationSizeObserver = null;
function fitApplication() {
  const body = frame.contentDocument?.body;
  if (!body || frame.hidden) return;
  frame.style.height = `${Math.ceil(Math.max(body.scrollHeight, body.getBoundingClientRect().height)) + 4}px`;
}
frame.addEventListener('load', () => {
  applicationSizeObserver?.disconnect();
  if (frame.contentDocument?.body) {
    applicationSizeObserver = new ResizeObserver(fitApplication);
    applicationSizeObserver.observe(frame.contentDocument.body);
    fitApplication();
  }
});
window.addEventListener('resize', fitApplication);
function render() {
  const target = targets?.find(value => value.id === selector.value);
  version.textContent = target?.version ? `Next.js ${target.version}` : 'Not verified';
  profile.textContent = target?.profile || selector.value;
  const ready = target?.health === 'ready';
  const message = ready ? 'Ready. Normal application access can now be checked.' : target?.health === 'not-installed' ? 'Not installed. M4 owns this target; no experiment result is available.' : target?.error || 'Target health is unavailable. Check the containers, then retry.';
  health.textContent = message;
  openApp.hidden = !ready;
  frame.hidden = !ready;
  state.hidden = ready;
  state.textContent = message;
  if (ready && frame.getAttribute('src') !== target.appPath) frame.src = target.appPath;
  if (ready) openApp.href = target.appPath;
  if (!ready) frame.removeAttribute('src');
}
async function load() {
  refresh.disabled = true;
  refresh.textContent = 'Checking target...';
  health.textContent = 'Checking target health...';
  try {
    const response = await fetch('/api/targets', { cache: 'no-store', signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error('Target registry request failed. Check the operator login and retry.');
    targets = await response.json();
    render();
  } catch {
    targets = null;
    render();
  } finally {
    refresh.disabled = false;
    refresh.textContent = 'Check target health';
  }
}
selector.addEventListener('change', render);
refresh.addEventListener('click', load);
load();
