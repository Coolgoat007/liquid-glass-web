const glass = document.getElementById("glass");

// ── Canvas SDF displacement map ──────────────────────────────────────────────
function buildDispMap() {
  const W = 380, H = 240, R = 30, EDGE = 44;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(W, H);

  function ss(a, b, t) {
    t = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function sdf(px, py) {
    const qx = Math.abs(px) - W / 2 + R;
    const qy = Math.abs(py) - H / 2 + R;
    return Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2)
         + Math.min(Math.max(qx, qy), 0) - R;
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x - W / 2, py = y - H / 2;
      const d  = sdf(px, py);
      const t  = ss(-EDGE, 0, d); // 0 = center, 1 = edge
      const gx = (sdf(px + 1, py) - sdf(px - 1, py)) / 2;
      const gy = (sdf(px, py + 1) - sdf(px, py - 1)) / 2;
      const len = Math.sqrt(gx * gx + gy * gy) || 1;
      const i = (y * W + x) * 4;
      img.data[i]     = Math.round(128 + (gx / len) * t * 120); // R → X
      img.data[i + 1] = Math.round(128 + (gy / len) * t * 120); // G → Y
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

document.getElementById("glass-disp-img").setAttribute("href", buildDispMap());

// ── Interaction state ──────────────────────────────────────────────────────────
const ELASTICITY = 0.18;
const ACTIVATION = 200; // px from edge where elastic pull begins
let active = false;
let lastX = -1, lastY = -1;

// ── Elastic transform + flowing border, driven by cursor position ──────────────
function update() {
  const r  = glass.getBoundingClientRect();
  const cx = r.left + r.width  / 2;
  const cy = r.top  + r.height / 2;
  const dx = lastX - cx;
  const dy = lastY - cy;

  // mouse offset as a percentage of the glass size (drives the border gradient)
  const offX = (dx / r.width)  * 100;
  const offY = (dy / r.height) * 100;

  // distance from the glass *edges*, and a 0→1 fade within the activation zone
  const edx = Math.max(0, Math.abs(dx) - r.width  / 2);
  const edy = Math.max(0, Math.abs(dy) - r.height / 2);
  const edgeDist = Math.hypot(edx, edy);
  const fade = lastX < 0 || edgeDist > ACTIVATION ? 0 : 1 - edgeDist / ACTIVATION;

  // elastic translation toward the cursor
  const tx = dx * ELASTICITY * 0.1 * fade;
  const ty = dy * ELASTICITY * 0.1 * fade;

  // directional stretch — elongate along the approach axis, pinch the other
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist, ny = dy / dist;
  const stretch = Math.min(dist / 300, 1) * ELASTICITY * fade;
  const sx = Math.max(0.8, 1 + Math.abs(nx) * stretch * 0.3 - Math.abs(ny) * stretch * 0.15);
  const sy = Math.max(0.8, 1 + Math.abs(ny) * stretch * 0.3 - Math.abs(nx) * stretch * 0.15);

  const scale = active ? "scale(0.96)" : `scaleX(${sx.toFixed(3)}) scaleY(${sy.toFixed(3)})`;
  // Only apply a transform while actually interacting. At rest we strip it
  // entirely so the glass renders identically to the original — an always-on
  // transform forces the backdrop-filter/displacement layer to re-rasterize
  // and washes out the edge refraction.
  if (!active && fade === 0) {
    glass.style.transform = "";
  } else {
    glass.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) ${scale}`;
  }

  // flowing border highlight
  glass.style.setProperty("--ba", `${135 + offX * 1.2}deg`);
  glass.style.setProperty("--b1", (0.35 + Math.abs(offX) * 0.01).toFixed(3));
  glass.style.setProperty("--b2", (0.70 + Math.abs(offX) * 0.012).toFixed(3));
  glass.style.setProperty("--p1", `${Math.max(10, 33 + offY * 0.3).toFixed(1)}%`);
  glass.style.setProperty("--p2", `${Math.min(90, 66 + offY * 0.4).toFixed(1)}%`);
}

document.addEventListener("mousemove", (e) => {
  lastX = e.clientX;
  lastY = e.clientY;
  update();
});

// ── Drag (delta-based so the elastic transform doesn't interfere) ──────────────
let startX = 0, startY = 0, baseL = 0, baseT = 0;
glass.addEventListener("pointerdown", (e) => {
  active = true;
  startX = e.clientX; startY = e.clientY;
  baseL = glass.offsetLeft; baseT = glass.offsetTop;
  glass.setPointerCapture(e.pointerId);
  update();
});
glass.addEventListener("pointermove", (e) => {
  if (!active) return;
  glass.style.left = `${baseL + (e.clientX - startX)}px`;
  glass.style.top  = `${baseT + (e.clientY - startY)}px`;
});
function endDrag() {
  active = false;
  update();
}
glass.addEventListener("pointerup", endDrag);
glass.addEventListener("pointercancel", endDrag);

// ── Sliders ────────────────────────────────────────────────────────────────────
const dmR = document.getElementById("dm-r");
const dmG = document.getElementById("dm-g");
const dmB = document.getElementById("dm-b");

const dispSlider = document.getElementById("disp-slider");
const dispVal    = document.getElementById("disp-val");
const blurSlider = document.getElementById("blur-slider");
const blurVal    = document.getElementById("blur-val");
const satSlider  = document.getElementById("sat-slider");
const satVal     = document.getElementById("sat-val");
const abSlider   = document.getElementById("ab-slider");
const abVal      = document.getElementById("ab-val");

// refraction strength + chromatic spread share the displacement-map scales:
// R = base, G = base − aberration, B = base − 2·aberration
function applyDisp() {
  const base = +dispSlider.value;
  const ab   = +abSlider.value;
  dmR.setAttribute("scale", base);
  dmG.setAttribute("scale", base - ab);
  dmB.setAttribute("scale", base - 2 * ab);
}

dispSlider.addEventListener("input", () => { dispVal.textContent = dispSlider.value; applyDisp(); });
abSlider.addEventListener("input",   () => { abVal.textContent   = abSlider.value;   applyDisp(); });
blurSlider.addEventListener("input", () => {
  glass.style.setProperty("--blur", `${blurSlider.value}px`);
  blurVal.textContent = `${blurSlider.value}px`;
});
satSlider.addEventListener("input", () => {
  glass.style.setProperty("--sat", `${satSlider.value}%`);
  satVal.textContent = `${satSlider.value}%`;
});

applyDisp();
