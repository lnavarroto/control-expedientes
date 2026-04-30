import { renderTable } from "../../components/table.js";
import { expedienteService } from "../../services/expedienteService.js";
import { icon } from "../../components/icons.js";

export async function initMovimientosModularPage({ mountNode }) {
  mountNode.innerHTML = `
    <section class="space-y-5">
      <div class="rounded-2xl p-5 text-white shadow-lg"
  style="background: linear-gradient(145deg, var(--color-brand), var(--color-brand-2)); box-shadow: var(--shadow-soft);">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="bg-white/10 rounded-xl p-3">${icon("truck", "w-8 h-8")}</span>
            <div>
              <h1 class="text-xl md:text-2xl font-bold">Historial de Movimientos</h1>
              <p class="text-blue-100 text-sm">Traslados, préstamos, salidas y retornos de expedientes.</p>
            </div>
          </div>

          <button id="btn-limpiar-filtros"
            class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold transition">
            Limpiar filtros
          </button>
        </div>
      </div>

      <div id="movimientos-kpis" class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        ${renderKpiSkeleton()}
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-blue-600">${icon("search", "w-4 h-4")}</span>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Filtros de búsqueda</h3>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <div class="relative">
            <input id="filtro-mov-texto"
              class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Buscar expediente, motivo, obs..." />
            <span class="absolute left-3 top-2.5 text-slate-400">${icon("search", "w-4 h-4")}</span>
          </div>

          <select id="filtro-mov-tipo" class="input-filter">
            <option value="">Todos los tipos</option>
            <option value="TRASLADO">Traslado</option>
            <option value="PRESTAMO">Préstamo</option>
            <option value="SALIDA">Salida</option>
            <option value="RETORNO">Retorno</option>
            <option value="DEVOLUCION">Devolución</option>
          </select>

          <select id="filtro-mov-usuario" class="input-filter">
            <option value="">Todos los usuarios</option>
          </select>

          <select id="filtro-mov-origen" class="input-filter">
            <option value="">Todos los orígenes</option>
          </select>

          <select id="filtro-mov-destino" class="input-filter">
            <option value="">Todos los destinos</option>
          </select>

          <input id="filtro-mov-expediente"
            class="input-filter"
            placeholder="N° expediente" />

          <input id="filtro-mov-desde" type="date" class="input-filter" />
          <input id="filtro-mov-hasta" type="date" class="input-filter" />

          <select id="filtro-mov-orden" class="input-filter">
            <option value="reciente">Más recientes primero</option>
            <option value="antiguo">Más antiguos primero</option>
            <option value="expediente">Ordenar por expediente</option>
            <option value="tipo">Ordenar por tipo</option>
          </select>

          <label class="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 cursor-pointer hover:bg-slate-50 rounded-lg">
            <input id="filtro-mov-hoy" type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span>Solo hoy</span>
          </label>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 class="text-base font-semibold text-slate-800 flex items-center gap-2">
            <span class="w-1.5 h-5 bg-blue-500 rounded-full"></span>
            Registro de movimientos
          </h2>
          <span class="text-xs text-slate-500" id="movimientos-total"></span>
        </div>

        <div class="p-5" id="movimientos-table">
          ${renderTableSkeleton()}
        </div>
      </div>
    </section>
  `;

  agregarEstiloFiltros();

  await new Promise(resolve => requestAnimationFrame(resolve));

  const resultado = await expedienteService.listarMovimientosActivos();

  const data = normalizarMovimientos(resultado || []);

  const usuarios = obtenerUnicos(data, "realizadoPor");
  const origenes = obtenerUnicos(data, "origen");
  const destinos = obtenerUnicos(data, "destino");

  cargarSelect("filtro-mov-usuario", usuarios, limpiarUsuario);
  cargarSelect("filtro-mov-origen", origenes);
  cargarSelect("filtro-mov-destino", destinos);

  const kpiNode = document.getElementById("movimientos-kpis");
  const tableNode = document.getElementById("movimientos-table");
  const totalNode = document.getElementById("movimientos-total");


  function filtrarRows() {
    const texto = normalizarTexto(valor("filtro-mov-texto"));
    const tipo = valor("filtro-mov-tipo");
    const usuario = valor("filtro-mov-usuario");
    const origen = valor("filtro-mov-origen");
    const destino = valor("filtro-mov-destino");
    const expediente = normalizarTexto(valor("filtro-mov-expediente"));
    const desde = valor("filtro-mov-desde");
    const hasta = valor("filtro-mov-hasta");
    const soloHoy = document.getElementById("filtro-mov-hoy")?.checked;
    const orden = valor("filtro-mov-orden");

    let rows = data.filter((row) => {
      const bolsa = normalizarTexto(`
        ${row.fecha}
        ${row.hora}
        ${row.numeroExpediente}
        ${row.tipo}
        ${row.origen}
        ${row.destino}
        ${row.realizadoPor}
        ${row.motivo}
        ${row.observacion}
      `);

      return (!texto || bolsa.includes(texto))
        && (!tipo || row.tipo?.toUpperCase() === tipo.toUpperCase())
        && (!usuario || row.realizadoPor === usuario)
        && (!origen || row.origen === origen)
        && (!destino || row.destino === destino)
        && (!expediente || normalizarTexto(row.numeroExpediente).includes(expediente))
        && (!soloHoy || esMismoDia(row.fecha))
        && cumpleRangoFecha(row.fecha, desde, hasta);
    });

    rows = ordenarRows(rows, orden);
    return rows;
  }

  function renderResumen(rows) {
    const resumen = {
      total: rows.length,
      hoy: rows.filter((r) => esMismoDia(r.fecha)).length,
      traslados: rows.filter((r) => r.tipo?.toUpperCase().includes("TRASLADO")).length,
      prestamos: rows.filter((r) => r.tipo?.toUpperCase().includes("PRESTAMO") || r.tipo?.toUpperCase().includes("SALIDA")).length,
      retornos: rows.filter((r) => r.tipo?.toUpperCase().includes("RETORNO") || r.tipo?.toUpperCase().includes("DEVOLUCION")).length
    };

    const cards = [
      { label: "Total", value: resumen.total, iconName: "list", type: "brand" },
      { label: "Hoy", value: resumen.hoy, iconName: "calendar", type: "accent" },
      { label: "Traslados", value: resumen.traslados, iconName: "truck", type: "soft" },
      { label: "Préstamos", value: resumen.prestamos, iconName: "users", type: "warning" },
      { label: "Retornos", value: resumen.retornos, iconName: "rotateCcw", type: "dark" }
    ];

    kpiNode.innerHTML = cards.map((card) => `
      <div class="mov-kpi mov-kpi--${card.type}">
        <div class="mov-kpi__glow"></div>
        <div class="mov-kpi__content">
          <div>
            <p class="mov-kpi__label">${card.label}</p>
            <p class="mov-kpi__value">${card.value}</p>
          </div>
          <span class="mov-kpi__icon">${icon(card.iconName, "w-5 h-5")}</span>
        </div>
      </div>
    `).join("");
  }

  function render() {
    const rows = filtrarRows();

    renderResumen(rows);

    totalNode.textContent = `${rows.length} movimiento${rows.length !== 1 ? "s" : ""} encontrado${rows.length !== 1 ? "s" : ""}`;

    tableNode.innerHTML = renderTable({
      columns: [
        { key: "fecha", label: "Fecha" },
        { key: "hora", label: "Hora" },
        { key: "tipo", label: "Tipo" },
        { key: "numeroExpediente", label: "Expediente" },
        { key: "origen", label: "Origen" },
        { key: "destino", label: "Destino" },
        { key: "estadoAnterior", label: "Estado Ant." },
        { key: "estadoNuevo", label: "Estado Nuevo" },
        { key: "realizadoPor", label: "Realizado por" },
        { key: "motivo", label: "Motivo" },
        { key: "observacion", label: "Observación" }
      ],
      rows: rows.map((row) => ({
        ...row,
        tipo: renderTipoBadge(row.tipo),
        numeroExpediente: renderExpediente(row.numeroExpediente),
        realizadoPor: renderUsuarioTexto(row.realizadoPor),
        estadoAnterior: renderBadge(row.estadoAnterior, "blue"),
        estadoNuevo: renderBadge(row.estadoNuevo, "green"),
        observacion: renderObservacion(row.observacion)
      })),
      emptyText: "No se encontraron movimientos con los filtros seleccionados"
    });
  }

  [
    "filtro-mov-texto", "filtro-mov-tipo", "filtro-mov-usuario",
    "filtro-mov-origen", "filtro-mov-destino", "filtro-mov-expediente",
    "filtro-mov-desde", "filtro-mov-hasta", "filtro-mov-hoy", "filtro-mov-orden"
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", render);
    document.getElementById(id)?.addEventListener("change", render);
  });

  document.getElementById("btn-limpiar-filtros")?.addEventListener("click", () => {
    [
      "filtro-mov-texto", "filtro-mov-tipo", "filtro-mov-usuario",
      "filtro-mov-origen", "filtro-mov-destino", "filtro-mov-expediente",
      "filtro-mov-desde", "filtro-mov-hasta"
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    const hoy = document.getElementById("filtro-mov-hoy");
    if (hoy) hoy.checked = false;

    const orden = document.getElementById("filtro-mov-orden");
    if (orden) orden.value = "reciente";

    render();
  });

  render();
}

// =====================
// HELPERS (mismos que tu movimientosPage.js)
// =====================

function renderKpiSkeleton() {
  const cards = [
    { label: "Total", iconName: "list", type: "brand" },
    { label: "Hoy", iconName: "calendar", type: "accent" },
    { label: "Traslados", iconName: "truck", type: "soft" },
    { label: "Préstamos", iconName: "users", type: "warning" },
    { label: "Retornos", iconName: "rotateCcw", type: "dark" }
  ];

  return cards.map((card) => `
    <div class="mov-kpi mov-kpi--${card.type} mov-kpi-loading">
      <div class="mov-kpi__glow"></div>
      <div class="mov-kpi__content">
        <div>
          <p class="mov-kpi__label">${card.label}</p>
          <p class="mov-kpi__value">...</p>
        </div>
        <span class="mov-kpi__icon">${icon(card.iconName, "w-5 h-5")}</span>
      </div>
    </div>
  `).join("");
}

function renderTableSkeleton() {
  return `
    <div class="space-y-2">
      ${Array.from({ length: 8 }).map(() => `
        <div class="h-10 rounded-lg bg-slate-200 animate-pulse"></div>
      `).join("")}
    </div>
  `;
}

function normalizarMovimientos(resultado) {
  return resultado.map((item) => ({
    ...item,
    tipo: item.tipo || "TRASLADO"
  }));
}

function valor(id) {
  return document.getElementById(id)?.value || "";
}

function normalizarTexto(valor = "") {
  return String(valor).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function obtenerUnicos(rows, key) {
  return [...new Set(rows.map((item) => item[key]).filter(Boolean))];
}

function cargarSelect(id, items, formatter = (x) => x) {
  const select = document.getElementById(id);
  if (!select) return;

  const firstOption = select.querySelector("option")?.outerHTML || `<option value="">Todos</option>`;

  select.innerHTML = firstOption + items.map((item) => `
    <option value="${escapeHtml(item)}">${escapeHtml(formatter(item))}</option>
  `).join("");
}

function limpiarUsuario(texto = "") {
  return String(texto).replace(/^\d+\s*-\s*/, "");
}

function esMismoDia(fechaString) {
  if (!fechaString) return false;
  const hoy = new Date();
  const ymd = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const dmy = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`;
  return String(fechaString).includes(ymd) || String(fechaString).includes(dmy);
}

function convertirFecha(fechaString) {
  if (!fechaString) return null;
  const texto = String(fechaString).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return new Date(texto.substring(0, 10));
  if (/^\d{2}\/\d{2}\/\d{4}/.test(texto)) {
    const [dia, mes, anio] = texto.substring(0, 10).split("/");
    return new Date(`${anio}-${mes}-${dia}`);
  }
  const fecha = new Date(texto);
  return isNaN(fecha.getTime()) ? null : fecha;
}

function cumpleRangoFecha(fecha, desde, hasta) {
  const fechaRow = convertirFecha(fecha);
  if (!fechaRow) return !desde && !hasta;
  if (desde) {
    const fechaDesde = new Date(`${desde}T00:00:00`);
    if (fechaRow < fechaDesde) return false;
  }
  if (hasta) {
    const fechaHasta = new Date(`${hasta}T23:59:59`);
    if (fechaRow > fechaHasta) return false;
  }
  return true;
}

function ordenarRows(rows, orden) {
  const copia = [...rows];
  if (orden === "antiguo") return copia.sort((a, b) => compararFechaHora(a, b));
  if (orden === "expediente") return copia.sort((a, b) => String(a.numeroExpediente).localeCompare(String(b.numeroExpediente)));
  if (orden === "tipo") return copia.sort((a, b) => String(a.tipo).localeCompare(String(b.tipo)));
  return copia.sort((a, b) => compararFechaHora(b, a));
}

function compararFechaHora(a, b) {
  const fechaA = convertirFecha(`${a.fecha} ${a.hora}`) || convertirFecha(a.fecha) || new Date(0);
  const fechaB = convertirFecha(`${b.fecha} ${b.hora}`) || convertirFecha(b.fecha) || new Date(0);
  return fechaA - fechaB;
}

function renderBadge(texto, color) {
  if (!texto) return `<span class="text-slate-300">—</span>`;
  const colors = {
    blue: "mov-badge mov-badge--brand",
    purple: "mov-badge mov-badge--accent",
    green: "mov-badge mov-badge--success",
    amber: "mov-badge mov-badge--warning",
    slate: "mov-badge mov-badge--muted"
  };
  return `<span class="${colors[color] || colors.slate}">${escapeHtml(texto)}</span>`;
}

function renderTipoBadge(tipo) {
  const tipos = {
    "TRASLADO": "mov-badge mov-badge--brand",
    "PRESTAMO": "mov-badge mov-badge--warning",
    "SALIDA": "mov-badge mov-badge--accent",
    "RETORNO": "mov-badge mov-badge--success",
    "DEVOLUCION": "mov-badge mov-badge--dark"
  };
  const tipoUpper = String(tipo || "").toUpperCase();
  const classes = tipos[tipoUpper] || "mov-badge mov-badge--muted";
  return `<span class="${classes}">${escapeHtml(tipo)}</span>`;
}

function renderUsuarioTexto(texto) {
  if (!texto) return `<span class="text-slate-300">—</span>`;
  const limpio = limpiarUsuario(texto);
  return `<span title="${escapeHtml(texto)}" class="text-slate-700 font-medium">${escapeHtml(limpio)}</span>`;
}

function renderExpediente(texto) {
  if (!texto) return `<span class="text-slate-300">—</span>`;
  return `<span class="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">${escapeHtml(texto)}</span>`;
}

function renderObservacion(texto) {
  if (!texto) return `<span class="text-slate-300">—</span>`;
  const limpio = String(texto);
  const corto = limpio.length > 70 ? `${limpio.substring(0, 70)}...` : limpio;
  return `<span title="${escapeHtml(limpio)}" class="text-slate-600">${escapeHtml(corto)}</span>`;
}

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function agregarEstiloFiltros() {
  if (document.getElementById("movimientos-filter-style")) return;

  const style = document.createElement("style");
  style.id = "movimientos-filter-style";
  style.textContent = `
    .input-filter {
      width: 100%;
      padding: 0.58rem 0.78rem;
      font-size: 0.875rem;
      border: 1px solid var(--color-border);
      border-radius: 0.72rem;
      background: var(--color-surface);
      color: var(--color-text);
      outline: none;
      transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease;
    }
    .input-filter::placeholder {
      color: #8a99a8;
      text-transform: uppercase;
      font-size: 0.76rem;
      letter-spacing: 0.02em;
    }
    .input-filter:focus {
      border-color: var(--color-brand-2);
      box-shadow: 0 0 0 3px rgba(29, 95, 139, 0.14);
      background: #ffffff;
    }
    .mov-kpi {
      position: relative;
      overflow: hidden;
      border-radius: var(--radius-lg);
      padding: 1rem;
      min-height: 5.1rem;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-soft);
    }
    .mov-kpi__glow {
      position: absolute;
      top: -2.4rem;
      right: -2.4rem;
      width: 6rem;
      height: 6rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.18);
    }
    .mov-kpi__content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.8rem;
    }
    .mov-kpi__label {
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.8;
    }
    .mov-kpi__value {
      margin-top: 0.2rem;
      font-size: 1.75rem;
      line-height: 1;
      font-weight: 900;
    }
    .mov-kpi__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.15rem;
      height: 2.15rem;
      border-radius: 0.8rem;
      background: rgba(255, 255, 255, 0.18);
    }
    .mov-kpi--brand { color: #ffffff; background: linear-gradient(145deg, var(--color-brand), var(--color-brand-2)); border-color: rgba(29, 95, 139, 0.35); }
    .mov-kpi--accent { color: #ffffff; background: linear-gradient(145deg, #2f596b, var(--color-accent)); border-color: rgba(63, 106, 125, 0.35); }
    .mov-kpi--soft { color: var(--color-brand); background: linear-gradient(180deg, #ffffff 0%, #eef6fb 100%); border-color: #c7d8e6; }
    .mov-kpi--soft .mov-kpi__icon { background: #e1eef7; color: var(--color-brand-2); }
    .mov-kpi--warning { color: #ffffff; background: linear-gradient(145deg, #8f5a18, var(--color-warning)); border-color: rgba(178, 113, 31, 0.35); }
    .mov-kpi--dark { color: #ffffff; background: linear-gradient(145deg, #142433, #0b1724); border-color: rgba(20, 36, 51, 0.45); }
    .mov-badge { display: inline-flex; align-items: center; justify-content: center; padding: 0.18rem 0.62rem; border-radius: 999px; border: 1px solid transparent; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.01em; }
    .mov-badge--brand { color: var(--color-brand-2); background: #e8f1f7; border-color: #c7dbea; }
    .mov-badge--accent { color: var(--color-accent); background: #eef5f8; border-color: #c9dce5; }
    .mov-badge--success { color: var(--color-success); background: #eaf7ef; border-color: #bde3cb; }
    .mov-badge--warning { color: var(--color-warning); background: #fff6e8; border-color: #f1d3a3; }
    .mov-badge--muted { color: var(--color-muted); background: #f1f5f9; border-color: #d8e1ea; }
    .mov-badge--dark { color: #ffffff; background: #1e293b; border-color: #334155; }
  `;

  document.head.appendChild(style);
}