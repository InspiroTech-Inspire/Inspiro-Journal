/* =========================================================
   Inspiro® — Trading Journal
   Dashboard / Journal page logic
   + Tags, Discipline, Memory, Share Card, Correlation, Import
   ========================================================= */

let dashFilters = { strategyId:'', grade:'', outcome:'', tags:[] };

const DISCIPLINE_ICONS = {
  'I followed my plan exactly': '✅',
  'I did not revenge trade': '🛡️',
  'I managed risk properly': '📏',
  'I was emotionally neutral': '🧘',
  'I waited for my edge': '⏳',
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderSidebar('dashboard');
  renderTicker('ticker-mount');
  populateStrategyFilter();
  renderTagFilters();
  renderMemoryCard();
  renderDisciplineScoreCard();
  renderCorrelationHeatmap();
  refreshDashboard();

  document.getElementById('btn-add-trade').addEventListener('click', () => openTradeModal());
  document.getElementById('filter-strategy').addEventListener('change', e => { dashFilters.strategyId = e.target.value; refreshDashboard(); });
  document.getElementById('filter-grade').addEventListener('change', e => { dashFilters.grade = e.target.value; refreshDashboard(); });
  document.getElementById('filter-outcome').addEventListener('change', e => { dashFilters.outcome = e.target.value; refreshDashboard(); });
});

function populateStrategyFilter(){
  const sel = document.getElementById('filter-strategy');
  Strategies.all().forEach(s => {
    const o = document.createElement('option');
    o.value = s.id; o.textContent = s.name;
    sel.appendChild(o);
  });
}

function currentTrades(){
  return filterTrades(Trades.all(), {
    strategyId: dashFilters.strategyId || null,
    grade: dashFilters.grade || null,
    propFirmId: null,
    tags: dashFilters.tags.length ? dashFilters.tags : null,
  }).filter(t => !dashFilters.outcome || t.outcome === dashFilters.outcome);
}

function refreshDashboard(){
  const trades = currentTrades();
  renderStats(trades);
  renderTradeTable(trades);
  document.getElementById('log-count').textContent = trades.length + (trades.length===1?' trade':' trades');
}

/* ---------------- Tag filters ---------------- */
function renderTagFilters(){
  const mount = document.getElementById('tag-filter-mount');
  if(!mount) return;
  const allTags = getAllTags();
  if(!allTags.length){
    mount.innerHTML = '';
    return;
  }
  mount.innerHTML = `
    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; align-items:center;">
      <span class="text-faint" style="font-size:11px;">${ICONS.tag}</span>
      ${allTags.map(tag => `
        <button class="tag-pill ${dashFilters.tags.includes(tag)?'active':''}" data-tag="${escapeHtml(tag)}">
          ${escapeHtml(tag)}
        </button>
      `).join('')}
    </div>
  `;
  mount.querySelectorAll('.tag-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      if(dashFilters.tags.includes(tag)){
        dashFilters.tags = dashFilters.tags.filter(t => t !== tag);
      } else {
        dashFilters.tags.push(tag);
      }
      renderTagFilters();
      refreshDashboard();
    });
  });
}

/* ---------------- Memory / Trade Replay ---------------- */
function renderMemoryCard(){
  const mount = document.getElementById('memory-mount');
  if(!mount) return;
  const memories = getTradeMemory();
  if(!memories || !memories.length){
    mount.innerHTML = '';
    return;
  }
  const mem = memories[0]; // Show most relevant
  const t = mem.trade;
  const strategy = t.strategyId ? Strategies.get(t.strategyId) : null;
  const timeLabel = mem.yearsAgo 
    ? `${mem.yearsAgo} year${mem.yearsAgo>1?'s':''} ago today`
    : `${mem.daysAgo} days ago`;

  mount.innerHTML = `
    <div class="memory-card" style="margin-bottom:20px;">
      <div class="memory-header">
        <span class="memory-icon">${ICONS.memory}</span>
        <span>Memory · ${escapeHtml(timeLabel)}</span>
      </div>
      <div class="memory-trade">
        <span class="sym">${escapeHtml(t.symbol||'—')}</span>
        <span class="pill ${t.direction==='Long'?'pill-long':'pill-short'}">${t.direction||'—'}</span>
        <span class="mono ${t.pnl>=0?'text-bull':'text-bear'}">${moneySigned(t.pnl)}</span>
        <span class="text-faint">${strategy ? escapeHtml(strategy.name) : 'Discretionary'}</span>
        ${t.grade ? `<span class="grade-stamp sm grade-${t.grade.toLowerCase()}">${t.grade}</span>` : ''}
      </div>
      ${t.notes ? `<div class="memory-quote">"${escapeHtml(t.notes)}"</div>` : ''}
    </div>
  `;
}

/* ---------------- Discipline Score Card ---------------- */
function renderDisciplineScoreCard(){
  const mount = document.getElementById('discipline-mount');
  if(!mount) return;
  const trades = Trades.all();
  if(!trades.length){
    mount.innerHTML = '';
    return;
  }

  const items = Settings.get().disciplineItems || DEFAULT_SETTINGS.disciplineItems;
  const totalChecked = trades.reduce((sum, t) => sum + (t.disciplineCheckedIds||[]).length, 0);
  const totalPossible = trades.length * items.length;
  const overallPercent = totalPossible > 0 ? Math.round((totalChecked / totalPossible) * 100) : 0;

  mount.innerHTML = `
    <div class="card" style="margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div class="card-title">Discipline Score</div>
        <div class="stat-value" style="font-size:18px; ${overallPercent>=80?'color:var(--bull)':overallPercent>=50?'color:var(--gold)':'color:var(--bear)'}">${overallPercent}%</div>
      </div>
      <div class="card-sub" style="margin-bottom:12px;">Across ${trades.length} trade${trades.length===1?'':'s'} · ${totalChecked}/${totalPossible} checks</div>
    </div>
  `;
}

/* ---------------- Correlation Heatmap ---------------- */
function renderCorrelationHeatmap(){
  const mount = document.getElementById('correlation-mount');
  if(!mount) return;
  const heatmap = computeCorrelationHeatmap();
  if(!heatmap){
    mount.innerHTML = '';
    return;
  }

  const { symbols, matrix } = heatmap;
  const n = symbols.length;

  let html = `<div class="card" style="margin-bottom:20px;"><div class="card-title" style="margin-bottom:12px;">Correlation Heatmap</div>`;
  html += `<div class="heatmap-wrap" style="grid-template-columns:repeat(${n+1},1fr); max-width:${(n+1)*44}px;">`;

  // Header row
  html += `<div class="heatmap-cell header"></div>`;
  symbols.forEach(s => {
    html += `<div class="heatmap-cell header" title="${escapeHtml(s)}">${escapeHtml(s.slice(0,3))}</div>`;
  });

  // Data rows
  matrix.forEach((row, i) => {
    html += `<div class="heatmap-cell header" title="${escapeHtml(symbols[i])}">${escapeHtml(symbols[i].slice(0,3))}</div>`;
    row.forEach((cell, j) => {
      const val = cell.value;
      const intensity = Math.abs(val);
      const bg = cell.self ? 'var(--surface-2)' : 
        val > 0 ? `rgba(45,212,167,${intensity * 0.3})` : 
        val < 0 ? `rgba(240,89,74,${intensity * 0.3})` : 'transparent';
      const cls = cell.self ? 'self' : val > 0 ? 'pos' : val < 0 ? 'neg' : '';
      html += `
        <div class="heatmap-cell ${cls}" style="background:${bg};" title="${escapeHtml(symbols[i])} vs ${escapeHtml(symbols[j])}: ${val.toFixed(2)}">
          ${cell.self ? '—' : val.toFixed(1)}
        </div>
      `;
    });
  });

  html += `</div></div>`;
  mount.innerHTML = html;
}

/* ---------------- Stats ---------------- */
function computeStreak(trades){
  const sorted = sortByDate(trades).reverse();
  if(!sorted.length) return { n:0, type:null };
  const top = sorted[0].outcome;
  if(top === 'Breakeven') return { n:1, type:'Breakeven' };
  let n = 0;
  for(const t of sorted){
    if(t.outcome === top) n++;
    else break;
  }
  return { n, type: top };
}

function renderStats(trades){
  const pnl = netPnl(trades);
  const wr = winRate(trades);
  const pf = profitFactor(trades);
  const streak = computeStreak(trades);
  const pfText = pf === Infinity ? '∞' : pf.toFixed(2);
  const streakText = streak.n ? `${streak.n}${streak.type==='Win'?'W':streak.type==='Loss'?'L':'BE'}` : '—';
  const streakClass = streak.type==='Win' ? 'text-bull' : streak.type==='Loss' ? 'text-bear' : '';

  document.getElementById('stat-grid').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Net P&amp;L</div>
      <div class="stat-value ${pnl>=0?'text-bull':'text-bear'}">${moneySigned(pnl)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Win rate</div>
      <div class="stat-value">${pct(wr,0)}</div>
      <div class="stat-delta text-faint">${wins(trades).length}W / ${losses(trades).length}L / ${breakevens(trades).length}BE</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total trades</div>
      <div class="stat-value">${trades.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Profit factor</div>
      <div class="stat-value ${pf>=1.5?'text-bull':pf<1?'text-bear':''}">${pfText}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Current streak</div>
      <div class="stat-value ${streakClass}">${streakText}</div>
    </div>
  `;
}

/* ---------------- Table ---------------- */
function renderTradeTable(trades){
  const tbody = document.getElementById('trades-tbody');
  const sorted = sortByDate(trades).reverse();
  if(!sorted.length){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9"><div class="empty-state"><div class="e-icon">📓</div><span class="typing-text">No trades match these filters yet. Log your first trade to start building your edge.</span></div></td></tr>`;
    return;
  }
  tbody.innerHTML = sorted.map(t => {
    const strategy = t.strategyId ? Strategies.get(t.strategyId) : null;
    const gradeHtml = t.grade
      ? `<span class="grade-stamp sm grade-${t.grade.toLowerCase()}">${t.grade}</span>`
      : `<span class="grade-stamp sm grade-none">–</span>`;
    const outcomeClass = t.outcome==='Win'?'pill-win':t.outcome==='Loss'?'pill-loss':'pill-be';
    let proofHtml = '<span class="text-faint">—</span>';
    if(t.proofType === 'image' && t.proofImage){
      proofHtml = `<button class="btn btn-ghost btn-icon" data-action="view-proof" data-id="${t.id}" title="View screenshot">${ICONS.image}</button>`;
    } else if(t.proofType === 'link' && t.proofLink){
      proofHtml = `<a class="btn btn-ghost btn-icon" href="${escapeHtml(t.proofLink)}" target="_blank" rel="noopener" title="Open trade link" onclick="event.stopPropagation()">${ICONS.link}</a>`;
    }
    const tagsHtml = (t.tags||[]).map(tag => `<span class="tag-pill" style="margin-left:4px;">${escapeHtml(tag)}</span>`).join('');
    return `<tr data-id="${t.id}">
      <td class="mono">${fmtDate(t.date)}</td>
      <td><strong>${escapeHtml(t.symbol||'—')}</strong>${tagsHtml}</td>
      <td><span class="pill ${t.direction==='Long'?'pill-long':'pill-short'}">${t.direction||'—'}</span></td>
      <td>${strategy ? escapeHtml(strategy.name) : '<span class="text-faint">Discretionary</span>'}</td>
      <td>${gradeHtml}</td>
      <td><span class="pill ${outcomeClass}">${t.outcome}</span></td>
      <td class="mono ${t.pnl>=0?'text-bull':'text-bear'}">${moneySigned(t.pnl)}</td>
      <td>${proofHtml}</td>
      <td>
        <button class="btn btn-ghost btn-icon" data-action="share-trade" data-id="${t.id}" title="Share">${ICONS.share}</button>
        <button class="btn btn-ghost btn-icon" data-action="delete-trade" data-id="${t.id}" title="Delete">${ICONS.trash}</button>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('tr[data-id]').forEach(row => {
    row.addEventListener('click', (e) => {
      if(e.target.closest('[data-action]')) return;
      openTradeModal(row.getAttribute('data-id'));
    });
  });
  tbody.querySelectorAll('[data-action="delete-trade"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const ok = await confirmDialog('Delete trade', 'This trade will be permanently removed from your journal.', ['Cancel','Delete']);
      if(ok === 'Delete'){ Trades.remove(id); toast('Trade deleted.','ok'); refreshDashboard(); renderTicker('ticker-mount'); renderMemoryCard(); renderDisciplineScoreCard(); renderCorrelationHeatmap(); }
    });
  });
  tbody.querySelectorAll('[data-action="view-proof"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const t = Trades.get(btn.getAttribute('data-id'));
      openModal(`<div class="modal-header"><h3>${escapeHtml(t.symbol)} — screenshot</h3><button class="modal-close" id="vp-x">${ICONS.close}</button></div>
        <div class="modal-body"><img class="proof-preview" src="${t.proofImage}" alt="Trade proof"/></div>`);
      document.getElementById('vp-x').addEventListener('click', closeModal);
    });
  });
  tbody.querySelectorAll('[data-action="share-trade"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const t = Trades.get(btn.getAttribute('data-id'));
      const cardHtml = await generateShareCard(t);
      openModal(`
        <div class="modal-header"><h3>Share Trade</h3><button class="modal-close" id="sc-x">${ICONS.close}</button></div>
        <div class="modal-body">${cardHtml}</div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="sc-copy">Copy as text</button>
          <button class="btn btn-bull" id="sc-download">Download image</button>
        </div>
      `, { wide:true });
      document.getElementById('sc-x').addEventListener('click', closeModal);
      document.getElementById('sc-copy').addEventListener('click', () => {
        const text = `${t.symbol} ${t.direction} — ${t.pnl>=0?'+':''}${t.pnl} · ${t.grade?t.grade+' setup':'No grade'} · ${fmtDate(t.date)}`;
        navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard!', 'ok'));
      });
      document.getElementById('sc-download').addEventListener('click', async () => {
        toast('Generating image...', 'ok');
        // Use html2canvas if available, otherwise fallback
        if(window.html2canvas){
          const el = document.getElementById(`share-card-${t.id}`);
          const canvas = await html2canvas(el, { backgroundColor: null, scale: 2 });
          const link = document.createElement('a');
          link.download = `inspiro-${t.symbol}-${t.date}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        } else {
          toast('Image generation library not loaded. Copy text instead.', 'err');
        }
      });
    });
  });
}

/* ---------------- Add / Edit trade modal ---------------- */
function openTradeModal(tradeId){
  const editing = !!tradeId;
  const trade = editing ? Trades.get(tradeId) : null;
  const strategies = Strategies.all();
  const accounts = PropFirms.all();
  let pendingProofImage = trade && trade.proofType==='image' ? trade.proofImage : null;
  let pendingTags = trade ? (trade.tags||[]) : [];

  const html = `
    <div class="modal-header">
      <h3>${editing ? 'Edit trade' : 'Add trade'}</h3>
      <button class="modal-close" id="tm-x">${ICONS.close}</button>
    </div>
    <div class="modal-body">
      <div class="field-row">
        <div class="field"><label>Date</label><input type="date" id="f-date" value="${trade ? trade.date : todayISO()}"></div>
        <div class="field"><label>Time <span class="hint">(optional)</span></label><input type="time" id="f-time" value="${trade && trade.time ? trade.time : ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Symbol / instrument</label><input type="text" id="f-symbol" class="mono" placeholder="EURUSD, AAPL, BTCUSD…" value="${trade ? escapeHtml(trade.symbol) : ''}"></div>
        <div class="field"><label>Direction</label>
          <div class="seg" id="seg-direction" data-value="${trade ? trade.direction : 'Long'}">
            <button type="button" data-v="Long" class="${(!trade || trade.direction==='Long')?'active long':''}">Long</button>
            <button type="button" data-v="Short" class="${(trade && trade.direction==='Short')?'active short':''}">Short</button>
          </div>
        </div>
      </div>

      <div class="field-row cols-3">
        <div class="field"><label>Entry price</label><input type="number" step="any" id="f-entry" class="mono" value="${trade && trade.entryPrice!=null ? trade.entryPrice : ''}"></div>
        <div class="field"><label>Stop loss</label><input type="number" step="any" id="f-stop" class="mono" value="${trade && trade.stopLoss!=null ? trade.stopLoss : ''}"></div>
        <div class="field"><label>Take profit</label><input type="number" step="any" id="f-take" class="mono" value="${trade && trade.takeProfit!=null ? trade.takeProfit : ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Position size <span class="hint">(lots / shares / contracts)</span></label><input type="number" step="any" id="f-size" class="mono" value="${trade && trade.positionSize!=null ? trade.positionSize : ''}"></div>
        <div class="field"><label>Risk amount ($) <span class="hint">for R-multiple calc</span></label><input type="number" step="any" id="f-risk" class="mono" value="${trade && trade.riskAmount!=null ? trade.riskAmount : ''}"></div>
      </div>

      <div class="field-row">
        <div class="field">
          <label>Strategy</label>
          <select id="f-strategy">
            <option value="">No strategy (discretionary)</option>
            ${strategies.map(s => `<option value="${s.id}" ${trade && trade.strategyId===s.id ? 'selected':''}>${escapeHtml(s.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Prop firm account <span class="hint">(optional)</span></label>
          <select id="f-account">
            <option value="">Personal account</option>
            ${accounts.map(a => `<option value="${a.id}" ${trade && trade.propFirmId===a.id ? 'selected':''}>${escapeHtml(a.firmName)} — ${escapeHtml(a.accountLabel)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="field hidden" id="phase-field-wrap">
        <label>Phase</label>
        <select id="f-phase"></select>
        <div class="hint">Trades are scored against this phase's target. Skipping ahead is fine if you're backfilling history.</div>
      </div>

      <div id="rule-checklist-wrap" class="hidden"></div>

      <div class="field-row">
        <div class="field"><label>Outcome</label>
          <div class="seg" id="seg-outcome" data-value="${trade ? trade.outcome : 'Win'}">
            <button type="button" data-v="Win" class="${(!trade || trade.outcome==='Win')?'active long':''}">Win</button>
            <button type="button" data-v="Loss" class="${(trade && trade.outcome==='Loss')?'active short':''}">Loss</button>
            <button type="button" data-v="Breakeven" class="${(trade && trade.outcome==='Breakeven')?'active':''}">B/E</button>
          </div>
        </div>
        <div class="field"><label>P&amp;L amount ($)</label><input type="number" step="any" id="f-pnl" class="mono" value="${trade && trade.pnl!=null ? trade.pnl : ''}"></div>
      </div>

      <!-- Discipline checklist -->
      <div class="field" id="discipline-wrap" style="${trade && trade.strategyId ? '' : 'display:none;'}">
        <label>Discipline checklist</label>
        <div class="hint" style="margin-bottom:8px;">How well did you execute? This is separate from setup grade.</div>
        <div id="discipline-checklist"></div>
      </div>

      <!-- Tags -->
      <div class="field">
        <label>Tags</label>
        <div class="hint" style="margin-bottom:8px;">Add tags like #FOMO, #revenge, #perfect, #news — press Enter to add</div>
        <div class="tag-input-wrap" id="tag-input-wrap">
          ${pendingTags.map(tag => `<span class="tag-pill">${escapeHtml(tag)} <span class="tag-remove" data-tag="${escapeHtml(tag)}">×</span></span>`).join('')}
          <input type="text" id="tag-input" placeholder="Add tag...">
        </div>
      </div>

      <!-- TradingView Alert Import -->
      <div class="field">
        <label>Import from TradingView alert <span class="hint">(paste alert message)</span></label>
        <textarea id="f-tv-alert" placeholder='{"ticker": "{{ticker}}", "action": "{{strategy.order.action}}", "price": {{close}}, "sl": ..., "tp": ...}'></textarea>
        <button class="btn btn-ghost btn-sm" id="btn-parse-tv" type="button">Parse alert</button>
      </div>

      <div class="field">
        <label>Trade proof</label>
        <div class="proof-toggle seg" id="seg-proof" data-value="${trade ? trade.proofType : 'none'}" style="display:inline-flex;">
          <button type="button" data-v="image" class="${trade && trade.proofType==='image'?'active':''}">Screenshot</button>
          <button type="button" data-v="link" class="${trade && trade.proofType==='link'?'active':''}">Link</button>
          <button type="button" data-v="none" class="${(!trade || trade.proofType==='none')?'active':''}">None</button>
        </div>
        <div id="proof-image-field" class="${trade && trade.proofType==='image' ? '' : 'hidden'}" style="margin-top:8px;">
          <input type="file" id="f-proof-file" accept="image/*">
          <img id="proof-preview-img" class="proof-preview ${pendingProofImage ? '' : 'hidden'}" src="${pendingProofImage||''}">
        </div>
        <div id="proof-link-field" class="${trade && trade.proofType==='link' ? '' : 'hidden'}" style="margin-top:8px;">
          <input type="url" id="f-proof-link" placeholder="https://tradingview.com/..." value="${trade && trade.proofLink ? escapeHtml(trade.proofLink) : ''}">
        </div>
      </div>

      <div class="field"><label>Notes</label><textarea id="f-notes" placeholder="What did you see? How did you feel? What would you do differently?">${trade && trade.notes ? escapeHtml(trade.notes) : ''}</textarea></div>
    </div>
    <div class="modal-footer">
      ${editing ? `<button class="btn btn-danger" id="tm-delete" style="margin-right:auto;">Delete</button>` : ''}
      <button class="btn btn-ghost" id="tm-cancel">Cancel</button>
      <button class="btn btn-bull" id="tm-save">${editing ? 'Save changes' : 'Save trade'}</button>
    </div>
  `;

  const overlay = openModal(html, { wide:true });

  // Phase selector
  function populatePhaseSelect(accountId, preferredPhaseId){
    const wrap = overlay.querySelector('#phase-field-wrap');
    const sel = overlay.querySelector('#f-phase');
    const account = accountId ? PropFirms.get(accountId) : null;
    if(!account || !account.phases || !account.phases.length){
      wrap.classList.add('hidden');
      sel.innerHTML = '';
      return;
    }
    wrap.classList.remove('hidden');
    const fallback = preferredPhaseId && account.phases.some(p => p.id === preferredPhaseId) ? preferredPhaseId : account.currentPhaseId;
    sel.innerHTML = account.phases.map(p => `<option value="${p.id}" ${p.id===fallback?'selected':''}>${escapeHtml(p.name)}${p.id===account.currentPhaseId?' (current)':''}</option>`).join('');
  }
  populatePhaseSelect(trade ? trade.propFirmId : '', trade ? trade.phaseId : null);
  overlay.querySelector('#f-account').addEventListener('change', (e) => populatePhaseSelect(e.target.value, null));

  // Segmented controls
  overlay.querySelectorAll('.seg').forEach(seg => {
    seg.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        seg.dataset.value = btn.getAttribute('data-v');
        seg.querySelectorAll('button').forEach(b => b.classList.remove('active','long','short'));
        const v = btn.getAttribute('data-v');
        btn.classList.add('active');
        if(v==='Long'||v==='Win') btn.classList.add('long');
        if(v==='Short'||v==='Loss') btn.classList.add('short');
        if(seg.id === 'seg-proof'){
          overlay.querySelector('#proof-image-field').classList.toggle('hidden', v!=='image');
          overlay.querySelector('#proof-link-field').classList.toggle('hidden', v!=='link');
        }
      });
    });
  });

  // Strategy -> rule checklist + discipline
  const checklistWrap = overlay.querySelector('#rule-checklist-wrap');
  const disciplineWrap = overlay.querySelector('#discipline-wrap');
  const disciplineList = overlay.querySelector('#discipline-checklist');

  function renderDiscipline(strategyId){
    const items = Settings.get().disciplineItems || DEFAULT_SETTINGS.disciplineItems;
    const checkedIds = trade && trade.disciplineCheckedIds ? trade.disciplineCheckedIds : [];
    if(!strategyId){
      disciplineWrap.style.display = 'none';
      return;
    }
    disciplineWrap.style.display = '';
    disciplineList.innerHTML = items.map(item => `
      <label class="discipline-item ${checkedIds.includes(item.id)?'checked':''}" data-disc-id="${item.id}">
        <input type="checkbox" ${checkedIds.includes(item.id)?'checked':''}>
        <span class="discipline-label">${DISCIPLINE_ICONS[item.text]||'•'} ${escapeHtml(item.text)}</span>
      </label>
    `).join('');
    disciplineList.querySelectorAll('input').forEach(cb => {
      cb.addEventListener('change', () => {
        cb.closest('.discipline-item').classList.toggle('checked', cb.checked);
      });
    });
  }

  function renderChecklist(strategyId, checkedIds){
    const strategy = strategyId ? Strategies.get(strategyId) : null;
    if(!strategy || !strategy.rules || !strategy.rules.length){
      checklistWrap.innerHTML = '';
      checklistWrap.classList.add('hidden');
      renderDiscipline(strategyId);
      return;
    }
    checklistWrap.classList.remove('hidden');
    checklistWrap.innerHTML = `
      <div class="field">
        <label>Setup checklist — ${escapeHtml(strategy.name)}</label>
        <div class="rule-list">
          ${strategy.rules.map(r => `
            <label class="rule-item ${checkedIds.includes(r.id)?'checked':''}" data-rule-id="${r.id}">
              <input type="checkbox" ${checkedIds.includes(r.id)?'checked':''}>
              <span>${escapeHtml(r.text)}</span>
            </label>`).join('')}
        </div>
        <div class="score-bar-wrap">
          <div class="score-bar"><div class="score-bar-fill" id="score-fill"></div></div>
          <div class="score-readout" id="score-readout">0%</div>
          <div class="grade-stamp sm grade-none" id="live-grade-stamp">–</div>
        </div>
      </div>`;
    const update = () => {
      const checked = checklistWrap.querySelectorAll('input[type=checkbox]:checked').length;
      const total = strategy.rules.length;
      const { score, grade } = computeGrade(checked, total);
      const fill = checklistWrap.querySelector('#score-fill');
      const readout = checklistWrap.querySelector('#score-readout');
      const stamp = checklistWrap.querySelector('#live-grade-stamp');
      const color = grade==='A'?'var(--grade-a)':grade==='B'?'var(--grade-b)':grade==='C'?'var(--grade-c)':'var(--grade-d)';
      fill.style.width = score+'%';
      fill.style.background = color;
      readout.textContent = score+'%';
      stamp.textContent = grade || '–';
      stamp.className = 'grade-stamp sm ' + (grade ? 'grade-'+grade.toLowerCase() : 'grade-none');
    };
    checklistWrap.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        cb.closest('.rule-item').classList.toggle('checked', cb.checked);
        update();
      });
    });
    update();
    renderDiscipline(strategyId);
  }
  renderChecklist(trade ? trade.strategyId : '', trade ? (trade.checkedRuleIds||[]) : []);
  overlay.querySelector('#f-strategy').addEventListener('change', (e) => renderChecklist(e.target.value, []));

  // Tag input
  const tagWrap = overlay.querySelector('#tag-input-wrap');
  const tagInput = overlay.querySelector('#tag-input');
  function renderTagPills(){
    const pills = tagWrap.querySelectorAll('.tag-pill');
    pills.forEach(p => p.remove());
    pendingTags.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'tag-pill';
      span.innerHTML = `${escapeHtml(tag)} <span class="tag-remove" data-tag="${escapeHtml(tag)}">×</span>`;
      tagWrap.insertBefore(span, tagInput);
    });
    tagWrap.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        pendingTags = pendingTags.filter(t => t !== btn.getAttribute('data-tag'));
        renderTagPills();
      });
    });
  }
  renderTagPills();
  tagInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      e.preventDefault();
      const val = tagInput.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if(val && !pendingTags.includes(val)){
        pendingTags.push(val);
        tagInput.value = '';
        renderTagPills();
      }
    }
  });

  // TradingView alert parser
  overlay.querySelector('#btn-parse-tv').addEventListener('click', () => {
    const text = overlay.querySelector('#f-tv-alert').value.trim();
    if(!text){ toast('Paste a TradingView alert message first.', 'err'); return; }
    const parsed = parseTradingViewAlert(text);
    if(!parsed){ toast('Could not parse that alert. Try JSON format: {"ticker":"...","action":"..."}', 'err'); return; }
    if(parsed.symbol) overlay.querySelector('#f-symbol').value = parsed.symbol;
    if(parsed.direction){
      const seg = overlay.querySelector('#seg-direction');
      seg.dataset.value = parsed.direction;
      seg.querySelectorAll('button').forEach(b => {
        b.classList.remove('active','long','short');
        if(b.getAttribute('data-v') === parsed.direction){
          b.classList.add('active', parsed.direction==='Long'?'long':'short');
        }
      });
    }
    if(parsed.entryPrice) overlay.querySelector('#f-entry').value = parsed.entryPrice;
    if(parsed.stopLoss) overlay.querySelector('#f-stop').value = parsed.stopLoss;
    if(parsed.takeProfit) overlay.querySelector('#f-take').value = parsed.takeProfit;
    toast('Alert parsed! Review the fields before saving.', 'ok');
  });

  // Proof image upload
  overlay.querySelector('#f-proof-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    try{
      const dataUrl = await resizeImageFile(file);
      pendingProofImage = dataUrl;
      const img = overlay.querySelector('#proof-preview-img');
      img.src = dataUrl; img.classList.remove('hidden');
    }catch(err){
      toast('Could not read that image.', 'err');
    }
  });

  overlay.querySelector('#tm-x').addEventListener('click', closeModal);
  overlay.querySelector('#tm-cancel').addEventListener('click', closeModal);
  if(editing){
    overlay.querySelector('#tm-delete').addEventListener('click', async () => {
      const ok = await confirmDialog('Delete trade', 'This trade will be permanently removed from your journal.', ['Cancel','Delete']);
      if(ok==='Delete'){ Trades.remove(tradeId); closeModal(); toast('Trade deleted.','ok'); refreshDashboard(); renderTicker('ticker-mount'); renderMemoryCard(); renderDisciplineScoreCard(); renderCorrelationHeatmap(); }
    });
  }

  overlay.querySelector('#tm-save').addEventListener('click', () => {
    const date = overlay.querySelector('#f-date').value;
    const symbol = overlay.querySelector('#f-symbol').value.trim();
    const outcome = overlay.querySelector('#seg-outcome').dataset.value;
    const pnlRaw = overlay.querySelector('#f-pnl').value;

    if(!date){ toast('Pick a date for this trade.', 'err'); return; }
    if(!symbol){ toast('Enter a symbol or instrument.', 'err'); return; }
    if(pnlRaw === ''){ toast('Enter the P&L amount for this trade.', 'err'); return; }

    const strategyId = overlay.querySelector('#f-strategy').value || null;
    const strategy = strategyId ? Strategies.get(strategyId) : null;
    const checkedRuleIds = strategy
      ? Array.from(checklistWrap.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.closest('.rule-item').getAttribute('data-rule-id'))
      : [];
    const { score, grade } = strategy && strategy.rules.length
      ? computeGrade(checkedRuleIds.length, strategy.rules.length)
      : { score:0, grade:null };

    const disciplineCheckedIds = strategy
      ? Array.from(disciplineList.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.closest('.discipline-item').getAttribute('data-disc-id'))
      : [];

    const proofType = overlay.querySelector('#seg-proof').dataset.value;
    const proofLink = overlay.querySelector('#f-proof-link').value.trim();
    const propFirmId = overlay.querySelector('#f-account').value || null;
    const phaseId = propFirmId ? (overlay.querySelector('#f-phase').value || null) : null;

    const numOrNull = (v) => v === '' || v === null || v === undefined ? null : Number(v);

    const newTrade = {
      id: editing ? tradeId : uid('trade'),
      date,
      time: overlay.querySelector('#f-time').value || null,
      symbol,
      direction: overlay.querySelector('#seg-direction').dataset.value,
      entryPrice: numOrNull(overlay.querySelector('#f-entry').value),
      stopLoss: numOrNull(overlay.querySelector('#f-stop').value),
      takeProfit: numOrNull(overlay.querySelector('#f-take').value),
      positionSize: numOrNull(overlay.querySelector('#f-size').value),
      riskAmount: numOrNull(overlay.querySelector('#f-risk').value),
      strategyId,
      checkedRuleIds,
      score, grade,
      disciplineCheckedIds,
      outcome,
      pnl: Number(pnlRaw),
      propFirmId,
      phaseId,
      tags: pendingTags,
      proofType,
      proofImage: proofType === 'image' ? (pendingProofImage || null) : null,
      proofLink: proofType === 'link' ? proofLink : null,
      notes: overlay.querySelector('#f-notes').value.trim(),
      createdAt: editing && trade.createdAt ? trade.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    Trades.upsert(newTrade);

    if(propFirmId){
      const advancement = checkPhaseAdvancement(propFirmId);
      if(advancement){
        toast(`Target hit! Moved from ${advancement.fromPhase} to ${advancement.toPhase}.`, 'ok');
      }
    }

    closeModal();
    toast(editing ? 'Trade updated.' : 'Trade saved.', 'ok');
    refreshDashboard();
    renderTicker('ticker-mount');
    renderTagFilters();
    renderMemoryCard();
    renderDisciplineScoreCard();
    renderCorrelationHeatmap();
  });
}
