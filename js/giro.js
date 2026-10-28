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
    ropa: "La prenda va puesta en el maniquí. Arrastre para dar la vuelta.",
    cabeza: "La pieza va sobre el maniquí. Arrastre para dar la vuelta.",
    pie: "El calzado está en vitrina. Arrastre para dar la vuelta.",
    objeto: "La pieza está en vitrina. Arrastre para dar la vuelta.",
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
      <input data-giro-range type="range" min="0" max="359" value="18" aria-label="Girar 360 grados">
    </div>
  </div>`;
  const stage = host.querySelector("[data-giro-stage]");
  const range = host.querySelector("[data-giro-range]");
  const play = host.querySelector("[data-giro-play]");
  let angle = 18;
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
        const total = canvas.width * canvas.height;
        let borderCount = 0;
        let lightBorder = 0;
        const edge = 6;
        for (let y = 0; y < canvas.height; y += 3) {
          for (let x = 0; x < canvas.width; x += 3) {
            if (x > edge && y > edge && x < canvas.width - edge && y < canvas.height - edge) continue;
            const index = (y * canvas.width + x) * 4;
            borderCount += 1;
            if (pixels[index] > 236 && pixels[index + 1] > 236 && pixels[index + 2] > 236) lightBorder += 1;
          }
        }
        const light = borderCount && lightBorder / borderCount > 0.8;
        const open = new Uint8Array(total);
        for (let i = 0; i < total; i += 1) {
          const p = i * 4;
          if (pixels[p + 3] < 16) {
            open[i] = 1;
            continue;
          }
          if (pixels[p] < 26 && pixels[p + 1] < 26 && pixels[p + 2] < 26) open[i] = 1;
          else if (light && pixels[p] > 236 && pixels[p + 1] > 236 && pixels[p + 2] > 236) open[i] = 1;
        }
        const stack = [];
        const seen = new Uint8Array(total);
        const push = (index) => {
          if (index < 0 || index >= total || seen[index] || !open[index]) return;
          seen[index] = 1;
          stack.push(index);
        };
        for (let x = 0; x < canvas.width; x += 1) {
          push(x);
          push((canvas.height - 1) * canvas.width + x);
        }
        for (let y = 0; y < canvas.height; y += 1) {
          push(y * canvas.width);
          push(y * canvas.width + canvas.width - 1);
        }
        let keyed = 0;
        while (stack.length) {
          const index = stack.pop();
          pixels[index * 4 + 3] = 0;
          keyed += 1;
          const x = index % canvas.width;
          const y = (index / canvas.width) | 0;
          if (x > 0) push(index - 1);
          if (x + 1 < canvas.width) push(index + 1);
          if (y > 0) push(index - canvas.width);
          if (y + 1 < canvas.height) push(index + canvas.width);
        }
        let remain = 0;
        for (let i = 0; i < total; i += 8) if (pixels[i * 4 + 3] > 24) remain += 1;
        if (remain > total * 0.04 / 8) context.putImageData(frame, 0, 0);
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
        let samples = 0;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        const sample = trimmed.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, trimmed.width, trimmed.height).data;
        for (let i = 0; i < sample.length; i += 16) {
          if (sample[i + 3] < 40) continue;
          sumR += sample[i];
          sumG += sample[i + 1];
          sumB += sample[i + 2];
          samples += 1;
        }
        if (samples) {
          tone.r = Math.round(sumR / samples);
          tone.g = Math.round(sumG / samples);
          tone.b = Math.round(sumB / samples);
        }
        const solid = document.createElement("canvas");
        solid.width = trimmed.width;
        solid.height = trimmed.height;
        const paint = solid.getContext("2d");
        paint.fillStyle = `rgb(${tone.r},${tone.g},${tone.b})`;
        paint.fillRect(0, 0, solid.width, solid.height);
        paint.drawImage(trimmed, 0, 0);
        resolve({ front: solid, cut: trimmed, tone });
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
    const camera = new THREE.PerspectiveCamera(28, stage.clientWidth / stage.clientHeight, 0.1, 40);
    scene.add(new THREE.AmbientLight(0xfff6ec, 0.72));
    const key = new THREE.DirectionalLight(0xfff3e2, 1.55);
    key.position.set(1.6, 3.6, 3.4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd5dbe8, 0.5);
    fill.position.set(-2.6, 1.8, 2.2);
    scene.add(fill);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.34);
    rimLight.position.set(-0.6, 2.4, -2.8);
    scene.add(rimLight);

    const label = plain(item.name);
    const lower = /pantalon|falda|short|pantaloneta|bermuda/.test(label);
    const full = /uniforme|overol|conjunto/.test(label);
    const dressed = item.stage === "ropa" || item.stage === "cabeza";
    const wearTop = item.stage === "ropa" && (full || !lower);
    const wearLegs = item.stage === "ropa" && (full || lower);
    const wearHead = item.stage === "cabeza";
    const tone = new THREE.Color((tex.tone?.r || 96) / 255, (tex.tone?.g || 102) / 255, (tex.tone?.b || 90) / 255);
    const skin = new THREE.MeshStandardMaterial({ color: 0xf4f1eb, roughness: 0.46, metalness: 0.02 });
    const under = new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: 0.74, metalness: 0.06 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.42, metalness: 0.2 });
    const edgeMat = new THREE.MeshStandardMaterial({
      color: tone.clone().multiplyScalar(0.9),
      roughness: 0.8,
      metalness: 0.04,
      emissive: tone.clone().multiplyScalar(0.08),
      side: THREE.DoubleSide,
    });
    const backMat = new THREE.MeshStandardMaterial({
      color: tone.clone().multiplyScalar(0.84),
      roughness: 0.9,
      metalness: 0.02,
    });

    const source = tex.cut || tex.front;
    const printMap = new THREE.CanvasTexture(source);
    printMap.colorSpace = THREE.SRGBColorSpace;
    printMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    printMap.wrapS = THREE.ClampToEdgeWrapping;
    printMap.wrapT = THREE.ClampToEdgeWrapping;
    const faceMat = new THREE.MeshStandardMaterial({
      map: printMap,
      color: 0xffffff,
      roughness: 0.68,
      metalness: 0.02,
      alphaTest: 0.22,
      side: THREE.FrontSide,
    });

    function shadow(radius) {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const paint = canvas.getContext("2d");
      const gradient = paint.createRadialGradient(64, 64, 8, 64, 64, 64);
      gradient.addColorStop(0, "rgba(0,0,0,0.55)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      paint.fillStyle = gradient;
      paint.fillRect(0, 0, 128, 128);
      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 40),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.004;
      return mesh;
    }

    function buildShell(canvas, height, bow, thick, rear, inset) {
      const sw = canvas.width;
      const sh = canvas.height;
      const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, sw, sh).data;
      const cols = 168;
      const rows = Math.max(2, Math.round(cols * sh / sw));
      const width = height * sw / sh;
      const solid = new Uint8Array(cols * rows);
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const px = Math.min(sw - 1, Math.round((col + 0.5) / cols * (sw - 1)));
          const py = Math.min(sh - 1, Math.round((row + 0.5) / rows * (sh - 1)));
          solid[row * cols + col] = pixels[(py * sw + px) * 4 + 3] > 72 ? 1 : 0;
        }
      }
      const alive = (col, row) => col >= 0 && row >= 0 && col < cols && row < rows && solid[row * cols + col] === 1;
      const place = (col, row) => {
        const u = cols === 1 ? 0.5 : col / (cols - 1);
        const v = rows === 1 ? 0.5 : 1 - row / (rows - 1);
        const across = (u - 0.5) * 2;
        const along = (v - 0.5) * 2;
        return {
          x: (u - 0.5) * width,
          y: (v - 0.5) * height,
          z: Math.cos(across * Math.PI * 0.5) * Math.cos(along * 0.5) * bow,
          u,
          v,
        };
      };
      const frontPos = [];
      const frontUv = [];
      const backPos = [];
      const slot = new Int32Array(cols * rows);
      slot.fill(-1);
      const anchors = { top: -10, bottom: 10, left: null, right: null, width, height };
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (!alive(col, row)) continue;
          const point = place(col, row);
          slot[row * cols + col] = frontPos.length / 3;
          frontPos.push(point.x, point.y, point.z);
          frontUv.push(point.u, point.v);
          const pinch = inset || 1;
          backPos.push(point.x * pinch, point.y * pinch, point.z - thick);
          if (point.y > anchors.top) anchors.top = point.y;
          if (point.y < anchors.bottom) anchors.bottom = point.y;
          if (point.u < 0.36 && (!anchors.left || point.y < anchors.left.y)) anchors.left = point;
          if (point.u > 0.64 && (!anchors.right || point.y < anchors.right.y)) anchors.right = point;
        }
      }
      const frontIdx = [];
      const backIdx = [];
      const tally = new Map();
      const mark = (a, b) => {
        const key = a < b ? `${a}_${b}` : `${b}_${a}`;
        tally.set(key, (tally.get(key) || 0) + 1);
      };
      for (let row = 0; row < rows - 1; row += 1) {
        for (let col = 0; col < cols - 1; col += 1) {
          const a = slot[row * cols + col];
          const b = slot[row * cols + col + 1];
          const d = slot[(row + 1) * cols + col];
          const e = slot[(row + 1) * cols + col + 1];
          if (a < 0 || b < 0 || d < 0 || e < 0) continue;
          frontIdx.push(a, d, e, a, e, b);
          backIdx.push(a, e, d, a, b, e);
          mark(a, d); mark(d, e); mark(e, a);
          mark(a, e); mark(e, b); mark(b, a);
        }
      }
      const rimPos = [];
      const rimIdx = [];
      tally.forEach((hits, key) => {
        if (hits !== 1) return;
        const [ia, ib] = key.split("_").map(Number);
        const base = rimPos.length / 3;
        for (let axis = 0; axis < 3; axis += 1) {
          rimPos.push(frontPos[ia * 3 + axis]);
        }
        for (let axis = 0; axis < 3; axis += 1) {
          rimPos.push(frontPos[ib * 3 + axis]);
        }
        for (let axis = 0; axis < 3; axis += 1) {
          rimPos.push(backPos[ib * 3 + axis]);
        }
        for (let axis = 0; axis < 3; axis += 1) {
          rimPos.push(backPos[ia * 3 + axis]);
        }
        rimIdx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      });
      const meshFrom = (positions, index, uv, material) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        if (uv) geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
        geometry.setIndex(index);
        geometry.computeVertexNormals();
        return new THREE.Mesh(geometry, material);
      };
      const shell = new THREE.Group();
      if (frontIdx.length) {
        shell.add(meshFrom(frontPos, frontIdx, frontUv, faceMat));
        if (rear) {
          shell.add(meshFrom(backPos, backIdx, frontUv, rear));
          if (rimIdx.length) shell.add(meshFrom(rimPos, rimIdx, null, edgeMat));
        }
      }
      shell.userData.anchors = anchors;
      return shell;
    }

    function addHead(parent, x, y, z) {
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.112, 32, 24), skin);
      head.scale.set(0.92, 1.08, 0.9);
      head.position.set(x, y, z);
      parent.add(head);
      const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.06, 6, 14), skin);
      neck.position.set(x, y - 0.14, z - 0.01);
      parent.add(neck);
      return head;
    }

    function addHands(parent, anchors) {
      [anchors.left, anchors.right].forEach((cuff) => {
        if (!cuff || Math.abs(cuff.x) < anchors.width * 0.16) return;
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.03, 18, 14), skin);
        hand.position.set(cuff.x, cuff.y + 0.045, cuff.z + 0.01);
        parent.add(hand);
      });
    }

    function addLegs(parent, hem, xSpan) {
      [-1, 1].forEach((side) => {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.34, 6, 16), under);
        leg.position.set(side * xSpan, hem - 0.18, -0.02);
        parent.add(leg);
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.065, 0.2), shoeMat);
        shoe.position.set(side * xSpan, hem - 0.4, 0.03);
        parent.add(shoe);
      });
    }

    function addBareTop(parent, waist) {
      const profile = [
        [0.15, waist],
        [0.18, waist + 0.16],
        [0.2, waist + 0.32],
        [0.16, waist + 0.46],
        [0.08, waist + 0.54],
      ].map((point) => new THREE.Vector2(point[0], point[1]));
      parent.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 28), under));
      [-1, 1].forEach((side) => {
        const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.36, 5, 14), under);
        arm.position.set(side * 0.28, waist + 0.28, 0);
        arm.rotation.z = side * 0.18;
        parent.add(arm);
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.044, 16, 12), skin);
        hand.position.set(side * 0.34, waist + 0.05, 0.04);
        parent.add(hand);
      });
      addHead(parent, 0, waist + 0.68, 0.04);
    }

    const group = new THREE.Group();
    const photo = source;

    if (wearTop || (wearLegs && !wearHead)) {
      const height = wearTop ? (full ? 1.16 : 1.08) : 0.86;
      const bow = wearTop ? 0.05 : 0.08;
      const thick = wearTop ? 0.13 : 0.16;
      const shell = buildShell(photo, height, bow, thick, backMat, wearTop ? 0.9 : 0.96);
      const anchors = shell.userData.anchors;
      group.add(shell);
      if (wearTop) {
        addHead(group, 0, anchors.top - 0.01, 0.06);
        if (!wearLegs) addLegs(group, anchors.bottom, 0.1);
      } else {
        addBareTop(group, anchors.top - 0.02);
        [anchors.left, anchors.right].forEach((cuff) => {
          if (!cuff) return;
          const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.2), shoeMat);
          shoe.position.set(cuff.x * 0.85, cuff.y - 0.02, cuff.z + 0.02);
          group.add(shoe);
        });
      }
      group.add(shadow(0.48));
    } else if (wearHead) {
      addBareTop(group, 0.72);
      addLegs(group, 0.72, 0.1);
      const shell = buildShell(photo, 0.3, 0.08, 0.06, faceMat);
      shell.position.set(0, 1.5, 0.08);
      group.add(shell);
      group.add(shadow(0.42));
    } else {
      let height = item.stage === "pie" ? 1.12 : 1.0;
      const aspect = photo.width / photo.height;
      if (height * aspect > 1.25) height = 1.25 / aspect;
      const thick = item.stage === "pie" ? 0.28 : 0.2;
      const shell = buildShell(photo, height, item.stage === "pie" ? 0.08 : 0.05, thick, faceMat);
      const anchors = shell.userData.anchors;
      shell.position.y = -anchors.bottom + 0.07;
      group.add(shell);
      const reach = Math.min(0.62, Math.max(0.34, anchors.width * 0.42));
      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(reach * 0.82, reach, 0.05, 48),
        new THREE.MeshStandardMaterial({ color: 0x3a4048, metalness: 0.66, roughness: 0.3 })
      );
      plinth.position.y = 0.025;
      group.add(plinth);
      group.add(shadow(reach * 1.05));
    }

    scene.add(group);
    const bounds = new THREE.Box3().setFromObject(group);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    group.position.sub(center);
    const fit = Math.max(size.x, size.y * 1.04);
    const fov = camera.fov * Math.PI / 180;
    camera.position.set(0, size.y * 0.02, (fit / 2) / Math.tan(fov / 2) * 1.48);
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
      group.rotation.x = 0.06;
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
