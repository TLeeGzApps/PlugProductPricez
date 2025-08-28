(()=>{
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const fmt = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
  const GRAMS_PER_OUNCE = 28.349523125;
  const OUNCES_PER_POUND = 16;
  const GRAMS_PER_POUND = GRAMS_PER_OUNCE * OUNCES_PER_POUND;

  // Theme
  const themeToggle = $('#themeToggle');
  themeToggle.addEventListener('click', ()=>{
    const root = document.documentElement;
    const current = root.getAttribute('data-theme') || 'light';
    root.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
    localStorage.setItem('pc_theme', root.getAttribute('data-theme'));
  });
  // Load theme
  (function(){
    const saved = localStorage.getItem('pc_theme');
    if(saved) document.documentElement.setAttribute('data-theme', saved);
  })();

  // Helpers
  function toGrams(value, unit){
    if(unit==='g') return value;
    if(unit==='oz') return value * GRAMS_PER_OUNCE;
    if(unit==='lb') return value * GRAMS_PER_POUND;
    return NaN;
  }
  function valid(n){ return typeof n==='number' && !Number.isNaN(n) && Number.isFinite(n); }

  // UI elements
  const inputs = {
    totalCost: $('#totalCost'),
    productWeight: $('#productWeight'),
    weightUnit: $('#weightUnit'),
    pGram: $('#pGram'), pBall: $('#pBall'), pQuarter: $('#pQuarter'),
    pHalf: $('#pHalf'), pZip: $('#pZip'), pElbow: $('#pElbow'),
    applyAll: $('#applyAll'), applyAllBtn: $('#applyAllBtn'),
  };
  const errCost = $('#errCost');
  const errWeight = $('#errWeight');

  const calcBtn = $('#calcBtn');
  const saveBtn = $('#saveBtn');
  const clearBtn = $('#clearBtn');
  const exportCurrent = $('#exportCurrent');
  const resultsCard = $('#resultsCard');
  const results = $('#results');
  const historyTableBody = $('#historyTable tbody');

  const printBtn = $('#printBtn');
  printBtn.addEventListener('click', ()=> window.print());

  // Apply-all profits
  inputs.applyAllBtn.addEventListener('click', ()=>{
    const v = parseFloat(inputs.applyAll.value);
    if(!valid(v) || v < 0) return;
    inputs.pGram.value = v.toString();
    inputs.pBall.value = v.toString();
    inputs.pQuarter.value = v.toString();
    inputs.pHalf.value = v.toString();
    inputs.pZip.value = v.toString();
  });

  // Calculate
  calcBtn.addEventListener('click', ()=>{
    errCost.textContent=''; errWeight.textContent='';
    const totalCost = parseFloat(inputs.totalCost.value);
    const weightRaw = parseFloat(inputs.productWeight.value);
    const unit = inputs.weightUnit.value;
    if(!valid(totalCost) || totalCost <= 0){ errCost.textContent='Enter a total cost greater than 0.'; return; }
    if(!valid(weightRaw) || weightRaw <= 0){ errWeight.textContent='Enter a product weight greater than 0.'; return; }

    const grams = toGrams(weightRaw, unit);
    const ounces = grams / GRAMS_PER_OUNCE;
    const costPerGram = totalCost / grams;

    const profit = {
      gram: parseFloat(inputs.pGram.value)||0,
      ball: parseFloat(inputs.pBall.value)||0,
      quarter: parseFloat(inputs.pQuarter.value)||0,
      half: parseFloat(inputs.pHalf.value)||0,
      zip: parseFloat(inputs.pZip.value)||0,
      elbow: parseFloat(inputs.pElbow.value)||0,
    };

    function block(label, gramsForUnit, profitVal){
      const cost = costPerGram * gramsForUnit;
      const sell = cost + profitVal;
      return `<div class="result result-card">
        <h3>${label}</h3>
        <p>Cost: ${fmt.format(cost)}</p>
        <p>Sell: ${fmt.format(sell)}</p>
      </div>`;
    }

    const parts = [];
    parts.push(`<div class="result result-card"><h3>Spent</h3><p>${fmt.format(totalCost)}</p></div>`);
    parts.push(`<div class="result result-card"><h3>Product</h3><p>${grams.toFixed(2)} g | ${ounces.toFixed(2)} oz</p></div>`);
    parts.push(block('1 Gram', 1, profit.gram));
    parts.push(block('Ball (3.5 g)', 3.5, profit.ball));
    parts.push(block('Quarter (0.25 oz)', GRAMS_PER_OUNCE*0.25, profit.quarter));
    parts.push(block('Half (0.5 oz)', GRAMS_PER_OUNCE*0.5, profit.half));
    parts.push(block('Zip (1 oz)', GRAMS_PER_OUNCE, profit.zip));
    parts.push(block('Elbow (1 lb)', GRAMS_PER_POUND, profit.elbow));

    results.innerHTML = parts.join('');
    resultsCard.hidden = false;
    exportCurrent.disabled = false;
    saveBtn.disabled = false;

    // Stash latest for export
    window._pc_current = {
      timestamp: new Date().toISOString(),
      totalCost, grams, ounces, unit,
      costPerGram,
      profit,
      rows: [
        ['1 gram', costPerGram*1, costPerGram*1 + profit.gram],
        ['Ball (3.5g)', costPerGram*3.5, costPerGram*3.5 + profit.ball],
        ['Quarter (0.25 oz)', costPerGram*GRAMS_PER_OUNCE*0.25, costPerGram*GRAMS_PER_OUNCE*0.25 + profit.quarter],
        ['Half (0.5 oz)', costPerGram*GRAMS_PER_OUNCE*0.5, costPerGram*GRAMS_PER_OUNCE*0.5 + profit.half],
        ['Zip (1 oz)', costPerGram*GRAMS_PER_OUNCE, costPerGram*GRAMS_PER_OUNCE + profit.zip],
        ['Elbow (1 lb)', costPerGram*GRAMS_PER_POUND, costPerGram*GRAMS_PER_POUND + profit.elbow],
      ]
    };
  });

  // Clear
  clearBtn.addEventListener('click', ()=>{
    resultsCard.hidden = true;
    results.innerHTML = '';
    exportCurrent.disabled = true;
    saveBtn.disabled = true;
  });

  // CSV current
  exportCurrent.addEventListener('click', ()=>{
    const d = window._pc_current; if(!d) return;
    let csv = 'Category,Cost,Sell\n';
    d.rows.forEach(r=>{ csv += `${r[0]},${r[1].toFixed(2)},${r[2].toFixed(2)}\n`; });
    downloadCSV(csv, 'current_results.csv');
  });

  // History: load & render
  function loadHistory(){
    try {
      const raw = localStorage.getItem('pc_history');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function saveHistory(arr){
    localStorage.setItem('pc_history', JSON.stringify(arr));
  }
  function renderHistory(){
    const history = loadHistory();
    historyTableBody.innerHTML = history.map(h=>{
      const date = new Date(h.timestamp).toLocaleString();
      const wt = `${h.grams.toFixed(2)} g (${(h.grams/GRAMS_PER_OUNCE).toFixed(2)} oz)`;
      const notes = `Profits: g:${h.profit.gram} b:${h.profit.ball} q:${h.profit.quarter} h:${h.profit.half} z:${h.profit.zip} lb:${h.profit.elbow}`;
      return `<tr>
        <td>${date}</td>
        <td>${fmt.format(h.totalCost)}</td>
        <td>${wt}</td>
        <td>${h.unit}</td>
        <td>${fmt.format(h.costPerGram)}</td>
        <td>${notes}</td>
      </tr>`;
    }).join('');
  }
  renderHistory();

  // Save to history
  saveBtn.addEventListener('click', ()=>{
    const cur = window._pc_current; if(!cur) return;
    const history = loadHistory();
    history.unshift(cur);
    // keep last 100
    if(history.length > 100) history.length = 100;
    saveHistory(history);
    renderHistory();
    saveBtn.disabled = true;
  });

  // Export history
  $('#exportHistory').addEventListener('click', ()=>{
    const history = loadHistory();
    let csv = 'Date,Spent,Grams,Ounces,Unit,CostPerGram,Profit_g,Profit_ball,Profit_quarter,Profit_half,Profit_zip,Profit_elbow\n';
    history.forEach(h=>{
      const date = new Date(h.timestamp).toISOString();
      csv += `${date},${h.totalCost.toFixed(2)},${h.grams.toFixed(2)},${(h.grams/GRAMS_PER_OUNCE).toFixed(2)},${h.unit},${h.costPerGram.toFixed(4)},${h.profit.gram},${h.profit.ball},${h.profit.quarter},${h.profit.half},${h.profit.zip},${h.profit.elbow}\n`;
    });
    downloadCSV(csv, 'history.csv');
  });

  // Clear history
  $('#clearHistory').addEventListener('click', ()=>{
    if(confirm('Clear all saved history?')){
      localStorage.removeItem('pc_history');
      renderHistory();
    }
  });

  // CSV helper
  function downloadCSV(content, filename){
    const blob = new Blob([content], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // Restore theme early (already handled) and done.
})();
