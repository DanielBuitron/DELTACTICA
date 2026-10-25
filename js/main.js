const phone = document.body.dataset.wa;

function waUrl(text) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

document.querySelectorAll("[data-wa-text]").forEach((link) => {
  link.href = waUrl(link.dataset.waText);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});

const header = document.querySelector("[data-header]");
const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const toggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

const desktopNav = window.matchMedia("(min-width: 1181px)");

function setNav(open) {
  if (!nav || !toggle) return;
  const show = desktopNav.matches ? false : open;
  nav.classList.toggle("is-open", show);
  toggle.setAttribute("aria-expanded", show ? "true" : "false");
  toggle.querySelector(".sr-only").textContent = show ? "Cerrar menú" : "Abrir menú";
  document.body.classList.toggle("nav-open", show);
  nav.inert = desktopNav.matches ? false : !show;
}

desktopNav.addEventListener("change", () => setNav(false));

if (toggle && nav) {
  toggle.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setNav(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setNav(false);
  });
  setNav(false);
}

const filters = [...document.querySelectorAll("[data-filter]")];
const cards = [...document.querySelectorAll(".card")];
const count = document.querySelector("[data-count]");
const catalogQuery = document.querySelector("[data-catalog-query]");

function setFilter(button, on) {
  button.classList.toggle("is-active", on);
  button.setAttribute("aria-pressed", on ? "true" : "false");
}

function lineFilters() {
  return filters.filter((button) => button.dataset.filter !== "todos");
}

function syncAllFilter() {
  const all = filters.find((button) => button.dataset.filter === "todos");
  if (all) setFilter(all, lineFilters().every((button) => button.getAttribute("aria-pressed") === "true"));
}

function applyCatalogFilter() {
  if (!count) return;
  const lines = lineFilters()
    .filter((button) => button.getAttribute("aria-pressed") === "true")
    .map((button) => button.dataset.filter);
  const query = (catalogQuery?.value || "").trim().toLowerCase();
  let visible = 0;
  cards.forEach((card) => {
    const show = lines.includes(card.dataset.cat) && (!query || card.textContent.toLowerCase().includes(query));
    card.hidden = !show;
    if (show) visible += 1;
  });
  count.textContent = visible === 1 ? "1 referencia" : `${visible} referencias`;
}

if (count) filters.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.filter === "todos") {
      const on = button.getAttribute("aria-pressed") !== "true";
      filters.forEach((item) => setFilter(item, on));
    } else {
      setFilter(button, button.getAttribute("aria-pressed") !== "true");
      syncAllFilter();
    }
    applyCatalogFilter();
  });
});

if (catalogQuery) catalogQuery.addEventListener("input", applyCatalogFilter);

const presetLine = new URLSearchParams(location.search).get("linea");
const presetFilter = presetLine && document.querySelector(`[data-filter="${presetLine}"]`);
if (presetFilter && presetFilter.dataset.filter !== "todos") {
  lineFilters().forEach((button) => setFilter(button, button === presetFilter));
  syncAllFilter();
  applyCatalogFilter();
}

const form = document.querySelector("[data-form]");
const status = document.querySelector("[data-status]");

if (form && status) form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const detalle = String(data.get("detalle") || "").trim();
  const text = [
    "Hola, quiero hablar con el asesor comercial de Deltactica.",
    "",
    `Nombre: ${data.get("nombre")}`,
    `Institución: ${data.get("institucion")}`,
    `Ciudad: ${data.get("ciudad")}`,
    `Interés: ${data.get("interes")}`,
    `Detalle: ${detalle || "Sin detalle adicional"}`,
  ].join("\n");

  const url = waUrl(text);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    status.innerHTML = "";
    const fallback = document.createElement("a");
    fallback.href = url;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.textContent = "Abrir WhatsApp con el mensaje para el asesor";
    status.append("Si la ventana no se abrió, ", fallback, ".");
    return;
  }

  status.textContent = "Se abrió WhatsApp con su mensaje para el asesor comercial.";
});
