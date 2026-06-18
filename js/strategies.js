/* =========================================================
   MARK. — Trading Journal
   Strategies page logic
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  renderSidebar('strategies');
  loadThresholds();
  loadCurrency();
  renderStrategyGrid();

  document.getElementById('btn-add-strategy').addEventListener('click', () => openStrategyModal());
  document.getElementById('btn-save-thresholds').addEventListener('click', saveThresholds);
  document.getElementById('btn-save-currency').addEventListener('click', saveCurrency);
});

function loadCurrency(){
  document.getElementById('base-currency').value = Settings.get().baseCurrency || 'USD';
}
function saveCurrency(){
  const v = document.getElementById('base-currency').value.trim().toUpperCase();
  if(!v){ toast('Enter a currency code, e.g. USD.', 'err'); return; }
  const s = Settings.get();
  s.baseCurrency = v;
  Settings.save(s);
  toast('Base currency saved.', 'ok');
}

function loadThresholds(){
  const t = Settings.get().gradeThresholds;
  document.getElementById('th-a').value = t.a;
  document.getElementById('th-b').value = t.b;
  document.getElementById('th-c').value = t.c;
}
function saveThresholds(){
  const a = Number(document.getElementById('th-a').value);
  const b = Number(document.getElementById('th-b').value);
  const c = Number(document.getElementById('th-c').value);
  if([a,b,c].some(n => isNaN(n) || n < 0 || n > 100)){ toast('Thresholds must be numbers between 0 and 100.', 'err'); return; }
  if(!(a > b && b > c)){ toast('Thresholds must descend: A > B > C.', 'err'); return; }
  const s = Settings.get();
  s.gradeThresholds = { a, b, c };
  Settings.save(s);
  toast('Grading scale saved. New trades will use these cutoffs.', 'ok');
}

function renderStrategyGrid(){
  const grid = document.getElementById('strategy-grid');
  const strategies = Strategies.all();
  const trades = Trades.all();

  if(!strategies.length){
    grid.innerHTML = `<div class="card empty-state" style="grid-column:1/-1;">
      <div class="e-icon">🧭</div>
      No strategies yet. Create one to define entry rules and get automatic A–D grading on every trade.
    </div>`;
    return;
  }

  grid.innerHTML = strategies.map(s => {
    const used = trades.filter(t => t.strategyId === s.id);
    const wr = used.length ? winRate(used) : null;
    return `<div class="card strategy-card">
      <div>
        <div class="card-title">${escapeHtml(s.name)}</div>
        <div class="card-sub">${s.description ? escapeHtml(s.description) : 'No description'}</div>
      </div>
      <div class="rules-mini">
        ${(s.rules||[]).slice(0,4).map(r => `<div class="rules-mini-item">${escapeHtml(r.text)}</div>`).join('') || '<div class="rules-mini-item text-faint">No rules defined yet</div>'}
        ${s.rules && s.rules.length > 4 ? `<div class="rules-mini-item text-faint">+${s.rules.length-4} more</div>` : ''}
      </div>
      <div class="text-faint" style="font-size:12px;">${used.length} trade${used.length===1?'':'s'} logged${wr!==null ? ' · '+pct(wr,0)+' win rate' : ''}</div>
      <div class="card-actions">
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${s.id}">${ICONS.edit}Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${s.id}">${ICONS.trash}</button>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-action="edit"]').forEach(btn => btn.addEventListener('click', () => openStrategyModal(btn.getAttribute('data-id'))));
  grid.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', () => deleteStrategy(btn.getAttribute('data-id'))));
}

async function deleteStrategy(id){
  const used = Trades.all().filter(t => t.strategyId === id).length;
  const msg = used
    ? `This strategy is used on ${used} logged trade${used===1?'':'s'}. They'll be kept, but will show as discretionary trades.`
    : 'This strategy will be permanently removed.';
  const ok = await confirmDialog('Delete strategy', msg, ['Cancel','Delete']);
  if(ok === 'Delete'){
    Strategies.remove(id);
    toast('Strategy deleted.', 'ok');
    renderStrategyGrid();
  }
}

function openStrategyModal(strategyId){
  const editing = !!strategyId;
  const strategy = editing ? Strategies.get(strategyId) : null;
  let rulesState = strategy ? strategy.rules.map(r => ({ ...r })) : [];

  const html = `
    <div class="modal-header">
      <h3>${editing ? 'Edit strategy' : 'New strategy'}</h3>
      <button class="modal-close" id="sm-x">${ICONS.close}</button>
    </div>
    <div class="modal-body">
      <div class="field"><label>Strategy name</label><input type="text" id="s-name" placeholder="e.g. London Breakout, ORB, Trend Pullback" value="${strategy ? escapeHtml(strategy.name) : ''}"></div>
      <div class="field"><label>Description <span class="hint">(optional)</span></label><textarea id="s-desc" placeholder="What's the thesis behind this setup?">${strategy && strategy.description ? escapeHtml(strategy.description) : ''}</textarea></div>
      <div class="field">
        <label>Entry rules / checklist</label>
        <div class="hint" style="margin-bottom:8px;">Each rule you check off when logging a trade counts toward its score. Score % is mapped to a grade using the scale on the Strategies page.</div>
        <div id="rule-rows"></div>
        <button class="btn btn-ghost btn-sm" id="btn-add-rule" type="button" style="margin-top:6px;">${ICONS.plus}Add rule</button>
      </div>
    </div>
    <div class="modal-footer">
      ${editing ? `<button class="btn btn-danger" id="sm-delete" style="margin-right:auto;">Delete</button>` : ''}
      <button class="btn btn-ghost" id="sm-cancel">Cancel</button>
      <button class="btn btn-bull" id="sm-save">${editing ? 'Save changes' : 'Create strategy'}</button>
    </div>
  `;
  const overlay = openModal(html);
  const rowsWrap = overlay.querySelector('#rule-rows');

  function renderRows(){
    if(!rulesState.length){
      rowsWrap.innerHTML = `<div class="text-faint" style="font-size:12.5px; padding:6px 0;">No rules yet — add at least one to enable automatic grading.</div>`;
      return;
    }
    rowsWrap.innerHTML = rulesState.map((r,i) => `
      <div class="field-row" style="grid-template-columns:1fr auto; gap:8px; margin-bottom:8px;">
        <input type="text" data-rule-idx="${i}" class="rule-text-input" placeholder="e.g. Price above 200EMA on the 4H" value="${escapeHtml(r.text)}">
        <button type="button" class="btn btn-ghost btn-icon" data-remove-idx="${i}">${ICONS.close}</button>
      </div>`).join('');
    rowsWrap.querySelectorAll('.rule-text-input').forEach(inp => {
      inp.addEventListener('input', () => { rulesState[Number(inp.getAttribute('data-rule-idx'))].text = inp.value; });
    });
    rowsWrap.querySelectorAll('[data-remove-idx]').forEach(btn => {
      btn.addEventListener('click', () => { rulesState.splice(Number(btn.getAttribute('data-remove-idx')),1); renderRows(); });
    });
  }
  renderRows();

  overlay.querySelector('#btn-add-rule').addEventListener('click', () => {
    rulesState.push({ id: uid('rule'), text:'' });
    renderRows();
    const inputs = rowsWrap.querySelectorAll('.rule-text-input');
    if(inputs.length) inputs[inputs.length-1].focus();
  });

  overlay.querySelector('#sm-x').addEventListener('click', closeModal);
  overlay.querySelector('#sm-cancel').addEventListener('click', closeModal);
  if(editing){
    overlay.querySelector('#sm-delete').addEventListener('click', () => { closeModal(); deleteStrategy(strategyId); });
  }
  overlay.querySelector('#sm-save').addEventListener('click', () => {
    const name = overlay.querySelector('#s-name').value.trim();
    if(!name){ toast('Give this strategy a name.', 'err'); return; }
    const cleanRules = rulesState.map(r => ({ id:r.id, text:r.text.trim() })).filter(r => r.text);
    const newStrategy = {
      id: editing ? strategyId : uid('strat'),
      name,
      description: overlay.querySelector('#s-desc').value.trim(),
      rules: cleanRules,
      createdAt: editing && strategy.createdAt ? strategy.createdAt : new Date().toISOString(),
    };
    Strategies.upsert(newStrategy);
    closeModal();
    toast(editing ? 'Strategy updated.' : 'Strategy created.', 'ok');
    renderStrategyGrid();
  });
}
