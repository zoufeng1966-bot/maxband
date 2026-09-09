/* ============================================================
 * Maxband Product Specifications
 * Single source of truth for the interactive Carton Estimator
 * and any future page that needs carton/container numbers.
 *
 * Real packing data sourced from internal Excel specs sheet
 * ("Product Packaging Specs"). Per-SKU rows are kept in
 * `variants[]` so product detail pages render real tables.
 * Top-level numeric fields are aggregate values used by
 * the Carton Estimator (average across variants).
 * ============================================================ */

(function () {

  // SS201 Strap ships in ONE of two packaging formats, and the carton
  // dimensions DEPEND on the format:
  //   • Plastic Box with Handle (reusable dispenser) — one uniform plastic box
  //     size across all widths, so the master carton is identical for every width.
  //     The STRAP_VARIANTS rows below ARE this format (carton 32 × 26 × 36, uniform).
  //   • Paper Box — carton dimensions vary by strap width & thickness.
  //     (Paper box carton specs pending from Joe — see STRAP_PACKAGING.paper.)
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

  var STRAP_VARIANTS = [
    { width: '1/2"', widthMm: 12.7,  thicknessMm: 0.76, lengthPerBox: '30 m', cartonDimsCm: '32 × 26 × 36', boxesPerCarton: 10, netWeightKg: 23,  grossWeightKg: 24,   cartonVolumeM3: 0.02995 },
    { width: '5/8"', widthMm: 16.0,  thicknessMm: 0.76, lengthPerBox: '30 m', cartonDimsCm: '32 × 26 × 36', boxesPerCarton: 10, netWeightKg: 29,  grossWeightKg: 30,   cartonVolumeM3: 0.02995 },
    { width: '3/4"', widthMm: 19.05, thicknessMm: 0.76, lengthPerBox: '30 m', cartonDimsCm: '32 × 26 × 36', boxesPerCarton: 10, netWeightKg: 34,  grossWeightKg: 35,   cartonVolumeM3: 0.02995 },
    { width: '3/8"', widthMm: 9.5,   thicknessMm: 0.60, lengthPerBox: '30 m', cartonDimsCm: '32 × 26 × 36', boxesPerCarton: 10, netWeightKg: 13.5, grossWeightKg: 14.5, cartonVolumeM3: 0.02995 }
  ];

  var EAR_BUCKLE_VARIANTS = [
    { width: '3/8"', widthMm: 9.53,  cartonDimsCm: '28 × 18 × 34', boxesPerCarton: 10, netWeightKg: 3.5, grossWeightKg: 4.5, cartonVolumeM3: 0.01714 },
    { width: '1/2"', widthMm: 12.70, cartonDimsCm: '28 × 18 × 34', boxesPerCarton: 10, netWeightKg: 6.9, grossWeightKg: 8,   cartonVolumeM3: 0.01714 },
    { width: '5/8"', widthMm: 15.88, cartonDimsCm: '28 × 18 × 34', boxesPerCarton: 10, netWeightKg: 7.5, grossWeightKg: 8.5, cartonVolumeM3: 0.01714 },
    { width: '3/4"', widthMm: 19.05, cartonDimsCm: '28 × 18 × 34', boxesPerCarton: 10, netWeightKg: 12,  grossWeightKg: 13,  cartonVolumeM3: 0.01714 }
  ];

  // L 扣 → SS201 Clip
  var CLIP_VARIANTS = [
    { sizeLabel: '9.5L',  sizeMm: 9.5,  cartonDimsCm: '28 × 18 × 35', boxesPerCarton: 30, netWeightKg: 5.4, grossWeightKg: 6.4, cartonVolumeM3: 0.01764 },
    { sizeLabel: '12.70L', sizeMm: 12.70, cartonDimsCm: '28 × 18 × 37', boxesPerCarton: 10, netWeightKg: 4.6, grossWeightKg: 5.6, cartonVolumeM3: 0.01865 },
    { sizeLabel: '15.88L', sizeMm: 15.88, cartonDimsCm: '28 × 18 × 36', boxesPerCarton: 10, netWeightKg: 6.5, grossWeightKg: 7.5, cartonVolumeM3: 0.01814 },
    { sizeLabel: '20L',   sizeMm: 20,   cartonDimsCm: '28 × 18 × 34', boxesPerCarton: 10, netWeightKg: 9.5, grossWeightKg: 10.5, cartonVolumeM3: 0.01714 }
  ];

  // Screw Lock Buckle — packaging data still pending from Joe (no rows in source spreadsheet).
  // Placeholders kept so the page renders; marked clearly to the buyer.
  var SCREW_LOCK_PLACEHOLDER = {
    pending: true,
    note: 'Screw Lock Buckle carton specs are pending — to be supplied before next quotation cycle.'
  };

  // Banding tool — split into three pricing/variant lines (2026-Q3):
  //   • banding-tool-manual  → MBT002  Manual Banding Tool (real data)
  //   • banding-tool-ratchet → YT003   Ratchet Banding Tool, standalone (real data)
  //   • banding-tool-giant   → Giant Banding Tool (carton specs pending)

  var BANDING_TOOL_GIANT_PLACEHOLDER = {
    pending: true,
    note: 'Giant Banding Tool carton specs pending production confirmation — to be supplied before next quotation cycle.'
  };

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
    variantNote: 'Note: the smallest size (9.5L) ships 30 boxes per master carton to optimize container utilization.'
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

  var bandingToolGiantFlat = {
    unitsPerBox: '1 pc',
    boxesPerCarton: 5,
    cartonDimsCm: 'pending',
    cartonVolumeM3: 0.045,
    netWeightPerCartonKg: 28,
    grossWeightPerCartonKg: 30,
    placeholder: BANDING_TOOL_GIANT_PLACEHOLDER
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

    'screw-lock': {
      name: 'SS201 Stainless Steel Screw Lock Buckle',
      shortName: 'SS201 Screw Lock',
      unitsPerBox: '100 pcs',
      boxesPerCarton: 10,
      cartonDimsCm: 'pending',
      cartonVolumeM3: 0.026,
      netWeightPerCartonKg: 8.0,
      grossWeightPerCartonKg: 8.8,
      slug: '/products/screw-lock.html',
      hasVariants: false,
      placeholder: SCREW_LOCK_PLACEHOLDER
    },

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
      hasVariants: false
    }, bandingToolGiantFlat)
  };

  /* Container payload limits — ISO maritime standard figures */
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
