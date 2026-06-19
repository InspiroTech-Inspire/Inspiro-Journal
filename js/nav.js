/* =========================================================
   MARK. — Trading Journal
   Shared UI: sidebar, ticker, modal, toast, data tools
   ========================================================= */

const ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>`,
  strategy:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 11l2 2 4-4"/><path d="M5 5h14v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V5z"/></svg>`,
  propfirm:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3z"/><path d="M9.5 12l2 2 3.5-4"/></svg>`,
  analytics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 19V10"/><path d="M11 19V5"/><path d="M18 19v-7"/><path d="M3 19h18"/></svg>`,
  digest:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4h16v2.5L12 13 4 6.5V4z"/><path d="M4 6.5V19h16V6.5"/></svg>`,
  plus:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  close:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  edit:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20h4l10-10-4-4L4 16v4z"/></svg>`,
  trash:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13"/></svg>`,
  download:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/></svg>`,
  upload:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20V9m0 0l-4 4m4-4l4 4M5 4h14"/></svg>`,
  link:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 15l6-6M10 7l1-1a3.5 3.5 0 015 5l-1 1M14 17l-1 1a3.5 3.5 0 01-5-5l1-1"/></svg>`,
  image:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-4 4-2-2-5 5"/></svg>`,
};

const NAV_ITEMS = [
  { key:'dashboard',  href:'index.html',      label:'Journal',    icon:ICONS.dashboard },
  { key:'strategies', href:'strategies.html', label:'Strategies', icon:ICONS.strategy },
  { key:'propfirms',  href:'propfirms.html',  label:'Prop Firms', icon:ICONS.propfirm },
  { key:'analytics',  href:'analytics.html',  label:'Analytics',  icon:ICONS.analytics },
  { key:'digest',     href:'digest.html',     label:'Digest',     icon:ICONS.digest },
];

/* ---------------- Real-time clock ---------------- */
let _clockInterval = null;

function startClock(){
  const el = document.getElementById('sidebar-clock');
  if(!el) return;

  function tick(){
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    el.querySelector('.clock-time').textContent = `${hh}:${mm}:${ss}`;
    el.querySelector('.clock-date').textContent =
      `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  tick();
  if(_clockInterval) clearInterval(_clockInterval);
  _clockInterval = setInterval(tick, 1000);
}

function renderSidebar(active){
  const root = document.getElementById('sidebar');
  if(!root) return;
  root.innerHTML = `
    <div class="brand">
      <div class="brand-mark">M</div>
      <div class="brand-text">MARK.<small>Trade Journal</small></div>
    </div>
    <nav class="nav">
      ${NAV_ITEMS.map(item => `
        <a class="nav-link ${item.key===active?'active':''}" href="${item.href}">
          ${item.icon}<span>${item.label}</span>
        </a>`).join('')}
    </nav>
    <div id="sidebar-clock" class="sidebar-clock">
      <div class="clock-time">00:00:00</div>
      <div class="clock-date">—</div>
    </div>
    <div class="sidebar-foot">
      <button class="foot-btn" id="btn-export">${ICONS.download}<span>Export backup (.json)</span></button>
      <button class="foot-btn" id="btn-import">${ICONS.upload}<span>Import backup</span></button>
      <button class="foot-btn" id="btn-reset">${ICONS.trash}<span>Reset all data</span></button>
      <input type="file" id="import-file-input" accept="application/json" class="hidden" />
    </div>
  `;
  document.getElementById('btn-export').addEventListener('click', exportAllData);
  document.getElementById('btn-import').addEventListener('click', () => document.getElementById('import-file-input').click());
  document.getElementById('import-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const ok = await confirmDialog('Import backup', 'Merge this backup with your current data, or replace everything currently stored?', ['Cancel','Merge','Replace']);
    if(ok === 'Merge' || ok === 'Replace'){
      try{
        await importAllData(file, ok === 'Replace' ? 'replace' : 'merge');
        toast('Backup imported.', 'ok');
        setTimeout(() => location.reload(), 600);
      }catch(err){
        toast('Could not read that file — is it a MARK. backup?', 'err');
      }
    }
    e.target.value = '';
  });
  document.getElementById('btn-reset').addEventListener('click', async () => {
    const ok = await confirmDialog('Reset all data', 'This permanently deletes every trade, strategy and prop firm account stored in this browser. Export a backup first if you want to keep a copy.', ['Cancel','Delete everything']);
    if(ok === 'Delete everything'){
      resetAllData();
      toast('All data cleared.', 'ok');
      setTimeout(() => location.reload(), 500);
    }
  });

  // Start the live clock
  startClock();
}

/* ---------------- Ticker tape ---------------- */
function renderTicker(mountId){
  const mount = document.getElementById(mountId);
  if(!mount) return;
  const trades = sortByDate(Trades.all()).slice(-16).reverse();
  if(!trades.length){
    mount.innerHTML = `<div class="ticker-empty">No trades logged yet — your recent results will scroll here once you add one.</div>`;
    return;
  }
  const items = trades.map(t => {
    const up = (t.pnl||0) >= 0;
    return `<div class="ticker-item">
      <span class="sym">${escapeHtml(t.symbol||'—')}</span>
      <span class="${up?'text-bull':'text-bear'}">${up?'▲':'▼'} ${moneySigned(t.pnl)}</span>
      ${t.grade ? `<span class="grade-stamp sm grade-${t.grade.toLowerCase()}">${t.grade}</span>` : ''}
    </div>`;
  }).join('');
  mount.innerHTML = `<div class="ticker-track">${items}${items}</div>`;
}

/* ---------------- Toasts ---------------- */
function toast(message, type){
  let wrap = document.getElementById('toast-wrap');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.id = 'toast-wrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' '+type : '');
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

/* ---------------- Modal ---------------- */
function openModal(innerHtml, opts){
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal-overlay';
  overlay.innerHTML = `<div class="modal ${opts&&opts.wide?'wide':''}">${innerHtml}</div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('mousedown', (e) => { if(e.target === overlay) closeModal(); });
  document.addEventListener('keydown', escCloseHandler);
  return overlay;
}
function escCloseHandler(e){ if(e.key === 'Escape') closeModal(); }
function closeModal(){
  const el = document.getElementById('active-modal-overlay');
  if(el) el.remove();
  document.removeEventListener('keydown', escCloseHandler);
}

function confirmDialog(title, message, buttons){
  buttons = buttons || ['Cancel','Confirm'];
  return new Promise(resolve => {
    const html = `
      <div class="modal-header"><h3>${escapeHtml(title)}</h3>
        <button class="modal-close" id="cd-x">${ICONS.close}</button></div>
      <div class="modal-body"><p class="text-muted">${escapeHtml(message)}</p></div>
      <div class="modal-footer">
        ${buttons.map((b,i) => `<button class="btn ${i===buttons.length-1?'btn-danger':'btn-ghost'}" data-b="${escapeHtml(b)}">${escapeHtml(b)}</button>`).join('')}
      </div>`;
    const overlay = openModal(html);
    overlay.querySelectorAll('[data-b]').forEach(btn => {
      btn.addEventListener('click', () => { const v = btn.getAttribute('data-b'); closeModal(); resolve(v); });
    });
    document.getElementById('cd-x').addEventListener('click', () => { closeModal(); resolve(null); });
  });
}
