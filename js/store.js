const PRODUCTS = (window.DT_CATALOG || []).map((item) => ({ ...item }));
const NOTES = Object.fromEntries(PRODUCTS.map((item) => [item.id, item.stage === "ropa" ? "Prenda sobre maniquí, con giro." : "Pieza con giro para consultar."]));
const LINES = [...new Set(PRODUCTS.map((item) => item.line))];

const KEYS = { cart: "dt-cart", orders: "dt-orders", stock: "dt-stock", admin: "dt-admin", examples: "dt-examples-v1", wa: "dt-wa", wompi: "dt-wompi", internal: "dt-internal", trace: "dt-trace" };
const ADMIN = { user: "delta", password: "admin123", name: "Admin" };
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const LINE_PALETTE = ["#f4f5f6", "#c5c8cc", "#8d939a", "#d7c4a3", "#6d737a", "#b7bcc2", "#9aa0a6", "#e4e6e8"];
const LINE_COLORS = Object.fromEntries(LINES.map((line, index) => [line, LINE_PALETTE[index % LINE_PALETTE.length]]));
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

function traceEvents() {
  const saved = read(KEYS.trace, []);
  return Array.isArray(saved) ? saved : [];
}

function traceKey(storage, key) {
  let id = storage.getItem(key);
  if (!id) {
    id = `${key.slice(3, 4)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    storage.setItem(key, id);
  }
  return id;
}

function currentPage() {
  const path = location.pathname.toLowerCase();
  if (path.includes("admin.html")) return null;
  if (path.endsWith("producto.html")) {
    const id = new URLSearchParams(location.search).get("id") || "";
    const item = product(id);
    return item ? { name: `Ficha ${item.id}`, product: item.id } : { name: "Ficha", product: "" };
  }
  if (path.endsWith("/") || /\/deltactica\/?$/.test(path)) return { name: "Inicio", product: "" };
  const names = [
    ["catalogo-impreso.html", "Catálogo impreso"],
    ["catalogo.html", "Catálogo"],
    ["lineas.html", "Líneas"],
    ["institucional.html", "Institucional"],
    ["dotacion.html", "Dotación"],
    ["contacto.html", "Contacto"],
    ["carrito.html", "Carrito"],
    ["compra.html", "Compra"],
    ["index.html", "Inicio"],
  ];
  const found = names.find(([file]) => path.endsWith(file));
  return { name: found ? found[1] : "Otra página", product: "" };
}

function rememberTrace(fields) {
  const page = currentPage();
  if (!page && fields.a !== "pedido") return null;
  const event = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    t: Date.now(),
    s: traceKey(sessionStorage, "dt-session"),
    v: traceKey(localStorage, "dt-visitor"),
    a: fields.a,
    p: fields.p || (page ? page.name : ""),
    d: String(fields.d || "").slice(0, 80),
    n: Number(fields.n) || 0,
  };
  const fresh = traceEvents().filter((item) => Date.now() - item.t < 1000 * 60 * 60 * 24 * 45);
  fresh.push(event);
  write(KEYS.trace, fresh.slice(-600));
  notifyInternal("visita", { accion: event.a, pagina: event.p, detalle: event.d, sesion: event.s });
  return event;
}

function absorbPending(nextName) {
  const id = sessionStorage.getItem("dt-trace-pending");
  if (!id) return;
  sessionStorage.removeItem("dt-trace-pending");
  const events = traceEvents();
  const index = events.findIndex((item) => item.id === id);
  if (index < 0) return;
  events[index] = { ...events[index], a: "paso", d: nextName };
  write(KEYS.trace, events);
}

function beginTrace() {
  const page = currentPage();
  if (!page || window.__dtTrace) return;
  window.__dtTrace = true;
  absorbPending(page.name);
  if (!sessionStorage.getItem("dt-trace-seen")) {
    sessionStorage.setItem("dt-trace-seen", "1");
    rememberTrace({ a: "entrada", p: page.name });
  }
  rememberTrace({ a: "pagina", p: page.name });
  if (page.product) rememberTrace({ a: "ficha", p: page.name, d: page.product });
  const arrived = Date.now();
  let left = false;
  window.addEventListener("pagehide", () => {
    if (left) return;
    left = true;
    const seconds = Math.max(0, Math.round((Date.now() - arrived) / 1000));
    const event = rememberTrace({ a: "salida", p: page.name, n: seconds });
    if (event) sessionStorage.setItem("dt-trace-pending", event.id);
  });
}

const SEARCH_WORDS = {
  bota: "botin calzado zapato",
  gorra: "cachucha kepis boina pava",
  morral: "bolso maleta mochila tula",
  chaqueta: "chaqueta buzo abrigo",
  uniforme: "prenda camisa pantalon",
};

function plainText(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchProducts(query) {
  const words = plainText(query).split(/\s+/).filter((word) => word.length > 1);
  if (!words.length) return [];
  return PRODUCTS.filter((item) => {
    const hay = plainText(`${item.id} ${item.name} ${item.line} ${NOTES[item.id] || ""} ${Object.entries(SEARCH_WORDS).filter(([key]) => plainText(item.name).includes(plainText(key)) || plainText(item.line).includes(plainText(key))).map(([, words]) => words).join(" ")}`);
    return words.every((word) => hay.includes(word));
  });
}

window.DTSearch = { match: matchProducts };

function mountMenuSearch() {
  const nav = document.querySelector("[data-nav]");
  if (!nav || nav.querySelector("[data-menu-search]")) return;
  const form = document.createElement("form");
  form.className = "menu-search";
  form.dataset.menuSearch = "";
  form.setAttribute("role", "search");
  form.innerHTML = `<input data-menu-query type="search" placeholder="Buscar por palabra" autocomplete="off" aria-label="Buscar en el catálogo" aria-expanded="false" aria-controls="menu-resultados"><div class="menu-results" id="menu-resultados" hidden></div>`;
  nav.prepend(form);
  const input = form.querySelector("[data-menu-query]");
  const list = form.querySelector(".menu-results");
  const paint = () => {
    const query = input.value.trim();
    const found = matchProducts(query);
    if (!query) {
      list.hidden = true;
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      return;
    }
    const rows = found.slice(0, 6).map((item) => `<a href="${root}producto.html?id=${item.id}"><img src="${productImage(item)}" alt="" data-product="${item.id}"><span><b>${item.id} · ${escapeHtml(item.name)}</b><small>${escapeHtml(item.line)} · ${priceLabel(item)}</small></span></a>`).join("");
    const more = found.length > 6 ? `<a class="menu-more" href="${root}catalogo.html?q=${encodeURIComponent(query)}"><span><b>Ver las ${found.length} referencias</b><small>Abrir el catálogo con esta búsqueda</small></span></a>` : "";
    list.innerHTML = rows || `<p>Ninguna referencia coincide con “${escapeHtml(query)}”.</p>`;
    if (more) list.innerHTML += more;
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };
  input.addEventListener("input", paint);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    if (document.querySelector("[data-count]")) {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      return;
    }
    location.href = `${root}catalogo.html?q=${encodeURIComponent(query)}`;
  });
  document.addEventListener("click", (event) => {
    if (!form.contains(event.target)) {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
    }
  });
}

function stayText(seconds) {
  if (!seconds) return "0 s";
  if (seconds < 60) return `${seconds} s`;
  return `${Math.round(seconds / 60)} min`;
}

function product(id) {
  return PRODUCTS.find((item) => item.id === String(id || "").toUpperCase());
}

function priceLabel(item) {
  return item && item.price ? money(item.price) : "A consultar";
}

window.DT_VISTAS = window.DT_VISTAS || {
  "DT-1079": 4, "DT-1080": 4, "DT-1188": 4, "DT-1299": 4,
  "DT-1300": 4, "DT-1301": 4, "DT-1302": 4, "DT-1303": 4, "DT-1304": 4, "DT-1305": 4,
  "DT-1306": 4, "DT-1307": 4, "DT-1308": 4, "DT-1309": 4, "DT-1310": 4, "DT-1311": 4,
  "DT-1312": 4, "DT-1313": 4, "DT-1314": 4, "DT-1315": 4, "DT-1316": 4, "DT-1317": 4,
  "DT-1318": 4, "DT-1319": 4, "DT-1320": 4, "DT-1321": 4, "DT-1322": 4, "DT-1323": 4,
  "DT-1324": 4, "DT-1325": 4, "DT-1326": 4, "DT-1327": 4, "DT-1328": 4, "DT-1329": 4,
  "DT-1330": 4, "DT-1331": 4, "DT-1332": 4, "DT-1333": 4, "DT-1334": 4, "DT-1335": 4
};

function productImage(item) {
  if (!item) return "";
  if (window.DT_VISTAS && window.DT_VISTAS[item.id]) {
    const clave = String(item.id).toLowerCase().replace(/-/g, "");
    return `${root}img/vueltas/${clave}-01.jpg?v=1`;
  }
  return photoUrls.get(item.id) || `${root}${item.image || ""}`;
}

function stockMap() {
  const saved = read(KEYS.stock, {}) || {};
  const next = { ...saved };
  let changed = !read(KEYS.stock, null);
  PRODUCTS.forEach((item) => {
    if (next[item.id] == null) {
      next[item.id] = item.stock;
      changed = true;
    }
  });
  if (changed) write(KEYS.stock, next);
  return next;
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
  return [];
}

function orders() {
  const saved = read(KEYS.orders, null);
  if (localStorage.getItem(KEYS.examples) !== "2") {
    const current = Array.isArray(saved) ? saved.filter((order) => !order.example) : [];
    write(KEYS.orders, current);
    localStorage.setItem(KEYS.examples, "2");
    return current;
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
    if (!item) return null;
    return { id: line.id, name: item.name, price: item.price, qty: line.qty };
  }).filter(Boolean);
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
  lines.forEach((line) => rememberTrace({ a: "pedido", p: "Compra", d: line.id, n: line.qty }));
  return order;
}

function paintPrices() {
  document.querySelectorAll("[data-price]").forEach((node) => {
    const item = product(node.dataset.price);
    if (item) node.textContent = priceLabel(item);
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
    if (!item) return "";
    return `<tr>
      <td><div class="cart-product"><img src="${productImage(item)}" alt="" data-product="${item.id}"><div><strong>${escapeHtml(item.name)}</strong><span>${item.id} · ${escapeHtml(item.line)}</span></div></div></td>
      <td>${priceLabel(item)}</td>
      <td><div class="qty"><button type="button" data-qty-change="${item.id}" data-dir="-1" aria-label="Restar una unidad">−</button><span>${line.qty}</span><button type="button" data-qty-change="${item.id}" data-dir="1" aria-label="Sumar una unidad">+</button></div></td>
      <td>${item.price ? money(item.price * line.qty) : "A consultar"}</td>
      <td><button class="linkish" type="button" data-remove="${item.id}">Quitar</button></td>
    </tr>`;
  }).join("");
  const total = cartTotal();
  rootNode.innerHTML = `<table class="cart-table"><thead><tr><th>Artículo</th><th>Precio</th><th>Cantidad</th><th>Total</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    <div class="cart-foot"><button class="linkish" type="button" data-clear-cart>Vaciar carrito</button><div><p class="eyebrow">Total</p><p class="cart-total">${total ? money(total) : "A consultar"}</p></div></div>
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
    if (!item) return "";
    return `<tr><td>${escapeHtml(item.name)}</td><td>${line.qty}</td><td>${item.price ? money(item.price * line.qty) : "A consultar"}</td></tr>`;
  }).join("");
  const total = cartTotal();
  summary.innerHTML = `<p class="eyebrow">Resumen</p><table class="summary-line"><tbody>${rows}</tbody></table><p class="cart-total">${total ? money(total) : "A consultar"}</p>`;
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
  const lines = order.lines.map((line) => `${line.id} ${line.name} x${line.qty} · ${line.price ? money(line.price * line.qty) : "A consultar"}`).join("\n");
  return [
    `Recibo Deltactica ${order.id}`,
    new Date(order.date).toLocaleString("es-CO"),
    "",
    lines,
    `Total: ${order.total ? money(order.total) : "A consultar"}`,
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
  const rows = order.lines.map((line) => `<tr><td>${escapeHtml(line.id)}</td><td>${escapeHtml(line.name)}</td><td>${line.qty}</td><td>${line.price ? money(line.price) : "A consultar"}</td><td>${line.price ? money(line.price * line.qty) : "A consultar"}</td></tr>`).join("");
  const link = waLink(receiptText(order));
  return `<article class="receipt">
    <header class="receipt-banner"><img class="receipt-logo" src="${root}img/logo.png" alt="Deltactica"><div><p class="eyebrow">Recibo</p><h2>${escapeHtml(order.id)}</h2><p>${new Date(order.date).toLocaleString("es-CO")}</p></div></header>
    <table class="summary-line"><thead><tr><th>Ref.</th><th>Artículo</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="cart-total">${order.total ? money(order.total) : "A consultar"}</p>
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
    script.src = `${root}js/pdf.js?v=catalogo`;
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
  const raw = String(name || "");
  const match = raw.toUpperCase().match(/DT[\s_-]?(\d{3,4})/);
  if (match) {
    const id = `DT-${match[1]}`;
    if (product(id)) return id;
  }
  const stem = plainText(raw.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  const found = PRODUCTS.find((item) => plainText(item.name) === stem);
  return found ? found.id : "";
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
  document.querySelectorAll("img[data-product]").forEach((img) => {
    const url = photoUrls.get(img.dataset.product);
    if (!url) return;
    img.src = url;
  });
}

function paintPhotoDesk() {
  const grid = document.querySelector("[data-photo-grid]");
  if (!grid) return;
  grid.innerHTML = PRODUCTS.map((item) => {
    const custom = photoUrls.has(item.id);
    const src = custom ? photoUrls.get(item.id) : productImage(item);
    return `<figure class="photo-card"><img src="${src}" alt="${escapeHtml(item.name)}" loading="lazy" data-product="${item.id}"><figcaption><strong>${item.id}</strong> ${escapeHtml(item.name)}${custom ? "<em>Cargada</em>" : ""}</figcaption>${custom ? `<button class="linkish" type="button" data-photo-remove="${item.id}">Quitar</button>` : ""}</figure>`;
  }).join("");
}

function photoStatus(matched, skipped) {
  const status = document.querySelector("[data-photo-status]");
  if (!status) return;
  const ready = matched.length === 1 ? "1 imagen quedó en su referencia" : `${matched.length} imágenes quedaron en su referencia`;
  const names = matched.length ? `: ${matched.join(", ")}.` : ".";
  const ignored = skipped.length
    ? ` ${skipped.length} ${skipped.length === 1 ? "archivo no coincidió" : "archivos no coincidieron"} con una referencia del catálogo`
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

function topProduct(rows, score) {
  const ranked = rows.filter((row) => score(row) > 0).sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
  return ranked[0] || null;
}

function traceBoard() {
  const events = traceEvents();
  const realOrders = orders().filter((order) => !order.example);
  const sessions = [...new Set(events.map((event) => event.s))];
  const visitors = [...new Set(events.map((event) => event.v))];
  const entries = events.filter((event) => event.a === "entrada");
  const exits = events.filter((event) => event.a === "salida");
  const pages = events.filter((event) => event.a === "pagina");
  const searches = events.filter((event) => event.a === "buscar");
  const sessionHas = (names) => sessions.filter((id) => events.some((event) => event.s === id && names.includes(event.p))).length;
  const sessionAction = (action) => sessions.filter((id) => events.some((event) => event.s === id && event.a === action)).length;
  const funnel = [
    { label: "Entraron", value: entries.length, display: String(entries.length) },
    { label: "Catálogo", value: sessionHas(["Catálogo"]), display: String(sessionHas(["Catálogo"])) },
    { label: "Ficha", value: sessionAction("ficha"), display: String(sessionAction("ficha")) },
    { label: "Carrito", value: sessionHas(["Carrito"]), display: String(sessionHas(["Carrito"])) },
    { label: "Compra", value: sessionHas(["Compra"]), display: String(sessionHas(["Compra"])) },
    { label: "Pedidos", value: realOrders.length, display: String(realOrders.length) },
  ];
  const pageCounts = new Map();
  pages.forEach((event) => pageCounts.set(event.p, (pageCounts.get(event.p) || 0) + 1));
  const pageMeters = [...pageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, display: String(value) }));
  const steps = new Map();
  events.filter((event) => event.a === "paso").forEach((event) => {
    const key = `${event.p} → ${event.d}`;
    steps.set(key, (steps.get(key) || 0) + 1);
  });
  const stepRows = [...steps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const views = {};
  const found = {};
  const carts = {};
  const sold = {};
  PRODUCTS.forEach((item) => {
    views[item.id] = 0;
    found[item.id] = 0;
    carts[item.id] = 0;
    sold[item.id] = 0;
  });
  events.forEach((event) => {
    if (event.a === "ficha" && views[event.d] !== undefined) views[event.d] += 1;
    if (event.a === "carrito" && carts[event.d] !== undefined) carts[event.d] += event.n || 1;
    if (event.a === "buscar") {
      const query = event.d.toLowerCase();
      PRODUCTS.forEach((item) => {
        if (item.id.toLowerCase() === query || item.name.toLowerCase().includes(query)) found[item.id] += 1;
      });
    }
  });
  realOrders.forEach((order) => {
    order.lines.forEach((line) => {
      if (sold[line.id] !== undefined) sold[line.id] += line.qty;
    });
  });
  const rows = PRODUCTS.map((item) => ({
    ...item,
    views: views[item.id],
    found: found[item.id],
    carts: carts[item.id],
    sold: sold[item.id],
  }));
  const wanted = topProduct(rows, (row) => row.found + row.views);
  const best = topProduct(rows, (row) => row.sold);
  const unsold = rows.filter((row) => row.sold === 0);
  const lowest = rows.filter((row) => row.sold > 0).sort((a, b) => a.sold - b.sold || a.id.localeCompare(b.id))[0];
  const productName = (row) => row ? `${row.id} · ${row.name}` : "Sin datos todavía";
  const leastStrong = !best ? "—" : unsold[0] ? unsold[0].id : (lowest ? lowest.id : "—");
  const leastNote = !best
    ? "Todavía no hay compras confirmadas."
    : unsold.length > 1
      ? `También sin vender: ${unsold.length - 1} referencias.`
      : productName(unsold[0] || lowest);
  const table = rows
    .slice()
    .sort((a, b) => b.sold - a.sold || (b.found + b.views) - (a.found + a.views) || a.id.localeCompare(b.id))
    .map((row) => `<tr><td>${row.id}</td><td>${escapeHtml(row.name)}</td><td>${row.views}</td><td>${row.found}</td><td>${row.carts}</td><td>${row.sold}</td></tr>`)
    .join("");
  const flow = stepRows.length
    ? `<table class="admin-table"><thead><tr><th>Recorrido</th><th>Veces</th></tr></thead><tbody>${stepRows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${value}</td></tr>`).join("")}</tbody></table>`
    : "<p class=\"admin-note\">Cuando alguien pase de una pantalla a otra, el recorrido aparece aquí.</p>";
  const groups = new Map();
  events.forEach((event) => {
    if (!groups.has(event.s)) groups.set(event.s, []);
    groups.get(event.s).push(event);
  });
  const recent = [...groups.values()].slice(-6).reverse().map((group) => {
    const path = [];
    group.forEach((event) => {
      if (event.a === "pagina" && path[path.length - 1] !== event.p) path.push(event.p);
    });
    const gone = group.some((event) => event.a === "salida");
    const stamp = new Date(group[0].t).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    return `<li><span>${escapeHtml(stamp)}</span><b>${escapeHtml(path.join(" → ") || "Entrada")}</b><em>${gone ? "Salió" : "En el sitio"}</em></li>`;
  }).join("");
  const stayed = events.filter((event) => (event.a === "salida" || event.a === "paso") && event.n > 0);
  const average = stayed.length ? Math.round(stayed.reduce((sum, event) => sum + event.n, 0) / stayed.length) : 0;
  return `<p class="admin-note">Entradas, salidas, búsquedas y ventas de este navegador. Con la dirección de la aplicación, el mismo aviso sale hacia el software interno.</p>
    <div class="stats">
      <article class="stat"><span>Entradas</span><strong>${entries.length}</strong></article>
      <article class="stat"><span>Salidas</span><strong>${exits.length}</strong></article>
      <article class="stat"><span>Visitantes</span><strong>${visitors.length}</strong></article>
      <article class="stat"><span>Páginas vistas</span><strong>${pages.length}</strong></article>
      <article class="stat"><span>Búsquedas</span><strong>${searches.length}</strong></article>
      <article class="stat"><span>Permanencia</span><strong>${stayText(average)}</strong></article>
    </div>
    <div class="stats">
      <article class="stat"><span>Más buscado</span><strong>${wanted ? wanted.id : "—"}</strong><p class="admin-note">${escapeHtml(productName(wanted))}</p></article>
      <article class="stat"><span>Más vendido</span><strong>${best ? best.id : "—"}</strong><p class="admin-note">${escapeHtml(productName(best))}${best ? `. ${best.sold} uds.` : ""}</p></article>
      <article class="stat"><span>Menos vendido</span><strong>${escapeHtml(leastStrong)}</strong><p class="admin-note">${escapeHtml(leastNote)}</p></article>
    </div>
    <div class="chart-grid">
      <article class="admin-block"><p class="eyebrow">Del ingreso al pedido</p>${meterList(funnel)}</article>
      <article class="admin-block"><p class="eyebrow">Pantallas</p>${pageMeters.length ? meterList(pageMeters) : "<p class=\"admin-note\">Todavía no hay páginas vistas.</p>"}</article>
    </div>
    <div class="chart-grid">
      <article class="admin-block"><p class="eyebrow">Hacia dónde siguen</p>${flow}</article>
      <article class="admin-block"><p class="eyebrow">Últimas visitas</p>${recent ? `<ul class="trace-list">${recent}</ul>` : "<p class=\"admin-note\">La primera visita queda registrada al abrir el sitio.</p>"}</article>
    </div>
    <article class="admin-block"><p class="eyebrow">Referencias</p><p class="admin-note">Vistas de ficha, búsquedas por nombre o referencia, veces que entró al carrito y unidades de pedidos confirmados. Los ejemplos no cuentan como venta.</p><div class="table-wrap"><table class="admin-table"><thead><tr><th>Ref.</th><th>Artículo</th><th>Vistas</th><th>Búsquedas</th><th>Carrito</th><th>Vendidas</th></tr></thead><tbody>${table}</tbody></table></div></article>`;
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
  const units = PRODUCTS.reduce((sum, item) => sum + (stock[item.id] ?? 0), 0);
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
  general.innerHTML = `<div class="stats">
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
      <article class="admin-block"><p class="eyebrow">Unidades por línea</p><p class="admin-note">${low.length ? `Reponer ${low.slice(0, 8).map((item) => item.id).join(", ")}${low.length > 8 ? ` y ${low.length - 8} más` : ""}.` : "Ninguna referencia está en el mínimo."}</p>${meterList(byPlace)}</article>
    </div>`;

  const saleRows = list.length
    ? list.map((order) => `<tr><td>${escapeHtml(order.id)}${order.example ? '<span class="example-tag">Ejemplo</span>' : ""}</td><td>${new Date(order.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}</td><td>${escapeHtml(order.customer.nombre)}<br>${escapeHtml(order.customer.institucion || "")}</td><td>${escapeHtml(order.customer.ciudad)}<br>${escapeHtml(order.customer.metodo || "")}</td><td>${money(order.total)}</td><td><select class="status-select" data-status="${escapeHtml(order.id)}">${["Recibido", "En preparación", "Despachado", "Entregado"].map((status) => `<option style="background:#141416;color:#f3f4f5" ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select></td></tr>`).join("")
    : `<tr><td colspan="6">Todavía no hay pedidos.</td></tr>`;
  sales.innerHTML = `<div class="chart-grid chart-grid-sales"><article class="admin-block"><p class="eyebrow">Ventas por mes</p>${barChart(byMonth, "Ventas de los últimos seis meses")}</article><article class="admin-block"><p class="eyebrow">Por cobrar y despachar</p><p class="admin-note">Total ${money(sold)}. ${pending} pedidos siguen abiertos.</p>${meterList(byStatus)}</article></div><div class="admin-block"><p class="eyebrow">Pedidos</p><p class="admin-note">Una compra confirmada entra en esta tabla. El precio queda a consultar hasta que el asesor lo cierre.</p><div class="table-wrap"><table class="admin-table"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Ciudad</th><th>Total</th><th>Estado</th></tr></thead><tbody>${saleRows}</tbody></table></div></div>`;

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
  warehouse.innerHTML = `<div class="admin-block"><p class="eyebrow">Imágenes del catálogo</p><p class="admin-note">En Drive use Descargar. Si baja un .zip, súbalo tal cual. Si baja la carpeta ya abierta, use Subir carpeta. Cada archivo puede llamarse como la referencia (DT-1001.png) o como el nombre del producto. La foto entra en la ficha, el catálogo y el carrito de este navegador.</p><div class="photo-drop" data-photo-drop><p>Suelte aquí la carpeta o las imágenes.</p><div class="photo-actions"><label class="btn btn-metal">Subir carpeta<input data-photo-folder type="file" webkitdirectory mozdirectory directory multiple></label><label class="btn btn-ghost">Elegir imágenes o zip<input data-photo-files type="file" accept="image/*,.zip" multiple></label><button class="btn btn-ghost" type="button" data-photo-clear>Quitar cargadas</button></div></div><p data-photo-status></p><div class="photo-grid" data-photo-grid></div></div><div class="admin-block"><p class="eyebrow">Existencia frente al mínimo</p><p class="admin-note">La marca vertical es el mínimo de reposición. Al confirmar una compra, la existencia baja.</p><ul class="meters stock-meters">${stockMeters}</ul></div><div class="admin-block"><p class="eyebrow">Bodega</p><div class="table-wrap"><table class="admin-table"><thead><tr><th>Ref.</th><th>Artículo</th><th>Línea</th><th>Ubicación</th><th>Mínimo</th><th>Existencia</th><th>Estado</th></tr></thead><tbody>${stockRows}</tbody></table></div></div>`;

  const trace = document.querySelector('[data-admin-panel="trazabilidad"]');
  if (trace) trace.innerHTML = traceBoard();

  const settings = document.querySelector('[data-admin-panel="configuracion"]');
  if (settings) {
    settings.innerHTML = `<div class="chart-grid">
      <article class="admin-block"><p class="eyebrow">Asesor comercial</p><p class="admin-note">Este WhatsApp recibe los pedidos y atiende el botón del sitio.</p><form class="panel-form" data-wa-form><label>Número<input name="wa" inputmode="numeric" autocomplete="tel" required value="${escapeHtml(localPhone)}"></label><button class="btn btn-metal" type="submit">Guardar número</button></form><p data-wa-status></p></article>
      <article class="admin-block"><p class="eyebrow">Pasarela Wompi</p><p class="admin-note">Cuando el comercio tenga las llaves, péguelas aquí. El pago en línea del pedido usa esa pasarela.</p><form class="panel-form" data-wompi-form><label>Llave pública<input name="publicKey" autocomplete="off" value="${escapeHtml(wompi.publicKey)}" placeholder="pub_test_ o pub_prod_"></label><label>Secreto de integridad<input name="integrity" autocomplete="off" value="${escapeHtml(wompi.integrity)}"></label><button class="btn btn-metal" type="submit">Guardar Wompi</button></form><p data-wompi-status>${wompi.publicKey && wompi.integrity ? "Wompi está listo para cobrar en el pedido." : "Wompi queda abierto hasta tener las llaves."}</p></article>
      <article class="admin-block span-row"><p class="eyebrow">Aplicación interna</p><p class="admin-note">A partir de diciembre o enero este sitio le enviará pedidos, existencia, el WhatsApp del asesor, el aviso de pago y la trazabilidad. Pegue la dirección cuando el software exista. Vacía, la compra sigue en este navegador.</p><form class="panel-form" data-internal-form><label>Dirección<input name="base" inputmode="url" autocomplete="off" placeholder="https://api.deltactica.com" value="${escapeHtml(internalBase())}"></label><button class="btn btn-metal" type="submit">Guardar dirección</button></form><p data-internal-status>${internalBase() ? `La comunicación apunta a ${escapeHtml(internalBase())}.` : "La comunicación queda abierta. Aún no hay dirección."}</p></article>
    </div>`;
  }

  const catalog = document.querySelector('[data-admin-panel="catalogo"]');
  if (catalog) {
    const counts = Object.fromEntries(LINES.map((line) => [line, PRODUCTS.filter((item) => item.line === line).length]));
    const chips = [
      `<button class="filter is-active" type="button" data-line-filter="todas" aria-pressed="true">Todas <b>${PRODUCTS.length}</b></button>`,
      ...LINES.map((line) => `<button class="filter is-active" type="button" data-line-filter="${line}" aria-pressed="true">${line} <b>${counts[line]}</b></button>`)
    ].join("");
    catalog.innerHTML = `<div class="admin-block"><p class="eyebrow">Descargar catálogo</p><p class="admin-note">Combine líneas o busque una referencia. El PDF lleva el logo a un lado y las fichas en tamaño de catálogo.</p><div class="catalog-tools"><label class="catalog-search">Buscar<input data-catalog-search type="search" placeholder="Referencia o nombre" autocomplete="off"></label><div class="filters" role="group" aria-label="Líneas del PDF">${chips}</div></div><p class="count" data-download-count></p><div class="download-picks" data-download-list></div><button class="btn btn-metal" type="button" data-download-catalog>Descargar catálogo</button><p data-download-status></p></div>`;
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
  const lineFilter = event.target.closest("[data-filter]");
  if (lineFilter && lineFilter.dataset.filter !== "todos") {
    rememberTrace({ a: "filtro", p: "Catálogo", d: lineFilter.dataset.filter });
  }
  if (event.target.closest(".wa-fab, [data-wa-text]")) {
    rememberTrace({ a: "asesor", d: "whatsapp" });
  }
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
    const addedQty = qty ? qty.value : 1;
    const message = addToCart(add.dataset.add, addedQty);
    if (!message) rememberTrace({ a: "carrito", d: add.dataset.add, n: Number(addedQty) || 1 });
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
  const lineButton = event.target.closest("[data-line-filter]");
  if (lineButton) {
    const buttons = [...document.querySelectorAll("[data-line-filter]")];
    const rest = buttons.filter((button) => button.dataset.lineFilter !== "todas");
    const all = buttons.find((button) => button.dataset.lineFilter === "todas");
    const mark = (button, on) => {
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.classList.toggle("is-active", on);
    };
    if (lineButton.dataset.lineFilter === "todas") {
      const on = lineButton.getAttribute("aria-pressed") !== "true";
      buttons.forEach((button) => mark(button, on));
    } else {
      mark(lineButton, lineButton.getAttribute("aria-pressed") !== "true");
      if (all) mark(all, rest.every((button) => button.getAttribute("aria-pressed") === "true"));
    }
    paintDownloadCount();
    return;
  }
  if (event.target.closest("[data-download-catalog]")) {
    const items = catalogSelection();
    const status = document.querySelector("[data-download-status]");
    if (!items.length) {
      if (status) status.textContent = "Elija al menos una línea.";
      return;
    }
    if (status) status.textContent = "Se está armando el PDF.";
    saveCatalog().then((name) => {
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
    .filter((button) => button.dataset.lineFilter !== "todas" && button.getAttribute("aria-pressed") === "true")
    .map((button) => button.dataset.lineFilter);
}

function catalogSelection() {
  const lines = selectedLines();
  const query = (document.querySelector("[data-catalog-search]")?.value || "").trim().toLowerCase();
  return PRODUCTS.filter((item) => lines.includes(item.line) && (!query || `${item.id} ${item.name} ${item.line}`.toLowerCase().includes(query)));
}

function paintDownloadCount() {
  const count = document.querySelector("[data-download-count]");
  const list = document.querySelector("[data-download-list]");
  if (!count || !list) return;
  const items = catalogSelection();
  count.textContent = items.length === 1 ? "1 referencia" : `${items.length} referencias`;
  list.innerHTML = items.length
    ? items.map((item) => `<span>${item.id} · ${escapeHtml(item.name)}</span>`).join("")
    : "<span>Elija al menos una línea.</span>";
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
  const item = product(id);
  if (!item) return "";
  if (blob) return blobToDataUrl(blob);
  return new URL(item.image, location.href).href;
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
        <p>${priceLabel(item)} · Existencia ${stock[item.id] ?? 0} · ${escapeHtml(item.place)}</p>
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

async function saveCatalog() {
  const picked = catalogSelection();
  const lines = [...new Set(picked.map((item) => item.line))];
  const items = picked;
  const assets = await brandAssets();
  const query = (document.querySelector("[data-catalog-search]")?.value || "").trim();
  const title = query
    ? `Búsqueda: ${query}`
    : lines.length === LINES.length ? "Catálogo completo" : lines.join(", ");
  const sheets = [];
  for (const item of items) {
    const src = productImage(item);
    const photo = await window.DTPDF.loadJpeg(src, "#f3f4f5").catch(() => null);
    sheets.push({ id: item.id, name: item.name, line: item.line, note: NOTES[item.id] || "", price: item.price, photo });
  }
  const blob = await window.DTPDF.catalog(sheets, { ...assets, title });
  const slug = query ? "busqueda" : lines.length === LINES.length ? "completo" : lines.map((line) => line.toLowerCase()).join("-");
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
});

let catalogSearchTimer = 0;
document.addEventListener("input", (event) => {
  if (event.target.closest("[data-catalog-search]")) paintDownloadCount();
  const catalogQuery = event.target.closest("[data-catalog-query]");
  if (!catalogQuery) return;
  window.clearTimeout(catalogSearchTimer);
  catalogSearchTimer = window.setTimeout(() => {
    const text = catalogQuery.value.trim();
    if (text.length >= 2) rememberTrace({ a: "buscar", p: "Catálogo", d: text });
  }, 700);
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

function renderPublic() {
  const filters = document.querySelector("[data-catalog-filters]");
  const grid = document.querySelector("[data-catalog-grid]");
  if (filters && grid) {
    const counts = {};
    PRODUCTS.forEach((item) => {
      counts[item.slug] = (counts[item.slug] || 0) + 1;
    });
    filters.innerHTML = [`<button class="filter is-active" type="button" data-filter="todos" aria-pressed="true">Todas <b>${PRODUCTS.length}</b></button>`,
      ...LINES.map((line) => {
        const slug = PRODUCTS.find((item) => item.line === line)?.slug || "";
        return `<button class="filter" type="button" data-filter="${slug}" data-label="${escapeHtml(line)}" aria-pressed="false">${escapeHtml(line)} <b>${counts[slug] || 0}</b></button>`;
      })].join("");
    grid.innerHTML = PRODUCTS.map((item) => {
      const frame = item.photo === false
        ? `<div class="plate plate-photo plate-missing"><span>Foto por reemplazar</span></div>`
        : `<a class="plate plate-photo" href="${root}producto.html?id=${item.id}"><img src="${productImage(item)}" alt="${escapeHtml(item.name)}" loading="lazy" data-product="${item.id}"></a>`;
      return `<article class="card" data-cat="${item.slug}">
      ${frame}
      <div class="card-body">
        <p class="card-kicker"><span>${item.id}</span><span>${escapeHtml(item.line)}</span></p>
        <h3>${escapeHtml(item.name)}</h3>
        <p class="price">${priceLabel(item)}</p>
        <a class="consult" href="${root}producto.html?id=${item.id}">Ver en 360</a>
        <button class="cart-add" type="button" data-add="${item.id}">Añadir al carrito</button>
        <a class="consult" data-wa-text="Hola, quiero información de la referencia ${item.id}, ${item.name}.">Consultar referencia</a>
      </div>
    </article>`;
    }).join("");
    const count = document.querySelector("[data-count]");
    if (count) count.textContent = PRODUCTS.length === 1 ? "1 referencia" : `${PRODUCTS.length} referencias`;
  }
  const bar = document.querySelector("[data-stage-bar]");
  if (bar) {
    bar.innerHTML = LINES.map((line, index) => {
      const slug = PRODUCTS.find((item) => item.line === line)?.slug || "";
      return `<a href="${root}lineas.html#${slug}"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(line)}</a>`;
    }).join("");
  }
  const board = document.querySelector("[data-line-board]");
  if (board) {
    board.innerHTML = LINES.map((line) => {
      const group = PRODUCTS.filter((item) => item.line === line);
      const item = group.find((entry) => entry.photo !== false) || group[0];
      if (!item) return "";
      return `<article class="line-card" id="${item.slug}"><img src="${productImage(item)}" alt="${escapeHtml(line)}" data-product="${item.id}"><div><h2>${escapeHtml(line)}</h2><p>${group.length} referencias.</p><a class="btn btn-metal line-open" href="${root}catalogo.html?linea=${item.slug}">Abrir línea</a></div></article>`;
    }).join("");
  }
  const mosaic = document.querySelector("[data-home-mosaic]");
  const thumbs = document.querySelector("[data-home-thumbs]");
  if (mosaic && thumbs) {
    const picks = LINES.map((line) => PRODUCTS.find((item) => item.line === line && item.photo !== false) || PRODUCTS.find((item) => item.line === line)).filter(Boolean);
    const tile = (item, extra) => `<article class="tile ${extra}"><a class="tile-hit" href="${root}producto.html?id=${item.id}"><img src="${productImage(item)}" alt="${escapeHtml(item.name)}" data-product="${item.id}"><span class="tile-copy"><span>${item.id} · ${escapeHtml(item.line)}</span><strong>${escapeHtml(item.name)}</strong><em>Gire la pieza en su ficha.</em></span></a><button class="cart-add" type="button" data-add="${item.id}">Añadir al carrito</button></article>`;
    mosaic.innerHTML = picks.slice(0, 6).map((item, index) => tile(item, index === 0 ? "tile-lead" : index === 5 ? "tile-wide" : "")).join("");
    thumbs.innerHTML = picks.slice(6, 12).map((item) => `<a class="thumb" href="${root}producto.html?id=${item.id}"><img src="${productImage(item)}" alt="" data-product="${item.id}"><span>${item.id} · ${escapeHtml(item.line)}</span><strong>${escapeHtml(item.name)}</strong></a>`).join("");
  }
  const interest = document.querySelector("[data-interest]");
  if (interest) {
    interest.innerHTML = `<option value="" selected disabled>Seleccione una línea</option>${LINES.map((line) => `<option>${escapeHtml(line)}</option>`).join("")}<option>Dotación completa</option><option>Otra consulta</option>`;
  }
}

renderPublic();
mountMenuSearch();
beginTrace();
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
