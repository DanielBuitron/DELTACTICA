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
  const puesto = { arriba: null, abajo: null, completo: null, cabeza: null, pies: null, cintura: null, manos: null, extra: [] };
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
    return `img/puesto/${clave}-${String(numero).padStart(2, "0")}.webp?v=12`;
  }

  function foto(item) {
    return typeof productImage === "function" ? productImage(item) : (item.image || "");
  }

  function prendasPuestas() {
    return [puesto.completo, puesto.arriba, puesto.abajo].filter(Boolean);
  }

  function accesoriosPuestos() {
    return [puesto.cabeza, puesto.pies, puesto.cintura, puesto.manos, ...puesto.extra].filter(Boolean);
  }

  function todosPuestos() {
    return [...prendasPuestas(), ...accesoriosPuestos()];
  }

  function estaPuesto(id) {
    return todosPuestos().some((item) => item.id === id);
  }

  const trenSuperior = { y: 148, alto: 340, ancho: 336 };
  const trenInferior = { y: 400, alto: 630, ancho: 400 };
  const trenCompleto = { y: 164, alto: 830, ancho: 336 };
  const trenExtra = {
    cabeza: { y: 18, alto: 156, ancho: 200, base: 176 },
    cara: { y: 118, alto: 36, ancho: 110 },
    cintura: { y: 438, alto: 52, ancho: 300 },
    pies: { y: 700, alto: 160, ancho: 250, base: 860 },
    manos: { y: 400, alto: 110, ancho: 120, x: 300 },
  };

  function figura(clase, soloCabeza) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", clase);
    svg.setAttribute("viewBox", "0 0 440 1120");
    svg.setAttribute("aria-hidden", "true");
    const cuerpo = `<defs><linearGradient id="dt-volumen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b7b1a6"/><stop offset="0.18" stop-color="#f7f4ee"/><stop offset="0.48" stop-color="#fffdfb"/><stop offset="0.78" stop-color="#efeae2"/><stop offset="1" stop-color="#aea79c"/></linearGradient></defs>
      <ellipse cx="220" cy="1048" rx="72" ry="10" fill="rgba(40,32,20,0.16)"/>
      <path fill="url(#dt-volumen)" d="M158 214c-8 40-12 110-2 190 6 48 4 90 12 136h104c8-46 6-88 12-136 10-80 6-150-2-190-18 16-48 24-68 24s-50-8-68-24z"/>
      <path fill="url(#dt-volumen)" d="M170 530c-4 50-8 140-4 250 2 40 8 70 22 78 12 6 22-8 22-28 0-80 2-180 4-250 0-16-12-36-22-42-10-4-18-4-22-8z"/>
      <path fill="url(#dt-volumen)" d="M270 530c4 50 8 140 4 250-2 40-8 70-22 78-12 6-22-8-22-28 0-80-2-180-4-250 0-16 12-36 22-42 10-4 18-4 22-8z"/>
      <path fill="#f3efe8" d="M196 148h48c2 28 4 60 2 96h-52c-2-36 0-68 2-96z"/>
      <path fill="#efeae2" d="M198 156c4 24 8 42 10 58h24c2-16 6-34 10-58-8 8-28 8-44 0z"/>
      <ellipse cx="220" cy="118" rx="42" ry="48" fill="url(#dt-volumen)"/>
      <ellipse cx="206" cy="114" rx="22" ry="32" fill="#fffdfb" opacity="0.55"/>`;
    const cabeza = `<ellipse cx="220" cy="148" rx="48" ry="54" fill="#f4f0e8" stroke="#c8c1b4" stroke-width="2"/><ellipse cx="204" cy="140" rx="24" ry="36" fill="#fffdfb" opacity="0.72"/><ellipse cx="238" cy="154" rx="14" ry="28" fill="#cfc8bc" opacity="0.45"/>`;
    const corte = cuerpo.indexOf('<path fill="#efeae2"');
    const sinCabeza = corte > 0 ? cuerpo.slice(0, corte) : cuerpo;
    if (soloCabeza === "sin-cabeza") svg.innerHTML = sinCabeza;
    else svg.innerHTML = soloCabeza ? cabeza : cuerpo;
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
    let scale = tren.alto / Math.max(1, bh);
    if (bw * scale > tren.ancho) scale = tren.ancho / Math.max(1, bw);
    return scale;
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
      ? (corto ? { y: 390, alto: 280, ancho: 260, soporte: true } : { ...trenInferior, soporte: true })
      : clase === "fit-full"
        ? trenCompleto
        : (largo ? { y: 168, alto: 470, ancho: 348 } : trenSuperior);
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

  function vestirAccesorio(item, zone) {
    const tren = { ...(trenExtra[zone] || trenExtra.cintura) };
    const canvas = document.createElement("canvas");
    canvas.width = 440;
    canvas.height = 1120;
    canvas.className = "fit-capa fit-accesorio";
    canvas.dataset.zona = zone;
    const image = new Image();
    image.src = foto(item);
    cuandoCargue(image, () => {
      const box = cajaDe(image) || { x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight };
      if (!box.w || !image.naturalWidth) return;
      const aspecto = box.w / box.h;
      if (zone === "pies") {
        const cortoPuesto = puesto.abajo && /\blicra\b|pantaloneta|\bfalda\b|bermuda/.test(plain(puesto.abajo.name));
        tren.base = cortoPuesto || !puesto.abajo ? 860 : 1040;
      }
      if (zone === "cintura" && aspecto < 1.15) {
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(96, 448, 248, 18);
        ctx.fillStyle = "#3a3a3a";
        ctx.fillRect(96, 448, 248, 4);
        const hebilla = { x: box.x, y: box.y, w: box.w, h: Math.max(1, Math.round(box.h * 0.42)) };
        const sitio = { y: 412, alto: 78, ancho: 78, x: 181 };
        const scale = medidaFrente(image, hebilla, sitio);
        const dw = hebilla.w * (440 / image.naturalWidth) * scale;
        const dh = hebilla.h * (1120 / image.naturalHeight) * scale;
        ctx.drawImage(image, hebilla.x, hebilla.y, hebilla.w, hebilla.h, sitio.x, sitio.y, dw, dh);
        return;
      }
      pintarRecorte(canvas, image, box, medidaFrente(image, box, tren), tren);
    });
    return canvas;
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
    const base = figura("fit-blank", (puesto.arriba || puesto.completo) ? "sin-cabeza" : false);
    const licraPuesta = puesto.abajo && /\blicra\b|pantaloneta|\bfalda\b|bermuda/.test(plain(puesto.abajo.name));
    if (puesto.pies && (licraPuesta || !puesto.abajo)) base.style.clipPath = "inset(0 0 30% 0)";
    else if (puesto.abajo || puesto.completo) base.style.clipPath = "inset(0 0 9% 0)";
    cuerpoCaja.append(base);
    frames = [];
    extras = [];
    const cuerpo = puesto.completo ? [puesto.completo] : prendas;
    cuerpo.forEach((item) => {
      const clase = puesto.completo ? "fit-full" : (abajo.has(item.id) ? "fit-abajo" : "fit-arriba");
      vestirPrenda(item, clase, cuerpoCaja);
    });
    if (puesto.arriba || puesto.completo) cuerpoCaja.append(figura("fit-piel", true));
    accesoriosPuestos().forEach((item) => {
      const zone = zona(item);
      if (!trenExtra[zone]) return;
      const lienzo = vestirAccesorio(item, zone);
      cuerpoCaja.append(lienzo);
      extras.push(lienzo);
    });
    angle = frames.length ? angle : 0;
    paint();
    paintPicks();
  }

  function quitar(id) {
    ["arriba", "abajo", "completo", "cabeza", "pies", "cintura", "manos"].forEach((key) => {
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
    ["arriba", "abajo", "completo", "cabeza", "pies", "cintura", "manos"].forEach((key) => { puesto[key] = null; });
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
