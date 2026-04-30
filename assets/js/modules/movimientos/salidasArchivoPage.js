import { renderTable } from "../../components/table.js";
import { expedienteService } from "../../services/expedienteService.js";
import { icon } from "../../components/icons.js";

export async function initSalidasArchivoPage({ mountNode }) {
  mountNode.innerHTML = `
    <section class="space-y-5">
      <div class="rounded-2xl p-5 text-white shadow-lg"
  style="background: linear-gradient(145deg, var(--color-brand), var(--color-brand-2)); box-shadow: var(--shadow-soft);">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="bg-white/10 rounded-xl p-3">${icon("logOut", "w-8 h-8")}</span>
            <div>
              <h1 class="text-xl md:text-2xl font-bold">Salidas de Archivo General</h1>
              <p class="text-blue-100 text-sm">Registro de préstamos, salidas y transferencias de grupos archivados.</p>
            </div>
          </div>

          <button id="btn-limpiar-filtros"
            class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold transition">
            Limpiar filtros
          </button>
        </div>
      </div>

      <div id="salidas-kpis" class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        ${renderKpiSkeleton()}
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-blue-600">${icon("search", "w-4 h-4")}</span>
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Filtros de búsqueda</h3>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <div class="relative">
            <input id="filtro-salida-texto"
              class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Buscar rótulo, motivo, obs..." />
            <span class="absolute left-3 top-2.5 text-slate-400">${icon("search", "w-4 h-4")}</span>
          </div>

          <select id="filtro-salida-tipo" class="input-filter">
            <option value="">Todos los tipos</option>
            <option value="PRESTAMO">Préstamo</option>
            <option value="SALIDA_INTERNA">Salida Interna</option>
            <option value="SALIDA_EXTERNA">Salida Externa</option>
            <option value="ENVIO_DEFINITIVO">Envío Definitivo</option>
          </select>

          <select id="filtro-salida-estado" class="input-filter">
            <option value="">Todos los estados</option>
          </select>

          <select id="filtro-salida-destino" class="input-filter">
            <option value="">Todos los destinos</option>
          </select>

          <select id="filtro-salida-responsable" class="input-filter">
            <option value="">Todos los responsables</option>
          </select>

          <input id="filtro-salida-grupo"
            class="input-filter"
            placeholder="ID Grupo" />

          <input id="filtro-salida-desde" type="date" class="input-filter" />
          <input id="filtro-salida-hasta" type="date" class="input-filter" />

          <select id="filtro-salida-orden" class="input-filter">
            <option value="reciente">Más recientes primero</option>
            <option value="antiguo">Más antiguos primero</option>
            <option value="tipo">Ordenar por tipo</option>
            <option value="estado">Ordenar por estado</option>
          </select>

          <label class="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 cursor-pointer hover:bg-slate-50 rounded-lg">
            <input id="filtro-salida-activo" type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span>Solo activos</span>
          </label>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 class="text-base font-semibold text-slate-800 flex items-center gap-2">
            <span class="w-1.5 h-5 bg-blue-500 rounded-full"></span>
            Registro de Salidas
          </h2>
          <span class="text-xs text-slate-500" id="salidas-total"></span>
        </div>

        <div class="p-5" id="salidas-table">
          ${renderTableSkeleton()}
        </div>
      </div>
    </section>
  `;

  agregarEstiloFiltros();

  const resultado = await expedienteService.listarSalidasArchivoGeneral();
  const data = resultado || [];

  const tipos = obtenerUnicos(data, "tipo");
  const estados = obtenerUnicos(data, "estado");
  const destinos = obtenerUnicos(data, "destino");
  const responsables = obtenerUnicos(data, "responsableEntrega");

  cargarSelect("filtro-salida-tipo", tipos);
  cargarSelect("filtro-salida-estado", estados);
  cargarSelect("filtro-salida-destino", destinos);
  cargarSelect("filtro-salida-responsable", responsables);

  const kpiNode = document.getElementById("salidas-kpis");
  const tableNode = document.getElementById("salidas-table");
  const totalNode = document.getElementById("salidas-total");

  function filtrarRows() {
    const texto = normalizarTexto(valor("filtro-salida-texto"));
    const tipo = valor("filtro-salida-tipo");
    const estado = valor("filtro-salida-estado");
    const destino = valor("filtro-salida-destino");
    const responsable = valor("filtro-salida-responsable");
    const grupo = normalizarTexto(valor("filtro-salida-grupo"));
    const desde = valor("filtro-salida-desde");
    const hasta = valor("filtro-salida-hasta");
    const soloActivos = document.getElementById("filtro-salida-activo")?.checked;
    const orden = valor("filtro-salida-orden");

    let rows = data.filter((row) => {
      const bolsa = normalizarTexto(`
        ${row.rotulo} ${row.tipo} ${row.destino} ${row.estado}
        ${row.motivo} ${row.observacion} ${row.idGrupo}
        ${row.responsableEntrega} ${row.responsableRecepcion}
      `);

      return (!texto || bolsa.includes(texto))
        && (!tipo || row.tipo === tipo)
        && (!estado || row.estado === estado)
        && (!destino || row.destino === destino)
        && (!responsable || row.responsableEntrega === responsable)
        && (!grupo || normalizarTexto(row.idGrupo).includes(grupo))
        && (!soloActivos || row.activo?.toUpperCase() === "SI")
        && cumpleRangoFecha(row.fechaSalida, desde, hasta);
    });

    return ordenarRows(rows, orden);
  }

  function renderResumen(rows) {
    const resumen = {
      total: rows.length,
      activas: rows.filter(r => r.activo?.toUpperCase() === "SI").length,
      prestamos: rows.filter(r => r.tipo === "PRESTAMO").length,
      definitivos: rows.filter(r => r.tipo === "ENVIO_DEFINITIVO").length,
      pendientes: rows.filter(r => r.estado === "PENDIENTE" || r.estado === "ACTIVA").length
    };

    const cards = [
      { label: "Total", value: resumen.total, iconName: "list", type: "brand" },
      { label: "Activas", value: resumen.activas, iconName: "checkCircle", type: "accent" },
      { label: "Préstamos", value: resumen.prestamos, iconName: "users", type: "soft" },
      { label: "Definitivos", value: resumen.definitivos, iconName: "truck", type: "warning" },
      { label: "Pendientes", value: resumen.pendientes, iconName: "clock", type: "dark" }
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
    totalNode.textContent = `${rows.length} salida${rows.length !== 1 ? "s" : ""} encontrada${rows.length !== 1 ? "s" : ""}`;

    tableNode.innerHTML = renderTable({
      columns: [
        { key: "fechaSalida",  label: "Fecha Salida" },
        { key: "horaSalida",   label: "Hora" },
        { key: "rotulo",       label: "Rótulo" },
        { key: "tipo",         label: "Tipo" },
        { key: "destino",      label: "Destino" },
        { key: "idGrupo",      label: "Grupo" },
        { key: "responsableEntrega", label: "Entregó" },
        { key: "responsableRecepcion", label: "Recibió" },
        { key: "estado",       label: "Estado" },
        { key: "fechaRetorno", label: "Retorno" },
        { key: "motivo",       label: "Motivo" },
        { key: "observacion",  label: "Observación" }
      ],
      rows: rows.map(row => ({
        ...row,
        tipo: renderTipoBadge(row.tipo),
        estado: renderEstadoBadge(row.estado),
        responsableEntrega: renderUsuarioTexto(row.responsableEntrega),
        responsableRecepcion: renderUsuarioTexto(row.responsableRecepcion),
        fechaRetorno: row.fechaRetorno || '<span class="text-slate-300">—</span>',
        observacion: row.observacion?.length > 50 ? row.observacion.substring(0, 50) + "..." : row.observacion
      })),
      emptyText: "No se encontraron salidas con los filtros seleccionados"
    });
  }

  [
    "filtro-salida-texto", "filtro-salida-tipo", "filtro-salida-estado",
    "filtro-salida-destino", "filtro-salida-responsable", "filtro-salida-grupo",
    "filtro-salida-desde", "filtro-salida-hasta", "filtro-salida-activo", "filtro-salida-orden"
  ].forEach(id => {
    document.getElementById(id)?.addEventListener("input", render);
    document.getElementById(id)?.addEventListener("change", render);
  });

  document.getElementById("btn-limpiar-filtros")?.addEventListener("click", () => {
    ["filtro-salida-texto", "filtro-salida-tipo", "filtro-salida-estado",
     "filtro-salida-destino", "filtro-salida-responsable", "filtro-salida-grupo",
     "filtro-salida-desde", "filtro-salida-hasta"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    const activo = document.getElementById("filtro-salida-activo");
    if (activo) activo.checked = false;
    const orden = document.getElementById("filtro-salida-orden");
    if (orden) orden.value = "reciente";
    render();
  });

  render();
}

// ===================== HELPERS =====================

function renderKpiSkeleton() {
  const cards = [
    { label: "Total", iconName: "list", type: "brand" },
    { label: "Activas", iconName: "checkCircle", type: "accent" },
    { label: "Préstamos", iconName: "users", type: "soft" },
    { label: "Definitivos", iconName: "truck", type: "warning" },
    { label: "Pendientes", iconName: "clock", type: "dark" }
  ];
  return cards.map(c => `
    <div class="mov-kpi mov-kpi--${c.type} mov-kpi-loading">
      <div class="mov-kpi__glow"></div>
      <div class="mov-kpi__content">
        <div><p class="mov-kpi__label">${c.label}</p><p class="mov-kpi__value">...</p></div>
        <span class="mov-kpi__icon">${icon(c.iconName, "w-5 h-5")}</span>
      </div>
    </div>
  `).join("");
}

function renderTableSkeleton() {
  return `<div class="space-y-2">${Array.from({ length: 8 }).map(() => `<div class="h-10 rounded-lg bg-slate-200 animate-pulse"></div>`).join("")}</div>`;
}

function valor(id) { return document.getElementById(id)?.value || ""; }

function normalizarTexto(valor = "") { return String(valor).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

function obtenerUnicos(rows, key) { return [...new Set(rows.map(item => item[key]).filter(Boolean))]; }

function cargarSelect(id, items, formatter = (x) => x) {
  const select = document.getElementById(id);
  if (!select) return;
  const firstOption = select.querySelector("option")?.outerHTML || `<option value="">Todos</option>`;
  select.innerHTML = firstOption + items.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(formatter(item))}</option>`).join("");
}

function convertirFecha(fechaString) {
  if (!fechaString) return null;
  const texto = String(fechaString).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return new Date(texto.substring(0, 10));
  if (/^\d{2}\/\d{2}\/\d{4}/.test(texto)) {
    const [dia, mes, anio] = texto.substring(0, 10).split("/");
    return new Date(`${anio}-${mes}-${dia}`);
  }
  return null;
}

function cumpleRangoFecha(fecha, desde, hasta) {
  const fechaRow = convertirFecha(fecha);
  if (!fechaRow) return !desde && !hasta;
  if (desde && fechaRow < new Date(`${desde}T00:00:00`)) return false;
  if (hasta && fechaRow > new Date(`${hasta}T23:59:59`)) return false;
  return true;
}

function ordenarRows(rows, orden) {
  const copia = [...rows];
  if (orden === "antiguo") return copia.sort((a, b) => (convertirFecha(a.fechaSalida) || new Date(0)) - (convertirFecha(b.fechaSalida) || new Date(0)));
  if (orden === "tipo") return copia.sort((a, b) => String(a.tipo).localeCompare(String(b.tipo)));
  if (orden === "estado") return copia.sort((a, b) => String(a.estado).localeCompare(String(b.estado)));
  return copia.sort((a, b) => (convertirFecha(b.fechaSalida) || new Date(0)) - (convertirFecha(a.fechaSalida) || new Date(0)));
}

function renderTipoBadge(tipo) {
  const tipos = {
    "PRESTAMO": "mov-badge mov-badge--warning",
    "SALIDA_INTERNA": "mov-badge mov-badge--brand",
    "SALIDA_EXTERNA": "mov-badge mov-badge--accent",
    "ENVIO_DEFINITIVO": "mov-badge mov-badge--dark"
  };
  return `<span class="${tipos[tipo] || 'mov-badge mov-badge--muted'}">${escapeHtml(tipo)}</span>`;
}

function renderEstadoBadge(estado) {
  const estados = {
    "ACTIVA": "mov-badge mov-badge--success",
    "PENDIENTE": "mov-badge mov-badge--warning",
    "EN_PROCESO": "mov-badge mov-badge--brand",
    "DEVUELTO": "mov-badge mov-badge--accent",
    "ENVIADO_DEFINITIVO": "mov-badge mov-badge--dark"
  };
  return `<span class="${estados[estado] || 'mov-badge mov-badge--muted'}">${escapeHtml(estado)}</span>`;
}

function renderUsuarioTexto(texto) {
  if (!texto) return `<span class="text-slate-300">—</span>`;
  return `<span title="${escapeHtml(texto)}" class="text-slate-700 font-medium">${escapeHtml(texto)}</span>`;
}

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function agregarEstiloFiltros() {
  if (document.getElementById("salidas-filter-style")) return;
  const style = document.createElement("style");
  style.id = "salidas-filter-style";
  style.textContent = `
    .input-filter{width:100%;padding:0.58rem 0.78rem;font-size:0.875rem;border:1px solid var(--color-border);border-radius:0.72rem;background:var(--color-surface);color:var(--color-text);outline:none;transition:border-color .18s ease,box-shadow .18s ease;}
    .input-filter:focus{border-color:var(--color-brand-2);box-shadow:0 0 0 3px rgba(29,95,139,0.14);}
    .mov-kpi{position:relative;overflow:hidden;border-radius:var(--radius-lg);padding:1rem;min-height:5.1rem;border:1px solid var(--color-border);box-shadow:var(--shadow-soft);}
    .mov-kpi__glow{position:absolute;top:-2.4rem;right:-2.4rem;width:6rem;height:6rem;border-radius:999px;background:rgba(255,255,255,0.18);}
    .mov-kpi__content{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:0.8rem;}
    .mov-kpi__label{font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;opacity:0.8;}
    .mov-kpi__value{margin-top:0.2rem;font-size:1.75rem;line-height:1;font-weight:900;}
    .mov-kpi__icon{display:inline-flex;align-items:center;justify-content:center;width:2.15rem;height:2.15rem;border-radius:0.8rem;background:rgba(255,255,255,0.18);}
    .mov-kpi--brand{color:#fff;background:linear-gradient(145deg,var(--color-brand),var(--color-brand-2));}
    .mov-kpi--accent{color:#fff;background:linear-gradient(145deg,#2f596b,var(--color-accent));}
    .mov-kpi--soft{color:var(--color-brand);background:linear-gradient(180deg,#fff 0%,#eef6fb 100%);border-color:#c7d8e6;}
    .mov-kpi--warning{color:#fff;background:linear-gradient(145deg,#8f5a18,var(--color-warning));}
    .mov-kpi--dark{color:#fff;background:linear-gradient(145deg,#142433,#0b1724);}
    .mov-badge{display:inline-flex;align-items:center;justify-content:center;padding:0.18rem 0.62rem;border-radius:999px;border:1px solid transparent;font-size:0.72rem;font-weight:800;}
    .mov-badge--brand{color:var(--color-brand-2);background:#e8f1f7;border-color:#c7dbea;}
    .mov-badge--accent{color:var(--color-accent);background:#eef5f8;border-color:#c9dce5;}
    .mov-badge--success{color:var(--color-success);background:#eaf7ef;border-color:#bde3cb;}
    .mov-badge--warning{color:var(--color-warning);background:#fff6e8;border-color:#f1d3a3;}
    .mov-badge--muted{color:var(--color-muted);background:#f1f5f9;border-color:#d8e1ea;}
    .mov-badge--dark{color:#fff;background:#1e293b;border-color:#334155;}
  `;
  document.head.appendChild(style);
}