/* ============================================================
 * Maxband Admin — Price & MOQ Editor
 * Loads /assets/data/price-list.json, renders editable form,
 * generates new JSON + triggers download + clipboard copy.
 * ============================================================ */

(function () {
  'use strict';

  const FORM = document.getElementById('admin-form');
  if (!FORM) return;

  const PRODUCT_KEYS = Object.keys(window.MAXXBAND_SPECS);
  const DISPLAY = window.PRODUCT_DISPLAY;
  const DEFAULT_DATA_URL = '/assets/data/price-list.json';
  const FALLBACK = {
    currency: 'USD',
    validUntil: '2026-12-31',
    incoterm: 'EXW Hangzhou',
    paymentTerms: 'T/T 30% deposit, 70% before shipment',
    leadTimeDays: 25,
    notes: 'Volume discounts available. OEM retail-box printing available on request.',
    products: {}
  };
  // Initialize fallback products with reasonable defaults
  PRODUCT_KEYS.forEach(k => {
    FALLBACK.products[k] = {
      unitPrice: 0,
      perUnit: window.MAXXBAND_SPECS[k].unitsPerBox,
      moqBoxes: 10,
      priceTiers: [{ minBoxes: 0, unitPrice: 0 }]
    };
  });

  let currentData = null;

  /* -------- Load current JSON -------- */
  fetch(DEFAULT_DATA_URL)
    .then(r => r.json())
    .then(data => {
      currentData = stripMeta(data);
      setStatus('loaded — ' + new Date().toLocaleString());
      render();
    })
    .catch(err => {
      console.warn('price-list.json load failed, using fallback', err);
      currentData = JSON.parse(JSON.stringify(FALLBACK));
      setStatus('fallback (price-list.json not reachable)');
      render();
    });

  function setStatus(text) {
    const el = document.getElementById('status-loading');
    if (el) el.textContent = text;
  }

  function stripMeta(obj) {
    const c = JSON.parse(JSON.stringify(obj));
    delete c._comment;
    return c;
  }

  /* -------- Render form -------- */
  function render() {
    document.getElementById('currency').value = currentData.currency || 'USD';
    document.getElementById('validUntil').value = currentData.validUntil || '';
    document.getElementById('incoterm').value = currentData.incoterm || '';
    document.getElementById('paymentTerms').value = currentData.paymentTerms || '';
    document.getElementById('leadTimeDays').value = currentData.leadTimeDays || '';
    document.getElementById('notes').value = currentData.notes || '';

    const container = document.getElementById('products-container');
    container.innerHTML = '';

    PRODUCT_KEYS.forEach(key => {
      const product = currentData.products[key] || { unitPrice: 0, perUnit: '', moqBoxes: 0, priceTiers: [{ minBoxes: 0, unitPrice: 0 }] };
      const block = document.createElement('div');
      block.className = 'product-block';
      block.dataset.product = key;
      block.innerHTML = `
        <h3>${DISPLAY[key] || key}</h3>
        <div class="form-row">
          <label>Base unit price</label>
          <input type="number" step="0.01" min="0" data-field="unitPrice" />
          <div class="helper">Single tier price if no tiers set</div>
        </div>
        <div class="form-row">
          <label>Per unit</label>
          <input type="text" data-field="perUnit" placeholder="box (30 m)" />
          <div class="helper">Display string in estimator</div>
        </div>
        <div class="form-row">
          <label>MOQ (boxes)</label>
          <input type="number" step="1" min="0" data-field="moqBoxes" />
          <div class="helper">Below this count, customer gets a warning</div>
        </div>
        <div class="form-row">
          <label>Volume price tiers</label>
          <div data-role="tiers"></div>
        </div>
      `;
      container.appendChild(block);

      // Populate values
      block.querySelector('[data-field="unitPrice"]').value = product.unitPrice;
      block.querySelector('[data-field="perUnit"]').value = product.perUnit || '';
      block.querySelector('[data-field="moqBoxes"]').value = product.moqBoxes;

      renderTiers(block, product.priceTiers || []);
    });
  }

  function renderTiers(block, tiers) {
    const tiersEl = block.querySelector('[data-role="tiers"]');
    tiersEl.innerHTML = '';

    tiers.forEach((tier, idx) => {
      const row = document.createElement('div');
      row.className = 'tier-block';
      row.innerHTML = `
        <input type="number" min="0" step="1" placeholder="min boxes" data-tier-field="minBoxes" />
        <input type="number" min="0" step="0.01" placeholder="unit price" data-tier-field="unitPrice" />
        <button type="button" class="tier-remove" title="Remove tier">&times;</button>
      `;
      row.querySelector('[data-tier-field="minBoxes"]').value = tier.minBoxes;
      row.querySelector('[data-tier-field="unitPrice"]').value = tier.unitPrice;
      row.querySelector('.tier-remove').addEventListener('click', () => {
        row.remove();
        // Ensure at least one tier remains
        if (!tiersEl.children.length) addTierRow(tiersEl);
      });
      tiersEl.appendChild(row);
    });

    // Ensure at least one tier
    if (!tiersEl.children.length) addTierRow(tiersEl);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'tier-add';
    addBtn.textContent = '+ Add tier';
    addBtn.addEventListener('click', () => addTierRow(tiersEl));
    tiersEl.appendChild(addBtn);
  }

  function addTierRow(tiersEl) {
    const row = document.createElement('div');
    row.className = 'tier-block';
    row.innerHTML = `
      <input type="number" min="0" step="1" placeholder="min boxes" data-tier-field="minBoxes" />
      <input type="number" min="0" step="0.01" placeholder="unit price" data-tier-field="unitPrice" />
      <button type="button" class="tier-remove" title="Remove tier">&times;</button>
    `;
    row.querySelector('.tier-remove').addEventListener('click', () => {
      row.remove();
      if (!tiersEl.querySelector('.tier-block')) addTierRow(tiersEl);
    });
    // Insert before the "Add tier" button if present
    const addBtn = tiersEl.querySelector('.tier-add');
    if (addBtn) tiersEl.insertBefore(row, addBtn);
    else tiersEl.appendChild(row);
  }

  /* -------- Collect form data -------- */
  function collect() {
    const data = {
      currency: document.getElementById('currency').value,
      validUntil: document.getElementById('validUntil').value,
      incoterm: document.getElementById('incoterm').value.trim(),
      paymentTerms: document.getElementById('paymentTerms').value.trim(),
      leadTimeDays: parseInt(document.getElementById('leadTimeDays').value, 10) || 0,
      notes: document.getElementById('notes').value.trim(),
      products: {}
    };

    document.querySelectorAll('.product-block').forEach(block => {
      const key = block.dataset.product;
      const product = {
        unitPrice: parseFloat(block.querySelector('[data-field="unitPrice"]').value) || 0,
        perUnit: block.querySelector('[data-field="perUnit"]').value.trim(),
        moqBoxes: parseInt(block.querySelector('[data-field="moqBoxes"]').value, 10) || 0,
        priceTiers: []
      };
      block.querySelectorAll('.tier-block').forEach(row => {
        const minBoxes = parseInt(row.querySelector('[data-tier-field="minBoxes"]').value, 10);
        const unitPrice = parseFloat(row.querySelector('[data-tier-field="unitPrice"]').value);
        if (!isNaN(minBoxes) && !isNaN(unitPrice) && minBoxes >= 0 && unitPrice >= 0) {
          product.priceTiers.push({ minBoxes, unitPrice });
        }
      });
      // Sort tiers ascending
      product.priceTiers.sort((a, b) => a.minBoxes - b.minBoxes);
      data.products[key] = product;
    });

    return data;
  }

  /* -------- Publish: download JSON -------- */
  document.getElementById('btn-publish').addEventListener('click', () => {
    const data = collect();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `price-list-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    currentData = data;
    showToast(`✓ Downloaded ${a.download} — drop it into assets/data/price-list.json`);
  });

  /* -------- Copy JSON to clipboard -------- */
  document.getElementById('btn-copy').addEventListener('click', async () => {
    const data = collect();
    const json = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      showToast('✓ JSON copied to clipboard — paste into price-list.json');
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = json;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('✓ JSON copied to clipboard'); }
      catch (e2) { showToast('Copy failed — use Download instead'); }
      document.body.removeChild(ta);
    }
  });

  /* -------- Reset to defaults (re-fetch from server) -------- */
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('Discard current edits? Reload from server JSON?')) return;
    fetch(DEFAULT_DATA_URL)
      .then(r => r.json())
      .then(data => {
        currentData = stripMeta(data);
        render();
        showToast('Reloaded from server');
      })
      .catch(err => {
        currentData = JSON.parse(JSON.stringify(FALLBACK));
        render();
        showToast('Reset to fallback defaults');
      });
  });

  /* -------- Toast -------- */
  function showToast(text) {
    const t = document.getElementById('toast');
    t.textContent = text;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
})();