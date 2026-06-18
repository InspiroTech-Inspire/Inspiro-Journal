/* =========================================================
   MARK. — Trading Journal
   Prop Firms page logic
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  renderSidebar('propfirms');
  renderAccountGrid();
  document.getElementById('btn-add-account').addEventListener('click', () => openAccountModal());
});

function gaugeColor(ratio){
  if(ratio >= 1) return 'var(--bear)';
  if(ratio >= 0.7) return 'var(--gold)';
  return 'var(--blue)';
}
function phaseColor(progressPercent){
  if(progressPercent >= 100) return 'var(--bull)';
  if(progressPercent >= 50) return 'var(--blue)';
  if(progressPercent < 0) return 'var(--bear)';
  return 'var(--text-faint)';
}

function renderAccountGrid(){
  const grid = document.getElementById('account-grid');
  const accounts = PropFirms.all();

  if(!accounts.length){
    grid.innerHTML = `<div class="card empty-state" style="grid-column:1/-1;">
      <div class="e-icon">🛡️</div>
      No prop firm accounts yet. Add one to track drawdown limits and phase targets against your linked trades.
    </div>`;
    return;
  }

  grid.innerHTML = accounts.map(acc => {
    const m = computeAccountMetrics(acc);
    const dailyRatio = (Number(acc.dailyDrawdownPercent)||0) > 0 ? m.dailyDrawdownPercent / acc.dailyDrawdownPercent : 0;
    const maxRatio = (Number(acc.maxDrawdownPercent)||0) > 0 ? m.maxDrawdownPercentUsed / acc.maxDrawdownPercent : 0;
    const statusKey = (acc.status||'Active').toLowerCase();

    return `<div class="card" style="display:flex;flex-direction:column;gap:14px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div>
          <div class="card-title">${escapeHtml(acc.firmName)}</div>
          <div class="card-sub">${escapeHtml(acc.accountLabel)} · ${escapeHtml(acc.currency||'USD')} ${Number(acc.accountSize).toLocaleString()}</div>
        </div>
        <span class="pill pill-status-${statusKey}">${escapeHtml(acc.status||'Active')}</span>
      </div>

      ${(m.breachedDaily || m.breachedMax) ? `<div class="pill pill-loss" style="width:max-content;">⚠ ${m.breachedDaily && m.breachedMax ? 'Daily & max drawdown breached' : m.breachedDaily ? 'Daily drawdown breached' : 'Max drawdown breached'}</div>` : ''}

      <div>
        <div class="stat-label" style="margin-bottom:3px;">Current balance ${m.currentPhase ? `· ${escapeHtml(m.currentPhase.name)}` : ''}</div>
        <div class="stat-value mono ${m.currentBalance >= Number(acc.accountSize) ? 'text-bull':'text-bear'}">${money(m.currentBalance, acc.currency)}</div>
        <div class="text-faint" style="font-size:11.5px;">Lifetime across all phases: ${moneySigned(m.lifetimePnl)} · ${m.tradeCount} trade${m.tradeCount===1?'':'s'}</div>
      </div>

      <div>
        <div class="gauge-row"><span>Daily drawdown</span><span class="mono">${pct(m.dailyDrawdownPercent,1)} / ${pct(Number(acc.dailyDrawdownPercent)||0,0)}</span></div>
        <div class="gauge"><div class="gauge-fill" style="width:${Math.min(100,dailyRatio*100)}%; background:${gaugeColor(dailyRatio)};"></div></div>
      </div>
      <div>
        <div class="gauge-row"><span>Max drawdown <span class="text-faint">(${acc.maxDrawdownType==='trailing'?'trailing':'static'})</span></span><span class="mono">${pct(m.maxDrawdownPercentUsed,1)} / ${pct(Number(acc.maxDrawdownPercent)||0,0)}</span></div>
        <div class="gauge"><div class="gauge-fill" style="width:${Math.min(100,maxRatio*100)}%; background:${gaugeColor(maxRatio)};"></div></div>
      </div>

      <div>
        <div class="stat-label" style="margin-bottom:7px;">Phases <span class="text-faint" style="font-weight:400;">— click one to see its trades</span></div>
        <div class="phase-row">
          ${m.phases.map(p => `<div class="phase-chip ${p.isCurrent?'current':''}" data-account-id="${acc.id}" data-phase-id="${p.id}">
            <span class="pname">${escapeHtml(p.name)} ${p.isPassed?'✓':''}</span>
            <span class="ptarget">${p.profitTargetPercent||0}% target · ${p.trades.length} trade${p.trades.length===1?'':'s'}</span>
            <span class="mono" style="color:${phaseColor(p.progressPercent)};">${p.progressPercent.toFixed(0)}%</span>
          </div>`).join('') || '<span class="text-faint" style="font-size:12px;">No phases defined</span>'}
        </div>
      </div>

      <div class="card-actions">
        <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${acc.id}">${ICONS.edit}Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${acc.id}">${ICONS.trash}</button>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-action="edit"]').forEach(btn => btn.addEventListener('click', () => openAccountModal(btn.getAttribute('data-id'))));
  grid.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', () => deleteAccount(btn.getAttribute('data-id'))));
  grid.querySelectorAll('.phase-chip[data-phase-id]').forEach(chip => {
    chip.addEventListener('click', () => openPhaseDetailModal(chip.getAttribute('data-account-id'), chip.getAttribute('data-phase-id')));
  });
}

function openPhaseDetailModal(accountId, phaseId){
  const acc = PropFirms.get(accountId);
  if(!acc) return;
  const m = computeAccountMetrics(acc);
  const phase = m.phases.find(p => p.id === phaseId);
  if(!phase) return;

  const rows = sortByDate(phase.trades).reverse().map(t => {
    const strategy = t.strategyId ? Strategies.get(t.strategyId) : null;
    const gradeHtml = t.grade ? `<span class="grade-stamp sm grade-${t.grade.toLowerCase()}">${t.grade}</span>` : `<span class="grade-stamp sm grade-none">–</span>`;
    return `<tr>
      <td class="mono">${fmtDate(t.date)}</td>
      <td><strong>${escapeHtml(t.symbol||'—')}</strong></td>
      <td>${strategy ? escapeHtml(strategy.name) : '<span class="text-faint">Discretionary</span>'}</td>
      <td>${gradeHtml}</td>
      <td><span class="pill ${t.outcome==='Win'?'pill-win':t.outcome==='Loss'?'pill-loss':'pill-be'}">${t.outcome}</span></td>
      <td class="mono ${t.pnl>=0?'text-bull':'text-bear'}">${moneySigned(t.pnl)}</td>
    </tr>`;
  }).join('') || `<tr class="empty-row"><td colspan="6"><div class="empty-state">No trades logged in this phase yet.</div></td></tr>`;

  const statusLine = phase.isPassed
    ? `Passed on ${fmtDate(phase.passedAt)}`
    : phase.isCurrent ? 'Currently active' : 'Not started yet';

  openModal(`
    <div class="modal-header">
      <h3>${escapeHtml(acc.firmName)} — ${escapeHtml(phase.name)}</h3>
      <button class="modal-close" id="pd-x">${ICONS.close}</button>
    </div>
    <div class="modal-body">
      <div class="grid-3" style="margin-bottom:18px;">
        <div class="stat-card"><div class="stat-label">Status</div><div class="stat-value" style="font-size:15px;">${statusLine}</div></div>
        <div class="stat-card"><div class="stat-label">P&amp;L this phase</div><div class="stat-value mono ${phase.phasePnl>=0?'text-bull':'text-bear'}">${moneySigned(phase.phasePnl)}</div></div>
        <div class="stat-card"><div class="stat-label">Target</div><div class="stat-value mono">${phase.profitTargetPercent||0}% · ${money(phase.targetAmount, acc.currency)}</div></div>
      </div>
      <div class="table-wrap">
        <table class="tj">
          <thead><tr><th>Date</th><th>Symbol</th><th>Strategy</th><th>Grade</th><th>Outcome</th><th>P&amp;L</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `, { wide:true });
  document.getElementById('pd-x').addEventListener('click', closeModal);
}

async function deleteAccount(id){
  const used = Trades.all().filter(t => t.propFirmId === id).length;
  const msg = used
    ? `${used} logged trade${used===1?'':'s'} reference this account. They'll be kept, but unlinked from any prop firm account.`
    : 'This account will be permanently removed.';
  const ok = await confirmDialog('Delete account', msg, ['Cancel','Delete']);
  if(ok === 'Delete'){ PropFirms.remove(id); toast('Account deleted.', 'ok'); renderAccountGrid(); }
}

function defaultPhases(){
  return [
    { id: uid('phase'), name:'Phase 1', profitTargetPercent:8, startDate:'' },
    { id: uid('phase'), name:'Phase 2', profitTargetPercent:5, startDate:'' },
    { id: uid('phase'), name:'Funded', profitTargetPercent:0, startDate:'' },
  ];
}

function openAccountModal(accountId){
  const editing = !!accountId;
  const acc = editing ? PropFirms.get(accountId) : null;
  let phasesState = acc ? acc.phases.map(p => ({ ...p })) : defaultPhases();
  let currentPhaseId = acc ? acc.currentPhaseId : phasesState[0].id;

  const html = `
    <div class="modal-header">
      <h3>${editing ? 'Edit prop firm account' : 'New prop firm account'}</h3>
      <button class="modal-close" id="am-x">${ICONS.close}</button>
    </div>
    <div class="modal-body">
      <div class="field-row">
        <div class="field"><label>Prop firm</label><input type="text" id="a-firm" placeholder="FTMO, MyFundedFX, Apex…" value="${acc ? escapeHtml(acc.firmName) : ''}"></div>
        <div class="field"><label>Account label</label><input type="text" id="a-label" placeholder="100k Challenge, Funded #1…" value="${acc ? escapeHtml(acc.accountLabel) : ''}"></div>
      </div>
      <div class="field-row cols-3">
        <div class="field"><label>Account size</label><input type="number" step="any" id="a-size" class="mono" value="${acc ? acc.accountSize : 100000}"></div>
        <div class="field"><label>Currency</label><input type="text" id="a-currency" class="mono" value="${acc ? escapeHtml(acc.currency||'USD') : 'USD'}"></div>
        <div class="field"><label>Risk per trade %</label><input type="number" step="any" id="a-risk" class="mono" value="${acc && acc.riskPerTradePercent!=null ? acc.riskPerTradePercent : 1}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Daily drawdown limit %</label><input type="number" step="any" id="a-daily-dd" class="mono" value="${acc ? acc.dailyDrawdownPercent : 5}"></div>
        <div class="field"><label>Max drawdown limit %</label><input type="number" step="any" id="a-max-dd" class="mono" value="${acc ? acc.maxDrawdownPercent : 10}"></div>
      </div>
      <div class="field">
        <label>Max drawdown measured from</label>
        <div class="radio-row">
          <label><input type="radio" name="dd-type" value="static" ${(!acc || acc.maxDrawdownType==='static') ? 'checked':''}> Initial balance (static)</label>
          <label><input type="radio" name="dd-type" value="trailing" ${(acc && acc.maxDrawdownType==='trailing') ? 'checked':''}> Highest balance reached (trailing)</label>
        </div>
      </div>
      <div class="field">
        <label>Status</label>
        <select id="a-status">
          ${['Active','Passed','Failed','Funded'].map(s => `<option value="${s}" ${acc && acc.status===s ? 'selected':''}>${s}</option>`).join('')}
        </select>
      </div>

      <div class="field">
        <label>Phases</label>
        <div class="hint" style="margin-bottom:8px;">Profit target is a % of account size. Select the radio button for the phase you're currently in.</div>
        <div id="phase-rows"></div>
        <button class="btn btn-ghost btn-sm" id="btn-add-phase" type="button" style="margin-top:6px;">${ICONS.plus}Add phase</button>
      </div>
    </div>
    <div class="modal-footer">
      ${editing ? `<button class="btn btn-danger" id="am-delete" style="margin-right:auto;">Delete</button>` : ''}
      <button class="btn btn-ghost" id="am-cancel">Cancel</button>
      <button class="btn btn-bull" id="am-save">${editing ? 'Save changes' : 'Create account'}</button>
    </div>
  `;
  const overlay = openModal(html, { wide:true });
  const rowsWrap = overlay.querySelector('#phase-rows');

  function renderPhaseRows(){
    rowsWrap.innerHTML = phasesState.map((p,i) => `
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px; background:var(--bg-soft); border:1px solid var(--border); border-radius:8px; padding:8px;">
        <input type="radio" name="current-phase" data-current-idx="${i}" ${p.id===currentPhaseId ? 'checked':''} title="Current phase">
        <input type="text" data-phase-field="name" data-idx="${i}" placeholder="Phase name" value="${escapeHtml(p.name)}" style="flex:1.4;">
        <input type="number" data-phase-field="profitTargetPercent" data-idx="${i}" placeholder="Target %" class="mono" style="flex:.7;" value="${p.profitTargetPercent}">
        <input type="date" data-phase-field="startDate" data-idx="${i}" style="flex:1;" value="${p.startDate||''}">
        <button type="button" class="btn btn-ghost btn-icon" data-remove-phase-idx="${i}">${ICONS.close}</button>
      </div>`).join('');

    rowsWrap.querySelectorAll('[data-phase-field]').forEach(inp => {
      inp.addEventListener('input', () => {
        const i = Number(inp.getAttribute('data-idx'));
        const field = inp.getAttribute('data-phase-field');
        phasesState[i][field] = field === 'profitTargetPercent' ? Number(inp.value) : inp.value;
      });
    });
    rowsWrap.querySelectorAll('[data-current-idx]').forEach(r => {
      r.addEventListener('change', () => { currentPhaseId = phasesState[Number(r.getAttribute('data-current-idx'))].id; });
    });
    rowsWrap.querySelectorAll('[data-remove-phase-idx]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const i = Number(btn.getAttribute('data-remove-phase-idx'));
        const phaseId = phasesState[i].id;
        const used = Trades.all().filter(t => t.phaseId === phaseId).length;
        if(used){
          const ok = await confirmDialog('Remove phase', `${used} logged trade${used===1?'':'s'} belong to this phase. They'll stay on the account but won't be linked to any phase.`, ['Cancel','Remove']);
          if(ok !== 'Remove') return;
        }
        if(phaseId === currentPhaseId) currentPhaseId = null;
        phasesState.splice(i,1);
        renderPhaseRows();
      });
    });
  }
  renderPhaseRows();

  overlay.querySelector('#btn-add-phase').addEventListener('click', () => {
    phasesState.push({ id: uid('phase'), name:'New phase', profitTargetPercent:0, startDate:'' });
    renderPhaseRows();
  });

  overlay.querySelector('#am-x').addEventListener('click', closeModal);
  overlay.querySelector('#am-cancel').addEventListener('click', closeModal);
  if(editing){
    overlay.querySelector('#am-delete').addEventListener('click', () => { closeModal(); deleteAccount(accountId); });
  }

  overlay.querySelector('#am-save').addEventListener('click', () => {
    const firmName = overlay.querySelector('#a-firm').value.trim();
    const accountLabel = overlay.querySelector('#a-label').value.trim();
    const accountSize = Number(overlay.querySelector('#a-size').value);
    if(!firmName){ toast('Enter the prop firm name.', 'err'); return; }
    if(!accountLabel){ toast('Give this account a label.', 'err'); return; }
    if(!accountSize || accountSize <= 0){ toast('Account size must be greater than 0.', 'err'); return; }

    const cleanPhases = phasesState.filter(p => p.name && p.name.trim());
    const newAccount = {
      id: editing ? accountId : uid('acct'),
      firmName, accountLabel, accountSize,
      currency: overlay.querySelector('#a-currency').value.trim() || 'USD',
      riskPerTradePercent: Number(overlay.querySelector('#a-risk').value) || 0,
      dailyDrawdownPercent: Number(overlay.querySelector('#a-daily-dd').value) || 0,
      maxDrawdownPercent: Number(overlay.querySelector('#a-max-dd').value) || 0,
      maxDrawdownType: overlay.querySelector('input[name="dd-type"]:checked').value,
      status: overlay.querySelector('#a-status').value,
      phases: cleanPhases,
      currentPhaseId: cleanPhases.find(p => p.id===currentPhaseId) ? currentPhaseId : (cleanPhases[0] ? cleanPhases[0].id : null),
      createdAt: editing && acc.createdAt ? acc.createdAt : new Date().toISOString(),
    };
    PropFirms.upsert(newAccount);
    closeModal();
    toast(editing ? 'Account updated.' : 'Account created.', 'ok');
    renderAccountGrid();
  });
}
