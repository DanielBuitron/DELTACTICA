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
    const camera = new THREE.PerspectiveCamera(28, stage.clientWidth / stage.clientHeight, 0.1, 40);
    scene.add(new THREE.AmbientLight(0xfff8ef, 0.62));
    const key = new THREE.DirectionalLight(0xfff4e4, 1.45);
    key.position.set(1.4, 3.4, 3.2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd5dbe8, 0.42);
    fill.position.set(-2.4, 1.6, 1.6);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.28);
    rim.position.set(-0.4, 2.2, -2.6);
    scene.add(rim);

    const label = plain(item.name);
    const lower = /pantalon|falda|short|pantaloneta|bermuda/.test(label);
    const full = /uniforme|overol|conjunto/.test(label);
    const dressed = item.stage === "ropa" || item.stage === "cabeza";
    const wearTop = item.stage === "ropa" && (full || !lower);
    const wearLegs = item.stage === "ropa" && (full || lower);
    const wearHead = item.stage === "cabeza";
    const tone = new THREE.Color((tex.tone?.r || 96) / 255, (tex.tone?.g || 102) / 255, (tex.tone?.b || 90) / 255);
    const skin = new THREE.MeshStandardMaterial({ color: 0xf6f3ee, roughness: 0.48, metalness: 0.02 });
    const cloth = new THREE.MeshStandardMaterial({ color: tone, roughness: 0.78, metalness: 0.02 });
    const under = new THREE.MeshStandardMaterial({ color: 0x2c3036, roughness: 0.72, metalness: 0.08 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: 0.46, metalness: 0.18 });

    const printMap = new THREE.CanvasTexture(tex.cut || tex.front);
    printMap.colorSpace = THREE.SRGBColorSpace;
    printMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const printMaterial = new THREE.MeshStandardMaterial({
      map: printMap,
      transparent: true,
      alphaTest: 0.18,
      roughness: 0.62,
      metalness: 0.02,
      side: THREE.FrontSide,
    });
    const wornMaterials = [];
    function wornMaterial(xSpan, yLow, yHigh) {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          map: { value: printMap },
          tone: { value: tone.clone() },
          garment: { value: new THREE.Matrix4() },
          fit: { value: new THREE.Vector3(xSpan, yLow, yHigh) },
        },
        vertexShader: `
          uniform mat4 garment;
          varying vec3 vP;
          varying vec3 vN;
          void main() {
            vec4 world = modelMatrix * vec4(position, 1.0);
            vP = (garment * world).xyz;
            vN = normalize(mat3(garment) * mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: `
          uniform sampler2D map;
          uniform vec3 tone;
          uniform vec3 fit;
          varying vec3 vP;
          varying vec3 vN;
          void main() {
            float u = vP.x / fit.x + 0.5;
            float v = (vP.y - fit.y) / (fit.z - fit.y);
            vec4 tex = texture2D(map, vec2(u, v));
            float inside = step(0.0, u) * step(u, 1.0) * step(0.0, v) * step(v, 1.0);
            float front = smoothstep(-0.1, 0.4, abs(vN.z));
            float front = smoothstep(-0.1, 0.45, abs(vN.z));
            vec3 color = mix(tone * 0.86, tex.rgb, front * max(tex.a, inside));
            float shade = 0.82 + 0.22 * clamp(dot(normalize(vN), normalize(vec3(0.3, 0.7, 0.6))), 0.0, 1.0);
            gl_FragColor = vec4(color * shade, 1.0);
          }
        `,
      });
      wornMaterials.push(material);
      return material;
    }

    function curved(width, height, bow) {
      const geometry = new THREE.PlaneGeometry(width, height, 36, 16);
      const position = geometry.attributes.position;
      for (let index = 0; index < position.count; index += 1) {
        const x = position.getX(index);
        const y = position.getY(index);
        const across = width ? x / (width * 0.5) : 0;
        const along = height ? y / (height * 0.5) : 0;
        position.setZ(index, Math.cos(across * 1.05) * Math.cos(along * 0.28) * bow);
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      return new THREE.Mesh(geometry, printMaterial);
    }

    function shadow(radius) {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const paint = canvas.getContext("2d");
      const gradient = paint.createRadialGradient(64, 64, 10, 64, 64, 64);
      gradient.addColorStop(0, "rgba(0,0,0,0.5)");
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

    const group = new THREE.Group();
    const aspect = (tex.cut || tex.front).width / (tex.cut || tex.front).height;

    if (dressed) {
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 32, 24), skin);
      head.scale.set(0.92, 1.08, 0.88);
      head.position.y = 1.5;
      group.add(head);
      const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.05, 6, 16), skin);
      neck.position.y = 1.36;
      group.add(neck);
      const profile = [
        [0.08, 0.8],
        [0.12, 0.94],
        [0.145, 1.1],
        [0.15, 1.24],
        [0.11, 1.36],
        [0.07, 1.44],
      ].map((point) => new THREE.Vector2(point[0], point[1]));
      const torsoWear = wornMaterial(0.72, 0.7, 1.5);
      group.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 40), wearTop ? cloth : under));
      [-1, 1].forEach((side) => {
        if (!wearTop) {
          const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.4, 6, 16), under);
          arm.position.set(side * 0.3, 1.0, -0.03);
          arm.rotation.z = side * 0.08;
          group.add(arm);
        }
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.046, 18, 14), skin);
        hand.position.set(side * 0.3, 0.72, 0.08);
        group.add(hand);
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.56, 6, 16), wearLegs ? wornMaterial(0.5, 0.02, 0.9) : under);
        leg.position.set(side * 0.1, 0.4, 0);
        group.add(leg);
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.18), shoeMat);
        shoe.position.set(side * 0.1, 0.045, 0.03);
        group.add(shoe);
      });
      if (wearHead) {
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.125, 28, 18), cloth);
        crown.scale.set(1.08, 0.62, 1.05);
        crown.position.set(0, 1.68, 0.01);
        group.add(crown);
        const cap = curved(Math.min(0.42, 0.34 * aspect), 0.3, 0.07);
        cap.position.set(0, 1.68, 0.12);
        group.add(cap);
      }
      if (wearTop) {
        const height = full ? 1.2 : 1.05;
        const width = Math.min(0.86, height * aspect);
        const garment = curved(width, height, 0.07);
        garment.position.set(0, full ? 0.9 : 1.0, 0.18);
        group.add(garment);
      }
      if (wearLegs && !wearTop) {
        const height = 0.78;
        const width = Math.min(0.62, height * aspect);
        const garment = curved(width, height, 0.07);
        garment.position.set(0, 0.42, 0.16);
        group.add(garment);
      }
      group.add(shadow(0.42));
    } else {
      let height = item.stage === "pie" ? 1.15 : 1.02;
      let width = height * aspect;
      if (width > 1.2) {
        width = 1.2;
        height = width / aspect;
      }
      const piece = curved(width, height, 0.045);
      piece.position.set(0, height / 2 + 0.06, 0);
      group.add(piece);
      const plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.48, 0.045, 40),
        new THREE.MeshStandardMaterial({ color: 0x3c4148, metalness: 0.62, roughness: 0.32 })
      );
      plinth.position.y = 0.022;
      group.add(plinth);
      group.add(shadow(0.5));
    }

    scene.add(group);
    const bounds = new THREE.Box3().setFromObject(group);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    group.position.sub(center);
    const fit = Math.max(size.x, size.y * 1.02);
    const fov = camera.fov * Math.PI / 180;
    camera.position.set(0, size.y * 0.02, (fit / 2) / Math.tan(fov / 2) * 1.55);
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
      group.rotation.x = 0.04;
      group.updateMatrixWorld(true);
      wornMaterials.forEach((material) => material.uniforms.garment.value.copy(group.matrixWorld).invert());
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
