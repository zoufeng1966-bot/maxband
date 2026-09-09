/* ============================================================
 * Maxband Product Specifications
 * Single source of truth for the interactive Carton Estimator
 * and any future page that needs carton/container numbers.
 *
 * Real packing data sourced from internal Excel sheet
 * ("产品包装明细"). Each width/size variant is a row in
 * `variants[]` so the Carton Estimator can offer a separate
 * checkbox + quantity input per SKU (B2B wholesale scenario
 * where a customer frequently orders multiple widths of the
 * same product family in different quantities).
 *
 * Variants are listed SMALLEST → LARGEST by widthMm so the
 * UI renders in physical size order.
 * ============================================================ */

(function () {

  // SS201 Strap ships in ONE of two packaging formats, and the carton
  // dimensions DEPEND on the format:
  //   • Plastic Box with Handle — uniform reusable dispenser box,
  //     one master carton size across all widths (32 × 26 × 36 cm).
  //     The STRAP_VARIANTS rows below ARE this format.
  //   • Paper Box — carton dimensions vary by strap width & thickness
  //     (paper box specs pending from Joe — see STRAP_PACKAGING.paper).
  var STRAP_PACKAGING = {
    active: {
      key: 'plastic-box',
      label: 'Plastic Box with Handle',
      cartonDimsCm: '32 × 26 × 36',
      note: 'Uniform reusable dispenser box — one master carton size across all widths.'
    },
    paper: {
      key: 'paper-box',
      label: 'Paper Box',
      pending: true,
      note: 'Paper box carton dimensions vary by strap width & thickness — pending, to be supplied.'
    }
  };

  // Strap variants — sorted SMALLEST → LARGEST by widthMm.
  // (Source: 产品包装明细.xlsx rows 1–4.)
  var STRAP_VARIANTS = [
    { width: '3/8"', widthMm: 9.5,   thicknessMm: 0.60, lengthPerBox: '30 m', cartonDimsCm: '32 × 26 × 36', boxesPerCarton: 10, netWeightKg: 13.5, grossWeightKg: 14.5, cartonVolumeM3: 0.02995 },
    { width: '1/2"', widthMm: 12.7,  thicknessMm: 0.76, lengthPerBox: '30 m', cartonDimsCm: '32 × 26 × 36', boxesPerCarton: 10, netWeightKg: 23,   grossWeightKg: 24,   cartonVolumeM3: 0.02995 },
    { width: '5/8"', widthMm: 16.0,  thicknessMm: 0.76, lengthPerBox: '30 m', cartonDimsCm: '32 × 26 × 36', boxesPerCarton: 10, netWeightKg: 29,   grossWeightKg: 30,   cartonVolumeM3: 0.02995 },
    { width: '3/4"', widthMm: 19.05, thicknessMm: 0.76, lengthPerBox: '30 m', cartonDimsCm: '32 × 26 × 36', boxesPerCarton: 10, netWeightKg: 34,   grossWeightKg: 35,   cartonVolumeM3: 0.02995 }
  ];

  // Ear Buckle variants — sorted SMALLEST → LARGEST by widthMm.
  // Same 4-width size family as Clip and Screw Lock.
  // (Source: 产品包装明细.xlsx rows 5–8, "钢扣".)
  var EAR_BUCKLE_VARIANTS = [
    { width: '3/8"', widthMm: 9.53,  cartonDimsCm: '28 × 18 × 34', boxesPerCarton: 10, netWeightKg: 3.5, grossWeightKg: 4.5, cartonVolumeM3: 0.01714 },
    { width: '1/2"', widthMm: 12.70, cartonDimsCm: '28 × 18 × 34', boxesPerCarton: 10, netWeightKg: 6.9, grossWeightKg: 8,   cartonVolumeM3: 0.01714 },
    { width: '5/8"', widthMm: 15.88, cartonDimsCm: '28 × 18 × 34', boxesPerCarton: 10, netWeightKg: 7.5, grossWeightKg: 8.5, cartonVolumeM3: 0.01714 },
    { width: '3/4"', widthMm: 19.05, cartonDimsCm: '28 × 18 × 34', boxesPerCarton: 10, netWeightKg: 12,  grossWeightKg: 13,  cartonVolumeM3: 0.01714 }
  ];

  // L 扣 → SS201 Clip — same 4 widths as Ear Buckle for cross-product consistency.
  // Factory still uses L-notation (e.g. "9.5L扣") in source spreadsheet; we keep the
  // factory label in `factoryLabel` for accurate cross-reference, and align the public
  // width label to the ear-buckle family.
  // (Source: 产品包装明细.xlsx rows 11–14.)
  var CLIP_VARIANTS = [
    { width: '3/8"', widthMm: 9.5,   factoryLabel: '9.5L扣',   cartonDimsCm: '28 × 18 × 35', boxesPerCarton: 30, netWeightKg: 5.4, grossWeightKg: 6.4, cartonVolumeM3: 0.01764 },
    { width: '1/2"', widthMm: 12.7,  factoryLabel: '12.70L扣', cartonDimsCm: '28 × 18 × 37', boxesPerCarton: 10, netWeightKg: 4.6, grossWeightKg: 5.6, cartonVolumeM3: 0.01865 },
    { width: '5/8"', widthMm: 15.88, factoryLabel: '15.88L扣', cartonDimsCm: '28 × 18 × 36', boxesPerCarton: 10, netWeightKg: 6.5, grossWeightKg: 7.5, cartonVolumeM3: 0.01814 },
    { width: '3/4"', widthMm: 20,    factoryLabel: '20L扣',    cartonDimsCm: '28 × 18 × 34', boxesPerCarton: 10, netWeightKg: 9.5, grossWeightKg: 10.5, cartonVolumeM3: 0.01714 }
  ];

  // Screw Lock Buckle — same 4 widths as Ear Buckle / Clip.
  // Carton specs are NOT yet in source spreadsheet — to be supplied.
  // Each variant row carries `pending: true` so the estimator renders a per-row
  // "specs pending" badge and the inquiry message flags it for follow-up.
  var SCREW_LOCK_VARIANTS = [
    { width: '3/8"', widthMm: 9.53,  pending: true },
    { width: '1/2"', widthMm: 12.70, pending: true },
    { width: '5/8"', widthMm: 15.88, pending: true },
    { width: '3/4"', widthMm: 19.05, pending: true }
  ];
  var SCREW_LOCK_PLACEHOLDER = {
    pending: true,
    note: 'Screw Lock Buckle carton specs are pending — to be supplied before next quotation cycle.'
  };

  // Banding tools — three lines:
  //   • banding-tool-manual  → MBT002  Manual Banding Tool (real data)
  //   • banding-tool-ratchet → YT003   Ratchet Banding Tool, standalone (real data)
  //   • banding-tool-giant   → 特大号打包机 Giant Banding Tool (real data, was pending)
  // (Source: 产品包装明细.xlsx rows 9, 10, 15.)

  function avg(arr) {
    if (!arr.length) return 0;
    return arr.reduce(function (s, v) { return s + v; }, 0) / arr.length;
  }
  function firstDims(variants) {
    return variants.length ? variants[0].cartonDimsCm : '';
  }
  function mostCommonBoxes(variants) {
    var tally = {};
    variants.forEach(function (v) { tally[v.boxesPerCarton] = (tally[v.boxesPerCarton] || 0) + 1; });
    var best = 0, bestN = -1;
    Object.keys(tally).forEach(function (k) {
      if (tally[k] > bestN) { best = +k; bestN = tally[k]; }
    });
    return best;
  }

  var strapFlat = {
    unitsPerBox: '30 m',
    boxesPerCarton: mostCommonBoxes(STRAP_VARIANTS),
    cartonDimsCm: firstDims(STRAP_VARIANTS),
    cartonVolumeM3: avg(STRAP_VARIANTS.map(function (v) { return v.cartonVolumeM3; })),
    netWeightPerCartonKg: +avg(STRAP_VARIANTS.map(function (v) { return v.netWeightKg; })).toFixed(1),
    grossWeightPerCartonKg: +avg(STRAP_VARIANTS.map(function (v) { return v.grossWeightKg; })).toFixed(1),
    variants: STRAP_VARIANTS,
    packaging: STRAP_PACKAGING
  };

  var earBuckleFlat = {
    unitsPerBox: '100 pcs',
    boxesPerCarton: mostCommonBoxes(EAR_BUCKLE_VARIANTS),
    cartonDimsCm: firstDims(EAR_BUCKLE_VARIANTS),
    cartonVolumeM3: avg(EAR_BUCKLE_VARIANTS.map(function (v) { return v.cartonVolumeM3; })),
    netWeightPerCartonKg: +avg(EAR_BUCKLE_VARIANTS.map(function (v) { return v.netWeightKg; })).toFixed(1),
    grossWeightPerCartonKg: +avg(EAR_BUCKLE_VARIANTS.map(function (v) { return v.grossWeightKg; })).toFixed(1),
    variants: EAR_BUCKLE_VARIANTS
  };

  var clipFlat = {
    unitsPerBox: '100 pcs',
    boxesPerCarton: mostCommonBoxes(CLIP_VARIANTS),
    cartonDimsCm: firstDims(CLIP_VARIANTS),
    cartonVolumeM3: avg(CLIP_VARIANTS.map(function (v) { return v.cartonVolumeM3; })),
    netWeightPerCartonKg: +avg(CLIP_VARIANTS.map(function (v) { return v.netWeightKg; })).toFixed(1),
    grossWeightPerCartonKg: +avg(CLIP_VARIANTS.map(function (v) { return v.grossWeightKg; })).toFixed(1),
    variants: CLIP_VARIANTS,
    variantNote: 'Note: the smallest size (3/8") ships 30 boxes per master carton to optimize container utilization.'
  };

  var screwLockFlat = {
    unitsPerBox: '100 pcs',
    boxesPerCarton: 10,
    cartonDimsCm: 'pending',
    cartonVolumeM3: 0.026,
    netWeightPerCartonKg: 8.0,
    grossWeightPerCartonKg: 8.8,
    variants: SCREW_LOCK_VARIANTS
  };

  var bandingToolManualFlat = {
    unitsPerBox: '1 pc',
    boxesPerCarton: 10,
    cartonDimsCm: '52 × 28 × 18',
    cartonVolumeM3: 0.02621,
    netWeightPerCartonKg: 18,
    grossWeightPerCartonKg: 20,
    variants: [
      { model: 'MBT002', type: 'Manual Banding Tool', cartonDimsCm: '52 × 28 × 18', unitsPerBox: 1, boxesPerCarton: 10, netWeightKg: 18, grossWeightKg: 20, cartonVolumeM3: 0.02621, isGiant: false }
    ]
  };

  var bandingToolRatchetFlat = {
    unitsPerBox: '1 pc',
    boxesPerCarton: 10,
    cartonDimsCm: '39 × 39 × 22',
    cartonVolumeM3: 0.03346,
    netWeightPerCartonKg: 14,
    grossWeightPerCartonKg: 16,
    variants: [
      { model: 'YT003', type: 'Ratchet Banding Tool (standalone model)', cartonDimsCm: '39 × 39 × 22', unitsPerBox: 1, boxesPerCarton: 10, netWeightKg: 14, grossWeightKg: 16, cartonVolumeM3: 0.03346, isGiant: false }
    ]
  };

  // Giant banding tool — was previously pending; now real data from Excel:
  //   51 × 32 × 21 cm · 8 pcs/ctn · net 23.5 kg · gross 24 kg
  var bandingToolGiantFlat = {
    unitsPerBox: '1 pc',
    boxesPerCarton: 8,
    cartonDimsCm: '51 × 32 × 21',
    cartonVolumeM3: 0.03427,
    netWeightPerCartonKg: 23.5,
    grossWeightPerCartonKg: 24,
    variants: [
      { model: '特大号打包机', modelEn: 'Giant Banding Tool', cartonDimsCm: '51 × 32 × 21', unitsPerBox: 1, boxesPerCarton: 8, netWeightKg: 23.5, grossWeightKg: 24, cartonVolumeM3: 0.03427, isGiant: true }
    ]
  };

  window.MAXXBAND_SPECS = {
    'strap': Object.assign({
      name: 'SS201 Stainless Steel Strap',
      shortName: 'SS201 Strap',
      slug: '/products/strap.html',
      hasVariants: true
    }, strapFlat),

    'ear-buckle': Object.assign({
      name: 'SS201 Stainless Steel Ear Buckle',
      shortName: 'SS201 Ear Buckle',
      slug: '/products/ear-buckle.html',
      hasVariants: true
    }, earBuckleFlat),

    'clip': Object.assign({
      name: 'SS201 Stainless Steel Clip (L Buckle)',
      shortName: 'SS201 Clip',
      slug: '/products/clip.html',
      hasVariants: true
    }, clipFlat),

    'screw-lock': Object.assign({
      name: 'SS201 Stainless Steel Screw Lock Buckle',
      shortName: 'SS201 Screw Lock',
      slug: '/products/screw-lock.html',
      hasVariants: true
    }, screwLockFlat, { placeholder: SCREW_LOCK_PLACEHOLDER }),

    'banding-tool-manual': Object.assign({
      name: 'Maxband Manual Banding Tool',
      shortName: 'Banding Tool — Manual (MBT002)',
      slug: '/products/banding-tool.html',
      hasVariants: true
    }, bandingToolManualFlat),

    'banding-tool-ratchet': Object.assign({
      name: 'Maxband Ratchet Banding Tool',
      shortName: 'Banding Tool — Ratchet (YT003)',
      slug: '/products/banding-tool.html',
      hasVariants: true
    }, bandingToolRatchetFlat),

    'banding-tool-giant': Object.assign({
      name: 'Maxband Giant Banding Tool',
      shortName: 'Banding Tool — Giant',
      slug: '/products/banding-tool.html',
      hasVariants: true
    }, bandingToolGiantFlat)
  };

  /* Container payload limits — ISO maritime standard figures
   *
   * Source: ISO 668:2020 (Series 1 freight containers — Classification,
   * dimensions and ratings). Practical safe-payload values reflect real
   * operational limits, not theoretical maximums:
   *
   *   20'GP (22G1) — max gross 30,480 kg, tare ~2,300 kg
   *                  → theoretical payload 28,180 kg
   *                  → practical safe payload 21,500 kg
   *                    (capped by road-haul axle-weight law in most lanes,
   *                     VGM verification ±5% / 1 t tolerance, and typical
   *                     shipping-line tariff — Maersk / MSC / COSCO use
   *                     21,500 kg as the working payload figure)
   *                  → practical usable volume 28 m³
   *                    (33.1 m³ nominal − 10–15% stowage / pallet loss)
   *
   *   40'HQ (45G1) — max gross 32,500 kg, tare ~3,900 kg
   *                  → theoretical payload 28,600 kg
   *                  → practical safe payload 26,500 kg
   *                  → practical usable volume 65 m³
   *                    (76.0 m³ nominal − 10–15% stowage / pallet loss)
   *
   * Over-declaring payload invites heavy overload surcharges and
   * "no VGM, no load" refusal under SOLAS 2016.
   */
  window.MAXXBAND_CONTAINERS = {
    '20GP': {
      label: "20' GP (Standard)",
      volumeM3: 28,
      payloadKg: 21500
    },
    '40HQ': {
      label: "40' HQ (High Cube)",
      volumeM3: 65,
      payloadKg: 26500
    }
  };

})();