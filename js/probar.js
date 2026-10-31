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

  function categoria(item) {
    const nombre = plain(item.name);
    const texto = plain(`${item.name} ${item.line}`);
    if (esPrenda(item)) {
      if (/uniforme|overol/.test(nombre)) return "uniformes";
      if (/chaqueta/.test(nombre)) return "chaquetas";
      if (/chaleco/.test(nombre)) return "chalecos";
      if (/\bpantalon|\bfalda|\blicra\b/.test(nombre)) return "pantalones";
      return "camisas";
    }
    if (item.stage === "cabeza" || /gorra|boina|pasamontan|cachucha|casco/.test(texto)) return "gorras";
    if (item.stage === "pie" || /bota|zapato/.test(texto)) return "botas";
    if (/reata|correa|cinturon/.test(texto)) return "reatas";
    if (/guante|gafa/.test(texto)) return "guantes";
    return "";
  }

  function zona(item) {
    if (esPrenda(item)) {
      if (abajo.has(item.id)) return "abajo";
      if (completo.has(item.id)) return "completo";
      return "arriba";
    }
    const grupo = categoria(item);
    if (grupo === "gorras") return "cabeza";
    if (grupo === "botas") return "pies";
    if (grupo === "reatas") return "cintura";
    if (grupo === "guantes") return "manos";
    return "extra";
  }

  function vista(item, numero) {
    const clave = item.id.toLowerCase().replace(/-/g, "");
    return `img/puesto/${clave}-${String(numero).padStart(2, "0")}.webp?v=3`;
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

  function maniqui() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "fit-blank");
    svg.setAttribute("viewBox", "0 0 440 1120");
    svg.setAttribute("aria-hidden", "true");
    const hayArriba = !!(puesto.arriba || puesto.completo);
    const hayAbajo = !!(puesto.abajo || puesto.completo);
    const tronco = hayArriba ? "" : '<path fill="#f4f4f4" d="M150 188h140v340H150z"/><path fill="#f7f7f7" d="M150 210c-30 20-70 70-78 180-6 70 8 120 28 130 16-40 22-110 34-160 8-30 12-20 16-150z"/><path fill="#f7f7f7" d="M290 210c30 20 70 70 78 180 6 70-8 120-28 130-16-40-22-110-34-160-8-30-12-20-16-150z"/>';
    const piernas = hayAbajo ? "" : '<path fill="#f7f7f7" d="M168 500h42l-8 520h-46z"/><path fill="#f7f7f7" d="M230 500h42l12 520h-46z"/><ellipse cx="176" cy="1048" rx="28" ry="16" fill="#f7f7f7"/><ellipse cx="264" cy="1048" rx="28" ry="16" fill="#f7f7f7"/>';
    svg.innerHTML = '<ellipse cx="220" cy="108" rx="50" ry="64" fill="#f7f7f7"/><rect x="198" y="156" width="44" height="42" rx="8" fill="#efefef"/>' + tronco + piernas;
    return svg;
  }

  function frame(item, numero, clase) {
    const image = document.createElement("img");
    image.src = esPrenda(item) ? vista(item, numero) : foto(item);
    image.alt = numero === 1 ? item.name : "";
    image.draggable = false;
    image.className = clase;
    image.dataset.capa = "prenda";
    image.style.cssText = "opacity:0;visibility:hidden;";
    image.dataset.zona = clase === "fit-abajo" ? "abajo" : clase === "fit-arriba" ? "arriba" : "completo";
    image.dataset.prenda = categoria(item);
    image.className = "fit-capa";
    return image;
  }

  function paint() {
    if (!frames.length) return;
    let turn = angle % 360;
    if (turn < 0) turn += 360;
    const pos = turn / 360 * 4;
    const frac = pos - Math.floor(pos);
    const yaw = (frac - 0.5) * 34;
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
        image.style.transform = on ? `translateX(-50%) perspective(1600px) rotateY(${yaw.toFixed(2)}deg)` : "translateX(-50%)";
      });
    });
    const frente = Math.cos(turn * Math.PI / 180);
    const visible = frente > 0.2 ? Math.min(1, (frente - 0.2) / 0.45) : 0;
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
      ? "Arrastre para girar. Toque la pieza puesta para quitarla y probar otra."
      : "El maniquí está en blanco. Elija una categoría y ponga la primera pieza.";
    add.hidden = !puestos.length;
    const cuerpoCaja = document.createElement("div");
    cuerpoCaja.className = "fit-body";
    stage.replaceChildren(cuerpoCaja);
    cuerpoCaja.append(maniqui());
    frames = [];
    extras = [];
    const cuerpo = puesto.completo ? [puesto.completo] : prendas;
    cuerpo.forEach((item) => {
      const clase = puesto.completo ? "fit-full" : (abajo.has(item.id) ? "fit-abajo" : "fit-arriba");
      for (let numero = 1; numero <= 4; numero += 1) {
        const image = frame(item, numero, clase);
        image.dataset.grupo = item.id;
        cuerpoCaja.append(image);
        frames.push(image);
      }
    });
    let extraIndex = 0;
    accesoriosPuestos().forEach((item) => {
      const image = document.createElement("img");
      image.src = foto(item);
      image.alt = item.name;
      image.draggable = false;
      image.className = "fit-piece";
      const zone = zona(item);
      image.dataset.zona = zone === "extra" ? "extra" : zone;
      if (zone === "extra") {
        image.style.top = `${6 + extraIndex * 23}%`;
        extraIndex += 1;
      }
      cuerpoCaja.append(image);
      extras.push(image);
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
    if (!frames.length) return;
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
