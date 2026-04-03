// ==========================================
// LEAFLET MAP CONFIGURATIONS
// ==========================================

// --- OASES MAP ---
const oasesMap = L.map('map-oases').setView([26.5, 28.5], 6);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{
  attribution:'© OpenStreetMap © CARTO', maxZoom:18
}).addTo(oasesMap);

// Custom Icons
const oasisIcon = L.divIcon({
  className:'',
  html:`<div style="width:14px;height:14px;background:#1a3d52;border:2px solid #c4956a;border-radius:50%"></div>`,
  iconAnchor:[7,7]
});
const siwaIcon = L.divIcon({
  className:'',
  html:`<div style="width:16px;height:16px;background:#c44a3e;border:2px solid #fff;border-radius:50%"></div>`,
  iconAnchor:[8,8]
});

// Site Data
const oasesSites = [
  { lat:29.20, lng:25.52, name:"Siwa Oasis", icon:siwaIcon,
    badge:"€535,000 · Salinity Management",
    challenge:"Rising salty groundwater poisoning crops and threatening the ancient mud-brick Shali heritage site.",
    action:"8ha salt-tolerant heritage crops · 150 agroforestry windbreak trees · 2 wetland strips for natural water filtration and ecosystem recovery." },
  { lat:29.31, lng:30.84, name:"Fayoum Oasis", icon:oasisIcon,
    badge:"Agro-Innovation Pilot",
    challenge:"Severe soil depletion and loss of heritage farming efficiency. Ramad Farm identified as key partner.",
    action:"Ramad Farm Model across 10ha · Ancient Fallow Irrigation revived · Date palms intercropped with legumes and moringa · University-developed bio-polymers for soil water retention." },
  { lat:25.44, lng:30.56, name:"Kharga Oasis", icon:oasisIcon,
    badge:"Eco-Tourism & TVET",
    challenge:"Lack of green economic opportunities drives youth migration from this deep desert oasis.",
    action:"Historic 1960s Administrative Complex restored as School of Traditional Crafts · Mudbrick house converted to visitor center · 2 heritage geo-tourism experiences developed." },
  { lat:25.49, lng:28.98, name:"Dakhla Oasis", icon:oasisIcon,
    badge:"Water Harvesting",
    challenge:"The ancient Nubian Aquifer is fading, drying up life-giving irrigation channels.",
    action:"2–3 traditional wells rehabilitated · 2 sand dams + recharge trench constructed · 3ha gravity-fed irrigation installed to sustain agricultural productivity." },
  { lat:26.07, lng:28.21, name:"Desert Research Center (DRC)", icon:L.divIcon({className:'',html:`<div style="width:12px;height:12px;background:#3d7a5f;border:2px solid #fff;border-radius:2px"></div>`,iconAnchor:[6,6]}),
    badge:"The Genetic Ark",
    challenge:"Heritage date varieties (Saidi & Siwi) at risk of extinction from climate shock and monoculture expansion.",
    action:"Dormant Tissue Culture Laboratory reactivated · 50,000 seedlings of endangered climate-resilient heritage date varieties to be mass-propagated bio-securely." }
];

// Add Markers
oasesSites.forEach(s => {
  L.marker([s.lat,s.lng],{icon:s.icon}).addTo(oasesMap)
    .bindPopup(`<div style="max-width:220px"><div class="badge">${s.badge}</div><h4>${s.name}</h4><div class="challenge">⚠ Challenge: ${s.challenge}</div><div class="action">✓ Action: ${s.action}</div></div>`);
});

// --- MANGROVES MAP ---
const mangrovesMap = L.map('map-mangroves').setView([23.5, 35.5], 8);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
  attribution:'© OpenStreetMap © CARTO', maxZoom:18
}).addTo(mangrovesMap);

// Custom Icons
const mangroveIcon = L.divIcon({
  className:'',
  html:`<div style="width:14px;height:14px;background:#3d7a5f;border:2px solid #fff;border-radius:50%"></div>`,
  iconAnchor:[7,7]
});
const communityIcon = L.divIcon({
  className:'',
  html:`<div style="width:14px;height:14px;background:#d4943a;border:2px solid #fff;border-radius:50%"></div>`,
  iconAnchor:[7,7]
});
const nurseryIcon = L.divIcon({
  className:'',
  html:`<div style="width:12px;height:12px;background:#c4956a;border:2px solid #fff;border-radius:2px"></div>`,
  iconAnchor:[6,6]
});

// Site Data
const mangroveSites = [
  { lat:23.93, lng:35.29, name:"Wadi El Gemal National Park", icon:mangroveIcon,
    badge:"Core Restoration Zone",
    challenge:"30% mangrove cover lost. Camel overgrazing destroys young shoots. Historic planting failed due to wrong sediment depth selection.",
    action:"10,000 trees/year · Local nursery established · Planting zones dictated by 40-year EgSA satellite survival baselines and Ranger field logs · Camel-proof fencing installed." },
  { lat:23.63, lng:35.66, name:"Hamata", icon:mangroveIcon,
    badge:"Secondary Restoration Zone",
    challenge:"Urban encroachment and degraded tidal channels prevent natural mangrove regeneration.",
    action:"Second local nursery · Tidal channel hydrological restoration to ensure correct flow for root anchoring · 10,000 additional trees over 24 months." },
  { lat:24.10, lng:35.10, name:"Ababda Bedouin Territory", icon:communityIcon,
    badge:"Indigenous Knowledge Hub",
    challenge:"Traditional Ecological Knowledge (TEK) of the Ababda Bedouin — 20 years of unpublished Ranger planting logs — not integrated into restoration science.",
    action:"Ababda community certified as central custodians of the CMSC · TEK integrated with satellite data for precision planting · Economic survival directly tied to forest health through eco-tourism." },
  { lat:24.35, lng:35.48, name:"TVET Training Center", icon:nurseryIcon,
    badge:"Green Skills & Livelihoods",
    challenge:"Local communities lack sustainable economic alternatives — leading to mangrove exploitation rather than stewardship.",
    action:"Formal TVET vocational training for 60 local youth and women in sustainable fisheries, mangrove nursery management, and eco-tourism guiding." },
  { lat:23.50, lng:35.75, name:"EgSA Monitoring Zone", icon:nurseryIcon,
    badge:"Scientific Monitoring",
    challenge:"No continuous vegetation health monitoring — previous projects could not validate or scale their impact.",
    action:"Continuous NDVI Vegetation Index Analysis via Egyptian Space Agency (EgSA) satellite · Peer-reviewed Mangrove Restoration Model to advise national policy." }
];

// Add Markers
mangroveSites.forEach(s => {
  L.marker([s.lat,s.lng],{icon:s.icon}).addTo(mangrovesMap)
    .bindPopup(`<div style="max-width:220px"><div class="badge" style="background:#3d7a5f">${s.badge}</div><h4>${s.name}</h4><div class="challenge">⚠ Challenge: ${s.challenge}</div><div class="action">✓ Action: ${s.action}</div></div>`);
});

// Add Red Sea label area
L.rectangle([[22.5,34.5],[25.5,37.0]],{color:'#3d7a5f',weight:1,fillOpacity:0.04,dashArray:'4,6'}).addTo(mangrovesMap);