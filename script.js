// ================================
//  BANANABIRD PFP EDITOR — script.js
// ================================

// ─── CA  ───────────────────────
const CA = 'AgiEL3WHQqzzqg6USnZSeiZkeQXCpqnimL6EmAfpump';

// ─── Trait config ─────────────────────────────────────────────
const TRAITS = {
  bg:          { count: 13, hasNone: false },
  body:        { count: 8,  hasNone: false },
  accessories: { count: 8,  hasNone: true  },
  overlay:     { count: 11, hasNone: true  },
};

const LAYER_ORDER = ['bg', 'body', 'accessories', 'overlay'];

const DEFAULT_STATE = {
  bg:          1,
  body:        1,
  accessories: 0,
  overlay:     0,
};

let state = { ...DEFAULT_STATE };

// ─── Shuffle Bag ─────────────────────────────────────────────
// Each category gets a shuffled bag; only refills when empty.
// This ensures no repeat until every trait has been used once.

const shuffleBags = {};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initBag(category) {
  const cfg = TRAITS[category];
  const indices = [];
  if (cfg.hasNone) indices.push(0);
  for (let i = 1; i <= cfg.count; i++) indices.push(i);
  shuffleBags[category] = shuffle(indices);
}

function drawFromBag(category) {
  if (!shuffleBags[category] || shuffleBags[category].length === 0) {
    initBag(category);
  }
  return shuffleBags[category].pop();
}

LAYER_ORDER.forEach(initBag);

// ─── Image cache ──────────────────────────────────────────────

const imageCache = {};

function getTraitPath(category, index) {
  return `images/traits/${category}/${index}.png`;
}

function loadImage(src) {
  if (imageCache[src]) return Promise.resolve(imageCache[src]);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => { 
      imageCache[src] = img; 
      resolve(img); 
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      resolve(null);
    };
    img.src = src;
  });
}

// ─── Canvas ───────────────────────────────────────────────────

const canvas = document.getElementById('pfpCanvas');
const ctx    = canvas.getContext('2d');

async function renderCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 
  const loadPromises = LAYER_ORDER.map(async (category) => {
    const index = state[category];
    if (!index && index !== 0) return null;
    const img = await loadImage(getTraitPath(category, index));
    return { category, img, index };
  });
  
  const results = await Promise.all(loadPromises);
  
  // 
  for (const result of results) {
    if (result && result.img) {
      ctx.drawImage(result.img, 0, 0, canvas.width, canvas.height);
    }
  }
}

// 
canvas.addEventListener('contextmenu', function(e) {
  // 
  // 
});

// ─── Trait Grid Builder ───────────────────────────────────────

function buildTraitGrids() {
  for (const [category, cfg] of Object.entries(TRAITS)) {
    const grid = document.getElementById(`grid-${category}`);

    for (let i = 1; i <= cfg.count; i++) {
      const thumb = document.createElement('div');
      thumb.classList.add('trait-thumb');
      thumb.dataset.category = category;
      thumb.dataset.index    = i;

      const img = document.createElement('img');
      img.src      = getTraitPath(category, i);
      img.alt      = `${category} ${i}`;
      img.loading  = 'lazy';
      img.draggable = false;

      // Block right-click on trait thumbnails
      img.addEventListener('contextmenu',   e => e.preventDefault());
      thumb.addEventListener('contextmenu', e => e.preventDefault());

      const num = document.createElement('span');
      num.classList.add('thumb-num');
      num.textContent = `#${i}`;

      thumb.appendChild(img);
      thumb.appendChild(num);
      thumb.addEventListener('click', () => selectTrait(category, i));
      grid.appendChild(thumb);
    }

    // None thumb (accessories / overlay only)
    const noneThumb = grid.querySelector('.none-thumb');
    if (noneThumb) {
      noneThumb.addEventListener('contextmenu', e => e.preventDefault());
      noneThumb.addEventListener('click', () => selectTrait(category, 0));
    }
  }

  updateAllSelections();
}

function selectTrait(category, index) {
  state[category] = index;
  updateCategorySelection(category);
  renderCanvas();
}

function updateCategorySelection(category) {
  const grid = document.getElementById(`grid-${category}`);
  grid.querySelectorAll('.trait-thumb').forEach(thumb => {
    const ti = parseInt(thumb.dataset.index, 10);
    thumb.classList.toggle('selected', ti === state[category]);
  });
}

function updateAllSelections() {
  LAYER_ORDER.forEach(updateCategorySelection);
}

// ─── Randomize ───────────────────────────────────────────────

function randomize() {
  LAYER_ORDER.forEach(category => {
    state[category] = drawFromBag(category);
  });
  updateAllSelections();
  renderCanvas();
  bumpBtn(document.getElementById('btnRandomize'));
}

// ─── Reset ───────────────────────────────────────────────────

function reset() {
  state = { ...DEFAULT_STATE };
  updateAllSelections();
  renderCanvas();
  bumpBtn(document.getElementById('btnReset'));
}

// ───  ────────────────────────────────────────────────
// 

function savePFP() {
  // 
  const link = document.createElement('a');
  link.download = 'bananabird-' + Date.now() + '.png';
  
  // 
  link.href = canvas.toDataURL('image/png');
  
  // 
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  bumpBtn(document.getElementById('btnSave'));
}

// ─── Copy CA ─────────────────────────────────────────────────

function copyCA() {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(CA).then(showToast).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }
}

function fallbackCopy() {
  const ta = document.createElement('textarea');
  ta.value = CA;
  ta.style.position = 'fixed';
  ta.style.opacity  = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
  showToast();
}

function showToast() {
  const toast = document.getElementById('caToast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// ─── Button press animation ───────────────────────────────────

function bumpBtn(btn) {
  if (!btn) return;
  btn.style.transform = 'translate(3px,3px)';
  btn.style.boxShadow = '0 0 0 #000';
  setTimeout(() => {
    btn.style.transform = '';
    btn.style.boxShadow = '';
  }, 160);
}

// ─── Event Listeners ──────────────────────────────────────────

document.getElementById('btnRandomize').addEventListener('click', randomize);
document.getElementById('btnSave').addEventListener('click', savePFP);
document.getElementById('btnReset').addEventListener('click', reset);
document.getElementById('btnCopyCA').addEventListener('click', copyCA);

// ─── Init ─────────────────────────────────────────────────────

buildTraitGrids();
renderCanvas();

// 
window.addEventListener('load', function() {
  const marquee = document.querySelector('marquee');
  if (marquee) {
    // 
    marquee.stop();
    marquee.start();
  }

});



