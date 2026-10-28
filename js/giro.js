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
    ropa: "El volumen sigue el contorno de la prenda. Arrastre para ver el grosor.",
    cabeza: "El volumen sigue el contorno de la pieza. Arrastre para girarla.",
    pie: "El volumen sigue la forma del calzado. Arrastre para ver el grosor.",
    objeto: "El volumen sigue la forma de la pieza. Arrastre para ver el grosor.",
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
        const edge = 8;
        let borderCount = 0;
        let lightBorder = 0;
        for (let y = 0; y < canvas.height; y += 4) {
          for (let x = 0; x < canvas.width; x += 4) {
            if (x > edge && y > edge && x < canvas.width - edge && y < canvas.height - edge) continue;
            const index = (y * canvas.width + x) * 4;
            borderCount += 1;
            if (pixels[index] > 236 && pixels[index + 1] > 236 && pixels[index + 2] > 236) lightBorder += 1;
          }
        }
        if (borderCount && lightBorder / borderCount > 0.8) {
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] < 20) continue;
            if (pixels[i] > 236 && pixels[i + 1] > 236 && pixels[i + 2] > 236) {
              pixels[i + 3] = 0;
              keyed += 1;
            }
          }
        }
        if ((borderCount && lightBorder / borderCount > 0.8) || keyed <= (pixels.length / 4) * 0.72) context.putImageData(frame, 0, 0);
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
    const camera = new THREE.PerspectiveCamera(30, stage.clientWidth / stage.clientHeight, 0.1, 40);
    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(2.4, 3.2, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd7dbe0, 0.35);
    fill.position.set(-3, 1.2, -2);
    scene.add(fill);

    const frontMap = new THREE.CanvasTexture(tex.front);
    frontMap.colorSpace = THREE.SRGBColorSpace;
    frontMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const tone = new THREE.Color((tex.tone?.r || 90) / 255, (tex.tone?.g || 94) / 255, (tex.tone?.b || 98) / 255);
    const photo = new THREE.MeshBasicMaterial({ map: frontMap });
    const rim = new THREE.MeshStandardMaterial({ color: tone.clone().multiplyScalar(0.62), roughness: 0.48, metalness: 0.16 });

    const source = tex.cut || tex.front;
    const limit = 420;
    const fitScale = Math.min(1, limit / Math.max(source.width, source.height));
    const rawCols = Math.max(8, Math.round(source.width * fitScale));
    const rawRows = Math.max(8, Math.round(source.height * fitScale));
    const sample = document.createElement("canvas");
    sample.width = rawCols;
    sample.height = rawRows;
    const sampleContext = sample.getContext("2d", { willReadFrequently: true });
    const soft = document.createElement("canvas");
    soft.width = Math.max(28, Math.round(rawCols / 5));
    soft.height = Math.max(28, Math.round(rawRows / 5));
    const softContext = soft.getContext("2d");
    softContext.imageSmoothingEnabled = true;
    softContext.imageSmoothingQuality = "high";
    softContext.drawImage(source, 0, 0, soft.width, soft.height);
    sampleContext.imageSmoothingEnabled = true;
    sampleContext.imageSmoothingQuality = "high";
    sampleContext.drawImage(soft, 0, 0, rawCols, rawRows);
    const samplePixels = sampleContext.getImageData(0, 0, rawCols, rawRows).data;
    const cols = rawCols + 2;
    const rows = rawRows + 2;
    const mask = new Uint8Array(cols * rows);
    for (let y = 0; y < rawRows; y += 1) {
      for (let x = 0; x < rawCols; x += 1) {
        if (samplePixels[(y * rawCols + x) * 4 + 3] > 80) mask[(y + 1) * cols + x + 1] = 1;
      }
    }
    const worldH = 1.35;
    const worldW = worldH * (rawCols / rawRows);
    const depth = worldH * (item.stage === "pie" ? 0.28 : item.stage === "ropa" ? 0.16 : 0.2);
    const toWorld = (px, py) => [(px - 1) / rawCols * worldW - worldW / 2, worldH / 2 - (py - 1) / rawRows * worldH];

    const segments = [];
    const pushSeg = (ax, ay, bx, by) => {
      if (ax === bx && ay === by) return;
      segments.push([ax, ay, bx, by]);
    };
    for (let y = 0; y < rows - 1; y += 1) {
      for (let x = 0; x < cols - 1; x += 1) {
        let bits = 0;
        if (mask[y * cols + x]) bits |= 1;
        if (mask[y * cols + x + 1]) bits |= 2;
        if (mask[(y + 1) * cols + x + 1]) bits |= 4;
        if (mask[(y + 1) * cols + x]) bits |= 8;
        const north = [x + 0.5, y];
        const east = [x + 1, y + 0.5];
        const south = [x + 0.5, y + 1];
        const west = [x, y + 0.5];
        const join = (from, to) => pushSeg(from[0], from[1], to[0], to[1]);
        if (bits === 1) join(west, north);
        else if (bits === 2) join(north, east);
        else if (bits === 3) join(west, east);
        else if (bits === 4) join(east, south);
        else if (bits === 5) { join(west, north); join(east, south); }
        else if (bits === 6) join(north, south);
        else if (bits === 7) join(west, south);
        else if (bits === 8) join(south, west);
        else if (bits === 9) join(south, north);
        else if (bits === 10) { join(north, east); join(south, west); }
        else if (bits === 11) join(south, east);
        else if (bits === 12) join(east, west);
        else if (bits === 13) join(east, north);
        else if (bits === 14) join(north, west);
      }
    }
    const pointKey = (x, y) => `${Math.round(x * 2)},${Math.round(y * 2)}`;
    const outgoing = new Map();
    segments.forEach((segment, index) => {
      const key = pointKey(segment[0], segment[1]);
      const list = outgoing.get(key);
      if (list) list.push(index);
      else outgoing.set(key, [index]);
    });
    const used = new Uint8Array(segments.length);
    const loops = [];
    segments.forEach((segment, index) => {
      if (used[index]) return;
      const loop = [];
      let cursor = index;
      let guard = 0;
      while (cursor >= 0 && !used[cursor] && guard < segments.length + 2) {
        guard += 1;
        used[cursor] = 1;
        const current = segments[cursor];
        loop.push([current[0], current[1]]);
        const options = outgoing.get(pointKey(current[2], current[3])) || [];
        cursor = options.find((candidate) => !used[candidate]);
        if (cursor === undefined) cursor = -1;
      }
      if (loop.length > 10) loops.push(loop);
    });
    const simplify = (points, epsilon) => {
      if (points.length < 4) return points;
      let far = 0;
      let index = 0;
      const start = points[0];
      const end = points[points.length - 1];
      for (let i = 1; i < points.length - 1; i += 1) {
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const length = Math.hypot(dx, dy) || 1;
        const distance = Math.abs(dy * points[i][0] - dx * points[i][1] + end[0] * start[1] - end[1] * start[0]) / length;
        if (distance > far) {
          far = distance;
          index = i;
        }
      }
      if (far <= epsilon) return [start, end];
      return simplify(points.slice(0, index + 1), epsilon).slice(0, -1).concat(simplify(points.slice(index), epsilon));
    };
    const areaOf = (points) => {
      let area = 0;
      for (let i = 0; i < points.length; i += 1) {
        const current = points[i];
        const next = points[(i + 1) % points.length];
        area += current[0] * next[1] - next[0] * current[1];
      }
      return area / 2;
    };
    const contains = (loop, point) => {
      let inside = false;
      for (let i = 0, j = loop.length - 1; i < loop.length; j = i, i += 1) {
        const yi = loop[i][1];
        const yj = loop[j][1];
        const crosses = (yi > point[1]) !== (yj > point[1]);
        if (crosses && point[0] < (loop[j][0] - loop[i][0]) * (point[1] - yi) / ((yj - yi) || 1e-6) + loop[i][0]) inside = !inside;
      }
      return inside;
    };
    const relax = (points) => points.map((point, index) => {
      const previous = points[(index - 1 + points.length) % points.length];
      const following = points[(index + 1) % points.length];
      return [
        point[0] * 0.5 + (previous[0] + following[0]) * 0.25,
        point[1] * 0.5 + (previous[1] + following[1]) * 0.25,
      ];
    });
    const shapes = loops.map((loop) => {
      let points = simplify(loop, 1.15);
      for (let pass = 0; pass < 6; pass += 1) points = relax(points);
      return points;
    }).filter((loop) => loop.length > 8);
    const outers = [];
    const holes = [];
    if (!shapes.length) return;
    shapes.forEach((loop) => {
      const area = areaOf(loop);
      if (Math.abs(area) < 18) return;
      if (area > 0) holes.push(loop);
      else outers.push(loop);
    });
    if (!outers.length) holes.splice(0).forEach((loop) => outers.push(loop.slice().reverse()));
    const group = new THREE.Group();
    const paintCap = (geometry) => {
      const position = geometry.getAttribute("position");
      const uv = geometry.getAttribute("uv");
      const write = (index) => {
        const x = position.getX(index);
        const y = position.getY(index);
        uv.setXY(index, x / worldW + 0.5, y / worldH + 0.5);
      };
      geometry.groups.forEach((part) => {
        if (part.materialIndex !== 0) return;
        if (geometry.index) {
          const order = geometry.index.array;
          for (let i = part.start; i < part.start + part.count; i += 1) write(order[i]);
        } else {
          for (let i = part.start; i < part.start + part.count; i += 1) write(i);
        }
      });
      uv.needsUpdate = true;
    };
    outers.forEach((outer) => {
      try {
        const ordered = areaOf(outer) < 0 ? outer.slice().reverse() : outer.slice();
        const shape = new THREE.Shape(ordered.map((point) => new THREE.Vector2(...toWorld(point[0], point[1]))));
        holes.forEach((hole) => {
          if (!contains(ordered, hole[0])) return;
          const ring = areaOf(hole) < 0 ? hole : hole.slice().reverse();
          const path = new THREE.Path(ring.map((point) => new THREE.Vector2(...toWorld(point[0], point[1]))));
          shape.holes.push(path);
        });
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: true,
          bevelThickness: depth * 0.05,
          bevelSize: Math.min(worldW, worldH) * 0.012,
          bevelSegments: 1,
          curveSegments: 1,
        });
        geometry.translate(0, 0, -depth / 2);
        paintCap(geometry);
        group.add(new THREE.Mesh(geometry, [photo, rim]));
      } catch (error) {
        return;
      }
    });

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
