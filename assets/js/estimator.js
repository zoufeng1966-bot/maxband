/* ============================================================
 * Maxband Carton Estimator — per-variant rows (B2B wholesale)
 *
 * Each variant (width/size) of a product gets its own row with its
 * own checkbox + boxes input, so a buyer can independently select
 * and quantity different widths within the same product family
 * (e.g. SS201 Strap: 3/8"-200 boxes, 1/2"-100 boxes, 5/8"-400 boxes,
 * 3/4"-500 boxes — all in one inquiry).
 *
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
    if (!product) return { unitPrice: 0, tierLabel: '—', perUnit: '', moqBoxes: 0, baseUnitPrice: 0 };
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

  /* -------- Build product groups (one product → N variant rows) -------- */
  const productGroups = []; // [{ key, product, rows: [{ variantIdx, variant }] }]
  Object.keys(specs).forEach((key) => {
    const p = specs[key];
    const group = { key, product: p, rows: [] };
    if (p.hasVariants && p.variants && p.variants.length > 0) {
      p.variants.forEach((v, idx) => {
        group.rows.push({ variantIdx: idx, variant: v });
      });
    } else {
      group.rows.push({ variantIdx: null, variant: null });
    }
    productGroups.push(group);
  });

  /* -------- UI rendering -------- */
  const productListEl = document.getElementById('product-list');
  if (!productListEl) return;

  productGroups.forEach(({ key, product: p, rows }) => {
    const isMultiVariant = rows.length > 1;
    const hasHeader = isMultiVariant || !!p.packaging || !!(p.placeholder && p.placeholder.pending);

    const groupEl = document.createElement('div');
    groupEl.className = 'est-product-group';
    groupEl.dataset.product = key;

    /* Group header (product name, units, packaging, pending note) */
    if (hasHeader) {
      const headerEl = document.createElement('div');
      headerEl.className = 'est-product-group-header';
      let metaBits = [`${p.unitsPerBox} per box`];
      if (isMultiVariant) metaBits.push(`${rows.length} sizes available`);
      headerEl.innerHTML = `
        <div class="est-product-group-name">${p.shortName}</div>
        <div class="est-product-group-meta">${metaBits.join(' · ')}</div>
        ${p.packaging ? `
          <div class="est-packaging">
            <span class="est-packaging-label">Packaging:</span>
            <span>${p.packaging.active.label} &mdash; ${p.packaging.active.note}</span>
            ${p.packaging.paper && p.packaging.paper.pending ? `<span class="est-packaging-pending">&middot; ${p.packaging.paper.label} specs pending</span>` : ''}
          </div>
        ` : ''}
        ${p.variantNote ? `<div class="est-variant-note">${p.variantNote}</div>` : ''}
        ${(p.placeholder && p.placeholder.pending) ? `<div class="est-product-group-pending">&#9888; ${p.placeholder.note}</div>` : ''}
      `;
      groupEl.appendChild(headerEl);
    }

    /* Variant rows */
    rows.forEach(({ variantIdx, variant: v }) => {
      let variantLabel, variantMeta;
      if (v) {
        variantLabel = v.width || v.factoryLabel || v.model || ('Variant ' + ((variantIdx || 0) + 1));
        const parts = [];
        if (v.factoryLabel && v.width && v.factoryLabel !== v.width) parts.push(v.factoryLabel);
        if (v.thicknessMm) parts.push(v.thicknessMm + 'mm thick');
        if (v.lengthPerBox) parts.push(v.lengthPerBox + ' per box');
        if (!v.lengthPerBox && p.unitsPerBox && (!v.unitsPerBox || v.unitsPerBox === 1)) parts.push(p.unitsPerBox + ' per box');
        const bpc = v.boxesPerCarton || p.boxesPerCarton;
        if (bpc) parts.push(bpc + ' boxes/ctn');
        variantMeta = parts.join(' · ');
      } else {
        variantLabel = p.shortName;
        variantMeta = `${p.unitsPerBox} per box · ${p.boxesPerCarton} boxes/ctn`;
      }

      const pz = priceList.products[key];
      const unitPrice = pz ? pz.unitPrice : 0;
      const perUnit = pz ? pz.perUnit : '';
      const moq = pz ? pz.moqBoxes : 0;

      const row = document.createElement('div');
      row.className = 'est-row';
      row.dataset.product = key;
      if (variantIdx !== null) row.dataset.variantIdx = String(variantIdx);
      if (v && v.pending) row.dataset.pending = '1';

      const variantAttr = variantIdx !== null ? ` data-variant-idx="${variantIdx}"` : '';

      row.innerHTML = `
        <div class="est-row-main">
          <label class="est-checkbox">
            <input type="checkbox" data-product="${key}"${variantAttr} />
            <span class="est-row-name">${variantLabel}</span>
          </label>
          <div class="est-row-meta">
            ${variantMeta}
            ${pz ? ` &middot; <strong>${priceList.currency} ${unitPrice.toFixed(2)}</strong> / ${perUnit}` : ''}
          </div>
          ${moq > 0 ? `<div class="est-row-moq" data-role="moq-tag">MOQ: <span data-role="moq-num">${moq}</span> boxes</div>` : ''}
          ${(v && v.pending) ? `<div class="est-row-pending" data-role="pending-tag">Carton specs pending</div>` : ''}
        </div>
        <div class="est-row-input">
          <input type="number" min="0" step="10" placeholder="0"
                 data-product="${key}"${variantAttr} data-role="boxes"
                 disabled />
          <span class="est-row-unit">boxes</span>
        </div>
        <div class="est-row-derived" data-role="derived">
          <span class="derived-empty">&mdash;</span>
        </div>
      `;
      groupEl.appendChild(row);
    });

    productListEl.appendChild(groupEl);
  });

  /* -------- Event wiring -------- */
  function inputForRow(rowEl) {
    return rowEl.querySelector('input[data-role="boxes"]');
  }
  function checkboxForRow(rowEl) {
    return rowEl.querySelector('input[type="checkbox"]');
  }

  productListEl.addEventListener('change', (e) => {
    const key = e.target.dataset.product;
    if (!key) return;
    const rowEl = e.target.closest('.est-row');
    if (!rowEl) return;
    const input = inputForRow(rowEl);
    if (e.target.type === 'checkbox') {
      if (e.target.checked) {
        input.disabled = false;
        input.focus();
      } else {
        input.value = '';
        input.disabled = true;
      }
    }
    recompute();
  });

  productListEl.addEventListener('input', (e) => {
    if (e.target.dataset.role === 'boxes') recompute();
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    productListEl.querySelectorAll('input[type="checkbox"]').forEach((c) => { c.checked = false; });
    productListEl.querySelectorAll('input[data-role="boxes"]').forEach((i) => { i.value = ''; i.disabled = true; });
    productListEl.querySelectorAll('.est-row').forEach((r) => r.classList.remove('row-moq-warn', 'row-pending-warn'));
    recompute();
  });

  /* -------- Core computation (per-row, aggregates to totals) -------- */
  function recompute() {
    const selected = [];
    let totalCartons = 0, totalVolume = 0, totalNet = 0, totalGross = 0, totalSubtotal = 0;
    const moqViolations = [];

    productListEl.querySelectorAll('.est-row').forEach((rowEl) => {
      const key = rowEl.dataset.product;
      const variantIdxStr = rowEl.dataset.variantIdx;
      const variantIdx = variantIdxStr !== undefined ? parseInt(variantIdxStr, 10) : null;
      const p = specs[key];
      const checkbox = checkboxForRow(rowEl);
      const input = inputForRow(rowEl);
      const derivedEl = rowEl.querySelector('[data-role="derived"]');

      if (!checkbox.checked) {
        derivedEl.innerHTML = '<span class="derived-empty">&mdash;</span>';
        rowEl.classList.remove('row-moq-warn', 'row-pending-warn');
        return;
      }

      // Resolve effective spec — variant if available, else top-level fallback
      let eff, variantLabel;
      if (variantIdx !== null && p.variants && p.variants[variantIdx]) {
        const v = p.variants[variantIdx];
        if (v.pending) {
          // Pending variant: use top-level aggregate defaults, flag in UI/message
          eff = {
            boxesPerCarton: p.boxesPerCarton || 10,
            cartonDimsCm: p.cartonDimsCm,
            cartonVolumeM3: p.cartonVolumeM3,
            netWeightPerCartonKg: p.netWeightPerCartonKg,
            grossWeightPerCartonKg: p.grossWeightPerCartonKg,
            pending: true
          };
        } else {
          eff = {
            boxesPerCarton: v.boxesPerCarton,
            cartonDimsCm: v.cartonDimsCm,
            cartonVolumeM3: v.cartonVolumeM3,
            netWeightPerCartonKg: v.netWeightKg,
            grossWeightPerCartonKg: v.grossWeightKg
          };
        }
        variantLabel = v.width || v.factoryLabel || v.model || '';
      } else if (p.variants && p.variants.length === 1) {
        const v = p.variants[0];
        eff = {
          boxesPerCarton: v.boxesPerCarton,
          cartonDimsCm: v.cartonDimsCm,
          cartonVolumeM3: v.cartonVolumeM3,
          netWeightPerCartonKg: v.netWeightKg,
          grossWeightPerCartonKg: v.grossWeightKg
        };
        variantLabel = v.model || v.factoryLabel || '';
      } else {
        eff = {
          boxesPerCarton: p.boxesPerCarton,
          cartonDimsCm: p.cartonDimsCm,
          cartonVolumeM3: p.cartonVolumeM3,
          netWeightPerCartonKg: p.netWeightPerCartonKg,
          grossWeightPerCartonKg: p.grossWeightPerCartonKg
        };
        variantLabel = '';
      }

      const boxes = Math.max(0, parseInt(input.value, 10) || 0);
      const cartons = boxes > 0 ? Math.ceil(boxes / eff.boxesPerCarton) : 0;
      const volume = cartons * eff.cartonVolumeM3;
      const net = cartons * eff.netWeightPerCartonKg;
      const gross = cartons * eff.grossWeightPerCartonKg;
      const tier = tierPrice(key, boxes);
      const subtotal = boxes * tier.unitPrice;

      totalCartons += cartons;
      totalVolume += volume;
      totalNet += net;
      totalGross += gross;
      totalSubtotal += subtotal;

      let moqWarn = false;
      if (tier.moqBoxes > 0 && boxes > 0 && boxes < tier.moqBoxes) {
        moqViolations.push({ key, name: p.shortName, variantLabel, boxes, moq: tier.moqBoxes });
        rowEl.classList.add('row-moq-warn');
        moqWarn = true;
      } else {
        rowEl.classList.remove('row-moq-warn');
      }
      if (eff.pending) {
        rowEl.classList.add('row-pending-warn');
      } else {
        rowEl.classList.remove('row-pending-warn');
      }

      // Derived display
      if (boxes === 0) {
        derivedEl.innerHTML = '<span class="derived-empty">0 cartons</span>';
      } else if (eff.pending) {
        derivedEl.innerHTML = `
          <div class="derived-num">${cartons} ctn <span class="derived-pending-tag">preliminary</span></div>
          <div class="derived-sub">~${volume.toFixed(3)} m³ &middot; ~${gross.toFixed(1)} kg</div>
          ${priceList.products[key] ? `<div class="derived-price">${priceList.currency} ${subtotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>` : ''}
        `;
      } else {
        derivedEl.innerHTML = `
          <div class="derived-num">${cartons} ctn</div>
          <div class="derived-sub">${volume.toFixed(3)} m³ &middot; ${gross.toFixed(1)} kg</div>
          ${priceList.products[key] ? `<div class="derived-price">${priceList.currency} ${subtotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          <div class="derived-tier">${tier.tierLabel}</div>` : ''}
        `;
      }

      selected.push({
        key,
        name: p.shortName,
        variantLabel,
        boxes,
        boxesPerCarton: eff.boxesPerCarton,
        unitsPerBox: p.unitsPerBox,
        cartons,
        volume,
        net,
        gross,
        unitPrice: tier.unitPrice,
        perUnit: tier.perUnit,
        subtotal,
        moqBoxes: tier.moqBoxes,
        belowMoq: moqWarn,
        pendingSpec: !!eff.pending,
        tierLabel: tier.tierLabel
      });
    });

    renderSummary(selected, { totalCartons, totalVolume, totalNet, totalGross, totalSubtotal }, moqViolations);
  }

  /* -------- Group selected rows by product for summary / inquiry -------- */
  function groupByProduct(selected) {
    const map = {};
    selected.forEach((s) => {
      if (!map[s.key]) map[s.key] = { name: s.name, items: [] };
      map[s.key].items.push(s);
    });
    return map;
  }

  /* -------- Summary rendering -------- */
  function renderSummary(selected, totals, moqViolations) {
    const emptyEl = document.getElementById('summary-empty');
    const bodyEl = document.getElementById('summary-body');
    if (totals.totalCartons === 0) {
      emptyEl.style.display = '';
      bodyEl.hidden = true;
      return;
    }
    emptyEl.style.display = 'none';
    bodyEl.hidden = false;

    // Per-product breakdown (grouped)
    const breakdownEl = document.getElementById('summary-breakdown');
    const byProduct = groupByProduct(selected);
    const groupKeys = Object.keys(byProduct);

    breakdownEl.innerHTML = groupKeys.map((gKey) => {
      const { name, items } = byProduct[gKey];
      return `
        <div class="breakdown-group">
          <div class="breakdown-group-name">${name}</div>
          ${items.map((s) => `
            <div class="breakdown-row${s.belowMoq ? ' breakdown-warn' : ''}${s.pendingSpec ? ' breakdown-pending' : ''}">
              <div class="breakdown-detail">
                ${s.variantLabel ? `<strong>${s.variantLabel}</strong> &middot; ` : ''}${s.boxes.toLocaleString()} boxes × ${s.unitsPerBox} &rarr; <strong>${s.cartons}</strong> cartons &middot; ${s.volume.toFixed(3)} m³ &middot; ${s.gross.toFixed(1)} kg${s.pendingSpec ? ' <span class="preliminary-pill">preliminary</span>' : ''}
                ${priceList.products[s.key] ? `<br>Unit ${priceList.currency} ${s.unitPrice.toFixed(2)} / ${s.perUnit} &middot; <strong>Subtotal ${priceList.currency} ${s.subtotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</strong>` : ''}
                ${s.belowMoq ? `<br><span class="warn-text">MOQ is ${s.moqBoxes} boxes &mdash; you selected ${s.boxes}. We'll still quote, but lead time may be longer.</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');

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
            <ul>${moqViolations.map((v) => `<li><strong>${v.name}${v.variantLabel ? ' — ' + v.variantLabel : ''}</strong>: ${v.boxes} boxes (MOQ is ${v.moq} boxes)</li>`).join('')}</ul>
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

  /* -------- Container fit visualization (volume + weight, side-by-side) -------- */
  function renderContainerFit(totals) {
    const fitEl = document.getElementById('container-fit');
    const vol = totals.totalVolume;
    const wt = totals.totalGross;
    const blocks = [
      { key: '20GP', label: "20' GP", volumeM3: 28, payloadKg: 21500 },
      { key: '40HQ', label: "40' HQ", volumeM3: 65, payloadKg: 26500 }
    ];

    fitEl.innerHTML = blocks.map((c) => {
      const volPct = (vol / c.volumeM3) * 100;
      const wtPct = (wt / c.payloadKg) * 100;
      const binding = Math.max(volPct, wtPct);
      const overClass = binding > 100 ? 'bar-over' : '';
      const volClass = volPct >= wtPct && volPct > 100 ? 'bar-over' : (volPct >= wtPct && binding > 80 ? 'bar-binding' : '');
      const wtClass = wtPct > volPct && wtPct > 100 ? 'bar-over' : (wtPct > volPct && binding > 80 ? 'bar-binding' : '');
      const cap = `${c.volumeM3} m³ · ${c.payloadKg.toLocaleString()} kg payload`;
      return `
        <div class="container-block">
          <div class="container-head">
            <span>${c.label} &nbsp·&nbsp; ${cap}</span>
            <span>${binding > 100 ? '<strong>OVER CAPACITY</strong>' : 'fits both'}</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">Volume</span>
            <div class="bar-track"><div class="bar-fill ${volClass}" style="width:${Math.min(100, volPct)}%;"></div></div>
            <span class="bar-pct">${volPct.toFixed(1)}%</span>
          </div>
          <div class="bar-row">
            <span class="bar-label">Weight</span>
            <div class="bar-track"><div class="bar-fill ${wtClass}" style="width:${Math.min(100, wtPct)}%;"></div></div>
            <span class="bar-pct">${wtPct.toFixed(1)}%</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /* -------- Shipping mode recommendation (volume AND weight aware) -------- */
  function renderRecommendation(totals) {
    const recEl = document.getElementById('recommendation');
    const vol = totals.totalVolume;
    const wt = totals.totalGross;

    // Container descriptors in order: smallest first
    const containers = [
      { key: '20GP', label: "20' GP",        volumeM3: 28, payloadKg: 21500, fullLabel: "FCL — Full 20' GP container" },
      { key: '40HQ', label: "40' HQ (HC)",    volumeM3: 65, payloadKg: 26500, fullLabel: "FCL — Full 40' HQ container" }
    ];

    let label, detail, cls, warn = '';

    // Parcel: small AND light (DHL/FedEx/UPS international express)
    if (vol < 2 && wt < 200) {
      label = 'Parcel (DHL / FedEx / UPS)';
      detail = `Small enough to ship by international express — door-to-door in 3–7 days, ~${wt.toFixed(0)} kg.`;
      cls = 'rec-parcel';
    }
    // LCL: fits in a shared container by both volume and weight
    else if (vol < 15 && wt < 15000) {
      label = 'LCL — Less than Container Load';
      detail = `Volume and weight suit LCL ocean freight. You pay per m³ or per chargeable weight (m³ × 1,000 kg, whichever is greater); ship when container is full or by deadline.`;
      cls = 'rec-lcl';
    }
    // FCL: pick smallest container that fits BOTH volume and weight
    else {
      const c = containers.find((c) => vol <= c.volumeM3 && wt <= c.payloadKg);
      if (c) {
        const volPct = (vol / c.volumeM3 * 100);
        const wtPct = (wt / c.payloadKg * 100);
        const prev = containers[containers.indexOf(c) - 1];
        // Was there a smaller container that would have fit if not for weight?
        const steppedUpForWeight = prev && vol <= prev.volumeM3 && wt > prev.payloadKg;
        if (steppedUpForWeight) {
          detail = `Volume (${vol.toFixed(2)} m³) fits a ${prev.label}, but weight (${wt.toFixed(0)} kg) exceeds its ${prev.payloadKg.toLocaleString()} kg payload. Step up to ${c.label}: ${volPct.toFixed(1)}% volume, ${wtPct.toFixed(1)}% weight utilization.`;
        } else {
          detail = `A single ${c.label} fits your shipment with ${volPct.toFixed(1)}% volume and ${wtPct.toFixed(1)}% weight utilization.`;
        }
        // Highlight the binding constraint
        if (wtPct > volPct) {
          warn = `<p class="rec-warn">⚠️ Weight-bound: weight utilization (${wtPct.toFixed(0)}%) exceeds volume utilization (${volPct.toFixed(0)}%). This container is constrained by payload, not cube.</p>`;
        } else if (volPct > wtPct) {
          warn = `<p class="rec-warn">⚠️ Cube-bound: volume utilization (${volPct.toFixed(0)}%) exceeds weight utilization (${wtPct.toFixed(0)}%). Container has spare payload.</p>`;
        }
        label = c.fullLabel;
        cls = 'rec-fcl';
      } else {
        // Doesn't fit any single container — multi-container
        const n40 = Math.max(
          Math.ceil(vol / containers[1].volumeM3),
          Math.ceil(wt / containers[1].payloadKg)
        );
        const totalVolCap = n40 * containers[1].volumeM3;
        const totalWtCap = n40 * containers[1].payloadKg;
        label = n40 === 1 ? 'Multiple containers required' : `Multiple containers required — ${n40}× 40' HQ`;
        detail = `Total ${vol.toFixed(2)} m³ · ${wt.toFixed(0)} kg. Needs ${n40}× 40'HQ (combined capacity ${totalVolCap} m³ / ${totalWtCap.toLocaleString()} kg). ${wt > containers[1].payloadKg ? 'Weight is the binding constraint — split evenly across containers to stay under each payload limit.' : ''}`.trim();
        cls = 'rec-multi';
      }
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

  /* -------- Inquiry message construction (grouped by product) -------- */
  function buildMessage(selected, totals, moqViolations) {
    const lines = [];
    lines.push('Hello Maxband,');
    lines.push('');
    lines.push('I used your online estimator to draft this inquiry. Please send a quotation confirming FOB / CIF price, lead time, and payment terms.');
    lines.push('');

    if (moqViolations.length > 0) {
      lines.push('Note: One or more line items are below MOQ — please confirm feasibility.');
      lines.push('');
    }

    const pendingItems = selected.filter((s) => s.pendingSpec);
    if (pendingItems.length > 0) {
      const names = [...new Set(pendingItems.map((p) => p.name))].join(', ');
      lines.push('Note: Carton & shipping specs for ' + names + ' are still pending internal confirmation. Carton volume / weight shown for those items are preliminary placeholders — final figures will be confirmed at quotation.');
      lines.push('');
    }

    lines.push('━━━ Order Summary ━━━');
    lines.push('');

    const byProduct = groupByProduct(selected);
    Object.keys(byProduct).forEach((gKey) => {
      const { name, items } = byProduct[gKey];
      lines.push(`▸ ${name}`);
      items.forEach((s) => {
        const variantPart = s.variantLabel ? ` (${s.variantLabel})` : '';
        const pendingTag = s.pendingSpec ? '  [preliminary carton specs]' : '';
        const moqTag = s.belowMoq ? '  [below MOQ]' : '';
        lines.push(`    • ${s.variantLabel || '—'}${variantPart}${moqTag}${pendingTag}`);
        lines.push(`      ${s.boxes.toLocaleString()} boxes × ${s.unitsPerBox} → ${s.cartons} export carton(s)`);
        lines.push(`      ${s.volume.toFixed(3)} m³ · ${s.gross.toFixed(1)} kg (gross)${s.pendingSpec ? ' — preliminary' : ''}`);
        if (priceList.products[s.key]) {
          lines.push(`      Unit ${priceList.currency} ${s.unitPrice.toFixed(2)} / ${s.perUnit}`);
          lines.push(`      Subtotal ${priceList.currency} ${s.subtotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`);
        }
        lines.push('');
      });
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
    const vol = totals.totalVolume;
    const wt = totals.totalGross;
    if (vol < 2 && wt < 200) return 'Parcel (DHL/FedEx/UPS)';
    if (vol < 15 && wt < 15000) return 'LCL';
    // FCL: smallest container that fits BOTH volume and weight
    if (vol <= containers['20GP'].volumeM3 && wt <= containers['20GP'].payloadKg) return "FCL 20'GP";
    if (vol <= containers['40HQ'].volumeM3 && wt <= containers['40HQ'].payloadKg) return "FCL 40'HQ";
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

  /* -------- Re-read totals from DOM (for clipboard action) -------- */
  function readCurrentTotals() {
    let totalCartons = 0, totalVolume = 0, totalNet = 0, totalGross = 0, totalSubtotal = 0;
    const selected = [];
    const moqViolations = [];
    productListEl.querySelectorAll('.est-row').forEach((rowEl) => {
      const key = rowEl.dataset.product;
      const variantIdxStr = rowEl.dataset.variantIdx;
      const variantIdx = variantIdxStr !== undefined ? parseInt(variantIdxStr, 10) : null;
      const p = specs[key];
      const checkbox = checkboxForRow(rowEl);
      const input = inputForRow(rowEl);
      if (!checkbox.checked) return;

      let eff, variantLabel;
      if (variantIdx !== null && p.variants && p.variants[variantIdx]) {
        const v = p.variants[variantIdx];
        if (v.pending) {
          eff = {
            boxesPerCarton: p.boxesPerCarton || 10,
            cartonDimsCm: p.cartonDimsCm,
            cartonVolumeM3: p.cartonVolumeM3,
            netWeightPerCartonKg: p.netWeightPerCartonKg,
            grossWeightPerCartonKg: p.grossWeightPerCartonKg,
            pending: true
          };
        } else {
          eff = {
            boxesPerCarton: v.boxesPerCarton,
            cartonDimsCm: v.cartonDimsCm,
            cartonVolumeM3: v.cartonVolumeM3,
            netWeightPerCartonKg: v.netWeightKg,
            grossWeightPerCartonKg: v.grossWeightKg
          };
        }
        variantLabel = v.width || v.factoryLabel || v.model || '';
      } else if (p.variants && p.variants.length === 1) {
        const v = p.variants[0];
        eff = {
          boxesPerCarton: v.boxesPerCarton,
          cartonDimsCm: v.cartonDimsCm,
          cartonVolumeM3: v.cartonVolumeM3,
          netWeightPerCartonKg: v.netWeightKg,
          grossWeightPerCartonKg: v.grossWeightKg
        };
        variantLabel = v.model || v.factoryLabel || '';
      } else {
        eff = {
          boxesPerCarton: p.boxesPerCarton,
          cartonDimsCm: p.cartonDimsCm,
          cartonVolumeM3: p.cartonVolumeM3,
          netWeightPerCartonKg: p.netWeightPerCartonKg,
          grossWeightPerCartonKg: p.grossWeightPerCartonKg
        };
        variantLabel = '';
      }

      const boxes = Math.max(0, parseInt(input.value, 10) || 0);
      const cartons = boxes > 0 ? Math.ceil(boxes / eff.boxesPerCarton) : 0;
      const volume = cartons * eff.cartonVolumeM3;
      const net = cartons * eff.netWeightPerCartonKg;
      const gross = cartons * eff.grossWeightPerCartonKg;
      const tier = tierPrice(key, boxes);
      const subtotal = boxes * tier.unitPrice;
      totalCartons += cartons;
      totalVolume += volume;
      totalNet += net;
      totalGross += gross;
      totalSubtotal += subtotal;
      if (tier.moqBoxes > 0 && boxes > 0 && boxes < tier.moqBoxes) {
        moqViolations.push({ key, name: p.shortName, variantLabel, boxes, moq: tier.moqBoxes });
      }
      selected.push({
        key, name: p.shortName, variantLabel,
        boxes, boxesPerCarton: eff.boxesPerCarton, unitsPerBox: p.unitsPerBox,
        cartons, volume, net, gross,
        unitPrice: tier.unitPrice, perUnit: tier.perUnit, subtotal,
        moqBoxes: tier.moqBoxes,
        belowMoq: tier.moqBoxes > 0 && boxes > 0 && boxes < tier.moqBoxes,
        pendingSpec: !!eff.pending,
        tierLabel: tier.tierLabel
      });
    });
    if (totalCartons === 0) return null;
    return { selected, totals: { totalCartons, totalVolume, totalNet, totalGross, totalSubtotal }, moqViolations };
  }
})();