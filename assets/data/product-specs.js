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

  // Banding tool — two real models from the spec sheet.
  // Giant Banding Tool specs pending from production; placeholder below.
  var BANDING_TOOL_VARIANTS = [
    { model: 'MBT002', type: 'Manual Banding Tool', cartonDimsCm: '52 × 28 × 18', unitsPerBox: 1, boxesPerCarton: 10, netWeightKg: 18, grossWeightKg: 20, cartonVolumeM3: 0.02621, isGiant: false },
    { model: 'YT003',  type: 'Ratchet Banding Tool (standalone model)', cartonDimsCm: '39 × 39 × 22', unitsPerBox: 1, boxesPerCarton: 10, netWeightKg: 14, grossWeightKg: 16, cartonVolumeM3: 0.03346, isGiant: false }
  ];

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
    variants: STRAP_VARIANTS
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

  var bandingToolFlat = {
    unitsPerBox: '1 pc',
    boxesPerCarton: mostCommonBoxes(BANDING_TOOL_VARIANTS),
    cartonDimsCm: firstDims(BANDING_TOOL_VARIANTS),
    cartonVolumeM3: avg(BANDING_TOOL_VARIANTS.map(function (v) { return v.cartonVolumeM3; })),
    netWeightPerCartonKg: +avg(BANDING_TOOL_VARIANTS.map(function (v) { return v.netWeightKg; })).toFixed(1),
    grossWeightPerCartonKg: +avg(BANDING_TOOL_VARIANTS.map(function (v) { return v.grossWeightKg; })).toFixed(1),
    variants: BANDING_TOOL_VARIANTS
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

    'banding-tool': Object.assign({
      name: 'Banding Tool (Manual / Ratchet; Giant — pending)',
      shortName: 'Banding Tool',
      slug: '/products/banding-tool.html',
      hasVariants: true,
      giantPlaceholder: BANDING_TOOL_GIANT_PLACEHOLDER
    }, bandingToolFlat)
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
