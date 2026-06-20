/* =========================================================
   MARK. — Trading Journal
   Data layer: localStorage persistence, grading, stats helpers
   + Theme, Sessions, Tags, Discipline, Memory, Correlation
   ========================================================= */

const DB_KEYS = {
  trades:     'mark_tj_trades_v1',
  strategies: 'mark_tj_strategies_v1',
  propfirms:  'mark_tj_propfirms_v1',
  settings:   'mark_tj_settings_v1',
};

const DEFAULT_SETTINGS = {
  gradeThresholds: { a: 90, b: 75, c: 60 },
  baseCurrency: 'USD',
  theme: 'dark',
  disciplineItems: [
    { id:'disc_1', text:'I followed my plan exactly', weight:1 },
    { id:'disc_2', text:'I did not revenge trade', weight:1 },
    { id:'disc_3', text:'I managed risk properly', weight:1 },
    { id:'disc_4', text:'I was emotionally neutral', weight:1 },
    { id:'disc_5', text:'I waited for my edge', weight:1 },
  ],
};

function uid(prefix){
  return (prefix||'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function readLS(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(raw === null) return fallback;
    return JSON.parse(raw);
  }catch(e){
    console.error('Failed reading', key, e);
    return fallback;
  }
}
function writeLS(key, value){
  try{
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  }catch(e){
    console.error('Failed writing', key, e);
    toast('Storage error — your browser storage may be full.', 'err');
    return false;
  }
}

/* ---------------- Trades ---------------- */
const Trades = {
  all(){ return readLS(DB_KEYS.trades, []); },
  save(list){ return writeLS(DB_KEYS.trades, list); },
  get(id){ return Trades.all().find(t => t.id === id); },
  upsert(trade){
    const list = Trades.all();
    const i = list.findIndex(t => t.id === trade.id);
    if(i >= 0) list[i] = trade; else list.unshift(trade);
    Trades.save(list);
    return trade;
  },
  remove(id){ Trades.save(Trades.all().filter(t => t.id !== id)); },
};

/* ---------------- Strategies ---------------- */
const Strategies = {
  all(){ return readLS(DB_KEYS.strategies, []); },
  save(list){ return writeLS(DB_KEYS.strategies, list); },
  get(id){ return Strategies.all().find(s => s.id === id); },
  upsert(strategy){
    const list = Strategies.all();
    const i = list.findIndex(s => s.id === strategy.id);
    if(i >= 0) list[i] = strategy; else list.unshift(strategy);
    Strategies.save(list);
    return strategy;
  },
  remove(id){ Strategies.save(Strategies.all().filter(s => s.id !== id)); },
};

/* ---------------- Prop firm accounts ---------------- */
const PropFirms = {
  all(){ return readLS(DB_KEYS.propfirms, []); },
  save(list){ return writeLS(DB_KEYS.propfirms, list); },
  get(id){ return PropFirms.all().find(p => p.id === id); },
  upsert(acc){
    const list = PropFirms.all();
    const i = list.findIndex(p => p.id === acc.id);
    if(i >= 0) list[i] = acc; else list.unshift(acc);
    PropFirms.save(list);
    return acc;
  },
  remove(id){ PropFirms.save(PropFirms.all().filter(p => p.id !== id)); },
};

/* ---------------- Settings ---------------- */
const Settings = {
  get(){ return Object.assign({}, DEFAULT_SETTINGS, readLS(DB_KEYS.settings, {})); },
  save(s){ return writeLS(DB_KEYS.settings, s); },
};

/* =========================================================
   Theme
   ========================================================= */
function initTheme(){
  const theme = Settings.get().theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}
function toggleTheme(){
  const s = Settings.get();
  const next = (s.theme || 'dark') === 'dark' ? 'light' : 'dark';
  s.theme = next;
  Settings.save(s);
  document.documentElement.setAttribute('data-theme', next);
  return next;
}

/* =========================================================
   Market Sessions
   ========================================================= */
const SESSIONS = [
  { name:'Asia',   open:'00:00', close:'09:00', tz:'Asia/Tokyo' },
  { name:'London', open:'08:00', close:'17:00', tz:'Europe/London' },
  { name:'New York', open:'14:30', close:'21:00', tz:'America/New_York' },
];

function getSessionStatus(){
  const now = new Date();
  return SESSIONS.map(s => {
    const open = new Date(now.toLocaleString('en-US', { timeZone:s.tz, hour12:false }));
    const [oh, om] = s.open.split(':'); open.setHours(+oh, +om, 0);
    const close = new Date(now.toLocaleString('en-US', { timeZone:s.tz, hour12:false }));
    const [ch, cm] = s.close.split(':'); close.setHours(+ch, +cm, 0);

    const sNow = new Date(now.toLocaleString('en-US', { timeZone:s.tz, hour12:false }));
    const mins = sNow.getHours()*60 + sNow.getMinutes();
    const openMins = +oh*60 + +om;
    const closeMins = +ch*60 + +cm;

    let status = 'closed';
    if(mins >= openMins && mins < closeMins) status = 'open';
    else if(mins >= openMins - 30 && mins < openMins) status = 'pre';

    const timeStr = sNow.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false });
    return { ...s, status, timeStr };
  });
}

function renderMarketClock(mountId){
  const mount = document.getElementById(mountId);
  if(!mount) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
  const dateStr = now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
  const sessions = getSessionStatus();

  mount.innerHTML = `
    <div class="clock-time">${timeStr}</div>
    <div class="clock-date">${dateStr}</div>
    <div class="session-row">
      ${sessions.map(s => `
        <div class="session-item">
          <div class="session-dot ${s.status}"></div>
          <span class="session-name">${s.name}</span>
          <span class="session-hours">${s.timeStr}</span>
          <span class="session-status ${s.status}">${s.status}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/* =========================================================
   Grading
   ========================================================= */
function computeGrade(checkedCount, totalCount, thresholds){
  thresholds = thresholds || Settings.get().gradeThresholds;
  if(!totalCount){ return { score: 0, grade: null }; }
  const score = Math.round((checkedCount / totalCount) * 100);
  let grade;
  if(score >= thresholds.a) grade = 'A';
  else if(score >= thresholds.b) grade = 'B';
  else if(score >= thresholds.c) grade = 'C';
  else grade = 'D';
  return { score, grade };
}

/* =========================================================
   Formatting helpers
   ========================================================= */
function money(n, currency){
  currency = currency || Settings.get().baseCurrency || 'USD';
  const v = Number(n) || 0;
  const sign = v < 0 ? '-' : '';
  try{
    return sign + new Intl.NumberFormat('en-US', { style:'currency', currency, minimumFractionDigits:2, maximumFractionDigits:2 }).format(Math.abs(v));
  }catch(e){
    return sign + '$' + Math.abs(v).toFixed(2);
  }
}
function moneySigned(n, currency){
  const v = Number(n) || 0;
  return (v > 0 ? '+' : '') + money(v, currency);
}
function pct(n, digits){
  digits = digits === undefined ? 1 : digits;
  return (Number(n)||0).toFixed(digits) + '%';
}
function fmtDate(iso){
  if(!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if(isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { month:'short', day:'2-digit', year:'numeric' });
}
function todayISO(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function monthKey(iso){ return (iso||'').slice(0,7); }
function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* =========================================================
   Image handling
   ========================================================= */
function resizeImageFile(file, maxW, quality){
  maxW = maxW || 900; quality = quality || 0.72;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image decode failed'));
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* =========================================================
   Stats helpers
   ========================================================= */
function filterTrades(trades, f){
  f = f || {};
  return trades.filter(t => {
    if(f.from && t.date < f.from) return false;
    if(f.to && t.date > f.to) return false;
    if(f.strategyId && t.strategyId !== f.strategyId) return false;
    if(f.propFirmId && t.propFirmId !== f.propFirmId) return false;
    if(f.symbol && t.symbol !== f.symbol) return false;
    if(f.grade && t.grade !== f.grade) return false;
    if(f.outcome && t.outcome !== f.outcome) return false;
    if(f.tags && f.tags.length){
      const tradeTags = t.tags || [];
      if(!f.tags.some(tag => tradeTags.includes(tag))) return false;
    }
    return true;
  });
}
function sortByDate(trades){
  return [...trades].sort((a,b) => (a.date+ (a.time||'')).localeCompare(b.date+(b.time||'')));
}
function wins(trades){ return trades.filter(t => t.outcome === 'Win'); }
function losses(trades){ return trades.filter(t => t.outcome === 'Loss'); }
function breakevens(trades){ return trades.filter(t => t.outcome === 'Breakeven'); }
function winRate(trades){
  const w = wins(trades).length, l = losses(trades).length;
  if(w+l === 0) return 0;
  return (w/(w+l))*100;
}
function netPnl(trades){ return trades.reduce((s,t) => s + (Number(t.pnl)||0), 0); }
function profitFactor(trades){
  const gp = trades.reduce((s,t) => t.pnl>0 ? s+t.pnl : s, 0);
  const gl = trades.reduce((s,t) => t.pnl<0 ? s+Math.abs(t.pnl) : s, 0);
  if(gl === 0) return gp > 0 ? Infinity : 0;
  return gp/gl;
}
function expectancy(trades){
  if(!trades.length) return 0;
  return netPnl(trades)/trades.length;
}
function avg(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
function equityCurve(trades, startingBalance){
  const sorted = sortByDate(trades);
  let bal = startingBalance || 0;
  return sorted.map(t => { bal += (Number(t.pnl)||0); return { date:t.date, balance:bal, id:t.id }; });
}
function groupSum(trades, keyFn){
  const map = {};
  trades.forEach(t => {
    const k = keyFn(t) ?? '—';
    if(!map[k]) map[k] = { key:k, pnl:0, count:0, wins:0, losses:0 };
    map[k].pnl += Number(t.pnl)||0;
    map[k].count += 1;
    if(t.outcome === 'Win') map[k].wins++;
    if(t.outcome === 'Loss') map[k].losses++;
  });
  return Object.values(map);
}

/* =========================================================
   Tags
   ========================================================= */
function getAllTags(){
  const trades = Trades.all();
  const tags = new Set();
  trades.forEach(t => (t.tags||[]).forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

/* =========================================================
   Discipline score
   ========================================================= */
function computeDisciplineScore(checkedIds, items){
  if(!items || !items.length) return { score:0, percent:0 };
  const checked = (checkedIds||[]).filter(id => items.some(i => i.id === id)).length;
  const percent = Math.round((checked / items.length) * 100);
  return { score:checked, total:items.length, percent };
}

/* =========================================================
   Trade memory / replay
   ========================================================= */
function getTradeMemory(){
  const trades = sortByDate(Trades.all());
  if(!trades.length) return null;
  const now = new Date();
  const memories = [];

  trades.forEach(t => {
    const tDate = new Date(t.date + 'T00:00:00');
    const diffDays = Math.floor((now - tDate) / (1000*60*60*24));
    if(diffDays === 7 || diffDays === 30 || diffDays === 90 || diffDays === 365){
      memories.push({ trade:t, daysAgo:diffDays });
    }
  });

  // Also find same-date trades from previous years
  trades.forEach(t => {
    const tDate = new Date(t.date + 'T00:00:00');
    if(tDate.getMonth() === now.getMonth() && tDate.getDate() === now.getDate() && tDate.getFullYear() < now.getFullYear()){
      const years = now.getFullYear() - tDate.getFullYear();
      if(!memories.some(m => m.trade.id === t.id)){
        memories.push({ trade:t, yearsAgo:years });
      }
    }
  });

  return memories.length ? memories : null;
}

/* =========================================================
   Correlation heatmap
   ========================================================= */
function computeCorrelationHeatmap(){
  const trades = Trades.all();
  const symbols = Array.from(new Set(trades.map(t => t.symbol).filter(Boolean))).sort();
  if(symbols.length < 2) return null;

  // Build daily P&L matrix per symbol
  const dailyMap = {};
  trades.forEach(t => {
    if(!dailyMap[t.date]) dailyMap[t.date] = {};
    if(!dailyMap[t.date][t.symbol]) dailyMap[t.date][t.symbol] = 0;
    dailyMap[t.date][t.symbol] += Number(t.pnl) || 0;
  });

  const dates = Object.keys(dailyMap).sort();
  const matrix = symbols.map(s1 => {
    return symbols.map(s2 => {
      if(s1 === s2) return { symbol:s1, self:true, value:1 };

      const pairs = dates.map(d => [dailyMap[d][s1]||0, dailyMap[d][s2]||0]).filter(p => p[0] !== 0 || p[1] !== 0);
      if(pairs.length < 3) return { symbol:s1, symbol2:s2, value:0 };

      const avg1 = pairs.reduce((s,p) => s+p[0], 0) / pairs.length;
      const avg2 = pairs.reduce((s,p) => s+p[1], 0) / pairs.length;

      let num = 0, den1 = 0, den2 = 0;
      pairs.forEach(p => {
        const d1 = p[0] - avg1, d2 = p[1] - avg2;
        num += d1 * d2;
        den1 += d1 * d1;
        den2 += d2 * d2;
      });

      const corr = den1 && den2 ? num / Math.sqrt(den1 * den2) : 0;
      return { symbol:s1, symbol2:s2, value:corr };
    });
  });

  return { symbols, matrix };
}

/* =========================================================
   Share card generation
   ========================================================= */
async function generateShareCard(trade){
  const strategy = trade.strategyId ? Strategies.get(trade.strategyId) : null;
  const html = `
    <div class="share-card-preview" id="share-card-${trade.id}">
      <div class="share-card-header">
        <span class="share-card-logo">MARK.</span>
        <span class="pill ${(trade.direction||'Long')==='Long'?'pill-long':'pill-short'}">${trade.direction || '—'}</span>
      </div>
      <div class="share-card-body">
        <div class="share-card-stat">
          <span class="label">Symbol</span>
          <span class="value">${escapeHtml(trade.symbol || '—')}</span>
        </div>
        <div class="share-card-stat">
          <span class="label">P&L</span>
          <span class="value ${(trade.pnl||0)>=0?'text-bull':'text-bear'}">${moneySigned(trade.pnl || 0)}</span>
        </div>
        <div class="share-card-stat">
          <span class="label">Strategy</span>
          <span class="value">${strategy ? escapeHtml(strategy.name) : 'Discretionary'}</span>
        </div>
        ${trade.grade ? `
        <div class="share-card-stat">
          <span class="label">Grade</span>
          <span class="value" style="color:var(--grade-${trade.grade.toLowerCase()})">${trade.grade}</span>
        </div>` : ''}
      </div>
      <div class="share-card-footer">${fmtDate(trade.date)} · mark.trade</div>
    </div>
  `;
  return html;
}

/* =========================================================
   Import from TradingView webhook format
   ========================================================= */
function parseTradingViewAlert(text){
  // Supports formats like:
  // "BTCUSD Long @ 45000 SL 44000 TP 48000"
  // "Alert: AAPL direction=long entry=150.5 stop=148 take=155"
  const lines = text.split('\n').join(' ').split(' ');
  const result = { symbol:'', direction:'', entryPrice:null, stopLoss:null, takeProfit:null };

  // Try to extract from key=value pairs
  const kvPattern = /([a-zA-Z]+)=([^\s]+)/g;
  let match;
  while((match = kvPattern.exec(text)) !== null){
    const key = match[1].toLowerCase();
    const val = match[2];
    if(key === 'symbol' || key === 'sym') result.symbol = val.toUpperCase();
    if(key === 'direction' || key === 'dir') result.direction = val.toLowerCase() === 'short' ? 'Short' : 'Long';
    if(key === 'entry' || key === 'price') result.entryPrice = parseFloat(val);
    if(key === 'stop' || key === 'sl') result.stopLoss = parseFloat(val);
    if(key === 'take' || key === 'tp') result.takeProfit = parseFloat(val);
  }

  // Fallback: positional parsing
  if(!result.symbol){
    const firstWord = lines.find(w => w && w.length > 1 && !w.includes('='));
    if(firstWord) result.symbol = firstWord.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  if(!result.direction){
    const dirWord = lines.find(w => /long|buy/i.test(w));
    if(dirWord) result.direction = 'Long';
    else if(lines.some(w => /short|sell/i.test(w))) result.direction = 'Short';
  }

  return result.symbol ? result : null;
}

/* =========================================================
   Prop firm account metrics
   ========================================================= */
function accountTrades(accountId){
  return sortByDate(Trades.all().filter(t => t.propFirmId === accountId));
}

function backfillTradePhases(acc){
  const trades = Trades.all();
  let changed = false;
  trades.forEach(t => {
    if(t.propFirmId === acc.id && !t.phaseId){
      const phases = acc.phases || [];
      let assigned = null;
      for(let i = 0; i < phases.length; i++){
        const p = phases[i], next = phases[i+1];
        if(p.startDate && t.date >= p.startDate && (!next || !next.startDate || t.date < next.startDate)) assigned = p.id;
      }
      t.phaseId = assigned || acc.currentPhaseId || (phases[0] && phases[0].id) || null;
      changed = true;
    }
  });
  if(changed) Trades.save(trades);
}

function checkPhaseAdvancement(accountId){
  const acc = PropFirms.get(accountId);
  if(!acc || !acc.phases || !acc.phases.length) return null;
  let result = null;
  for(let guard = 0; guard <= acc.phases.length; guard++){
    const idx = acc.phases.findIndex(p => p.id === acc.currentPhaseId);
    if(idx === -1) break;
    const phase = acc.phases[idx];
    const target = Number(phase.profitTargetPercent) || 0;
    if(target <= 0) break;
    const phaseTrades = Trades.all().filter(t => t.propFirmId === accountId && t.phaseId === phase.id);
    const phasePnl = phaseTrades.reduce((s,t) => s + (Number(t.pnl)||0), 0);
    const targetAmount = (Number(acc.accountSize)||0) * (target/100);
    if(targetAmount <= 0 || phasePnl < targetAmount) break;
    const next = acc.phases[idx+1];
    phase.passedAt = todayISO();
    if(!next) break;
    next.startDate = next.startDate || todayISO();
    acc.currentPhaseId = next.id;
    result = { fromPhase: phase.name, toPhase: next.name };
  }
  if(result) PropFirms.upsert(acc);
  return result;
}

function computeAccountMetrics(acc){
  backfillTradePhases(acc);
  const today = todayISO();
  const allTrades = accountTrades(acc.id);

  const phases = (acc.phases||[]).map(phase => {
    const phaseTrades = sortByDate(allTrades.filter(t => t.phaseId === phase.id));
    const phasePnl = phaseTrades.reduce((s,t) => s + (Number(t.pnl)||0), 0);
    const targetAmount = (Number(acc.accountSize)||0) * ((Number(phase.profitTargetPercent)||0)/100);
    const progressPercent = targetAmount > 0 ? (phasePnl/targetAmount)*100 : 0;
    return { ...phase, trades: phaseTrades, phasePnl, targetAmount, progressPercent,
      isCurrent: phase.id === acc.currentPhaseId, isPassed: !!phase.passedAt };
  });

  const currentPhase = phases.find(p => p.isCurrent) || phases[0] || null;
  const currentPhaseTrades = currentPhase ? currentPhase.trades : [];

  let balance = Number(acc.accountSize)||0;
  let peak = balance;
  const seedDate = (currentPhase && currentPhase.startDate) || (acc.createdAt ? acc.createdAt.slice(0,10) : today);
  const series = [{ date: seedDate, balance }];
  currentPhaseTrades.forEach(t => {
    balance += Number(t.pnl)||0;
    if(balance > peak) peak = balance;
    series.push({ date: t.date, balance });
  });
  const currentBalance = balance;
  const dailyPnL = currentPhaseTrades.filter(t => t.date === today).reduce((s,t)=>s+(Number(t.pnl)||0),0);
  const dailyDrawdownPercent = dailyPnL < 0 ? (Math.abs(dailyPnL)/(Number(acc.accountSize)||1))*100 : 0;
  const ddRef = acc.maxDrawdownType === 'trailing' ? peak : (Number(acc.accountSize)||0);
  const drawdownAmount = Math.max(0, ddRef - currentBalance);
  const maxDrawdownPercentUsed = (drawdownAmount/(Number(acc.accountSize)||1))*100;
  const breachedDaily = dailyDrawdownPercent >= (Number(acc.dailyDrawdownPercent)||Infinity);
  const breachedMax = maxDrawdownPercentUsed >= (Number(acc.maxDrawdownPercent)||Infinity);
  const lifetimePnl = allTrades.reduce((s,t) => s + (Number(t.pnl)||0), 0);

  return {
    currentBalance, peak, series, dailyPnL, dailyDrawdownPercent,
    maxDrawdownPercentUsed, drawdownAmount, breachedDaily, breachedMax,
    phases, currentPhase, tradeCount: allTrades.length, lifetimePnl,
  };
}

/* =========================================================
   Export / Import / Reset
   ========================================================= */
function exportAllData(){
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'MARK. Trading Journal',
    version: 1,
    trades: Trades.all(),
    strategies: Strategies.all(),
    propfirms: PropFirms.all(),
    settings: Settings.get(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mark-journal-backup-${todayISO()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function importAllData(file, mode){
  return file.text().then(text => {
    const data = JSON.parse(text);
    if(mode === 'replace'){
      if(data.trades) Trades.save(data.trades);
      if(data.strategies) Strategies.save(data.strategies);
      if(data.propfirms) PropFirms.save(data.propfirms);
      if(data.settings) Settings.save(data.settings);
    } else {
      if(data.trades) Trades.save([...data.trades, ...Trades.all()]);
      if(data.strategies) Strategies.save([...data.strategies, ...Strategies.all()]);
      if(data.propfirms) PropFirms.save([...data.propfirms, ...PropFirms.all()]);
    }
    return true;
  });
}
function resetAllData(){
  Object.values(DB_KEYS).forEach(k => localStorage.removeItem(k));
}
