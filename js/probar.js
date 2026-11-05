import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const grid = document.querySelector("[data-fit-grid]");
const tabs = document.querySelector("[data-fit-tabs]");
const stage = document.querySelector("[data-fit-stage]");
const nameEl = document.querySelector("[data-fit-name]");
const note = document.querySelector("[data-fit-note]");
const picksEl = document.querySelector("[data-fit-picks]");
const add = document.querySelector("[data-fit-add]");
if (!grid || !tabs || !stage || !window.DT_CATALOG) {
  if (stage) stage.textContent = "El catálogo no cargó.";
} else {
  const root = /\/fichas\//.test(location.pathname) ? "../" : "";
  const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const plain = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
  const puesto = { camisa: null, chaqueta: null, chaleco: null, inferior: null, completo: null, cinturon: null, calzado: null, guantes: null, gafas: null, gorra: null };
  const orden = ["camisa", "inferior", "completo", "cinturon", "chaleco", "chaqueta", "calzado", "guantes", "gafas", "gorra"];
  let tab = "camisas";
  let sexo = "m";
  let generacion = 0;
  const colores = new Map();
  const cargador = new GLTFLoader();

  function esPrenda(item) {
    return !!(window.DT_VISTAS && window.DT_VISTAS[item.id]);
  }

  function seViste(nombre) {
    if (/porta|linterna|cordon|\bmedias?\b|velcro/.test(nombre)) return false;
    if (/\bchapa\b/.test(nombre) && !/correa|corra|cinturon/.test(nombre)) return false;
    return true;
  }

  function categoria(item) {
    const nombre = plain(item.name);
    if (esPrenda(item)) {
      if (/uniforme|overol/.test(nombre)) return "uniformes";
      if (/chaqueta/.test(nombre)) return "chaquetas";
      if (/chaleco/.test(nombre)) return "chalecos";
      if (/\bpantalon|\bfalda|\blicra\b/.test(nombre)) return "pantalones";
      return "camisas";
    }
    if (!seViste(nombre)) return "";
    if (/\b(gorra|boina|pasamontan|cachucha|casco|kepis|pava)\b/.test(nombre)) return "gorras";
    if (/\b(botas?|zapatos?|zapatoz)\b/.test(nombre)) return "botas";
    if (/\b(reata|correas?|corras?|cinturon)\b/.test(nombre)) return "reatas";
    if (/\b(guantes?|gafas?|gasfas?)\b/.test(nombre)) return "guantes";
    return "";
  }

  function pieza(item) {
    const grupo = categoria(item);
    if (grupo === "camisas") return "camisa";
    if (grupo === "chaquetas") return "chaqueta";
    if (grupo === "chalecos") return "chaleco";
    if (grupo === "pantalones") return "inferior";
    if (grupo === "uniformes") return "completo";
    if (grupo === "gorras") return "gorra";
    if (grupo === "botas") return "calzado";
    if (grupo === "reatas") return "cinturon";
    if (grupo === "guantes") return /gafa|gasfa/.test(plain(item.name)) ? "gafas" : "guantes";
    return "";
  }

  function foto(item) {
    return typeof window.productImage === "function" ? window.productImage(item) : (item.image || "");
  }

  function sexoDe(item) {
    const nombre = plain(item.name);
    if (/femenin|\bmujer\b|\bdama\b/.test(nombre)) return "f";
    if (/masculin|\bhombre\b|caballer/.test(nombre)) return "m";
    return "";
  }

  function coincide(item) {
    const marca = sexoDe(item);
    return !marca || marca === sexo;
  }

  function corte(item) {
    const nombre = plain(item.name);
    if (/\bfalda\b/.test(nombre)) return "falda";
    if (/\blicra\b|pantaloneta|bermuda|\bshort\b/.test(nombre)) return "corto";
    if (/\bbotas?\b/.test(nombre)) return "bota";
    if (/manga corta/.test(nombre)) return "manga-corta";
    if (/buzo|camiseta/.test(nombre)) return "fuera";
    return "largo";
  }

  function admiteCinturon(item) {
    if (!item) return false;
    const nombre = plain(item.name);
    if (/\bfalda\b|\blicra\b|pantaloneta|bermuda|\bshort\b/.test(nombre)) return false;
    return true;
  }

  function listaPuesta() {
    return orden.map((clave) => puesto[clave]).filter(Boolean);
  }

  function estaPuesto(id) {
    return listaPuesta().some((item) => item.id === id);
  }

  function medidasDe(modo) {
    const mujer = modo === "f";
    return {
      mujer,
      alto: mujer ? 0.94 : 1,
      torsoX: mujer ? 1.06 : 1.26,
      torsoZ: mujer ? 0.76 : 0.78,
      hombro: mujer ? 0.19 : 0.235,
      cadera: mujer ? 0.105 : 0.09,
      pechoY: 1.3,
      cinturaY: 1.02,
      caderaY: 0.86,
      cuelloY: 1.5,
      cabezaY: mujer ? 1.58 : 1.62,
      cabezaR: mujer ? 0.1 : 0.11,
      brazo: mujer ? 0.038 : 0.044,
      pierna: mujer ? 0.05 : 0.056
    };
  }

  function perfil(med) {
    return med.mujer
      ? [[0.76, 0.1], [0.88, 0.166], [1.01, 0.134], [1.16, 0.15], [1.28, 0.16], [1.38, 0.176], [1.46, 0.07]]
      : [[0.78, 0.092], [0.9, 0.155], [1.02, 0.128], [1.16, 0.158], [1.3, 0.176], [1.4, 0.19], [1.48, 0.074]];
  }

  function radioEn(med, y) {
    const puntos = perfil(med);
    if (y <= puntos[0][0]) return puntos[0][1];
    const ultimo = puntos[puntos.length - 1];
    if (y >= ultimo[0]) return ultimo[1];
    for (let i = 0; i < puntos.length - 1; i += 1) {
      const a = puntos[i];
      const b = puntos[i + 1];
      if (y >= a[0] && y <= b[0]) {
        const t = (y - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return ultimo[1];
  }

  const escena = new THREE.Scene();
  escena.background = new THREE.Color("#f4efe6");
  const camara = new THREE.PerspectiveCamera(32, 1, 0.08, 24);
  camara.position.set(0, 0.98, 3.85);
  const renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderizador.outputColorSpace = THREE.SRGBColorSpace;
  renderizador.shadowMap.enabled = true;
  renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
  renderizador.toneMapping = THREE.ACESFilmicToneMapping;
  renderizador.toneMappingExposure = 1.05;
  stage.replaceChildren(renderizador.domElement);

  const controles = new OrbitControls(camara, renderizador.domElement);
  controles.target.set(0, 0.9, 0);
  controles.enablePan = false;
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.minDistance = 1.6;
  controles.maxDistance = 6;
  controles.minPolarAngle = 0.55;
  controles.maxPolarAngle = 1.55;
  controles.update();

  escena.add(new THREE.HemisphereLight("#fff8ee", "#c8bba8", 1.15));
  const clave = new THREE.DirectionalLight("#fffdf8", 2.1);
  clave.position.set(1.4, 3.2, 2.2);
  clave.castShadow = true;
  clave.shadow.mapSize.set(1024, 1024);
  clave.shadow.camera.near = 0.4;
  clave.shadow.camera.far = 8;
  clave.shadow.camera.left = -1.4;
  clave.shadow.camera.right = 1.4;
  clave.shadow.camera.top = 1.8;
  clave.shadow.camera.bottom = -0.2;
  escena.add(clave);
  const relleno = new THREE.DirectionalLight("#d9e2f2", 0.55);
  relleno.position.set(-2.2, 1.6, -1.2);
  escena.add(relleno);

  const suelo = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 48),
    new THREE.MeshStandardMaterial({ color: "#e7dfd3", roughness: 1, metalness: 0 })
  );
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.y = 0.001;
  suelo.receiveShadow = true;
  escena.add(suelo);

  const figura = new THREE.Group();
  const cuerpo = new THREE.Group();
  const ropa = new THREE.Group();
  figura.add(cuerpo, ropa);
  escena.add(figura);
  const piel = new THREE.MeshStandardMaterial({ color: "#efe8de", roughness: 0.58, metalness: 0.03 });
  let medidas = medidasDe("m");

  function tubo(desde, hasta, radioDesde, radioHasta, material) {
    const dir = new THREE.Vector3().subVectors(hasta, desde);
    const largo = Math.max(0.02, dir.length());
    const malla = new THREE.Mesh(new THREE.CylinderGeometry(radioHasta, radioDesde, largo, 22), material);
    malla.position.copy(desde).add(hasta).multiplyScalar(0.5);
    malla.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    malla.castShadow = true;
    return malla;
  }

  function cadena(puntos, radios, material) {
    const grupo = new THREE.Group();
    for (let i = 0; i < puntos.length - 1; i += 1) grupo.add(tubo(puntos[i], puntos[i + 1], radios[i], radios[i + 1], material));
    puntos.forEach((punto, indice) => {
      if (indice === 0) return;
      const junta = new THREE.Mesh(new THREE.SphereGeometry(radios[indice] * 0.96, 16, 12), material);
      junta.position.copy(punto);
      junta.castShadow = true;
      grupo.add(junta);
    });
    return grupo;
  }

  function casco(med, y0, y1, holgura, material) {
    const puntos = [];
    const pasos = 14;
    for (let i = 0; i <= pasos; i += 1) {
      const y = y0 + ((y1 - y0) * i) / pasos;
      puntos.push(new THREE.Vector2(radioEn(med, y) + holgura, y));
    }
    const malla = new THREE.Mesh(new THREE.LatheGeometry(puntos, 32), material);
    malla.scale.set(med.torsoX, 1, med.torsoZ);
    malla.castShadow = true;
    return malla;
  }

  function construirCuerpo() {
    desechar(cuerpo);
    cuerpo.clear();
    medidas = medidasDe(sexo);
    figura.scale.set(1, medidas.alto, 1);
    const med = medidas;
    cuerpo.add(casco(med, perfil(med)[0][0], perfil(med)[perfil(med).length - 1][0], 0, piel));
    const cuello = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.1, 16), piel);
    cuello.position.y = med.cuelloY;
    cuello.castShadow = true;
    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(med.cabezaR, 28, 20), piel);
    cabeza.scale.set(0.86, 1.04, 0.9);
    cabeza.position.y = med.cabezaY;
    cabeza.castShadow = true;
    [-1, 1].forEach((lado) => {
      const oreja = new THREE.Mesh(new THREE.SphereGeometry(med.cabezaR * 0.16, 12, 10), piel);
      oreja.scale.set(0.6, 1, 0.8);
      oreja.position.set(lado * med.cabezaR * 0.9, med.cabezaY - 0.01, 0);
      cuerpo.add(oreja);
    });
    if (med.mujer) {
      const busto = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), piel);
      busto.position.set(0, 1.26, 0.1);
      busto.scale.set(1.3, 0.8, 0.7);
      cuerpo.add(busto);
    }
    const hombroY = 1.4;
    const codo = new THREE.Vector3(med.hombro + 0.02, 1.08, 0.03);
    const muneca = new THREE.Vector3(med.hombro - 0.01, 0.8, 0.05);
    const caderaY = 0.84;
    const rodilla = new THREE.Vector3(med.cadera, 0.48, 0.02);
    const tobillo = new THREE.Vector3(med.cadera * 0.92, 0.08, 0.02);
    [-1, 1].forEach((lado) => {
      const signo = lado;
      const hombro = new THREE.Vector3(signo * med.hombro, hombroY, 0);
      const brazo = cadena([
        hombro,
        new THREE.Vector3(signo * codo.x, codo.y, codo.z),
        new THREE.Vector3(signo * muneca.x, muneca.y, muneca.z)
      ], [med.brazo * 1.35, med.brazo, med.brazo * 0.72], piel);
      brazo.name = signo < 0 ? "brazoI" : "brazoD";
      cuerpo.add(brazo);
      const mano = new THREE.Mesh(new THREE.CapsuleGeometry(med.brazo * 0.55, 0.07, 4, 8), piel);
      mano.position.set(signo * muneca.x, muneca.y - 0.06, muneca.z + 0.01);
      mano.name = signo < 0 ? "manoI" : "manoD";
      mano.castShadow = true;
      cuerpo.add(mano);
      const pierna = cadena([
        new THREE.Vector3(signo * med.cadera, caderaY, 0),
        new THREE.Vector3(signo * rodilla.x, rodilla.y, rodilla.z),
        new THREE.Vector3(signo * tobillo.x, tobillo.y, tobillo.z)
      ], [med.pierna * 1.35, med.pierna, med.pierna * 0.72], piel);
      pierna.name = signo < 0 ? "piernaI" : "piernaD";
      cuerpo.add(pierna);
      const pie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.22), piel);
      pie.position.set(signo * tobillo.x, 0.03, 0.06);
      pie.name = signo < 0 ? "pieI" : "pieD";
      pie.castShadow = true;
      cuerpo.add(pie);
    });
    cuerpo.add(cuello, cabeza);
  }

  function desechar(objeto) {
    const materiales = new Set();
    objeto.traverse((nodo) => {
      if (nodo.geometry) nodo.geometry.dispose();
      if (nodo.material && nodo.material !== piel) materiales.add(nodo.material);
    });
    materiales.forEach((material) => material.dispose());
  }

  function tela(color) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.82,
      metalness: 0.02,
      side: THREE.FrontSide
    });
  }

  const cacheTelas = new Map();

  function texturaDe(imagen, x, y, w, h) {
    const lienzo = document.createElement("canvas");
    const ancho = Math.max(1, Math.round(w));
    const alto = Math.max(1, Math.round(h));
    lienzo.width = ancho;
    lienzo.height = alto;
    lienzo.getContext("2d").drawImage(imagen, x, y, ancho, alto, 0, 0, ancho, alto);
    const tex = new THREE.CanvasTexture(lienzo);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return { tex, aspect: ancho / alto };
  }

  function recortar(url) {
    if (!url) return Promise.resolve(null);
    if (cacheTelas.has(url)) return cacheTelas.get(url);
    const promesa = new Promise((resolve) => {
      const imagen = new Image();
      imagen.onload = () => {
        const w = imagen.naturalWidth;
        const h = imagen.naturalHeight;
        if (!w || !h) {
          resolve(null);
          return;
        }
        const base = document.createElement("canvas");
        base.width = w;
        base.height = h;
        const ctx = base.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(imagen, 0, 0);
        let data = null;
        try {
          data = ctx.getImageData(0, 0, w, h).data;
        } catch (error) {
          resolve(texturaDe(imagen, 0, 0, w, h));
          return;
        }
        const step = Math.max(1, Math.round(Math.min(w, h) / 200));
        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        let n = 0;
        for (let py = 0; py < h; py += step) {
          for (let px = 0; px < w; px += step) {
            const i = (py * w + px) * 4;
            if (data[i + 3] < 28) continue;
            const mx = Math.max(data[i], data[i + 1], data[i + 2]);
            const mn = Math.min(data[i], data[i + 1], data[i + 2]);
            if (mx > 244 && mx - mn < 16) continue;
            n += 1;
            if (px < minX) minX = px;
            if (py < minY) minY = py;
            if (px > maxX) maxX = px;
            if (py > maxY) maxY = py;
          }
        }
        if (n < 12) resolve(texturaDe(imagen, 0, 0, w, h));
        else resolve(texturaDe(imagen, minX, minY, Math.max(1, maxX - minX), Math.max(1, maxY - minY)));
      };
      imagen.onerror = () => resolve(null);
      imagen.src = url;
    });
    cacheTelas.set(url, promesa);
    return promesa;
  }

  function lamina(entrada, ancho, alto, y, z, rotY) {
    const mat = new THREE.MeshStandardMaterial({
      map: entrada.tex,
      transparent: true,
      alphaTest: 0.16,
      roughness: 0.58,
      metalness: 0.02,
      side: THREE.FrontSide
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), mat);
    mesh.position.set(0, y, z);
    mesh.rotation.y = rotY || 0;
    return mesh;
  }

  function cajaVisual(aspect, anchoMax, altoMax) {
    let ancho = anchoMax;
    let alto = ancho / Math.max(0.08, aspect);
    if (alto > altoMax) {
      alto = altoMax;
      ancho = alto * aspect;
    }
    return { ancho, alto };
  }

  function ponerCara(grupo, entrada, anchoMax, altoMax, tope, z) {
    if (!entrada) return null;
    const caja = cajaVisual(entrada.aspect, anchoMax, altoMax);
    grupo.add(lamina(entrada, caja.ancho, caja.alto, tope - caja.alto / 2, z, 0));
    return caja;
  }

  async function telasDe(item) {
    const clave = item.id.toLowerCase().replace(/-/g, "");
    if (esPrenda(item)) {
      const frente = await recortar(`${root}img/puesto/${clave}-01.webp?v=13`);
      const espalda = await recortar(`${root}img/puesto/${clave}-03.webp?v=13`);
      return { frente: frente || await recortar(foto(item)), espalda };
    }
    return { frente: await recortar(foto(item)), espalda: null };
  }

  function colorDe(item) {
    if (colores.has(item.id)) return Promise.resolve(colores.get(item.id));
    const clave = item.id.toLowerCase().replace(/-/g, "");
    const fuentes = [];
    if (esPrenda(item)) fuentes.push(`${root}img/puesto/${clave}-01.webp?v=13`);
    fuentes.push(foto(item));
    const probar = (indice) => new Promise((resolve) => {
      const imagen = new Image();
      imagen.onload = () => {
        const lienzo = document.createElement("canvas");
        lienzo.width = 40;
        lienzo.height = 40;
        const ctx = lienzo.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(imagen, 0, 0, 40, 40);
        const data = ctx.getImageData(0, 0, 40, 40).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 50) continue;
          const mx = Math.max(data[i], data[i + 1], data[i + 2]);
          const mn = Math.min(data[i], data[i + 1], data[i + 2]);
          if (mx > 236 && mx - mn < 18) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n += 1;
        }
        const color = n ? new THREE.Color(r / n / 255, g / n / 255, b / n / 255) : new THREE.Color("#3e4634");
        colores.set(item.id, color);
        resolve(color);
      };
      imagen.onerror = () => {
        if (indice + 1 < fuentes.length) resolve(probar(indice + 1));
        else resolve(new THREE.Color("#3e4634"));
      };
      imagen.src = fuentes[indice];
    });
    return probar(0);
  }

  function brazosDe(med, radio, material, corta) {
    const grupo = new THREE.Group();
    const hombroY = 1.39;
    const codoY = 1.08;
    const munecaY = corta ? 1.08 : 0.8;
    [-1, 1].forEach((lado) => {
      const hombro = new THREE.Vector3(lado * (med.hombro + 0.01), hombroY, 0);
      const codo = new THREE.Vector3(lado * (med.hombro + 0.025), codoY, 0.03);
      const extremo = corta ? codo : new THREE.Vector3(lado * (med.hombro - 0.005), munecaY, 0.05);
      const puntos = corta ? [hombro, extremo] : [hombro, codo, extremo];
      const radios = corta ? [radio * 1.2, radio * 0.9] : [radio * 1.25, radio, radio * 0.75];
      grupo.add(cadena(puntos, radios, material));
    });
    return grupo;
  }

  function piernasDe(med, radio, yFin, material) {
    const grupo = new THREE.Group();
    [-1, 1].forEach((lado) => {
      grupo.add(cadena([
        new THREE.Vector3(lado * med.cadera, 0.84, 0),
        new THREE.Vector3(lado * med.cadera, 0.48, 0.02),
        new THREE.Vector3(lado * med.cadera * 0.92, yFin, 0.02)
      ], [radio * 1.2, radio, radio * 0.78], material));
    });
    return grupo;
  }

  function aplicarEstilo(grupo, item, telas, slot, tipo) {
    if (!telas || !telas.frente) return;
    const med = medidas;
    const frente = telas.frente;
    const espalda = telas.espalda;
    const ponerEspalda = (cara, tope, z) => {
      if (espalda && cara) grupo.add(lamina(espalda, cara.ancho, cara.alto, tope - cara.alto / 2, z, Math.PI));
    };
    if (slot === "camisa" || slot === "chaqueta" || slot === "chaleco") {
      const tope = med.cuelloY + 0.04;
      const cara = ponerCara(grupo, frente, slot === "chaleco" ? 0.46 : 0.72, slot === "chaqueta" ? 0.82 : 0.66, tope, slot === "chaqueta" ? 0.26 : 0.22);
      ponerEspalda(cara, tope, -0.2);
    } else if (slot === "completo") {
      const tope = med.cuelloY + 0.04;
      const cara = ponerCara(grupo, frente, 0.66, 1.4, tope, 0.22);
      ponerEspalda(cara, tope, -0.2);
    } else if (slot === "inferior") {
      const tope = med.cinturaY + 0.1;
      const alto = tipo === "corto" || tipo === "falda" ? 0.52 : 1.02;
      const caja = cajaVisual(frente.aspect, 0.62, alto);
      const cara = { ancho: Math.min(0.62, Math.max(caja.ancho, alto * frente.aspect * 0.85)), alto };
      if (cara.ancho / frente.aspect < alto) cara.alto = cara.ancho / frente.aspect;
      grupo.add(lamina(frente, cara.ancho, cara.alto, tope - cara.alto / 2, 0.2, 0));
      ponerEspalda(cara, tope, -0.18);
    } else if (slot === "gorra") {
      ponerCara(grupo, frente, med.cabezaR * 2.7, med.cabezaR * 2.1, med.cabezaY + med.cabezaR * 2.2, med.cabezaR * 1.25);
    } else if (slot === "gafas") {
      ponerCara(grupo, frente, 0.22, 0.09, med.cabezaY + 0.06, med.cabezaR * 1.25);
    } else if (slot === "cinturon") {
      ponerCara(grupo, frente, 0.5, 0.18, med.cinturaY + 0.12, 0.24);
    } else if (slot === "calzado") {
      ponerCara(grupo, frente, 0.46, 0.22, 0.22, 0.18);
    } else if (slot === "guantes") {
      ponerCara(grupo, frente, 0.32, 0.2, 0.9, 0.14);
    }
  }

  function agregarPrenda(item, color, telas) {
    const med = medidas;
    const material = tela(color);
    const grupo = new THREE.Group();
    grupo.name = item.id;
    const tipo = corte(item);
    const slot = pieza(item);
    const conFoto = !!(telas && telas.frente);
    const conPantalon = puesto.inferior && corte(puesto.inferior) === "largo";
    if (conFoto) {
      aplicarEstilo(grupo, item, telas, slot, tipo);
      if (slot === "calzado" || slot === "guantes" || slot === "camisa" || slot === "chaqueta" || slot === "completo" || slot === "inferior") {
        const mangaLarga = tipo !== "manga-corta" && (slot === "camisa" || slot === "chaqueta" || slot === "completo");
        const piernaLarga = slot === "completo" || (slot === "inferior" && tipo !== "corto" && tipo !== "falda");
        cuerpo.traverse((nodo) => {
          const nombre = nodo.name || "";
          if (slot === "calzado" && /^pie/.test(nombre)) nodo.visible = false;
          if (slot === "guantes" && /^mano/.test(nombre)) nodo.visible = false;
          if (mangaLarga && (/^brazo/.test(nombre) || /^mano/.test(nombre))) nodo.visible = false;
          if (piernaLarga && (/^pierna/.test(nombre) || /^pie/.test(nombre))) nodo.visible = false;
        });
      }
      ropa.add(grupo);
      return;
    }
    if (slot === "camisa") {
      const porDentro = tipo !== "fuera" && (conPantalon || puesto.completo);
      const bajo = porDentro ? 0.8 : med.caderaY - 0.02;
      grupo.add(casco(med, bajo, med.cuelloY - 0.02, 0.02, material));
      if (!conFoto) grupo.add(brazosDe(med, med.brazo + 0.016, material, tipo === "manga-corta"));
    } else if (slot === "chaleco") {
      grupo.add(casco(med, med.cinturaY - 0.02, 1.42, 0.034, material));
    } else if (slot === "chaqueta") {
      grupo.add(casco(med, med.caderaY - 0.08, med.cuelloY - 0.01, 0.046, material));
      if (!conFoto) grupo.add(brazosDe(med, med.brazo + 0.03, material, false));
    } else if (slot === "completo") {
      grupo.add(casco(med, med.cinturaY, med.cuelloY - 0.02, 0.02, material));
      if (!conFoto) grupo.add(brazosDe(med, med.brazo + 0.016, material, false));
      grupo.add(casco(med, 0.78, med.cinturaY + 0.04, 0.03, material));
      grupo.add(piernasDe(med, med.pierna + 0.02, 0.08, material));
    } else if (slot === "inferior" && tipo === "falda") {
      grupo.add(casco(med, 0.5, med.cinturaY + 0.03, 0.03, material));
    } else if (slot === "inferior") {
      const yFin = tipo === "corto" ? 0.5 : 0.07;
      grupo.add(casco(med, tipo === "corto" ? 0.62 : 0.84, med.cinturaY + 0.03, 0.028, material));
      grupo.add(piernasDe(med, med.pierna + (tipo === "corto" ? 0.012 : 0.02), yFin, material));
    } else if (slot === "cinturon") {
      const base = puesto.inferior || puesto.completo;
      if (base && admiteCinturon(base)) {
        const aro = new THREE.Mesh(new THREE.TorusGeometry(0.178, 0.012, 10, 40), material);
        aro.rotation.x = Math.PI / 2;
        aro.position.y = med.cinturaY + 0.02;
        aro.scale.set(med.torsoX, med.torsoZ, 1);
        aro.castShadow = true;
        const hebilla = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.018), material);
        hebilla.position.set(0, med.cinturaY + 0.02, 0.178 * med.torsoZ + 0.01);
        hebilla.castShadow = true;
        grupo.add(aro, hebilla);
      }
    } else if (slot === "calzado") {
      const alta = tipo === "bota";
      [-1, 1].forEach((lado) => {
        const suela = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.045, 0.25), material);
        suela.position.set(lado * med.cadera * 0.92, 0.028, 0.06);
        suela.castShadow = true;
        const cana = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.058, alta ? 0.3 : 0.09, 16), material);
        cana.position.set(lado * med.cadera * 0.92, alta ? 0.17 : 0.08, 0.03);
        cana.castShadow = true;
        grupo.add(suela, cana);
      });
      cuerpo.traverse((nodo) => {
        if (nodo.name === "pieI" || nodo.name === "pieD") nodo.visible = false;
      });
    } else if (slot === "guantes") {
      [-1, 1].forEach((lado) => {
        const guante = new THREE.Mesh(new THREE.SphereGeometry(med.brazo * 1.35, 14, 10), material);
        guante.scale.set(0.85, 1.25, 0.6);
        guante.position.set(lado * (med.hombro - 0.01), 0.74, 0.06);
        guante.castShadow = true;
        grupo.add(guante);
      });
      cuerpo.traverse((nodo) => {
        if (nodo.name === "manoI" || nodo.name === "manoD") nodo.visible = false;
      });
    } else if (slot === "gafas") {
      [-0.046, 0.046].forEach((x) => {
        const lente = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.004, 8, 20), material);
        lente.position.set(x, med.cabezaY + 0.01, med.cabezaR * 0.92);
        grupo.add(lente);
      });
      const puente = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.004, 0.004), material);
      puente.position.set(0, med.cabezaY + 0.01, med.cabezaR * 0.92);
      grupo.add(puente);
    } else if (slot === "gorra") {
      const copa = new THREE.Mesh(new THREE.SphereGeometry(med.cabezaR * 1.05, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), material);
      copa.position.y = med.cabezaY + med.cabezaR * 0.42;
      copa.castShadow = true;
      const visera = new THREE.Mesh(new THREE.BoxGeometry(med.cabezaR * 1.35, 0.012, med.cabezaR * 0.95), material);
      visera.position.set(0, med.cabezaY + med.cabezaR * 0.08, med.cabezaR * 0.85);
      visera.castShadow = true;
      grupo.add(copa, visera);
    }
    aplicarEstilo(grupo, item, telas, slot, tipo);
    ropa.add(grupo);
  }

  function anclaDe(nombre, med) {
    const mapa = {
      cabeza: new THREE.Vector3(0, med.cabezaY, 0),
      cuello: new THREE.Vector3(0, med.cuelloY, 0),
      pecho: new THREE.Vector3(0, med.pechoY, 0),
      cintura: new THREE.Vector3(0, med.cinturaY, 0),
      cadera: new THREE.Vector3(0, med.caderaY, 0),
      manoI: new THREE.Vector3(-med.hombro, 0.74, 0.05),
      manoD: new THREE.Vector3(med.hombro, 0.74, 0.05),
      pieI: new THREE.Vector3(-med.cadera, 0.04, 0.05),
      pieD: new THREE.Vector3(med.cadera, 0.04, 0.05)
    };
    return mapa[nombre] || mapa.pecho;
  }

  async function agregarModelo(item, ficha, gen) {
    const gltf = await cargador.loadAsync(ficha.archivo);
    if (gen !== generacion) return;
    const modelo = gltf.scene;
    modelo.name = item.id;
    const escala = Number(ficha.escala) || 1;
    modelo.scale.setScalar(escala);
    modelo.position.copy(anclaDe(ficha.ancla || "pecho", medidas));
    modelo.traverse((nodo) => {
      if (nodo.isMesh) {
        nodo.castShadow = true;
        nodo.receiveShadow = true;
      }
    });
    ropa.add(modelo);
  }

  async function vestir() {
    const gen = generacion + 1;
    generacion = gen;
    desechar(ropa);
    ropa.clear();
    cuerpo.traverse((nodo) => {
      if (/^(pie|mano|brazo|pierna)/.test(nodo.name || "")) nodo.visible = true;
    });
    const entradas = listaPuesta();
    await Promise.all(entradas.map(async (item) => {
      const ficha = window.DT_MODELOS && window.DT_MODELOS[item.id];
      if (ficha && ficha.archivo) {
        try {
          await agregarModelo(item, ficha, gen);
          return;
        } catch (error) {
          /* Si el archivo no abre, queda la forma 3D de la prenda. */
        }
      }
      if (gen !== generacion) return;
      const [color, telas] = await Promise.all([colorDe(item), telasDe(item)]);
      if (gen !== generacion) return;
      agregarPrenda(item, color, telas);
    }));
  }

  function texto() {
    const puestos = listaPuesta();
    nameEl.textContent = puestos.map((item) => item.name).join(" + ") || "Maniquí en blanco";
    if (!puestos.length) {
      note.textContent = sexo === "f"
        ? "Maniquí femenino. Aquí salen las prendas de mujer y las que sirven para los dos."
        : "Maniquí masculino. Aquí salen las prendas de hombre y las que sirven para los dos.";
    }
    if (add) add.hidden = !puestos.length;
    picksEl.innerHTML = puestos.map((item) => `<article class="fit-pick is-on">
      <img src="${foto(item)}" alt="">
      <span>${escapeHtml(item.name)}</span>
      <small>${item.id}</small>
      <button type="button" data-fit-change="${categoria(item)}">Cambiar</button>
      <button type="button" data-fit-drop="${item.id}">Quitar</button>
    </article>`).join("");
  }

  function quitar(id) {
    orden.forEach((clave) => {
      if (puesto[clave] && puesto[clave].id === id) puesto[clave] = null;
    });
  }

  function poner(item) {
    const slot = pieza(item);
    if (!slot || !coincide(item)) return;
    if (estaPuesto(item.id)) {
      quitar(item.id);
      texto();
      vestir();
      return;
    }
    if (slot === "cinturon") {
      const base = puesto.inferior || puesto.completo;
      if (base && !admiteCinturon(base)) {
        note.textContent = "Esa prenda de abajo no lleva reata en las trabillas.";
        return;
      }
      puesto.cinturon = item;
      note.textContent = base
        ? "La reata queda en la cintura, sobre el pantalón."
        : "La reata espera un pantalón para sujetarse en la cintura.";
    } else if (slot === "completo") {
      puesto.completo = item;
      puesto.camisa = null;
      puesto.inferior = null;
      note.textContent = "El uniforme cubre torso y piernas. Encima puede ir chaqueta, chaleco, gorra o botas.";
    } else if (slot === "camisa" || slot === "inferior") {
      puesto.completo = null;
      puesto[slot] = item;
      if (slot === "inferior" && !admiteCinturon(item)) puesto.cinturon = null;
      note.textContent = slot === "camisa"
        ? "La camisa queda en el torso. Con pantalón, la camisa entra; el buzo queda por fuera."
        : "La prenda de abajo sale de la cintura y sigue las piernas.";
    } else {
      puesto[slot] = item;
      const avisos = {
        chaqueta: "La chaqueta va sobre la camisa, con las mangas en los brazos.",
        chaleco: "El chaleco va sobre el torso, sin cubrir los brazos.",
        calzado: "El calzado queda en los dos pies, apoyado en el suelo.",
        gorra: "La gorra queda en la cabeza, con la visera al frente.",
        gafas: "Las gafas quedan en los ojos.",
        guantes: "Los guantes cubren las dos manos."
      };
      note.textContent = avisos[slot] || "La prenda quedó en su lugar.";
    }
    texto();
    vestir();
  }

  function pintarTabs() {
    const visibles = nombres.filter(([id]) => catalogo.some((item) => categoria(item) === id && coincide(item)));
    if (visibles.length && !visibles.some(([id]) => id === tab)) tab = visibles[0][0];
    tabs.innerHTML = visibles.map(([id, etiqueta]) => `<button class="filter${id === tab ? " is-active" : ""}" type="button" data-fit-tab="${id}">${etiqueta}</button>`).join("");
  }

  function pintarGrid() {
    const lista = catalogo.filter((item) => categoria(item) === tab && coincide(item));
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
    }).join("") || `<p class="lead">En este maniquí no hay prendas de esta categoría.</p>`;
  }

  function marcarSexo() {
    document.querySelectorAll("[data-fit-sexo]").forEach((boton) => {
      boton.classList.toggle("is-active", boton.dataset.fitSexo === sexo);
    });
  }

  function guardar() {
    const datos = { sexo, ids: listaPuesta().map((item) => item.id) };
    localStorage.setItem("dt-uniforme", JSON.stringify(datos));
    const boton = document.querySelector("[data-fit-save]");
    if (boton) {
      boton.textContent = "Guardado";
      window.setTimeout(() => { boton.textContent = "Guardar"; }, 1400);
    }
  }

  function limpiar() {
    orden.forEach((clave) => { puesto[clave] = null; });
    note.textContent = "El maniquí quedó en blanco.";
    texto();
    vestir();
    pintarGrid();
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
    const quita = event.target.closest("[data-fit-drop]");
    if (quita) {
      quitar(quita.dataset.fitDrop);
      texto();
      vestir();
      pintarGrid();
      return;
    }
    const cambia = event.target.closest("[data-fit-change]");
    if (!cambia) return;
    tab = cambia.dataset.fitChange;
    pintarTabs();
    pintarGrid();
    tabs.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-fit-tab]");
    if (!button) return;
    tab = button.dataset.fitTab;
    pintarTabs();
    pintarGrid();
  });

  document.querySelectorAll("[data-fit-sexo]").forEach((boton) => {
    boton.addEventListener("click", () => {
      sexo = boton.dataset.fitSexo === "f" ? "f" : "m";
      orden.forEach((clave) => {
        if (puesto[clave] && !coincide(puesto[clave])) puesto[clave] = null;
      });
      marcarSexo();
      construirCuerpo();
      texto();
      vestir();
      pintarTabs();
      pintarGrid();
    });
  });

  const vistas = {
    frente: new THREE.Vector3(0, 0.98, 3.85),
    lado: new THREE.Vector3(3.85, 0.98, 0.2),
    espalda: new THREE.Vector3(0, 0.98, -3.85)
  };
  let destino = null;
  document.querySelectorAll("[data-fit-view]").forEach((boton) => {
    boton.addEventListener("click", () => {
      destino = vistas[boton.dataset.fitView] || vistas.frente;
      document.querySelectorAll("[data-fit-view]").forEach((otro) => otro.classList.toggle("is-active", otro === boton));
    });
  });

  document.querySelector("[data-fit-clear]")?.addEventListener("click", limpiar);
  document.querySelector("[data-fit-save]")?.addEventListener("click", guardar);

  if (add) {
    add.addEventListener("click", (event) => {
      event.stopPropagation();
      const ids = listaPuesta().map((item) => item.id);
      if (!ids.length || typeof window.addToCart !== "function") return;
      let message = "";
      ids.forEach((id) => {
        const result = window.addToCart(id, 1);
        if (result) message = result;
      });
      add.textContent = message || "Añadido al carrito";
      window.setTimeout(() => { add.textContent = "Solicitar uniforme"; }, 1600);
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
    orden.forEach((clave) => { puesto[clave] = null; });
    items.forEach((item) => poner(item));
    pintarGrid();
  });

  function ajustar() {
    const ancho = Math.max(1, stage.clientWidth);
    const alto = Math.max(1, stage.clientHeight);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
    renderizador.setSize(ancho, alto, false);
  }
  ajustar();
  if (window.ResizeObserver) new ResizeObserver(ajustar).observe(stage);
  else window.addEventListener("resize", ajustar);

  function animar() {
    if (destino) {
      camara.position.lerp(destino, 0.14);
      if (camara.position.distanceTo(destino) < 0.03) destino = null;
    }
    controles.update();
    renderizador.render(escena, camara);
    window.requestAnimationFrame(animar);
  }
  animar();

  construirCuerpo();
  pintarTabs();
  pintarGrid();
  const presetId = String(new URLSearchParams(location.search).get("id") || "").toUpperCase();
  const preset = catalogo.find((item) => item.id === presetId);
  if (preset && categoria(preset)) {
    const marca = sexoDe(preset);
    if (marca && marca !== sexo) {
      sexo = marca;
      marcarSexo();
      construirCuerpo();
    }
    tab = categoria(preset);
    pintarTabs();
    poner(preset);
    pintarGrid();
  } else {
    try {
      const guardado = JSON.parse(localStorage.getItem("dt-uniforme") || "null");
      if (guardado && Array.isArray(guardado.ids) && guardado.ids.length) {
        sexo = guardado.sexo === "f" ? "f" : "m";
        marcarSexo();
        construirCuerpo();
        guardado.ids.forEach((id) => {
          const item = catalogo.find((entry) => entry.id === id);
          if (item && pieza(item) && coincide(item)) puesto[pieza(item)] = item;
        });
        texto();
        vestir();
        pintarGrid();
      } else {
        texto();
      }
    } catch {
      texto();
    }
  }
}
