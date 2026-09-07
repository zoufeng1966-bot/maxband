/* ============================================================
 * Maxband Carton Estimator — with pricing & MOQ
 * Reads from window.MAXXBAND_SPECS, window.MAXXBAND_CONTAINERS,
 * window.MAXXBAND_PRICE (loaded via /assets/data/price-list.json)
 * ============================================================ */

(function () {
  'use strict';

  const WHATSAPP_NUMBER = '8613805733952';
  const EMAIL_TO = 'joe@jandj.cc';
  const COMPANY = 'J&J Innovation Co. Ltd.';
  const WEBSITE = 'maxband.cn';

  const specs = window.MAXXBAND_SPECS;
  const containers = window.MAXXBAND_CONTAINERS;
  const priceList = window.MAXXBAND_PRICE || { currency: 'USD', products: {} };

  /* -------- Find tier price for quantity -------- */
  function tierPrice(productKey, boxes) {
    const product = priceList.products[productKey];
    if (!product) return { unitPrice: 0, tierLabel: '—', perUnit: '' };
    const tiers = product.priceTiers && product.priceTiers.length ? product.priceTiers : [{ minBoxes: 0, unitPrice: product.unitPrice }];
    const sorted = [...tiers].sort((a, b) => a.minBoxes - b.minBoxes);
    let chosen = sorted[0];
    let nextAt = null;
    for (let i = 0; i < sorted.length; i++) {
      if (boxes >= sorted[i].minBoxes) {
        chosen = sorted[i];
        if (i + 1 < sorted.length) nextAt = sorted[i + 1];
        else nextAt = null;
      }
    }
    return {
      unitPrice: chosen.unitPrice,
      tierLabel: boxes >= sorted[sorted.length - 1].minBoxes ? 'Volume tier (best)' : (nextAt ? `Tier (next better at ${nextAt.minBoxes} boxes)` : 'Base tier'),
      perUnit: product.perUnit,
      moqBoxes: product.moqBoxes || 0,
      baseUnitPrice: product.unitPrice
    };
  }

  /* -------- UI rendering: product list -------- */
  const productListEl = document.getElementById('product-list');
  if (!productListEl) return;

  Object.keys(specs).forEach((key) => {
    const p = specs[key];
    const pz = priceList.products[key];
    const unitPrice = pz ? pz.unitPrice : 0;
    const perUnit = pz ? pz.perUnit : '';
    const moq = pz ? pz.moqBoxes : 0;

    const row = document.createElement('div');
    row.className = 'est-row';
    row.dataset.product = key;
    row.innerHTML = `
      <div class="est-row-main">
        <label class="est-checkbox">
          <input type="checkbox" data-product="${key}" />
          <span class="est-row-name">${p.shortName}</span>
        </label>
        <div class="est-row-meta">
          ${p.unitsPerBox} per box &middot; ${p.boxesPerCarton} boxes/ctn
          ${pz ? ` &middot; <strong>${priceList.currency} ${unitPrice.toFixed(2)}</strong> / ${perUnit}` : ''}
        </div>
        <div class="est-row-moq" data-role="moq-tag" hidden>
          MOQ: <span data-role="moq-num"></span> boxes
        </div>
        ${p.placeholder && p.placeholder.pending ? `<div class="est-row-pending" data-role="pending-tag">Carton specs pending internal confirmation</div>` : ''}
      </div>
      <div class="est-row-input">
        <input type="number" min="0" step="1" placeholder="0"
               data-product="${key}" data-role="boxes"
               disabled />
        <span class="est-row-unit">boxes</span>
      </div>
      <div class="est-row-derived" data-role="derived">
        <span class="derived-empty">—</span>
      </div>
    `;
    productListEl.appendChild(row);

    if (pz && moq > 0) {
      const tag = row.querySelector('[data-role="moq-tag"]');
      tag.querySelector('[data-role="moq-num"]').textContent = moq;
      tag.hidden = false;
    }
  });

  /* -------- Event wiring -------- */
  productListEl.addEventListener('change', (e) => {
    const key = e.target.dataset.product;
    if (!key) return;
    const checkbox = productListEl.querySelector(`input[type="checkbox"][data-product="${key}"]`);
    const input    = productListEl.querySelector(`input[data-role="boxes"][data-product="${key}"]`);
    if (e.target.type === 'checkbox') {
      input.disabled = !checkbox.checked;
      if (!checkbox.checked) input.value = '';
      input.focus();
      recompute();
    } else if (e.target.dataset.role === 'boxes') {
      recompute();
    }
  });

  productListEl.addEventListener('input', (e) => {
    if (e.target.dataset.role === 'boxes') recompute();
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    productListEl.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    productListEl.querySelectorAll('input[data-role="boxes"]').forEach(i => { i.value = ''; i.disabled = true; });
    recompute();
  });

  /* -------- Core computation -------- */
  function recompute() {
    const selected = [];
    let totalCartons = 0;
    let totalVolume = 0;
    let totalNet = 0;
    let totalGross = 0;
    let totalSubtotal = 0;
    const moqViolations = [];

    Object.keys(specs).forEach((key) => {
      const p = specs[key];
      const checkbox = productListEl.querySelector(`input[type="checkbox"][data-product="${key}"]`);
      const input    = productListEl.querySelector(`input[data-role="boxes"][data-product="${key}"]`);
      const derivedEl = productListEl.querySelector(`.est-row[data-product="${key}"] [data-role="derived"]`);
      const rowEl     = productListEl.querySelector(`.est-row[data-product="${key}"]`);
      if (!checkbox.checked) {
        derivedEl.innerHTML = '<span class="derived-empty">—</span>';
        rowEl.classList.remove('row-moq-warn');
        rowEl.classList.remove('row-pending-warn');
        return;
      }
      const boxes = Math.max(0, parseInt(input.value, 10) || 0);
      if (boxes === 0) {
        derivedEl.innerHTML = '<span class="derived-empty">0 cartons</span>';
        rowEl.classList.remove('row-moq-warn');
        rowEl.classList.remove('row-pending-warn');
        return;
      }
      const cartons = Math.ceil(boxes / p.boxesPerCarton);
      const volume = cartons * p.cartonVolumeM3;
      const net = cartons * p.netWeightPerCartonKg;
      const gross = cartons * p.grossWeightPerCartonKg;
      const tier = tierPrice(key, boxes);
      const subtotal = boxes * tier.unitPrice;

      totalCartons += cartons;
      totalVolume += volume;
      totalNet += net;
      totalGross += gross;
      totalSubtotal += subtotal;

      if (tier.moqBoxes > 0 && boxes < tier.moqBoxes) {
        moqViolations.push({ key, name: p.shortName, boxes, moq: tier.moqBoxes });
        rowEl.classList.add('row-moq-warn');
      } else {
        rowEl.classList.remove('row-moq-warn');
      }
      if (p.placeholder && p.placeholder.pending) {
        rowEl.classList.add('row-pending-warn');
      } else {
        rowEl.classList.remove('row-pending-warn');
      }

      derivedEl.innerHTML = `
        <div class="derived-num">${cartons} ctn</div>
        <div class="derived-sub">${volume.toFixed(3)} m³ &middot; ${gross.toFixed(1)} kg</div>
        ${priceList.products[key] ? `<div class="derived-price">${priceList.currency} ${subtotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        <div class="derived-tier">${tier.tierLabel}</div>` : ''}
      `;

      selected.push({
        key,
        name: p.shortName,
        boxes,
        boxesPerCarton: p.boxesPerCarton,
        unitsPerBox: p.unitsPerBox,
        cartons,
        volume,
        net,
        gross,
        unitPrice: tier.unitPrice,
        perUnit: tier.perUnit,
        subtotal,
        moqBoxes: tier.moqBoxes,
        belowMoq: tier.moqBoxes > 0 && boxes < tier.moqBoxes
      });
    });

    renderSummary(selected, { totalCartons, totalVolume, totalNet, totalGross, totalSubtotal }, moqViolations);
  }

  /* -------- Summary rendering -------- */
  function renderSummary(selected, totals, moqViolations) {
    const emptyEl = document.getElementById('summary-empty');
    const bodyEl  = document.getElementById('summary-body');
    if (totals.totalCartons === 0) {
      emptyEl.style.display = '';
      bodyEl.hidden = true;
      return;
    }
    emptyEl.style.display = 'none';
    bodyEl.hidden = false;

    // Per-product breakdown
    const breakdownEl = document.getElementById('summary-breakdown');
    breakdownEl.innerHTML = selected.map(s => `
      <div class="breakdown-row${s.belowMoq ? ' breakdown-warn' : ''}">
        <div class="breakdown-name">${s.name}${s.belowMoq ? ' <span class="warn-pill">below MOQ</span>' : ''}</div>
        <div class="breakdown-detail">
          ${s.boxes.toLocaleString()} boxes × ${s.unitsPerBox} → <strong>${s.cartons}</strong> cartons &middot; ${s.volume.toFixed(3)} m³ &middot; ${s.gross.toFixed(1)} kg
          ${priceList.products[s.key] ? `<br>Unit ${priceList.currency} ${s.unitPrice.toFixed(2)} / ${s.perUnit} &middot; <strong>Subtotal ${priceList.currency} ${s.subtotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</strong>` : ''}
          ${s.belowMoq ? `<br><span class="warn-text">MOQ is ${s.moqBoxes} boxes &mdash; you selected ${s.boxes}. We'll still quote, but lead time may be longer.</span>` : ''}
        </div>
      </div>
    `).join('');

    // Totals
    document.getElementById('total-cartons').textContent = totals.totalCartons.toLocaleString();
    document.getElementById('total-volume').textContent  = totals.totalVolume.toFixed(3) + ' m³';
    document.getElementById('total-net').textContent     = totals.totalNet.toFixed(1) + ' kg';
    document.getElementById('total-gross').textContent   = totals.totalGross.toFixed(1) + ' kg';
    const subtotalEl = document.getElementById('total-subtotal');
    if (subtotalEl) subtotalEl.textContent = `${priceList.currency} ${totals.totalSubtotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;

    // MOQ warning box
    const moqEl = document.getElementById('moq-warning');
    if (moqEl) {
      if (moqViolations.length > 0) {
        moqEl.hidden = false;
        moqEl.innerHTML = `
          <div class="moq-card">
            <div class="moq-title">⚠️ Below MOQ</div>
            <ul>${moqViolations.map(v => `<li><strong>${v.name}</strong>: ${v.boxes} boxes (MOQ is ${v.moq} boxes)</li>`).join('')}</ul>
            <div class="moq-note">We'll still send a quotation — MOQ is a lead-time / cost guideline, not a hard rule.</div>
          </div>`;
      } else {
        moqEl.hidden = true;
        moqEl.innerHTML = '';
      }
    }

    // Container fit
    renderContainerFit(totals);

    // Recommendation
    renderRecommendation(totals);

    // Inquiry links
    updateInquiryLinks(selected, totals, moqViolations);
  }

  /* -------- Container fit visualization -------- */
  function renderContainerFit(totals) {
    const fitEl = document.getElementById('container-fit');
    const avgCtnVol = totals.totalVolume / Math.max(1, totals.totalCartons);
    const gp20Pct = Math.min(999, (totals.totalVolume / containers['20GP'].volumeM3) * 100);
    const hq40Pct = Math.min(999, (totals.totalVolume / containers['40HQ'].volumeM3) * 100);
    const gp20Fill = Math.floor(containers['20GP'].volumeM3 / avgCtnVol);
    const hq40Fill = Math.floor(containers['40HQ'].volumeM3 / avgCtnVol);

    fitEl.innerHTML = `
      <div class="container-block">
        <div class="container-head">
          <span>20' GP &nbsp·&nbsp; 28 m³</span>
          <span>${gp20Fill} cartons fill (${gp20Pct.toFixed(1)}%)</span>
        </div>
        <div class="bar-track"><div class="bar-fill ${gp20Pct > 100 ? 'bar-over' : ''}" style="width:${Math.min(100, gp20Pct)}%;"></div></div>
      </div>
      <div class="container-block">
        <div class="container-head">
          <span>40' HQ &nbsp·&nbsp; 65 m³</span>
          <span>${hq40Fill} cartons fill (${hq40Pct.toFixed(1)}%)</span>
        </div>
        <div class="bar-track"><div class="bar-fill ${hq40Pct > 100 ? 'bar-over' : ''}" style="width:${Math.min(100, hq40Pct)}%;"></div></div>
      </div>
    `;
  }

  /* -------- Shipping mode recommendation -------- */
  function renderRecommendation(totals) {
    const recEl = document.getElementById('recommendation');
    let label, detail, cls;

    if (totals.totalVolume < 2 && totals.totalGross < 200) {
      label = 'Parcel (DHL / FedEx / UPS)';
      detail = `Small enough to ship by international express — door-to-door in 3–7 days.`;
      cls = 'rec-parcel';
    } else if (totals.totalVolume < 15) {
      label = 'LCL — Less than Container Load';
      detail = `Volume suits LCL ocean freight. You pay per m³, ship when container is full or by deadline.`;
      cls = 'rec-lcl';
    } else if (totals.totalVolume <= containers['20GP'].volumeM3 * 1.05) {
      label = "FCL — Full 20' GP container";
      detail = `A single 20'GP fits your shipment with ~${((totals.totalVolume / containers['20GP'].volumeM3) * 100).toFixed(1)}% volume utilization.`;
      cls = 'rec-fcl';
    } else if (totals.totalVolume <= containers['40HQ'].volumeM3 * 1.05) {
      label = "FCL — Full 40' HQ container";
      detail = `A single 40'HQ fits your shipment with ~${((totals.totalVolume / containers['40HQ'].volumeM3) * 100).toFixed(1)}% volume utilization.`;
      cls = 'rec-fcl';
    } else {
      label = 'Multiple containers required';
      detail = `Your total volume is ${totals.totalVolume.toFixed(2)} m³ — needs multiple FCL containers. Contact us for a freight quote.`;
      cls = 'rec-multi';
    }

    let warn = '';
    if (totals.totalGross > containers['20GP'].payloadKg && totals.totalVolume <= containers['20GP'].volumeM3) {
      warn = `<p class="rec-warn">⚠️ Weight (${totals.totalGross.toFixed(0)} kg) exceeds 20'GP payload (${containers['20GP'].payloadKg.toLocaleString()} kg). Use 40'HQ or split shipment.</p>`;
    }

    recEl.innerHTML = `
      <div class="rec-card ${cls}">
        <div class="rec-label">Recommended shipping mode</div>
        <div class="rec-title">${label}</div>
        <div class="rec-detail">${detail}</div>
        ${warn}
      </div>
    `;
  }

  /* -------- Inquiry message construction -------- */
  function buildMessage(selected, totals, moqViolations) {
    const lines = [];
    lines.push('Hello Maxband,');
    lines.push('');
    lines.push('I used your online estimator to draft this inquiry. Please send a quotation confirming FOB / CIF price, lead time, and payment terms.');
    lines.push('');

    if (moqViolations.length > 0) {
      lines.push('Note: One or more products are below MOQ — please confirm feasibility.');
      lines.push('');
    }

    /* Detect SS201 Screw Lock (packaging specs still pending) */
    const pendingProducts = selected.filter(s => {
      const spec = window.MAXXBAND_SPECS && window.MAXXBAND_SPECS[s.key];
      return spec && spec.placeholder && spec.placeholder.pending;
    });
    if (pendingProducts.length > 0) {
      const names = pendingProducts.map(p => p.name).join(', ');
      lines.push('Note: Carton & shipping specs for ' + names + ' are still pending internal confirmation. Carton volume / weight shown above are preliminary placeholders — final figures will be confirmed at quotation.');
      lines.push('');
    }

    lines.push('━━━ Order Summary ━━━');
    lines.push('');
    selected.forEach(s => {
      lines.push(`• ${s.name}${s.belowMoq ? '  [below MOQ]' : ''}`);
      lines.push(`    ${s.boxes.toLocaleString()} boxes × ${s.unitsPerBox} → ${s.cartons} export carton(s)`);
      lines.push(`    ${s.volume.toFixed(3)} m³ · ${s.gross.toFixed(1)} kg (gross)`);
      if (priceList.products[s.key]) {
        lines.push(`    Unit ${priceList.currency} ${s.unitPrice.toFixed(2)} / ${s.perUnit}`);
        lines.push(`    Subtotal ${priceList.currency} ${s.subtotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`);
      }
      lines.push('');
    });

    lines.push('━━━ Totals ━━━');
    lines.push(`Total cartons : ${totals.totalCartons.toLocaleString()}`);
    lines.push(`Total volume  : ${totals.totalVolume.toFixed(3)} m³`);
    lines.push(`Total gross   : ${totals.totalGross.toFixed(1)} kg`);
    if (Object.keys(priceList.products).length > 0) {
      lines.push(`Estimated subtotal : ${priceList.currency} ${totals.totalSubtotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} ${priceList.incoterm ? '(' + priceList.incoterm + ')' : ''}`);
    }
    lines.push('');
    lines.push(`Recommended mode: ${getRecommendedLabel(totals)}`);
    lines.push('');
    lines.push('Shipping destination: __________________');
    lines.push('Incoterm preferred: __________________');
    lines.push('Target delivery date: __________________');
    lines.push('');
    lines.push(`— Sent from ${WEBSITE} Carton Estimator`);
    return lines.join('\n');
  }

  function getRecommendedLabel(totals) {
    if (totals.totalVolume < 2 && totals.totalGross < 200) return 'Parcel (DHL/FedEx/UPS)';
    if (totals.totalVolume < 15) return 'LCL';
    if (totals.totalVolume <= containers['20GP'].volumeM3 * 1.05) return "FCL 20'GP";
    if (totals.totalVolume <= containers['40HQ'].volumeM3 * 1.05) return "FCL 40'HQ";
    return 'Multiple FCL containers';
  }

  /* -------- Inquiry link updaters -------- */
  function updateInquiryLinks(selected, totals, moqViolations) {
    if (totals.totalCartons === 0) return;
    const msg = buildMessage(selected, totals, moqViolations);

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    document.getElementById('btn-whatsapp').href = waUrl;

    const subject = encodeURIComponent(`Inquiry from ${WEBSITE} Carton Estimator`);
    const mailUrl = `mailto:${EMAIL_TO}?subject=${subject}&body=${encodeURIComponent(msg)}`;
    document.getElementById('btn-email').href = mailUrl;
  }

  /* -------- Copy-to-clipboard -------- */
  document.getElementById('btn-copy').addEventListener('click', async () => {
    const data = readCurrentTotals();
    if (!data) return;
    const msg = buildMessage(data.selected, data.totals, data.moqViolations);
    try {
      await navigator.clipboard.writeText(msg);
      flashCopyBtn('✓ Copied');
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = msg;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); flashCopyBtn('✓ Copied'); }
      catch (e2) { flashCopyBtn('Copy failed'); }
      document.body.removeChild(ta);
    }
  });

  function flashCopyBtn(text) {
    const btn = document.getElementById('btn-copy');
    const span = btn.querySelector('span');
    const original = span.textContent;
    span.textContent = text;
    setTimeout(() => { span.textContent = original; }, 1800);
  }

  function readCurrentTotals() {
    let totalCartons = 0, totalVolume = 0, totalNet = 0, totalGross = 0, totalSubtotal = 0;
    const selected = [];
    const moqViolations = [];
    Object.keys(specs).forEach((key) => {
      const p = specs[key];
      const checkbox = productListEl.querySelector(`input[type="checkbox"][data-product="${key}"]`);
      const input    = productListEl.querySelector(`input[data-role="boxes"][data-product="${key}"]`);
      if (!checkbox.checked) return;
      const boxes = Math.max(0, parseInt(input.value, 10) || 0);
      if (boxes === 0) return;
      const cartons = Math.ceil(boxes / p.boxesPerCarton);
      const volume = cartons * p.cartonVolumeM3;
      const net = cartons * p.netWeightPerCartonKg;
      const gross = cartons * p.grossWeightPerCartonKg;
      const tier = tierPrice(key, boxes);
      const subtotal = boxes * tier.unitPrice;
      totalCartons += cartons;
      totalVolume += volume;
      totalNet += net;
      totalGross += gross;
      totalSubtotal += subtotal;
      if (tier.moqBoxes > 0 && boxes < tier.moqBoxes) {
        moqViolations.push({ key, name: p.shortName, boxes, moq: tier.moqBoxes });
      }
      selected.push({
        key, boxes, boxesPerCarton: p.boxesPerCarton, unitsPerBox: p.unitsPerBox,
        cartons, volume, net, gross,
        unitPrice: tier.unitPrice, perUnit: tier.perUnit, subtotal,
        moqBoxes: tier.moqBoxes,
        belowMoq: tier.moqBoxes > 0 && boxes < tier.moqBoxes
      });
    });
    if (totalCartons === 0) return null;
    return { selected, totals: { totalCartons, totalVolume, totalNet, totalGross, totalSubtotal }, moqViolations };
  }
})();