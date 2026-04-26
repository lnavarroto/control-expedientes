import { showToast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { estadoService } from "../../services/estadoService.js";
import { archivoGeneralService } from "./archivoGeneralService.js";
import { abrirModalCrearGrupo } from "./ModalCrearGrupo.js";
import { abrirModalVerDetalleGrupo } from "./ModalVerDetalleGrupo.js";
import { abrirModalRegistrarSalida } from "./ModalRegistrarSalida.js";
import { abrirModalRegistrarRetorno } from "./ModalRegistrarRetorno.js";

const HEADER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Zm0 0 8.5 5 8.5-5" /></svg>`;
const TAB_CACHE_TTL_MS = 45000;

const tabDataCache = {
  grupos: null,
  salidas: null,
  expedientesSinGrupo: null
};

function getCachedTabData(key) {
  const entry = tabDataCache[key];
  if (!entry) return null;
  if ((Date.now() - entry.timestamp) > TAB_CACHE_TTL_MS) {
    tabDataCache[key] = null;
    return null;
  }
  return entry.data;
}

function setCachedTabData(key, data) {
  tabDataCache[key] = { data, timestamp: Date.now() };
}

function invalidateCachedTabs(keys = []) {
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(tabDataCache, key)) {
      tabDataCache[key] = null;
    }
  });
}

const CARD_TONES = {
  ACTIVO: "bg-emerald-100 text-emerald-800 border-emerald-200",
  EN_PRESTAMO: "bg-amber-100 text-amber-800 border-amber-200",
  RETORNADO: "bg-slate-100 text-slate-800 border-slate-200",
  ACTIVA: "bg-red-100 text-red-800 border-red-200"
};

function _escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const estadosCatalogo = estadoService.listarSync();
const estadoNombrePorId = new Map(
  (estadosCatalogo || []).map((estado) => [String(estado.id || "").trim(), String(estado.nombre || "").trim()])
);

function obtenerEstadoTextoArchivo(expediente) {
  const idEstado = String(expediente.id_estado || "").trim();
  return estadoNombrePorId.get(idEstado) || idEstado || "-";
}

async function cargarGrupos(mountNode) {
  let grupos = getCachedTabData("grupos");
  if (!grupos) {
    const response = await archivoGeneralService.listarGrupos();
    if (!response.success) {
      showToast("Error cargando grupos", "error");
      return;
    }
    grupos = response.data || [];
    setCachedTabData("grupos", grupos);
  }

  const tabGrupos = document.getElementById("tab-grupos");
  if (!tabGrupos) return;

  if (grupos.length === 0) {
    tabGrupos.innerHTML = `
      <div class="text-center py-8">
        <p class="text-slate-500 mb-4">No hay grupos de archivo general</p>
        <button id="btn-nuevo-grupo" class="btn btn-primary inline-flex items-center gap-2">${icon("plus", "w-4 h-4")} Crear Nuevo Grupo</button>
      </div>
    `;
  } else {
    const estadoBadgeMap = {
      ACTIVO: CARD_TONES.ACTIVO,
      EN_PRESTAMO: CARD_TONES.EN_PRESTAMO,
      RETORNADO: CARD_TONES.RETORNADO
    };

    const total = grupos.length;
    const activos = grupos.filter((g) => g.estado_grupo === "ACTIVO").length;
    const enPrestamo = grupos.filter((g) => g.estado_grupo === "EN_PRESTAMO").length;

    tabGrupos.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div class="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-slate-500 font-semibold">Total de grupos</p>
          <p class="text-2xl font-bold text-slate-900 mt-1">${total}</p>
        </div>
        <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Activos</p>
          <p class="text-2xl font-bold text-emerald-900 mt-1">${activos}</p>
        </div>
        <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-amber-700 font-semibold">En préstamo</p>
          <p class="text-2xl font-bold text-amber-900 mt-1">${enPrestamo}</p>
        </div>
      </div>

      <div class="mb-4 flex justify-end">
        <button id="btn-nuevo-grupo" class="btn btn-primary inline-flex items-center gap-2">${icon("plus", "w-4 h-4")} Crear Nuevo Grupo</button>
      </div>
      <div class="border border-slate-200 rounded-md overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Código</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Especialista</th>
              <th class="text-center px-4 py-3 font-medium text-slate-700">Total Expedientes</th>
              <th class="text-center px-4 py-3 font-medium text-slate-700">Estado</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Fecha Creación</th>
              <th class="text-center px-4 py-3 font-medium text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${grupos.map(grupo => {
              const estadoBadge = estadoBadgeMap[grupo.estado_grupo] || CARD_TONES.ACTIVO;
              const puedeRegistrarSalida = grupo.estado_grupo === "ACTIVO";
              // Verificar si hay una salida activa para mostrar el botón de retorno
              const salidasActivas = (grupo.salidas || []).filter(s => 
                ["ACTIVA", "PENDIENTE", "EN_PROCESO"].includes(String(s.estado_salida || "").toUpperCase())
              );
              const puedeRegistrarRetorno = salidasActivas.length > 0 || grupo.estado_grupo === "EN_PRESTAMO";

              return `
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="px-4 py-3 font-medium text-slate-900">${_escapeHtml(grupo.codigo_grupo || '')}</td>
                  <td class="px-4 py-3 text-slate-700">${_escapeHtml(grupo.nombre_especialista || '')}</td>
                  <td class="px-4 py-3 text-center text-slate-700">${grupo.total_expedientes || 0}</td>
                  <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 rounded text-xs font-semibold border ${estadoBadge}">
                      ${_escapeHtml(grupo.estado_grupo || '')}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-600">${grupo.fecha_creacion ? new Date(grupo.fecha_creacion).toLocaleDateString('es-PE') : '-'}</td>
                  <td class="px-4 py-3 text-center space-x-2 whitespace-nowrap">
                    <button class="btn-ver-detalle inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 cursor-pointer" data-id-grupo="${_escapeHtml(grupo.id_grupo || '')}">
                      ${icon("eye", "w-3.5 h-3.5")} Ver
                    </button>
                    ${puedeRegistrarSalida ? `
                      <button class="btn-nueva-salida inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-100 text-yellow-700 text-xs rounded hover:bg-yellow-200 cursor-pointer" data-id-grupo="${_escapeHtml(grupo.id_grupo || '')}">
                        ${icon("transfer", "w-3.5 h-3.5")} Salida
                      </button>
                    ` : ''}
                    ${puedeRegistrarRetorno ? `
                      <button class="btn-registrar-retorno inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 cursor-pointer" data-id-grupo="${_escapeHtml(grupo.id_grupo || '')}">
                        ${icon("refreshCw", "w-3.5 h-3.5")} Retorno
                      </button>
                    ` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Event listeners - Cargar salidas del grupo en el caché si existen
  if (Array.isArray(grupos)) {
    Promise.all(grupos.map(async (g) => {
      if (g.id_grupo) {
        const resp = await archivoGeneralService.listarSalidasGrupo(g.id_grupo);
        if (resp.success) g.salidas = resp.data || [];
      }
    })).catch(() => {});
  }

  const btnNuevoGrupo = document.getElementById("btn-nuevo-grupo");
  if (btnNuevoGrupo) {
    btnNuevoGrupo.addEventListener("click", () => {
      abrirModalCrearGrupo(() => {
        invalidateCachedTabs(["grupos", "expedientesSinGrupo"]);
        cargarGrupos(mountNode);
      });
    });
  }

  document.querySelectorAll(".btn-ver-detalle").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id_grupo = btn.dataset.idGrupo;
      await abrirModalVerDetalleGrupo(id_grupo, () => cargarGrupos(mountNode));
    });
  });

  document.querySelectorAll(".btn-nueva-salida").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id_grupo = btn.dataset.idGrupo;
        await abrirModalRegistrarSalida(id_grupo, "paquete", () => {
        invalidateCachedTabs(["grupos", "salidas"]);
        cargarGrupos(mountNode);
      });
    });
  });

  document.querySelectorAll(".btn-registrar-retorno").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id_grupo = btn.dataset.idGrupo;
      await abrirModalRegistrarRetorno(id_grupo, () => {
        invalidateCachedTabs(["grupos", "salidas"]);
        cargarGrupos(mountNode);
      });
    });
  });
}

async function cargarSalidas(mountNode) {
  let salidas = getCachedTabData("salidas");
  if (!salidas) {
    // Sin parámetro id_grupo para traer todas las salidas
    const response = await archivoGeneralService.listarSalidasGrupo();
    if (!response.success) {
      showToast("Error cargando salidas", "error");
      return;
    }
    salidas = response.data || [];
    setCachedTabData("salidas", salidas);
  }
  const tabSalidas = document.getElementById("tab-salidas");
  if (!tabSalidas) return;

  if (salidas.length === 0) {
    tabSalidas.innerHTML = `
      <div class="text-center py-8">
        <p class="text-slate-500">No hay salidas registradas</p>
      </div>
    `;
  } else {
    tabSalidas.innerHTML = `
      <div class="border border-slate-200 rounded-md overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Rótulo</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Grupo</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Tipo</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Destino</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Responsable Entrega</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Fecha Salida</th>
              <th class="text-center px-4 py-3 font-medium text-slate-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${salidas.map(salida => {
              const estadoBadge = salida.estado_salida === 'ACTIVA' ? CARD_TONES.ACTIVA : CARD_TONES.RETORNADO;
              return `
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="px-4 py-3 font-medium text-slate-900">${_escapeHtml(salida.rotulo_salida || '')}</td>
                  <td class="px-4 py-3 text-slate-700">${_escapeHtml(salida.codigo_grupo || '')}</td>
                  <td class="px-4 py-3 text-slate-700">${_escapeHtml(salida.tipo_salida || '')}</td>
                  <td class="px-4 py-3 text-slate-700">${_escapeHtml(salida.destino_salida || '')}</td>
                  <td class="px-4 py-3 text-slate-700">${_escapeHtml(salida.responsable_entrega || '')}</td>
                  <td class="px-4 py-3 text-slate-600">${salida.fecha_hora_salida ? new Date(salida.fecha_hora_salida).toLocaleDateString('es-PE') : '-'}</td>
                  <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 rounded text-xs font-semibold border ${estadoBadge}">
                      ${_escapeHtml(salida.estado_salida || '')}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

async function cargarExpedientesSinGrupo(mountNode) {
  let expedientesSinGrupo = getCachedTabData("expedientesSinGrupo");
  if (!expedientesSinGrupo) {
    const [todosResp, gruposResp] = await Promise.all([
      archivoGeneralService.listarExpedientes(),
      archivoGeneralService.listarGrupos()
    ]);

    if (!todosResp.success) {
      showToast("Error cargando expedientes", "error");
      return;
    }

    const grupos = gruposResp.success ? (gruposResp.data || []) : [];
    const detalleRespuestas = await Promise.all(
      grupos.map((grupo) => archivoGeneralService.listarDetalleGrupo(grupo.id_grupo))
    );

    const expedientesConGrupo = new Set();
    detalleRespuestas.forEach((detalleResp) => {
      if (detalleResp.success) {
        (detalleResp.data || []).forEach((exp) => expedientesConGrupo.add(exp.id_expediente));
      }
    });

    expedientesSinGrupo = (todosResp.data || []).filter((exp) => !expedientesConGrupo.has(exp.id_expediente));
    setCachedTabData("expedientesSinGrupo", expedientesSinGrupo);
  }

  const tabExpedientes = document.getElementById("tab-expedientes-sin-grupo");
  if (!tabExpedientes) return;

  if (expedientesSinGrupo.length === 0) {
    tabExpedientes.innerHTML = `
      <div class="text-center py-8">
        <p class="text-slate-500">Todos los expedientes han sido asignados a un grupo</p>
      </div>
    `;
  } else {
    tabExpedientes.innerHTML = `
      <div class="border border-slate-200 rounded-md overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Expediente</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Año</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Juzgado</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Materia</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${expedientesSinGrupo.map(exp => `
              <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-3 font-medium text-slate-900">${_escapeHtml(exp.codigo_expediente_completo || '')}</td>
                <td class="px-4 py-3 text-slate-700">${exp.anio || '-'}</td>
                <td class="px-4 py-3 text-slate-700">${_escapeHtml(exp.juzgado_texto || '')}</td>
                <td class="px-4 py-3 text-slate-700">${_escapeHtml(exp.materia_texto || '')}</td>
                <td class="px-4 py-3 text-slate-700">${_escapeHtml(obtenerEstadoTextoArchivo(exp))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

export async function initArchivoGeneralPage({ mountNode, embeddedInPaquetesGeneral = false }) {
  const title = embeddedInPaquetesGeneral
    ? "Paquetes para Archivo General"
    : "Archivo General de Expedientes";
  const subtitle = embeddedInPaquetesGeneral
    ? "Gestión de grupos, salidas y expedientes del archivo general"
    : "Gestión integral de grupos y salidas del archivo general";

  mountNode.innerHTML = `
    <section class="mb-10">
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-100 via-orange-50 to-red-100 text-orange-700 shadow-sm ring-1 ring-orange-200/70">${HEADER_ICON_SVG}</span>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-900">${title}</h2>
          </div>
          <span class="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 w-fit">
            ${icon("shieldCheck", "w-4 h-4")} Carga optimizada
          </span>
        </div>
        <p class="text-sm text-slate-500 ml-10">${subtitle}</p>
      </div>

      <div class="card-surface p-6">
        <div id="tabs-container" class="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1.5 mb-4">
          <button class="tab-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-slate-900 shadow-sm cursor-pointer active" data-tab="grupos">
            ${icon("folder", "w-4 h-4")} Grupos
          </button>
          <button class="tab-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-slate-900 cursor-pointer" data-tab="salidas">
            ${icon("moveRight", "w-4 h-4")} Salidas
          </button>
          <button class="tab-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-slate-900 cursor-pointer" data-tab="expedientes-sin-grupo">
            ${icon("list", "w-4 h-4")} Expedientes sin Grupo
          </button>
        </div>

        <div id="tab-grupos" class="tab-content">
          <div class="text-center py-8">
            <p class="text-slate-500">Cargando...</p>
          </div>
        </div>

        <div id="tab-salidas" class="tab-content hidden">
          <div class="text-center py-8">
            <p class="text-slate-500">Cargando...</p>
          </div>
        </div>

        <div id="tab-expedientes-sin-grupo" class="tab-content hidden">
          <div class="text-center py-8">
            <p class="text-slate-500">Cargando...</p>
          </div>
        </div>
      </div>
    </section>
  `;

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".tab-btn").forEach((b) => {
        b.classList.remove("active", "bg-slate-900", "text-white", "shadow-sm");
        b.classList.add("text-slate-700");
      });
      document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
      
      btn.classList.add("active", "bg-slate-900", "text-white", "shadow-sm");
      btn.classList.remove("text-slate-700");
      const tabId = btn.dataset.tab;
      const tabElement = document.getElementById(`tab-${tabId}`);
      tabElement.classList.remove("hidden");

      if (tabId === "grupos") {
        await cargarGrupos(mountNode);
      } else if (tabId === "salidas") {
        await cargarSalidas(mountNode);
      } else if (tabId === "expedientes-sin-grupo") {
        await cargarExpedientesSinGrupo(mountNode);
      }
    });
  });

  // Cargar tab de grupos al inicio
  await cargarGrupos(mountNode);
}
