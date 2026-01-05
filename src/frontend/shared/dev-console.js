/**
 * Dev Console
 * 
 * Lightweight in-app server log viewer.
 * Shows server-side console logs in the UI.
 * 
 * Logs are ALWAYS captured on the server, even if this panel is closed.
 */

const STORAGE_KEY_OPEN = 'aida_devConsoleOpen';

// Create DOM element helper
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = String(v);
    else if (k === 'style') node.setAttribute('style', String(v));
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, String(v));
  });
  children.forEach(c => node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return node;
}

function formatTs(ts) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return '??:??:??';
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function ensureStyles() {
  if (document.getElementById('devc-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'devc-styles';
  style.textContent = `
    .devc-toggle {
      position: fixed;
      right: 14px;
      bottom: 14px;
      z-index: 99999;
      background: rgba(15, 15, 26, 0.95);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-main, system-ui);
      transition: all 0.2s;
    }
    .devc-toggle:hover {
      background: rgba(26, 26, 46, 0.95);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .devc-toggle-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22C55E;
      animation: devc-pulse 2s infinite;
    }
    .devc-toggle-dot.error {
      background: #EF4444;
    }
    @keyframes devc-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .devc-panel {
      position: fixed;
      right: 14px;
      bottom: 56px;
      width: min(800px, calc(100vw - 28px));
      height: min(60vh, 600px);
      z-index: 99999;
      display: none;
      background: rgba(10, 10, 20, 0.98);
      color: #d9ffd9;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .devc-panel.open {
      display: flex;
      flex-direction: column;
    }
    .devc-header {
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.04);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 12px;
      flex-shrink: 0;
    }
    .devc-header-left {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .devc-pill {
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.10);
      color: #fff;
      font-size: 11px;
    }
    .devc-pill.success {
      background: rgba(34, 197, 94, 0.2);
      border-color: rgba(34, 197, 94, 0.3);
      color: #22C55E;
    }
    .devc-pill.error {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.3);
      color: #EF4444;
    }
    .devc-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .devc-btn {
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      color: #fff;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s;
    }
    .devc-btn:hover {
      background: rgba(255,255,255,0.12);
      border-color: rgba(255,255,255,0.2);
    }
    .devc-body {
      flex: 1;
      overflow: auto;
      padding: 12px 16px;
      font-size: 11px;
      line-height: 1.5;
    }
    .devc-line {
      margin-bottom: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.02);
    }
    .devc-line:hover {
      background: rgba(255,255,255,0.05);
    }
    .devc-line .ts {
      color: rgba(255,255,255,0.4);
      margin-right: 10px;
    }
    .devc-line .lvl {
      display: inline-block;
      min-width: 50px;
      margin-right: 10px;
      font-weight: 600;
    }
    .devc-line .lvl.log { color: #a0a0b0; }
    .devc-line .lvl.info { color: #60A5FA; }
    .devc-line .lvl.warn { color: #FBBF24; }
    .devc-line .lvl.error { color: #EF4444; }
    .devc-line .lvl.debug { color: #A855F7; }
    .devc-line.lvl-error {
      background: rgba(239, 68, 68, 0.1);
    }
    .devc-line.lvl-warn {
      background: rgba(251, 191, 36, 0.1);
    }
    .devc-empty {
      color: rgba(255,255,255,0.4);
      text-align: center;
      padding: 40px;
    }
  `;
  document.head.appendChild(style);
}

function createUI() {
  const toggle = el('button', { class: 'devc-toggle', type: 'button' }, [
    el('span', { class: 'devc-toggle-dot' }),
    'Logs'
  ]);
  
  const panel = el('div', { class: 'devc-panel' });
  
  const headerLeft = el('div', { class: 'devc-header-left' }, [
    el('span', { class: 'devc-pill', id: 'devc-host' }, ['server: …']),
    el('span', { class: 'devc-pill', id: 'devc-status' }, ['connecting…']),
    el('span', { class: 'devc-pill', id: 'devc-count' }, ['0 logs'])
  ]);
  
  const actions = el('div', { class: 'devc-actions' }, [
    el('button', { class: 'devc-btn', type: 'button', id: 'devc-clear' }, ['🗑️ Clear']),
    el('button', { class: 'devc-btn', type: 'button', id: 'devc-close' }, ['✕ Close'])
  ]);
  
  const header = el('div', { class: 'devc-header' }, [headerLeft, actions]);
  const body = el('div', { class: 'devc-body', id: 'devc-body' }, [
    el('div', { class: 'devc-empty' }, ['Waiting for logs…'])
  ]);
  
  panel.appendChild(header);
  panel.appendChild(body);
  
  document.body.appendChild(toggle);
  document.body.appendChild(panel);
  
  return { toggle, panel, body };
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  return { res, data };
}

export function initDevConsole() {
  ensureStyles();
  const ui = createUI();
  
  const hostEl = document.getElementById('devc-host');
  const statusEl = document.getElementById('devc-status');
  const countEl = document.getElementById('devc-count');
  const clearBtn = document.getElementById('devc-clear');
  const closeBtn = document.getElementById('devc-close');
  const toggleDot = ui.toggle.querySelector('.devc-toggle-dot');
  
  let open = localStorage.getItem(STORAGE_KEY_OPEN) === '1';
  let cursor = 0;
  let polling = false;
  let totalLogs = 0;
  let hasErrors = false;
  
  function setOpen(next) {
    open = !!next;
    ui.panel.classList.toggle('open', open);
    localStorage.setItem(STORAGE_KEY_OPEN, open ? '1' : '0');
  }
  
  ui.toggle.addEventListener('click', () => setOpen(!open));
  closeBtn.addEventListener('click', () => setOpen(false));
  
  clearBtn.addEventListener('click', async () => {
    try {
      await fetchJson('/api/dev/logs/clear', { method: 'POST' });
      ui.body.innerHTML = '<div class="devc-empty">Logs cleared</div>';
      cursor = 0;
      totalLogs = 0;
      hasErrors = false;
      countEl.textContent = '0 logs';
      toggleDot.classList.remove('error');
    } catch {}
  });
  
  setOpen(open);
  
  // Identify server
  fetchJson('/api/health')
    .then(({ data }) => {
      if (data && data.hostname) {
        hostEl.textContent = `server: ${data.hostname}`;
      }
      statusEl.textContent = 'connected';
      statusEl.classList.add('success');
    })
    .catch(() => {
      statusEl.textContent = 'disconnected';
      statusEl.classList.add('error');
    });
  
  function appendEntries(entries) {
    if (entries.length === 0) return;
    
    // Remove empty message if present
    const empty = ui.body.querySelector('.devc-empty');
    if (empty) empty.remove();
    
    for (const e of entries) {
      const isError = e.level === 'error' || e.level === 'uncaughtException' || e.level === 'unhandledRejection';
      const isWarn = e.level === 'warn';
      
      if (isError) hasErrors = true;
      
      const cls = isError ? 'devc-line lvl-error' : isWarn ? 'devc-line lvl-warn' : 'devc-line';
      
      const line = document.createElement('div');
      line.className = cls;
      line.innerHTML = `<span class="ts">${formatTs(e.ts)}</span><span class="lvl ${e.level}">${String(e.level).toUpperCase()}</span>${escapeHtml(e.message)}`;
      ui.body.appendChild(line);
      totalLogs++;
    }
    
    ui.body.scrollTop = ui.body.scrollHeight;
    countEl.textContent = `${totalLogs} logs`;
    toggleDot.classList.toggle('error', hasErrors);
  }
  
  async function poll() {
    if (polling) return;
    polling = true;
    
    try {
      const { data } = await fetchJson(`/api/dev/logs?cursor=${cursor}&limit=300`);
      
      if (data && data.ok && Array.isArray(data.entries)) {
        if (data.entries.length) {
          appendEntries(data.entries);
        }
        if (typeof data.cursor === 'number') {
          cursor = data.cursor;
        }
      }
    } catch {
      // Ignore polling errors
    } finally {
      polling = false;
      // Poll faster when open
      setTimeout(poll, open ? 1000 : 3000);
    }
  }
  
  poll();
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDevConsole);
} else {
  initDevConsole();
}

