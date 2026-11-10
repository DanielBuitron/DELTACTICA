import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

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
    ["guantes", "Accesorios"]
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

  function paraAmbos(item) {
    const grupo = categoria(item);
    return grupo === "chaquetas" || grupo === "gorras" || grupo === "botas" || grupo === "reatas" || grupo === "guantes";
  }

  function sexoDe(item) {
    if (paraAmbos(item)) return "";
    const nombre = plain(item.name);
    if (/\bfalda\b/.test(nombre)) return "f";
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
    if (mujer) {
      return {
        mujer,
        alto: 1.59,
        adelante: 0.04,
        hombro: 0.16,
        cadera: 0.09,
        pechoY: 1.16,
        cinturaY: 0.98,
        caderaY: 0.84,
        cuelloY: 1.32,
        cabezaY: 1.48,
        cabezaZ: 0.09,
        cabezaR: 0.082,
        brazo: 0.042,
        pierna: 0.062,
        mano: [0.46, 0.88, 0.2],
        pie: [0.17, 0.09],
        brazoPuntos: [[0.12, 1.26, 0.04], [0.18, 1.2, 0.03], [0.27, 1.1, 0.03], [0.36, 0.98, 0.06], [0.45, 0.88, 0.16]],
        piernaPuntos: [[0.09, 0.82, 0.02], [0.11, 0.68, 0.03], [0.13, 0.46, 0.04], [0.15, 0.26, 0.03], [0.16, 0.07, 0.04]]
      };
    }
    return {
      mujer,
      alto: 1.79,
      adelante: 0.035,
      hombro: 0.2,
      cadera: 0.11,
      pechoY: 1.3,
      cinturaY: 1.12,
      caderaY: 0.97,
      cuelloY: 1.5,
      cabezaY: 1.67,
      cabezaZ: 0.1,
      cabezaR: 0.092,
      brazo: 0.05,
      pierna: 0.07,
      mano: [0.56, 1, 0.28],
      pie: [0.2, 0.085],
      brazoPuntos: [[0.2, 1.4, 0.045], [0.28, 1.32, 0.035], [0.36, 1.2, 0.03], [0.45, 1.08, 0.07], [0.54, 0.98, 0.18]],
      piernaPuntos: [[0.11, 0.95, 0.02], [0.14, 0.76, 0.02], [0.15, 0.52, 0.03], [0.18, 0.3, 0.02], [0.2, 0.08, 0.04]]
    };
  }

  function perfil(med) {
    return med.mujer
      ? [[0.7, 0.175, 0.1], [0.84, 0.17, 0.11], [0.96, 0.145, 0.095], [1.06, 0.14, 0.095], [1.16, 0.155, 0.105], [1.24, 0.17, 0.1], [1.32, 0.09, 0.065], [1.4, 0.05, 0.055]]
      : [[0.78, 0.19, 0.12], [0.97, 0.185, 0.13], [1.12, 0.16, 0.115], [1.26, 0.18, 0.12], [1.36, 0.24, 0.125], [1.44, 0.26, 0.115], [1.5, 0.11, 0.075], [1.56, 0.065, 0.06]];
  }

  function seccionEn(med, y) {
    const puntos = perfil(med);
    const leer = (punto) => ({ x: punto[1], z: punto[2] });
    if (y <= puntos[0][0]) return leer(puntos[0]);
    const ultimo = puntos[puntos.length - 1];
    if (y >= ultimo[0]) return leer(ultimo);
    for (let i = 0; i < puntos.length - 1; i += 1) {
      const a = puntos[i];
      const b = puntos[i + 1];
      if (y >= a[0] && y <= b[0]) {
        const t = (y - a[0]) / (b[0] - a[0]);
        return { x: a[1] + (b[1] - a[1]) * t, z: a[2] + (b[2] - a[2]) * t };
      }
    }
    return leer(ultimo);
  }

  const escena = new THREE.Scene();
  escena.background = new THREE.Color("#070708");
  const camara = new THREE.PerspectiveCamera(32, 1, 0.08, 24);
  camara.position.set(0, 1.02, 4.15);
  const renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderizador.outputColorSpace = THREE.SRGBColorSpace;
  renderizador.shadowMap.enabled = true;
  renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
  renderizador.toneMapping = THREE.ACESFilmicToneMapping;
  renderizador.toneMappingExposure = 1.15;
  stage.replaceChildren(renderizador.domElement);

  const controles = new OrbitControls(camara, renderizador.domElement);
  controles.target.set(0, 0.98, 0);
  controles.enablePan = false;
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.minDistance = 1.6;
  controles.maxDistance = 6;
  controles.minPolarAngle = 0.55;
  controles.maxPolarAngle = 1.55;
  controles.update();

  escena.add(new THREE.AmbientLight("#ffffff", 0.72));
  const frenteLuz = new THREE.DirectionalLight("#ffffff", 1.45);
  frenteLuz.position.set(0.1, 2.4, 3.2);
  frenteLuz.castShadow = true;
  frenteLuz.shadow.mapSize.set(2048, 2048);
  frenteLuz.shadow.camera.near = 0.4;
  frenteLuz.shadow.camera.far = 8;
  frenteLuz.shadow.camera.left = -1.5;
  frenteLuz.shadow.camera.right = 1.5;
  frenteLuz.shadow.camera.top = 2;
  frenteLuz.shadow.camera.bottom = -0.3;
  escena.add(frenteLuz);
  const izquierdaLuz = new THREE.DirectionalLight("#ffffff", 1.25);
  izquierdaLuz.position.set(-3.1, 1.9, 0.2);
  escena.add(izquierdaLuz);
  const derechaLuz = new THREE.DirectionalLight("#ffffff", 1.25);
  derechaLuz.position.set(3.1, 1.9, 0.2);
  escena.add(derechaLuz);
  const atrasLuz = new THREE.DirectionalLight("#ffffff", 1.35);
  atrasLuz.position.set(0, 2.1, -3.2);
  escena.add(atrasLuz);
  const cenital = new THREE.DirectionalLight("#fff8f2", 0.85);
  cenital.position.set(0, 4.2, 0.4);
  escena.add(cenital);

  const suelo = new THREE.Mesh(
    new THREE.CircleGeometry(1.05, 48),
    new THREE.ShadowMaterial({ opacity: 0.55 })
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
  const piel = new THREE.MeshStandardMaterial({ color: "#cfc8be", roughness: 0.62, metalness: 0.02 });
  let medidas = medidasDe("m");
  let cuerpoPromesa = Promise.resolve();
  let superficie = null;

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

  function carne(radio, x, y, z, sx, sy, sz, nombre) {
    const malla = new THREE.Mesh(new THREE.SphereGeometry(radio, 18, 14), piel);
    malla.scale.set(sx, sy, sz);
    malla.position.set(x, y, z);
    malla.castShadow = true;
    if (nombre) malla.name = nombre;
    return malla;
  }

  function nombreParte(nombre) {
    const lado = /Left/.test(nombre) ? "I" : "D";
    if (/Hand/.test(nombre)) return `mano${lado}`;
    if (/Foot/.test(nombre)) return `pie${lado}`;
    if (/Shoulder/.test(nombre)) return `hombroCarne${lado}`;
    if (/UpperArm|Elbow|Forearm/.test(nombre)) return `brazo${lado}`;
    if (/Hip|Thigh|Knee|LowerLeg|Ankle/.test(nombre)) return `pierna${lado}`;
    if (/Pelvis/.test(nombre)) return "caderaCuerpo";
    return nombre;
  }

  function construirCuerpo() {
    const modo = sexo;
    cuerpoPromesa = cargarManiqui(modo);
  }

  function encuadrar(modo) {
    const alto = modo === "f" ? 1.59 : 1.79;
    const y = alto * 0.5;
    const distancia = 3.7;
    controles.target.set(0, y, 0);
    vistas.frente.set(0, y, distancia);
    vistas.lado.set(distancia, y, 0.15);
    vistas.espalda.set(0, y, -distancia);
    if (!destino) camara.position.set(0, y, distancia);
  }

  async function cargarManiqui(modo) {
    const archivo = modo === "f" ? "modelos/cuerpo-mujer.glb?v=1" : "modelos/cuerpo-hombre.glb?v=1";
    let gltf = null;
    try {
      gltf = await cargador.loadAsync(`${root}${archivo}`);
    } catch (error) {
      if (note) note.textContent = "No se pudo abrir el maniquí.";
      return;
    }
    if (sexo !== modo) return;
    desechar(cuerpo);
    cuerpo.clear();
    medidas = medidasDe(modo);
    figura.scale.set(1, 1, 1);
    encuadrar(modo);
    gltf.scene.traverse((nodo) => {
      if (/high-poly/i.test(nodo.name || "")) nodo.visible = false;
      if (!nodo.isMesh || nodo.visible === false) return;
      nodo.castShadow = true;
      nodo.receiveShadow = true;
    });
    cuerpo.add(gltf.scene);
    hornearCuerpo();
  }

  function hornearCuerpo() {
    let mejor = null;
    let cuenta = 0;
    cuerpo.updateMatrixWorld(true);
    cuerpo.traverse((nodo) => {
      if (!nodo.isMesh || nodo.visible === false) return;
      const total = nodo.geometry && nodo.geometry.attributes.position ? nodo.geometry.attributes.position.count : 0;
      if (total > cuenta) {
        cuenta = total;
        mejor = nodo;
      }
    });
    if (!mejor) {
      superficie = null;
      return;
    }
    const geo = mejor.geometry;
    const pos = geo.attributes.position;
    const index = geo.index;
    const matriz = mejor.matrixWorld;
    const conPiel = !!(mejor.isSkinnedMesh && mejor.skeleton && geo.attributes.skinIndex && geo.attributes.skinWeight);
    const posiciones = new Float32Array(pos.count * 3);
    const v = new THREE.Vector3();
    const v4 = new THREE.Vector4();
    const acc = new THREE.Vector4();
    const tmp = new THREE.Vector4();
    let huesos = null;
    if (conPiel) {
      mejor.skeleton.update();
      huesos = mejor.skeleton.bones.map((hueso, i) => {
        const m = new THREE.Matrix4();
        m.multiplyMatrices(hueso.matrixWorld, mejor.skeleton.boneInverses[i]);
        return m;
      });
    }
    for (let i = 0; i < pos.count; i += 1) {
      if (conPiel) {
        v4.fromBufferAttribute(pos, i);
        v4.w = 1;
        v4.applyMatrix4(mejor.bindMatrix);
        acc.set(0, 0, 0, 0);
        const pesos = geo.attributes.skinWeight;
        const indicesPiel = geo.attributes.skinIndex;
        for (let k = 0; k < pesos.itemSize; k += 1) {
          const peso = pesos.getComponent(i, k);
          if (!peso) continue;
          const hueso = indicesPiel.getComponent(i, k);
          tmp.copy(v4).applyMatrix4(huesos[hueso]);
          acc.addScaledVector(tmp, peso);
        }
        acc.applyMatrix4(mejor.bindMatrixInverse);
        v.set(acc.x, acc.y, acc.z).applyMatrix4(matriz);
      } else {
        v.fromBufferAttribute(pos, i).applyMatrix4(matriz);
      }
      posiciones[i * 3] = v.x;
      posiciones[i * 3 + 1] = v.y;
      posiciones[i * 3 + 2] = v.z;
    }
    const indices = index ? index.array : null;
    const apoyo = new THREE.BufferGeometry();
    apoyo.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
    if (indices) apoyo.setIndex(Array.from(indices));
    apoyo.computeVertexNormals();
    const crudas = apoyo.attributes.normal.array;
    const normales = new Float32Array(crudas.length);
    const cubo = 0.02;
    const celdas = new Map();
    for (let i = 0; i < pos.count; i += 1) {
      const o = i * 3;
      const clave = `${Math.round(posiciones[o] / cubo)}|${Math.round(posiciones[o + 1] / cubo)}|${Math.round(posiciones[o + 2] / cubo)}`;
      let celda = celdas.get(clave);
      if (!celda) {
        celda = [0, 0, 0];
        celdas.set(clave, celda);
      }
      celda[0] += crudas[o];
      celda[1] += crudas[o + 1];
      celda[2] += crudas[o + 2];
    }
    for (let i = 0; i < pos.count; i += 1) {
      const o = i * 3;
      const clave = `${Math.round(posiciones[o] / cubo)}|${Math.round(posiciones[o + 1] / cubo)}|${Math.round(posiciones[o + 2] / cubo)}`;
      const celda = celdas.get(clave);
      const largo = Math.hypot(celda[0], celda[1], celda[2]) || 1;
      normales[o] = celda[0] / largo;
      normales[o + 1] = celda[1] / largo;
      normales[o + 2] = celda[2] / largo;
    }
    apoyo.dispose();
    superficie = { posiciones, normales, indices, total: pos.count };
  }

  function mallaDeCuerpo(filtro, holgura, material) {
    if (!superficie) return null;
    const { posiciones, normales, indices, total } = superficie;
    const mapa = new Map();
    const pos = [];
    const nrm = [];
    const uv = [];
    const idx = [];
    const tomar = (vi) => {
      const previo = mapa.get(vi);
      if (previo !== undefined) return previo;
      const id = mapa.size;
      mapa.set(vi, id);
      const o = vi * 3;
      const x = posiciones[o];
      const y = posiciones[o + 1];
      const z = posiciones[o + 2];
      let nx = normales[o];
      let ny = normales[o + 1];
      let nz = normales[o + 2];
      let cx = 0;
      let cz = medidas.adelante || 0;
      const ax = Math.abs(x);
      if (ax > (medidas.mujer ? 0.18 : 0.22) && y > medidas.caderaY - 0.05) {
        cx = Math.sign(x) * Math.min(ax * 0.92, medidas.mujer ? 0.34 : 0.42);
        cz = 0.03;
      } else if (y < medidas.cinturaY + 0.02 && ax > 0.04) {
        cx = Math.sign(x) * Math.min(Math.max(ax, 0.09), medidas.mujer ? 0.14 : 0.16);
      }
      if (nx * (x - cx) + nz * (z - cz) < 0) {
        nx = -nx;
        ny = -ny;
        nz = -nz;
      }
      pos.push(x + nx * holgura, y + ny * holgura, z + nz * holgura);
      nrm.push(nx, ny, nz);
      uv.push(0, 0);
      return id;
    };
    const punto = (vi) => ({ x: posiciones[vi * 3], y: posiciones[vi * 3 + 1], z: posiciones[vi * 3 + 2] });
    const recorrer = (a, b, c) => {
      const pa = punto(a);
      const pb = punto(b);
      const pc = punto(c);
      const incluidos = (filtro(pa) ? 1 : 0) + (filtro(pb) ? 1 : 0) + (filtro(pc) ? 1 : 0);
      if (incluidos < 3) return;
      idx.push(tomar(a), tomar(b), tomar(c));
    };
    if (indices) {
      for (let i = 0; i < indices.length; i += 3) recorrer(indices[i], indices[i + 1], indices[i + 2]);
    } else {
      for (let i = 0; i < total; i += 3) recorrer(i, i + 1, i + 2);
    }
    if (idx.length < 24) return null;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -4;
    material.polygonOffsetUnits = -12;
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geometria.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
    geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometria.setIndex(idx);
    suavizarTela(geometria);
    const malla = new THREE.Mesh(geometria, material);
    malla.castShadow = true;
    malla.receiveShadow = true;
    return malla;
  }

  function suavizarTela(geometria) {
    geometria.computeVertexNormals();
  }

  function esCabeza(p, med) {
    return p.y > med.cuelloY - 0.015 && Math.abs(p.x) < 0.11;
  }

  function esMano(p, med) {
    const dx = Math.abs(p.x) - med.mano[0];
    const dy = p.y - med.mano[1];
    const dz = p.z - med.mano[2];
    return dx * dx + dy * dy + dz * dz < 0.016;
  }

  function esBrazo(p, med) {
    return Math.abs(p.x) > (med.mujer ? 0.19 : 0.23) && p.y > med.caderaY - 0.08;
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

  function rellenarFondo(datos, w, h) {
    const total = w * h;
    const fondo = new Uint8Array(total);
    for (let p = 0, i = 0; p < total; p += 1, i += 4) {
      const mayor = Math.max(datos[i], datos[i + 1], datos[i + 2]);
      const menor = Math.min(datos[i], datos[i + 1], datos[i + 2]);
      if (datos[i + 3] < 24 || mayor < 10 || (mayor > 198 && mayor - menor < 30)) fondo[p] = 1;
    }
    const origen = new Int32Array(total);
    origen.fill(-1);
    const cola = new Int32Array(total);
    let fin = 0;
    for (let p = 0; p < total; p += 1) {
      if (fondo[p]) continue;
      origen[p] = p;
      cola[fin] = p;
      fin += 1;
    }
    let inicio = 0;
    while (inicio < fin) {
      const p = cola[inicio];
      inicio += 1;
      const x = p % w;
      const vecinos = [p - 1, p + 1, p - w, p + w];
      for (let k = 0; k < 4; k += 1) {
        const n = vecinos[k];
        if (n < 0 || n >= total || origen[n] !== -1) continue;
        if (k === 0 && x === 0) continue;
        if (k === 1 && x === w - 1) continue;
        origen[n] = origen[p];
        cola[fin] = n;
        fin += 1;
      }
    }
    for (let p = 0; p < total; p += 1) {
      if (!fondo[p] || origen[p] < 0) continue;
      const i = p * 4;
      const j = origen[p] * 4;
      datos[i] = datos[j];
      datos[i + 1] = datos[j + 1];
      datos[i + 2] = datos[j + 2];
      datos[i + 3] = 255;
    }
  }

  function texturaDe(imagen, x, y, w, h) {
    const lienzo = document.createElement("canvas");
    const ancho = Math.max(1, Math.round(w));
    const alto = Math.max(1, Math.round(h));
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(imagen, x, y, ancho, alto, 0, 0, ancho, alto);
    const pixeles = ctx.getImageData(0, 0, ancho, alto);
    const datos = pixeles.data;
    let sumaR = 0;
    let sumaG = 0;
    let sumaB = 0;
    let cuenta = 0;
    for (let i = 0; i < datos.length; i += 4) {
      if (datos[i + 3] < 24) continue;
      sumaR += datos[i];
      sumaG += datos[i + 1];
      sumaB += datos[i + 2];
      cuenta += 1;
    }
    if (cuenta) {
      const rojo = Math.round(sumaR / cuenta);
      const verde = Math.round(sumaG / cuenta);
      const azul = Math.round(sumaB / cuenta);
      const prendaClara = (rojo + verde + azul) / 3 > 200;
      if (!prendaClara) rellenarFondo(datos, ancho, alto);
      ctx.putImageData(pixeles, 0, 0);
    }
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
            if (mx < 10 || (mx > 244 && mx - mn < 16)) continue;
            n += 1;
            if (px < minX) minX = px;
            if (py < minY) minY = py;
            if (px > maxX) maxX = px;
            if (py > maxY) maxY = py;
          }
        }
        if (n < 12) resolve(texturaDe(imagen, 0, 0, w, h));
        else {
          const margen = Math.round(Math.min(w, h) * 0.004);
          const x0 = Math.max(0, minX - margen);
          const y0 = Math.max(0, minY - margen);
          let x1 = Math.min(w, maxX + margen);
          let y1 = Math.min(h, maxY + margen);
          y1 = quitarPiel(data, w, x0, y0, x1, y1);
          const tela = texturaDe(imagen, x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
          tela.zonas = zonasDe(data, w, h, x0, y0, x1, y1);
          resolve(tela);
        }
      };
      imagen.onerror = () => resolve(null);
      imagen.src = url;
    });
    cacheTelas.set(url, promesa);
    return promesa;
  }

  function quitarPiel(data, w, x0, y0, x1, y1) {
    const alto = y1 - y0;
    if (alto < 48) return y1;
    let suma = 0;
    let cuenta = 0;
    const yA = y0 + Math.round(alto * 0.35);
    const yB = y0 + Math.round(alto * 0.7);
    for (let y = yA; y <= yB; y += 4) {
      for (let x = x0; x <= x1; x += 6) {
        const i = (y * w + x) * 4;
        if (data[i + 3] < 28) continue;
        suma += (data[i] + data[i + 1] + data[i + 2]) / 3;
        cuenta += 1;
      }
    }
    const base = cuenta ? suma / cuenta : 40;
    const piel = (i) => {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      return data[i + 3] > 28 && r > 140 && g > 100 && b > 80 && r > b + 12 && r - g < 55;
    };
    let corte = y1;
    const limite = y0 + Math.round(alto * 0.62);
    for (let y = y1 - 1; y >= limite; y -= 2) {
      let cuerpo = 0;
      let tela = 0;
      let luz = 0;
      let n = 0;
      for (let x = x0; x <= x1; x += 3) {
        const i = (y * w + x) * 4;
        if (data[i + 3] < 28) continue;
        n += 1;
        luz += (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (piel(i)) cuerpo += 1;
        else tela += 1;
      }
      const media = n ? luz / n : base;
      if ((cuerpo > 8 && cuerpo > tela * 0.45) || (n > 8 && media > base + 32)) corte = y;
      else if (tela > 12) break;
    }
    return corte;
  }

  function zonasDe(data, w, h, x0, y0, x1, y1) {
    const filas = [];
    const paso = Math.max(1, Math.round((y1 - y0) / 90));
    for (let y = y0; y <= y1; y += paso) {
      let a = -1;
      let b = -1;
      for (let x = x0; x <= x1; x += 2) {
        const i = (y * w + x) * 4;
        if (data[i + 3] < 20) continue;
        if (Math.max(data[i], data[i + 1], data[i + 2]) < 8) continue;
        if (a < 0) a = x;
        b = x;
      }
      if (a >= 0) filas.push({ y, a, b, ancho: b - a });
    }
    if (filas.length < 6) return null;
    const alto = filas[filas.length - 1].y - filas[0].y;
    if (alto < 8) return null;
    const arriba = filas.filter((fila) => fila.y < filas[0].y + alto * 0.14).map((fila) => fila.ancho).sort((p, q) => p - q);
    const cuello = arriba.length ? arriba[Math.floor(arriba.length / 2)] : filas[0].ancho;
    const centro = filas.filter((fila) => fila.y > filas[0].y + alto * 0.28 && fila.y < filas[0].y + alto * 0.58);
    const anchoMedio = centro.length ? centro.reduce((suma, fila) => suma + fila.ancho, 0) / centro.length : cuello;
    const eje = centro.length ? centro.reduce((suma, fila) => suma + (fila.a + fila.b) / 2, 0) / centro.length : (x0 + x1) / 2;
    const torso = cuello > anchoMedio * 0.82 ? anchoMedio * 0.42 : cuello;
    const ancho = Math.max(1, x1 - x0);
    const izquierda = Math.max(0.16, Math.min(0.4, (eje - torso / 2 - x0) / ancho));
    const derecha = Math.max(0.6, Math.min(0.84, (eje + torso / 2 - x0) / ancho));
    if (derecha - izquierda < 0.18) return null;
    return { izquierda: [0.01, izquierda], torso: [izquierda, derecha], derecha: [derecha, 0.99] };
  }

  function ajusteDe(id) {
    const neutro = { ancho: 1, largo: 1, manga: 1, cintura: 1, pierna: 1 };
    try {
      const guardado = JSON.parse(localStorage.getItem("dt-prenda-3d") || "{}");
      const item = guardado[id] || {};
      const numero = (valor) => {
        const n = Number(valor);
        return Number.isFinite(n) && n >= 0.8 && n <= 1.25 ? n : 1;
      };
      return {
        ancho: numero(item.ancho),
        largo: numero(item.largo),
        manga: numero(item.manga),
        cintura: numero(item.cintura),
        pierna: numero(item.pierna)
      };
    } catch (error) {
      return neutro;
    }
  }

  function listo3d(item) {
    const ficha = window.DT_MODELOS && window.DT_MODELOS[item.id];
    if (ficha && ficha.archivo) return true;
    const slot = pieza(item);
    return slot === "camisa" || slot === "chaqueta" || slot === "chaleco" || slot === "completo" || slot === "inferior" || slot === "gorra";
  }

  const cacheAtlas = new Map();

  function encajar(ctx, imagen, origen, panelAncho, panelAlto, lienzoAncho, lienzoAlto) {
    const aspecto = imagen.width / Math.max(1, imagen.height);
    let ancho = panelAncho;
    let alto = ancho / aspecto;
    if (alto > panelAlto) {
      alto = panelAlto;
      ancho = alto * aspecto;
    }
    const x = origen + (panelAncho - ancho) / 2;
    const y = (panelAlto - alto) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imagen, x, y, ancho, alto);
    return {
      u0: x / lienzoAncho,
      u1: (x + ancho) / lienzoAncho,
      v0: 1 - (y + alto) / lienzoAlto,
      v1: 1 - y / lienzoAlto
    };
  }

  function colocarVista(ctx, imagen, x, y, ancho, alto, lienzo) {
    const aspecto = imagen.width / Math.max(1, imagen.height);
    let w = ancho;
    let h = w / aspecto;
    if (h > alto) {
      h = alto;
      w = h * aspecto;
    }
    const dx = x + (ancho - w) / 2;
    const dy = y + (alto - h) / 2;
    ctx.drawImage(imagen, dx, dy, w, h);
    return {
      u0: dx / lienzo,
      u1: (dx + w) / lienzo,
      v0: 1 - (dy + h) / lienzo,
      v1: 1 - dy / lienzo
    };
  }

  function atlasDe(vistas) {
    const lista = vistas.filter(Boolean);
    const clave = lista.map((vista) => vista.tex.uuid).join(":");
    if (cacheAtlas.has(clave)) return cacheAtlas.get(clave);
    const lienzo = document.createElement("canvas");
    const lado = 4096;
    const mitad = lado / 2;
    lienzo.width = lado;
    lienzo.height = lado;
    const ctx = lienzo.getContext("2d");
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, lado, lado);
    const imagen = (vista) => (vista || lista[0]).tex.image;
    const tex = new THREE.CanvasTexture(lienzo);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(16, renderizador.capabilities.getMaxAnisotropy());
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.userData = {
      prenda: true,
      varias: lista.length > 1,
      frente: colocarVista(ctx, imagen(vistas[0]), 0, 0, mitad, mitad, lado),
      derecha: colocarVista(ctx, imagen(vistas[1]), mitad, 0, mitad, mitad, lado),
      espalda: colocarVista(ctx, imagen(vistas[2]), 0, mitad, mitad, mitad, lado),
      izquierda: colocarVista(ctx, imagen(vistas[3]), mitad, mitad, mitad, mitad, lado),
      zonas: (vistas[0] && vistas[0].zonas) || null
    };
    tex.needsUpdate = true;
    cacheAtlas.set(clave, tex);
    return tex;
  }

  function materialTela(telas, solido) {
    if (!telas || !telas.frente) return solido;
    const mapa = atlasDe([telas.frente, telas.derecha, telas.espalda, telas.izquierda]);
    return new THREE.MeshBasicMaterial({
      map: mapa,
      color: "#ffffff",
      side: THREE.DoubleSide
    });
  }

  function concha(med, y0, y1, holgura, material, ancho, vuelo, caida) {
    const segmentos = 40;
    const anillos = 28;
    const posiciones = [];
    const uvs = [];
    const indices = [];
    const vueloBajo = vuelo || 0;
    const caidaTela = caida || 0;
    for (let j = 0; j <= anillos; j += 1) {
      const t = j / anillos;
      const y = y0 + (y1 - y0) * t;
      const seccion = seccionEn(med, y);
      const subida = y - y0;
      const cerca = subida < 0.14 ? 1 - subida / 0.14 : 0;
      const extra = vueloBajo * cerca;
      const holgado = seccionEn(med, med.caderaY);
      const radioX = (seccion.x * (1 - caidaTela) + holgado.x * caidaTela + holgura + extra) * ancho;
      const radioZ = (seccion.z * (1 - caidaTela) + holgado.z * caidaTela + holgura + extra * 0.55) * ancho;
      for (let i = 0; i <= segmentos; i += 1) {
        const angulo = (i / segmentos) * Math.PI * 2;
        const seno = Math.sin(angulo);
        const coseno = Math.cos(angulo);
        const pecho = Math.exp(-((y - med.pechoY) * (y - med.pechoY)) / 0.008);
        const zPecho = coseno > 0 ? 0.012 * pecho * coseno : 0;
        posiciones.push(seno * radioX, y, coseno * radioZ + zPecho + med.adelante);
        const lateral = 0.5 + Math.sin(angulo) * 0.5;
        const u = (Math.cos(angulo) >= 0 ? 0.105 : 0.605) + lateral * 0.29;
        uvs.push(u, t);
      }
    }
    const columnas = segmentos + 1;
    for (let j = 0; j < anillos; j += 1) {
      for (let i = 0; i < segmentos; i += 1) {
        const a = j * columnas + i;
        const b = a + columnas;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posiciones, 3));
    geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometria.setIndex(indices);
    geometria.computeVertexNormals();
    const malla = new THREE.Mesh(geometria, material);
    malla.castShadow = true;
    return malla;
  }

  function tuboTela(puntos, radios, material, u0, u1) {
    const seg = 14;
    const posiciones = [];
    const uvs = [];
    const indices = [];
    const eje = new THREE.Vector3();
    const lateral = new THREE.Vector3();
    const vertical = new THREE.Vector3();
    const apoyo = new THREE.Vector3();
    let lateralFijo = null;
    for (let j = 0; j < puntos.length; j += 1) {
      if (j < puntos.length - 1) eje.subVectors(puntos[j + 1], puntos[j]);
      else eje.subVectors(puntos[j], puntos[j - 1]);
      if (eje.lengthSq() < 1e-8) eje.set(0, -1, 0);
      eje.normalize();
      if (!lateralFijo) {
        apoyo.set(0, 0, 1);
        if (Math.abs(eje.dot(apoyo)) > 0.92) apoyo.set(0, 1, 0);
        lateral.crossVectors(eje, apoyo).normalize();
        lateralFijo = lateral.clone();
      } else {
        lateral.copy(lateralFijo).addScaledVector(eje, -lateralFijo.dot(eje));
        if (lateral.lengthSq() < 1e-8) lateral.crossVectors(eje, apoyo.set(0, 1, 0));
        lateral.normalize();
        lateralFijo.copy(lateral);
      }
      vertical.crossVectors(eje, lateral).normalize();
      for (let i = 0; i <= seg; i += 1) {
        const angulo = (i / seg) * Math.PI * 2;
        const radio = radios[Math.min(j, radios.length - 1)];
        posiciones.push(
          puntos[j].x + (lateral.x * Math.cos(angulo) + vertical.x * Math.sin(angulo)) * radio,
          puntos[j].y + (lateral.y * Math.cos(angulo) + vertical.y * Math.sin(angulo)) * radio,
          puntos[j].z + (lateral.z * Math.cos(angulo) + vertical.z * Math.sin(angulo)) * radio
        );
        uvs.push(u0 + ((i / seg) * (u1 - u0)), 1 - (j / (puntos.length - 1)) * 0.82);
      }
    }
    const columnas = seg + 1;
    for (let j = 0; j < puntos.length - 1; j += 1) {
      for (let i = 0; i < seg; i += 1) {
        const a = j * columnas + i;
        const b = a + columnas;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posiciones, 3));
    geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometria.setIndex(indices);
    geometria.computeVertexNormals();
    const malla = new THREE.Mesh(geometria, material);
    malla.castShadow = true;
    return malla;
  }

  function partePrenda(x, y) {
    const med = medidas;
    const ax = Math.abs(x);
    if (y <= 0.2 && ax > 0.04) return x < 0 ? "pieI" : "pieD";
    if (y >= med.cabezaY - 0.04) return "cabeza";
    if (ax > (med.mujer ? 0.17 : 0.2) && y > med.caderaY - 0.06) return x < 0 ? "brazoI" : "brazoD";
    if (y < med.cinturaY + 0.06 && ax > 0.035) return x < 0 ? "piernaI" : "piernaD";
    return "torso";
  }

  function uvFoto(grupo) {
    const mallas = [];
    grupo.traverse((nodo) => {
      if (nodo.isMesh && nodo.geometry && nodo.material && nodo.material.map && nodo.material.map.userData && nodo.material.map.userData.prenda) {
        mallas.push(nodo);
      }
    });
    if (!mallas.length) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    mallas.forEach((nodo) => {
      const pos = nodo.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        minX = Math.min(minX, pos.getX(i));
        maxX = Math.max(maxX, pos.getX(i));
        minY = Math.min(minY, pos.getY(i));
        maxY = Math.max(maxY, pos.getY(i));
        minZ = Math.min(minZ, pos.getZ(i));
        maxZ = Math.max(maxZ, pos.getZ(i));
      }
    });
    const cara = mallas[0].material.map.userData;
    const limitar = (valor) => Math.min(0.995, Math.max(0.005, valor));
    const fraccion = (valor, minimo, maximo) => (valor - minimo) / Math.max(0.001, maximo - minimo);
    const piezaBaja = maxY - minY < 0.22 && maxZ - minZ > maxY - minY;
    const dosPiernas = !piezaBaja && maxY - minY > 0.35 && (minY + maxY) / 2 < medidas.cinturaY + 0.08;
    mallas.forEach((nodo) => {
      const pos = nodo.geometry.attributes.position;
      const uv = nodo.geometry.attributes.uv;
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const vista = "frente";
        const zonas = cara.zonas;
        const enBrazo = Math.abs(x) > (medidas.mujer ? 0.18 : 0.22) && y > medidas.caderaY - 0.02;
        let u = fraccion(x, minX, maxX);
        let v = piezaBaja ? fraccion(z, minZ, maxZ) : fraccion(y, minY, maxY);
        if (dosPiernas) {
          const lado = x < 0 ? -1 : 1;
          const salida = Math.min(1, Math.max(0, (Math.abs(x) - 0.045) / 0.13));
          const junto = lado < 0 ? 0.44 : 0.56;
          const fuera = lado < 0 ? 0.24 : 0.76;
          u = junto + salida * (fuera - junto);
          v = fraccion(y, minY, maxY);
        } else if (zonas && enBrazo && maxY - minY > 0.45) {
          const signo = x < 0 ? -1 : 1;
          const zona = x < 0 ? zonas.izquierda : zonas.derecha;
          const sx = signo * medidas.hombro;
          const sy = medidas.pechoY + (medidas.mujer ? 0.12 : 0.16);
          const sz = medidas.adelante || 0;
          const dx = signo * medidas.mano[0] - sx;
          const dy = medidas.mano[1] - sy;
          const dz = medidas.mano[2] - sz;
          const largo = dx * dx + dy * dy + dz * dz || 1;
          const recorrido = Math.min(1, Math.max(0, ((x - sx) * dx + (y - sy) * dy + (z - sz) * dz) / largo));
          const ejeX = sx + recorrido * dx;
          const haciaCuerpo = (Math.abs(ejeX) - Math.abs(x)) / 0.07;
          const localBrazo = Math.min(0.92, Math.max(0.08, 0.42 + haciaCuerpo * 0.5));
          const une = recorrido < 0.28 ? 1 - recorrido / 0.28 : 0;
          const local = localBrazo + (0.96 - localBrazo) * une;
          u = zona[0] + local * (zona[1] - zona[0]);
          v = 0.98 - recorrido * 0.94;
        } else if (zonas) {
          const zona = zonas.torso;
          const mitad = medidas.hombro * 0.9;
          u = zona[0] + fraccion(x, -mitad, mitad) * (zona[1] - zona[0]);
          v = fraccion(y, minY, maxY);
        }
        const rect = cara[vista] || cara.frente;
        uv.setXY(i, rect.u0 + limitar(u) * (rect.u1 - rect.u0), rect.v0 + limitar(v) * (rect.v1 - rect.v0));
      }
      uv.needsUpdate = true;
    });
  }

  function uvGrupo(grupo) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    grupo.traverse((nodo) => {
      if (!nodo.geometry) return;
      const pos = nodo.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        minX = Math.min(minX, pos.getX(i));
        maxX = Math.max(maxX, pos.getX(i));
        minY = Math.min(minY, pos.getY(i));
        maxY = Math.max(maxY, pos.getY(i));
      }
    });
    const ancho = Math.max(0.001, maxX - minX);
    const alto = Math.max(0.001, maxY - minY);
    grupo.traverse((nodo) => {
      if (!nodo.geometry) return;
      const pos = nodo.geometry.attributes.position;
      const uv = nodo.geometry.attributes.uv;
      for (let i = 0; i < pos.count; i += 1) {
      const local = 0.06 + 0.88 * ((pos.getX(i) - minX) / ancho);
      const v = 0.08 + 0.84 * ((pos.getY(i) - minY) / alto);
        uv.setXY(i, (pos.getZ(i) >= 0 ? 0 : 0.5) + local * 0.5, v);
      }
      uv.needsUpdate = true;
    });
  }

  async function telasDe(item) {
    const clave = item.id.toLowerCase().replace(/-/g, "");
    if (esPrenda(item)) {
      const vista = (numero) => recortar(`${root}img/puesto/${clave}-0${numero}.webp?v=13`);
      const frente = await vista(1);
      const derecha = await vista(2);
      const espalda = await vista(3);
      const izquierda = await vista(4);
      return { frente: frente || await recortar(foto(item)), derecha, espalda, izquierda };
    }
    return { frente: await recortar(foto(item)), derecha: null, espalda: null, izquierda: null };
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

  function brazosDe(med, radio, material, corta, alcance) {
    const grupo = new THREE.Group();
    const factor = Number.isFinite(alcance) ? alcance : 1;
    const hombroY = 1.39;
    const codoY = 1.08;
    const munecaY = corta ? 1.08 : 0.8 + (1 - factor) * 0.32;
    [-1, 1].forEach((lado) => {
      const hombro = new THREE.Vector3(lado * med.hombro * 0.9, hombroY, 0.02);
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
        new THREE.Vector3(lado * med.cadera, 0.72, 0.02),
        new THREE.Vector3(lado * med.cadera, 0.48, 0.02),
        new THREE.Vector3(lado * med.cadera * 0.92, yFin, 0.02)
      ], [radio * 1.2, radio, radio * 0.78], material));
    });
    return grupo;
  }

  function ocultarCuerpo(nombres) {
    cuerpo.traverse((nodo) => {
      if (nombres.test(nodo.name || "")) nodo.visible = false;
    });
  }

  function puntosBrazo(med, lado) {
    const signo = lado < 0 ? -1 : 1;
    return med.brazoPuntos.map((punto) => new THREE.Vector3(signo * punto[0], punto[1], punto[2]));
  }

  function sumarMangas(grupo, med, material, corta, alcance, radio) {
    const factor = Number.isFinite(alcance) ? alcance : 1;
    const munecaY = corta ? 1.05 : 0.76 + (1 - factor) * 0.2;
    [-1, 1].forEach((lado) => {
      const puntos = puntosBrazo(med, lado);
      const usados = corta ? puntos.slice(0, 3) : puntos;
      const radios = corta
        ? [radio * 1.15, radio * 1.05, radio * 0.9]
        : [radio * 1.55, radio * 1.25, radio * 1.05, radio * 0.9, radio * 0.75];
      const u0 = lado < 0 ? 0.008 : 0.418;
      const u1 = lado < 0 ? 0.08 : 0.492;
      grupo.add(tuboTela(usados, radios, material, u0, u1));
      if (!corta) {
        const junta = new THREE.Mesh(new THREE.SphereGeometry(radios[0] * 0.85, 18, 12), material);
        junta.geometry.scale(1.15, 0.65, 0.9);
        junta.geometry.translate(usados[0].x, usados[0].y, usados[0].z);
        junta.castShadow = true;
        grupo.add(junta);
      }
    });
  }

  function sumarPiernas(grupo, med, material, y0, y1, radio) {
    [-1, 1].forEach((lado) => {
      const signo = lado < 0 ? -1 : 1;
      const base = med.piernaPuntos.map((punto) => new THREE.Vector3(signo * punto[0], punto[1], punto[2]));
      const corta = y0 - y1 < 0.4;
      const puntos = corta ? [base[0].clone(), base[base.length - 1].clone()] : base.map((punto) => punto.clone());
      puntos[0].y = y0;
      puntos[puntos.length - 1].y = y1;
      const radios = corta
        ? [radio * 1.18, radio * 0.9]
        : [radio * 1.45, radio * 1.15, radio * 0.9, radio * 0.78, radio * 0.66];
      grupo.add(tuboTela(puntos, radios, material, lado < 0 ? 0.08 : 0.3, lado < 0 ? 0.22 : 0.44));
    });
  }

  function fotoSuelta(frente) {
    if (!frente || !frente.tex) return null;
    const tex = frente.tex;
    return new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: tex,
      emissiveIntensity: 0.2,
      roughness: 0.55,
      metalness: 0.04,
      side: THREE.DoubleSide
    });
  }

  function mallaCurva(ancho, alto, curva, material) {
    const seg = 18;
    const posiciones = [];
    const uvs = [];
    const indices = [];
    for (let j = 0; j <= 1; j += 1) {
      for (let i = 0; i <= seg; i += 1) {
        const t = i / seg;
        const angulo = (t - 0.5) * curva;
        posiciones.push(Math.sin(angulo) * ancho, (j - 0.5) * alto, Math.cos(angulo) * ancho * 0.28);
        uvs.push(t, j);
      }
    }
    const columnas = seg + 1;
    for (let i = 0; i < seg; i += 1) {
      const a = i;
      const b = i + columnas;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posiciones, 3));
    geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometria.setIndex(indices);
    geometria.computeVertexNormals();
    const malla = new THREE.Mesh(geometria, material);
    malla.castShadow = true;
    return malla;
  }

  function bandaCintura(med, y, material) {
    const seccion = seccionEn(med, y);
    const rx = seccion.x + 0.018;
    const rz = seccion.z + 0.014;
    const alto = 0.034;
    const grueso = 0.006;
    const seg = 48;
    const posiciones = [];
    const indices = [];
    const anillo = (radioX, radioZ, altura) => {
      const base = posiciones.length / 3;
      for (let i = 0; i <= seg; i += 1) {
        const angulo = (i / seg) * Math.PI * 2;
        posiciones.push(Math.sin(angulo) * radioX, altura, Math.cos(angulo) * radioZ + med.adelante);
      }
      return base;
    };
    const abajoDentro = anillo(rx, rz, y - alto / 2);
    const abajoFuera = anillo(rx + grueso, rz + grueso, y - alto / 2);
    const arribaDentro = anillo(rx, rz, y + alto / 2);
    const arribaFuera = anillo(rx + grueso, rz + grueso, y + alto / 2);
    const unir = (origen, destino) => {
      for (let i = 0; i < seg; i += 1) {
        indices.push(origen + i, destino + i, origen + i + 1, destino + i, destino + i + 1, origen + i + 1);
      }
    };
    unir(abajoFuera, arribaFuera);
    unir(arribaDentro, abajoDentro);
    unir(abajoDentro, abajoFuera);
    unir(arribaFuera, arribaDentro);
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posiciones, 3));
    geometria.setIndex(indices);
    geometria.computeVertexNormals();
    const malla = new THREE.Mesh(geometria, material);
    malla.castShadow = true;
    return malla;
  }

  function viseraGorra(ancho, largo, material) {
    const seg = 14;
    const posiciones = [];
    const uvs = [];
    const indices = [];
    for (let j = 0; j <= 1; j += 1) {
      for (let i = 0; i <= seg; i += 1) {
        const t = i / seg;
        const angulo = (t - 0.5) * 1.2;
        posiciones.push(Math.sin(angulo) * ancho, -j * j * 0.016, j * largo);
        uvs.push(t, j);
      }
    }
    const columnas = seg + 1;
    for (let i = 0; i < seg; i += 1) {
      indices.push(i, i + columnas, i + 1, i + columnas, i + columnas + 1, i + 1);
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posiciones, 3));
    geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometria.setIndex(indices);
    geometria.computeVertexNormals();
    const malla = new THREE.Mesh(geometria, material);
    malla.castShadow = true;
    return malla;
  }

  function mangasDelCuerpo(grupo, med, material, corta) {
    let malla = null;
    cuerpo.traverse((nodo) => {
      if (!malla && nodo.isSkinnedMesh && nodo.skeleton) malla = nodo;
    });
    if (!malla) return;
    malla.skeleton.update();
    [-1, 1].forEach((lado) => {
      const sufijo = lado < 0 ? "L" : "R";
      const nombres = corta
        ? ["shoulder01", "upperarm01", "upperarm02"]
        : ["shoulder01", "upperarm01", "upperarm02", "lowerarm01", "lowerarm02", "wrist"];
      const puntos = [];
      nombres.forEach((nombre) => {
        const hueso = malla.skeleton.bones.find((item) => item.name === nombre + sufijo);
        if (!hueso) return;
        const punto = new THREE.Vector3();
        hueso.getWorldPosition(punto);
        figura.worldToLocal(punto);
        puntos.push(punto);
      });
      if (puntos.length < 2) return;
      const radios = puntos.map((_, indice) => {
        const t = indice / (puntos.length - 1);
        return (corta ? 0.055 : 0.064) * (1 - t * 0.32);
      });
      grupo.add(tuboTela(puntos, radios, material, lado < 0 ? 0.02 : 0.78, lado < 0 ? 0.22 : 0.98));
    });
  }

  function agregarPrenda(item, color, telas) {
    const med = medidas;
    const solido = tela(color);
    const grupo = new THREE.Group();
    grupo.name = item.id;
    const tipo = corte(item);
    const slot = pieza(item);
    const ajuste = ajusteDe(item.id);
    const telaPrenda = materialTela(telas, solido);
    const conPantalon = puesto.inferior && corte(puesto.inferior) === "largo";
    const ponerCuerpo = (filtro, holgura, material) => {
      const malla = mallaDeCuerpo(filtro, holgura * (ajuste.ancho || 1), material || telaPrenda);
      if (malla) grupo.add(malla);
      return !!malla;
    };
    if (slot === "camisa" || slot === "chaqueta" || slot === "chaleco") {
      const corta = slot === "camisa" && tipo === "manga-corta";
      const bajo = slot === "chaleco" ? med.caderaY - 0.08 : (slot === "chaqueta" ? med.caderaY - 0.06 : (tipo === "fuera" ? med.caderaY - 0.04 : med.cinturaY - 0.02));
      const holgura = slot === "chaqueta" ? 0.03 : (slot === "chaleco" ? 0.026 : 0.022);
      const conMangas = slot !== "chaleco";
      ponerCuerpo((p) => {
        if (esCabeza(p, med) || esMano(p, med) || p.y < bajo || p.y > med.cuelloY + 0.02) return false;
        if (conMangas && esBrazo(p, med)) return false;
        if (slot === "chaleco" && esBrazo(p, med)) return false;
        return true;
      }, holgura);
      if (conMangas) mangasDelCuerpo(grupo, med, telaPrenda, corta);
    } else if (slot === "completo") {
      ponerCuerpo((p) => {
        if (esCabeza(p, med) || esMano(p, med)) return false;
        return p.y >= 0.1 && p.y <= med.cuelloY + 0.02;
      }, 0.03);
    } else if (slot === "inferior") {
      const bajo = tipo === "falda" ? med.caderaY - 0.42 : (tipo === "corto" ? med.caderaY - 0.4 : 0.1);
      ponerCuerpo((p) => {
        if (esBrazo(p, med) || esMano(p, med) || esCabeza(p, med)) return false;
        if (tipo === "falda" && p.y < med.caderaY - 0.02 && Math.abs(p.x) > 0.16) return false;
        return p.y <= med.cinturaY + 0.03 && p.y >= bajo;
      }, 0.032);
    } else if (slot === "cinturon") {
      const base = puesto.inferior || puesto.completo;
      if (base && admiteCinturon(base)) {
        ponerCuerpo((p) => Math.abs(p.y - med.cinturaY) < 0.018 && !esBrazo(p, med) && !esCabeza(p, med), 0.034, telaPrenda);
      }
    } else if (slot === "calzado") {
      const alta = tipo === "bota";
      const cima = alta ? 0.28 : 0.17;
      ponerCuerpo((p) => p.y <= cima && p.y >= 0 && Math.abs(p.x) > 0.05, alta ? 0.02 : 0.018);
    } else if (slot === "guantes") {
      ponerCuerpo((p) => esMano(p, med), 0.008);
    } else if (slot === "gafas") {
      const foto = fotoSuelta(telas && telas.frente);
      const material = foto || solido;
      const aspecto = telas && telas.frente ? telas.frente.aspect : 2.2;
      const ancho = med.cabezaR * 1.7;
      const alto = Math.min(0.07, Math.max(0.035, (ancho * 1.2) / aspecto));
      const lentes = mallaCurva(ancho * 0.55, alto, 1.15, material);
      lentes.position.set(0, med.cabezaY - 0.02, med.cabezaZ + med.cabezaR * 0.8);
      grupo.add(lentes);
    } else if (slot === "gorra") {
      ponerCuerpo((p) => p.y >= med.cabezaY + med.cabezaR * 0.2 && Math.abs(p.x) < 0.11 && p.z > med.cabezaZ - 0.04, 0.01);
    }
    uvFoto(grupo);
    ropa.add(grupo);
  }

  function anclaDe(nombre, med) {
    const mapa = {
      cabeza: new THREE.Vector3(0, med.cabezaY, 0),
      cuello: new THREE.Vector3(0, med.cuelloY, 0),
      pecho: new THREE.Vector3(0, med.pechoY, 0),
      cintura: new THREE.Vector3(0, med.cinturaY, 0),
      cadera: new THREE.Vector3(0, med.caderaY, 0),
      manoI: new THREE.Vector3(-med.mano[0], med.mano[1], med.mano[2]),
      manoD: new THREE.Vector3(med.mano[0], med.mano[1], med.mano[2]),
      pieI: new THREE.Vector3(-med.pie[0], 0.04, med.pie[1]),
      pieD: new THREE.Vector3(med.pie[0], 0.04, med.pie[1])
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
    await cuerpoPromesa;
    if (gen !== generacion) return;
    desechar(ropa);
    ropa.clear();
    cuerpo.traverse((nodo) => {
      if (/^(pie|mano|brazo|pierna|hombroCarne|nalga)/.test(nodo.name || "")) nodo.visible = true;
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
          <p class="card-kicker"><span>${item.id}</span> <span>${listo3d(item) ? "Modelo 3D" : "Pendiente"}</span></p>
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

  function exportarGlb() {
    if (!listaPuesta().length) {
      note.textContent = "Vista una prenda para exportar su modelo.";
      return;
    }
    const exportador = new GLTFExporter();
    exportador.parse(ropa, (resultado) => {
      const blob = new Blob([resultado], { type: "model/gltf-binary" });
      const enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(blob);
      enlace.download = `uniforme-${sexo}.glb`;
      enlace.click();
      URL.revokeObjectURL(enlace.href);
      note.textContent = "El GLB descargado es la camisa y el pantalón con el volumen de este maniquí.";
    }, () => {
      note.textContent = "No se pudo exportar el modelo.";
    }, { binary: true });
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
    frente: new THREE.Vector3(0, 1.02, 4.15),
    lado: new THREE.Vector3(4.15, 1.02, 0.2),
    espalda: new THREE.Vector3(0, 1.02, -4.15)
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
  document.querySelector("[data-fit-glb]")?.addEventListener("click", exportarGlb);

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
    window.dtRepintarProbador = () => {
      pintarTabs();
      pintarGrid();
      texto();
    };
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
