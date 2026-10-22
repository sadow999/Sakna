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
    const soldiersDelight = [39.4135, -76.8440];
    const pondGauge = [39.48028, -76.68750];   // 39°28'49" N, 76°41'15" W (field reader)
    const druidsOutlet = [39.4171, -76.8523];  // field reader

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
    L.circle(soldiersDelight, { radius: 1700, color: SERP, weight: 2, fillColor: SERP, fillOpacity: 0.14, dashArray: '5 5' })
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

    // Gauged outlets (coordinates from the field reader)
    function gaugeIcon(color) {
      return L.divIcon({ className: '', html: '<div class="map-gauge" style="background:' + color + '"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
    }
    L.marker(pondGauge, { icon: gaugeIcon(SCHIST) }).addTo(map).bindPopup(photoPopup('Pond Branch gauge · USGS 01583570',
      '37 ha forested catchment, the Baltimore Ecosystem Study reference since 1998. First gauged by Cleaves, Godfrey &amp; Bricker in 1964–68.', 'assets/photos/field/pond_branch_weir.jpg'));
    L.marker(druidsOutlet, { icon: gaugeIcon(SERP) }).addTo(map).bindPopup(photoPopup('Druids Run outlet',
      '107 ha serpentinite catchment draining to the Patapsco. Named informally by Litwin &amp; Harman after a local group of druids that meets in the watershed.'));

    // Distance between the two sites
    const km = haversineKm(pondGauge, druidsOutlet);
    L.polyline([pondGauge, druidsOutlet], { color: '#1a1612', weight: 2, dashArray: '2 7', opacity: 0.8 }).addTo(map);
    const mid = [(pondGauge[0] + druidsOutlet[0]) / 2, (pondGauge[1] + druidsOutlet[1]) / 2];
    L.marker(mid, { interactive: false, icon: L.divIcon({ className: 'map-dist', html: '≈ ' + km.toFixed(0) + ' km', iconSize: [70, 22], iconAnchor: [35, 11] }) }).addTo(map);

    // Context
    L.circleMarker([39.2857, -76.6100], { radius: 5, color: '#1a1612', weight: 1, fillColor: '#fff', fillOpacity: 1 })
      .addTo(map).bindPopup(photoPopup('Baltimore Inner Harbor', 'Built at the Fall Zone, where ships could sail inland and Piedmont streams powered mills.'));

    const all = L.latLngBounds([oregonRidge, soldiersDelight, druidsOutlet, gps[0].at, gps[1].at]).pad(0.12);
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
  // Pond Branch follows seismic Line 5 (ridge–valley–ridge in ~240 m, ~20 m relief).
  // Druids Run uses hillslopes half as long and 0.43× the relief (Litwin & Harman 2024 medians).
  // ==========================================
  const XS = {
    W: 900, H: 340, ml: 54, mr: 18, mt: 34, mb: 36,
    xMax: 240,          // m
    yTop: 26, yBot: -50 // m relative to the channel
  };

  // depth (m below the surface) to fast, fresh rock under each weathering model
  const FRESH = {
    bowtie: (u, z) => 6 + 39 * Math.pow(u, 1.2),   // ~6–10 m under the valley, ≥45 m under the ridge
    classic: (u, z) => 8 + 0.5 * z                  // a subdued copy of the surface
  };

  const SITES = {
    schist: {
      name: 'Pond Branch · Loch Raven Schist',
      color: SCHIST,
      channels: [120], L: 120, relief: 22, ripU: 0.1,
      layers: [
        { name: 'Soil', fill: '#5b4330', top: () => 0, bot: () => 1,
          info: '<b>Soil</b> · about 1 m of clay-rich soil. Burrowing, roots and creep have erased the rock fabric: seismic anisotropy is ~0% here.' },
        { name: 'Saprolite', fill: '#cfa77c', top: () => 1, bot: u => 1.5 + 13.5 * u,
          info: '<b>Saprolite</b> · "rotten rock", ~15 m thick under the ridge and thinning to the valley. Its base is a subdued copy of the surface. Bulk density ~1.8 g/cm³, porosity 20–30%. Seismic anisotropy peaks here (29–33%): weathering amplifies the rock\'s fabric. Quartz pegmatite dikes survive as hard ribs.' },
        { name: 'Fractured, weathered rock', fill: '#a58f79', top: u => 1.5 + 13.5 * u, bot: (u, z, m) => FRESH[m](u, z),
          info: () => MODEL === 'bowtie'
            ? '<b>Fractured, weathered rock</b> · the seismic picture: fast rock (>4 km/s) within ~10 m of the valley floor but ~40 m below the ridgetops, a mirror image of the surface. Strong regional compression (~8.4 MPa) keeps fractures shut under valleys; under ridges they open and let water in.'
            : '<b>Fractured, weathered rock</b> · the classic picture (Cleaves et al., 1970): the weathering front as a subdued copy of the land surface. Switch to "Seismic bow-tie" to see what the 2015 survey found.' },
        { name: 'Fresh schist', fill: '#6c6762', top: (u, z, m) => FRESH[m](u, z), bot: () => 120,
          info: '<b>Fresh Loch Raven Schist</b> · ~42% quartz, 24% muscovite, 11% plagioclase, plus biotite, staurolite and garnet. Density ~2.7 g/cm³, porosity ~2%.' }
      ],
      wtDry: u => u < 0.1 ? 0.15 : 0.15 + 11.15 * Math.pow((u - 0.1) / 0.9, 1.4),
      wtStorm: u => u < 0.12 ? 0 : 0.1 + 10.9 * Math.pow((u - 0.12) / 0.88, 1.4),
      satUStorm: 0.12,
      borehole: { x: 6, marks: [
        { d: 5, t: 'Upper ~5 m: volumetric strain reaches about +100%. The near-surface has expanded.' },
        { d: 10.5, t: '10.5 m: sodium and calcium (plagioclase) are almost completely gone above this depth.' },
        { d: 15, t: '~15 m: a sharp garnet iron-oxidation front marks the base of the saprolite.' },
        { d: 45, t: '45 m: bottom of the 2019 borehole. Still weathered rock; fresh bedrock was never reached.' }
      ] }
    },
    serp: {
      name: 'Druids Run · Serpentinite',
      color: SERP,
      channels: [60, 180], L: 60, relief: 9.5, ripU: 0.06,
      layers: [
        { name: 'Thin soil', fill: '#4d3b2c', top: () => 0, bot: u => 0.05 + 0.95 * Math.pow(1 - u, 2),
          info: '<b>Chrome silt loam</b> · as little as 5 cm on ridgetops, ~46 cm A horizon, ~1 m of alluvium in valley bottoms. Much of the silt in the upper ~90 cm blew in on the wind. Ca:Mg is 0.06–0.17 below 16 cm; nickel up to 1.9% and chromium 0.6%.' },
        { name: 'Thin regolith', fill: '#8b8f6e', top: u => 0.05 + 0.95 * Math.pow(1 - u, 2), bot: u => 1.2 + 1.3 * u,
          info: '<b>Thin regolith</b> · no saprolite. Serpentinite dissolves almost completely (~64% of rock mass leaves in solution), so the base of soil and weathered material is within ~1–3 m. Permeable layer ~0.46 m, transmissivity ~1.1 m²/d.' },
        { name: 'Fractured serpentinite', fill: '#6f7a62', top: u => 1.2 + 1.3 * u, bot: u => 2.5 + 3 * u,
          info: '<b>Fractured serpentinite</b> · seismic "bedrock" velocities appear only ~2–6 m down along the 2023 survey line.' },
        { name: 'Fresh serpentinite', fill: '#55604f', top: u => 2.5 + 3 * u, bot: () => 120,
          info: '<b>Antigorite serpentinite</b> · ~86% antigorite and ~11% magnetite (a magnet sticks to it), no quartz. Mantle rock of the Baltimore Mafic Complex, crystallized ~489 million years ago.' }
      ],
      wtDry: u => 0.3 + 1.6 * u,
      wtStorm: u => u < 0.85 ? 0 : 0.2 * (u - 0.85) / 0.15,
      satUStorm: 0.85
    }
  };

  let MODEL = 'bowtie';

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
    const at = (x, fn) => { const s = siteGeom(site, x); return [sx(x), sy(s.z - fn(s.u, s.z, MODEL))]; };
    const line = pts => pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');

    const defs = svgEl('defs', {}, svg);
    const clip = svgEl('clipPath', { id: 'clip-' + key }, defs);
    svgEl('rect', { x: ml, y: mt, width: pw, height: ph }, clip);
    const g = svgEl('g', { 'clip-path': 'url(#clip-' + key + ')' }, svg);

    // sky
    svgEl('rect', { x: ml, y: mt, width: pw, height: ph, fill: storm ? '#e3e8ec' : '#f4f1ea' }, g);

    // layers
    site.layers.forEach(layer => {
      const top = xs.map(x => at(x, layer.top));
      const bot = xs.map(x => at(x, layer.bot)).reverse();
      const path = svgEl('path', { d: 'M' + line(top.concat(bot)) + 'Z', fill: layer.fill, stroke: 'rgba(255,255,255,0.55)', 'stroke-width': 1, class: 'xs-layer' }, g);
      hover(path, layer.info);
    });

    // water table + saturated zone
    const wt = storm ? site.wtStorm : site.wtDry;
    const wtPts = xs.map(x => at(x, wt));
    const satBot = xs.map(x => [sx(x), sy(yBot)]).reverse();
    svgEl('path', { d: 'M' + line(wtPts.concat(satBot)) + 'Z', fill: WATER, opacity: 0.16, 'pointer-events': 'none' }, g);
    const wtLine = svgEl('path', { d: 'M' + line(wtPts), fill: 'none', stroke: WATER, 'stroke-width': 2, 'stroke-dasharray': '6 4', class: 'xs-wt' }, g);
    hover(wtLine, key === 'schist'
      ? (storm ? '<b>Water table during a storm</b> · saturation reaches the surface only on the flat riparian strip (~3.7% of the catchment). The hillslopes soak up the rain.'
               : '<b>Water table, dry weather</b> · ~11.3 m below the ridge, ~1.3 m below the toe of the slope, and at the surface in the riparian zone. Even in the 2016 drought it was only ~20 cm below the valley floor.')
      : (storm ? '<b>Water table during a storm</b> · the thin soil fills fast and saturation spreads across whole hillslopes. At ~100 mm of rain nearly all of Druids Run contributes runoff.'
               : '<b>Water table, dry weather</b> · held in the thin soil and regolith; there is little room to store water.'));

    // surface saturation (overland flow) during a storm
    if (storm) {
      site.channels.forEach(c => {
        const half = site.satUStorm * site.L;
        const a = Math.max(0, c - half), b = Math.min(xMax, c + half);
        const pts = xs.filter(x => x >= a && x <= b).map(x => [sx(x), sy(siteGeom(site, x).z)]);
        const sat = svgEl('path', { d: 'M' + line(pts), fill: 'none', stroke: WATER, 'stroke-width': 5, 'stroke-linecap': 'round', class: 'xs-sat' }, g);
        hover(sat, key === 'schist'
          ? '<b>Saturated riparian strip</b> · rain falling directly here explains ~92% of cumulative storm quickflow; toe-slope return flow adds the rest.'
          : '<b>Saturated hillslope</b> · saturation-excess overland flow starts close to the ridges, which is why channels are so closely spaced.');
      });
      for (let i = 0; i < 46; i++) {
        const x = ml + (i + 0.5) / 46 * pw;
        svgEl('line', { x1: x, y1: mt + 4 + (i % 3) * 6, x2: x - 4, y2: mt + 16 + (i % 3) * 6, stroke: WATER, 'stroke-width': 1.5, opacity: 0.7, 'pointer-events': 'none' }, g);
      }
    }

    // channels
    site.channels.forEach(c => {
      const ch = svgEl('circle', { cx: sx(c), cy: sy(0), r: 5, fill: WATER, stroke: '#fff', 'stroke-width': 2, class: 'xs-ch' }, g);
      hover(ch, key === 'schist'
        ? '<b>Pond Branch</b> · base flow is ~85–87% of runoff; in the 1960s it kept flowing for 187 days without recharge. 25 mg/L dissolved solids.'
        : '<b>Druids Run headwater channel</b> · base flow ~63% of runoff; 205 mg/L dissolved solids, Mg-HCO₃ water. Bedrock is exposed at channel heads.');
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
      svgEl('text', { x: sx(bx) + 11, y: mt + 14, class: 'xs-lbl-dark' }, svg).textContent = 'Ridge borehole';
    }

    // annotations
    if (key === 'schist') {
      if (MODEL === 'bowtie') {
        svgEl('text', { x: sx(120), y: sy(-6) + 16, 'text-anchor': 'middle', class: 'xs-lbl-light' }, g).textContent = 'fast rock ~6–10 m under the valley…';
        svgEl('text', { x: sx(196), y: sy(-28), 'text-anchor': 'middle', class: 'xs-lbl-light' }, g).textContent = '…but ~40 m+ under the ridge';
      } else {
        svgEl('text', { x: sx(120), y: sy(-20), 'text-anchor': 'middle', class: 'xs-lbl-light' }, g).textContent = 'classic idea: front follows the surface, subdued';
      }
    }
    if (key === 'serp') {
      svgEl('text', { x: sx(120), y: sy(-25), 'text-anchor': 'middle', class: 'xs-lbl-light' }, g).textContent = 'no saprolite: hard serpentinite a few metres down';
    }

    // axes (recessive)
    const ax = svgEl('g', { class: 'xs-axis' }, svg);
    for (let y = 20; y >= -50; y -= 10) {
      svgEl('line', { x1: ml - 4, y1: sy(y), x2: ml, y2: sy(y) }, ax);
      svgEl('text', { x: ml - 8, y: sy(y) + 3.5, 'text-anchor': 'end' }, ax).textContent = y + ' m';
    }
    for (let x = 0; x <= xMax; x += 40) {
      svgEl('line', { x1: sx(x), y1: H - mb, x2: sx(x), y2: H - mb + 4 }, ax);
      svgEl('text', { x: sx(x), y: H - mb + 16, 'text-anchor': 'middle' }, ax).textContent = x;
    }
    svgEl('text', { x: ml + pw, y: H - 4, 'text-anchor': 'end' }, ax).textContent = 'distance across the valley (m)';

    // title
    svgEl('text', { x: ml, y: 20, class: 'xs-title' }, svg).textContent = site.name;
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
    document.querySelectorAll('[data-model]').forEach(btn => {
      btn.addEventListener('click', () => {
        MODEL = btn.dataset.model;
        document.querySelectorAll('[data-model]').forEach(x => x.classList.toggle('active', x === btn));
        render();
      });
    });
    // vertical exaggeration, computed from the drawing scale
    const pw = XS.W - XS.ml - XS.mr, ph = XS.H - XS.mt - XS.mb;
    const ve = (ph / (XS.yTop - XS.yBot)) / (pw / XS.xMax);
    const veEl = document.getElementById('xs-ve');
    if (veEl) veEl.textContent = ve < 1.15 ? 'none (drawn at about true scale)' : '~' + ve.toFixed(1) + '×';
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
    { k: 'hl', label: 'Median hillslope length', unit: 'm', a: 177, b: 88, note: 'Shorter hillslopes mean more closely spaced valleys.' },
    { k: 'rr', label: 'Runoff ratio', unit: '', a: 0.3, b: 0.57, note: 'Share of rainfall leaving as streamflow. Druids Run: 2022–23, a short record; Pond Branch: long term.' },
    { k: 'flux', label: 'Rock-derived solute flux', unit: 'kg/ha/yr', a: 32.4, b: 59.3, note: 'Mass of dissolved rock leaving each hectare every year (Cleaves et al., 1974).' },
    { k: 'chemrate', label: 'Chemical lowering rate', unit: 'm/Myr', a: 1.2, b: 2.2, note: 'Total lowering is ~2.4 m per million years at both sites; at Soldiers Delight almost all of it is chemical.' }
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

  // Fig D — Acid-rain memory: deposition fell, stream sulfate did not (indexed to 1968 = 100)
  function figSulfate() {
    const svg = document.getElementById('fig-sulfate');
    if (!svg) return;
    const W = 640, H = 300, ml = 54, mr = 200, mt = 24, mb = 40;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const pw = W - ml - mr, ph = H - mt - mb;
    const sx = i => ml + i * pw;
    const sy = v => mt + ph - v / 110 * ph;
    const INK = '#8a7e74';
    const series = [
      { k: 'Sulfate deposited from the air', c: INK, a: 17.8, b: 6, bLo: 5, bHi: 7, unit: 'kg/ha/yr' },
      { k: 'Sulfate in Pond Branch base flow', c: WATER, a: 1.3, b: 1.26, unit: 'mg/L' }
    ];
    const ax = svgEl('g', { class: 'xs-axis' }, svg);
    [0, 25, 50, 75, 100].forEach(v => {
      svgEl('line', { x1: ml, y1: sy(v), x2: ml + pw, y2: sy(v), class: 'fig-gridline' }, ax);
      svgEl('text', { x: ml - 8, y: sy(v) + 3.5, 'text-anchor': 'end' }, ax).textContent = v;
    });
    svgEl('text', { x: sx(0), y: H - mb + 20, 'text-anchor': 'middle' }, ax).textContent = '1960s';
    svgEl('text', { x: sx(1), y: H - mb + 20, 'text-anchor': 'middle' }, ax).textContent = 'today';
    series.forEach((s, i) => {
      const a = 100, b = s.b / s.a * 100;
      if (s.bLo) {
        svgEl('line', { x1: sx(1), y1: sy(s.bLo / s.a * 100), x2: sx(1), y2: sy(s.bHi / s.a * 100), stroke: s.c, 'stroke-width': 2, opacity: 0.5 }, svg);
      }
      svgEl('line', { x1: sx(0), y1: sy(a), x2: sx(1), y2: sy(b), stroke: s.c, 'stroke-width': 2.5, 'stroke-linecap': 'round' }, svg);
      [[0, s.a], [1, s.b]].forEach(([t, raw]) => {
        const v = raw / s.a * 100;
        const dot = svgEl('circle', { cx: sx(t), cy: sy(v), r: 6, fill: s.c, stroke: '#fff', 'stroke-width': 2, class: 'fig-mark' }, svg);
        hover(dot, '<b>' + s.k + '</b><br>' + (t ? 'Today: ' + (s.bLo ? s.bLo + '–' + s.bHi : raw) : '1960s: ' + raw) + ' ' + s.unit + '<br>Index: ' + Math.round(v));
      });
      svgEl('text', { x: sx(1) + 14, y: sy(b) + (i ? -4 : 4), class: 'fig-val' }, svg).textContent = (i ? 'stream: ' : 'deposition: ') + Math.round(b);
    });
  }

  // Fig E — Nitrogen in vs. out by land use (Groffman et al. 2004, 1999–2001)
  function figNitrogen() {
    const svg = document.getElementById('fig-nitrogen');
    if (!svg) return;
    const W = 640, H = 300, ml = 170, mr = 120, mt = 14;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const pw = W - ml - mr, bh = 22, max = 75;
    const rows = [
      { k: 'Forest (Pond Branch)', inp: 11.2, out: 0.52, ret: 95 },
      { k: 'Suburban (Glyndon)', inp: 25.6, out: 6.5, ret: 75 },
      { k: 'Agricultural (McDonogh)', inp: 71.2, out: 16.4, ret: 77 }
    ];
    const IN = '#b8b0a6';
    rows.forEach((r, i) => {
      const y = mt + i * 92;
      svgEl('text', { x: ml - 12, y: y + bh + 4, 'text-anchor': 'end', class: 'fig-cat' }, svg).textContent = r.k;
      [[r.inp, IN, 'Nitrogen in (air + fertilizer)'], [r.out, WATER, 'Nitrogen out in streamflow']].forEach(([v, c, lbl], j) => {
        const yy = y + j * (bh + 3);
        const w = Math.max(3, v / max * pw);
        const rect = svgEl('rect', { x: ml, y: yy, width: w, height: bh, rx: 4, fill: c, class: 'fig-mark fig-grow' }, svg);
        hover(rect, '<b>' + r.k + '</b><br>' + lbl + ': ' + v + ' kg N/ha/yr<br>Retained: ' + r.ret + '%');
        svgEl('text', { x: ml + w + 8, y: yy + bh / 2 + 4, class: 'fig-val' }, svg).textContent = v + (j ? '' : ' kg/ha/yr');
      });
      svgEl('text', { x: ml - 12, y: y + bh + 20, 'text-anchor': 'end', class: 'fig-val' }, svg).textContent = r.ret + '% retained';
    });
    svgEl('line', { x1: ml, y1: 6, x2: ml, y2: H - 18, class: 'fig-base' }, svg);
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
    figSulfate();
    figNitrogen();
    setTimeout(() => { if (map) map.invalidateSize(); }, 300);
  };
})();
