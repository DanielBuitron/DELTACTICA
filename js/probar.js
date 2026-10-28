(function () {
  const grid = document.querySelector("[data-fit-grid]");
  if (!grid || !window.DT_CATALOG) return;
  const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const plain = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const abajo = new Set(["DT-1079", "DT-1080", "DT-1323", "DT-1325", "DT-1326", "DT-1327", "DT-1328", "DT-1329", "DT-1330"]);
  const completo = new Set(["DT-1324", "DT-1331", "DT-1332", "DT-1333", "DT-1334", "DT-1335"]);
  const catalogo = window.DT_CATALOG.filter((item) => item.photo !== false);
  const stage = document.querySelector("[data-fit-stage]");
  const name = document.querySelector("[data-fit-name]");
  const note = document.querySelector("[data-fit-note]");
  const picksEl = document.querySelector("[data-fit-picks]");
  const add = document.querySelector("[data-fit-add]");
  const puesto = { arriba: null, abajo: null, completo: null, cabeza: null, pies: null, cintura: null, manos: null, extra: [] };
  let tab = "prendas";
  let frames = [];
  let extras = [];
  let angle = 0;
  let dragging = false;
  let anchorX = 0;
  let anchorA = 0;

  function esPrenda(item) {
    return !!(window.DT_VISTAS && window.DT_VISTAS[item.id]);
  }

  function zona(item) {
    if (esPrenda(item)) {
      if (abajo.has(item.id)) return "abajo";
      if (completo.has(item.id)) return "completo";
      return "arriba";
    }
    const texto = plain(`${item.line} ${item.name} ${item.stage}`);
    if (item.stage === "cabeza" || /gorra|boina|pasamontan|cachucha|casco/.test(texto)) return "cabeza";
    if (item.stage === "pie" || /bota|zapato|calzado/.test(texto)) return "pies";
    if (/reata|correa|cinturon/.test(texto)) return "cintura";
    if (/gafa|guante|linterna/.test(texto)) return "manos";
    return "extra";
  }

  function vista(item, numero) {
    const clave = item.id.toLowerCase().replace(/-/g, "");
    return `img/vueltas/${clave}-${String(numero).padStart(2, "0")}.jpg?v=4`;
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

  function frame(item, numero, clase) {
    const image = document.createElement("img");
    image.src = esPrenda(item) ? vista(item, numero) : foto(item);
    image.alt = numero === 1 ? item.name : "";
    image.draggable = false;
    image.className = clase;
    image.dataset.capa = "prenda";
    image.style.cssText = "position:absolute;width:100%;object-fit:contain;opacity:0;visibility:hidden;pointer-events:none;";
    if (clase === "fit-arriba") image.style.cssText += "top:0;height:64%;";
    else if (clase === "fit-abajo") image.style.cssText += "bottom:0;height:54%;";
    else image.style.cssText += "inset:0;height:100%;";
    stage.append(image);
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
    const accesorios = accesoriosPuestos();
    name.textContent = todosPuestos().map((item) => item.name).join(" + ") || "Elige una prenda o un accesorio";
    note.textContent = prendas.length
      ? "Arrastre para girar la prenda. Los accesorios se ven de frente, sobre el uniforme."
      : "Añada una prenda y luego los accesorios: gorra, botas, reata, guantes o lo que lleve el avatar.";
    add.hidden = !todosPuestos().length;
    stage.replaceChildren();
    frames = [];
    extras = [];
    const doble = puesto.arriba && puesto.abajo && !puesto.completo;
    const cuerpo = puesto.completo ? [puesto.completo] : doble ? [puesto.arriba, puesto.abajo] : prendas;
    cuerpo.forEach((item) => {
      const clase = !puesto.completo && puesto.arriba && puesto.abajo
        ? (abajo.has(item.id) ? "fit-abajo" : "fit-arriba")
        : "fit-full";
      for (let numero = 1; numero <= 4; numero += 1) {
        const image = frame(item, numero, clase);
        image.dataset.grupo = item.id;
        stage.append(image);
        frames.push(image);
      }
    });
    let extraIndex = 0;
    accesorios.forEach((item) => {
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
      stage.append(image);
      extras.push(image);
    });
    angle = 0;
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

  function pintarGrid() {
    const lista = catalogo.filter((item) => {
      if (tab === "prendas") return esPrenda(item);
      if (tab === "accesorios") return !esPrenda(item);
      return true;
    });
    grid.innerHTML = lista.map((item) => {
      const prenda = esPrenda(item);
      return `<article class="card">
        <button class="plate plate-photo" type="button" data-fit-try="${item.id}"><img src="${foto(item)}" alt="${escapeHtml(item.name)}"></button>
        <div class="card-body">
          <p class="card-kicker"><span>${item.id}</span><span>${escapeHtml(item.line)}</span></p>
          <h3>${escapeHtml(item.name)}</h3>
          <button class="consult" type="button" data-fit-try="${item.id}">${prenda ? "Probar" : "Añadir"}</button>
          <a class="consult" href="producto.html?id=${item.id}">${prenda ? "Ver en 360" : "Ver foto"}</a>
        </div>
      </article>`;
    }).join("");
  }

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fit-try]");
    if (!button) return;
    const item = catalogo.find((entry) => entry.id === button.dataset.fitTry);
    if (item) poner(item);
  });

  picksEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fit-drop]");
    if (!button) return;
    quitar(button.dataset.fitDrop);
    render();
  });

  document.querySelectorAll("[data-fit-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      tab = button.dataset.fitTab;
      document.querySelectorAll("[data-fit-tab]").forEach((item) => item.classList.toggle("is-active", item === button));
      pintarGrid();
    });
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
    const items = ids.map((id) => catalogo.find((item) => item.id === id)).filter(Boolean);
    if (!items.length) {
      note.textContent = "En el carrito no hay productos para armar el avatar.";
      return;
    }
    ["arriba", "abajo", "completo", "cabeza", "pies", "cintura", "manos"].forEach((key) => { puesto[key] = null; });
    puesto.extra = [];
    items.forEach((item) => poner(item));
  });

  pintarGrid();
  const preset = catalogo.find((item) => item.id === String(new URLSearchParams(location.search).get("id") || "").toUpperCase());
  if (preset) poner(preset);
  else render();
})();
