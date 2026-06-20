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
  calendar:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  public:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  plus:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  close:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  edit:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20h4l10-10-4-4L4 16v4z"/></svg>`,
  trash:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13"/></svg>`,
  download:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/></svg>`,
  upload:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20V9m0 0l-4 4m4-4l4 4M5 4h14"/></svg>`,
  link:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 15l6-6M10 7l1-1a3.5 3.5 0 015 5l-1 1M14 17l-1 1a3.5 3.5 0 01-5-5l1-1"/></svg>`,
  image:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-4 4-2-2-5 5"/></svg>`,
  tag:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  memory:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
  share:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`,
  sun:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
};

const NAV_ITEMS = [
  { key:'dashboard',  href:'index.html',      label:'Journal',    icon:ICONS.dashboard },
  { key:'strategies', href:'strategies.html', label:'Strategies', icon:ICONS.strategy },
  { key:'propfirms',  href:'propfirms.html',  label:'Prop Firms', icon:ICONS.propfirm },
  { key:'analytics',  href:'analytics.html',  label:'Analytics',  icon:ICONS.analytics },
  { key:'calendar',   href:'calendar.html',   label:'Calendar',   icon:ICONS.calendar },
  { key:'digest',     href:'digest.html',     label:'Digest',     icon:ICONS.digest },
  { key:'public',     href:'public.html',     label:'Public View', icon:ICONS.public },
];

/* ---------------- Real-time clock ---------------- */
let _clockInterval = null;

function startClock(){
  const el = document.getElementById('sidebar-clock');
  if(!el) return;

  function tick(){
    renderMarketClock('sidebar-clock');
  }

  tick();
  if(_clockInterval) clearInterval(_clockInterval);
  _clockInterval = setInterval(tick, 1000);
}

function renderSidebar(active){
  const root = document.getElementById('sidebar');
  if(!root) return;
  const currentTheme = Settings.get().theme || 'dark';

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
      <div class="foot-row">
        <button class="foot-btn" id="btn-export" title="Export backup">${ICONS.download}<span>Export</span></button>
        <button class="foot-btn" id="btn-import" title="Import backup">${ICONS.upload}<span>Import</span></button>
        <button class="foot-btn theme-toggle" id="btn-theme-toggle" title="Toggle theme">
          ${currentTheme === 'dark' ? ICONS.sun : ICONS.moon}
        </button>
      </div>
      <button class="foot-btn" id="btn-reset">${ICONS.trash}<span>Reset all data</span></button>
      <input type="file" id="import-file-input" accept="application/json" class="hidden" />
    </div>
  `;

  document.getElementById('btn-theme-toggle').addEventListener('click', () => {
    const next = toggleTheme();
    document.getElementById('btn-theme-toggle').innerHTML = next === 'dark' ? ICONS.sun : ICONS.moon;
  });

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
