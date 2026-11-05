(function () {
  const panel = document.querySelector('[data-admin-panel="prendas"]');
  if (!panel || !window.DT_CATALOG) return;

  const plain = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const vistas = window.DT_VISTAS || {};
  const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

  function ficha(item) {
    const nombre = plain(item.name);
    const modelo = window.DT_MODELOS && window.DT_MODELOS[item.id];
    if (modelo && modelo.archivo) {
      return { categoria: "Modelo propio", ancla: modelo.ancla || "cuerpo", orden: "archivo", estado: "Modelo GLB", convierte: false };
    }
    if (vistas[item.id]) {
      if (/uniforme|overol/.test(nombre)) return { categoria: "Uniforme", ancla: "cuerpo", orden: "completo", estado: "Modelo 3D", convierte: true };
      if (/chaqueta/.test(nombre)) return { categoria: "Chaqueta", ancla: "torso y brazos", orden: "sobre la camisa", estado: "Modelo 3D", convierte: true };
      if (/chaleco/.test(nombre)) return { categoria: "Chaleco", ancla: "torso", orden: "sobre la camisa", estado: "Modelo 3D", convierte: true };
      if (/\bfalda\b/.test(nombre)) return { categoria: "Falda", ancla: "cintura", orden: "inferior", estado: "Modelo 3D", convierte: true };
      if (/\bpantalon|\blicra\b|pantaloneta/.test(nombre)) return { categoria: "Pantalón", ancla: "cintura y piernas", orden: "inferior", estado: "Modelo 3D", convierte: true };
      return { categoria: "Camisa", ancla: "cuello, hombros y brazos", orden: "sobre el torso", estado: "Modelo 3D", convierte: true };
    }
    if (/porta|linterna|cordon|\bmedias?\b|velcro/.test(nombre)) return null;
    if (/\bchapa\b/.test(nombre) && !/correa|corra|cinturon/.test(nombre)) return null;
    if (/\b(gorra|boina|pasamontan|cachucha|casco|kepis|pava)\b/.test(nombre)) return { categoria: "Gorra", ancla: "cabeza", orden: "cabeza", estado: "Modelo 3D", convierte: true };
    if (/\b(botas?|zapatos?|zapatoz)\b/.test(nombre)) return { categoria: "Calzado", ancla: "pies", orden: "pies", estado: "Pendiente de conversión", convierte: false };
    if (/\b(reata|correas?|corras?|cinturon)\b/.test(nombre)) return { categoria: "Reata", ancla: "cintura", orden: "sobre el pantalón", estado: "Pendiente de conversión", convierte: false };
    if (/\b(guantes?|gafas?|gasfas?)\b/.test(nombre)) return { categoria: /gafa|gasfa/.test(nombre) ? "Gafas" : "Guantes", ancla: /gafa|gasfa/.test(nombre) ? "ojos" : "manos", orden: "extremo", estado: "Pendiente de conversión", convierte: false };
    return null;
  }

  function sexoDe(item) {
    const nombre = plain(item.name);
    if (/femenin|\bmujer\b|\bdama\b/.test(nombre)) return "Mujer";
    if (/masculin|\bhombre\b|caballer/.test(nombre)) return "Hombre";
    return "Los dos, sobre el cuerpo en el que se viste";
  }

  const prendas = window.DT_CATALOG.map((item) => {
    const datos = ficha(item);
    return datos ? { item, datos } : null;
  }).filter(Boolean);

  const clave = "dt-prenda-3d";
  const leer = () => {
    try { return JSON.parse(localStorage.getItem(clave) || "{}"); } catch (error) { return {}; }
  };

  panel.innerHTML = `<article class="admin-block">
    <p class="eyebrow">Prendas 3D</p>
    <p class="admin-note">La camisa y el pantalón se construyen con volumen sobre el maniquí. El 1 copia ese cuerpo. Un valor de 1,10 lo hace diez por ciento más amplio o más largo. Estas cifras no salen de la fotografía.</p>
    <form class="panel-form" data-p3d-form>
      <label>Prenda<select name="prenda">${prendas.map(({ item }) => `<option value="${item.id}">${item.id} ${escapeHtml(item.name)}</option>`).join("")}</select></label>
      <p data-p3d-estado></p>
      <label>Ancho<input name="ancho" type="number" min="0.8" max="1.25" step="0.01" value="1"></label>
      <label>Largo de la camisa<input name="largo" type="number" min="0.8" max="1.25" step="0.01" value="1"></label>
      <label>Largo de manga<input name="manga" type="number" min="0.8" max="1.25" step="0.01" value="1"></label>
      <label>Cintura del pantalón<input name="cintura" type="number" min="0.8" max="1.25" step="0.01" value="1"></label>
      <label>Largo de pierna<input name="pierna" type="number" min="0.8" max="1.25" step="0.01" value="1"></label>
      <button class="btn btn-metal" type="submit">Guardar ajuste</button>
    </form>
    <p data-p3d-aviso></p>
  </article>`;

  const form = panel.querySelector("[data-p3d-form]");
  const estado = panel.querySelector("[data-p3d-estado]");
  const aviso = panel.querySelector("[data-p3d-aviso]");
  const select = form.elements.prenda;

  function pintar() {
    const actual = prendas.find(({ item }) => item.id === select.value) || prendas[0];
    if (!actual) return;
    const guardado = leer()[actual.item.id] || {};
    ["ancho", "largo", "manga", "cintura", "pierna"].forEach((campo) => {
      form.elements[campo].value = guardado[campo] || 1;
      form.elements[campo].disabled = !actual.datos.convierte;
    });
    estado.textContent = `${actual.datos.estado}. ${actual.datos.categoria}. Género: ${sexoDe(actual.item)}. Ancla: ${actual.datos.ancla}. Capa: ${actual.datos.orden}.`;
  }

  select.addEventListener("change", pintar);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const actual = prendas.find(({ item }) => item.id === select.value);
    if (!actual || !actual.datos.convierte) {
      aviso.textContent = "Esta prenda sigue pendiente de conversión. El ajuste queda reservado a la camisa y al pantalón.";
      return;
    }
    const todo = leer();
    const numero = (campo) => {
      const n = Number(form.elements[campo].value);
      return Number.isFinite(n) ? Math.min(1.25, Math.max(0.8, n)) : 1;
    };
    todo[actual.item.id] = {
      ancho: numero("ancho"),
      largo: numero("largo"),
      manga: numero("manga"),
      cintura: numero("cintura"),
      pierna: numero("pierna")
    };
    localStorage.setItem(clave, JSON.stringify(todo));
    aviso.textContent = `Ajuste guardado para ${actual.item.id}. Al volver a Prueba tu uniforme, la prenda usa estas proporciones.`;
  });
  pintar();
})();
