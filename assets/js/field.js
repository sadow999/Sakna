// ==========================================
// FIELD NOTES — map, cross-sections, figures
// All numbers come from the Oct 2026 field reader (Pond Branch / Soldiers Delight).
// ==========================================

(function() {
  const SCHIST = '#2672a3';
  const SERP = '#c27a2c';
  const WATER = '#1d9bd1';
  const NS = 'http://www.w3.org/2000/svg';
  let ready = false;
  let map = null;

  // ---------- shared tooltip ----------
  const tip = document.createElement('div');
  tip.className = 'viz-tip';
  document.body.appendChild(tip);
  function showTip(e, html) {
    tip.innerHTML = html;
    tip.style.display = 'block';
    const pad = 14, r = tip.getBoundingClientRect();
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - pad;
    if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - pad;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }
  function hideTip() { tip.style.display = 'none'; }
  function hover(el, html) {
    el.addEventListener('mousemove', e => showTip(e, typeof html === 'function' ? html() : html));
    el.addEventListener('mouseleave', hideTip);
    el.addEventListener('click', e => showTip(e, typeof html === 'function' ? html() : html));
  }

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  // ==========================================
  // 1. MAP
  // ==========================================
  function haversineKm(a, b) {
    const R = 6371, toR = Math.PI / 180;
    const dLat = (b[0] - a[0]) * toR, dLon = (b[1] - a[1]) * toR;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function initMap() {
    const el = document.getElementById('field-map');
    if (!el || typeof L === 'undefined') {
      if (el) el.innerHTML = '<p class="map-fallback">The map could not load (no connection to the map library).</p>';
      return;
    }
    const oregonRidge = [39.4905, -76.6855];
    const soldiersDelight = [39.4110, -76.8360];

    map = L.map(el, { scrollWheelZoom: false, zoomControl: true });
    const bases = {
      'Map': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }),
      'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Imagery &copy; Esri', maxZoom: 19 }),
      'Terrain': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap', maxZoom: 17 })
    };
    bases['Map'].addTo(map);
    L.control.layers(bases, null, { collapsed: true, position: 'topright' }).addTo(map);
    L.control.scale({ imperial: false }).addTo(map);

    function photoPopup(title, sub, img) {
      return '<div class="map-pop">' + (img ? '<img src="' + img + '" alt="">' : '') +
        '<strong>' + title + '</strong><span>' + sub + '</span></div>';
    }

    // Approximate site areas
    L.circle(oregonRidge, { radius: 1300, color: SCHIST, weight: 2, fillColor: SCHIST, fillOpacity: 0.12, dashArray: '5 5' })
      .addTo(map).bindPopup(photoPopup('Part I · Oregon Ridge Park', 'Pond Branch &amp; Baisman Run on the Loch Raven Schist. Circle shows the approximate area.', 'assets/photos/field/saprolite_cutbank.jpg'));
    L.circle(soldiersDelight, { radius: 1300, color: SERP, weight: 2, fillColor: SERP, fillOpacity: 0.14, dashArray: '5 5' })
      .addTo(map).bindPopup(photoPopup('Part II · Soldiers Delight', 'Serpentine barrens and Druids Run headwaters. Circle shows the approximate area.', 'assets/photos/field/group_soldiers_delight.jpg'));

    // Photo GPS points (from the photos' own location data)
    const gps = [
      { at: [39.50286, -76.67193], title: 'Morning stops · 10:48–10:58', sub: 'Creek crossing and saprolite cutbank. Location from photo GPS.', img: 'assets/photos/field/baisman_run_crossing.jpg' },
      { at: [39.47057, -76.71214], title: 'Midday stops · 12:25–12:52', sub: 'Pipeline right-of-way and forest traverse. Location from photo GPS.', img: 'assets/photos/field/pipeline_corridor.jpg' }
    ];
    gps.forEach(p => {
      L.circleMarker(p.at, { radius: 8, color: '#fff', weight: 2, fillColor: SCHIST, fillOpacity: 1 })
        .addTo(map).bindPopup(photoPopup(p.title, p.sub, p.img));
    });

    // Distance between the two sites
    const km = haversineKm(oregonRidge, soldiersDelight);
    L.polyline([oregonRidge, soldiersDelight], { color: '#1a1612', weight: 2, dashArray: '2 7', opacity: 0.8 }).addTo(map);
    const mid = [(oregonRidge[0] + soldiersDelight[0]) / 2, (oregonRidge[1] + soldiersDelight[1]) / 2];
    L.marker(mid, { interactive: false, icon: L.divIcon({ className: 'map-dist', html: '≈ ' + km.toFixed(0) + ' km', iconSize: [70, 22], iconAnchor: [35, 11] }) }).addTo(map);

    // Context
    L.circleMarker([39.2857, -76.6100], { radius: 5, color: '#1a1612', weight: 1, fillColor: '#fff', fillOpacity: 1 })
      .addTo(map).bindPopup(photoPopup('Baltimore Inner Harbor', 'Built at the Fall Zone, where ships could sail inland and Piedmont streams powered mills.'));

    const all = L.latLngBounds([oregonRidge, soldiersDelight, gps[0].at, gps[1].at]).pad(0.12);
    map.fitBounds(all);

    document.querySelectorAll('[data-map-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-map-view]').forEach(b => b.classList.toggle('active', b === btn));
        const v = btn.dataset.mapView;
        if (v === 'both') map.flyToBounds(all, { duration: 0.8 });
        if (v === 'schist') map.flyTo([39.488, -76.69], 14, { duration: 0.8 });
        if (v === 'serp') map.flyTo(soldiersDelight, 14, { duration: 0.8 });
        if (v === 'region') map.flyTo([39.38, -76.70], 10, { duration: 0.8 });
      });
    });
  }

  // ==========================================
  // 2. CROSS-SECTIONS (same scale for both sites)
  // ==========================================
  const XS = {
    W: 900, H: 330, ml: 54, mr: 18, mt: 34, mb: 36,
    xMax: 354,          // m — ridge to ridge at Pond Branch (2 × 177 m hillslope)
    yTop: 12, yBot: -55 // m relative to the channel
  };

  const SITES = {
    schist: {
      name: 'Pond Branch · Loch Raven Schist',
      color: SCHIST,
      channels: [177], L: 177, relief: 6.7, ripU: 0.085,
      layers: [
        { name: 'Soil', fill: '#5b4330', top: u => 0, bot: u => 0.8,
          info: '<b>Soil</b> · under 1 m. Bioturbated: seismic anisotropy is 0% here.' },
        { name: 'Saprolite', fill: '#cfa77c', top: u => 0.8, bot: u => 3 + 12 * u,
          info: '<b>Saprolite</b> · "rotten rock" up to ~15 m thick under the ridge. Bulk density 1.8 g/cm³, porosity over 20%. Weathered in place: the schist\'s banding survives but it crumbles by hand. Seismic anisotropy peaks here (33%).' },
        { name: 'Fractured, weathered rock', fill: '#a58f79', top: u => 3 + 12 * u, bot: u => 4 + 44 * Math.pow(u, 1.3),
          info: '<b>Fractured, weathered rock</b> · only 2–10 m thick under the valley, over 40 m under the ridge: the "bow-tie". Horizontal tectonic stress (~8.4 MPa) pinches fractures shut under valleys; under ridges they open and let water in deep.' },
        { name: 'Fresh schist', fill: '#6c6762', top: u => 4 + 44 * Math.pow(u, 1.3), bot: u => 80,
          info: '<b>Fresh Loch Raven Schist</b> · seismic velocity above 4 km/s, density 2.7 g/cm³, porosity ~2%. Mica, plagioclase, quartz, and almandine garnet.' }
      ],
      wtDry: u => 0.15 + 10 * Math.pow(u, 1.5),
      wtStorm: u => u < 0.12 ? 0 : 0.1 + 9.6 * Math.pow(u, 1.5),
      satUStorm: 0.12,
      borehole: { x: 14, marks: [
        { d: 5, t: 'Upper 5 m: volumetric strain jumps to +100% (the near-surface expands).' },
        { d: 10.5, t: '10.5 m: plagioclase completely depleted above this depth.' },
        { d: 15, t: '~15 m: sharp iron-oxidation front (garnet breakdown), the base of the saprolite.' },
        { d: 45, t: '45 m: bottom of the 2019 borehole. Still fractured, weathered rock; no fresh bedrock reached.' }
      ] }
    },
    serp: {
      name: 'Soldiers Delight · Serpentinite',
      color: SERP,
      channels: [88, 264], L: 88, relief: 2.9, ripU: 0.05,
      layers: [
        { name: 'Thin soil', fill: '#4d3b2c', top: u => 0, bot: u => 0.3 + 0.5 * u,
          info: '<b>Chrome silt loam</b> · 10–40 cm (≤1 m), much of it wind-blown silt from past cold climates. Ca:Mg below 0.1 at depth; nickel up to 1.9% and chromium 0.6%.' },
        { name: 'Weathered rind', fill: '#8b8f6e', top: u => 0.3 + 0.5 * u, bot: u => 1 + 2 * u,
          info: '<b>Weathered rind</b> · no saprolite. Serpentinite dissolves almost completely (~64% of rock mass leaves in solution), so hard rock sits 1–3 m down. Permeable layer ~0.46 m, transmissivity ~1.1 m²/d.' },
        { name: 'Fresh serpentinite', fill: '#55604f', top: u => 1 + 2 * u, bot: u => 80,
          info: '<b>Antigorite serpentinite</b> · ~86% antigorite, ~11% magnetite (a magnet sticks to it), no quartz. Oceanic mantle that formed ~489 million years ago.' }
      ],
      wtDry: u => 0.25 + 1.4 * u,
      wtStorm: u => u < 0.85 ? 0 : 0.2 * (u - 0.85) / 0.15,
      satUStorm: 0.85
    }
  };

  function siteGeom(site, x) {
    // distance to nearest channel, normalised by hillslope length
    let dist = Infinity;
    site.channels.forEach(c => { dist = Math.min(dist, Math.abs(x - c)); });
    const u = Math.min(1, dist / site.L);
    const v = Math.max(0, (u - site.ripU) / (1 - site.ripU));
    return { u, z: site.relief * Math.sin(Math.PI / 2 * v) };
  }

  function drawSection(svg, key, storm) {
    const site = SITES[key];
    const { W, H, ml, mr, mt, mb, xMax, yTop, yBot } = XS;
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const pw = W - ml - mr, ph = H - mt - mb;
    const sx = x => ml + x / xMax * pw;
    const sy = y => mt + (yTop - y) / (yTop - yBot) * ph;
    const N = 240, xs = [];
    for (let i = 0; i <= N; i++) xs.push(i / N * xMax);

    const defs = svgEl('defs', {}, svg);
    const clip = svgEl('clipPath', { id: 'clip-' + key }, defs);
    svgEl('rect', { x: ml, y: mt, width: pw, height: ph }, clip);
    const g = svgEl('g', { 'clip-path': 'url(#clip-' + key + ')' }, svg);

    // sky
    svgEl('rect', { x: ml, y: mt, width: pw, height: ph, fill: storm ? '#e3e8ec' : '#f4f1ea' }, g);

    // layers
    site.layers.forEach(layer => {
      const top = xs.map(x => { const s = siteGeom(site, x); return [sx(x), sy(s.z - layer.top(s.u))]; });
      const bot = xs.map(x => { const s = siteGeom(site, x); return [sx(x), sy(s.z - layer.bot(s.u))]; }).reverse();
      const d = 'M' + top.concat(bot).map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z';
      const path = svgEl('path', { d, fill: layer.fill, stroke: 'rgba(255,255,255,0.55)', 'stroke-width': 1, class: 'xs-layer' }, g);
      hover(path, layer.info);
    });

    // water table + saturated zone
    const wt = storm ? site.wtStorm : site.wtDry;
    const wtPts = xs.map(x => { const s = siteGeom(site, x); return [sx(x), sy(s.z - wt(s.u))]; });
    const satBot = xs.map(x => { const s = siteGeom(site, x); return [sx(x), sy(yBot)]; }).reverse();
    svgEl('path', { d: 'M' + wtPts.concat(satBot).map(p => p.join(',')).join('L') + 'Z', fill: WATER, opacity: 0.16, 'pointer-events': 'none' }, g);
    const wtLine = svgEl('path', { d: 'M' + wtPts.map(p => p.join(',')).join('L'), fill: 'none', stroke: WATER, 'stroke-width': 2, 'stroke-dasharray': '6 4', class: 'xs-wt' }, g);
    hover(wtLine, key === 'schist'
      ? (storm ? '<b>Water table during a storm</b> · saturation reaches the surface only on the flat riparian strip (~3.7% of the catchment). The hillslopes absorb the rain.'
               : '<b>Water table, dry weather</b> · 10–20 cm below the riparian surface all year, ~10 m deep under the ridge. Rain takes months to reach it there.')
      : (storm ? '<b>Water table during a storm</b> · the thin soil fills up fast and saturation spreads across whole hillslopes.'
               : '<b>Water table, dry weather</b> · perched in the thin soil and rind; little room to store water.'));

    // surface saturation (overland flow) during storm
    if (storm) {
      site.channels.forEach(c => {
        const half = site.satUStorm * site.L;
        const a = Math.max(0, c - half), b = Math.min(xMax, c + half);
        const pts = xs.filter(x => x >= a && x <= b).map(x => [sx(x), sy(siteGeom(site, x).z)]);
        const sat = svgEl('path', { d: 'M' + pts.map(p => p.join(',')).join('L'), fill: 'none', stroke: WATER, 'stroke-width': 5, 'stroke-linecap': 'round', class: 'xs-sat' }, g);
        hover(sat, key === 'schist'
          ? '<b>Saturated riparian strip</b> · direct rain here plus toe-slope return flow explains over 90% of storm quickflow.'
          : '<b>Saturated hillslope</b> · saturation-excess overland flow starts close to the ridges, which is why channels are so closely spaced.');
      });
      // rain
      for (let i = 0; i < 46; i++) {
        const x = ml + (i + 0.5) / 46 * pw;
        svgEl('line', { x1: x, y1: mt + 4 + (i % 3) * 6, x2: x - 4, y2: mt + 16 + (i % 3) * 6, stroke: WATER, 'stroke-width': 1.5, opacity: 0.7, 'pointer-events': 'none' }, g);
      }
    }

    // channels
    site.channels.forEach(c => {
      const ch = svgEl('circle', { cx: sx(c), cy: sy(0), r: 5, fill: WATER, stroke: '#fff', 'stroke-width': 2, class: 'xs-ch' }, g);
      hover(ch, key === 'schist'
        ? '<b>Pond Branch</b> · base flow is ~85–87% of annual runoff; 25 mg/L dissolved solids.'
        : '<b>Druids Run headwater channel</b> · base flow ~63% of runoff; 205 mg/L dissolved solids, Mg-HCO₃ water.');
    });

    // borehole
    if (site.borehole) {
      const bx = site.borehole.x, s0 = siteGeom(site, bx);
      svgEl('line', { x1: sx(bx), y1: sy(s0.z), x2: sx(bx), y2: sy(s0.z - 45), stroke: '#1a1612', 'stroke-width': 2.5 }, g);
      site.borehole.marks.forEach(m => {
        const y = sy(s0.z - m.d);
        const t = svgEl('g', { class: 'xs-bh' }, g);
        svgEl('line', { x1: sx(bx) - 7, y1: y, x2: sx(bx) + 7, y2: y, stroke: '#1a1612', 'stroke-width': 2 }, t);
        svgEl('circle', { cx: sx(bx), cy: y, r: 9, fill: 'transparent' }, t);
        svgEl('text', { x: sx(bx) + 11, y: y + 4, class: 'xs-bh-lbl' }, t).textContent = m.d + ' m';
        hover(t, '<b>2019 ridge borehole</b> · ' + m.t);
      });
      svgEl('text', { x: sx(bx) + 11, y: sy(s0.z) - 6, class: 'xs-lbl-dark' }, svg).textContent = 'Borehole';
    }

    // bow-tie annotation (schist)
    if (key === 'schist') {
      const x0 = 177, s = siteGeom(site, x0);
      svgEl('text', { x: sx(x0), y: sy(s.z - 4) + 16, 'text-anchor': 'middle', class: 'xs-lbl-light' }, g).textContent = 'fresh rock just ~4 m down';
      svgEl('text', { x: sx(300), y: sy(-38), 'text-anchor': 'middle', class: 'xs-lbl-light' }, g).textContent = '…but over 40 m under the ridge';
    }

    if (key === 'serp') {
      svgEl('text', { x: sx(177), y: sy(-25), 'text-anchor': 'middle', class: 'xs-lbl-light' }, g).textContent = 'no saprolite: hard serpentinite just 1–3 m down';
    }

    // axes (recessive)
    const ax = svgEl('g', { class: 'xs-axis' }, svg);
    for (let y = 10; y >= -50; y -= 10) {
      svgEl('line', { x1: ml - 4, y1: sy(y), x2: ml, y2: sy(y) }, ax);
      svgEl('text', { x: ml - 8, y: sy(y) + 3.5, 'text-anchor': 'end' }, ax).textContent = y + ' m';
    }
    for (let x = 0; x <= 350; x += 50) {
      svgEl('line', { x1: sx(x), y1: H - mb, x2: sx(x), y2: H - mb + 4 }, ax);
      svgEl('text', { x: sx(x), y: H - mb + 16, 'text-anchor': 'middle' }, ax).textContent = x;
    }
    svgEl('text', { x: ml + pw, y: H - 4, 'text-anchor': 'end' }, ax).textContent = 'distance across the valley (m)';

    // title
    const ttl = svgEl('text', { x: ml, y: 20, class: 'xs-title' }, svg);
    ttl.textContent = site.name;
    svgEl('rect', { x: ml - 16, y: 10, width: 10, height: 10, rx: 2, fill: site.color }, svg);
  }

  function initSections() {
    const a = document.getElementById('xs-schist'), b = document.getElementById('xs-serp');
    if (!a || !b) return;
    let storm = false;
    const render = () => { drawSection(a, 'schist', storm); drawSection(b, 'serp', storm); };
    document.querySelectorAll('[data-weather]').forEach(btn => {
      btn.addEventListener('click', () => {
        storm = btn.dataset.weather === 'storm';
        document.querySelectorAll('[data-weather]').forEach(x => x.classList.toggle('active', x === btn));
        render();
      });
    });
    // vertical exaggeration, computed from the drawing scale
    const pw = XS.W - XS.ml - XS.mr, ph = XS.H - XS.mt - XS.mb;
    const ve = (ph / (XS.yTop - XS.yBot)) / (pw / XS.xMax);
    const veEl = document.getElementById('xs-ve');
    if (veEl) veEl.textContent = '~' + ve.toFixed(1) + '×';
    render();
  }

  // ==========================================
  // 3. FIGURES
  // ==========================================

  // Fig A — Where Pond Branch storm runoff comes from
  function figRunoff() {
    const svg = document.getElementById('fig-runoff');
    if (!svg) return;
    const W = 640, H = 230, ml = 150, mr = 20, mt = 20;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const pw = W - ml - mr, bh = 46;
    const rows = [
      { label: 'Share of catchment area', segs: [
        { k: 'Riparian strip', v: 3.7, c: WATER },
        { k: 'Swales', v: 1.5, c: '#b8b0a6' },
        { k: 'Hillslopes', v: 94.8, c: '#d9d2c7' } ] },
      { label: 'Share of storm quickflow', segs: [
        { k: 'Riparian strip (direct rain + toe-slope return flow)', v: 90, c: WATER, lbl: '>90%' },
        { k: 'Everything else', v: 10, c: '#d9d2c7', lbl: '<10%' } ] }
    ];
    rows.forEach((r, i) => {
      const y = mt + i * (bh + 54);
      svgEl('text', { x: ml - 12, y: y + bh / 2 + 4, 'text-anchor': 'end', class: 'fig-cat' }, svg).textContent = r.label;
      let x = ml, small = 0;
      r.segs.forEach((s, si) => {
        const last = si === r.segs.length - 1;
        const w = s.v / 100 * pw;
        const rect = svgEl('rect', { x: x + 1, y, width: Math.max(1, w - 2), height: bh, rx: 3, fill: s.c, class: 'fig-mark' }, svg);
        hover(rect, '<b>' + s.k + '</b><br>' + (s.lbl || s.v + '%'));
        if (w > 140) svgEl('text', { x: x + 10, y: y + bh / 2 + 4, class: s.c === WATER ? 'fig-in-dark' : 'fig-in' }, svg).textContent = (s.lbl || s.v + '%') + ' ' + (s.k.split(' (')[0]);
        else {
          const below = small++ % 2 === 1;
          svgEl('text', { x: last ? x + w : x, y: below ? y + bh + 15 : y - 6, 'text-anchor': last ? 'end' : 'start', class: 'fig-val' }, svg).textContent = (s.lbl || s.v + '%') + ' ' + s.k.toLowerCase();
        }
        x += w;
      });
    });
  }

  // Fig B — Storm size vs quickflow (Q ∝ P^a)
  function figScaling() {
    const svg = document.getElementById('fig-scaling');
    if (!svg) return;
    const W = 640, H = 340, ml = 54, mr = 110, mt = 18, mb = 44;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const pw = W - ml - mr, ph = H - mt - mb;
    const xMin = 1, xMax = 3, yMax = 33;
    const sx = x => ml + (x - xMin) / (xMax - xMin) * pw;
    const sy = y => mt + ph - y / yMax * ph;
    const series = [
      { k: 'Pond Branch / Baisman Run', a: 1.89, c: SCHIST },
      { k: 'Soldiers Delight / Druids Run', a: 3.17, c: SERP }
    ];
    const ax = svgEl('g', { class: 'xs-axis' }, svg);
    [0, 5, 10, 15, 20, 25, 30].forEach(y => {
      svgEl('line', { x1: ml, y1: sy(y), x2: ml + pw, y2: sy(y), class: 'fig-gridline' }, ax);
      svgEl('text', { x: ml - 8, y: sy(y) + 3.5, 'text-anchor': 'end' }, ax).textContent = y + '×';
    });
    [1, 1.5, 2, 2.5, 3].forEach(x => {
      svgEl('text', { x: sx(x), y: H - mb + 18, 'text-anchor': 'middle' }, ax).textContent = x + '×';
    });
    svgEl('text', { x: ml + pw / 2, y: H - 6, 'text-anchor': 'middle' }, ax).textContent = 'storm rainfall, relative to a reference storm';
    series.forEach(s => {
      const pts = [];
      for (let i = 0; i <= 80; i++) { const x = xMin + i / 80 * (xMax - xMin); pts.push([sx(x), sy(Math.pow(x, s.a))]); }
      svgEl('path', { d: 'M' + pts.map(p => p.map(n => n.toFixed(1)).join(',')).join('L'), fill: 'none', stroke: s.c, 'stroke-width': 2.5, 'stroke-linecap': 'round' }, svg);
      const end = pts[pts.length - 1];
      svgEl('text', { x: end[0] + 8, y: end[1] + 4, class: 'fig-val' }, svg).textContent = 'a = ' + s.a;
    });
    // crosshair
    const cross = svgEl('line', { y1: mt, y2: mt + ph, class: 'fig-cross', visibility: 'hidden' }, svg);
    const dots = series.map(s => svgEl('circle', { r: 5, fill: s.c, stroke: '#fff', 'stroke-width': 2, visibility: 'hidden' }, svg));
    const hit = svgEl('rect', { x: ml, y: mt, width: pw, height: ph, fill: 'transparent', style: 'cursor:crosshair' }, svg);
    const readout = document.getElementById('fig-scaling-readout');
    function at(x) {
      x = Math.max(xMin, Math.min(xMax, x));
      cross.setAttribute('x1', sx(x)); cross.setAttribute('x2', sx(x)); cross.setAttribute('visibility', 'visible');
      const vals = series.map((s, i) => {
        const y = Math.pow(x, s.a);
        dots[i].setAttribute('cx', sx(x)); dots[i].setAttribute('cy', sy(y)); dots[i].setAttribute('visibility', 'visible');
        return y;
      });
      return { x, vals };
    }
    function html(r) {
      return '<b>' + r.x.toFixed(2) + '× the rain</b><br>' +
        series.map((s, i) => '<span class="tip-sw" style="background:' + s.c + '"></span>' + s.k + ': <b>' + r.vals[i].toFixed(1) + '×</b> quickflow').join('<br>');
    }
    function fromEvent(e) {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      return xMin + (p.x - ml) / pw * (xMax - xMin);
    }
    hit.addEventListener('mousemove', e => showTip(e, html(at(fromEvent(e)))));
    hit.addEventListener('mouseleave', () => { hideTip(); cross.setAttribute('visibility', 'hidden'); dots.forEach(d => d.setAttribute('visibility', 'hidden')); });
    const slider = document.getElementById('fig-scaling-slider');
    function fromSlider() {
      const r = at(parseFloat(slider.value));
      readout.innerHTML = 'A storm <b>' + r.x.toFixed(1) + '×</b> the size makes <b style="color:' + SCHIST + '">' + r.vals[0].toFixed(1) + '×</b> the quickflow at Pond Branch, but <b style="color:' + SERP + '">' + r.vals[1].toFixed(1) + '×</b> at Druids Run.';
    }
    slider.addEventListener('input', fromSlider);
    fromSlider();
  }

  // Fig C — Compare the two sites, one measure at a time
  const MEASURES = [
    { k: 'tds', label: 'Stream dissolved solids', unit: 'mg/L', a: 25, b: 205, note: 'Base-flow total dissolved solids. Serpentinite water is ~8× more mineral-rich.' },
    { k: 'mg', label: 'Magnesium in streams', unit: 'mg/L', a: 0.8, b: 30.3, note: 'Serpentine is a magnesium silicate, so its streams are Mg-HCO₃ type.' },
    { k: 'dissolved', label: 'Rock mass lost in solution', unit: '%', a: 18, b: 64, note: 'Share of the parent rock\'s mass carried away dissolved in stream water.' },
    { k: 'chem', label: 'Chemical share of denudation', unit: '%', a: 50, b: 90, note: 'Both lower at ~2.4 m per million years, but by different means.' },
    { k: 'base', label: 'Base flow share of runoff', unit: '%', a: 86, b: 63, note: 'Pond Branch: ~85–87%. Soldiers Delight: ~63%.' },
    { k: 'perm', label: 'Permeable layer thickness', unit: 'm', a: 4.03, b: 0.46, note: 'From Litwin & Harman (2024) model calibrations.' },
    { k: 'T', label: 'Transmissivity', unit: 'm²/d', a: 3.89, b: 1.12, note: 'How easily water moves through the permeable layer.' },
    { k: 'hl', label: 'Median hillslope length', unit: 'm', a: 177, b: 88, note: 'Shorter hillslopes mean more closely spaced valleys.' }
  ];
  function figCompare() {
    const svg = document.getElementById('fig-compare');
    const tabs = document.getElementById('fig-compare-tabs');
    if (!svg || !tabs) return;
    const W = 1000, H = 150, ml = 230, mr = 110, bh = 32;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const note = document.getElementById('fig-compare-note');
    function draw(m) {
      svg.innerHTML = '';
      const pw = W - ml - mr, max = Math.max(m.a, m.b) * 1.05;
      [{ k: 'Pond Branch (schist)', v: m.a, c: SCHIST }, { k: 'Soldiers Delight (serpentinite)', v: m.b, c: SERP }].forEach((r, i) => {
        const y = 24 + i * (bh + 30);
        svgEl('text', { x: ml - 12, y: y + bh / 2 + 4, 'text-anchor': 'end', class: 'fig-cat' }, svg).textContent = r.k;
        const w = Math.max(3, r.v / max * pw);
        const rect = svgEl('rect', { x: ml, y, width: w, height: bh, rx: 4, fill: r.c, class: 'fig-mark fig-grow' }, svg);
        hover(rect, '<b>' + r.k + '</b><br>' + m.label + ': ' + r.v + ' ' + m.unit);
        svgEl('text', { x: ml + w + 8, y: y + bh / 2 + 5, class: 'fig-val' }, svg).textContent = r.v + ' ' + m.unit;
      });
      svgEl('line', { x1: ml, y1: 14, x2: ml, y2: H - 10, class: 'fig-base' }, svg);
      note.textContent = m.note;
    }
    MEASURES.forEach((m, i) => {
      const b = document.createElement('button');
      b.className = 'viz-btn' + (i === 0 ? ' active' : '');
      b.textContent = m.label;
      b.addEventListener('click', () => {
        tabs.querySelectorAll('.viz-btn').forEach(x => x.classList.toggle('active', x === b));
        draw(m);
      });
      tabs.appendChild(b);
    });
    draw(MEASURES[0]);
  }

  // ==========================================
  window.initField = function() {
    if (ready) { if (map) map.invalidateSize(); return; }
    ready = true;
    initMap();
    initSections();
    figRunoff();
    figScaling();
    figCompare();
    setTimeout(() => { if (map) map.invalidateSize(); }, 300);
  };
})();
