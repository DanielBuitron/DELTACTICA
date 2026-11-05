(function () {
  const grid = document.querySelector("[data-fit-grid]");
  const tabs = document.querySelector("[data-fit-tabs]");
  if (!grid || !tabs || !window.DT_CATALOG) return;
  const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const plain = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const abajo = new Set(["DT-1079", "DT-1080", "DT-1323", "DT-1325", "DT-1326", "DT-1327", "DT-1328", "DT-1329", "DT-1330"]);
  const completo = new Set(["DT-1324", "DT-1331", "DT-1332", "DT-1333", "DT-1334", "DT-1335"]);
  const nombres = [
    ["camisas", "Camisas"],
    ["chaquetas", "Chaquetas"],
    ["chalecos", "Chalecos"],
    ["pantalones", "Pantalones"],
    ["uniformes", "Uniformes"],
    ["gorras", "Gorras"],
    ["botas", "Botas"],
    ["reatas", "Reatas"],
    ["guantes", "Guantes"]
  ];
  const catalogo = window.DT_CATALOG.filter((item) => item.photo !== false);
  const stage = document.querySelector("[data-fit-stage]");
  const name = document.querySelector("[data-fit-name]");
  const note = document.querySelector("[data-fit-note]");
  const picksEl = document.querySelector("[data-fit-picks]");
  const add = document.querySelector("[data-fit-add]");
  const puesto = { arriba: null, abajo: null, completo: null, cabeza: null, cara: null, pies: null, cintura: null, manos: null, extra: [] };
  let tab = "camisas";
  let frames = [];
  let extras = [];
  let angle = 0;
  let dragging = false;
  let anchorX = 0;
  let anchorA = 0;

  function esPrenda(item) {
    return !!(window.DT_VISTAS && window.DT_VISTAS[item.id]);
  }

  function seViste(nombre) {
    if (/porta|linterna|cordon|\bmedias?\b|velcro/.test(nombre)) return false;
    if (/\bchapa\b/.test(nombre) && !/correa|corra|cinturon/.test(nombre)) return false;
    return true;
  }

  function categoria(item) {
    const nombre = plain(item.name);
    if (esPrenda(item)) {
      if (/uniforme|overol/.test(nombre)) return "uniformes";
      if (/chaqueta/.test(nombre)) return "chaquetas";
      if (/chaleco/.test(nombre)) return "chalecos";
      if (/\bpantalon|\bfalda|\blicra\b/.test(nombre)) return "pantalones";
      return "camisas";
    }
    if (!seViste(nombre)) return "";
    if (/\b(gorra|boina|pasamontan|cachucha|casco|kepis|pava)\b/.test(nombre)) return "gorras";
    if (/\b(botas?|zapatos?|zapatoz)\b/.test(nombre)) return "botas";
    if (/\b(reata|correas?|corras?|cinturon)\b/.test(nombre)) return "reatas";
    if (/\b(guantes?|gafas?|gasfas?)\b/.test(nombre)) return "guantes";
    return "";
  }

  function zona(item) {
    if (esPrenda(item)) {
      if (abajo.has(item.id)) return "abajo";
      if (completo.has(item.id)) return "completo";
      return "arriba";
    }
    const grupo = categoria(item);
    if (!grupo) return "";
    if (grupo === "gorras") return "cabeza";
    if (grupo === "botas") return "pies";
    if (grupo === "reatas") return "cintura";
    if (/gafa|gasfa/.test(plain(item.name))) return "cara";
    if (grupo === "guantes") return "manos";
    return "";
  }

  function vista(item, numero) {
    const clave = item.id.toLowerCase().replace(/-/g, "");
    return `img/puesto/${clave}-${String(numero).padStart(2, "0")}.webp?v=13`;
  }

  function foto(item) {
    return typeof productImage === "function" ? productImage(item) : (item.image || "");
  }

  function prendasPuestas() {
    return [puesto.completo, puesto.arriba, puesto.abajo].filter(Boolean);
  }

  function accesoriosPuestos() {
    return [puesto.cabeza, puesto.cara, puesto.pies, puesto.cintura, puesto.manos, ...puesto.extra].filter(Boolean);
  }

  function todosPuestos() {
    return [...prendasPuestas(), ...accesoriosPuestos()];
  }

  function estaPuesto(id) {
    return todosPuestos().some((item) => item.id === id);
  }

  const cuello = 196;
  const cinturaY = 430;
  const tobillo = 1004;
  const planta = 1056;
  const mete = 72;
  const trenSuperior = { y: cuello, alto: cinturaY - cuello + mete, ancho: 320 };
  const trenInferior = { y: cinturaY - 14, alto: tobillo - (cinturaY - 14), ancho: 260, soporte: true };
  const trenCompleto = { y: cuello, alto: tobillo - cuello, ancho: 320 };
  const trenExtra = {
    cabeza: { y: 0, alto: 168, ancho: 148, base: 128 },
    cara: { y: 124, alto: 28, ancho: 102 },
    cintura: { y: cinturaY - 20, alto: 22, ancho: 148 },
    pies: { y: planta - 84, alto: 84, ancho: 176, base: planta },
    manos: { y: 500, alto: 78, ancho: 72 },
  };

  function figura(clase) {
    const gid = "dt-vol-" + String(clase).replace(/[^a-z]/gi, "");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", clase);
    svg.setAttribute("viewBox", "0 0 440 1120");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = `<defs>
      <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#8a847b"/>
        <stop offset="0.14" stop-color="#d4cec3"/>
        <stop offset="0.36" stop-color="#fbf8f4"/>
        <stop offset="0.58" stop-color="#f1ece4"/>
        <stop offset="0.82" stop-color="#c9c2b6"/>
        <stop offset="1" stop-color="#7a746b"/>
      </linearGradient>
      <radialGradient id="${gid}-h" cx="40%" cy="36%" r="68%">
        <stop offset="0" stop-color="#fffdfb"/>
        <stop offset="0.45" stop-color="#efeae2"/>
        <stop offset="1" stop-color="#9c968c"/>
      </radialGradient>
    </defs>
      <ellipse cx="220" cy="1078" rx="70" ry="9" fill="rgba(40,32,20,0.16)"/>
      <path fill="url(#${gid})" d="M170 548 C154 610 142 700 146 790 C150 860 154 930 158 990 C156 1020 150 1042 146 1054 C158 1068 198 1070 210 1056 C204 1030 196 1004 190 978 C186 900 184 820 188 760 C194 680 206 610 214 566 C200 548 182 540 170 548 Z"/>
      <path fill="url(#${gid})" d="M270 548 C286 610 298 700 294 790 C290 860 286 930 282 990 C284 1020 290 1042 294 1054 C282 1068 242 1070 230 1056 C236 1030 244 1004 250 978 C254 900 256 820 252 760 C246 680 234 610 226 566 C240 548 258 540 270 548 Z"/>
      <path fill="url(#${gid})" d="M150 224 C160 196 188 188 206 204 L234 204 C252 188 280 196 290 224 C302 260 298 320 290 370 C284 410 270 430 258 444 C268 488 276 518 268 548 C246 564 220 572 220 572 C220 572 194 564 172 548 C164 518 172 488 182 444 C170 430 156 410 150 370 C142 320 138 260 150 224 Z"/>
      <path fill="url(#${gid})" d="M138 214 C118 230 102 280 104 340 C106 390 114 450 122 500 C126 524 120 542 126 558 C118 570 132 584 150 576 C164 568 160 544 154 522 C152 470 146 400 142 350 C138 290 152 246 166 220 C158 206 148 204 138 214 Z"/>
      <path fill="url(#${gid})" d="M302 214 C322 230 338 280 336 340 C334 390 326 450 318 500 C314 524 320 542 314 558 C322 570 308 584 290 576 C276 568 280 544 286 522 C288 470 294 400 298 350 C302 290 288 246 274 220 C282 206 292 204 302 214 Z"/>
      <path fill="#000" opacity="0.06" d="M176 218 C196 232 244 232 264 218 C248 234 192 234 176 218 Z"/>
      <path fill="url(#${gid})" d="M202 160 C198 178 192 194 186 210 L254 210 C248 194 242 178 238 160 C226 168 214 168 202 160 Z"/>
      <ellipse cx="176" cy="116" rx="9" ry="13" fill="url(#${gid})"/>
      <ellipse cx="264" cy="116" rx="9" ry="13" fill="url(#${gid})"/>
      <path fill="url(#${gid}-h)" d="M220 48 C246 48 268 70 270 100 C272 126 262 148 248 160 C236 172 228 178 220 180 C212 178 204 172 192 160 C178 148 168 126 170 100 C172 70 194 48 220 48 Z"/>`;
    return svg;
  }

  function esSoporte(r, g, b, a) {
    if (a < 28) return false;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    return mx > 175 && mx - mn < 48 && r > 165 && b > 135;
  }

  function cajaDe(img, ignorarSoporte) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return null;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    let data;
    try {
      data = ctx.getImageData(0, 0, w, h).data;
    } catch (error) {
      return { x: 0, y: 0, w, h };
    }
    const step = Math.max(1, Math.round(Math.min(w, h) / 220));
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    let n = 0;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        if (data[i + 3] < 28) continue;
        if (ignorarSoporte && esSoporte(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
        n += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (n < 12) return null;
    return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
  }

  function medidaFrente(img, box, tren) {
    const bw = box.w * (440 / img.naturalWidth);
    const bh = box.h * (1120 / img.naturalHeight);
    const porAlto = tren.alto / Math.max(1, bh);
    const porAncho = tren.ancho / Math.max(1, bw);
    return Math.max(porAlto, porAncho);
  }

  function pintarRecorte(canvas, img, box, scale, tren) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 440, 1120);
    const dw = box.w * (440 / img.naturalWidth) * scale;
    const dh = box.h * (1120 / img.naturalHeight) * scale;
    const dx = tren.x != null ? tren.x : (440 - dw) / 2;
    const dy = tren.base != null ? tren.base - dh : tren.y;
    ctx.drawImage(img, box.x, box.y, box.w, box.h, dx, dy, dw, dh);
    if (!tren.soporte) return;
    const frame = ctx.getImageData(0, 0, 440, 1120);
    const data = frame.data;
    let cambio = false;
    for (let i = 0; i < data.length; i += 4) {
      if (!esSoporte(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
      data[i + 3] = 0;
      cambio = true;
    }
    if (cambio) ctx.putImageData(frame, 0, 0);
  }

  function cuandoCargue(img, listo) {
    if (img.complete && img.naturalWidth) listo();
    else {
      img.onload = listo;
      img.onerror = listo;
    }
  }

  function vestirPrenda(item, clase, caja) {
    const corto = /\blicra\b|pantaloneta|\bfalda\b|bermuda/.test(plain(item.name));
    const largo = /chaqueta|chaleco/.test(plain(item.name));
    const tren = clase === "fit-abajo"
      ? (corto ? { y: cinturaY - 14, alto: 248, ancho: 230, soporte: true } : trenInferior)
      : clase === "fit-full"
        ? trenCompleto
        : (largo ? { y: cuello, alto: 520, ancho: 340 } : trenSuperior);
    const zonaNombre = clase === "fit-abajo" ? "abajo" : clase === "fit-full" ? "completo" : "arriba";
    const imgs = [];
    const lienzos = [];
    for (let numero = 1; numero <= 4; numero += 1) {
      const image = new Image();
      image.src = vista(item, numero);
      imgs.push(image);
      const canvas = document.createElement("canvas");
      canvas.width = 440;
      canvas.height = 1120;
      canvas.className = "fit-capa";
      canvas.dataset.grupo = item.id;
      canvas.dataset.zona = zonaNombre;
      canvas.dataset.prenda = categoria(item);
      canvas.style.cssText = "opacity:0;visibility:hidden;";
      lienzos.push(canvas);
      caja.append(canvas);
      frames.push(canvas);
    }
    let listos = 0;
    const aplicar = () => {
      const frente = cajaDe(imgs[0], tren.soporte);
      if (!frente) return;
      const scale = medidaFrente(imgs[0], frente, tren);
      imgs.forEach((img, index) => {
        if (!img.naturalWidth) return;
        pintarRecorte(lienzos[index], img, cajaDe(img, tren.soporte) || frente, scale, tren);
      });
      paint();
    };
    imgs.forEach((img) => cuandoCargue(img, () => {
      listos += 1;
      if (listos === imgs.length) aplicar();
    }));
  }

  function pintarFoto(canvas, img, box, tren) {
    const ctx = canvas.getContext("2d");
    const aspecto = box.w / Math.max(1, box.h);
    let dw = tren.ancho;
    let dh = dw / aspecto;
    if (dh > tren.alto) {
      dh = tren.alto;
      dw = dh * aspecto;
    }
    const dx = tren.x != null ? tren.x : (440 - dw) / 2;
    const dy = tren.base != null ? tren.base - dh : tren.y;
    ctx.drawImage(img, box.x, box.y, box.w, box.h, dx, dy, dw, dh);
  }

  function colorTela(img, box) {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const puntos = [
      [box.x + box.w * 0.5, box.y + box.h * 0.55],
      [box.x + box.w * 0.2, box.y + box.h * 0.5],
      [box.x + box.w * 0.8, box.y + box.h * 0.5]
    ];
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    puntos.forEach(([x, y]) => {
      const px = ctx.getImageData(Math.max(0, Math.floor(x)), Math.max(0, Math.floor(y)), 1, 1).data;
      if (px[3] < 40) return;
      r += px[0];
      g += px[1];
      b += px[2];
      n += 1;
    });
    if (!n) return "#1a1a1a";
    return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
  }

  function vestirCintura(correa, hebilla, img, box) {
    const y = cinturaY - 18;
    const ctx = correa.getContext("2d");
    ctx.fillStyle = colorTela(img, box);
    ctx.beginPath();
    ctx.roundRect(136, y, 168, 16, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(136, y, 168, 3);
    const h = hebilla.getContext("2d");
    const bw = Math.max(1, box.w * 0.34);
    const bh = Math.max(1, box.h * 0.55);
    const bx = box.x + (box.w - bw) / 2;
    const by = box.y + box.h * 0.2;
    h.drawImage(img, bx, by, bw, bh, 188, y - 10, 64, 40);
  }

  function vestirManos(canvas, img, box) {
    [[96, 508], [272, 508]].forEach(([x, y]) => {
      pintarFoto(canvas, img, box, { x, y, ancho: 72, alto: 78 });
    });
  }

  function lienzoAccesorio(zone) {
    const canvas = document.createElement("canvas");
    canvas.width = 440;
    canvas.height = 1120;
    canvas.className = "fit-capa fit-accesorio";
    canvas.dataset.zona = zone;
    return canvas;
  }

  function vestirAccesorio(item, zone) {
    const tren = { ...(trenExtra[zone] || trenExtra.cintura) };
    const canvas = lienzoAccesorio(zone);
    const extra = zone === "cintura" ? lienzoAccesorio("hebilla") : null;
    const image = new Image();
    image.src = foto(item);
    cuandoCargue(image, () => {
      const box = cajaDe(image) || { x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight };
      if (!box.w || !image.naturalWidth) return;
      if (zone === "cintura") {
        vestirCintura(canvas, extra, image, box);
        return;
      }
      if (zone === "manos") {
        vestirManos(canvas, image, box);
        return;
      }
      if (zone === "pies") tren.base = planta;
      pintarFoto(canvas, image, box, tren);
    });
    return extra ? [canvas, extra] : canvas;
  }

  function paint() {
    let turn = angle % 360;
    if (turn < 0) turn += 360;
    const pos = frames.length ? (turn / 360) * 4 : 0;
    const frac = pos - Math.floor(pos);
    const yaw = (frac - 0.5) * 42;
    const cuerpo = stage.querySelector(".fit-body");
    if (cuerpo) {
      const volumen = (0.93 + 0.07 * Math.abs(Math.cos((turn * Math.PI) / 180))).toFixed(3);
      cuerpo.style.transform = `perspective(980px) rotateY(${yaw.toFixed(2)}deg) scaleX(${volumen})`;
    }
    if (frames.length) {
      const groups = {};
      frames.forEach((image) => {
        const key = image.dataset.grupo || "a";
        groups[key] = groups[key] || [];
        groups[key].push(image);
      });
      Object.values(groups).forEach((group) => {
        const local = Math.floor(pos) % group.length;
        group.forEach((image, key) => {
          const on = key === local;
          image.style.opacity = on ? "1" : "0";
          image.style.visibility = on ? "visible" : "hidden";
        });
      });
    }
    const frente = Math.cos((turn * Math.PI) / 180);
    const visible = frente > 0.15 ? Math.min(1, (frente - 0.15) / 0.4) : 0;
    extras.forEach((image) => {
      image.style.opacity = String(visible);
    });
  }

  function paintPicks() {
    picksEl.innerHTML = todosPuestos().map((item) => {
      const src = esPrenda(item) ? vista(item, 1) : foto(item);
      return `<button type="button" class="fit-pick is-on" data-fit-drop="${item.id}"><img src="${src}" alt=""><span>${escapeHtml(item.name)}</span></button>`;
    }).join("");
  }

  function render() {
    const prendas = prendasPuestas();
    const puestos = todosPuestos();
    name.textContent = puestos.map((item) => item.name).join(" + ") || "Maniquí en blanco";
    note.textContent = prendas.length
      ? "Arrastre de lado a lado para dar la vuelta. Toque la pieza puesta para quitarla."
      : "Maniquí listo. Elija una categoría y ponga la prenda: el tren superior viste camisas y el inferior, pantalones.";
    add.hidden = !puestos.length;
    const cuerpoCaja = document.createElement("div");
    cuerpoCaja.className = "fit-body";
    stage.replaceChildren(cuerpoCaja);
    const base = figura("fit-blank");
    const abajoCorto = puesto.abajo && /\blicra\b|pantaloneta|\bfalda\b|bermuda/.test(plain(puesto.abajo.name));
    if (puesto.completo) base.style.clipPath = "inset(0 0 82% 0)";
    else if (puesto.abajo && !abajoCorto) base.style.clipPath = "inset(0 0 58% 0)";
    cuerpoCaja.append(base);
    frames = [];
    extras = [];
    const cuerpo = puesto.completo ? [puesto.completo] : prendas;
    cuerpo.forEach((item) => {
      const clase = puesto.completo ? "fit-full" : (abajo.has(item.id) ? "fit-abajo" : "fit-arriba");
      vestirPrenda(item, clase, cuerpoCaja);
    });
    if ((puesto.arriba || puesto.completo) && !puesto.cabeza) {
      const piel = figura("fit-piel");
      piel.style.clipPath = "inset(0 0 84% 0)";
      cuerpoCaja.append(piel);
    }
    accesoriosPuestos().forEach((item) => {
      const zone = zona(item);
      if (!trenExtra[zone]) return;
      const lienzos = vestirAccesorio(item, zone);
      (Array.isArray(lienzos) ? lienzos : [lienzos]).forEach((lienzo) => {
        cuerpoCaja.append(lienzo);
        extras.push(lienzo);
      });
    });
    angle = frames.length ? angle : 0;
    paint();
    paintPicks();
  }

  function quitar(id) {
    ["arriba", "abajo", "completo", "cabeza", "cara", "pies", "cintura", "manos"].forEach((key) => {
      if (puesto[key] && puesto[key].id === id) puesto[key] = null;
    });
    puesto.extra = puesto.extra.filter((item) => item.id !== id);
  }

  function poner(item) {
    if (estaPuesto(item.id)) {
      quitar(item.id);
      render();
      return;
    }
    const zone = zona(item);
    if (!zone) return;
    if (zone === "arriba") {
      puesto.arriba = item;
      puesto.completo = null;
    } else if (zone === "abajo") {
      puesto.abajo = item;
      puesto.completo = null;
    } else if (zone === "completo") {
      puesto.completo = item;
      puesto.arriba = null;
      puesto.abajo = null;
    } else if (zone === "extra") {
      puesto.extra = puesto.extra.filter((entry) => entry.id !== item.id);
      if (puesto.extra.length >= 4) puesto.extra.shift();
      puesto.extra.push(item);
    } else {
      puesto[zone] = item;
    }
    render();
  }

  function pintarTabs() {
    const visibles = nombres.filter(([id]) => catalogo.some((item) => categoria(item) === id));
    tabs.innerHTML = visibles.map(([id, etiqueta]) => `<button class="filter${id === tab ? " is-active" : ""}" type="button" data-fit-tab="${id}">${etiqueta}</button>`).join("");
  }

  function pintarGrid() {
    const lista = catalogo.filter((item) => categoria(item) === tab);
    grid.innerHTML = lista.map((item) => {
      const puestoAhora = estaPuesto(item.id);
      return `<article class="card${puestoAhora ? " is-on" : ""}">
        <button class="plate plate-photo" type="button" data-fit-try="${item.id}"><img src="${foto(item)}" alt="${escapeHtml(item.name)}"></button>
        <div class="card-body">
          <p class="card-kicker"><span>${item.id}</span></p>
          <h3>${escapeHtml(item.name)}</h3>
          <button class="consult" type="button" data-fit-try="${item.id}">${puestoAhora ? "Quitar" : "Poner"}</button>
        </div>
      </article>`;
    }).join("") || `<p class="lead">En esta categoría no hay fotos listas.</p>`;
  }

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fit-try]");
    if (!button) return;
    const item = catalogo.find((entry) => entry.id === button.dataset.fitTry);
    if (!item) return;
    poner(item);
    pintarGrid();
  });

  picksEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fit-drop]");
    if (!button) return;
    quitar(button.dataset.fitDrop);
    render();
    pintarGrid();
  });

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fit-tab]");
    if (!button) return;
    tab = button.dataset.fitTab;
    pintarTabs();
    pintarGrid();
  });

  stage.addEventListener("pointerdown", (event) => {
    dragging = true;
    anchorX = event.clientX;
    anchorA = angle;
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    angle = anchorA + (anchorX - event.clientX) / Math.max(1, stage.clientWidth) * 720;
    paint();
  });
  const soltar = () => { dragging = false; };
  stage.addEventListener("pointerup", soltar);
  stage.addEventListener("pointercancel", soltar);

  if (add) {
    add.addEventListener("click", (event) => {
      event.stopPropagation();
      const ids = todosPuestos().map((item) => item.id);
      if (!ids.length || typeof addToCart !== "function") return;
      let message = "";
      ids.forEach((id) => {
        const result = addToCart(id, 1);
        if (result) message = result;
      });
      add.textContent = message || "Añadido al carrito";
      window.setTimeout(() => { add.textContent = "Añadir lo puesto"; }, 1600);
    });
  }

  document.querySelector("[data-fit-cart]")?.addEventListener("click", () => {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("dt-cart") || "[]");
    } catch {
      saved = [];
    }
    const ids = (Array.isArray(saved) ? saved : []).map((line) => line.id);
    const items = ids.map((id) => catalogo.find((item) => item.id === id)).filter((item) => item && categoria(item));
    if (!items.length) {
      note.textContent = "En el carrito no hay prendas ni accesorios para vestir el maniquí.";
      return;
    }
    ["arriba", "abajo", "completo", "cabeza", "cara", "pies", "cintura", "manos"].forEach((key) => { puesto[key] = null; });
    puesto.extra = [];
    items.forEach((item) => poner(item));
    pintarGrid();
  });

  const preset = catalogo.find((item) => item.id === String(new URLSearchParams(location.search).get("id") || "").toUpperCase());
  if (preset && categoria(preset)) tab = categoria(preset);
  pintarTabs();
  pintarGrid();
  if (preset && categoria(preset)) poner(preset);
  else render();
  pintarGrid();
})();
