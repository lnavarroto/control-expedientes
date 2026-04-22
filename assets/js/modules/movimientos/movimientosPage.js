import { renderTable } from "../../components/table.js";
import { expedienteService } from "../../services/expedienteService.js";
import { icon } from "../../components/icons.js";
import { CARD_TONES } from "../../core/uiTokens.js";

export function initMovimientosPage({ mountNode }) {
  const data = expedienteService.listarMovimientos().map((item) => ({
    fecha: item.fecha,
    hora: item.hora,
    expediente: item.numeroExpediente,
    usuario: item.usuario,
    origen: item.origen,
    destino: item.destino,
    motivo: item.motivo,
    observacion: item.observacion,
    tipo: clasificarMovimiento(item)
  }));

  const usuarios = [...new Set(data.map((item) => item.usuario).filter(Boolean))];

  mountNode.innerHTML = `
    <section class="space-y-4">

      <!-- Hero Banner -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-slate-800 p-4 md:p-5 shadow-lg">
        <div class="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full -mr-32 -mt-32 opacity-10"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-slate-600 rounded-full -ml-24 -mb-24 opacity-10"></div>
        <div class="relative z-10 flex items-center gap-3">
          <span class="text-white opacity-90">${icon("refreshCw", "w-8 h-8 md:w-9 md:h-9")}</span>
          <div>
            <h1 class="text-xl md:text-2xl font-bold text-white">Historial de Movimientos</h1>
            <p class="text-rose-100 text-sm font-medium mt-0.5">Trazabilidad completa de salidas, traslados y retornos</p>
          </div>
        </div>
      </div>

      <!-- KPIs -->
      <div>
        <h2 class="text-lg md:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span class="w-1 h-6 md:h-7 bg-gradient-to-b from-rose-500 to-slate-600 rounded-full"></span>
          Resumen
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" id="movimientos-kpis"></div>
      </div>

      <!-- Filtros -->
      <div class="card-surface p-4">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <span class="text-slate-400">${icon("busqueda", "w-4 h-4")}</span>
          Filtros de búsqueda
        </h3>
        <div class="grid md:grid-cols-5 gap-3">
          <input id="filtro-mov-texto" class="input-base md:col-span-2" placeholder="Buscar por expediente, motivo u observación" />
          <select id="filtro-mov-tipo" class="select-base">
            <option value="">Todos los tipos</option>
            <option value="Salida">Salida</option>
            <option value="Retorno">Retorno</option>
            <option value="Traslado">Traslado</option>
          </select>
          <select id="filtro-mov-usuario" class="select-base">
            <option value="">Todos los usuarios</option>
            ${usuarios.map((usuario) => `<option value="${usuario}">${usuario}</option>`).join("")}
          </select>
          <label class="inline-flex items-center gap-2 text-sm text-slate-600 px-1 cursor-pointer">
            <input id="filtro-mov-hoy" type="checkbox" class="h-4 w-4 rounded" />
            <span>Solo hoy</span>
          </label>
        </div>
      </div>

      <!-- Tabla -->
      <div>
        <h2 class="text-lg md:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span class="w-1 h-6 md:h-7 bg-gradient-to-b from-slate-500 to-rose-600 rounded-full"></span>
          Registro
        </h2>
        <div id="movimientos-table"></div>
      </div>

    </section>
  `;

  const kpiNode = document.getElementById("movimientos-kpis");
  const tableNode = document.getElementById("movimientos-table");

  const KPI_DEFS = [
    { key: "total",    label: "Total movimientos", iconName: "list",         tone: "neutral"  },
    { key: "hoy",      label: "Movimientos hoy",   iconName: "calendarDay",  tone: "primary"  },
    { key: "salidas",  label: "Salidas",            iconName: "chevronRight", tone: "danger"   },
    { key: "retornos", label: "Retornos",           iconName: "shieldCheck",  tone: "success"  }
  ];

  function calcularResumen(rows) {
    return {
      total:    rows.length,
      hoy:      rows.filter((row) => esMismoDia(row.fecha)).length,
      salidas:  rows.filter((row) => row.tipo === "Salida").length,
      retornos: rows.filter((row) => row.tipo === "Retorno").length
    };
  }

  function renderResumen(rows) {
    const resumen = calcularResumen(rows);
    if (!kpiNode) return;
    kpiNode.innerHTML = KPI_DEFS.map((def) => {
      const tone = CARD_TONES[def.tone] || CARD_TONES.neutral;
      return `
        <article class="relative overflow-hidden rounded-xl bg-gradient-to-br ${tone.surface} border ${tone.border} p-3 md:p-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs md:text-sm font-semibold text-slate-600">${def.label}</p>
              <p class="text-2xl md:text-3xl font-bold text-slate-900 mt-1">${resumen[def.key]}</p>
            </div>
            <span class="inline-flex ${tone.icon}">${icon(def.iconName, "w-7 h-7 md:w-8 md:h-8")}</span>
          </div>
        </article>
      `;
    }).join("");
  }

  function filtrarRows() {
    const texto = normalizarTexto(document.getElementById("filtro-mov-texto")?.value || "");
    const tipo = document.getElementById("filtro-mov-tipo")?.value || "";
    const usuario = document.getElementById("filtro-mov-usuario")?.value || "";
    const soloHoy = document.getElementById("filtro-mov-hoy")?.checked;

    return data.filter((row) => {
      const bolsa = normalizarTexto(`${row.expediente} ${row.motivo} ${row.observacion} ${row.origen} ${row.destino} ${row.usuario}`);
      const cumpleTexto = !texto || bolsa.includes(texto);
      const cumpleTipo = !tipo || row.tipo === tipo;
      const cumpleUsuario = !usuario || row.usuario === usuario;
      const cumpleHoy = !soloHoy || esMismoDia(row.fecha);
      return cumpleTexto && cumpleTipo && cumpleUsuario && cumpleHoy;
    });
  }

  function render() {
    const rows = filtrarRows();
    renderResumen(rows);

    if (!tableNode) return;
    tableNode.innerHTML = renderTable({
      columns: [
        { key: "fecha",       label: "Fecha"       },
        { key: "hora",        label: "Hora"        },
        { key: "tipo",        label: "Tipo"        },
        { key: "expediente",  label: "Expediente"  },
        { key: "usuario",     label: "Usuario"     },
        { key: "origen",      label: "Origen"      },
        { key: "destino",     label: "Destino"     },
        { key: "motivo",      label: "Motivo"      },
        { key: "observacion", label: "Observación" }
      ],
      rows: rows.map((row) => ({
        ...row,
        tipo: renderTipoBadge(row.tipo)
      })),
      emptyText: "No hay movimientos para los filtros seleccionados"
    });
  }

  ["filtro-mov-texto", "filtro-mov-tipo", "filtro-mov-usuario", "filtro-mov-hoy"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", render);
    document.getElementById(id)?.addEventListener("change", render);
  });

  render();
}

function normalizarTexto(valor = "") {
  return String(valor).trim().toLowerCase();
}

function clasificarMovimiento(item) {
  const base = normalizarTexto(`${item.motivo || ""} ${item.destino || ""} ${item.origen || ""}`);
  if (base.includes("retorno") || base.includes("retornado")) return "Retorno";
  if (base.includes("salida") || base.includes("prestamo") || base.includes("préstamo") || base.includes("derivado")) return "Salida";
  return "Traslado";
}

function esMismoDia(fechaString) {
  if (!fechaString) return false;
  const hoy = new Date();
  const ymd = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const dmy = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`;
  return String(fechaString).includes(ymd) || String(fechaString).includes(dmy);
}

function renderTipoBadge(tipo) {
  const variants = {
    Salida: "bg-rose-100 text-rose-800 ring-1 ring-rose-300/70",
    Retorno: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/70",
    Traslado: "bg-sky-100 text-sky-800 ring-1 ring-sky-300/70"
  };
  const classes = variants[tipo] || variants.Traslado;
  return `<span class="badge ${classes}">${tipo}</span>`;
}
