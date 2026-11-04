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
    if (/gafa/.test(plain(item.name))) return "cara";
    if (grupo === "guantes") return "manos";
    return "extra";
  }

  function vista(item, numero) {
    const clave = item.id.toLowerCase().replace(/-/g, "");
    return `img/puesto/${clave}-${String(numero).padStart(2, "0")}.webp?v=9`;
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

  const pielCabeza = '<ellipse cx="178" cy="118" rx="8" ry="12" fill="#f1f1f1"/><ellipse cx="262" cy="118" rx="8" ry="12" fill="#f1f1f1"/><ellipse cx="220" cy="114" rx="44" ry="54" fill="#f7f7f7"/><path d="M203 104h12M225 104h12" stroke="#8d8d8d" stroke-width="2.4" stroke-linecap="round"/><path d="M214 126c3 5 9 5 12 0" stroke="#9a9a9a" stroke-width="1.8" fill="none"/><path d="M204 148c10 7 22 7 32 0" stroke="#8a8a8a" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M196 158h48c6 18 4 40-2 52h-44c-6-12-8-34-2-52z" fill="#f4f4f4"/>';
  const pielManos = '<g fill="#f7f7f7"><rect x="50" y="424" width="5" height="14" rx="2"/><rect x="57" y="420" width="5" height="16" rx="2"/><rect x="64" y="420" width="5" height="16" rx="2"/><rect x="71" y="424" width="5" height="13" rx="2"/><ellipse cx="60" cy="448" rx="16" ry="14"/><ellipse cx="42" cy="440" rx="7" ry="9"/><rect x="364" y="424" width="5" height="14" rx="2"/><rect x="371" y="420" width="5" height="16" rx="2"/><rect x="378" y="420" width="5" height="16" rx="2"/><rect x="385" y="424" width="5" height="13" rx="2"/><ellipse cx="380" cy="448" rx="16" ry="14"/><ellipse cx="398" cy="440" rx="7" ry="9"/></g>';
  const pielCuerpo = '<path fill="#f7f7f7" d="M156 206c-8 28-22 78-34 150-8 48-4 92 8 118l22-16c-6-28-2-62 6-108 8-42 14-86 18-144z"/><path fill="#f7f7f7" d="M284 206c8 28 22 78 34 150 8 48 4 92-8 118l-22-16c6-28 2-62-6-108-8-42-14-86-18-144z"/><path fill="#f6f6f6" d="M164 198h112c22 16 34 78 28 168-4 62-10 120-22 176H158c-12-56-18-114-22-176-6-90 6-152 28-168z"/><path fill="#f7f7f7" d="M150 470h140v110H150z"/><path fill="#f7f7f7" d="M156 548c-2 100 0 270 8 460h52c0-190 2-350 4-460z"/><path fill="#f7f7f7" d="M228 548c2 110 4 270 4 460h52c8-190 6-360 0-460z"/><ellipse cx="184" cy="1024" rx="24" ry="14" fill="#f7f7f7"/><ellipse cx="256" cy="1024" rx="24" ry="14" fill="#f7f7f7"/>';

  function figura(clase, arriba) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", clase);
    svg.setAttribute("viewBox", "0 0 440 1120");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = (arriba ? "" : pielCuerpo) + pielCabeza + pielManos;
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
    if (/\blicra\b|pantaloneta|\bfalda\b/.test(plain(item.name))) image.dataset.largo = "corto";
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
        image.style.transform = on ? `perspective(1600px) rotateY(${yaw.toFixed(2)}deg)` : "none";
      });
    });
    const giro = `perspective(1600px) rotateY(${yaw.toFixed(2)}deg)`;
    stage.querySelectorAll(".fit-blank, .fit-piel").forEach((pieza) => {
      pieza.style.transform = giro;
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
    cuerpoCaja.append(figura("fit-blank", false));
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
    if (puesto.arriba || puesto.completo) cuerpoCaja.append(figura("fit-piel", true));
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
