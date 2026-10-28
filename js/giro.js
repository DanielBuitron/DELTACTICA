(function () {
  const host = document.querySelector("[data-giro-root]");
  if (!host) return;
  const plain = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const list = window.DT_CATALOG || [];
  const id = (new URLSearchParams(location.search).get("id") || "").toUpperCase();
  const item = list.find((entry) => entry.id === id);
  const title = document.querySelector("[data-product-title]");
  const kicker = document.querySelector("[data-product-kicker]");
  const note = document.querySelector("[data-product-note]");
  const price = document.querySelector("[data-product-price]");
  const add = document.querySelector("[data-product-add]");
  const ask = document.querySelector("[data-product-wa]");
  const related = document.querySelector("[data-related]");
  if (!item) {
    if (title) title.textContent = "Esa referencia no está en el catálogo";
    if (note) note.textContent = "Vuelva al catálogo y elija otra pieza.";
    return;
  }
  document.title = `${item.id} ${item.name} | Deltactica`;
  if (kicker) kicker.textContent = `${item.id} · ${item.line}`;
  if (title) title.textContent = item.name;
  if (price) price.textContent = item.price ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(item.price) : "A consultar";
  if (add) add.dataset.add = item.id;
  const copy = {
    ropa: "La prenda va sobre el maniquí. Arrastre, o mueva la barra, para girarla.",
    cabeza: "La pieza va sobre la horma. Arrastre, o mueva la barra, para girarla.",
    pie: "El calzado queda de pie sobre la base. Arrastre para girarlo.",
    objeto: "La pieza queda sobre la base. Arrastre para girarla.",
  };
  if (note) note.textContent = copy[item.stage] || copy.objeto;
  if (ask) ask.dataset.waText = `Hola, quiero información de la referencia ${item.id}, ${item.name}.`;
  if (item.photo === false) {
    host.innerHTML = `<div class="giro"><div class="giro-stage giro-missing"><p>Esta foto no se pudo leer. Vuelva a guardarla como PNG para verla en 360.</p></div></div>`;
    return;
  }
  if (related) {
    related.innerHTML = list.filter((entry) => entry.line === item.line && entry.id !== item.id && entry.photo !== false).slice(0, 4).map((entry) => `<a href="producto.html?id=${entry.id}"><img src="${entry.image}" alt=""><span>${entry.name}</span></a>`).join("");
  }

  const stageClass = item.stage === "ropa" ? "mann" : item.stage === "cabeza" ? "horma" : "pieza";
  host.innerHTML = `<div class="giro">
    <div class="giro-stage" data-giro-stage>
      <div class="giro-world" data-giro-world></div>
      <div class="giro-floor"></div>
    </div>
    <div class="giro-controls">
      <button class="btn btn-ghost" type="button" data-giro-play>Pausar</button>
      <input data-giro-range type="range" min="0" max="359" value="24" aria-label="Girar 360 grados">
    </div>
  </div>`;
  const world = host.querySelector("[data-giro-world]");
  const stage = host.querySelector("[data-giro-stage]");
  const range = host.querySelector("[data-giro-range]");
  const play = host.querySelector("[data-giro-play]");
  let angle = 24;
  let dragging = false;
  let lastX = 0;
  let auto = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!auto && play) play.textContent = "Girar";

  function form(src) {
    if (item.stage === "ropa") {
      const lower = /pantalon|falda|short|pantaloneta/i.test(plain(item.name));
      world.innerHTML = `<div class="mann ${lower ? "is-lower" : ""}"><div class="mann-head"></div><div class="mann-neck"></div><div class="mann-body"><img class="mann-cloth" src="${src}" alt=""><div class="mann-back"></div></div></div>`;
      return;
    }
    if (item.stage === "cabeza") {
      world.innerHTML = `<div class="horma"><div class="horma-head"></div><img class="horma-piece" src="${src}" alt=""><div class="horma-back"></div></div>`;
      return;
    }
    world.innerHTML = `<div class="pieza"><img class="pieza-front" src="${src}" alt=""><div class="pieza-back"></div><div class="pieza-disc"></div></div>`;
  }

  function paint() {
    const turn = (angle % 360 + 360) % 360;
    world.style.transform = `rotateY(${angle}deg)`;
    if (range && document.activeElement !== range) range.value = String(Math.round(turn));
  }

  function cutout(url) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const frame = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = frame.data;
        let keyed = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] < 20) continue;
          if (pixels[i] < 24 && pixels[i + 1] < 24 && pixels[i + 2] < 24) {
            pixels[i + 3] = 0;
            keyed += 1;
          }
        }
        if (keyed > (pixels.length / 4) * 0.72) {
          resolve(url);
          return;
        }
        context.putImageData(frame, 0, 0);
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;
        for (let y = 0; y < canvas.height; y += 1) {
          for (let x = 0; x < canvas.width; x += 1) {
            if (pixels[(y * canvas.width + x) * 4 + 3] < 24) continue;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
        if (maxX <= minX || maxY <= minY) {
          resolve(url);
          return;
        }
        const pad = 8;
        const cropX = Math.max(0, minX - pad);
        const cropY = Math.max(0, minY - pad);
        const cropW = Math.min(canvas.width - cropX, maxX - minX + pad * 2);
        const cropH = Math.min(canvas.height - cropY, maxY - minY + pad * 2);
        const trimmed = document.createElement("canvas");
        trimmed.width = cropW;
        trimmed.height = cropH;
        trimmed.getContext("2d").drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        resolve(trimmed.toDataURL("image/png"));
      };
      image.onerror = () => resolve(url);
      image.src = url;
    });
  }

  cutout(item.image).then((src) => {
    form(src);
    paint();
  });

  stage.addEventListener("pointerdown", (event) => {
    dragging = true;
    auto = false;
    lastX = event.clientX;
    stage.classList.add("is-drag");
    stage.setPointerCapture(event.pointerId);
    if (play) play.textContent = "Girar";
  });
  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    angle += (event.clientX - lastX) * 0.55;
    lastX = event.clientX;
    paint();
  });
  const release = () => {
    dragging = false;
    stage.classList.remove("is-drag");
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  range.addEventListener("input", () => {
    auto = false;
    angle = Number(range.value);
    if (play) play.textContent = "Girar";
    paint();
  });
  play.addEventListener("click", () => {
    auto = !auto;
    play.textContent = auto ? "Pausar" : "Girar";
  });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.target.closest("input, textarea, select")) return;
    auto = false;
    angle += event.key === "ArrowRight" ? 12 : -12;
    if (play) play.textContent = "Girar";
    paint();
  });

  function tick() {
    if (auto && !dragging) angle += 0.35;
    paint();
    requestAnimationFrame(tick);
  }
  tick();
})();
