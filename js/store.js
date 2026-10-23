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

const KEYS = { cart: "dt-cart", orders: "dt-orders", stock: "dt-stock", admin: "dt-admin" };
const ADMIN_PASSWORD = "deltactica";
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

function orders() {
  const saved = read(KEYS.orders, null);
  if (saved) return saved;
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

function renderAdmin() {
  const login = document.querySelector("[data-admin-login]");
  const shell = document.querySelector("[data-admin-shell]");
  if (!login || !shell) return;
  const open = sessionStorage.getItem(KEYS.admin) === "1";
  login.hidden = open;
  shell.hidden = !open;
  if (!open) {
    login.addEventListener("submit", (event) => {
      event.preventDefault();
      const clave = new FormData(login).get("clave");
      const error = login.querySelector("[data-admin-error]");
      if (clave !== ADMIN_PASSWORD) {
        error.textContent = "La clave no coincide.";
        return;
      }
      sessionStorage.setItem(KEYS.admin, "1");
      renderAdmin();
    });
    return;
  }

  const list = orders();
  const stock = stockMap();
  const sold = list.reduce((sum, order) => sum + order.total, 0);
  const pending = list.filter((order) => order.status !== "Entregado").length;
  const low = PRODUCTS.filter((item) => (stock[item.id] ?? 0) <= item.min);
  const units = Object.values(stock).reduce((sum, value) => sum + value, 0);

  const general = document.querySelector('[data-admin-panel="general"]');
  const sales = document.querySelector('[data-admin-panel="ventas"]');
  const warehouse = document.querySelector('[data-admin-panel="bodega"]');
  general.innerHTML = `<div class="stats">
      <article class="stat"><span>Referencias</span><strong>${PRODUCTS.length}</strong></article>
      <article class="stat"><span>Unidades en bodega</span><strong>${units}</strong></article>
      <article class="stat"><span>Pedidos</span><strong>${list.length}</strong></article>
      <article class="stat"><span>Ventas</span><strong>${money(sold)}</strong></article>
    </div>
    <div class="admin-block"><p class="eyebrow">Información general</p><p>Línea propia de artículos tácticos y militares. Cinco familias: campo, faena, abrigo, calzado y equipo. Los pedidos confirmados en la tienda quedan en este navegador, junto con la existencia de bodega.</p><p>Por despachar: ${pending}. Referencias en el mínimo o por debajo: ${low.length ? low.map((item) => item.id).join(", ") : "ninguna"}.</p></div>`;

  const saleRows = list.length
    ? list.map((order) => `<tr><td>${escapeHtml(order.id)}</td><td>${new Date(order.date).toLocaleString("es-CO")}</td><td>${escapeHtml(order.customer.nombre)}<br>${escapeHtml(order.customer.institucion || "")}</td><td>${escapeHtml(order.customer.ciudad)}</td><td>${money(order.total)}</td><td><select data-status="${escapeHtml(order.id)}">${["Recibido", "En preparación", "Despachado", "Entregado"].map((status) => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select></td></tr>`).join("")
    : `<tr><td colspan="6">Todavía no hay pedidos. Una compra confirmada aparece en esta tabla.</td></tr>`;
  sales.innerHTML = `<div class="admin-block"><p class="eyebrow">Información de ventas</p><p class="admin-note">Total registrado: ${money(sold)}</p><table class="admin-table"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Ciudad</th><th>Total</th><th>Estado</th></tr></thead><tbody>${saleRows}</tbody></table></div>`;

  const stockRows = PRODUCTS.map((item) => {
    const left = stock[item.id] ?? 0;
    const mark = left <= item.min ? "low" : "";
    return `<tr class="${mark}"><td>${item.id}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.line)}</td><td>${escapeHtml(item.place)}</td><td>${item.min}</td><td><form class="stock-edit" data-stock-form="${item.id}"><input name="qty" type="number" min="0" value="${left}" aria-label="Existencia de ${item.id}"><button class="linkish" type="submit">Guardar</button></form></td><td>${left <= item.min ? "Reponer" : "Disponible"}</td></tr>`;
  }).join("");
  warehouse.innerHTML = `<div class="admin-block"><p class="eyebrow">Bodega</p><p class="admin-note">Existencia por referencia, pasillo y mínimo de reposición. Al confirmar una compra, la existencia baja.</p><table class="admin-table"><thead><tr><th>Ref.</th><th>Artículo</th><th>Línea</th><th>Ubicación</th><th>Mínimo</th><th>Existencia</th><th>Estado</th></tr></thead><tbody>${stockRows}</tbody></table></div>`;

  const tabs = [...document.querySelectorAll("[data-admin-tab]")];
  const panels = [...document.querySelectorAll("[data-admin-panel]")];
  const show = (name) => {
    const current = panels.some((panel) => panel.dataset.adminPanel === name) ? name : "general";
    tabs.forEach((tab) => tab.classList.toggle("is-on", tab.dataset.adminTab === current));
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.adminPanel !== current;
    });
  };
  if (!shell.dataset.ready) {
    shell.dataset.ready = "1";
    tabs.forEach((tab) => tab.addEventListener("click", () => show(tab.dataset.adminTab)));
  }
  show((location.hash || "#general").slice(1));
}

document.addEventListener("click", (event) => {
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
  }
});

document.addEventListener("change", (event) => {
  const select = event.target.closest("[data-status]");
  if (!select) return;
  const next = orders().map((order) => (
    order.id === select.dataset.status ? { ...order, status: select.value } : order
  ));
  write(KEYS.orders, next);
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
renderAdmin();
