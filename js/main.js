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
const menuQuery = document.querySelector("[data-menu-query]");

function setFilter(button, on) {
  button.classList.toggle("is-active", on);
  button.setAttribute("aria-pressed", on ? "true" : "false");
}

function lineFilters() {
  return filters.filter((button) => button.dataset.filter !== "todos");
}

function allFilter() {
  return filters.find((button) => button.dataset.filter === "todos");
}

function applyCatalogFilter() {
  if (!count) return;
  const todas = allFilter()?.getAttribute("aria-pressed") === "true";
  const lines = lineFilters()
    .filter((button) => button.getAttribute("aria-pressed") === "true")
    .map((button) => button.dataset.filter);
  const query = (menuQuery?.value || "").trim();
  const hits = query && window.DTSearch ? window.DTSearch.match(query).map((item) => item.id) : null;
  let visible = 0;
  cards.forEach((card) => {
    const id = card.querySelector("[data-add]")?.dataset.add || "";
    const inLine = todas || lines.includes(card.dataset.cat);
    const show = query ? Boolean(hits && hits.includes(id)) : inLine;
    card.hidden = !show;
    if (show) visible += 1;
  });
  count.textContent = visible === 1 ? "1 referencia" : `${visible} referencias`;
}

if (count) filters.forEach((button) => {
  button.addEventListener("click", () => {
    const todas = allFilter();
    if (button.dataset.filter === "todos") {
      lineFilters().forEach((item) => setFilter(item, false));
      setFilter(todas, true);
    } else if (todas?.getAttribute("aria-pressed") === "true") {
      lineFilters().forEach((item) => setFilter(item, item === button));
      setFilter(todas, false);
    } else {
      setFilter(button, button.getAttribute("aria-pressed") !== "true");
      const any = lineFilters().some((item) => item.getAttribute("aria-pressed") === "true");
      setFilter(todas, !any);
    }
    applyCatalogFilter();
  });
});

if (menuQuery && count) menuQuery.addEventListener("input", applyCatalogFilter);

const presetLine = new URLSearchParams(location.search).get("linea");
const presetFilter = presetLine && document.querySelector(`[data-filter="${presetLine}"]`);
if (presetFilter && presetFilter.dataset.filter !== "todos") {
  lineFilters().forEach((button) => setFilter(button, button === presetFilter));
  setFilter(allFilter(), false);
}
const presetQuery = new URLSearchParams(location.search).get("q");
if (presetQuery && menuQuery) menuQuery.value = presetQuery;
if (count && (presetFilter || presetQuery)) applyCatalogFilter();

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
