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

const KEYS = { cart: "dt-cart", orders: "dt-orders", stock: "dt-stock", admin: "dt-admin", examples: "dt-examples-v1" };
const USERS = [
  { user: "direccion", password: "deltactica", name: "Dirección", role: "General, ventas, bodega y catálogo" },
  { user: "ventas", password: "ventas", name: "Ventas", role: "Pedidos, estados y catálogo" },
  { user: "bodega", password: "bodega", name: "Bodega", role: "Existencias, reposición y catálogo" },
];
const ACCESS = {
  direccion: ["general", "ventas", "bodega", "catalogo"],
  ventas: ["general", "ventas", "catalogo"],
  bodega: ["general", "bodega", "catalogo"],
};
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
    <div class="hero-actions"><a class="btn btn-metal" href="${root}compra.html">Continuar compra</a></div>
    <p class="admin-note" data-cart-msg></p>`;
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
    if (heading) heading.textContent = "Pedido confirmado";
    if (!order) {
      done.innerHTML = `<p class="lead">No está ese pedido en este navegador.</p>`;
      return;
    }
    const rows = order.lines.map((line) => `<tr><td>${escapeHtml(line.name)} · ${line.id}</td><td>${line.qty}</td><td>${money(line.price * line.qty)}</td></tr>`).join("");
    done.innerHTML = `<p class="eyebrow">Confirmación</p><h2>Pedido ${escapeHtml(order.id)}</h2><p class="lead">Quedó registrado para el equipo comercial. El pago acordado es ${escapeHtml(order.customer.metodo)}.</p><table class="summary-line"><tbody>${rows}</tbody></table><p class="cart-total">${money(order.total)}</p><p>${escapeHtml(order.customer.nombre)} · ${escapeHtml(order.customer.ciudad)}</p><a class="btn btn-ghost" href="${root}catalogo.html">Volver al catálogo</a>`;
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
      ciudad: String(data.get("ciudad") || "").trim(),
      telefono: String(data.get("telefono") || "").trim(),
      direccion: String(data.get("direccion") || "").trim(),
      metodo: String(data.get("metodo") || ""),
      nota: String(data.get("nota") || "").trim(),
    };
    const order = placeOrder(customer);
    const status = form.querySelector("[data-status]");
    if (!order) {
      status.textContent = "La bodega ya no alcanza para este pedido. Revise el carrito.";
      return;
    }
    location.href = `${root}compra.html?pedido=${order.id}`;
  });
}

function currentUser() {
  const raw = sessionStorage.getItem(KEYS.admin);
  if (!raw) return null;
  if (raw === "1") return USERS[0];
  try {
    const parsed = JSON.parse(raw);
    return USERS.find((user) => user.user === parsed.user) || null;
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
  document.querySelectorAll("[data-account-label]").forEach((node) => {
    node.textContent = session ? session.name : "Iniciar sesión";
  });
  document.querySelectorAll("[data-account-menu]").forEach((menu) => {
    if (session) {
      menu.innerHTML = `<p class="account-kicker">Sesión abierta</p><p class="account-role">${escapeHtml(session.name)}</p><p class="account-role">${escapeHtml(session.role)}</p><a href="${root}admin.html">Abrir panel</a><button type="button" data-logout>Salir</button>`;
      return;
    }
    const users = USERS.map((user) => `<a href="${root}admin.html?usuario=${user.user}"><strong>${escapeHtml(user.name)}</strong><span>${escapeHtml(user.user)} · ${escapeHtml(user.password)}</span></a>`).join("");
    menu.innerHTML = `<p class="account-kicker">Usuarios de ingreso</p>${users}<a class="account-enter" href="${root}admin.html">Entrar al panel</a>`;
  });
  const board = document.querySelector("[data-user-board]");
  if (board) {
    board.innerHTML = USERS.map((user) => `<button class="user-card" type="button" data-fill-user="${user.user}"><strong>${escapeHtml(user.name)}</strong><span>${escapeHtml(user.role)}</span><code>${escapeHtml(user.user)} · ${escapeHtml(user.password)}</code></button>`).join("");
  }
  const who = document.querySelector("[data-admin-who]");
  if (who && session) {
    who.textContent = `${session.name} · ${session.role}. Los ejemplos y los pedidos de este navegador se leen juntos.`;
  }
}

function logout() {
  sessionStorage.removeItem(KEYS.admin);
  closeAccounts();
  paintAccount();
  if (document.querySelector("[data-admin-login]")) renderAdmin();
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
    const preset = new URLSearchParams(location.search).get("usuario");
    const chosen = USERS.find((user) => user.user === preset);
    if (chosen) {
      const userField = login.querySelector("[name=usuario]");
      const passField = login.querySelector("[name=clave]");
      if (userField) userField.value = chosen.user;
      if (passField) passField.value = chosen.password;
      login.querySelectorAll("[data-fill-user]").forEach((card) => {
        card.classList.toggle("is-picked", card.dataset.fillUser === chosen.user);
      });
    }
    if (!login.dataset.bound) {
      login.dataset.bound = "1";
      login.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(login);
        const found = USERS.find((user) => user.user === data.get("usuario") && user.password === data.get("clave"));
        const error = login.querySelector("[data-admin-error]");
        if (!found) {
          error.textContent = "El usuario o la clave no coinciden.";
          return;
        }
        error.textContent = "";
        sessionStorage.setItem(KEYS.admin, JSON.stringify({ user: found.user, name: found.name }));
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
      <article class="admin-block"><p class="eyebrow">Unidades por línea</p><p class="admin-note">${low.length ? `Reponer ${low.map((item) => item.id).join(", ")}.` : "Ninguna referencia está en el mínimo."}</p>${meterList(byPlace)}</article>
    </div>`;

  const saleRows = list.length
    ? list.map((order) => `<tr><td>${escapeHtml(order.id)}${order.example ? '<span class="example-tag">Ejemplo</span>' : ""}</td><td>${new Date(order.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}</td><td>${escapeHtml(order.customer.nombre)}<br>${escapeHtml(order.customer.institucion || "")}</td><td>${escapeHtml(order.customer.ciudad)}<br>${escapeHtml(order.customer.metodo || "")}</td><td>${money(order.total)}</td><td><select data-status="${escapeHtml(order.id)}">${["Recibido", "En preparación", "Despachado", "Entregado"].map((status) => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select></td></tr>`).join("")
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
  warehouse.innerHTML = `<div class="admin-block"><p class="eyebrow">Existencia frente al mínimo</p><p class="admin-note">La marca vertical es el mínimo de reposición. Al confirmar una compra, la existencia baja.</p><ul class="meters stock-meters">${stockMeters}</ul></div><div class="admin-block"><p class="eyebrow">Bodega</p><div class="table-wrap"><table class="admin-table"><thead><tr><th>Ref.</th><th>Artículo</th><th>Línea</th><th>Ubicación</th><th>Mínimo</th><th>Existencia</th><th>Estado</th></tr></thead><tbody>${stockRows}</tbody></table></div></div>`;

  const catalog = document.querySelector('[data-admin-panel="catalogo"]');
  if (catalog) {
    const checks = ["todas", ...LINES].map((line) => {
      const label = line === "todas" ? "Todas" : line;
      return `<label><input type="checkbox" data-line-filter="${line}" checked> ${label}</label>`;
    }).join("");
    catalog.innerHTML = `<div class="admin-block"><p class="eyebrow">Descargar catálogo</p><p class="admin-note">Elija las líneas y descargue el archivo. Al abrirlo puede imprimirlo o guardarlo como PDF.</p><div class="line-filters">${checks}</div><p data-download-count></p><ul class="download-list" data-download-list></ul><button class="btn btn-metal" type="button" data-download-catalog>Descargar catálogo</button><p data-download-status></p></div>`;
    paintDownloadCount();
  }

  const allowed = ACCESS[session.user] || ACCESS.direccion;
  const tabs = [...document.querySelectorAll("[data-admin-tab]")];
  const panels = [...document.querySelectorAll("[data-admin-panel]")];
  tabs.forEach((tab) => {
    tab.hidden = !allowed.includes(tab.dataset.adminTab);
  });
  const show = (name) => {
    const current = allowed.includes(name) ? name : allowed[0];
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
}

document.addEventListener("click", (event) => {
  const accountToggle = event.target.closest("[data-account-toggle]");
  if (accountToggle) {
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
  const fill = event.target.closest("[data-fill-user]");
  if (fill) {
    const found = USERS.find((user) => user.user === fill.dataset.fillUser);
    const form = fill.closest("form");
    if (found && form) {
      form.querySelector("[name=usuario]").value = found.user;
      form.querySelector("[name=clave]").value = found.password;
      form.querySelectorAll("[data-fill-user]").forEach((card) => {
        card.classList.toggle("is-picked", card === fill);
      });
      form.querySelector("[data-admin-error]").textContent = "";
    }
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
  if (event.target.closest("[data-download-catalog]")) {
    const lines = selectedLines();
    const status = document.querySelector("[data-download-status]");
    if (!lines.length) {
      if (status) status.textContent = "Elija al menos una línea.";
      return;
    }
    const name = saveCatalog(lines);
    if (status) status.textContent = `Se descargó ${name}.`;
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

function catalogFile(items, lines) {
  const stock = stockMap();
  const cards = items.map((item) => {
    const photo = new URL(`img/productos/${item.id.toLowerCase()}.jpg`, location.href).href;
    return `<article>
      <img src="${photo}" alt="">
      <div>
        <p>${escapeHtml(item.id)} · ${escapeHtml(item.line)}</p>
        <h2>${escapeHtml(item.name)}</h2>
        <p>${escapeHtml(NOTES[item.id] || "")}</p>
        <p>${money(item.price)} · Existencia ${stock[item.id] ?? 0} · ${escapeHtml(item.place)}</p>
      </div>
    </article>`;
  }).join("");
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

function saveCatalog(lines) {
  const items = PRODUCTS.filter((item) => lines.includes(item.line));
  const blob = new Blob([catalogFile(items, lines)], { type: "text/html;charset=utf-8" });
  const link = document.createElement("a");
  const slug = lines.length === LINES.length ? "completo" : lines.map((line) => line.toLowerCase()).join("-");
  const name = `deltactica-catalogo-${slug}.html`;
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  return name;
}

document.addEventListener("change", (event) => {
  const select = event.target.closest("[data-status]");
  if (select) {
    const next = orders().map((order) => (
      order.id === select.dataset.status ? { ...order, status: select.value } : order
    ));
    write(KEYS.orders, next);
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
  const form = event.target.closest("[data-stock-form]");
  if (!form) return;
  event.preventDefault();
  const stock = stockMap();
  stock[form.dataset.stockForm] = Math.max(0, Number(new FormData(form).get("qty")) || 0);
  write(KEYS.stock, stock);
  renderAdmin();
});

paintCount();
paintPrices();
renderCart();
renderCheckout();
paintAccount();
renderAdmin();
