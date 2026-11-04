/* Deltactica · Probador virtual
   Modelo de prenda con medidas en cm + talla, esqueleto (MediaPipe Pose) y silueta para tapar la ropa propia. */
(() => {
  const $ = (s) => document.querySelector(s);
  const MP_VERSION = '0.10.14';
  const MP_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`;
  const MP_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';

  // ---- medidas de referencia (cm) ----
  // Ancho de hombros (biacromial): hombres ~41.5 cm (mediana ANSUR II), mujeres ~36.7 cm (NHANES III).
  // Hombro-deltoides / biacromial ~1.16 (muestra ANSUR II). Proporciones de brazo: valores típicos aproximados.
  const BODY = { hombre: 41.5, mujer: 36.7 };
  const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
  const STEP = { hombro: 1.5, pecho: 2.5, largo: 1.8, manga: 1.2, biceps: 1.0, bajo: 2.5 };
  // Medidas base (talla M, prenda plana, en cm). REEMPLAZAR por la tabla de tallas real de Deltactica.
  const DIMS = {
    buzo:     { hombro: 46, pecho: 54, largo: 70, manga: 63, biceps: 19, bajo: 52 },
    camiseta: { hombro: 45, pecho: 52, largo: 70, manga: 62, biceps: 18, bajo: 52 },
    chaqueta: { hombro: 48, pecho: 58, largo: 70, manga: 65, biceps: 21, bajo: 56 },
  };

  const CFG = Object.assign({ tokenUrl: '', decartModel: 'lucy-vton-latest', decartFast: false, maxAiSeconds: 120, decartSdkUrl: '' }, window.DELTACTICA_CONFIG || {});
  try { const ce = document.getElementById('deltactica-config'); if (ce) Object.assign(CFG, JSON.parse(ce.textContent)); } catch (e) {}
  let prendas = [];
  const dataEl = $('#prendas-data');
  if (dataEl) { try { prendas = JSON.parse(dataEl.textContent); } catch (e) {} }
  if (!prendas.length && window.DELTACTICA_PRENDAS) prendas = window.DELTACTICA_PRENDAS;

  const video = $('#video'), canvas = $('#canvas'), ctx = canvas.getContext('2d');
  const stageBox = $('#stageBox'), overlay = $('#overlay'), dropHint = $('#dropHint');
  const statusEl = $('#status'), badge = $('#badge');
  const grid = $('#grid'), chips = $('#chips'), search = $('#search');
  const btnCam = $('#btnCam'), btnSwitch = $('#btnSwitch'), btnPhoto = $('#btnPhoto'), btnHide = $('#btnHide');
  const btnAuto = $('#btnAuto'), btnManual = $('#btnManual'), btnStart = $('#btnStart'), btnAI = $('#btnAI'), btnScan = $('#btnScan');
  const aiVideo = $('#aiVideo'), scanPanel = $('#scanPanel'), scanList = $('#scanList'), scanBar = $('#scanBar'), scanMsg = $('#scanMsg'), aiStat = $('#aiStat');
  const rScale = $('#rScale'), rDy = $('#rDy'), rRot = $('#rRot');
  const selSex = $('#selSex'), selSize = $('#selSize'), inShoulder = $('#inShoulder'), fitInfo = $('#fitInfo');

  const S = {
    prenda: null, img: null, imgBack: null, backWarn: null, mode: 'auto', facing: 'user', mirror: true,
    stream: null, landmarker: null, poseState: 'idle', lastVideoTime: -1, lastSeen: 0, filter: 'todas', q: '',
    view: 'front', fc: 0, yaw: 0, maxSw: 0,
    adj: { scale: 1, dy: 0 }, manual: { x: 0.5, y: 0.5, w: 0.5, rot: 0 },
    sex: 'hombre', size: 'M', shoulderCm: BODY.hombre,
    t: null, lastAuto: null, meshes: {}, hide: true, maskReady: false, frame: 0, gain: 1, light: null, skip: 0,
    scan: { active: false, done: false, okMs: 0, last: 0, hist: [], msg: '', checks: {} }, body: null,
  };
  window.__DELTACTICA_STATE = S; // solo depuración
  const imgCache = {};
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; } },
    set(k, o) { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} },
  };
  const setStatus = (t) => { statusEl.textContent = t; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---- perfil del cuerpo y talla ----
  function loadProfile() {
    const o = store.get('deltactica_probador_perfil');
    if (o.sex) S.sex = o.sex; if (o.size) S.size = o.size; if (o.shoulderCm) S.shoulderCm = o.shoulderCm;
    selSex.value = S.sex; selSize.value = S.size; inShoulder.value = S.shoulderCm;
  }
  function saveProfile() { store.set('deltactica_probador_perfil', { sex: S.sex, size: S.size, shoulderCm: S.shoulderCm }); }
  selSex.onchange = () => { S.sex = selSex.value; S.shoulderCm = BODY[S.sex]; inShoulder.value = S.shoulderCm; saveProfile(); updateFitInfo(); };
  selSize.onchange = () => { S.size = selSize.value; saveProfile(); updateFitInfo(); if (ai.rt) updateAIGarment(); };
  inShoulder.onchange = () => { S.shoulderCm = clamp(parseFloat(inShoulder.value) || BODY[S.sex], 30, 55); inShoulder.value = S.shoulderCm; saveProfile(); updateFitInfo(); };
  function sizedDims(p) {
    const base = Object.assign({}, DIMS[p.categoria] || DIMS.buzo, p.dims || {});
    const k = SIZES.indexOf(S.size) - 1; // M = 0
    const d = {}; Object.keys(base).forEach((key) => { d[key] = base[key] + k * (STEP[key] || 0); });
    return d;
  }
  function updateFitInfo() {
    if (!S.prenda) { fitInfo.textContent = ''; return; }
    const d = sizedDims(S.prenda);
    const chestVis = 0.70 * d.pecho * 2; // circunferencia aprox. de la prenda
    fitInfo.textContent = `Talla ${S.size}: pecho ~${Math.round(d.pecho * 2)} cm · largo ${Math.round(d.largo)} cm · manga ${Math.round(d.manga)} cm`;
    void chestVis;
  }

  // ---- catálogo ----
  function renderChips() {
    const cats = [['todas', 'Todas']];
    prendas.forEach((p) => { if (!cats.find((c) => c[0] === p.categoria)) cats.push([p.categoria, p.categoria_label || p.categoria]); });
    chips.innerHTML = '';
    cats.forEach(([k, label]) => {
      const b = document.createElement('button');
      b.className = 'chip' + (S.filter === k ? ' on' : ''); b.textContent = label;
      b.onclick = () => { S.filter = k; renderChips(); renderGrid(); };
      chips.appendChild(b);
    });
  }
  function renderGrid() {
    grid.innerHTML = '';
    const q = S.q.trim().toLowerCase();
    const list = prendas.filter((p) => (S.filter === 'todas' || p.categoria === S.filter) && (!q || p.nombre.toLowerCase().includes(q)));
    if (!list.length) { grid.innerHTML = '<p class="empty">No hay prendas con ese filtro.</p>'; return; }
    list.forEach((p) => {
      const c = document.createElement('div');
      c.className = 'card' + (S.prenda && S.prenda.id === p.id ? ' on' : '');
      c.draggable = true;
      c.innerHTML = `<div class="thumb"><img src="${p.img}" alt="${p.nombre}" draggable="false"></div><div class="meta"><span class="tag">${p.categoria_label || p.categoria}</span><b>${p.nombre}</b></div>`;
      c.onclick = () => selectPrenda(p.id);
      c.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', String(p.id)); e.dataTransfer.effectAllowed = 'copy'; });
      grid.appendChild(c);
    });
  }
  function loadSrc(src) {
    return new Promise((res) => {
      if (!src) return res(null);
      if (imgCache[src] !== undefined) return res(imgCache[src]);
      const im = new Image();
      im.onload = () => { imgCache[src] = im; res(im); };
      im.onerror = () => { imgCache[src] = null; res(null); };
      im.src = src;
    });
  }
  async function selectPrenda(id, drop) {
    const p = prendas.find((x) => String(x.id) === String(id));
    if (!p) return;
    const im = await loadSrc(p.img);
    if (!im) { setStatus('No se pudo cargar la imagen de la prenda.'); return; }
    S.prenda = p; S.img = im; S.imgBack = null; S.backWarn = null;
    loadSrc(p.img_back || p.img.replace(/\.png$/i, '_espalda.png')).then((b) => { if (S.prenda === p) S.imgBack = b; });
    const a = store.get('deltactica_probador_adj')[p.id];
    S.adj = a ? { scale: a.scale ?? 1, dy: a.dy ?? 0 } : { scale: 1, dy: 0 };
    if (!drop) S.manual.rot = 0;
    badge.textContent = p.nombre; badge.classList.add('show');
    syncSliders(); renderGrid(); updateFitInfo(); if (ai.rt) updateAIGarment();
  }
  function saveAdj() {
    if (!S.prenda) return;
    const o = store.get('deltactica_probador_adj'); o[S.prenda.id] = { scale: S.adj.scale, dy: S.adj.dy }; store.set('deltactica_probador_adj', o);
  }

  // ---- controles ----
  function syncSliders() {
    if (S.mode === 'auto') {
      rScale.min = 0.85; rScale.max = 1.25; rScale.step = 0.01; rScale.value = S.adj.scale;
      rDy.disabled = false; rDy.value = S.adj.dy; rRot.disabled = true; rRot.value = 0;
    } else {
      rScale.min = 0.15; rScale.max = 1.3; rScale.step = 0.005; rScale.value = S.manual.w;
      rDy.disabled = true; rRot.disabled = false; rRot.value = S.manual.rot;
    }
  }
  function setMode(m) {
    if (m === 'ai') { startAI(); return; }
    if (aiActive()) stopAI(true);
    if (m === 'auto' && S.poseState === 'failed' && !window.__deltacticaFakePose) { setStatus('El seguimiento automático no está disponible (¿sin internet?). Usa el modo manual.'); return; }
    if (m === 'manual' && S.lastAuto && S.mode === 'auto') {
      const a = S.lastAuto;
      S.manual = { x: a.cx / canvas.width, y: a.cy / canvas.height, w: a.w / canvas.width, rot: a.rot * 180 / Math.PI };
    }
    S.mode = m;
    btnAI.classList.remove('on'); btnAuto.classList.toggle('on', m === 'auto'); btnManual.classList.toggle('on', m === 'manual');
    stageBox.classList.toggle('manual', m === 'manual'); stageBox.classList.remove('ai');
    syncSliders();
    setStatus(m === 'auto' ? '2D básico: ponte de frente, con luz de frente (no a contraluz).' : 'Modo manual: arrastra la prenda; rueda del mouse o dos dedos para el tamaño.');
  }
  btnHide.onclick = () => { S.hide = !S.hide; btnHide.classList.toggle('on', S.hide); setStatus(S.hide ? 'Ocultando tu ropa: solo se ve la prenda.' : 'Mostrando tu ropa original.'); };
  btnAI.onclick = () => (aiActive() ? stopAI() : setMode('ai'));
  btnScan.onclick = () => { if (aiActive()) stopAI(true); if (S.stream) startScan(); else startCamera(); };
  btnAuto.onclick = () => setMode('auto');
  btnManual.onclick = () => setMode('manual');
  rScale.oninput = () => { const v = parseFloat(rScale.value); if (S.mode === 'auto') { S.adj.scale = v; saveAdj(); } else S.manual.w = v; };
  rDy.oninput = () => { S.adj.dy = parseFloat(rDy.value); saveAdj(); };
  rRot.oninput = () => { S.manual.rot = parseFloat(rRot.value); };
  search.oninput = () => { S.q = search.value; renderGrid(); };

  // ---- cámara ----
  async function startCamera(keepScan) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setStatus('Este navegador no permite la cámara aquí. Abre la página desde http://localhost o HTTPS.'); return; }
    try {
      stopCamera(true);
      S.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: S.facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      video.srcObject = S.stream; await video.play();
      S.mirror = S.facing === 'user';
      overlay.classList.add('hide'); btnCam.textContent = 'Apagar cámara';
      fitCanvas(); setStatus('Cámara activa.'); initPose(); if (!keepScan || !S.scan.done) startScan();
    } catch (err) {
      const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      setStatus(denied ? 'Permiso de cámara denegado. Habilítalo en el candado de la barra de direcciones.' : 'No se pudo abrir la cámara: ' + (err && err.name ? err.name : err));
    }
  }
  function stopCamera(silent) {
    if (S.stream) S.stream.getTracks().forEach((t) => t.stop());
    S.stream = null; video.srcObject = null;
    if (!silent) { overlay.classList.remove('hide'); btnCam.textContent = 'Activar cámara'; setStatus('Cámara apagada.'); }
  }
  btnCam.onclick = () => { if (aiActive()) { stopAI(true); overlay.classList.remove('hide'); btnCam.textContent = 'Activar cámara'; return; } S.stream ? stopCamera() : startCamera(); };
  btnStart.onclick = startCamera;
  btnSwitch.onclick = () => { S.facing = S.facing === 'user' ? 'environment' : 'user'; if (S.stream) startCamera(); };

  // ---- detección ----
  async function initPose() {
    if (S.poseState === 'ready' || S.poseState === 'loading') return;
    S.poseState = 'loading'; setStatus('Cargando seguimiento corporal…');
    try {
      const vision = await import(MP_URL);
      const fileset = await vision.FilesetResolver.forVisionTasks(`${MP_URL}/wasm`);
      const make = (delegate) => vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MP_MODEL, delegate }, runningMode: 'VIDEO', numPoses: 1,
        minPoseDetectionConfidence: 0.35, minPosePresenceConfidence: 0.35, minTrackingConfidence: 0.35,
        outputSegmentationMasks: true,
      });
      try { S.landmarker = await make('GPU'); } catch (e) { S.landmarker = await make('CPU'); }
      S.poseState = 'ready';
      setStatus('Seguimiento listo. Ponte de frente, con luz de frente.');
    } catch (e) {
      console.warn('Pose no disponible', e);
      S.poseState = 'failed'; S.scan.active = false; scanPanel.classList.remove('show'); setMode('manual');
      setStatus('No se pudo cargar el seguimiento (¿sin internet?). Funciona en modo manual.');
    }
  }
  // copia del video con brillo corregido solo para detectar (contraluz / poca luz)
  const dc = document.createElement('canvas'), dctx = dc.getContext('2d');
  const lc = document.createElement('canvas'); lc.width = 32; lc.height = 18; const lctx = lc.getContext('2d', { willReadFrequently: true });
  function detectionSource() {
    const w = video.videoWidth, h = video.videoHeight;
    if (!('filter' in dctx)) return video;
    if (dc.width !== w || dc.height !== h) { dc.width = w; dc.height = h; }
    if (S.frame % 20 === 0) {
      try {
        lctx.drawImage(video, 0, 0, 32, 18);
        const d = lctx.getImageData(8, 5, 16, 11).data; let s = 0;
        for (let i = 0; i < d.length; i += 4) s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const mean = s / (d.length / 4) || 100;
        S.gain = clamp(115 / Math.max(mean, 25), 1, 2.6);
      } catch (e) {}
    }
    dctx.filter = S.gain > 1.08 ? `brightness(${S.gain.toFixed(2)}) contrast(1.08)` : 'none';
    dctx.drawImage(video, 0, 0, w, h);
    return dc;
  }
  const vis = (p) => p && p.visibility > 0.5 && p.x > -0.05 && p.x < 1.05 && p.y > -0.05 && p.y < 1.05;
  function ema(cur, val, k) { return cur ? { x: cur.x + (val.x - cur.x) * k, y: cur.y + (val.y - cur.y) * k } : { x: val.x, y: val.y }; }
  function handlePose(res) {
    const lm = res && res.landmarks && res.landmarks[0];
    if (S.scan.active) scanStep(lm);
    if (!lm || !(lm[11].visibility > 0.25) || !(lm[12].visibility > 0.25)) return; // se conserva la última posición
    S.lastSeen = performance.now();
    const W = canvas.width, H = canvas.height;
    const P = (p) => ({ x: (S.mirror ? 1 - p.x : p.x) * W, y: p.y * H });
    const leftIsA = P(lm[11]).x <= P(lm[12]).x;
    const idxL = leftIsA ? [11, 13, 15, 23] : [12, 14, 16, 24];
    const idxR = leftIsA ? [12, 14, 16, 24] : [11, 13, 15, 23];
    const side = (idx) => ({ s: P(lm[idx[0]]), e: P(lm[idx[1]]), w: P(lm[idx[2]]), h: P(lm[idx[3]]), eOk: vis(lm[idx[1]]), wOk: vis(lm[idx[1]]) && vis(lm[idx[2]]), hOk: vis(lm[idx[3]]) });
    const L = side(idxL), R = side(idxR);
    const sw = Math.hypot(R.s.x - L.s.x, R.s.y - L.s.y);
    // descarta detecciones imposibles: hombros casi juntos o saltos bruscos de tamaño
    if (sw < 0.08 * W) return;
    if (S.t && S.t.span0) {
      const ratio = sw / S.t.span0;
      if ((ratio > 1.5 || ratio < 0.6) && S.skip < 8) { S.skip++; return; }
    }
    S.skip = 0;
    const hipsOk = L.hOk && R.hOk;
    // frente o espalda (el hombro izquierdo de la persona queda a la izquierda de la imagen cuando está de espaldas)
    const dxn = lm[11].x - lm[12].x, dzn = (lm[11].z || 0) - (lm[12].z || 0);
    const yawRaw = Math.atan2(Math.abs(dzn), Math.abs(dxn));
    S.yaw += (yawRaw - S.yaw) * 0.25;
    if (dxn > 0.03) S.fc = Math.min(8, S.fc + 1); else if (dxn < -0.03) S.fc = Math.max(-8, S.fc - 1);
    if (S.fc >= 5) S.view = 'front'; else if (S.fc <= -5) S.view = 'back';
    const k = 0.45, t = S.t || (S.t = {});
    t.span0 = t.span0 ? t.span0 + (sw - t.span0) * 0.2 : sw;
    t.sL = ema(t.sL, L.s, k); t.sR = ema(t.sR, R.s, k);
    t.hM = hipsOk ? ema(t.hM, { x: (L.h.x + R.h.x) / 2, y: (L.h.y + R.h.y) / 2 }, k) : null;
    t.eL = L.eOk ? ema(t.eL, L.e, k) : null; t.eR = R.eOk ? ema(t.eR, R.e, k) : null;
    t.wL = L.wOk ? ema(t.wL, L.w, k) : null; t.wR = R.wOk ? ema(t.wR, R.w, k) : null;
    if (vis(lm[9]) && vis(lm[10])) { const a = P(lm[9]), b = P(lm[10]); t.mouth = ema(t.mouth, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, k); } else t.mouth = null;
    // escala px/cm: ancho de hombros medido / ancho de hombros real (corrigiendo el giro)
    const raw = (sw / Math.max(Math.cos(S.yaw), 0.4)) / S.shoulderCm;
    t.pxcm = t.pxcm ? t.pxcm + (raw - t.pxcm) * 0.3 : raw;
  }

  // ---- dibujo ----
  function fitCanvas() {
    const vw = video.videoWidth || 1280, vh = video.videoHeight || 720;
    if (canvas.width !== vw || canvas.height !== vh) { canvas.width = vw; canvas.height = vh; }
    const bw = stageBox.clientWidth, bh = stageBox.clientHeight, r = vw / vh;
    let w = bw, h = bw / r; if (h > bh) { h = bh; w = bh * r; }
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  }
  window.addEventListener('resize', fitCanvas);

  // ---- malla deformable ----
  const COLS = 14, ROWS = 18;
  const mc = document.createElement('canvas'), mctx = mc.getContext('2d');
  function segDist(p, a, b) {
    const abx = b[0] - a[0], aby = b[1] - a[1], l2 = abx * abx + aby * aby || 1;
    const t = clamp(((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / l2, 0, 1);
    return Math.hypot(p[0] - (a[0] + abx * t), p[1] - (a[1] + aby * t));
  }
  function inPoly(p, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      if ((poly[i][1] > p[1]) !== (poly[j][1] > p[1]) && p[0] < (poly[j][0] - poly[i][0]) * (p[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0]) c = !c;
    }
    return c;
  }
  function polyDist(p, poly) {
    if (inPoly(p, poly)) return 0;
    let m = 1e9;
    for (let i = 0; i < poly.length; i++) m = Math.min(m, segDist(p, poly[i], poly[(i + 1) % poly.length]));
    return m;
  }
  function getMesh(key, fit, im) {
    if (S.meshes[key]) return S.meshes[key];
    const f = fit || {};
    const W = im.naturalWidth, H = im.naturalHeight;
    const sh = f.sh || [0.16, 0.2], tx = f.tx || 0.21, hy = f.hy || 0.97, rad = (f.r || 0.08) * W;
    const mir = (a) => [W - a[0] * W, a[1] * H], abs = (a) => [a[0] * W, a[1] * H];
    const hasEl = !!f.el, hasWr = !!(f.el && f.wr);
    const upEnd = hasEl ? f.el : (f.end ? f.end : null);
    const mk = (m) => { const q = m ? mir : abs; return { sh: q(sh), upB: upEnd ? q(upEnd) : null, wr: hasWr ? q(f.wr) : null }; };
    const arms = [mk(false), mk(true)];
    const a0 = abs(sh), a1 = mir(sh);
    const aN = [W / 2, (f.cy != null ? f.cy : 0.02) * H];
    const e1 = [a1[0] - a0[0], a1[1] - a0[1]], e3 = [aN[0] - a0[0], aN[1] - a0[1]], det2 = e1[0] * e3[1] - e1[1] * e3[0];
    const shY = a0[1], hemY = hy * H;
    const hwSh = W / 2 - a0[0], hwHem = W / 2 - tx * W;
    const poly = [[a0[0], 0], [a1[0], 0], [a1[0], a1[1]], [W - tx * W, hemY], [tx * W, hemY], [a0[0], a0[1]]];
    const NV = (COLS + 1) * (ROWS + 1), NB = 5;
    const w = new Float32Array(NV * NB), la = new Float32Array(NV * NB), lp = new Float32Array(NV * NB);
    const uu = new Float32Array(NV), vv = new Float32Array(NV), ts2 = new Float32Array(NV * 2), above = new Uint8Array(NV), src = new Float32Array(NV * 2);
    const bones = [];
    arms.forEach((a, k) => { if (a.upB) bones.push({ i: 1 + 2 * k, a: a.sh, b: a.upB }); if (a.upB && a.wr) bones.push({ i: 2 + 2 * k, a: a.upB, b: a.wr }); });
    for (let j = 0; j <= ROWS; j++) for (let i = 0; i <= COLS; i++) {
      const v = j * (COLS + 1) + i, px = [i / COLS * W, j / ROWS * H];
      src[v * 2] = px[0]; src[v * 2 + 1] = px[1];
      const d0 = [px[0] - a0[0], px[1] - a0[1]];
      ts2[v * 2] = (d0[0] * e3[1] - d0[1] * e3[0]) / det2; ts2[v * 2 + 1] = (e1[0] * d0[1] - e1[1] * d0[0]) / det2;
      above[v] = px[1] < shY ? 1 : 0;
      const vn = (px[1] - shY) / (hemY - shY);
      vv[v] = vn;
      const hwImg = lerp(hwSh, hwHem, clamp(vn, 0, 1));
      uu[v] = (px[0] - W / 2) / hwImg;
      const eps = (0.012 * W) ** 2; let sum = 0; const ws = new Array(NB).fill(0);
      const dT = polyDist(px, poly); ws[0] = 1 / ((dT * dT + eps) ** 2); sum += ws[0];
      bones.forEach((bn) => {
        const d = Math.max(0, segDist(px, bn.a, bn.b) - rad);
        ws[bn.i] = 1 / ((d * d + eps) ** 2); sum += ws[bn.i];
        const ux = bn.b[0] - bn.a[0], uy = bn.b[1] - bn.a[1], L = Math.hypot(ux, uy) || 1;
        la[v * NB + bn.i] = ((px[0] - bn.a[0]) * ux + (px[1] - bn.a[1]) * uy) / (L * L);
        lp[v * NB + bn.i] = (-(px[0] - bn.a[0]) * uy + (px[1] - bn.a[1]) * ux) / L;
      });
      for (let b = 0; b < NB; b++) w[v * NB + b] = ws[b] / sum;
    }
    const occ = new Uint8Array(COLS * ROWS).fill(1);
    let avg = [128, 128, 128];
    try {
      const oc = document.createElement('canvas'); oc.width = COLS * 4; oc.height = ROWS * 4;
      const o = oc.getContext('2d'); o.drawImage(im, 0, 0, oc.width, oc.height);
      const d = o.getImageData(0, 0, oc.width, oc.height).data;
      for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
        let any = 0;
        for (let y = 0; y < 4 && !any; y++) for (let x = 0; x < 4; x++) if (d[((j * 4 + y) * oc.width + i * 4 + x) * 4 + 3] > 20) { any = 1; break; }
        occ[j * COLS + i] = any;
      }
      const c2 = document.createElement('canvas'); c2.width = 40; c2.height = 40;
      const o2 = c2.getContext('2d'); o2.drawImage(im, W * 0.35, H * 0.3, W * 0.3, H * 0.25, 0, 0, 40, 40);
      const d2 = o2.getImageData(0, 0, 40, 40).data; let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d2.length; i += 4) if (d2[i + 3] > 200) { r += d2[i]; g += d2[i + 1]; b += d2[i + 2]; n++; }
      if (n) avg = [r / n, g / n, b / n];
    } catch (e) {}
    const sleeveWImg = (f.sleeveW || 0.19) * W;
    const m = { W, H, w, la, lp, uu, vv, ts2, above, src, occ, arms, hasEl, hasWr, f, a0, a1, aN, avg, natHsw: (a0[1] - aN[1]) / (a1[0] - a0[0]), sleeveWImg, NV, NB };
    S.meshes[key] = m; return m;
  }

  function drawTri(c, im, s, d) {
    const [x0, y0, x1, y1, x2, y2] = s, [u0, v0, u1, v1, u2, v2] = d;
    const delta = x0 * y1 + y0 * x2 + x1 * y2 - y1 * x2 - y0 * x1 - x0 * y2;
    if (Math.abs(delta) < 1e-6) return;
    const a = (u0 * y1 + y0 * u2 + u1 * y2 - y1 * u2 - y0 * u1 - u0 * y2) / delta;
    const b = (v0 * y1 + y0 * v2 + v1 * y2 - y1 * v2 - y0 * v1 - v0 * y2) / delta;
    const cc = (x0 * u1 + u0 * x2 + x1 * u2 - u1 * x2 - u0 * x1 - x0 * u2) / delta;
    const dd = (x0 * v1 + v0 * x2 + x1 * v2 - v1 * x2 - v0 * x1 - x0 * v2) / delta;
    const e = (x0 * y1 * u2 + y0 * u1 * x2 + u0 * x1 * y2 - u0 * y1 * x2 - y0 * x1 * u2 - x0 * u1 * y2) / delta;
    const f = (x0 * y1 * v2 + y0 * v1 * x2 + v0 * x1 * y2 - v0 * y1 * x2 - y0 * x1 * v2 - x0 * v1 * y2) / delta;
    const cx = (u0 + u1 + u2) / 3, cy = (v0 + v1 + v2) / 3;
    const g = (u, v) => { const dx = u - cx, dy = v - cy, l = Math.hypot(dx, dy) || 1; return [u + dx / l * 0.7, v + dy / l * 0.7]; };
    const p0 = g(u0, v0), p1 = g(u1, v1), p2 = g(u2, v2);
    c.save();
    c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.closePath(); c.clip();
    c.setTransform(a, b, cc, dd, e, f);
    const bx = Math.max(0, Math.min(x0, x1, x2) - 1), by = Math.max(0, Math.min(y0, y1, y2) - 1);
    c.drawImage(im, bx, by, Math.min(im.naturalWidth - bx, Math.max(x0, x1, x2) - bx + 2), Math.min(im.naturalHeight - by, Math.max(y0, y1, y2) - by + 2), bx, by, Math.min(im.naturalWidth - bx, Math.max(x0, x1, x2) - bx + 2), Math.min(im.naturalHeight - by, Math.max(y0, y1, y2) - by + 2));
    c.restore();
  }

  // ---- silueta y capa que tapa la ropa propia ----
  const maskSmall = document.createElement('canvas'), mctx2 = maskSmall.getContext('2d');
  const rc = document.createElement('canvas'), rctx = rc.getContext('2d');
  const hc = document.createElement('canvas'), hctx = hc.getContext('2d');
  const sc = document.createElement('canvas'), sctx = sc.getContext('2d');
  const pyr = [];
  window.__DELTACTICA_DEBUG = { rc, hc, mc, maskSmall };
  function updateMask(mk) {
    try {
      const w = mk.width, h = mk.height, f = mk.getAsFloat32Array();
      const st = Math.max(1, Math.round(w / 320)), ow = Math.floor(w / st), oh = Math.floor(h / st);
      if (maskSmall.width !== ow || maskSmall.height !== oh) { maskSmall.width = ow; maskSmall.height = oh; }
      const id = mctx2.createImageData(ow, oh), d = id.data;
      for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
        const v = f[(y * st) * w + x * st], i = (y * ow + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = clamp((v - 0.2) * 6, 0, 1) * 255;
      }
      mctx2.putImageData(id, 0, 0); S.maskReady = true;
    } catch (e) { S.hide = false; S.maskReady = false; console.warn('Sin máscara de silueta', e); }
  }
  function hideOwnClothes(m, c) {
    const W = canvas.width, H = canvas.height;
    if (rc.width !== W || rc.height !== H) { rc.width = hc.width = sc.width = W; rc.height = hc.height = sc.height = H; }
    rctx.setTransform(1, 0, 0, 1, 0, 0); rctx.globalCompositeOperation = 'source-over'; rctx.clearRect(0, 0, W, H);
    rctx.save();
    if (S.mirror) { rctx.translate(W, 0); rctx.scale(-1, 1); }
    const dl = Math.max(2, Math.round(c.span * 0.02));
    [[0, 0], [dl, 0], [-dl, 0], [0, dl], [0, -dl], [dl, dl], [-dl, -dl]].forEach(([dx, dy]) => rctx.drawImage(maskSmall, dx, dy, W, H));
    rctx.restore();
    // zona del cuerpo que cubre la prenda: torso (con deltoides y la ropa propia), cuello y brazos
    sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, W, H);
    sctx.fillStyle = '#fff'; sctx.strokeStyle = '#fff';
    const P = (base, rx, dy) => [base.x + c.right[0] * rx + c.down[0] * dy, base.y + c.right[1] * rx + c.down[1] * dy];
    const nk = 0.17 * c.span, hemD = c.hemDist + 3 * c.pxcm;
    const top = P(c.mid, 0, 0);
    const pts = [
      [c.AN[0] - c.right[0] * nk, c.AN[1] - c.right[1] * nk], [c.AN[0] + c.right[0] * nk, c.AN[1] + c.right[1] * nk],
      P(c.mid, 0.74 * c.span, -0.05 * c.span), P(c.mid, 0.7 * c.span, 0.35 * c.span), P(c.mid, 0.62 * c.span, hemD),
      P(c.mid, -0.62 * c.span, hemD), P(c.mid, -0.7 * c.span, 0.35 * c.span), P(c.mid, -0.74 * c.span, -0.05 * c.span),
    ];
    void top;
    sctx.beginPath(); sctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sctx.lineTo(pts[i][0], pts[i][1]); sctx.closePath(); sctx.fill();
    sctx.lineWidth = 0.44 * c.span; sctx.lineCap = 'butt'; sctx.lineJoin = 'round';
    c.chains.forEach((ch) => { if (!ch) return; sctx.beginPath(); sctx.moveTo(ch[0][0], ch[0][1]); for (let i = 1; i < ch.length; i++) sctx.lineTo(ch[i][0], ch[i][1]); sctx.stroke(); });
    rctx.globalCompositeOperation = 'destination-in'; rctx.drawImage(sc, 0, 0); rctx.globalCompositeOperation = 'source-over';
    // relleno con la tela: color medio + derrame de los colores de la prenda
    hctx.setTransform(1, 0, 0, 1, 0, 0); hctx.globalCompositeOperation = 'source-over'; hctx.clearRect(0, 0, W, H);
    hctx.fillStyle = `rgb(${m.avg[0] | 0},${m.avg[1] | 0},${m.avg[2] | 0})`; hctx.fillRect(0, 0, W, H);
    let prev = mc; const sizes = [2, 4, 8, 16, 32];
    sizes.forEach((dv, i) => {
      const cw = Math.max(2, Math.round(W / dv)), ch = Math.max(2, Math.round(H / dv));
      if (!pyr[i]) pyr[i] = document.createElement('canvas');
      pyr[i].width = cw; pyr[i].height = ch;
      const pc = pyr[i].getContext('2d'); pc.clearRect(0, 0, cw, ch); pc.drawImage(prev, 0, 0, cw, ch); prev = pyr[i];
    });
    hctx.imageSmoothingEnabled = true;
    for (let i = sizes.length - 1; i >= 0; i--) hctx.drawImage(pyr[i], 0, 0, W, H);
    hctx.drawImage(mc, 0, 0);
    hctx.globalCompositeOperation = 'destination-in'; hctx.drawImage(rc, 0, 0); hctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(hc, 0, 0);
  }

  const unit = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  function pointAt(chain, d) { // punto a distancia d (px) siguiendo la cadena de puntos
    let acc = 0;
    for (let i = 0; i < chain.length - 1; i++) {
      const L = Math.hypot(chain[i + 1][0] - chain[i][0], chain[i + 1][1] - chain[i][1]);
      if (acc + L >= d || i === chain.length - 2) { const t = L ? (d - acc) / L : 0; return [chain[i][0] + (chain[i + 1][0] - chain[i][0]) * t, chain[i][1] + (chain[i + 1][1] - chain[i][1]) * t]; }
      acc += L;
    }
    return chain[chain.length - 1];
  }

  function truncChain(chain, d) { // tramo de la cadena hasta la distancia d
    const pts = [chain[0]]; let acc = 0;
    for (let i = 0; i < chain.length - 1; i++) {
      const L = Math.hypot(chain[i + 1][0] - chain[i][0], chain[i + 1][1] - chain[i][1]);
      if (acc + L >= d) { pts.push(pointAt(chain, d)); return pts; }
      pts.push(chain[i + 1]); acc += L;
    }
    return pts;
  }

  function drawFitted() {
    const t = S.t, p = S.prenda;
    if (!t) { S.lastAuto = null; return; }
    const useBack = S.view === 'back' && !!S.imgBack;
    if (S.view === 'back' && !S.imgBack && S.backWarn !== p.id) { S.backWarn = p.id; setStatus('Esta prenda aún no tiene foto de espalda: se muestra el frente.'); }
    const im = useBack ? S.imgBack : S.img;
    const m = getMesh(p.id + (useBack ? ':back' : ''), useBack ? (p.fit_back || p.fit) : p.fit, im);
    const D = sizedDims(p), ws = S.adj.scale, pxcm = t.pxcm;
    const dyv = S.adj.dy * pxcm * S.shoulderCm;
    const sh = (q) => q && [q.x, q.y + dyv];
    const sL = sh(t.sL), sR = sh(t.sR);
    const span = Math.hypot(sR[0] - sL[0], sR[1] - sL[1]) || 1;
    const right = unit([sR[0] - sL[0], sR[1] - sL[1]]);
    const mid = { x: (sL[0] + sR[0]) / 2, y: (sL[1] + sR[1]) / 2 };
    let down = [-right[1], right[0]]; if (down[1] < 0) down = [-down[0], -down[1]];
    if (t.hM) { const dh = unit([t.hM.x - mid.x, t.hM.y + dyv - mid.y]); if (dh[1] > 0.3) down = unit([0.6 * dh[0] + 0.4 * down[0], 0.6 * dh[1] + 0.4 * down[1]]); }
    // cuello
    let up = [-down[0], -down[1]], neckLen = 0.6 * span;
    if (t.mouth) { const vx = t.mouth.x - mid.x, vy = t.mouth.y + dyv - mid.y, l = Math.hypot(vx, vy); if (l > 0.2 * span && l < 1.4 * span) { neckLen = l; up = [vx / l, vy / l]; } }
    const collarH = Math.min(m.f.neck != null ? m.f.neck * neckLen : m.natHsw * span * ws, 0.62 * neckLen);
    const AN = [mid.x + up[0] * collarH, mid.y + up[1] * collarH];
    // torso con medidas reales: ancho en hombros -> pecho -> bajo, largo en cm
    const cyaw = Math.max(Math.cos(S.yaw), 0.3);
    const hw0 = span / 2, VIS = 0.70;
    const hwc = VIS * D.pecho / 2 * pxcm * ws * cyaw, hwh = VIS * D.bajo / 2 * pxcm * ws * cyaw;
    const hemDist = Math.max(0.4 * span, (D.largo - 3) * pxcm);
    const sm = (x) => x * x * (3 - 2 * x);
    const hwT = (v) => { const vc = 0.28; v = clamp(v, 0, 1.2); return v < vc ? lerp(hw0, hwc, sm(v / vc)) : lerp(hwc, hwh, clamp((v - vc) / (1 - vc), 0, 1.3)); };
    const TT = (vi) => { // vértice (torso)
      if (m.above[vi]) { const u = m.ts2[vi * 2], v2 = m.ts2[vi * 2 + 1]; return [sL[0] + u * (sR[0] - sL[0]) + v2 * (AN[0] - sL[0]), sL[1] + u * (sR[1] - sL[1]) + v2 * (AN[1] - sL[1])]; }
      const v = m.vv[vi], hw = hwT(v) * m.uu[vi];
      return [mid.x + down[0] * v * hemDist + right[0] * hw, mid.y + down[1] * v * hemDist + right[1] * hw];
    };
    // brazos: cadena hombro -> codo -> muñeca (-> mano), manga con largo real
    const upperPx = 0.8 * span, forePx = 0.62 * span;
    const g = (VIS * (D.biceps) * pxcm * ws) / (m.sleeveWImg || 1);
    const bones = [null, null, null, null, null], chains = [null, null];
    [0, 1].forEach((k) => {
      const arm = m.arms[k]; if (!arm.upB) return;
      const S0 = k === 0 ? sL : sR;
      const Ed = k === 0 ? sh(t.eL) : sh(t.eR), Wd = k === 0 ? sh(t.wL) : sh(t.wR);
      const E = Ed || [S0[0] + down[0] * upperPx, S0[1] + down[1] * upperPx];
      let Wr = Wd; if (!Wr) { const dd = Ed ? unit([E[0] - S0[0], E[1] - S0[1]]) : down; Wr = [E[0] + dd[0] * forePx, E[1] + dd[1] * forePx]; }
      const df = unit([Wr[0] - E[0], Wr[1] - E[1]]);
      const chain = [S0, E, Wr, [Wr[0] + df[0] * 0.6 * span, Wr[1] + df[1] * 0.6 * span]];
      const sleeve = D.manga * pxcm;
      chains[k] = truncChain(chain, sleeve * 1.03); // la zona que tapa termina donde termina la manga
      if (m.hasEl) {
        const lenUp = Math.hypot(E[0] - S0[0], E[1] - S0[1]);
        bones[1 + 2 * k] = { A: S0, B: E };
        if (m.hasWr) bones[2 + 2 * k] = { A: E, B: pointAt(chain, Math.max(sleeve, lenUp * 1.15)) };
      } else bones[1 + 2 * k] = { A: S0, B: pointAt(chain, sleeve) };
    });
    const NB = m.NB, out = new Float32Array(m.NV * 2);
    for (let v = 0; v < m.NV; v++) {
      let x = 0, y = 0;
      const wt = m.w[v * NB];
      if (wt > 0) { const q = TT(v); x += wt * q[0]; y += wt * q[1]; }
      for (let b = 1; b < NB; b++) {
        const wb = m.w[v * NB + b]; if (wb <= 0) continue;
        const bn = bones[b]; let q;
        if (bn) {
          const dx = bn.B[0] - bn.A[0], dy = bn.B[1] - bn.A[1], L = Math.hypot(dx, dy) || 1, al = m.la[v * NB + b], pp = m.lp[v * NB + b] * g;
          q = [bn.A[0] + al * dx + pp * (-dy / L), bn.A[1] + al * dy + pp * (dx / L)];
        } else q = TT(v);
        x += wb * q[0]; y += wb * q[1];
      }
      out[v * 2] = x; out[v * 2 + 1] = y;
    }
    if (mc.width !== canvas.width || mc.height !== canvas.height) { mc.width = canvas.width; mc.height = canvas.height; }
    mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, mc.width, mc.height);
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
      if (!m.occ[j * COLS + i]) continue;
      const v00 = j * (COLS + 1) + i, v10 = v00 + 1, v01 = v00 + COLS + 1, v11 = v01 + 1;
      const s = (v) => [m.src[v * 2], m.src[v * 2 + 1]], d = (v) => [out[v * 2], out[v * 2 + 1]];
      drawTri(mctx, im, [...s(v00), ...s(v10), ...s(v01)], [...d(v00), ...d(v10), ...d(v01)]);
      drawTri(mctx, im, [...s(v10), ...s(v11), ...s(v01)], [...d(v10), ...d(v11), ...d(v01)]);
    }
    if (S.hide && S.maskReady) hideOwnClothes(m, { span, right, down, mid, AN, pxcm, hemDist, chains });
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3; ctx.drawImage(mc, 0, 0); ctx.restore();
    const wpx = span / ((m.a1[0] - m.a0[0]) / m.W);
    S.lastAuto = { cx: mid.x, cy: mid.y + (0.5 - m.f.sh[1]) * wpx * m.H / m.W, w: wpx, rot: Math.atan2(sR[1] - sL[1], sR[0] - sL[0]) };
  }

  function drawGarment() {
    if (!S.img || !S.prenda || S.scan.active) return;
    if (S.mode === 'auto') { if (S.scan.done) drawFitted(); return; }
    const im = (S.view === 'back' && S.imgBack) ? S.imgBack : S.img;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
    const m = S.manual, w = m.w * canvas.width, h = w * im.naturalHeight / im.naturalWidth;
    ctx.translate(m.x * canvas.width, m.y * canvas.height); ctx.rotate(m.rot * Math.PI / 180);
    ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
  }
  function drawFrame() {
    ctx.save(); if (S.mirror) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height); ctx.restore();
  }
  function loop() {
    requestAnimationFrame(loop);
    if (aiActive() || !S.stream || !video.videoWidth || video.readyState < 2) return;
    if (canvas.width !== video.videoWidth) fitCanvas();
    S.frame++;
    if (S.frame % 10 === 0) measureLight();
    if ((S.mode === 'auto' || S.scan.active) && window.__deltacticaFakePose) { // solo para pruebas
      handlePose({ landmarks: [window.__deltacticaFakePose] });
      if (window.__deltacticaFakeMask && S.hide) { maskSmall.width = 320; maskSmall.height = 180; window.__deltacticaFakeMask(mctx2, 320, 180); S.maskReady = true; }
    } else if ((S.mode === 'auto' || S.scan.active) && S.landmarker && video.currentTime !== S.lastVideoTime) {
      S.lastVideoTime = video.currentTime;
      try {
        const res = S.landmarker.detectForVideo(detectionSource(), performance.now());
        handlePose(res);
        const mk = res.segmentationMasks && res.segmentationMasks[0];
        if (mk) { if ((S.frame % 2) === 0 && S.hide) updateMask(mk); if (mk.close) mk.close(); }
        else if (S.hide && S.frame > 60 && !S.maskReady) { S.hide = false; btnHide.classList.remove('on'); setStatus('Este navegador no entrega la silueta: no se puede ocultar tu ropa.'); }
        if (res.close) res.close();
      } catch (e) {}
    }
    drawFrame(); drawGarment();
    if (S.scan.active) drawScanGuide();
  }


  // ================= ESCANEO DEL CUERPO (paso 1) =================
  const SCAN_ITEMS = [
    ['face', 'Rostro visible'], ['shoulders', 'Hombros visibles'], ['arms', 'Codos visibles'],
    ['dist', 'Distancia correcta'], ['center', 'Centrado'], ['still', 'Quieto'], ['hips', 'Cadera visible (recomendado)'], ['light', 'Luz de frente (recomendado)'],
  ];
  function startScan() {
    S.scan = { active: true, done: false, okMs: 0, last: performance.now(), hist: [], msg: 'Colócate frente a la cámara…', checks: {} };
    S.body = null; S.t = null; S.skip = 0;
    scanPanel.classList.add('show'); renderScan();
    setStatus('Escaneo: sigue la silueta y quédate quieto.');
  }
  function measureLight() {
    try {
      lctx.drawImage(video, 0, 0, 32, 18);
      const d = lctx.getImageData(0, 0, 32, 18).data; let c = 0, nc = 0, e = 0, ne = 0;
      for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) {
        const i = (y * 32 + x) * 4, l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (x >= 10 && x < 22 && y >= 3) { c += l; nc++; } else if (x < 6 || x >= 26) { e += l; ne++; }
      }
      S.light = { center: c / nc, edge: e / ne };
    } catch (e) {}
  }
  function scanStep(lm) {
    const sc = S.scan, now = performance.now(), dt = Math.min(200, now - sc.last); sc.last = now;
    const W = canvas.width, H = canvas.height, ok = {};
    let msg = 'No te veo: colócate de frente a la cámara.';
    if (lm) {
      const v = (i, th) => lm[i] && lm[i].visibility > (th || 0.5) && lm[i].x > 0.02 && lm[i].x < 0.98 && lm[i].y > 0.0 && lm[i].y < 1.0;
      ok.face = v(0) && (v(2) || v(5));
      ok.shoulders = v(11, 0.6) && v(12, 0.6);
      ok.arms = v(13, 0.4) && v(14, 0.4);
      ok.hips = v(23, 0.4) && v(24, 0.4);
      let spanF = 0, cx = 0.5, cy = 0.5;
      if (lm[11] && lm[12]) { spanF = Math.abs(lm[11].x - lm[12].x); cx = (lm[11].x + lm[12].x) / 2; cy = (lm[11].y + lm[12].y) / 2; }
      ok.dist = ok.shoulders && spanF >= 0.16 && spanF <= 0.42;
      ok.center = ok.shoulders && Math.abs(cx - 0.5) < 0.2;
      sc.hist.push({ x: cx, y: cy, t: now }); while (sc.hist.length && now - sc.hist[0].t > 800) sc.hist.shift();
      let dev = 0; sc.hist.forEach((p) => { dev = Math.max(dev, Math.hypot(p.x - cx, p.y - cy)); });
      ok.still = ok.shoulders && sc.hist.length > 6 && dev < 0.02;
      const L = S.light; ok.light = !L || (L.center > 55 && L.center / Math.max(L.edge, 1) > 0.6);
      if (!ok.face) msg = 'Muestra tu rostro y hombros: aléjate un poco de la cámara.';
      else if (!ok.shoulders) msg = 'Aléjate: deben verse tus dos hombros.';
      else if (spanF > 0.42) msg = 'Aléjate un poco de la cámara.';
      else if (spanF < 0.16) msg = 'Acércate un poco a la cámara.';
      else if (!ok.arms) msg = 'Que se vean tus brazos (codos) dentro del cuadro.';
      else if (!ok.center) msg = 'Céntrate frente a la cámara.';
      else if (!ok.still) msg = 'Quédate quieto un momento…';
      else msg = ok.light ? 'Perfecto, no te muevas…' : 'Perfecto. (Hay contraluz: mejor luz de frente.)';
      sc.spanF = spanF;
    }
    sc.checks = ok; sc.msg = msg;
    const required = ok.face && ok.shoulders && ok.arms && ok.dist && ok.center && ok.still;
    sc.okMs = required ? sc.okMs + dt : Math.max(0, sc.okMs - dt * 2);
    if (sc.okMs >= 1500) {
      sc.active = false; sc.done = true;
      S.body = { spanF: sc.spanF, hips: !!ok.hips, light: !!ok.light, at: Date.now() };
      S.t = null;
      scanMsg.textContent = 'Escaneo completo ✓'; scanBar.style.width = '100%';
      setTimeout(() => { if (S.scan.done) scanPanel.classList.remove('show'); }, 1400);
      setStatus('Escaneo listo ✓ Ahora elige: IA realista o 2D básico.' + (ok.hips ? '' : ' (Consejo: aléjate un poco para que se vea la cadera.)'));
    }
    renderScan();
  }
  function renderScan() {
    const sc = S.scan;
    scanList.innerHTML = SCAN_ITEMS.map(([k, label]) => `<li class="${sc.checks[k] ? 'ok' : (k === 'hips' || k === 'light' ? 'tip' : 'no')}">${label}</li>`).join('');
    scanBar.style.width = Math.min(100, sc.okMs / 15) + '%';
    if (!sc.done) scanMsg.textContent = sc.msg;
  }
  function drawScanGuide() {
    const W = canvas.width, H = canvas.height, ok = S.scan.okMs > 0;
    ctx.save();
    ctx.strokeStyle = ok ? '#2ecc71' : 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(2, W / 400); ctx.setLineDash([12, 9]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(0.5 * W, 0.2 * H, 0.055 * W, 0.115 * H, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0.5 * W, 0.315 * H); ctx.lineTo(0.5 * W, 0.37 * H);
    ctx.moveTo(0.36 * W, 0.42 * H); ctx.quadraticCurveTo(0.5 * W, 0.34 * H, 0.64 * W, 0.42 * H);
    ctx.moveTo(0.36 * W, 0.42 * H); ctx.lineTo(0.31 * W, 0.98 * H); ctx.moveTo(0.64 * W, 0.42 * H); ctx.lineTo(0.69 * W, 0.98 * H);
    ctx.moveTo(0.41 * W, 0.45 * H); ctx.lineTo(0.41 * W, 0.98 * H); ctx.moveTo(0.59 * W, 0.45 * H); ctx.lineTo(0.59 * W, 0.98 * H);
    ctx.stroke(); ctx.restore();
  }

  // ================= MODO IA REALISTA (Decart Lucy VTON) =================
  const ai = { rt: null, stream: null, timer: null, secs: 0, starting: false };
  const aiActive = () => !!(ai.rt || ai.starting);
  const csrf = () => { const m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/); return m ? decodeURIComponent(m[1]) : ''; };
  async function loadDecart() {
    if (window.__deltacticaFakeDecart) return window.__deltacticaFakeDecart; // solo pruebas
    const urls = [CFG.decartSdkUrl, 'https://esm.sh/@decartai/sdk', 'https://cdn.jsdelivr.net/npm/@decartai/sdk/+esm'].filter(Boolean);
    let last;
    for (const u of urls) { try { return await import(u); } catch (e) { last = e; } }
    throw last || new Error('No se pudo cargar el SDK de Decart');
  }
  function promptFor(p) {
    const base = p.prompt_ia || `Substitute the current top with ${p.nombre}`;
    const k = SIZES.indexOf(S.size);
    const fit = k <= 0 ? ', slim fitted look' : (k >= 3 ? ', relaxed loose oversized fit' : (k === 2 ? ', slightly relaxed fit' : ', regular fit'));
    return base + fit;
  }
  async function garmentBlob(p) { // prenda sobre fondo blanco (lo recomienda el modelo), cuadrada y de buena resolución
    const im = await loadSrc(p.img);
    const sz = Math.max(768, Math.max(im.naturalWidth, im.naturalHeight) + 80);
    const c = document.createElement('canvas'); c.width = c.height = sz;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, sz, sz);
    const sc = Math.min((sz - 80) / im.naturalWidth, (sz - 80) / im.naturalHeight);
    g.drawImage(im, (sz - im.naturalWidth * sc) / 2, (sz - im.naturalHeight * sc) / 2, im.naturalWidth * sc, im.naturalHeight * sc);
    return new Promise((res) => c.toBlob(res, 'image/png'));
  }
  async function startAI() {
    if (ai.starting || ai.rt) return;
    if (!S.scan.done) { setStatus('Primero escanea tu cuerpo (botón "Escanear cuerpo").'); if (!S.scan.active && S.stream) startScan(); return; }
    if (!S.prenda) { setStatus('Elige una prenda primero.'); return; }
    if (!CFG.tokenUrl) { setStatus('La IA no está configurada: falta la clave de Decart en el servidor (ver LEEME).'); return; }
    try {
      if (!localStorage.getItem('deltactica_ia_ok')) {
        if (!window.confirm('En el modo realista el video de tu cámara se envía a la IA mientras lo uses. ¿Continúas?')) return;
        localStorage.setItem('deltactica_ia_ok', '1');
      }
    } catch (e) {}
    ai.starting = true; btnAI.classList.add('on'); setStatus('Conectando con la IA…');
    try {
      const sdk = await loadDecart();
      const model = sdk.models.realtime(CFG.decartModel);
      stopCamera(true);
      ai.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', frameRate: model.fps, width: model.width, height: model.height }, audio: false });
      const client = sdk.createDecartClient({
        apiKeyProvider: async () => {
          const r = await fetch(CFG.tokenUrl, { method: 'POST', headers: { 'X-CSRFToken': csrf() }, credentials: 'same-origin' });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !j.apiKey) throw new Error(j.error || 'No se pudo obtener el permiso de la IA');
          return j.apiKey;
        },
      });
      const blob = await garmentBlob(S.prenda);
      const opts = {
        model, mirror: true,
        onRemoteStream: (rs) => { aiVideo.srcObject = rs; aiVideo.play().catch(() => {}); },
        initialState: { prompt: { text: promptFor(S.prenda), enhance: false }, image: blob },
      };
      if (CFG.decartFast) opts.speed = 'fast';
      ai.rt = await client.realtime.connect(ai.stream, opts);
      ai.rt.on('connectionChange', (st) => { if (st === 'generating') setStatus('IA activa: muévete, gira, levanta los brazos.'); if (st === 'reconnecting') setStatus('Reconectando…'); if (st === 'disconnected' && ai.rt) stopAI(true); });
      ai.rt.on('error', (e) => { setStatus('Error de la IA: ' + (e && e.message ? e.message : e)); });
      ai.secs = 0; const rate = CFG.decartFast ? 0.04 : 0.02;
      ai.rt.on('generationTick', ({ seconds }) => { ai.secs = seconds; renderAiStat(rate); if (seconds >= CFG.maxAiSeconds) { setStatus('Se acabó el tiempo de la cámara (' + CFG.maxAiSeconds + ' s).'); stopAI(); } });
      S.mode = 'ai'; stageBox.classList.add('ai'); btnAuto.classList.remove('on'); btnManual.classList.remove('on');
      scanPanel.classList.remove('show'); renderAiStat(rate);
    } catch (e) {
      console.warn('IA no disponible', e);
      setStatus('No se pudo iniciar la IA: ' + (e && e.message ? e.message : e) + '. Usa el 2D básico.');
      await stopAI(true); S.mode = 'auto'; btnAuto.classList.add('on');
    } finally { ai.starting = false; }
  }
  function renderAiStat(rate) { aiStat.textContent = `IA en vivo · ${Math.round(ai.secs)} s · costo aprox. US$${(ai.secs * rate).toFixed(2)} (límite ${CFG.maxAiSeconds} s)`; }
  async function stopAI(silent) {
    try { if (ai.rt) ai.rt.disconnect(); } catch (e) {}
    ai.rt = null;
    if (ai.stream) ai.stream.getTracks().forEach((t) => t.stop());
    ai.stream = null; aiVideo.srcObject = null; stageBox.classList.remove('ai'); btnAI.classList.remove('on'); aiStat.textContent = '';
    if (S.mode === 'ai') { S.mode = 'auto'; btnAuto.classList.add('on'); }
    if (!silent) { setStatus('IA detenida. Volviendo a la cámara…'); startCamera(true); }
  }
  async function updateAIGarment() {
    if (!ai.rt || !S.prenda) return;
    try { await ai.rt.set({ prompt: promptFor(S.prenda), image: await garmentBlob(S.prenda), enhance: false }); setStatus('Prenda cambiada: ' + S.prenda.nombre); }
    catch (e) { setStatus('No se pudo cambiar la prenda: ' + (e && e.message ? e.message : e)); }
  }

  // ---- interacción manual ----
  const ptrs = new Map(); let gesture = null;
  const toNorm = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
  canvas.addEventListener('pointerdown', (e) => {
    if (S.mode !== 'manual' || !S.img) return;
    canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, toNorm(e));
    gesture = { m: { ...S.manual }, p: [...ptrs.values()].map((p) => ({ ...p })) };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId) || !gesture) return;
    ptrs.set(e.pointerId, toNorm(e));
    const cur = [...ptrs.values()], g0 = gesture.p;
    if (cur.length === 1) { S.manual.x = clamp(gesture.m.x + (cur[0].x - g0[0].x), 0, 1); S.manual.y = clamp(gesture.m.y + (cur[0].y - g0[0].y), 0, 1); }
    else if (cur.length >= 2 && g0.length >= 2) {
      const asp = canvas.width / canvas.height;
      const d0 = Math.hypot((g0[1].x - g0[0].x) * asp, g0[1].y - g0[0].y), d1 = Math.hypot((cur[1].x - cur[0].x) * asp, cur[1].y - cur[0].y);
      S.manual.w = clamp(gesture.m.w * (d1 / (d0 || 1)), 0.15, 1.3);
      const a0 = Math.atan2(g0[1].y - g0[0].y, (g0[1].x - g0[0].x) * asp), a1 = Math.atan2(cur[1].y - cur[0].y, (cur[1].x - cur[0].x) * asp);
      S.manual.rot = clamp(gesture.m.rot + (a1 - a0) * 180 / Math.PI, -60, 60);
    }
    syncSliders();
  });
  const endPtr = (e) => { ptrs.delete(e.pointerId); gesture = ptrs.size ? { m: { ...S.manual }, p: [...ptrs.values()].map((p) => ({ ...p })) } : null; };
  canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('wheel', (e) => {
    if (S.mode !== 'manual') return; e.preventDefault();
    if (e.shiftKey) S.manual.rot = clamp(S.manual.rot + (e.deltaY > 0 ? 2 : -2), -60, 60);
    else S.manual.w = clamp(S.manual.w * (e.deltaY > 0 ? 0.96 : 1.04), 0.15, 1.3);
    syncSliders();
  }, { passive: false });
  stageBox.addEventListener('dragover', (e) => { e.preventDefault(); dropHint.classList.add('show'); });
  stageBox.addEventListener('dragleave', () => dropHint.classList.remove('show'));
  stageBox.addEventListener('drop', async (e) => {
    e.preventDefault(); dropHint.classList.remove('show');
    const id = e.dataTransfer.getData('text/plain'); if (!id) return;
    if (S.mode === 'manual') { const n = toNorm(e); S.manual.x = clamp(n.x, 0, 1); S.manual.y = clamp(n.y, 0, 1); }
    await selectPrenda(id, true);
    if (S.mode === 'manual') syncSliders();
    if (!S.stream) setStatus('Prenda elegida. Activa la cámara para probártela.');
  });

  // ---- foto ----
  btnPhoto.onclick = () => {
    if (!S.stream && !aiActive()) { setStatus('Activa la cámara para tomar la foto.'); return; }
    const out = document.createElement('canvas');
    const o = out.getContext('2d');
    if (aiActive() && aiVideo.videoWidth) { out.width = aiVideo.videoWidth; out.height = aiVideo.videoHeight; o.drawImage(aiVideo, 0, 0); }
    else { out.width = canvas.width; out.height = canvas.height; o.drawImage(canvas, 0, 0); }
    const fs = Math.round(out.height * 0.028);
    o.font = `700 ${fs}px sans-serif`; o.fillStyle = 'rgba(255,255,255,.85)'; o.shadowColor = 'rgba(0,0,0,.6)'; o.shadowBlur = 6;
    o.fillText('DELTACTICA' + (S.prenda ? ' · ' + S.prenda.nombre + ' · talla ' + S.size : ''), fs, out.height - fs);
    out.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'deltactica-probador-' + Date.now() + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, 'image/png');
  };

  loadProfile(); renderChips(); renderGrid(); fitCanvas();
  if (prendas.length) selectPrenda(prendas[0].id);
  setMode('auto');
  setStatus('Listo. Elige una prenda y tu talla, y activa la cámara.');
  requestAnimationFrame(loop);
})();
