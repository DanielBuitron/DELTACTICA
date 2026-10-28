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
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
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
    const rim = new THREE.DirectionalLight(0xfff2e4, 1);
    rim.position.set(-1.6, 3.2, -4.6);
    scene.add(rim);

    const label = plain(item.name);
    const lower = /pantalon|falda|short|pantaloneta|bermuda/.test(label);
    const full = /uniforme|overol|conjunto/.test(label);
    const wearTop = item.stage === "ropa" && (full || !lower);
    const wearLegs = item.stage === "ropa" && (full || lower);
    const wearHead = item.stage === "cabeza";
    const dressed = wearTop || wearLegs || wearHead;
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

    const worn = [];
    function dress(mesh, span) {
      const material = cloth.clone();
      material.customProgramCacheKey = () => "prenda-foto";
      material.onBeforeCompile = (shader) => {
        shader.uniforms.garmentMap = { value: map };
        shader.uniforms.meshMatrix = { value: mesh.matrix.clone() };
        shader.uniforms.span = { value: span };
        material.userData.shader = shader;
        shader.vertexShader = `uniform mat4 meshMatrix;\nvarying vec3 vWearP;\nvarying vec3 vWearN;\n${shader.vertexShader}`;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          vWearP = (meshMatrix * vec4(position, 1.0)).xyz;
          vWearN = normalize(mat3(meshMatrix) * normal);`
        );
        shader.fragmentShader = `uniform sampler2D garmentMap;\nuniform vec4 span;\nvarying vec3 vWearP;\nvarying vec3 vWearN;\n${shader.fragmentShader}`;
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          {
            float gu = (vWearP.x - span.x) / (span.y - span.x);
            float gv = (vWearP.y - span.z) / (span.w - span.z);
            vec4 gtex = texture2D(garmentMap, vec2(gu, gv));
            float gfront = smoothstep(0.02, 0.62, vWearN.z);
            float gok = gfront * step(0.0, gu) * step(gu, 1.0) * step(0.0, gv) * step(gv, 1.0) * smoothstep(0.18, 0.62, gtex.a);
            diffuseColor.rgb = mix(diffuseColor.rgb, gtex.rgb, gok);
          }`
        );
      };
      mesh.material = material;
      worn.push(mesh);
      return mesh;
    }

    function body(parent) {
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 40, 28), skin);
      head.scale.set(0.9, 1.08, 0.88);
      head.position.set(0, 1.7, 0.02);
      parent.add(head);
      const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.05, 6, 16), skin);
      neck.position.set(0, 1.54, 0.01);
      parent.add(neck);
      if (!wearTop) {
        const profile = [
          [0.15, 0.78],
          [0.19, 0.98],
          [0.2, 1.18],
          [0.16, 1.36],
          [0.07, 1.48],
        ].map((point) => new THREE.Vector2(point[0], point[1]));
        parent.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 40), under));
        [-1, 1].forEach((side) => {
          const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.42, 6, 16), under);
          arm.position.set(side * 0.26, 1.08, 0);
          arm.rotation.z = side * 0.16;
          parent.add(arm);
          const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), skin);
          hand.position.set(side * 0.32, 0.82, 0.03);
          parent.add(hand);
        });
      }
      [-1, 1].forEach((side) => {
        const legMat = wearLegs && !wearTop ? cloth.clone() : (wearLegs ? cloth : under);
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.5, 8, 18), legMat);
        leg.scale.set(1.35, 1, 0.78);
        leg.position.set(side * 0.11, 0.4, 0);
        parent.add(leg);
        if (wearLegs && !wearTop) dress(leg, new THREE.Vector4(-0.38, 0.38, 0.08, 0.78));
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.065, 0.22), shoeMat);
        shoe.position.set(side * 0.11, 0.045, 0.03);
        parent.add(shoe);
      });
      if (wearHead) {
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.145, 36, 22, 0, Math.PI * 2, 0, Math.PI * 0.58), cloth);
        crown.scale.set(1.2, 0.7, 1.08);
        crown.position.set(0, 1.76, 0.02);
        parent.add(crown);
        dress(crown, new THREE.Vector4(-0.22, 0.22, 1.58, 1.9));
      }
    }

    function roundedRect(width, height, radius) {
      const shape = new THREE.Shape();
      const x = -width / 2;
      const y = -height / 2;
      const r = Math.min(radius, width / 2 - 0.001, height / 2 - 0.001);
      shape.moveTo(x + r, y);
      shape.lineTo(x + width - r, y);
      shape.absarc(x + width - r, y + r, r, -Math.PI / 2, 0, false);
      shape.lineTo(x + width, y + height - r);
      shape.absarc(x + width - r, y + height - r, r, 0, Math.PI / 2, false);
      shape.lineTo(x + r, y + height);
      shape.absarc(x + r, y + height - r, r, Math.PI / 2, Math.PI, false);
      shape.lineTo(x, y + r);
      shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
      return shape;
    }

    function showpiece(width, height, depth) {
      const faceW = width * 0.96;
      const faceH = height * 0.96;
      const geometry = new THREE.ExtrudeGeometry(roundedRect(faceW, faceH, Math.min(faceW, faceH) * 0.08), {
        depth,
        bevelEnabled: true,
        bevelThickness: depth * 0.16,
        bevelSize: Math.min(faceW, faceH) * 0.025,
        bevelSegments: 3,
        curveSegments: 10,
      });
      geometry.translate(0, 0, -depth / 2);
      geometry.computeVertexNormals();
      const face = new THREE.MeshPhysicalMaterial({
        map,
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0.05,
        clearcoat: 0.28,
        clearcoatRoughness: 0.32,
      });
      face.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
          "#include <uv_vertex>",
          `vMapUv = vec2(position.x / ${faceW.toFixed(4)} + 0.5, position.y / ${faceH.toFixed(4)} + 0.5);`
        );
      };
      face.customProgramCacheKey = () => `pieza-${faceW.toFixed(2)}-${faceH.toFixed(2)}`;
      const edge = new THREE.MeshPhysicalMaterial({
        color: tone,
        roughness: 0.38,
        metalness: 0.16,
        clearcoat: 0.45,
        clearcoatRoughness: 0.22,
      });
      const mesh = new THREE.Mesh(geometry, [face, edge]);
      mesh.position.y = height / 2 + 0.08;
      return mesh;
    }

    const group = new THREE.Group();
    const aspect = photo.width / Math.max(1, photo.height);

    function garment(width, height) {
      const geometry = new THREE.PlaneGeometry(width, height, 48, 20);
      const position = geometry.attributes.position;
      const radius = Math.max(0.34, width * 0.46);
      for (let index = 0; index < position.count; index += 1) {
        const x = position.getX(index);
        const y = position.getY(index);
        const across = width ? x / (width * 0.5) : 0;
        const theta = across * 0.95;
        const lift = Math.cos((y / Math.max(height, 0.01)) * 0.35);
        position.setX(index, Math.sin(theta) * radius);
        position.setZ(index, Math.cos(theta) * radius * lift);
      }
      geometry.translate(0, 0, -radius + 0.12);
      geometry.computeVertexNormals();
      return new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({
        map,
        color: 0xffffff,
        roughness: 0.48,
        metalness: 0.02,
        clearcoat: 0.18,
        clearcoatRoughness: 0.35,
        alphaTest: 0.25,
        side: THREE.DoubleSide,
      }));
    }

    if (dressed) {
      body(group);
      if (wearTop) {
        const height = full ? 1.18 : 1.05;
        const width = Math.min(1.05, height * aspect);
        const shirt = garment(width, height);
        shirt.position.set(0, full ? 1.0 : 1.12, 0);
        group.add(shirt);
      }
      group.add(shadowDisc(0.48));
    } else {
      let height = item.stage === "pie" ? 1.15 : 1.02;
      let width = height * aspect;
      if (width > 1.28) {
        width = 1.28;
        height = width / aspect;
      }
      const depth = item.stage === "pie" ? Math.min(0.42, height * 0.34) : Math.max(0.18, Math.min(width, height) * 0.26);
      group.add(showpiece(width, height, depth));
      const reach = Math.min(0.72, Math.max(0.36, width * 0.42));
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
    camera.position.set(0, 0.02, sphere.radius / Math.tan(THREE.MathUtils.degToRad(15)) * 1.28);
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
      group.rotation.x = dressed ? 0.03 : 0.08;
      group.updateMatrixWorld(true);
      worn.forEach((mesh) => {
        const shader = mesh.material.userData.shader;
        if (shader) shader.uniforms.meshMatrix.value.copy(mesh.matrix);
      });
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
