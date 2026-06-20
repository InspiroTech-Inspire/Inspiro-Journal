/* =========================================================
   Inspiro® — Trading Journal
   Analytics page logic
   ========================================================= */

let chartRefs = {};
let analyticsFilters = { from:'', to:'', strategyId:'', propFirmId:'', symbol:'' };

const GRADE_COLOR = { A:'#E8B339', B:'#2DD4A7', C:'#5B8DEF', D:'#F0594A' };
const BULL = '#2DD4A7', BEAR = '#F0594A';

document.addEventListener('DOMContentLoaded', () => {
  renderSidebar('analytics');
  if(window.Chart){
    Chart.defaults.color = '#8A96A5';
    Chart.defaults.borderColor = '#232C38';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
  }
  populateFilters();
  wireFilters();
  renderAnalytics();
});

function populateFilters(){
  const trades = Trades.all();
  const stratSel = document.getElementById('f-strategy');
  Strategies.all().forEach(s => stratSel.appendChild(new Option(s.name, s.id)));
  const acctSel = document.getElementById('f-account');
  PropFirms.all().forEach(a => acctSel.appendChild(new Option(`${a.firmName} — ${a.accountLabel}`, a.id)));
  const symSel = document.getElementById('f-symbol');
  const symbols = Array.from(new Set(trades.map(t => t.symbol).filter(Boolean))).sort();
  symbols.forEach(s => symSel.appendChild(new Option(s, s)));
}

function wireFilters(){
  document.getElementById('f-from').addEventListener('change', e => { analyticsFilters.from = e.target.value; renderAnalytics(); });
  document.getElementById('f-to').addEventListener('change', e => { analyticsFilters.to = e.target.value; renderAnalytics(); });
  document.getElementById('f-strategy').addEventListener('change', e => { analyticsFilters.strategyId = e.target.value; renderAnalytics(); });
  document.getElementById('f-account').addEventListener('change', e => { analyticsFilters.propFirmId = e.target.value; renderAnalytics(); });
  document.getElementById('f-symbol').addEventListener('change', e => { analyticsFilters.symbol = e.target.value; renderAnalytics(); });
  document.getElementById('btn-clear-filters').addEventListener('click', () => {
    analyticsFilters = { from:'', to:'', strategyId:'', propFirmId:'', symbol:'' };
    ['f-from','f-to','f-strategy','f-account','f-symbol'].forEach(id => document.getElementById(id).value = '');
    renderAnalytics();
  });
}

function renderAnalytics(){
  const trades = filterTrades(Trades.all(), analyticsFilters);
  renderKpis(trades);
  if(window.Chart) renderCharts(trades);
}

function renderKpis(trades){
  const pnl = netPnl(trades);
  const wr = winRate(trades);
  const pf = profitFactor(trades);
  const exp = expectancy(trades);
  const best = trades.length ? Math.max(...trades.map(t => t.pnl)) : 0;
  const worst = trades.length ? Math.min(...trades.map(t => t.pnl)) : 0;

  document.getElementById('kpi-grid').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total trades</div><div class="stat-value">${trades.length}</div></div>
    <div class="stat-card"><div class="stat-label">Win rate</div><div class="stat-value">${pct(wr,0)}</div></div>
    <div class="stat-card"><div class="stat-label">Profit factor</div><div class="stat-value ${pf>=1.5?'text-bull':pf<1?'text-bear':''}">${pf===Infinity?'∞':pf.toFixed(2)}</div></div>
    <div class="stat-card"><div class="stat-label">Expectancy / trade</div><div class="stat-value ${exp>=0?'text-bull':'text-bear'}">${moneySigned(exp)}</div></div>
    <div class="stat-card"><div class="stat-label">Best trade</div><div class="stat-value text-bull">${moneySigned(best)}</div></div>
    <div class="stat-card"><div class="stat-label">Worst trade</div><div class="stat-value text-bear">${moneySigned(worst)}</div></div>
  `;
}

function destroyChart(key){ if(chartRefs[key]){ chartRefs[key].destroy(); chartRefs[key] = null; } }

function renderCharts(trades){
  renderEquityChart(trades);
  renderOutcomesChart(trades);
  renderGradeChart(trades);
  renderStrategyChart(trades);
  renderSymbolChart(trades);
  renderMonthlyChart(trades);
}

function renderEquityChart(trades){
  destroyChart('equity');
  const ctx = document.getElementById('chart-equity');
  const curve = equityCurve(trades, 0);
  chartRefs.equity = new Chart(ctx, {
    type:'line',
    data:{
      labels: curve.map((c,i) => i+1),
      datasets:[{
        data: curve.map(c => c.balance),
        borderColor:'#5B8DEF', backgroundColor:'rgba(91,141,239,.12)',
        fill:true, tension:.25, pointRadius:0, borderWidth:2,
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:true,
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: c => moneySigned(c.parsed.y), title: c => 'Trade #'+c[0].label } } },
      scales:{
        x:{ title:{ display:true, text:'Trade #' }, grid:{ display:false } },
        y:{ ticks:{ callback: v => moneySigned(v) } },
      }
    }
  });
}

function renderOutcomesChart(trades){
  destroyChart('outcomes');
  const ctx = document.getElementById('chart-outcomes');
  const w = wins(trades).length, l = losses(trades).length, be = breakevens(trades).length;
  chartRefs.outcomes = new Chart(ctx, {
    type:'doughnut',
    data:{ labels:['Win','Loss','Breakeven'], datasets:[{ data:[w,l,be], backgroundColor:[BULL,BEAR,'#3A4452'], borderWidth:0 }] },
    options:{ plugins:{ legend:{ position:'bottom' } }, cutout:'62%' }
  });
}

function renderGradeChart(trades){
  destroyChart('grade');
  const ctx = document.getElementById('chart-grade');
  const grades = ['A','B','C','D'];
  const data = grades.map(g => winRate(trades.filter(t => t.grade === g)));
  const counts = grades.map(g => trades.filter(t => t.grade === g).length);
  chartRefs.grade = new Chart(ctx, {
    type:'bar',
    data:{ labels: grades.map(g => g+' setup'), datasets:[{ data, backgroundColor: grades.map(g => GRADE_COLOR[g]), borderRadius:5, maxBarThickness:46 }] },
    options:{
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: c => pct(c.parsed.y,0) + ' win rate · ' + counts[c.dataIndex] + ' trades' } } },
      scales:{ y:{ beginAtZero:true, max:100, ticks:{ callback: v => v+'%' } }, x:{ grid:{ display:false } } }
    }
  });
}

function renderStrategyChart(trades){
  destroyChart('strategy');
  const ctx = document.getElementById('chart-strategy');
  const grouped = groupSum(trades, t => t.strategyId ? (Strategies.get(t.strategyId)?.name || 'Deleted strategy') : 'Discretionary');
  chartRefs.strategy = new Chart(ctx, {
    type:'bar',
    data:{ labels: grouped.map(g => g.key), datasets:[{ data: grouped.map(g => g.pnl), backgroundColor: grouped.map(g => g.pnl>=0?BULL:BEAR), borderRadius:5, maxBarThickness:40 }] },
    options:{
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: c => moneySigned(c.parsed.y) } } },
      scales:{ y:{ ticks:{ callback: v => moneySigned(v) } }, x:{ grid:{ display:false } } }
    }
  });
}

function renderSymbolChart(trades){
  destroyChart('symbol');
  const ctx = document.getElementById('chart-symbol');
  const grouped = groupSum(trades, t => t.symbol || '—').sort((a,b) => b.pnl - a.pnl);
  chartRefs.symbol = new Chart(ctx, {
    type:'bar',
    data:{ labels: grouped.map(g => g.key), datasets:[{ data: grouped.map(g => g.pnl), backgroundColor: grouped.map(g => g.pnl>=0?BULL:BEAR), borderRadius:5, maxBarThickness:40 }] },
    options:{
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: c => moneySigned(c.parsed.y) } } },
      scales:{ y:{ ticks:{ callback: v => moneySigned(v) } }, x:{ grid:{ display:false } } }
    }
  });
}

function renderMonthlyChart(trades){
  destroyChart('monthly');
  const ctx = document.getElementById('chart-monthly');
  const grouped = groupSum(trades, t => monthKey(t.date)).sort((a,b) => a.key.localeCompare(b.key));
  const labels = grouped.map(g => {
    const [y,m] = g.key.split('-');
    return new Date(Number(y), Number(m)-1, 1).toLocaleDateString('en-US', { month:'short', year:'2-digit' });
  });
  chartRefs.monthly = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{ data: grouped.map(g => g.pnl), backgroundColor: grouped.map(g => g.pnl>=0?BULL:BEAR), borderRadius:5, maxBarThickness:46 }] },
    options:{
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: c => moneySigned(c.parsed.y) } } },
      scales:{ y:{ ticks:{ callback: v => moneySigned(v) } }, x:{ grid:{ display:false } } }
    }
  });
}
