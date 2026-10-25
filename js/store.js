const PRODUCTS = [
  ["DT-01", "Conjunto de campaña", "Campo", 285000, 48, 12, "Pasillo A"],
  ["DT-02", "Camisola de faena", "Faena", 98000, 80, 20, "Pasillo A"],
  ["DT-03", "Pantalón de carga", "Faena", 125000, 64, 16, "Pasillo A"],
  ["DT-04", "Chaqueta cortaviento", "Abrigo", 165000, 36, 10, "Pasillo B"],
  ["DT-05", "Capa de lluvia", "Abrigo", 89000, 40, 10, "Pasillo B"],
  ["DT-06", "Polar de abrigo", "Abrigo", 110000, 42, 10, "Pasillo B"],
  ["DT-07", "Botín de marcha", "Calzado", 245000, 30, 8, "Pasillo C"],
  ["DT-08", "Guante de faena", "Equipo", 42000, 120, 24, "Pasillo D"],
  ["DT-09", "Morral de campaña", "Equipo", 198000, 28, 8, "Pasillo D"],
  ["DT-10", "Cinturón de equipo", "Equipo", 68000, 70, 15, "Pasillo D"],
  ["DT-11", "Gorra de campaña", "Campo", 38000, 90, 20, "Pasillo A"],
  ["DT-12", "Bolso de pierna", "Equipo", 92000, 34, 8, "Pasillo D"],
].map(([id, name, line, price, stock, min, place]) => ({ id, name, line, price, stock, min, place }));

const NOTES = {
  "DT-01": "Dos piezas en ripstop, con refuerzo en codo y rodilla.",
  "DT-02": "Manga larga, ventilación y espacio para identificación.",
  "DT-03": "Bolsillos de carga y refuerzo de rodilla.",
  "DT-04": "Capa exterior para clima variable.",
  "DT-05": "Impermeable con capucha regulable.",
  "DT-06": "Capa intermedia para frío.",
  "DT-07": "Soporte de tobillo y suela de agarre.",
  "DT-08": "Palma reforzada y puño ajustable.",
  "DT-09": "35 litros, espalda acolchada.",
  "DT-10": "Cinturón rígido con anillas de fijación.",
  "DT-11": "Visera estructurada y ajuste posterior.",
  "DT-12": "Acceso al equipo personal sin quitar el morral.",
};

const LINES = ["Campo", "Faena", "Abrigo", "Calzado", "Equipo"];

const KEYS = { cart: "dt-cart", orders: "dt-orders", stock: "dt-stock", admin: "dt-admin", examples: "dt-examples-v1", wa: "dt-wa", wompi: "dt-wompi", internal: "dt-internal" };
const ADMIN = { user: "delta", password: "admin123", name: "Admin" };
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const LINE_COLORS = {
  Campo: "#f4f5f6",
  Faena: "#c5c8cc",
  Abrigo: "#8d939a",
  Calzado: "#d7c4a3",
  Equipo: "#6d737a",
};
const root = /\/fichas\//.test(location.pathname) ? "../" : "";

function money(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function internalBase() {
  return String(localStorage.getItem(KEYS.internal) || "").trim();
}

function saveInternalBase(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    localStorage.removeItem(KEYS.internal);
    return "";
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const base = `${url.origin}${url.pathname}`.replace(/\/$/, "");
  localStorage.setItem(KEYS.internal, base);
  return base;
}

function notifyInternal(tipo, datos) {
  const base = internalBase();
  if (!base) return;
  fetch(`${base}/api/sitio`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ origen: "sitio-deltactica", tipo, fecha: new Date().toISOString(), datos }),
  }).catch(() => {});
}

function product(id) {
  return PRODUCTS.find((item) => item.id === String(id || "").toUpperCase());
}

function stockMap() {
  const saved = read(KEYS.stock, null);
  if (saved) return saved;
  const seeded = Object.fromEntries(PRODUCTS.map((item) => [item.id, item.stock]));
  write(KEYS.stock, seeded);
  return seeded;
}

function monthsBack(n, day) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - n);
  date.setDate(day);
  date.setHours(9, 30, 0, 0);
  return date.toISOString();
}

function orderLine(id, qty) {
  const item = product(id);
  return { id: item.id, name: item.name, price: item.price, qty };
}

function buildExample(id, date, status, customer, lines) {
  return {
    id,
    date,
    status,
    example: true,
    customer,
    lines,
    total: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
  };
}

function exampleOrders() {
  return [
    buildExample("DT-E2401", monthsBack(0, 8), "Recibido", {
      nombre: "Ana Ríos", institucion: "Escuela de instrucción", ciudad: "Bogotá",
      telefono: "3001112233", direccion: "Calle 45 # 12-30", metodo: "Transferencia", nota: "Entrega en portería.",
    }, [orderLine("DT-01", 6), orderLine("DT-11", 15)]),
    buildExample("DT-E2402", monthsBack(0, 18), "En preparación", {
      nombre: "Luis Herrera", institucion: "Grupo de custodia", ciudad: "Medellín",
      telefono: "3012223344", direccion: "Carrera 70 # 44-18", metodo: "Pago contraentrega", nota: "",
    }, [orderLine("DT-09", 4), orderLine("DT-08", 20)]),
    buildExample("DT-E2318", monthsBack(1, 6), "Despachado", {
      nombre: "Marta Gil", institucion: "Centro de formación", ciudad: "Cali",
      telefono: "3023334455", direccion: "Avenida 6N # 28-40", metodo: "Transferencia", nota: "",
    }, [orderLine("DT-04", 8), orderLine("DT-06", 10)]),
    buildExample("DT-E2311", monthsBack(1, 21), "Entregado", {
      nombre: "Pedro Salas", institucion: "Unidad de apoyo", ciudad: "Barranquilla",
      telefono: "3045556677", direccion: "Calle 84 # 51-20", metodo: "Transferencia", nota: "",
    }, [orderLine("DT-03", 14), orderLine("DT-02", 10)]),
    buildExample("DT-E2204", monthsBack(2, 11), "Entregado", {
      nombre: "Elena Cruz", institucion: "Programa de marcha", ciudad: "Bucaramanga",
      telefono: "3056667788", direccion: "Carrera 27 # 34-10", metodo: "Pago contraentrega", nota: "",
    }, [orderLine("DT-07", 10)]),
    buildExample("DT-E2209", monthsBack(2, 24), "Entregado", {
      nombre: "Julián Mora", institucion: "Base de entrenamiento", ciudad: "Pereira",
      telefono: "3107778899", direccion: "Calle 19 # 8-55", metodo: "Transferencia", nota: "",
    }, [orderLine("DT-02", 18), orderLine("DT-10", 12)]),
    buildExample("DT-E2116", monthsBack(3, 9), "Entregado", {
      nombre: "Sofía León", institucion: "Curso de campo", ciudad: "Manizales",
      telefono: "3118889900", direccion: "Avenida Santander # 62-15", metodo: "Transferencia", nota: "",
    }, [orderLine("DT-01", 4), orderLine("DT-05", 12)]),
    buildExample("DT-E2007", monthsBack(4, 15), "Entregado", {
      nombre: "Camilo Díaz", institucion: "Dotación interna", ciudad: "Bogotá",
      telefono: "3129990011", direccion: "Carrera 15 # 93-40", metodo: "Transferencia", nota: "",
    }, [orderLine("DT-12", 10), orderLine("DT-08", 30)]),
    buildExample("DT-E1903", monthsBack(5, 5), "Entregado", {
      nombre: "Ricardo Peña", institucion: "Jornada de abrigo", ciudad: "Cali",
      telefono: "3131213141", direccion: "Calle 5 # 40-22", metodo: "Pago contraentrega", nota: "",
    }, [orderLine("DT-07", 6), orderLine("DT-04", 5)]),
  ];
}

function orders() {
  const saved = read(KEYS.orders, null);
  if (localStorage.getItem(KEYS.examples) !== "1") {
    const current = Array.isArray(saved) ? saved : [];
    const ids = new Set(current.map((order) => order.id));
    const next = [...exampleOrders().filter((order) => !ids.has(order.id)), ...current];
    write(KEYS.orders, next);
    localStorage.setItem(KEYS.examples, "1");
    return next;
  }
  if (Array.isArray(saved)) return saved;
  write(KEYS.orders, []);
  return [];
}

function cart() {
  return read(KEYS.cart, []);
}

function saveCart(items) {
  write(KEYS.cart, items);
  paintCount();
}

function available(id) {
  return stockMap()[id] ?? 0;
}

function addToCart(id, qty) {
  const item = product(id);
  const amount = Math.max(1, Number(qty) || 1);
  if (!item) return "Esa referencia no está en la línea.";
  const items = cart();
  const current = items.find((line) => line.id === item.id);
  const next = (current ? current.qty : 0) + amount;
  if (next > available(item.id)) {
    return `En bodega hay ${available(item.id)} de ${item.id}.`;
  }
  if (current) current.qty = next;
  else items.push({ id: item.id, qty: amount });
  saveCart(items);
  return "";
}

function setQty(id, qty) {
  const items = cart().filter((line) => line.id !== id);
  const next = Math.max(0, Number(qty) || 0);
  if (next > 0) {
    if (next > available(id)) return `En bodega hay ${available(id)} de ${id}.`;
    items.push({ id, qty: next });
  }
  saveCart(items);
  return "";
}

function cartCount() {
  return cart().reduce((sum, line) => sum + line.qty, 0);
}

function cartTotal() {
  return cart().reduce((sum, line) => sum + line.qty * (product(line.id)?.price || 0), 0);
}

function paintCount() {
  const count = cartCount();
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = count ? ` ${count}` : "";
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function placeOrder(customer) {
  const lines = cart().map((line) => {
    const item = product(line.id);
    return { id: line.id, name: item.name, price: item.price, qty: line.qty };
  });
  if (!lines.length) return null;
  for (const line of lines) {
    if (line.qty > available(line.id)) return null;
  }
  const stock = stockMap();
  lines.forEach((line) => {
    stock[line.id] -= line.qty;
  });
  customer.pago = customer.metodo === "Pago en línea Wompi"
    ? (wompiReady() ? "Pendiente de pago en Wompi" : "Wompi queda abierto. El asesor confirma el cobro hasta tener las llaves.")
    : "Por confirmar con el asesor";
  const order = {
    id: `DT-${String(Date.now()).slice(-6)}`,
    date: new Date().toISOString(),
    customer,
    lines,
    total: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
    status: "Recibido",
  };
  write(KEYS.stock, stock);
  write(KEYS.orders, [order, ...orders()]);
  saveCart([]);
  notifyInternal("pedido", order);
  notifyInternal("existencia", stock);
  return order;
}

function paintPrices() {
  document.querySelectorAll("[data-price]").forEach((node) => {
    const item = product(node.dataset.price);
    if (item) node.textContent = money(item.price);
  });
  document.querySelectorAll("[data-stock]").forEach((node) => {
    const item = product(node.dataset.stock);
    if (!item) return;
    const left = available(item.id);
    node.textContent = left ? `Existencia en bodega: ${left}` : "Sin existencia en bodega";
  });
}

function renderCart() {
  const rootNode = document.querySelector("[data-cart-root]");
  if (!rootNode) return;
  const lines = cart();
  if (!lines.length) {
    rootNode.innerHTML = `<p class="lead">El carrito está vacío.</p><a class="btn btn-metal" href="${root}catalogo.html">Ir al catálogo</a>`;
    return;
  }
  const rows = lines.map((line) => {
    const item = product(line.id);
    return `<tr>
      <td><div class="cart-product"><img src="${root}img/productos/${item.id.toLowerCase()}.jpg" alt=""><div><strong>${escapeHtml(item.name)}</strong><span>${item.id} · ${escapeHtml(item.line)}</span></div></div></td>
      <td>${money(item.price)}</td>
      <td><div class="qty"><button type="button" data-qty-change="${item.id}" data-dir="-1" aria-label="Restar una unidad">−</button><span>${line.qty}</span><button type="button" data-qty-change="${item.id}" data-dir="1" aria-label="Sumar una unidad">+</button></div></td>
      <td>${money(item.price * line.qty)}</td>
      <td><button class="linkish" type="button" data-remove="${item.id}">Quitar</button></td>
    </tr>`;
  }).join("");
  rootNode.innerHTML = `<table class="cart-table"><thead><tr><th>Artículo</th><th>Precio</th><th>Cantidad</th><th>Total</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    <div class="cart-foot"><button class="linkish" type="button" data-clear-cart>Vaciar carrito</button><div><p class="eyebrow">Total</p><p class="cart-total">${money(cartTotal())}</p></div></div>
    <div class="hero-actions"><a class="btn btn-metal" href="${root}compra.html">Continuar con los datos del cliente</a></div>
    <p class="admin-note">El siguiente paso pide quién pide, quién recibe y la dirección. Sin esos datos el pedido no sigue.</p>
    <p class="admin-note" data-cart-msg></p>`;
  applyPhotos();
}

function renderCheckout() {
  const summary = document.querySelector("[data-checkout-summary]");
  const form = document.querySelector("[data-checkout-form]");
  const done = document.querySelector("[data-order-done]");
  if (!summary || !form || !done) return;
  const params = new URLSearchParams(location.search);
  const orderId = params.get("pedido");
  if (orderId) {
    const order = orders().find((item) => item.id === orderId);
    form.hidden = true;
    summary.hidden = true;
    document.querySelector(".checkout-grid")?.setAttribute("hidden", "");
    done.hidden = false;
    document.querySelectorAll(".buy-steps li").forEach((item, index) => {
      item.classList.toggle("is-on", index === 2);
    });
    const heading = document.querySelector(".page-hero h1");
    if (heading) heading.textContent = "Recibo";
    if (!order) {
      done.innerHTML = `<p class="lead">No está ese pedido en este navegador.</p>`;
      return;
    }
    done.innerHTML = receiptView(order);
    mountWompi(order);
    return;
  }
  if (!cart().length) {
    location.href = `${root}carrito.html`;
    return;
  }
  const rows = cart().map((line) => {
    const item = product(line.id);
    return `<tr><td>${escapeHtml(item.name)}</td><td>${line.qty}</td><td>${money(item.price * line.qty)}</td></tr>`;
  }).join("");
  summary.innerHTML = `<p class="eyebrow">Resumen</p><table class="summary-line"><tbody>${rows}</tbody></table><p class="cart-total">${money(cartTotal())}</p>`;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const customer = {
      nombre: String(data.get("nombre") || "").trim(),
      institucion: String(data.get("institucion") || "").trim(),
      telefono: String(data.get("telefono") || "").trim(),
      recibe: String(data.get("recibe") || "").trim(),
      telefonoEnvio: String(data.get("telefonoEnvio") || "").trim(),
      departamento: String(data.get("departamento") || "").trim(),
      ciudad: String(data.get("ciudad") || "").trim(),
      direccion: String(data.get("direccion") || "").trim(),
      barrio: String(data.get("barrio") || "").trim(),
      indicaciones: String(data.get("indicaciones") || "").trim(),
      metodo: String(data.get("metodo") || ""),
      nota: String(data.get("nota") || "").trim(),
    };
    const status = form.querySelector("[data-status]");
    if (!customer.recibe || !customer.telefonoEnvio || !customer.departamento || !customer.ciudad || !customer.direccion || !customer.barrio) {
      status.textContent = "Faltan datos de envío. Complete quién recibe, teléfonos, departamento, ciudad, dirección y barrio.";
      return;
    }
    const order = placeOrder(customer);
    if (!order) {
      status.textContent = "La bodega ya no alcanza para este pedido. Revise el carrito.";
      return;
    }
    status.textContent = "Se está armando el recibo en PDF.";
    window.open(waLink(receiptText(order)), "_blank", "noopener,noreferrer");
    downloadReceipt(order).catch(() => {}).finally(() => {
      location.href = `${root}compra.html?pedido=${order.id}`;
    });
  });
  const paySelect = form.querySelector("[name=metodo]");
  const payNote = form.querySelector("[data-pay-note]");
  const paintPay = () => {
    if (!payNote || !paySelect) return;
    if (paySelect.value !== "Pago en línea Wompi") {
      payNote.textContent = "Transferencia y contraentrega las confirma el asesor por WhatsApp.";
      return;
    }
    payNote.textContent = wompiReady()
      ? "Al confirmar se descarga el PDF y se abre Wompi para pagar este pedido."
      : "Wompi está preparado en este pedido. El cobro en línea se conecta cuando el panel guarde la llave pública y el secreto de integridad.";
  };
  if (paySelect && !paySelect.dataset.bound) {
    paySelect.dataset.bound = "1";
    paySelect.addEventListener("change", paintPay);
  }
  paintPay();
  brandAssets().catch(() => {});
}

function waLink(text) {
  return `https://wa.me/${advisorPhone()}?text=${encodeURIComponent(text)}`;
}

function receiptText(order) {
  const customer = order.customer;
  const lines = order.lines.map((line) => `${line.id} ${line.name} x${line.qty} · ${money(line.price * line.qty)}`).join("\n");
  return [
    `Recibo Deltactica ${order.id}`,
    new Date(order.date).toLocaleString("es-CO"),
    "",
    lines,
    `Total: ${money(order.total)}`,
    `Pago: ${customer.metodo || ""}`,
    "",
    "Envío",
    `Recibe: ${customer.recibe || customer.nombre}`,
    `Teléfono de entrega: ${customer.telefonoEnvio || customer.telefono || ""}`,
    customer.direccion || "",
    [customer.barrio, customer.ciudad, customer.departamento].filter(Boolean).join(", "),
    customer.indicaciones ? `Indicaciones: ${customer.indicaciones}` : "",
    "",
    `Pide: ${customer.nombre}${customer.institucion ? ` · ${customer.institucion}` : ""}`,
    `Contacto: ${customer.telefono || ""}`,
    customer.nota ? `Nota: ${customer.nota}` : "",
    customer.pago || "",
    "El recibo en PDF lleva este mismo número.",
  ].filter((line) => line !== "").join("\n");
}

function receiptView(order) {
  const customer = order.customer;
  const rows = order.lines.map((line) => `<tr><td>${escapeHtml(line.id)}</td><td>${escapeHtml(line.name)}</td><td>${line.qty}</td><td>${money(line.price)}</td><td>${money(line.price * line.qty)}</td></tr>`).join("");
  const link = waLink(receiptText(order));
  return `<article class="receipt">
    <header class="receipt-banner"><img class="receipt-logo" src="${root}img/logo.png" alt="Deltactica"><div><p class="eyebrow">Recibo</p><h2>${escapeHtml(order.id)}</h2><p>${new Date(order.date).toLocaleString("es-CO")}</p></div></header>
    <table class="summary-line"><thead><tr><th>Ref.</th><th>Artículo</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="cart-total">${money(order.total)}</p>
    <p>Pago: ${escapeHtml(customer.metodo || "")}</p>
    ${customer.pago ? `<p>${escapeHtml(customer.pago)}</p>` : ""}
    <div class="receipt-ship">
      <p class="eyebrow">Envío</p>
      <p>${escapeHtml(customer.recibe || customer.nombre)}</p>
      <p>${escapeHtml(customer.telefonoEnvio || customer.telefono || "")}</p>
      <p>${escapeHtml(customer.direccion || "")}</p>
      <p>${escapeHtml([customer.barrio, customer.ciudad, customer.departamento].filter(Boolean).join(", "))}</p>
      ${customer.indicaciones ? `<p>${escapeHtml(customer.indicaciones)}</p>` : ""}
    </div>
    <p>${escapeHtml(customer.nombre)}${customer.institucion ? ` · ${escapeHtml(customer.institucion)}` : ""} · ${escapeHtml(customer.telefono || "")}</p>
    <div data-wompi-slot></div>
    <div class="receipt-actions">
      <button class="btn btn-metal" type="button" data-download-receipt="${escapeHtml(order.id)}">Descargar PDF</button>
      <a class="btn btn-ghost" href="${link}" target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a>
      <a class="btn btn-ghost" href="${root}catalogo.html">Volver al catálogo</a>
    </div>
  </article>`;
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  if (digits.length === 12 && digits.startsWith("57")) return digits;
  return "";
}

function advisorPhone() {
  return normalizePhone(localStorage.getItem(KEYS.wa)) || normalizePhone(document.body && document.body.dataset.wa) || "573227043082";
}

function prettyPhone(digits) {
  const local = String(digits || "").replace(/^57/, "");
  if (local.length === 10) return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  return digits;
}

function applyAdvisorPhone() {
  const phone = advisorPhone();
  if (document.body) document.body.dataset.wa = phone;
  document.querySelectorAll("[data-wa-text]").forEach((link) => {
    link.href = `https://wa.me/${phone}?text=${encodeURIComponent(link.dataset.waText || "")}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
  return phone;
}

function wompiConfig() {
  const saved = read(KEYS.wompi, {});
  return {
    publicKey: String(saved.publicKey || "").trim(),
    integrity: String(saved.integrity || "").trim(),
  };
}

function wompiReady() {
  const config = wompiConfig();
  return Boolean(config.publicKey && config.integrity);
}

function ensurePdf() {
  if (window.DTPDF) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${root}js/pdf.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("pdf"));
    document.head.appendChild(script);
  });
}

function downloadBlob(blob, name) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

async function brandAssets() {
  await ensurePdf();
  const [logo, wordmark] = await Promise.all([
    window.DTPDF.loadJpeg(`${root}img/logo.png`, "#070708").catch(() => null),
    window.DTPDF.loadJpeg(`${root}img/wordmark.png`, "#070708").catch(() => null),
  ]);
  return { logo, wordmark, phone: prettyPhone(advisorPhone()), money };
}

async function downloadReceipt(order) {
  const assets = await brandAssets();
  const blob = await window.DTPDF.receipt(order, assets);
  downloadBlob(blob, `deltactica-recibo-${order.id}.pdf`);
}

async function wompiSignature(reference, amount, currency, secret) {
  const encoded = new TextEncoder().encode(`${reference}${amount}${currency}${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function mountWompi(order) {
  const host = document.querySelector("[data-wompi-slot]");
  if (!host || !order || order.customer.metodo !== "Pago en línea Wompi") return;
  if (!wompiReady()) {
    host.innerHTML = `<p class="admin-note">La pasarela Wompi queda abierta en este pedido. El cobro en línea se activa cuando el panel tenga la llave pública y el secreto de integridad.</p>`;
    return;
  }
  const config = wompiConfig();
  const amount = Math.round(order.total * 100);
  const signature = await wompiSignature(order.id, amount, "COP", config.integrity);
  host.innerHTML = `<p class="eyebrow">Pago en línea</p><p class="admin-note">Wompi cobra ${money(order.total)} con la referencia ${escapeHtml(order.id)}.</p><div data-wompi-button></div>`;
  const script = document.createElement("script");
  script.src = "https://checkout.wompi.co/widget.js";
  script.async = true;
  script.setAttribute("data-render", "button");
  script.setAttribute("data-public-key", config.publicKey);
  script.setAttribute("data-currency", "COP");
  script.setAttribute("data-amount-in-cents", String(amount));
  script.setAttribute("data-reference", order.id);
  script.setAttribute("data-signature:integrity", signature);
  host.querySelector("[data-wompi-button]").appendChild(script);
}

function currentUser() {
  const raw = sessionStorage.getItem(KEYS.admin);
  if (!raw || raw === "1") return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.user === ADMIN.user ? ADMIN : null;
  } catch {
    return null;
  }
}

function shortMoney(value) {
  if (value >= 1000000) {
    return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value / 1000000)} M`;
  }
  if (value >= 1000) {
    return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value / 1000)} mil`;
  }
  return money(value);
}

function recentMonths(count = 6) {
  const now = new Date();
  const months = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${date.getFullYear()}-${date.getMonth()}`, label: MONTHS[date.getMonth()] });
  }
  return months;
}

function salesByMonth(list) {
  return recentMonths().map((month) => ({
    label: month.label,
    value: list.filter((order) => {
      const date = new Date(order.date);
      return `${date.getFullYear()}-${date.getMonth()}` === month.key;
    }).reduce((sum, order) => sum + order.total, 0),
  }));
}

function salesByLine(list) {
  return LINES.map((line) => ({
    label: line,
    color: LINE_COLORS[line],
    value: list.reduce((sum, order) => sum + order.lines.reduce((lineSum, item) => {
      const found = product(item.id);
      return found && found.line === line ? lineSum + item.price * item.qty : lineSum;
    }, 0), 0),
  }));
}

let chartSeq = 0;

function barChart(series, label) {
  chartSeq += 1;
  const gid = `barMetal${chartSeq}`;
  const width = 560;
  const height = 210;
  const pad = 36;
  const max = Math.max(...series.map((item) => item.value), 1);
  const gap = 12;
  const barWidth = (width - pad * 2 - gap * (series.length - 1)) / series.length;
  const bars = series.map((item, index) => {
    const barHeight = Math.max(2, (item.value / max) * 130);
    const x = pad + index * (barWidth + gap);
    const y = 158 - barHeight;
    return `<g>
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" fill="url(#${gid})" rx="1"></rect>
      <text x="${(x + barWidth / 2).toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" fill="#f3f4f5" font-size="12" font-family="Outfit, sans-serif">${shortMoney(item.value)}</text>
      <text x="${(x + barWidth / 2).toFixed(1)}" y="184" text-anchor="middle" fill="#9aa0a6" font-size="13" font-family="Barlow Condensed, sans-serif" letter-spacing="1">${item.label}</text>
    </g>`;
  }).join("");
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(label)}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.48" stop-color="#c5c8cc"/><stop offset="1" stop-color="#8d939a"/></linearGradient></defs>
    <line x1="${pad}" y1="158" x2="${width - pad}" y2="158" stroke="rgba(232,233,235,0.18)"></line>
    ${bars}
  </svg>`;
}

function donutChart(parts, label) {
  const active = parts.filter((part) => part.value > 0);
  const total = active.reduce((sum, part) => sum + part.value, 0) || 1;
  const cx = 100;
  const cy = 100;
  const radius = 78;
  const inner = 48;
  let start = -Math.PI / 2;
  const slices = active.map((part) => {
    const angle = (part.value / total) * Math.PI * 2;
    const end = start + Math.min(angle, Math.PI * 2 - 0.0001);
    const large = end - start > Math.PI ? 1 : 0;
    const point = (angle, size) => [cx + Math.cos(angle) * size, cy + Math.sin(angle) * size];
    const [x1, y1] = point(start, radius);
    const [x2, y2] = point(end, radius);
    const [x3, y3] = point(end, inner);
    const [x4, y4] = point(start, inner);
    start = end;
    return `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z" fill="${part.color}"><title>${escapeHtml(part.label)}: ${money(part.value)}</title></path>`;
  }).join("");
  return `<svg class="chart donut" viewBox="0 0 200 200" role="img" aria-label="${escapeHtml(label)}">${slices}<text x="100" y="96" text-anchor="middle" fill="#9aa0a6" font-size="11" font-family="Barlow Condensed, sans-serif" letter-spacing="1">TOTAL</text><text x="100" y="116" text-anchor="middle" fill="#f3f4f5" font-size="16" font-family="Barlow Condensed, sans-serif">${shortMoney(active.reduce((sum, part) => sum + part.value, 0))}</text></svg>`;
}

function legend(parts) {
  return `<ul class="legend">${parts.map((part) => `<li><i style="background:${part.color}"></i><span>${escapeHtml(part.label)}</span><b>${money(part.value)}</b></li>`).join("")}</ul>`;
}

function meterList(parts) {
  const max = Math.max(...parts.map((part) => part.value), 1);
  return `<ul class="meters">${parts.map((part) => `<li><span>${escapeHtml(part.label)}</span><div class="meter" aria-hidden="true"><i class="${part.warn ? "is-low" : ""}" style="width:${Math.max(2, Math.round((part.value / max) * 100))}%"></i></div><em>${escapeHtml(part.display)}</em></li>`).join("")}</ul>`;
}

function closeAccounts() {
  document.querySelectorAll("[data-account-menu]").forEach((menu) => {
    menu.hidden = true;
  });
  document.querySelectorAll("[data-account-toggle]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function paintAccount() {
  const session = currentUser();
  document.querySelectorAll("[data-account-link]").forEach((link) => {
    link.hidden = Boolean(session);
  });
  document.querySelectorAll("[data-account-toggle]").forEach((button) => {
    button.hidden = !session;
    if (!session) button.setAttribute("aria-expanded", "false");
  });
  document.querySelectorAll("[data-account-label]").forEach((node) => {
    node.textContent = session ? session.name : "Iniciar sesión";
  });
  document.querySelectorAll("[data-account-menu]").forEach((menu) => {
    if (!session) {
      menu.hidden = true;
      menu.innerHTML = "";
      return;
    }
    menu.innerHTML = `<p class="account-kicker">Sesión abierta</p><p class="account-role">Admin</p><a href="${root}admin.html">Abrir panel</a><button type="button" data-logout>Salir</button>`;
  });
  const userField = document.querySelector("[data-admin-login] [name=usuario]");
  if (userField && !session) {
    userField.value = ADMIN.user;
    userField.setAttribute("autocomplete", "off");
  }
  const who = document.querySelector("[data-admin-who]");
  if (who && session) {
    who.textContent = "Los ejemplos y los pedidos de este navegador se leen juntos.";
  }
}

function logout() {
  sessionStorage.removeItem(KEYS.admin);
  closeAccounts();
  paintAccount();
  if (document.querySelector("[data-admin-login]")) renderAdmin();
}

const photoUrls = new Map();

function photoDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dt-photos", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idFromFileName(name) {
  const match = String(name || "").toUpperCase().match(/DT[\s_-]?(\d{1,2})(?!\d)/);
  if (!match) return "";
  const id = `DT-${match[1].padStart(2, "0")}`;
  return product(id) ? id : "";
}

function rememberPhoto(id, blob) {
  const previous = photoUrls.get(id);
  if (previous) URL.revokeObjectURL(previous);
  if (blob) photoUrls.set(id, URL.createObjectURL(blob));
  else photoUrls.delete(id);
}

async function loadPhotos() {
  const db = await photoDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readonly");
    const request = tx.objectStore("photos").openCursor();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve();
        return;
      }
      rememberPhoto(cursor.key, cursor.value);
      cursor.continue();
    };
  });
}

async function savePhotoFiles(files) {
  const db = await photoDb();
  const matched = [];
  const skipped = [];
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    const store = tx.objectStore("photos");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    [...files].forEach((file) => {
      const image = file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(file.name);
      const id = image ? idFromFileName(file.name) : "";
      if (!id) {
        if (file.name) skipped.push(file.name);
        return;
      }
      store.put(file, id);
      rememberPhoto(id, file);
      matched.push(id);
    });
  });
  return { matched: [...new Set(matched)], skipped };
}

async function removePhoto(id) {
  const db = await photoDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.objectStore("photos").delete(id);
  });
  rememberPhoto(id, null);
}

async function clearPhotos() {
  const db = await photoDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.objectStore("photos").clear();
  });
  photoUrls.forEach((url) => URL.revokeObjectURL(url));
  photoUrls.clear();
}

function applyPhotos() {
  document.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    const match = src.match(/productos\/(dt-\d{2})\./i);
    if (!match) return;
    const url = photoUrls.get(match[1].toUpperCase());
    if (!url) return;
    img.dataset.photoBase = src;
    img.src = url;
  });
}

function paintPhotoDesk() {
  const grid = document.querySelector("[data-photo-grid]");
  if (!grid) return;
  grid.innerHTML = PRODUCTS.map((item) => {
    const custom = photoUrls.has(item.id);
    const src = custom ? photoUrls.get(item.id) : `${root}img/productos/${item.id.toLowerCase()}.jpg`;
    return `<figure class="photo-card"><img src="${src}" alt="${escapeHtml(item.name)}"><figcaption><strong>${item.id}</strong> ${escapeHtml(item.name)}${custom ? "<em>Cargada</em>" : ""}</figcaption>${custom ? `<button class="linkish" type="button" data-photo-remove="${item.id}">Quitar</button>` : ""}</figure>`;
  }).join("");
}

function photoStatus(matched, skipped) {
  const status = document.querySelector("[data-photo-status]");
  if (!status) return;
  const ready = matched.length === 1 ? "1 imagen quedó en su referencia" : `${matched.length} imágenes quedaron en su referencia`;
  const names = matched.length ? `: ${matched.join(", ")}.` : ".";
  const ignored = skipped.length
    ? ` ${skipped.length} ${skipped.length === 1 ? "archivo no tenía" : "archivos no tenían"} una referencia DT-01, DT-02…`
    : "";
  status.textContent = matched.length ? `${ready}${names}${ignored}` : `Ningún archivo coincidió con una referencia.${ignored}`;
}

async function filesFromZip(file) {
  if (!/\.zip$/i.test(file.name) || typeof DecompressionStream === "undefined") return [];
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let end = -1;
  const scan = Math.max(0, bytes.length - 22 - 0xffff);
  for (let index = bytes.length - 22; index >= scan; index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) {
      end = index;
      break;
    }
  }
  if (end < 0) return [];
  const count = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  const files = [];
  for (let index = 0; index < count; index += 1) {
    if (cursor + 46 > bytes.length || view.getUint32(cursor, true) !== 0x02014b50) break;
    const method = view.getUint16(cursor + 10, true);
    const size = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    cursor += 46 + nameLength + extraLength + commentLength;
    if (!name || name.endsWith("/")) continue;
    const localName = view.getUint16(localOffset + 26, true);
    const localExtra = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localName + localExtra;
    const compressed = bytes.subarray(start, start + size);
    let raw = compressed;
    if (method === 8) {
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      raw = new Uint8Array(await new Response(stream).arrayBuffer());
    } else if (method !== 0) {
      continue;
    }
    const base = name.split("/").pop();
    const type = /\.png$/i.test(base) ? "image/png" : /\.webp$/i.test(base) ? "image/webp" : /\.jpe?g$/i.test(base) ? "image/jpeg" : "";
    files.push(new File([raw], base, { type }));
  }
  return files;
}

async function expandUploads(files) {
  const ready = [];
  for (const file of files) {
    if (/\.zip$/i.test(file.name)) ready.push(...await filesFromZip(file));
    else ready.push(file);
  }
  return ready;
}

async function filesFromList(items) {
  const files = [];
  const walk = async (entry) => {
    if (!entry) return;
    if (entry.isFile) {
      files.push(await new Promise((resolve, reject) => entry.file(resolve, reject)));
      return;
    }
    if (!entry.isDirectory) return;
    const reader = entry.createReader();
    let batch = [];
    do {
      batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
      for (const child of batch) await walk(child);
    } while (batch.length);
  };
  for (const item of items) {
    const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
    if (entry) await walk(entry);
  }
  return files;
}

function renderAdmin() {
  const login = document.querySelector("[data-admin-login]");
  const shell = document.querySelector("[data-admin-shell]");
  if (!login || !shell) return;
  const session = currentUser();
  const open = Boolean(session);
  login.hidden = open;
  shell.hidden = !open;
  paintAccount();
  if (!open) {
    if (!login.dataset.bound) {
      login.dataset.bound = "1";
      login.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(login);
        const error = login.querySelector("[data-admin-error]");
        const user = String(data.get("usuario") || "").trim();
        const pass = String(data.get("clave") || "");
        if (user !== ADMIN.user || pass !== ADMIN.password) {
          error.textContent = "El usuario o la contraseña no coinciden.";
          return;
        }
        error.textContent = "";
        sessionStorage.setItem(KEYS.admin, JSON.stringify({ user: ADMIN.user, name: ADMIN.name }));
        renderAdmin();
      });
    }
    return;
  }

  const list = orders().slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const stock = stockMap();
  const sold = list.reduce((sum, order) => sum + order.total, 0);
  const pending = list.filter((order) => order.status !== "Entregado").length;
  const low = PRODUCTS.filter((item) => (stock[item.id] ?? 0) <= item.min);
  const units = Object.values(stock).reduce((sum, value) => sum + value, 0);
  const byMonth = salesByMonth(list);
  const byLine = salesByLine(list);
  const byStatus = ["Recibido", "En preparación", "Despachado", "Entregado"].map((status) => ({
    label: status,
    value: list.filter((order) => order.status === status).length,
    display: String(list.filter((order) => order.status === status).length),
  }));
  const byPlace = LINES.map((line) => {
    const items = PRODUCTS.filter((item) => item.line === line);
    const total = items.reduce((sum, item) => sum + (stock[item.id] ?? 0), 0);
    const warn = items.some((item) => (stock[item.id] ?? 0) <= item.min);
    return { label: line, value: total, display: String(total), warn };
  });

  const general = document.querySelector('[data-admin-panel="general"]');
  const sales = document.querySelector('[data-admin-panel="ventas"]');
  const warehouse = document.querySelector('[data-admin-panel="bodega"]');
  const wompi = wompiConfig();
  const localPhone = advisorPhone().replace(/^57/, "");
  general.innerHTML = `<div class="chart-grid">
      <article class="admin-block"><p class="eyebrow">Asesor comercial</p><p class="admin-note">Este WhatsApp recibe los pedidos y atiende el botón del sitio.</p><form class="panel-form" data-wa-form><label>Número<input name="wa" inputmode="numeric" autocomplete="tel" required value="${escapeHtml(localPhone)}"></label><button class="btn btn-metal" type="submit">Guardar número</button></form><p data-wa-status></p></article>
      <article class="admin-block"><p class="eyebrow">Pasarela Wompi</p><p class="admin-note">Cuando el comercio tenga las llaves, péguelas aquí. El pago en línea del pedido usa esa pasarela.</p><form class="panel-form" data-wompi-form><label>Llave pública<input name="publicKey" autocomplete="off" value="${escapeHtml(wompi.publicKey)}" placeholder="pub_test_ o pub_prod_"></label><label>Secreto de integridad<input name="integrity" autocomplete="off" value="${escapeHtml(wompi.integrity)}"></label><button class="btn btn-metal" type="submit">Guardar Wompi</button></form><p data-wompi-status>${wompi.publicKey && wompi.integrity ? "Wompi está listo para cobrar en el pedido." : "Wompi queda abierto hasta tener las llaves."}</p></article>
      <article class="admin-block span-row"><p class="eyebrow">Software interno</p><p class="admin-note">A partir de diciembre o enero este sitio le enviará pedidos, existencia, el WhatsApp del asesor y el aviso de pago. Pegue la dirección cuando el software exista. Vacía, la compra sigue en este navegador.</p><form class="panel-form" data-internal-form><label>Dirección<input name="base" inputmode="url" autocomplete="off" placeholder="https://api.deltactica.com" value="${escapeHtml(internalBase())}"></label><button class="btn btn-metal" type="submit">Guardar dirección</button></form><p data-internal-status>${internalBase() ? `La comunicación apunta a ${escapeHtml(internalBase())}.` : "La comunicación queda abierta. Aún no hay dirección."}</p></article>
    </div><div class="stats">
      <article class="stat"><span>Referencias</span><strong>${PRODUCTS.length}</strong></article>
      <article class="stat"><span>Unidades</span><strong>${units}</strong></article>
      <article class="stat"><span>Pedidos</span><strong>${list.length}</strong></article>
      <article class="stat"><span>Ventas</span><strong class="stat-money">${money(sold)}</strong></article>
      <article class="stat"><span>Por despachar</span><strong>${pending}</strong></article>
      <article class="stat"><span>Por reponer</span><strong>${low.length}</strong></article>
    </div>
    <div class="chart-grid">
      <article class="admin-block"><p class="eyebrow">Ventas por mes</p><p class="admin-note">Seis meses, con los ejemplos y los pedidos de este navegador.</p>${barChart(byMonth, "Ventas de los últimos seis meses")}</article>
      <article class="admin-block"><p class="eyebrow">Ventas por línea</p><div class="donut-row">${donutChart(byLine, "Ventas por línea")}${legend(byLine)}</div></article>
    </div>
    <div class="chart-grid">
      <article class="admin-block"><p class="eyebrow">Estado de pedidos</p>${meterList(byStatus)}</article>
      <article class="admin-block"><p class="eyebrow">Unidades por línea</p><p class="admin-note">${low.length ? `Reponer ${low.map((item) => item.id).join(", ")}.` : "Ninguna referencia está en el mínimo."}</p>${meterList(byPlace)}</article>
    </div>`;

  const saleRows = list.length
    ? list.map((order) => `<tr><td>${escapeHtml(order.id)}${order.example ? '<span class="example-tag">Ejemplo</span>' : ""}</td><td>${new Date(order.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}</td><td>${escapeHtml(order.customer.nombre)}<br>${escapeHtml(order.customer.institucion || "")}</td><td>${escapeHtml(order.customer.ciudad)}<br>${escapeHtml(order.customer.metodo || "")}</td><td>${money(order.total)}</td><td><select class="status-select" data-status="${escapeHtml(order.id)}">${["Recibido", "En preparación", "Despachado", "Entregado"].map((status) => `<option style="background:#141416;color:#f3f4f5" ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select></td></tr>`).join("")
    : `<tr><td colspan="6">Todavía no hay pedidos.</td></tr>`;
  sales.innerHTML = `<div class="chart-grid chart-grid-sales"><article class="admin-block"><p class="eyebrow">Ventas por mes</p>${barChart(byMonth, "Ventas de los últimos seis meses")}</article><article class="admin-block"><p class="eyebrow">Por cobrar y despachar</p><p class="admin-note">Total ${money(sold)}. ${pending} pedidos siguen abiertos.</p>${meterList(byStatus)}</article></div><div class="admin-block"><p class="eyebrow">Pedidos</p><p class="admin-note">Los marcados como ejemplo ilustran el panel. Una compra confirmada entra en la misma tabla.</p><div class="table-wrap"><table class="admin-table"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Ciudad</th><th>Total</th><th>Estado</th></tr></thead><tbody>${saleRows}</tbody></table></div></div>`;

  const scale = Math.max(...PRODUCTS.map((item) => Math.max(stock[item.id] ?? 0, item.min)), 1);
  const stockMeters = PRODUCTS.map((item) => {
    const left = stock[item.id] ?? 0;
    const width = Math.max(2, Math.round((left / scale) * 100));
    const mark = Math.round((item.min / scale) * 100);
    return `<li class="${left <= item.min ? "low" : ""}"><span>${item.id}</span><div class="meter" aria-hidden="true"><i class="${left <= item.min ? "is-low" : ""}" style="width:${width}%"></i><b style="left:${mark}%"></b></div><em>${left}</em></li>`;
  }).join("");
  const stockRows = PRODUCTS.map((item) => {
    const left = stock[item.id] ?? 0;
    const mark = left <= item.min ? "low" : "";
    return `<tr class="${mark}"><td>${item.id}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.line)}</td><td>${escapeHtml(item.place)}</td><td>${item.min}</td><td><form class="stock-edit" data-stock-form="${item.id}"><input name="qty" type="number" min="0" value="${left}" aria-label="Existencia de ${item.id}"><button class="linkish" type="submit">Guardar</button></form></td><td>${left <= item.min ? "Reponer" : "Disponible"}</td></tr>`;
  }).join("");
  warehouse.innerHTML = `<div class="admin-block"><p class="eyebrow">Imágenes del catálogo</p><p class="admin-note">En Drive use Descargar. Si baja un .zip, súbalo tal cual. Si baja la carpeta ya abierta, use Subir carpeta. Cada archivo tiene que llamarse como la referencia: DT-01.jpg, DT-02.png o DT-12.webp. La foto entra sola en su ficha, en el catálogo y en el carrito de este navegador.</p><div class="photo-drop" data-photo-drop><p>Suelte aquí la carpeta o las imágenes.</p><div class="photo-actions"><label class="btn btn-metal">Subir carpeta<input data-photo-folder type="file" webkitdirectory mozdirectory directory multiple></label><label class="btn btn-ghost">Elegir imágenes o zip<input data-photo-files type="file" accept="image/*,.zip" multiple></label><button class="btn btn-ghost" type="button" data-photo-clear>Quitar cargadas</button></div></div><p data-photo-status></p><div class="photo-grid" data-photo-grid></div></div><div class="admin-block"><p class="eyebrow">Existencia frente al mínimo</p><p class="admin-note">La marca vertical es el mínimo de reposición. Al confirmar una compra, la existencia baja.</p><ul class="meters stock-meters">${stockMeters}</ul></div><div class="admin-block"><p class="eyebrow">Bodega</p><div class="table-wrap"><table class="admin-table"><thead><tr><th>Ref.</th><th>Artículo</th><th>Línea</th><th>Ubicación</th><th>Mínimo</th><th>Existencia</th><th>Estado</th></tr></thead><tbody>${stockRows}</tbody></table></div></div>`;

  const catalog = document.querySelector('[data-admin-panel="catalogo"]');
  if (catalog) {
    const checks = ["todas", ...LINES].map((line) => {
      const label = line === "todas" ? "Todas" : line;
      return `<label><input type="checkbox" data-line-filter="${line}" checked> ${label}</label>`;
    }).join("");
    catalog.innerHTML = `<div class="admin-block"><p class="eyebrow">Descargar catálogo</p><p class="admin-note">Elija las líneas y descargue el PDF. Lleva el logo, la foto y el precio de cada referencia.</p><div class="line-filters">${checks}</div><p data-download-count></p><ul class="download-list" data-download-list></ul><button class="btn btn-metal" type="button" data-download-catalog>Descargar catálogo</button><p data-download-status></p></div>`;
    paintDownloadCount();
  }

  const tabs = [...document.querySelectorAll("[data-admin-tab]")];
  const panels = [...document.querySelectorAll("[data-admin-panel]")];
  const names = tabs.map((tab) => tab.dataset.adminTab);
  const show = (name) => {
    const current = names.includes(name) ? name : "general";
    tabs.forEach((tab) => tab.classList.toggle("is-on", tab.dataset.adminTab === current));
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.adminPanel !== current;
    });
    if (location.hash !== `#${current}`) history.replaceState(null, "", `#${current}`);
  };
  shell._show = show;
  if (!shell.dataset.ready) {
    shell.dataset.ready = "1";
    tabs.forEach((tab) => tab.addEventListener("click", (event) => {
      event.preventDefault();
      shell._show(tab.dataset.adminTab);
    }));
  }
  show((location.hash || "#general").slice(1));
  paintPhotoDesk();
  applyPhotos();
}

document.addEventListener("click", (event) => {
  const accountToggle = event.target.closest("[data-account-toggle]");
  if (accountToggle) {
    if (!currentUser()) {
      const login = document.querySelector("[data-admin-login]");
      if (login && !login.hidden) {
        login.querySelector("[name=clave]")?.focus();
        return;
      }
      location.href = `${root}admin.html`;
      return;
    }
    const menu = accountToggle.parentElement.querySelector("[data-account-menu]");
    const willOpen = menu.hidden;
    closeAccounts();
    menu.hidden = !willOpen;
    accountToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
    return;
  }
  if (event.target.closest("[data-logout]")) {
    logout();
    return;
  }
  if (!event.target.closest("[data-account]")) closeAccounts();
  const add = event.target.closest("[data-add]");
  if (add) {
    event.preventDefault();
    event.stopPropagation();
    const scope = add.closest(".hero-actions, .card-body, .tile") || document;
    const qty = scope.querySelector("[data-qty]");
    const message = addToCart(add.dataset.add, qty ? qty.value : 1);
    const previous = add.textContent;
    add.textContent = message || "Añadido al carrito";
    window.setTimeout(() => {
      add.textContent = previous;
    }, 1400);
    return;
  }
  const change = event.target.closest("[data-qty-change]");
  if (change) {
    const line = cart().find((item) => item.id === change.dataset.qtyChange);
    const message = setQty(change.dataset.qtyChange, (line?.qty || 0) + Number(change.dataset.dir));
    renderCart();
    const note = document.querySelector("[data-cart-msg]");
    if (note && message) note.textContent = message;
    return;
  }
  const remove = event.target.closest("[data-remove]");
  if (remove) {
    setQty(remove.dataset.remove, 0);
    renderCart();
    return;
  }
  if (event.target.closest("[data-clear-cart]")) {
    saveCart([]);
    renderCart();
    return;
  }
  const receiptPdf = event.target.closest("[data-download-receipt]");
  if (receiptPdf) {
    const order = orders().find((item) => item.id === receiptPdf.dataset.downloadReceipt);
    if (order) {
      receiptPdf.disabled = true;
      downloadReceipt(order).catch(() => {}).finally(() => {
        receiptPdf.disabled = false;
      });
    }
    return;
  }
  if (event.target.closest("[data-download-catalog]")) {
    const lines = selectedLines();
    const status = document.querySelector("[data-download-status]");
    if (!lines.length) {
      if (status) status.textContent = "Elija al menos una línea.";
      return;
    }
    if (status) status.textContent = "Se está armando el PDF.";
    saveCatalog(lines).then((name) => {
      if (status) status.textContent = `Se descargó ${name}.`;
    }).catch(() => {
      if (status) status.textContent = "No se pudo armar el PDF.";
    });
    return;
  }
  const removePhotoButton = event.target.closest("[data-photo-remove]");
  if (removePhotoButton) {
    removePhoto(removePhotoButton.dataset.photoRemove).then(() => {
      paintPhotoDesk();
      applyPhotos();
      document.querySelectorAll("img[data-photo-base]").forEach((img) => {
        const match = (img.dataset.photoBase || "").match(/productos\/(dt-\d{2})\./i);
        if (match && match[1].toUpperCase() === removePhotoButton.dataset.photoRemove) img.src = img.dataset.photoBase;
      });
    });
    return;
  }
  if (event.target.closest("[data-photo-clear]")) {
    clearPhotos().then(() => {
      document.querySelectorAll("img[data-photo-base]").forEach((img) => {
        img.src = img.dataset.photoBase;
      });
      paintPhotoDesk();
      const status = document.querySelector("[data-photo-status]");
      if (status) status.textContent = "Se quitaron las imágenes cargadas. El catálogo volvió a las fotos del sitio.";
    });
  }
});

function selectedLines() {
  return [...document.querySelectorAll("[data-line-filter]")]
    .filter((box) => box.checked && box.dataset.lineFilter !== "todas")
    .map((box) => box.dataset.lineFilter);
}

function paintDownloadCount() {
  const count = document.querySelector("[data-download-count]");
  const list = document.querySelector("[data-download-list]");
  if (!count || !list) return;
  const lines = selectedLines();
  const items = PRODUCTS.filter((item) => lines.includes(item.line));
  count.textContent = items.length === 1 ? "1 referencia" : `${items.length} referencias`;
  list.innerHTML = items.length
    ? items.map((item) => `<li>${item.id} · ${escapeHtml(item.name)} · ${escapeHtml(item.line)}</li>`).join("")
    : "<li>Elija al menos una línea.</li>";
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function catalogPhoto(id) {
  const db = await photoDb();
  const blob = await new Promise((resolve, reject) => {
    const request = db.transaction("photos", "readonly").objectStore("photos").get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  if (blob) return blobToDataUrl(blob);
  return new URL(`img/productos/${id.toLowerCase()}.jpg`, location.href).href;
}

async function catalogFile(items, lines) {
  const stock = stockMap();
  const cards = (await Promise.all(items.map(async (item) => {
    const photo = await catalogPhoto(item.id);
    return `<article>
      <img src="${photo}" alt="">
      <div>
        <p>${escapeHtml(item.id)} · ${escapeHtml(item.line)}</p>
        <h2>${escapeHtml(item.name)}</h2>
        <p>${escapeHtml(NOTES[item.id] || "")}</p>
        <p>${money(item.price)} · Existencia ${stock[item.id] ?? 0} · ${escapeHtml(item.place)}</p>
      </div>
    </article>`;
  }))).join("");
  const title = lines.length === LINES.length ? "Catálogo completo" : lines.join(", ");
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Deltactica · ${escapeHtml(title)}</title>
  <style>
    body { margin: 0; font-family: Georgia, serif; color: #161616; background: #fff; }
    header, main { width: min(860px, calc(100% - 32px)); margin: 24px auto; }
    h1 { font-size: 40px; letter-spacing: 0.04em; text-transform: uppercase; margin: 8px 0; }
    article { display: grid; grid-template-columns: 140px 1fr; gap: 16px; padding: 16px 0; border-top: 1px solid #ccc; break-inside: avoid; }
    img { width: 140px; height: 140px; object-fit: cover; }
    h2 { margin: 0 0 8px; font-size: 26px; text-transform: uppercase; }
    p { margin: 0 0 6px; }
    .bar { display: flex; justify-content: space-between; align-items: center; }
    button { font: inherit; padding: 10px 14px; }
    @media print { .bar button { display: none; } }
  </style>
</head>
<body>
  <header>
    <div class="bar"><p>Deltactica</p><button type="button" onclick="window.print()">Imprimir o guardar PDF</button></div>
    <h1>${escapeHtml(title)}</h1>
    <p>${items.length} referencias. Artículos tácticos y militares.</p>
  </header>
  <main>${cards}</main>
</body>
</html>`;
}

async function saveCatalog(lines) {
  const items = PRODUCTS.filter((item) => lines.includes(item.line));
  const assets = await brandAssets();
  const title = lines.length === LINES.length ? "Catálogo completo" : lines.join(", ");
  const sheets = [];
  for (const item of items) {
    const src = photoUrls.get(item.id) || `${root}img/productos/${item.id.toLowerCase()}.jpg`;
    const photo = await window.DTPDF.loadJpeg(src, "#f3f4f5").catch(() => null);
    sheets.push({ id: item.id, name: item.name, line: item.line, note: NOTES[item.id] || "", price: item.price, photo });
  }
  const blob = await window.DTPDF.catalog(sheets, { ...assets, title });
  const slug = lines.length === LINES.length ? "completo" : lines.map((line) => line.toLowerCase()).join("-");
  const name = `deltactica-catalogo-${slug}.pdf`;
  downloadBlob(blob, name);
  return name;
}

document.addEventListener("change", (event) => {
  const photoInput = event.target.closest("[data-photo-folder], [data-photo-files]");
  if (photoInput) {
    const files = [...photoInput.files];
    photoInput.value = "";
    expandUploads(files).then((ready) => savePhotoFiles(ready)).then((result) => {
      paintPhotoDesk();
      applyPhotos();
      photoStatus(result.matched, result.skipped);
    }).catch(() => {
      const status = document.querySelector("[data-photo-status]");
      if (status) status.textContent = "No se pudo leer la carpeta en este navegador.";
    });
    return;
  }
  const select = event.target.closest("[data-status]");
  if (select) {
    const next = orders().map((order) => (
      order.id === select.dataset.status ? { ...order, status: select.value } : order
    ));
    write(KEYS.orders, next);
    const changed = next.find((order) => order.id === select.dataset.status);
    if (changed && !changed.example) notifyInternal("estado", { id: changed.id, estado: changed.status });
    renderAdmin();
    return;
  }
  const box = event.target.closest("[data-line-filter]");
  if (!box) return;
  const boxes = [...document.querySelectorAll("[data-line-filter]")];
  if (box.dataset.lineFilter === "todas") {
    boxes.forEach((item) => {
      item.checked = box.checked;
    });
  } else {
    const all = boxes.find((item) => item.dataset.lineFilter === "todas");
    const rest = boxes.filter((item) => item.dataset.lineFilter !== "todas");
    if (all) all.checked = rest.every((item) => item.checked);
  }
  paintDownloadCount();
});

document.addEventListener("submit", (event) => {
  const waForm = event.target.closest("[data-wa-form]");
  if (waForm) {
    event.preventDefault();
    const status = waForm.parentElement.querySelector("[data-wa-status]");
    const phone = normalizePhone(new FormData(waForm).get("wa"));
    if (!phone) {
      if (status) status.textContent = "Escriba el celular del asesor. Ejemplo: 3227043082.";
      return;
    }
    localStorage.setItem(KEYS.wa, phone);
    applyAdvisorPhone();
    notifyInternal("asesor", { whatsapp: phone });
    if (status) status.textContent = `El asesor atiende en ${prettyPhone(phone)}.`;
    return;
  }
  const wompiForm = event.target.closest("[data-wompi-form]");
  if (wompiForm) {
    event.preventDefault();
    const data = new FormData(wompiForm);
    const publicKey = String(data.get("publicKey") || "").trim();
    const integrity = String(data.get("integrity") || "").trim();
    write(KEYS.wompi, { publicKey, integrity });
    notifyInternal("pago", { pasarela: "wompi", lista: Boolean(publicKey && integrity) });
    const status = wompiForm.parentElement.querySelector("[data-wompi-status]");
    if (status) status.textContent = publicKey && integrity ? "Wompi está listo para cobrar en el pedido." : "Wompi queda abierto hasta tener las llaves.";
    return;
  }
  const internalForm = event.target.closest("[data-internal-form]");
  if (internalForm) {
    event.preventDefault();
    const status = internalForm.parentElement.querySelector("[data-internal-status]");
    const saved = saveInternalBase(new FormData(internalForm).get("base"));
    if (saved === null) {
      if (status) status.textContent = "Escriba una dirección http o https. Ejemplo: https://api.deltactica.com";
      return;
    }
    if (status) status.textContent = saved ? `La comunicación apunta a ${saved}.` : "La comunicación queda abierta. Aún no hay dirección.";
    return;
  }
  const form = event.target.closest("[data-stock-form]");
  if (!form) return;
  event.preventDefault();
  const stock = stockMap();
  stock[form.dataset.stockForm] = Math.max(0, Number(new FormData(form).get("qty")) || 0);
  write(KEYS.stock, stock);
  notifyInternal("existencia", stock);
  renderAdmin();
});

document.addEventListener("dragover", (event) => {
  if (!event.target.closest("[data-photo-drop]")) return;
  event.preventDefault();
});

document.addEventListener("drop", (event) => {
  const zone = event.target.closest("[data-photo-drop]");
  if (!zone) return;
  event.preventDefault();
  const dropped = event.dataTransfer;
  filesFromList([...dropped.items]).then((entries) => {
    const files = entries.length ? entries : [...dropped.files];
    return expandUploads(files).then((ready) => savePhotoFiles(ready));
  }).then((result) => {
    paintPhotoDesk();
    applyPhotos();
    photoStatus(result.matched, result.skipped);
  }).catch(() => {
    const status = document.querySelector("[data-photo-status]");
    if (status) status.textContent = "No se pudo leer esa carpeta. Use el botón Subir carpeta.";
  });
});

applyAdvisorPhone();
paintCount();
paintPrices();
renderCart();
renderCheckout();
paintAccount();
renderAdmin();
loadPhotos().then(() => {
  applyPhotos();
  paintPhotoDesk();
}).catch(() => {});
