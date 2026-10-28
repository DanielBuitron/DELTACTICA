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
    ropa: "La prenda se ve completa, en vitrina clara. Arrastre para dar la vuelta.",
    cabeza: "La pieza se ve completa, en vitrina clara. Arrastre para dar la vuelta.",
    pie: "El calzado está en vitrina clara. Arrastre para dar la vuelta.",
    objeto: "La pieza está en vitrina clara. Arrastre para dar la vuelta.",
  };
  if (note) note.textContent = copy[item.stage] || copy.objeto;
  if (ask) ask.dataset.waText = `Hola, quiero información de la referencia ${item.id}, ${item.name}.`;
  if (item.photo === false) {
    host.innerHTML = `<div class="giro"><div class="giro-stage giro-missing"><p>El archivo de esta foto no es una imagen. Hay que volver a guardarlo como PNG para verla en 360.</p></div></div>`;
    return;
  }
  if (related) {
    related.innerHTML = list.filter((entry) => entry.line === item.line && entry.id !== item.id && entry.photo !== false).slice(0, 4).map((entry) => `<a href="producto.html?id=${entry.id}"><img src="${typeof productImage === "function" ? productImage(entry) : entry.image}" alt=""><span>${entry.name}</span></a>`).join("");
  }

  host.innerHTML = `<div class="giro">
    <div class="giro-stage">
      <div class="giro-cam" data-giro-stage></div>
    </div>
    <div class="giro-controls">
      <button class="btn btn-ghost" type="button" data-giro-play>Pausar</button>
      <input data-giro-range type="range" min="0" max="359" value="12" aria-label="Girar 360 grados">
      <button class="btn btn-ghost" type="button" data-giro-zoom>Ver grande</button>
    </div>
  </div>`;
  const stage = host.querySelector("[data-giro-stage]");
  const range = host.querySelector("[data-giro-range]");
  const play = host.querySelector("[data-giro-play]");
  let angle = 12;
  let dragging = false;
  let lastX = 0;
  let anchorX = 0;
  let anchorA = 0;
  let porAncho = false;
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
        let darkBorder = 0;
        const edge = 6;
        for (let y = 0; y < canvas.height; y += 3) {
          for (let x = 0; x < canvas.width; x += 3) {
            if (x > edge && y > edge && x < canvas.width - edge && y < canvas.height - edge) continue;
            const index = (y * canvas.width + x) * 4;
            borderCount += 1;
            if (pixels[index + 3] < 16) continue;
            if (pixels[index] > 236 && pixels[index + 1] > 236 && pixels[index + 2] > 236) lightBorder += 1;
            else if (pixels[index] < 18 && pixels[index + 1] < 18 && pixels[index + 2] < 18) darkBorder += 1;
          }
        }
        const light = borderCount && lightBorder / borderCount > 0.8;
        const dark = borderCount && darkBorder / borderCount > 0.8;
        const open = new Uint8Array(total);
        for (let i = 0; i < total; i += 1) {
          const p = i * 4;
          if (pixels[p + 3] < 16) {
            open[i] = 1;
            continue;
          }
          if (dark && pixels[p] <= 6 && pixels[p + 1] <= 6 && pixels[p + 2] <= 6) open[i] = 1;
          else if (light && pixels[p] > 248 && pixels[p + 1] > 248 && pixels[p + 2] > 248) open[i] = 1;
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
        let trimmed = canvas;
        if (maxX > minX) {
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
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    stage.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.08, 50);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    scene.add(new THREE.HemisphereLight(0xfff8f2, 0x1a1c22, 0.75));
    const key = new THREE.DirectionalLight(0xfff7ee, 2.2);
    key.position.set(2.8, 4.6, 5.4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd5deee, 0.7);
    fill.position.set(-4.4, 1.8, 2.8);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xfff2e4, 2.4);
    rim.position.set(-2.2, 3.4, -4.2);
    scene.add(rim);
    const rim2 = new THREE.DirectionalLight(0xd7e2ea, 1.5);
    rim2.position.set(3.2, 2.4, -3.2);
    scene.add(rim2);

    const label = plain(item.name);
    const lower = /pantalon|falda|short|pantaloneta|bermuda/.test(label);
    const full = /uniforme|overol|conjunto/.test(label);
    const wearTop = item.stage === "ropa" && (full || !lower);
    const wearLegs = item.stage === "ropa" && (full || lower);
    const wearHead = item.stage === "cabeza";
    const dressed = item.stage === "ropa";
    const tone = new THREE.Color((tex.tone?.r || 96) / 255, (tex.tone?.g || 100) / 255, (tex.tone?.b || 96) / 255);
    const photo = tex.cut || tex.front;
    const map = new THREE.CanvasTexture(photo);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;

    const skin = new THREE.MeshPhysicalMaterial({ color: 0xf3f0ea, roughness: 0.42, metalness: 0.02, clearcoat: 0.16, clearcoatRoughness: 0.42 });
    const cloth = new THREE.MeshPhysicalMaterial({ color: tone, roughness: 0.76, metalness: 0.02, sheen: 0.5, sheenRoughness: 0.5, sheenColor: tone });
    const under = new THREE.MeshPhysicalMaterial({ color: 0x2b2f34, roughness: 0.7, metalness: 0.08, clearcoat: 0.06 });
    const shoeMat = new THREE.MeshPhysicalMaterial({ color: 0x15171a, roughness: 0.36, metalness: 0.24, clearcoat: 0.4, clearcoatRoughness: 0.28 });

    function shadowDisc(radius) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const paint = canvas.getContext("2d");
      const gradient = paint.createRadialGradient(128, 128, 16, 128, 128, 128);
      gradient.addColorStop(0, "rgba(0,0,0,0.48)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      paint.fillStyle = gradient;
      paint.fillRect(0, 0, 256, 256);
      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 48),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.004;
      return mesh;
    }

    function slice(canvas, x0, y0, x1, y1) {
      const width = Math.max(1, Math.round((x1 - x0) * canvas.width));
      const height = Math.max(1, Math.round((y1 - y0) * canvas.height));
      const cut = document.createElement("canvas");
      cut.width = width;
      cut.height = height;
      cut.getContext("2d").drawImage(canvas, x0 * canvas.width, y0 * canvas.height, width, height, 0, 0, width, height);
      return cut;
    }

    function averageColor(canvas) {
      const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
      let red = 0;
      let green = 0;
      let blue = 0;
      let count = 0;
      for (let index = 0; index < pixels.length; index += 24) {
        if (pixels[index + 3] < 40) continue;
        red += pixels[index];
        green += pixels[index + 1];
        blue += pixels[index + 2];
        count += 1;
      }
      if (!count) return tone.clone();
      return new THREE.Color(red / count / 255, green / count / 255, blue / count / 255);
    }

    function wrapMap(crop) {
      const size = 1024;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const paint = canvas.getContext("2d");
      const ink = averageColor(crop);
      paint.fillStyle = `#${ink.getHexString()}`;
      paint.fillRect(0, 0, size, size);
      paint.drawImage(crop, 0, 0, size, size);
      const band = size * 0.5;
      paint.drawImage(crop, (size - band) / 2, 0, band, size);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.offset.x = 0.5;
      return { texture, ink };
    }

    function erode(canvas, radius) {
      const source = document.createElement("canvas");
      source.width = canvas.width;
      source.height = canvas.height;
      const paint = source.getContext("2d", { willReadFrequently: true });
      paint.drawImage(canvas, 0, 0);
      const image = paint.getImageData(0, 0, source.width, source.height);
      const copy = new Uint8ClampedArray(image.data);
      const width = source.width;
      const height = source.height;
      let kept = 0;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = (y * width + x) * 4;
          if (copy[index + 3] < 24) continue;
          let edge = false;
          for (let dy = -radius; dy <= radius && !edge; dy += 1) {
            for (let dx = -radius; dx <= radius; dx += 1) {
              const xx = x + dx;
              const yy = y + dy;
              if (xx < 0 || yy < 0 || xx >= width || yy >= height || copy[(yy * width + xx) * 4 + 3] < 24) {
                edge = true;
                break;
              }
            }
          }
          if (edge) image.data[index + 3] = 0;
          else kept += 1;
        }
      }
      if (kept < 80) return canvas;
      paint.putImageData(image, 0, 0);
      return source;
    }

    function tube(crop, radiusTop, radiusBottom, length, open) {
      const wrapped = wrapMap(tight(erode(crop, 6)));
      const side = new THREE.MeshPhysicalMaterial({
        map: wrapped.texture,
        color: 0xffffff,
        roughness: 0.45,
        metalness: 0.02,
        sheen: 0.5,
        sheenRoughness: 0.42,
        sheenColor: wrapped.ink,
      });
      const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 48, 1, !!open);
      if (open) return new THREE.Mesh(geometry, side);
      const cap = new THREE.MeshPhysicalMaterial({ color: wrapped.ink, roughness: 0.7, sheen: 0.35, sheenColor: wrapped.ink });
      return new THREE.Mesh(geometry, [side, cap, cap]);
    }

    function limb(crop, radiusTop, radiusBottom, from, to) {
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const dz = to[2] - from[2];
      const length = Math.max(0.05, Math.hypot(dx, dy, dz));
      const mesh = tube(crop, radiusTop, radiusBottom, length);
      mesh.position.set((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2);
      const up = new THREE.Vector3(-dx, -dy, -dz).normalize();
      const front = Math.abs(up.z) > 0.92 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
      const side = new THREE.Vector3().crossVectors(up, front).normalize();
      const facing = new THREE.Vector3().crossVectors(side, up).normalize();
      mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, facing));
      return mesh;
    }

    function tight(canvas) {
      const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;
      let found = 0;
      for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
          if (pixels[(y * canvas.width + x) * 4 + 3] < 40) continue;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          found += 1;
        }
      }
      if (!found) return canvas;
      return slice(canvas, minX / canvas.width, minY / canvas.height, Math.min(1, (maxX + 2) / canvas.width), Math.min(1, (maxY + 2) / canvas.height));
    }

    function part(canvas, x0, x1) {
      return tight(slice(canvas, x0, 0.01, x1, 0.99));
    }

    function loopsOf(canvas) {
      const cols = 200;
      const rows = Math.max(12, Math.round(cols * canvas.height / Math.max(1, canvas.width)));
      const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
      const grid = new Uint8Array((cols + 1) * (rows + 1));
      const stride = cols + 1;
      for (let y = 0; y <= rows; y += 1) {
        for (let x = 0; x <= cols; x += 1) {
          const px = Math.min(canvas.width - 1, Math.round(x / cols * (canvas.width - 1)));
          const py = Math.min(canvas.height - 1, Math.round(y / rows * (canvas.height - 1)));
          grid[y * stride + x] = pixels[(py * canvas.width + px) * 4 + 3] > 90 ? 1 : 0;
        }
      }
      const segments = [];
      const links = [
        [],
        [[0, 3]],
        [[3, 1]],
        [[0, 1]],
        [[1, 2]],
        [[0, 2], [1, 3]],
        [[3, 2]],
        [[0, 2]],
        [[2, 0]],
        [[2, 3]],
        [[2, 1], [0, 3]],
        [[2, 1]],
        [[1, 0]],
        [[1, 3]],
        [[3, 0]],
      ];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const code = grid[y * stride + x]
            | (grid[y * stride + x + 1] << 1)
            | (grid[(y + 1) * stride + x + 1] << 2)
            | (grid[(y + 1) * stride + x] << 3);
          const edge = [
            [x, y + 0.5],
            [x + 1, y + 0.5],
            [x + 0.5, y + 1],
            [x + 0.5, y],
          ];
          (links[code] || []).forEach(([from, to]) => segments.push([edge[from], edge[to]]));
        }
      }
      const next = new Map();
      const stamp = (point) => `${point[0].toFixed(1)},${point[1].toFixed(1)}`;
      segments.forEach(([from, to]) => {
        const key = stamp(from);
        if (!next.has(key)) next.set(key, []);
        next.get(key).push(to);
      });
      const used = new Set();
      const loops = [];
      segments.forEach(([from, to]) => {
        const start = stamp(from);
        if (used.has(`${start}>${stamp(to)}`)) return;
        const loop = [from.slice()];
        let current = to;
        for (let guard = 0; guard < segments.length + 2; guard += 1) {
          const mark = `${stamp(loop[loop.length - 1])}>${stamp(current)}`;
          if (used.has(mark)) break;
          used.add(mark);
          if (stamp(current) === start) break;
          loop.push(current.slice());
          const options = next.get(stamp(current)) || [];
          const following = options.find((point) => !used.has(`${stamp(current)}>${stamp(point)}`));
          if (!following) break;
          current = following;
        }
        if (loop.length > 14 && stamp(current) === start) loops.push(loop);
      });
      const area = (loop) => {
        let sum = 0;
        for (let index = 0; index < loop.length; index += 1) {
          const a = loop[index];
          const b = loop[(index + 1) % loop.length];
          sum += a[0] * b[1] - b[0] * a[1];
        }
        return sum / 2;
      };
      const contains = (point, loop) => {
        let hits = 0;
        for (let index = 0; index < loop.length; index += 1) {
          const a = loop[index];
          const b = loop[(index + 1) % loop.length];
          if ((a[1] > point[1]) === (b[1] > point[1])) continue;
          const x = a[0] + (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]);
          if (x > point[0]) hits += 1;
        }
        return hits % 2 === 1;
      };
      const smooth = (loop) => {
        let points = loop;
        if (points.length > 280) {
          const kept = [];
          const step = points.length / 220;
          for (let index = 0; index < 220; index += 1) kept.push(points[Math.floor(index * step)]);
          points = kept;
        }
        for (let pass = 0; pass < 3; pass += 1) {
          const nextPoints = [];
          for (let index = 0; index < points.length; index += 1) {
            const a = points[index];
            const b = points[(index + 1) % points.length];
            nextPoints.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
            nextPoints.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
          }
          points = nextPoints;
        }
        return points;
      };
      const shapes = loops
        .map((loop) => ({ source: loop, loop: smooth(loop), area: Math.abs(area(loop)) }))
        .filter((entry) => entry.area > cols * rows * 0.004)
        .sort((a, b) => b.area - a.area);
      return shapes
        .filter((entry, index) => !shapes.slice(0, index).some((outer) => contains(entry.source[0], outer.loop)))
        .map((entry) => {
          const holes = loops.filter((loop) => loop !== entry.source && Math.abs(area(loop)) > 30 && contains(loop[0], entry.loop) && !loops.some((other) => other !== entry.source && other !== loop && contains(other[0], entry.loop) && contains(loop[0], other)));
          return { outer: entry.loop, holes: holes.map(smooth) };
        });
    }

    function solidMap(canvas) {
      const baked = document.createElement("canvas");
      baked.width = canvas.width;
      baked.height = canvas.height;
      const paint = baked.getContext("2d");
      paint.fillStyle = `#${tone.getHexString()}`;
      paint.fillRect(0, 0, baked.width, baked.height);
      paint.drawImage(canvas, 0, 0);
      const texture = new THREE.CanvasTexture(baked);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    }

    function campoDistancia(canvas) {
      const w = 96;
      const h = 96;
      const sample = document.createElement("canvas");
      sample.width = w;
      sample.height = h;
      const paint = sample.getContext("2d", { willReadFrequently: true });
      paint.drawImage(canvas, 0, 0, w, h);
      const data = paint.getImageData(0, 0, w, h).data;
      const dist = new Float32Array(w * h);
      for (let i = 0; i < dist.length; i += 1) dist[i] = data[i * 4 + 3] > 40 ? 1e6 : 0;
      const paso = (x, y, costo) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return 1e6;
        return dist[y * w + x] + costo;
      };
      for (let y = 0; y < h; y += 1) {
        for (let x = 0; x < w; x += 1) {
          const i = y * w + x;
          if (dist[i] === 0) continue;
          dist[i] = Math.min(dist[i], paso(x - 1, y, 1), paso(x, y - 1, 1), paso(x - 1, y - 1, 1.4142));
        }
      }
      for (let y = h - 1; y >= 0; y -= 1) {
        for (let x = w - 1; x >= 0; x -= 1) {
          const i = y * w + x;
          if (dist[i] === 0) continue;
          dist[i] = Math.min(dist[i], paso(x + 1, y, 1), paso(x, y + 1, 1), paso(x + 1, y + 1, 1.4142));
        }
      }
      return { dist, w, h };
    }

    function muestraCampo(campo, u, v) {
      const x = Math.max(0, Math.min(campo.w - 1, Math.round(u * (campo.w - 1))));
      const y = Math.max(0, Math.min(campo.h - 1, Math.round(v * (campo.h - 1))));
      const valor = campo.dist[y * campo.w + x];
      return valor > 1e5 ? 0 : valor;
    }

    function grosorTope(width, height) {
      const menor = Math.min(width, height);
      if (/media|calcetin/.test(label)) return menor * 0.48;
      if (/betun|lata|tarro/.test(label)) return menor * 0.2;
      if (/correa|cinturon|reata|placa|panoleta|panuelo|corbata|sabana|parche|insignia|eslinga/.test(label)) return menor * 0.04;
      if (/morral|bolso|canguro|camelback|detodito|mochila/.test(label)) return menor * 0.32;
      if (/gorra|boina|casco/.test(label)) return menor * 0.36;
      if (/bota|zapato/.test(label)) return height * 0.34;
      if (/gafa|guante/.test(label)) return menor * 0.1;
      if (/cuchill|karambit|navaja/.test(label)) return menor * 0.05;
      if (/chapuza|funda|pistolera/.test(label)) return menor * 0.16;
      return menor * 0.12;
    }

    function formMesh(canvas, width, height, depth, redondo) {
      const pieces = loopsOf(canvas);
      if (!pieces.length) {
        const rows = 160;
        const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
        const left = [];
        const right = [];
        for (let row = 0; row < rows; row += 1) {
          const y = Math.min(canvas.height - 1, Math.round(row / (rows - 1) * (canvas.height - 1)));
          let min = -1;
          let max = -1;
          for (let x = 0; x < canvas.width; x += 2) {
            if (pixels[(y * canvas.width + x) * 4 + 3] > 80) { min = x; break; }
          }
          for (let x = canvas.width - 1; x >= 0; x -= 2) {
            if (pixels[(y * canvas.width + x) * 4 + 3] > 80) { max = x; break; }
          }
          if (min < 0) continue;
          const worldY = (0.5 - row / (rows - 1)) * height;
          left.push([(min / canvas.width - 0.5) * width, worldY]);
          right.push([(max / canvas.width - 0.5) * width, worldY]);
        }
        if (left.length > 8) {
          let ring = left.concat(right.reverse());
          for (let pass = 0; pass < 2; pass += 1) {
            const next = [];
            for (let index = 0; index < ring.length; index += 1) {
              const a = ring[index];
              const b = ring[(index + 1) % ring.length];
              next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
              next.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
            }
            ring = next;
          }
          const shape = new THREE.Shape();
          ring.forEach((point, index) => (index ? shape.lineTo(point[0], point[1]) : shape.moveTo(point[0], point[1])));
          pieces.push({ shape });
        }
      }
      if (!pieces.length) return null;
      const photoFace = (mirror) => {
        const baked = document.createElement("canvas");
        baked.width = canvas.width;
        baked.height = canvas.height;
        const paint = baked.getContext("2d");
        paint.fillStyle = `#${tone.getHexString()}`;
        paint.fillRect(0, 0, baked.width, baked.height);
        if (mirror) {
          paint.translate(baked.width, 0);
          paint.scale(-1, 1);
        }
        paint.drawImage(canvas, 0, 0);
        const texture = new THREE.CanvasTexture(baked);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const material = new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff });
        material.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader.replace(
            "#include <uv_vertex>",
            `vMapUv = vec2(position.x / ${width.toFixed(4)} + 0.5, position.y / ${height.toFixed(4)} + 0.5);`
          );
        };
        material.customProgramCacheKey = () => `forma-${mirror ? "atras" : "frente"}-${width.toFixed(2)}-${height.toFixed(2)}`;
        return material;
      };
      const face = photoFace(false);
      const backFace = photoFace(true);
      const bodyTone = new THREE.MeshPhysicalMaterial({
        color: tone,
        roughness: 0.46,
        metalness: 0.08,
        clearcoat: 0.18,
        clearcoatRoughness: 0.3,
      });
      const holder = new THREE.Group();
      pieces.forEach((piece) => {
        const shape = piece.shape || new THREE.Shape();
        if (piece.shape) {
          /* listo */
        } else {
        const rows = Math.max(12, Math.round(200 * canvas.height / Math.max(1, canvas.width)));
        const world = (point) => [(point[0] / 200 - 0.5) * width, (0.5 - point[1] / rows) * height];
        const ringArea = (path) => {
          let sum = 0;
          for (let index = 0; index < path.length; index += 1) {
            const a = world(path[index]);
            const b = world(path[(index + 1) % path.length]);
            sum += a[0] * b[1] - b[0] * a[1];
          }
          return sum;
        };
        const place = (path, target) => {
          path.forEach((point, index) => {
            const [x, y] = world(point);
            if (index === 0) target.moveTo(x, y);
            else target.lineTo(x, y);
          });
        };
        const outer = piece.outer.slice();
        if (ringArea(outer) < 0) outer.reverse();
        place(outer, shape);
        piece.holes.forEach((hole) => {
          const path = new THREE.Path();
          const ring = hole.slice();
          if (ringArea(ring) > 0) ring.reverse();
          place(ring, path);
          shape.holes.push(path);
        });
        }
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: true,
          bevelThickness: depth * 0.12,
          bevelSize: Math.min(width, height) * 0.012,
          bevelSegments: 2,
          curveSegments: 8,
        });
        geometry.translate(0, 0, -depth / 2);
        const positions = geometry.attributes.position;
        if (redondo) {
          const campo = campoDistancia(canvas);
          const tope = grosorTope(width, height);
          const paso = Math.min(width / campo.w, height / campo.h);
          for (let vertex = 0; vertex < positions.count; vertex += 1) {
            const u = positions.getX(vertex) / width + 0.5;
            const v = 0.5 - positions.getY(vertex) / height;
            const lejos = muestraCampo(campo, u, v) * paso;
            const factor = /media|calcetin/.test(label) ? 1.85 : 1;
            const gordo = Math.max(depth * 0.35, Math.min(tope, lejos * factor));
            const sign = positions.getZ(vertex) >= 0 ? 1 : -1;
            positions.setZ(vertex, sign * gordo);
          }
        }
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
        const index = geometry.getIndex();
        const normal = geometry.getAttribute("normal");
        if (index && normal) {
          const front = [];
          const back = [];
          const side = [];
          for (let vertex = 0; vertex < index.count; vertex += 3) {
            const a = index.getX(vertex);
            const b = index.getX(vertex + 1);
            const c = index.getX(vertex + 2);
            const facing = (normal.getZ(a) + normal.getZ(b) + normal.getZ(c)) / 3;
            const bucket = facing > 0.45 ? front : facing < -0.45 ? back : side;
            bucket.push(a, b, c);
          }
          geometry.setIndex(front.concat(back, side));
          geometry.clearGroups();
          geometry.addGroup(0, front.length, 0);
          geometry.addGroup(front.length, back.length, 1);
          geometry.addGroup(front.length + back.length, side.length, 2);
        }
        holder.add(new THREE.Mesh(geometry, [face, backFace, bodyTone]));
      });
      holder.position.y = height / 2 + 0.08;
      return holder;
    }

    function rowSpans(canvas) {
      const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
      const rows = 96;
      const spans = [];
      for (let row = 0; row < rows; row += 1) {
        const y = Math.min(canvas.height - 1, Math.round(row / (rows - 1) * (canvas.height - 1)));
        let min = canvas.width;
        let max = -1;
        for (let x = 0; x < canvas.width; x += 2) {
          if (pixels[(y * canvas.width + x) * 4 + 3] > 48) {
            if (x < min) min = x;
            if (x > max) max = x;
          }
        }
        spans.push(max < 0 ? null : { min: min / canvas.width, max: max / canvas.width, width: (max - min) / canvas.width });
      }
      return spans;
    }

    function longSleeves(canvas) {
      const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
      const y0 = Math.round(canvas.height * 0.5);
      const y1 = Math.round(canvas.height * 0.9);
      const hit = (x0, x1) => {
        for (let y = y0; y < y1; y += 8) {
          for (let x = x0; x < x1; x += 4) {
            if (pixels[(y * canvas.width + x) * 4 + 3] > 40) return true;
          }
        }
        return false;
      };
      const left = hit(0, canvas.width * 0.4);
      const right = hit(canvas.width * 0.6, canvas.width);
      return left || right;
    }

    function plastic(color) {
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.34,
        metalness: 0.06,
        clearcoat: 0.45,
        clearcoatRoughness: 0.22,
      });
    }

    function labeledBox(crop, width, height, depth) {
      const baked = document.createElement("canvas");
      baked.width = Math.max(2, crop.width);
      baked.height = Math.max(2, crop.height);
      const paint = baked.getContext("2d");
      const ink = averageColor(crop);
      paint.fillStyle = `#${ink.getHexString()}`;
      paint.fillRect(0, 0, baked.width, baked.height);
      paint.drawImage(crop, 0, 0);
      const texture = new THREE.CanvasTexture(baked);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const front = new THREE.MeshPhysicalMaterial({
        map: texture,
        color: 0xffffff,
        roughness: 0.38,
        metalness: 0.04,
        clearcoat: 0.32,
        clearcoatRoughness: 0.28,
      });
      const side = plastic(ink);
      const back = plastic(ink.clone().multiplyScalar(0.82));
      return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), [side, side, side, side, front, back]);
    }

    function goods(canvas, fitWidth, fitHeight) {
      const spans = rowSpans(canvas);
      let split = -1;
      let jump = 0;
      for (let row = 12; row < spans.length - 12; row += 1) {
        let above = 0;
        let below = 0;
        let aboveCount = 0;
        let belowCount = 0;
        for (let index = row - 8; index < row; index += 1) if (spans[index]) { above += spans[index].width; aboveCount += 1; }
        for (let index = row; index < row + 8; index += 1) if (spans[index]) { below += spans[index].width; belowCount += 1; }
        if (!aboveCount || !belowCount) continue;
        const delta = below / belowCount - above / aboveCount;
        if (delta > jump) { jump = delta; split = row; }
      }
      const holder = new THREE.Group();
      let maxWidth = 0;
      spans.forEach((span) => { if (span && span.width > maxWidth) maxWidth = span.width; });
      let boxStart = -1;
      let sawNarrow = false;
      for (let row = 0; row < spans.length; row += 1) {
        if (!spans[row]) continue;
        if (spans[row].width < maxWidth * 0.86) sawNarrow = true;
        else if (sawNarrow && spans[row].width > maxWidth * 0.9) { boxStart = row; break; }
      }
      const useSplit = boxStart > 8 && boxStart < spans.length - 8;
      if (!useSplit) {
        const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
        let opaque = 0;
        let seen = 0;
        for (let index = 3; index < pixels.length; index += 32) {
          seen += 1;
          if (pixels[index] > 48) opaque += 1;
        }
        if (!seen || opaque / seen < 0.55) return holder;
      }
      const bands = useSplit
        ? [
          { from: 0, to: boxStart, kind: "tube" },
          { from: boxStart, to: spans.length - 1, kind: "box" },
        ]
        : [{ from: 0, to: spans.length - 1, kind: "box" }];
      bands.forEach((band) => {
        const rows = spans.slice(band.from, band.to + 1).filter(Boolean);
        if (rows.length < 3) return;
        const y0 = band.from / (spans.length - 1);
        const y1 = band.to / (spans.length - 1);
        const x0 = Math.min(...rows.map((row) => row.min));
        const x1 = Math.max(...rows.map((row) => row.max));
        const crop = tight(slice(canvas, x0, y0, x1, y1));
        const worldW = (x1 - x0) * fitWidth;
        const worldH = (y1 - y0) * fitHeight;
        if (band.kind === "tube" && worldW > worldH * 1.4) {
          const radius = worldH * 0.52;
          const ink = averageColor(crop);
          const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.96, worldW, 56), plastic(ink));
          body.rotation.z = Math.PI / 2;
          const arc = 2.05;
          const baked = document.createElement("canvas");
          baked.width = Math.max(2, crop.width);
          baked.height = Math.max(2, crop.height);
          const paint = baked.getContext("2d");
          paint.fillStyle = `#${ink.getHexString()}`;
          paint.fillRect(0, 0, baked.width, baked.height);
          paint.drawImage(crop, 0, 0);
          const texture = new THREE.CanvasTexture(baked);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          const label = new THREE.Mesh(
            new THREE.CylinderGeometry(radius * 1.012, radius * 0.97, worldW * 0.98, 56, 1, true, -0.35, arc),
            new THREE.MeshPhysicalMaterial({ map: texture, roughness: 0.36, metalness: 0.02, clearcoat: 0.4, clearcoatRoughness: 0.24 })
          );
          label.rotation.z = Math.PI / 2;
          const pack = new THREE.Group();
          pack.add(body, label);
          pack.position.set(((x0 + x1) / 2 - 0.5) * fitWidth, (1 - (y0 + y1) / 2) * fitHeight, radius * 0.05);
          holder.add(pack);
        } else {
          const depth = Math.max(0.16, Math.min(worldW, worldH) * (useSplit ? 0.72 : 0.46));
          const mesh = labeledBox(crop, worldW, worldH, depth);
          mesh.position.set(((x0 + x1) / 2 - 0.5) * fitWidth, (1 - (y0 + y1) / 2) * fitHeight, 0);
          holder.add(mesh);
        }
      });
      const bounds = new THREE.Box3().setFromObject(holder);
      holder.position.y -= bounds.min.y - 0.08;
      return holder;
    }

    const group = new THREE.Group();
    const aspect = photo.width / Math.max(1, photo.height);
    const worn = wearTop || wearLegs;
    const pant = new THREE.MeshPhysicalMaterial({ color: 0xf3f0ea, roughness: 0.78, metalness: 0, sheen: 0.25, sheenColor: 0xf7f4ee });
    const shoeWhite = new THREE.MeshPhysicalMaterial({ color: 0xf7f6f3, roughness: 0.42, clearcoat: 0.18, clearcoatRoughness: 0.4 });

    function clothTex(x0, y0, x1, y1) {
      const crop = slice(photo, x0, y0, x1, y1);
      const ink = averageColor(crop);
      const baked = document.createElement("canvas");
      baked.width = 768;
      baked.height = Math.max(128, Math.round(768 * crop.height / Math.max(1, crop.width)));
      const paint = baked.getContext("2d");
      paint.fillStyle = `#${ink.getHexString()}`;
      paint.fillRect(0, 0, baked.width, baked.height);
      paint.drawImage(crop, 0, 0, baked.width, baked.height);
      const texture = new THREE.CanvasTexture(baked);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return new THREE.MeshPhysicalMaterial({
        map: texture,
        color: 0xffffff,
        roughness: 0.72,
        metalness: 0.02,
        sheen: 0.55,
        sheenRoughness: 0.42,
        sheenColor: ink,
      });
    }

    function bone(r0, r1, from, to, material) {
      const dir = to.clone().sub(from);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, Math.max(0.04, dir.length()), 22), material);
      mesh.position.copy(from).add(to).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      return mesh;
    }

    function lata(canvas, fitW, fitH) {
      const grupo = new THREE.Group();
      const radio = Math.min(fitW, fitH) * 0.42;
      const alto = radio * 0.62;
      const banda = slice(canvas, 0.06, 0.48, 0.94, 0.96);
      const mapa = solidMap(banda);
      mapa.wrapS = THREE.RepeatWrapping;
      const metal = new THREE.MeshPhysicalMaterial({ color: 0xc8ccd0, metalness: 0.88, roughness: 0.26, clearcoat: 0.4 });
      const cuerpo = new THREE.Mesh(
        new THREE.CylinderGeometry(radio, radio * 0.98, alto, 72),
        [new THREE.MeshBasicMaterial({ map: mapa }), metal, metal]
      );
      cuerpo.position.y = alto / 2 + 0.02;
      grupo.add(cuerpo);
      return grupo;
    }

    function crema(canvas, fitW, fitH) {
      const grupo = new THREE.Group();
      const cajaW = Math.max(fitW, fitH) * 0.92;
      const cajaH = Math.min(fitW, fitH) * 0.34;
      const cajaD = cajaH * 0.78;
      const frente = solidMap(slice(canvas, 0.02, 0.5, 0.98, 0.98));
      const costado = plastic(averageColor(slice(canvas, 0.02, 0.5, 0.98, 0.98)));
      const caja = new THREE.Mesh(new THREE.BoxGeometry(cajaW, cajaH, cajaD), [costado, costado, costado, costado, new THREE.MeshBasicMaterial({ map: frente }), new THREE.MeshBasicMaterial({ map: frente })]);
      caja.position.y = cajaH / 2;
      grupo.add(caja);
      const largo = cajaW * 0.94;
      const radio = cajaH * 0.3;
      const etiqueta = solidMap(slice(canvas, 0.14, 0.06, 0.9, 0.44));
      const tubo = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio * 0.7, largo, 40), new THREE.MeshBasicMaterial({ map: etiqueta }));
      tubo.rotation.z = Math.PI / 2;
      tubo.position.set(0.04, cajaH + radio * 0.9, 0);
      grupo.add(tubo);
      const tapa = new THREE.Mesh(
        new THREE.CylinderGeometry(radio * 0.48, radio * 0.48, radio * 1.35, 24),
        new THREE.MeshPhysicalMaterial({ color: 0xf4f5f6, roughness: 0.35, metalness: 0.05 })
      );
      tapa.rotation.z = Math.PI / 2;
      tapa.position.set(-largo / 2 + 0.02, tubo.position.y, 0);
      grupo.add(tapa);
      return grupo;
    }

    function barrido(canvas, ancho, alto) {
      const cordon = /cordon|plantilla|liga/.test(label);
      const redondo = !cordon && /media|calcetin|bota|zapato|linterna|binocular|marmita|cantimplora|pito|aceite|repelente|pipeta|cortau|cepillo|gas pimienta/.test(label);
      const visera = /gorra|kepis|pava/.test(label);
      const boina = /boina|casco/.test(label);
      const bolsa = /morral|bolso|mochila|camelback|tula|canguro|detodito|peluche|silla|iglu|kit de limpieza|forro cantimplora/.test(label);
      const plano = /correa|cinturon|reata|eslinga|cintela|velcro|porta fusil|corbata|panoleta|shemag|toalla|poncho|sabana|hamaca|placa|gafa|gasfa|navaja|cuchill|karambit|mona|torniquete|estera|toldillo|mimetismo|plastico|guindo|llavero|lapicero|tarjetero|portacarnet|insignia/.test(label);
      const filas = 140;
      const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
      const W = canvas.width;
      const perfil = [];
      for (let i = 0; i < filas; i += 1) {
        const y = Math.min(canvas.height - 1, Math.round(i / (filas - 1) * (canvas.height - 1)));
        let min = W;
        let max = -1;
        for (let x = 0; x < W; x += 1) {
          if (pixels[(y * W + x) * 4 + 3] > 36) {
            if (x < min) min = x;
            if (x > max) max = x;
          }
        }
        perfil.push(max < 0 ? null : { cx: (min + max) / 2 / W, half: Math.max(0.004, (max - min) / 2 / W) });
      }
      if (!perfil.some(Boolean)) return null;
      for (let i = 0; i < filas; i += 1) {
        if (perfil[i]) continue;
        let previo = null;
        let siguiente = null;
        for (let j = i - 1; j >= 0; j -= 1) if (perfil[j]) { previo = perfil[j]; break; }
        for (let j = i + 1; j < filas; j += 1) if (perfil[j]) { siguiente = perfil[j]; break; }
        const base = previo && siguiente
          ? { cx: (previo.cx + siguiente.cx) / 2, half: Math.min(previo.half, siguiente.half) * 0.35 }
          : (previo || siguiente || { cx: 0.5, half: 0.02 });
        perfil[i] = { cx: base.cx, half: base.half };
      }
      for (let pass = 0; pass < 2; pass += 1) {
        const copia = perfil.map((punto) => ({ cx: punto.cx, half: punto.half }));
        for (let i = 1; i < filas - 1; i += 1) {
          perfil[i].cx = (copia[i - 1].cx + copia[i].cx * 2 + copia[i + 1].cx) / 4;
          perfil[i].half = (copia[i - 1].half + copia[i].half * 2 + copia[i + 1].half) / 4;
        }
      }

      const orden = perfil.map((punto) => punto.half).sort((a, b) => a - b);
      const mediana = orden[Math.floor(orden.length / 2)] || 0.08;
      const menor = Math.min(ancho, alto);
      const anchoReal = Math.min(ancho, mediana * 2 * ancho);
      const grosor = Math.min(ancho, alto) * 0.04;
      const mapa = solidMap(canvas);
      const foto = new THREE.MeshBasicMaterial({ map: mapa });
      const canto = new THREE.MeshBasicMaterial({ vertexColors: true });
      const posiciones = [];
      const uvs = [];
      const colores = [];
      const frente = [];
      const cuerpo = [];
      const vertice = (i, k) => i * 4 + k;
      const tintaDeFila = [];
      const leer = (punto, y, lado, dentro) => {
        const x = Math.max(0, Math.min(W - 1, Math.round((punto.cx + lado * punto.half * dentro) * (W - 1))));
        const p = (y * W + x) * 4;
        return pixels[p + 3] > 30 ? [pixels[p] / 255, pixels[p + 1] / 255, pixels[p + 2] / 255] : [tone.r, tone.g, tone.b];
      };
      for (let i = 0; i < filas; i += 1) {
        const t = i / (filas - 1);
        const y = Math.min(canvas.height - 1, Math.round(t * (canvas.height - 1)));
        const punto = perfil[i];
        let color = leer(punto, y, -1, 0.98);
        for (let dentro = 0.98; dentro >= 0.5; dentro -= 0.04) {
          const prueba = leer(punto, y, -1, dentro);
          const luz = prueba[0] + prueba[1] + prueba[2];
          if (luz > 0.45 && luz < 2.55) { color = prueba; break; }
        }
        tintaDeFila.push(color);
      }
      for (let pass = 0; pass < 8; pass += 1) {
        const copia = tintaDeFila.map((color) => color.slice());
        for (let i = 1; i < filas - 1; i += 1) {
          tintaDeFila[i] = [0, 1, 2].map((canal) => (copia[i - 1][canal] + copia[i][canal] * 2 + copia[i + 1][canal]) / 4);
        }
      }
      for (let i = 0; i < filas; i += 1) {
        const t = i / (filas - 1);
        const y = (0.5 - t) * alto;
        const punto = perfil[i];
        const uL = punto.cx - punto.half;
        const uR = punto.cx + punto.half;
        const xL = (uL - 0.5) * ancho;
        const xR = (uR - 0.5) * ancho;
        const v = 1 - t;
        const z = grosor / 2;
        const rgb = tintaDeFila[i];
        [[xL, z, uL], [xR, z, uR], [xL, -z, uL], [xR, -z, uR]].forEach((dato, k) => {
          posiciones.push(dato[0], y, dato[1]);
          uvs.push(dato[2], v);
          const claro = rgb;
          colores.push(claro[0], claro[1], claro[2]);
        });
      }
      for (let i = 0; i < filas - 1; i += 1) {
        const a = vertice(i, 0);
        const b = vertice(i, 1);
        const c = vertice(i + 1, 1);
        const d = vertice(i + 1, 0);
        frente.push(a, d, b, b, d, c);
        const e = vertice(i, 2);
        const f = vertice(i, 3);
        const g = vertice(i + 1, 3);
        const h = vertice(i + 1, 2);
        cuerpo.push(e, f, h, f, g, h);
        cuerpo.push(a, e, d, e, h, d);
        cuerpo.push(b, c, f, f, c, g);
      }
      const tapa = (fila, arriba) => {
        const a = vertice(fila, 0);
        const b = vertice(fila, 1);
        const e = vertice(fila, 2);
        const f = vertice(fila, 3);
        if (arriba) cuerpo.push(a, b, f, a, f, e);
        else cuerpo.push(a, e, f, a, f, b);
      };
      tapa(0, true);
      tapa(filas - 1, false);
      const geometria = new THREE.BufferGeometry();
      geometria.setAttribute("position", new THREE.Float32BufferAttribute(posiciones, 3));
      geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geometria.setAttribute("color", new THREE.Float32BufferAttribute(colores, 3));
      geometria.setIndex(frente.concat(cuerpo));
      geometria.clearGroups();
      geometria.addGroup(0, frente.length, 0);
      geometria.addGroup(frente.length, cuerpo.length, 1);
      geometria.computeVertexNormals();
      const malla = new THREE.Mesh(geometria, [foto, canto]);
      malla.position.y = alto / 2 + 0.08;
      return malla;
    }

    function ficha(canvas) {
      const relacion = canvas.width / Math.max(1, canvas.height);
      const medida = 1.02;
      const ancho = relacion >= 1 ? medida : medida * relacion;
      const alto = relacion >= 1 ? medida / relacion : medida;
      const mapa = new THREE.CanvasTexture(canvas);
      mapa.colorSpace = THREE.SRGBColorSpace;
      mapa.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const cara = new THREE.Mesh(
        new THREE.PlaneGeometry(ancho, alto),
        new THREE.MeshBasicMaterial({ map: mapa, transparent: true, alphaTest: 0.15, side: THREE.FrontSide })
      );
      const profundo = Math.min(ancho, alto) * 0.045;
      const lomo = new THREE.Mesh(
        new THREE.BoxGeometry(ancho * 0.7, alto * 0.82, profundo),
        new THREE.MeshBasicMaterial({ color: tone })
      );
      lomo.position.z = -profundo * 0.45;
      cara.position.z = 0.002;
      const grupo = new THREE.Group();
      grupo.add(lomo, cara);
      grupo.position.y = alto / 2 + 0.06;
      return grupo;
    }

    function siluetaLata(canvas) {
      const datos = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
      const anchoImg = canvas.width;
      const altoImg = canvas.height;
      const anchos = [];
      for (let i = 0; i < 28; i += 1) {
        const y = Math.round((i + 0.5) / 28 * (altoImg - 1));
        let min = anchoImg;
        let max = -1;
        for (let x = 0; x < anchoImg; x += 2) {
          if (datos[(y * anchoImg + x) * 4 + 3] > 40) {
            if (x < min) min = x;
            if (x > max) max = x;
          }
        }
        if (max > min) anchos.push(max - min);
      }
      if (anchos.length < 14) return false;
      anchos.sort((a, b) => a - b);
      const media = anchos[anchos.length >> 1];
      const mayor = anchos[anchos.length - 1];
      return media / mayor > 0.8 && altoImg > anchoImg * 1.2;
    }

    function envase(canvas, ancho, alto) {
      const radio = ancho / 2;
      const pixeles = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
      const anchoImg = canvas.width;
      const altoImg = canvas.height;
      const colorDe = (y, lado) => {
        const fila = Math.max(0, Math.min(altoImg - 1, y));
        let min = anchoImg;
        let max = -1;
        for (let x = 0; x < anchoImg; x += 1) {
          if (pixeles[(fila * anchoImg + x) * 4 + 3] > 40) {
            if (x < min) min = x;
            if (x > max) max = x;
          }
        }
        if (max < 0) return [tone.r, tone.g, tone.b];
        const margen = Math.max(2, Math.round((max - min) * 0.1));
        const x = lado < 0 ? Math.min(anchoImg - 1, min + margen) : Math.max(0, max - margen);
        const p = (fila * anchoImg + x) * 4;
        return [pixeles[p] / 255, pixeles[p + 1] / 255, pixeles[p + 2] / 255];
      };
      const elegir = (y) => {
        const a = colorDe(y, -1);
        const b = colorDe(y, 1);
        const luz = (c) => c[0] + c[1] + c[2];
        const usable = (c) => luz(c) > 0.28 && luz(c) < 2.65;
        if (usable(a)) return a;
        if (usable(b)) return b;
        return luz(a) < luz(b) ? a : b;
      };
      const lienzo = document.createElement("canvas");
      lienzo.width = anchoImg * 2;
      lienzo.height = altoImg;
      const pincel = lienzo.getContext("2d");
      for (let y = 0; y < altoImg; y += 1) {
        const rgb = elegir(y);
        pincel.fillStyle = `rgb(${Math.round(rgb[0] * 255)},${Math.round(rgb[1] * 255)},${Math.round(rgb[2] * 255)})`;
        pincel.fillRect(0, y, lienzo.width, 1);
      }
      pincel.drawImage(canvas, anchoImg * 0.5, 0, anchoImg, altoImg);
      const mapa = new THREE.CanvasTexture(lienzo);
      mapa.colorSpace = THREE.SRGBColorSpace;
      mapa.wrapS = THREE.RepeatWrapping;
      mapa.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const arriba = elegir(Math.round(altoImg * 0.04));
      const abajo = elegir(Math.round(altoImg * 0.96));
      const tapa = new THREE.MeshBasicMaterial({ color: new THREE.Color(arriba[0], arriba[1], arriba[2]) });
      const base = new THREE.MeshBasicMaterial({ color: new THREE.Color(abajo[0], abajo[1], abajo[2]) });
      const cuerpo = new THREE.Mesh(
        new THREE.CylinderGeometry(radio, radio * 0.985, alto, 72, 1, false),
        [new THREE.MeshBasicMaterial({ map: mapa }), tapa, base]
      );
      cuerpo.rotation.y = Math.PI;
      cuerpo.position.y = alto / 2 + 0.04;
      return cuerpo;
    }

    if (dressed) {
      let height = wearHead ? 0.9 : 1.25;
      let width = height * aspect;
      if (width > 1.2) {
        width = 1.2;
        height = width / aspect;
      }
      const garment = formMesh(photo, width, height, wearHead ? 0.16 : 0.07);
      if (garment) {
        garment.traverse((mesh) => {
          if (!mesh.isMesh || !mesh.geometry || !mesh.geometry.attributes.position) return;
          const pos = mesh.geometry.attributes.position;
          const half = width * 0.5;
          for (let index = 0; index < pos.count; index += 1) {
            const x = pos.getX(index);
            const along = Math.min(1, Math.abs(x) / half);
            pos.setZ(index, pos.getZ(index) + Math.cos(along * Math.PI * 0.5) * 0.04);
          }
          pos.needsUpdate = true;
          mesh.geometry.computeVertexNormals();
        });
        group.add(garment);
      }
      group.add(shadowDisc(0.62));
    } else {
      angle = 0;
      if (range) range.value = "0";
      let height = item.stage === "pie" ? 1.2 : 1.15;
      let width = height * aspect;
      if (width > 1.35) {
        width = 1.35;
        height = width / aspect;
      }
      const hoops = /candonga|argolla|arete/.test(label);
      const donut = /\bdona\b/.test(label);
      const tin = /betun/.test(label);
      const lataFoto = /aceite|gas pimienta|linterna|pipeta|repelente|cantimplora|marmita|tarro/.test(label) || siluetaLata(photo);
      if (hoops || donut) {
        const gold = new THREE.MeshPhysicalMaterial({ color: 0xffd978, metalness: 0.92, roughness: 0.16, clearcoat: 0.7, clearcoatRoughness: 0.08 });
        const count = hoops ? 2 : 1;
        const major = hoops ? 0.42 : 0.48;
        const pipe = major * (hoops ? 0.16 : 0.22);
        for (let index = 0; index < count; index += 1) {
          const side = count === 1 ? 0 : index === 0 ? -1 : 1;
          const ring = new THREE.Mesh(new THREE.TorusGeometry(major, pipe, 36, 96), gold);
          ring.position.set(side * 0.58, 0.58, 0);
          ring.rotation.x = 1.02;
          ring.rotation.y = side * 0.38;
          ring.rotation.z = side * 0.12;
          group.add(ring);
          const hinge = new THREE.Mesh(new THREE.BoxGeometry(pipe * 2.4, pipe * 0.7, pipe * 0.7), gold);
          hinge.position.set(side * 0.58, 0.58 + major + pipe, 0.02);
          group.add(hinge);
        }
      } else if (tin) {
        group.add(lata(photo, width, height));
      } else if (lataFoto) {
        group.add(envase(photo, width, height));
      } else {
        const pieza = barrido(photo, width, height);
        if (pieza) group.add(pieza);
      }
      const reach = Math.min(0.42, Math.max(0.22, width * 0.22));
      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(reach * 0.78, reach, 0.055, 64),
        new THREE.MeshPhysicalMaterial({ color: 0x3a4048, roughness: 0.28, metalness: 0.72, clearcoat: 0.4, clearcoatRoughness: 0.25 })
      );
      plinth.position.y = 0.028;
      group.add(plinth);
      group.add(shadowDisc(reach * 1.05));
    }

    scene.add(group);
    const sphere = new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere());
    group.position.sub(sphere.center);
    camera.position.set(0, 0.02, sphere.radius / Math.tan(THREE.MathUtils.degToRad(15)) * (dressed ? 0.96 : 1.22));
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
      group.rotation.x = 0;
      group.updateMatrixWorld(true);
      renderer.render(scene, camera);
    };
    spin();
  }

  function mostrarVistas(urls) {
    porAncho = true;
    angle = 0;
    if (range) range.value = "0";
    if (note) note.textContent = "Arrastre de lado a lado para dar la vuelta. A la mitad se ve la espalda.";
    const frames = urls.map((src, index) => {
      const image = document.createElement("img");
      image.src = src;
      image.alt = index ? "" : item.name;
      image.draggable = false;
      image.decoding = "sync";
      image.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;visibility:hidden;transition:none;transform-origin:50% 46%;pointer-events:none;";
      stage.append(image);
      return image;
    });
    spin = () => {
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
    };
    spin();
  }

  function buscarVistas() {
    const clave = item.id.toLowerCase().replace(/-/g, "");
    const urls = [];
    let numero = 1;
    const paso = () => {
      if (numero > 8) {
        terminar();
        return;
      }
      const src = `img/vueltas/${clave}-${String(numero).padStart(2, "0")}.jpg?v=4`;
      const image = new Image();
      image.onload = () => {
        urls.push(src);
        numero += 1;
        paso();
      };
      image.onerror = () => terminar();
      image.src = src;
    };
    const terminar = () => {
      if (urls.length > 1) mostrarVistas(urls);
      else cutout(item.image).then((tex) => {
        if (!tex) return;
        import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js").then((THREE) => mount(THREE, tex)).catch(() => {
          stage.innerHTML = `<p class="giro-missing">No se pudo abrir el visor 3D.</p>`;
        });
      });
    };
    paso();
  }

  buscarVistas();

  function paint() {
    const turn = (angle % 360 + 360) % 360;
    if (spin) spin();
    if (range && document.activeElement !== range) range.value = String(Math.round(turn));
  }

  stage.addEventListener("pointerdown", (event) => {
    dragging = true;
    auto = false;
    lastX = event.clientX;
    anchorX = event.clientX;
    anchorA = angle;
    stage.setPointerCapture(event.pointerId);
    if (play) play.textContent = "Girar";
  });
  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    if (porAncho) angle = anchorA + (anchorX - event.clientX) / Math.max(1, stage.clientWidth) * 720;
    else {
      angle += (event.clientX - lastX) * 0.95;
      lastX = event.clientX;
    }
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
  const zoom = host.querySelector("[data-giro-zoom]");
  if (zoom) zoom.addEventListener("click", () => {
    const luz = document.createElement("dialog");
    luz.style.cssText = "border:0;padding:0;background:#f4efe6;max-width:min(920px,94vw);";
    const grande = document.createElement("img");
    grande.src = item.image;
    grande.alt = item.name;
    grande.style.cssText = "display:block;width:100%;height:auto;";
    luz.append(grande);
    luz.addEventListener("click", () => luz.close());
    luz.addEventListener("close", () => luz.remove());
    document.body.append(luz);
    luz.showModal();
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
