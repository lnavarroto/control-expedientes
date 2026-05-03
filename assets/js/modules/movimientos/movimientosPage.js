import { renderTable } from "../../components/table.js";
import { expedienteService } from "../../services/expedienteService.js";
import { icon } from "../../components/icons.js";

export async function initMovimientosPage({ mountNode }) {
  // 1. Mostrar skeleton INMEDIATAMENTE
  mountNode.innerHTML = `
    <section class="space-y-5">
      <div class="rounded-2xl p-5 text-white shadow-lg"
  style="background: linear-gradient(145deg, var(--color-brand), var(--color-brand-2)); box-shadow: var(--shadow-soft);">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="bg-white/10 rounded-xl p-3">${icon("clock", "w-8 h-8")}</span>
            <div>
              <h1 class="text-xl md:text-2xl font-bold">Historial de Actualización de Datos</h1>
              <p class="text-blue-100 text-sm">Consulta, filtra y revisa la trazabilidad de expedientes.</p>
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
              placeholder="Buscar expediente, usuario, obs..." />
            <span class="absolute left-3 top-2.5 text-slate-400">${icon("search", "w-4 h-4")}</span>
          </div>

          <select id="filtro-mov-usuario" class="input-filter">
            <option value="">Todos los usuarios</option>
          </select>

          <select id="filtro-mov-estado" class="input-filter">
            <option value="">Todos los estados</option>
          </select>

          <select id="filtro-mov-responsable" class="input-filter">
            <option value="">Todos los responsables</option>
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
            <option value="usuario">Ordenar por usuario</option>
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
          <span class="text-xs text-slate-500" id="movimientos-total">Cargando...</span>
        </div>

        <div class="p-5" id="movimientos-table">
          ${renderTableSkeleton()}
        </div>
      </div>
    </section>
  `;

  agregarEstiloFiltros();

  // Variables para datos
  let data = [];
  let kpiNode = null;
  let tableNode = null;
  let totalNode = null;

  try {
    // 2. Cargar datos reales
    const resultado = await expedienteService.listarMovimientos();
    
    // 3. Normalizar datos
    data = normalizarMovimientos(resultado || []);

    // 4. Obtener elementos del DOM (después de que el HTML existe)
    kpiNode = document.getElementById("movimientos-kpis");
    tableNode = document.getElementById("movimientos-table");
    totalNode = document.getElementById("movimientos-total");

    // 5. Obtener valores únicos para los selects
    const usuarios = obtenerUnicos(data, "usuario");
    const estados = obtenerUnicos(data, "estadoSistema");
    const responsables = obtenerUnicos(data, "responsable");

    cargarSelect("filtro-mov-usuario", usuarios, limpiarUsuario);
    cargarSelect("filtro-mov-estado", estados);
    cargarSelect("filtro-mov-responsable", responsables, limpiarUsuario);

    // 6. Funciones de filtrado y renderizado
    function filtrarRows() {
      const texto = normalizarTexto(valor("filtro-mov-texto"));
      const usuario = valor("filtro-mov-usuario");
      const estado = valor("filtro-mov-estado");
      const responsable = valor("filtro-mov-responsable");
      const expediente = normalizarTexto(valor("filtro-mov-expediente"));
      const desde = valor("filtro-mov-desde");
      const hasta = valor("filtro-mov-hasta");
      const soloHoy = document.getElementById("filtro-mov-hoy")?.checked;
      const orden = valor("filtro-mov-orden");

      let rows = data.filter((row) => {
        const bolsa = normalizarTexto(`
          ${row.fecha}
          ${row.hora}
          ${row.expediente}
          ${row.usuario}
          ${row.estado}
          ${row.estadoSistema}
          ${row.responsable}
          ${row.observacion}
        `);

        return (!texto || bolsa.includes(texto))
          && (!usuario || row.usuario === usuario)
          && (!estado || row.estadoSistema === estado)
          && (!responsable || row.responsable === responsable)
          && (!expediente || normalizarTexto(row.expediente).includes(expediente))
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
        expedientes: obtenerUnicos(rows, "expediente").length,
        usuarios: obtenerUnicos(rows, "usuario").length,
        estados: obtenerUnicos(rows, "estadoSistema").length
      };

      const cards = [
        { label: "Total", value: resumen.total, iconName: "list", type: "brand" },
        { label: "Hoy", value: resumen.hoy, iconName: "calendar", type: "accent" },
        { label: "Expedientes", value: resumen.expedientes, iconName: "folder", type: "soft" },
        { label: "Usuarios", value: resumen.usuarios, iconName: "users", type: "warning" },
        { label: "Estados", value: resumen.estados, iconName: "tag", type: "dark" }
      ];

      if (kpiNode) {
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
    }

    function render() {
      const rows = filtrarRows();

      renderResumen(rows);

      if (totalNode) {
        totalNode.textContent = `${rows.length} registro${rows.length !== 1 ? "s" : ""} encontrado${rows.length !== 1 ? "s" : ""}`;
      }

      if (tableNode) {
        tableNode.innerHTML = renderTable({
          columns: [
            { key: "fecha", label: "Fecha" },
            { key: "hora", label: "Hora" },
            { key: "expediente", label: "Expediente" },
            { key: "usuario", label: "Registrado por" },
            { key: "estado", label: "Origen" },
            { key: "estadoSistema", label: "Destino" },
            { key: "responsable", label: "Responsable" },
            { key: "observacion", label: "Observación" }
          ],
          rows: rows.map((row) => ({
            ...row,
            expediente: renderExpediente(row.expediente),
            usuario: renderUsuarioTexto(row.usuario),
            responsable: renderUsuarioTexto(row.responsable),
            estado: renderBadge(row.estado, "blue"),
            estadoSistema: renderBadge(row.estadoSistema, "purple"),
            observacion: renderObservacion(row.observacion)
          })),
          emptyText: "No se encontraron movimientos con los filtros seleccionados"
        });
      }
    }

    // 7. Configurar event listeners
    const filterIds = [
      "filtro-mov-texto",
      "filtro-mov-usuario",
      "filtro-mov-estado",
      "filtro-mov-responsable",
      "filtro-mov-expediente",
      "filtro-mov-desde",
      "filtro-mov-hasta",
      "filtro-mov-hoy",
      "filtro-mov-orden"
    ];

    filterIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", render);
        el.addEventListener("change", render);
      }
    });

    const btnLimpiar = document.getElementById("btn-limpiar-filtros");
    if (btnLimpiar) {
      btnLimpiar.addEventListener("click", () => {
        const ids = [
          "filtro-mov-texto",
          "filtro-mov-usuario",
          "filtro-mov-estado",
          "filtro-mov-responsable",
          "filtro-mov-expediente",
          "filtro-mov-desde",
          "filtro-mov-hasta"
        ];
        ids.forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.value = "";
        });

        const hoy = document.getElementById("filtro-mov-hoy");
        if (hoy) hoy.checked = false;

        const orden = document.getElementById("filtro-mov-orden");
        if (orden) orden.value = "reciente";

        render();
      });
    }

    // 8. Render inicial con datos reales
    render();

  } catch (error) {
    console.error("Error cargando movimientos:", error);
    
    // Mostrar mensaje de error en lugar del skeleton
    const tableNode = document.getElementById("movimientos-table");
    const totalNode = document.getElementById("movimientos-total");
    const kpiNode = document.getElementById("movimientos-kpis");
    
    if (kpiNode) {
      kpiNode.innerHTML = `
        <div class="col-span-full text-center py-4 text-red-600">
          Error al cargar estadísticas
        </div>
      `;
    }
    
    if (totalNode) {
      totalNode.textContent = "Error al cargar datos";
    }
    
    if (tableNode) {
      tableNode.innerHTML = `
        <div class="text-center py-8 text-red-600">
          <p class="font-semibold">❌ Error al cargar los movimientos</p>
          <p class="text-sm mt-2">${error.message || "Error de conexión"}</p>
          <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Reintentar
          </button>
        </div>
      `;
    }
  }
}

// =====================
// HELPERS
// =====================

function renderKpiSkeleton() {
  const cards = [
    { label: "Total", iconName: "list", type: "brand" },
    { label: "Hoy", iconName: "calendar", type: "accent" },
    { label: "Expedientes", iconName: "folder", type: "soft" },
    { label: "Usuarios", iconName: "users", type: "warning" },
    { label: "Estados", iconName: "tag", type: "dark" }
  ];

  return cards.map((card) => `
    <div class="mov-kpi mov-kpi--${card.type}" style="opacity: 0.7;">
      <div class="mov-kpi__glow"></div>
      <div class="mov-kpi__content">
        <div>
          <p class="mov-kpi__label">${card.label}</p>
          <p class="mov-kpi__value animate-pulse">...</p>
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
        <div class="h-12 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 animate-pulse"></div>
      `).join("")}
    </div>
  `;
}

function normalizarMovimientos(resultado) {
  return resultado.map((item) => ({
    fecha: item.fecha || item.fecha_movimiento || "",
    hora: item.hora || item.hora_movimiento || "",
    expediente: item.numeroExpediente || item.codigo_expediente_completo || item.id_expediente || "",
    usuario: item.usuario || item.realizado_por || "",
    estado: item.origen || item.estado_anterior || item.ubicacion_origen || "",
    estadoSistema: item.destino || item.estado_nuevo || item.ubicacion_destino || "",
    responsable: item.id_usuario_responsable || item.responsable || "",
    observacion: item.observacion || item.observaciones || item.motivo || ""
  }));
}

function valor(id) {
  return document.getElementById(id)?.value || "";
}

function normalizarTexto(valor = "") {
  return String(valor)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return new Date(texto.substring(0, 10));
  }

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

  if (orden === "antiguo") {
    return copia.sort((a, b) => compararFechaHora(a, b));
  }

  if (orden === "expediente") {
    return copia.sort((a, b) => String(a.expediente).localeCompare(String(b.expediente)));
  }

  if (orden === "usuario") {
    return copia.sort((a, b) => String(a.usuario).localeCompare(String(b.usuario)));
  }

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
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

    .mov-kpi--brand {
      color: #ffffff;
      background: linear-gradient(145deg, var(--color-brand), var(--color-brand-2));
      border-color: rgba(29, 95, 139, 0.35);
    }

    .mov-kpi--accent {
      color: #ffffff;
      background: linear-gradient(145deg, #2f596b, var(--color-accent));
      border-color: rgba(63, 106, 125, 0.35);
    }

    .mov-kpi--soft {
      color: var(--color-brand);
      background: linear-gradient(180deg, #ffffff 0%, #eef6fb 100%);
      border-color: #c7d8e6;
    }

    .mov-kpi--soft .mov-kpi__icon {
      background: #e1eef7;
      color: var(--color-brand-2);
    }

    .mov-kpi--warning {
      color: #ffffff;
      background: linear-gradient(145deg, #8f5a18, var(--color-warning));
      border-color: rgba(178, 113, 31, 0.35);
    }

    .mov-kpi--dark {
      color: #ffffff;
      background: linear-gradient(145deg, #142433, #0b1724);
      border-color: rgba(20, 36, 51, 0.45);
    }

    .mov-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.18rem 0.62rem;
      border-radius: 999px;
      border: 1px solid transparent;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.01em;
    }

    .mov-badge--brand {
      color: var(--color-brand-2);
      background: #e8f1f7;
      border-color: #c7dbea;
    }

    .mov-badge--accent {
      color: var(--color-accent);
      background: #eef5f8;
      border-color: #c9dce5;
    }

    .mov-badge--success {
      color: var(--color-success);
      background: #eaf7ef;
      border-color: #bde3cb;
    }

    .mov-badge--warning {
      color: var(--color-warning);
      background: #fff6e8;
      border-color: #f1d3a3;
    }

    .mov-badge--muted {
      color: var(--color-muted);
      background: #f1f5f9;
      border-color: #d8e1ea;
    }
  `;

  document.head.appendChild(style);
}