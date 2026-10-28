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
    ropa: "La prenda va sobre el maniquí, con volumen. Arrastre para ver el costado y la espalda.",
    cabeza: "La pieza va sobre la horma, con volumen. Arrastre para girarla.",
    pie: "El calzado tiene fondo y laterales. Arrastre para ver el volumen.",
    objeto: "La pieza tiene fondo y laterales. Arrastre para ver el volumen.",
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

  host.innerHTML = `<div class="giro">
    <div class="giro-stage">
      <div class="giro-cam" data-giro-stage></div>
    </div>
    <div class="giro-controls">
      <button class="btn btn-ghost" type="button" data-giro-play>Pausar</button>
      <input data-giro-range type="range" min="0" max="359" value="32" aria-label="Girar 360 grados">
    </div>
  </div>`;
  const stage = host.querySelector("[data-giro-stage]");
  const range = host.querySelector("[data-giro-range]");
  const play = host.querySelector("[data-giro-play]");
  let angle = 32;
  let dragging = false;
  let lastX = 0;
  let auto = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let spin = null;
  if (!auto && play) play.textContent = "Girar";

  function cutout(url) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
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
        if (keyed <= (pixels.length / 4) * 0.72) context.putImageData(frame, 0, 0);
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;
        const step = 2;
        for (let y = 0; y < canvas.height; y += step) {
          for (let x = 0; x < canvas.width; x += step) {
            if (pixels[(y * canvas.width + x) * 4 + 3] < 24) continue;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
        const source = keyed > (pixels.length / 4) * 0.72 || maxX <= minX ? canvas : null;
        let trimmed = canvas;
        if (!source && maxX > minX) {
          const pad = 16;
          const cropX = Math.max(0, minX - pad);
          const cropY = Math.max(0, minY - pad);
          const cropW = Math.min(canvas.width - cropX, maxX - minX + pad * 2);
          const cropH = Math.min(canvas.height - cropY, maxY - minY + pad * 2);
          trimmed = document.createElement("canvas");
          trimmed.width = cropW;
          trimmed.height = cropH;
          const g = trimmed.getContext("2d");
          g.imageSmoothingEnabled = true;
          g.imageSmoothingQuality = "high";
          g.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        }
        const tone = { r: 90, g: 94, b: 98 };
        let count = 0;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        const sample = trimmed.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, trimmed.width, trimmed.height).data;
        for (let i = 0; i < sample.length; i += 16) {
          if (sample[i + 3] < 40) continue;
          sumR += sample[i];
          sumG += sample[i + 1];
          sumB += sample[i + 2];
          count += 1;
        }
        if (count) {
          tone.r = Math.round(sumR / count);
          tone.g = Math.round(sumG / count);
          tone.b = Math.round(sumB / count);
        }
        const solid = document.createElement("canvas");
        solid.width = trimmed.width;
        solid.height = trimmed.height;
        const paint = solid.getContext("2d");
        paint.fillStyle = `rgb(${tone.r},${tone.g},${tone.b})`;
        paint.fillRect(0, 0, solid.width, solid.height);
        paint.drawImage(trimmed, 0, 0);
        resolve({ front: solid, tone });
      };
      image.onerror = () => resolve(null);
      image.src = url;
    });
  }

  function mount(THREE, tex) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    stage.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, stage.clientWidth / stage.clientHeight, 0.1, 40);
    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(2.4, 3.2, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd7dbe0, 0.35);
    fill.position.set(-3, 1.2, -2);
    scene.add(fill);

    const map = (canvas) => {
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    };
    const frontMap = map(tex.front);
    const tone = new THREE.Color((tex.tone?.r || 90) / 255, (tex.tone?.g || 94) / 255, (tex.tone?.b || 98) / 255);
    const photo = new THREE.MeshBasicMaterial({ map: frontMap });
    const edge = new THREE.MeshStandardMaterial({ color: tone.clone().multiplyScalar(0.72), roughness: 0.46, metalness: 0.18 });
    const top = new THREE.MeshStandardMaterial({ color: tone.clone().multiplyScalar(0.58), roughness: 0.5, metalness: 0.2 });
    const back = new THREE.MeshStandardMaterial({ color: tone.clone().multiplyScalar(0.42), roughness: 0.55, metalness: 0.22 });
    const body = new THREE.MeshStandardMaterial({ color: 0xa7adb4, roughness: 0.38, metalness: 0.46 });
    const boxMaterials = [edge, edge, top, edge, photo, back];

    const group = new THREE.Group();
    const lower = /pantalon|falda|short|pantaloneta/i.test(plain(item.name));
    const aspect = tex.front.width / tex.front.height;

    if (item.stage === "ropa") {
      const torsoH = lower ? 1.15 : 1.28;
      const torsoW = Math.min(1.15, torsoH * aspect);
      const torsoD = 0.62;
      const torso = new THREE.Mesh(new THREE.BoxGeometry(torsoW, torsoH, torsoD), boxMaterials);
      torso.position.y = lower ? 0.15 : 0.28;
      group.add(torso);
      if (!lower) {
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), body);
        head.scale.set(1, 1.15, 0.95);
        head.position.y = torso.position.y + torsoH / 2 + 0.34;
        group.add(head);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.16, 20), body);
        neck.position.y = torso.position.y + torsoH / 2 + 0.1;
        group.add(neck);
      }
      [-1, 1].forEach((sideSign) => {
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.62, 6, 16), body);
        arm.position.set(sideSign * (torsoW / 2 + 0.16), torso.position.y + torsoH * 0.08, -0.02);
        arm.rotation.z = sideSign * -0.12;
        group.add(arm);
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.72, 6, 16), body);
        leg.position.set(sideSign * 0.18, torso.position.y - torsoH / 2 - 0.48, 0);
        group.add(leg);
      });
    } else if (item.stage === "cabeza") {
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 40, 28), body);
      head.scale.set(1, 1.12, 0.92);
      group.add(head);
      const capH = 0.72;
      const capW = Math.min(1.05, capH * aspect);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(capW, capH, Math.max(0.46, capW * 0.55)), boxMaterials);
      cap.position.y = 0.18;
      group.add(cap);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.28, 20), body);
      neck.position.y = -0.48;
      group.add(neck);
    } else {
      const height = item.stage === "pie" ? 1.45 : 1.25;
      const width = Math.min(1.35, height * aspect);
      const depth = Math.max(0.55, Math.min(width, height) * 0.55);
      const piece = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), boxMaterials);
      piece.position.y = 0.15;
      group.add(piece);
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.78, 0.08, 40), new THREE.MeshStandardMaterial({ color: 0x2a2e33, metalness: 0.5, roughness: 0.4 }));
      stand.position.y = -height / 2 + 0.08;
      group.add(stand);
    }

    scene.add(group);
    const bounds = new THREE.Box3().setFromObject(group);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    group.position.sub(center);
    const fit = Math.max(size.x, size.y * 1.05);
    const fov = camera.fov * Math.PI / 180;
    camera.position.set(0, size.y * 0.02, (fit / 2) / Math.tan(fov / 2) * 1.5);
    camera.lookAt(0, 0, 0);

    const resize = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    resize();
    window.addEventListener("resize", resize);

    spin = () => {
      group.rotation.y = angle * Math.PI / 180;
      group.rotation.x = 0.22;
      renderer.render(scene, camera);
    };
    spin();
  }

  cutout(item.image).then((tex) => {
    if (!tex) return;
    import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js").then((THREE) => mount(THREE, tex)).catch(() => {
      stage.innerHTML = `<p class="giro-missing">No se pudo abrir el visor 3D.</p>`;
    });
  });

  function paint() {
    const turn = (angle % 360 + 360) % 360;
    if (spin) spin();
    if (range && document.activeElement !== range) range.value = String(Math.round(turn));
  }

  stage.addEventListener("pointerdown", (event) => {
    dragging = true;
    auto = false;
    lastX = event.clientX;
    stage.setPointerCapture(event.pointerId);
    if (play) play.textContent = "Girar";
  });
  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    angle += (event.clientX - lastX) * 0.45;
    lastX = event.clientX;
    paint();
  });
  const release = () => { dragging = false; };
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
    if (auto && !dragging) angle += 0.28;
    paint();
    requestAnimationFrame(tick);
  }
  tick();
})();
