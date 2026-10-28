(function () {
  const grid = document.querySelector("[data-fit-grid]");
  if (!grid || !window.DT_CATALOG) return;
  const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const prendas = window.DT_CATALOG.filter((item) => window.DT_VISTAS && window.DT_VISTAS[item.id]);
  const stage = document.querySelector("[data-fit-stage]");
  const name = document.querySelector("[data-fit-name]");
  const note = document.querySelector("[data-fit-note]");
  const picksEl = document.querySelector("[data-fit-picks]");
  const add = document.querySelector("[data-fit-add]");
  let picks = [];
  let current = null;
  let frames = [];
  let angle = 0;
  let dragging = false;
  let anchorX = 0;
  let anchorA = 0;

  function vista(item, numero) {
    const clave = item.id.toLowerCase().replace(/-/g, "");
    return `img/vueltas/${clave}-${String(numero).padStart(2, "0")}.jpg?v=4`;
  }

  function paint() {
    if (!frames.length) return;
    let turn = angle % 360;
    if (turn < 0) turn += 360;
    const pos = turn / 360 * frames.length;
    const index = Math.floor(pos) % frames.length;
    const frac = pos - Math.floor(pos);
    const yaw = (frac - 0.5) * 34;
    frames.forEach((image, key) => {
      const on = key === index;
      image.style.opacity = on ? "1" : "0";
      image.style.visibility = on ? "visible" : "hidden";
      image.style.transform = on ? `perspective(1600px) rotateY(${yaw.toFixed(2)}deg)` : "none";
    });
  }

  function paintPicks() {
    picksEl.innerHTML = picks.map((id) => {
      const item = prendas.find((entry) => entry.id === id);
      if (!item) return "";
      const on = current && current.id === id ? " is-on" : "";
      return `<button type="button" class="fit-pick${on}" data-fit-show="${item.id}"><img src="${vista(item, 1)}" alt=""><span>${escapeHtml(item.name)}</span></button>`;
    }).join("");
  }

  function show(item) {
    current = item;
    name.textContent = `${item.id} · ${item.name}`;
    note.textContent = "Arrastre de lado a lado. A la mitad se ve la espalda.";
    add.hidden = false;
    add.dataset.add = item.id;
    stage.replaceChildren();
    frames = [1, 2, 3, 4].map((numero) => {
      const image = document.createElement("img");
      image.src = vista(item, numero);
      image.alt = numero === 1 ? item.name : "";
      image.draggable = false;
      image.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;visibility:hidden;pointer-events:none;";
      stage.append(image);
      return image;
    });
    angle = 0;
    paint();
    paintPicks();
  }

  function probar(item) {
    if (!picks.includes(item.id)) picks.push(item.id);
    show(item);
  }

  grid.innerHTML = prendas.map((item) => {
    const src = typeof productImage === "function" ? productImage(item) : vista(item, 1);
    return `<article class="card">
      <button class="plate plate-photo" type="button" data-fit-try="${item.id}"><img src="${src}" alt="${escapeHtml(item.name)}"></button>
      <div class="card-body">
        <p class="card-kicker"><span>${item.id}</span></p>
        <h3>${escapeHtml(item.name)}</h3>
        <button class="consult" type="button" data-fit-try="${item.id}">Probar</button>
        <a class="consult" href="producto.html?id=${item.id}">Ver en 360</a>
      </div>
    </article>`;
  }).join("");

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fit-try]");
    if (!button) return;
    const item = prendas.find((entry) => entry.id === button.dataset.fitTry);
    if (item) probar(item);
  });

  picksEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fit-show]");
    if (!button) return;
    const item = prendas.find((entry) => entry.id === button.dataset.fitShow);
    if (item) show(item);
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

  document.querySelector("[data-fit-cart]")?.addEventListener("click", () => {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("dt-cart") || "[]");
    } catch {
      saved = [];
    }
    const ids = (Array.isArray(saved) ? saved : []).map((line) => line.id).filter((id) => prendas.some((item) => item.id === id));
    if (!ids.length) {
      note.textContent = "En el carrito no hay prendas para probar.";
      return;
    }
    picks = [...new Set(ids)];
    const first = prendas.find((item) => item.id === picks[0]);
    if (first) show(first);
  });

  const preset = new URLSearchParams(location.search).get("id");
  const start = prendas.find((item) => item.id === String(preset || "").toUpperCase()) || prendas[0];
  if (start) probar(start);
})();
