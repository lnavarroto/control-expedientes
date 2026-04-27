/**
 * Página de Listado de Expedientes - Backend Integration
 */

import { openModal } from "../../components/modal.js";
import { statusBadge } from "../../components/statusBadge.js";
import { icon } from "../../components/icons.js";
import { showToast } from "../../components/toast.js";
import { expedienteService } from "../../services/expedienteService.js";
import { estadoService } from "../../services/estadoService.js";
import { juzgadoService } from "../../services/juzgadoService.js";
import { formatoFechaHora } from "../../utils/formatters.js";
import { appConfig } from "../../config.js";
import {
  obtenerNombreEstado,
  obtenerColorEstado,
  obtenerNombreMateria,
  obtenerNombreJuzgado,
  formatearExpediente
} from "./expedientesMapeo.js";
import { ALERT_TONES, CARD_TONES } from "../../core/uiTokens.js";

const SALIDA_EXPEDIENTE_RULES = {
  PRESTAMO: {
    destinos: ["JUZGADO", "JUEZ", "ESPECIALISTA", "ASISTENTE", "AREA_USUARIA", "SALA_AUDIENCIA"],
    motivos: ["LECTURA_EXPEDIENTE", "CONSULTA", "REVISION_INTERNA", "AUDIENCIA", "APOYO_ORDENAMIENTO"]
  },
  SALIDA_INTERNA: {
    destinos: ["JUZGADO", "JUEZ", "ESPECIALISTA", "ASISTENTE", "AREA_DIGITALIZACION", "SALA_AUDIENCIA"],
    motivos: ["REVISION_INTERNA", "DIGITALIZACION", "AUDIENCIA", "ORDENAMIENTO", "APOYO_ORDENAMIENTO"]
  },
  SALIDA_EXTERNA: {
    destinos: ["OTRO_JUZGADO", "ENTIDAD_EXTERNA", "MESA_PARTES", "FISCALIA", "PROCURADURIA"],
    motivos: ["TRASLADO", "CONSULTA_EXTERNA", "REMISION_TEMPORAL", "REVISION_EXTERNA"]
  },
  ENVIO_DEFINITIVO: {
    destinos: ["ARCHIVO_CENTRAL", "ARCHIVO_GENERAL", "OTRO_JUZGADO", "ENTIDAD_EXTERNA"],
    motivos: ["REMISION_FINAL", "CIERRE_EXPEDIENTE", "ARCHIVO_DEFINITIVO", "TRANSFERENCIA_DEFINITIVA"]
  }
};

function _prettyLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function _normalizarCodigoExpediente(valor) {
  return String(valor || "")
    .trim()
    .replace(/^[@']+/, "")
    .trim();
}

function _normalizarEstadoClave(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function _resolverIdEstadoDesdeCatalogo(aliasList, idFallback = "") {
  const lista = estadoService.listarSync() || [];
  const map = new Map(
    lista.map((item) => [
      _normalizarEstadoClave(item.nombre_estado || item.nombre || ""),
      String(item.id_estado || item.id || "").trim()
    ])
  );
  const aliases = Array.isArray(aliasList) ? aliasList : [aliasList];
  for (const alias of aliases) {
    const id = map.get(_normalizarEstadoClave(alias));
    if (id) return id;
  }
  return String(idFallback || "").trim();
}

function _estadoExpedienteNormalizado(expediente, formateado = null) {
  const porId = obtenerNombreEstado(expediente?.id_estado);
  const porTexto = expediente?.nombre_estado || expediente?.estado || formateado?.estado || "";
  return _normalizarEstadoClave(porId || porTexto);
}

function _esEstadoPrestamo(expediente, formateado = null) {
  const estadoNormalizado = _estadoExpedienteNormalizado(expediente, formateado);
  if (
    estadoNormalizado.includes("PRESTAMO") ||
    estadoNormalizado.includes("PRESTADO") ||
    estadoNormalizado.includes("DERIVADO")
  ) return true;

  const idConRetorno = [
    _resolverIdEstadoDesdeCatalogo(["PRESTAMO", "PRESTADO"], ""),
    _resolverIdEstadoDesdeCatalogo(["DERIVADO"], "")
  ].filter(Boolean);

  return idConRetorno.includes(String(expediente?.id_estado || "").trim());
}

let catalogosEdicionPromise = null;

async function fetchCatalogo(baseURL, action) {
  try {
    const res = await fetch(`${baseURL}?action=${action}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch (e) {
    console.warn(`⚠️ Error cargando catálogo ${action}:`, e.message);
    return [];
  }
}

async function getCatalogosEdicion() {
  if (!catalogosEdicionPromise) {
    const baseURL = appConfig.googleSheetURL;
    catalogosEdicionPromise = Promise.all([
      fetchCatalogo(baseURL, "listar_estados_activos"),
      fetchCatalogo(baseURL, "listar_estados_sistema_activos"),
      fetchCatalogo(baseURL, "listar_responsables_activos")
    ]).then(([estados, estadosSistema, especialistas]) => ({
      estados,
      estadosSistema,
      especialistas
    }));
  }
  return catalogosEdicionPromise;
}

function resetCatalogosEdicion() {
  catalogosEdicionPromise = null;
}

/**
 * Renderizar tabla de expedientes del backend con paginación
 */
function renderTablaExpedientes(expedientes, paginaActual = 1, itemsPorPagina = 10) {
  if (!expedientes || expedientes.length === 0) {
    return {
      html: `
        <div class="card-surface p-8 text-center">
          <p class="text-slate-500 font-medium mb-2">No hay expedientes registrados</p>
          <p class="text-xs text-slate-400">Los expedientes aparecerán aquí cuando se registren nuevos</p>
        </div>
      `,
      totalPaginas: 0,
      paginaActual: 0
    };
  }

  const idExpToNumber = (idExp) => {
    const match = String(idExp || "").match(/EXP-(\d+)/i);
    return match ? Number(match[1]) : 0;
  };

  // Orden real por correlativo de Excel: id_expediente (EXP-0001 ... EXP-0149)
  const expedientesOrdenados = [...expedientes].sort((a, b) => {
    return idExpToNumber(b.id_expediente) - idExpToNumber(a.id_expediente);
  });

  // Calcular paginación
  const totalPaginas = Math.ceil(expedientesOrdenados.length / itemsPorPagina);
  const paginaValida = Math.min(Math.max(1, paginaActual), totalPaginas);
  const inicio = (paginaValida - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const expedientesPagina = expedientesOrdenados.slice(inicio, fin);

  // Renderizar filas
  const filas = expedientesPagina.map((exp, indexEnPagina) => {
    const formateado = formatearExpediente(exp);
    const enPrestamo = _esEstadoPrestamo(exp, formateado);
    // Mostrar ORDEN con el correlativo real de id_expediente
    const numeroGlobal = idExpToNumber(exp.id_expediente) || (expedientesOrdenados.length - inicio - indexEnPagina);
    const estadoHtml = statusBadge(formateado.estado);

    return `
      <tr class="hover:bg-slate-50 transition-colors" data-numero="${formateado.numero}">
        <td class="px-4 py-3 border-t border-slate-100"><span class="font-bold text-slate-600">#${numeroGlobal}</span></td>
        <td class="px-4 py-3 border-t border-slate-100"><span class="font-mono font-bold text-blue-700">${formateado.numero}</span></td>
        <td class="px-4 py-3 border-t border-slate-100 text-sm">${formateado.materia}</td>
        <td class="px-4 py-3 border-t border-slate-100 text-sm">${formateado.juzgado}</td>
        <td class="px-4 py-3 border-t border-slate-100 text-xs text-slate-600">${formateado.ingreso}</td>
        <td class="px-4 py-3 border-t border-slate-100 text-xs text-slate-600">${formateado.ubicacion}</td>
        <td class="px-4 py-3 border-t border-slate-100">${estadoHtml}</td>
        <td class="px-4 py-3 border-t border-slate-100 text-sm text-slate-700">${formateado.registradoPor}</td>
        <td class="px-4 py-3 border-t border-slate-100">
          <div class="flex items-center justify-center gap-2">
            <button class="btn btn-secondary text-xs btn-ver-detalles inline-flex items-center gap-1" data-numero="${formateado.numero}">${icon("eye", "w-3.5 h-3.5")}<span>Ver</span></button>
            <button class="btn btn-secondary text-xs btn-movimiento-exp inline-flex items-center gap-1" data-numero="${formateado.numero}" data-accion="${enPrestamo ? "retorno" : "salida"}">${icon("moveRight", "w-3.5 h-3.5")}<span>${enPrestamo ? "Retorno" : "Salida"}</span></button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  const html = `
    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Orden</th>
              <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Número del Expediente</th>
              <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Materia</th>
              <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Juzgado</th>
              <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Fecha de Ingreso</th>
              <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Ubicación</th>
              <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Estado</th>
              <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Registrado por</th>
              <th class="px-4 py-3 text-center text-xs uppercase tracking-wider font-bold text-slate-700">Acción</th>
            </tr>
          </thead>
          <tbody>
            ${filas}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return {
    html,
    totalPaginas,
    paginaActual: paginaValida,
    expedientesMostrados: expedientesPagina.length,
    expedientesTotal: expedientesOrdenados.length
  };
}

/**
 * Renderizar controles de paginación con buen diseño
 */
function renderPaginacion(paginaActual, totalPaginas) {
  if (totalPaginas <= 1) return "";

  const generarBotonesPagina = () => {
    const botones = [];
    const ventana = 3; // Mostrar botones alrededor de la página actual

    const inicio = Math.max(1, paginaActual - ventana);
    const fin = Math.min(totalPaginas, paginaActual + ventana);

    if (inicio > 1) {
      botones.push(`
        <button class="btn-pagina" data-pagina="1" title="Primera página">
          <span class="font-bold">«</span>
        </button>
      `);
      if (inicio > 2) {
        botones.push(`<span class="text-slate-400 px-2">...</span>`);
      }
    }

    for (let i = inicio; i <= fin; i++) {
      const esActual = i === paginaActual;
      botones.push(`
        <button class="btn-pagina ${esActual ? 'activo' : ''}" data-pagina="${i}" ${esActual ? 'disabled' : ''}>
          ${i}
        </button>
      `);
    }

    if (fin < totalPaginas) {
      if (fin < totalPaginas - 1) {
        botones.push(`<span class="text-slate-400 px-2">...</span>`);
      }
      botones.push(`
        <button class="btn-pagina" data-pagina="${totalPaginas}" title="Última página">
          <span class="font-bold">»</span>
        </button>
      `);
    }

    return botones.join("");
  };

  return `
    <div class="card-surface p-4 mt-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="text-sm text-slate-600 font-semibold">
          Página <span class="text-blue-600 font-bold">${paginaActual}</span> de <span class="text-blue-600 font-bold">${totalPaginas}</span>
        </div>
        
        <div class="flex items-center gap-2 flex-wrap justify-center">
          <button class="btn-primera-pagina btn-nav-paginacion text-xs" ${paginaActual === 1 ? 'disabled' : ''} title="Primera página">
            ⏮ Primera
          </button>
          
          <button class="btn-pagina-anterior btn-nav-paginacion text-xs" ${paginaActual === 1 ? 'disabled' : ''} title="Página anterior">
            ◀ Anterior
          </button>
          
          <div class="flex items-center gap-1 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 flex-wrap justify-center">
            ${generarBotonesPagina()}
          </div>
          
          <button class="btn-pagina-siguiente btn-nav-paginacion text-xs" ${paginaActual === totalPaginas ? 'disabled' : ''} title="Página siguiente">
            Siguiente ▶
          </button>
          
          <button class="btn-ultima-pagina btn-nav-paginacion text-xs" ${paginaActual === totalPaginas ? 'disabled' : ''} title="Última página">
            Última ⏭
          </button>
        </div>

        <div class="text-xs text-slate-500">
          Mostrando <span class="font-bold text-slate-700">10</span> expedientes por página
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderizar panel de filtros
 */
function renderPanelFiltradores(expedientes, filtros = {}) {
  if (!expedientes || expedientes.length === 0) {
    return `
      <div class="card-surface p-4 text-center opacity-50">
        <p class="text-sm text-slate-500">Carga expedientes para usar filtros</p>
      </div>
    `;
  }

  const materias = [
    ...new Set(
      expedientes
        .map(e => e.codigo_materia)
        .filter(Boolean)
    )
  ];

  const juzgados = [
    ...new Set(
      expedientes
        .map(e => e.juzgado_texto || e.id_juzgado)
        .filter(Boolean)
    )
  ];

  const estados = [
    ...new Set(
      expedientes
        .map(e => e.id_estado)
        .filter(Boolean)
    )
  ];

  const filtrosActivos = {
    materia: filtros.materia || "",
    juzgado: filtros.juzgado || "",
    estado: filtros.estado || "",
    texto: filtros.texto || ""
  };

  const esc = (valor = "") => String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const optionList = (items, mapFn = i => i) => {
    return ["<option value=''>-- Todos --"]
      .concat(
        items.map(item => {
          const selected = String(item) === String(filtrosActivos.materia) || String(item) === String(filtrosActivos.juzgado) || String(item) === String(filtrosActivos.estado)
            ? "selected"
            : "";
          return `<option value="${esc(item)}" ${selected}>${esc(mapFn(item))}</option>`;
        }
        )
      )
      .join("");
  };

  const optionListMateria = ["<option value=''>-- Todos --</option>"]
    .concat(materias.map((item) => `<option value="${esc(item)}" ${String(item) === String(filtrosActivos.materia) ? "selected" : ""}>${esc(obtenerNombreMateria(item))}</option>`))
    .join("");

  const optionListJuzgado = ["<option value=''>-- Todos --</option>"]
    .concat(juzgados.map((item) => `<option value="${esc(item)}" ${String(item) === String(filtrosActivos.juzgado) ? "selected" : ""}>${esc(item)}</option>`))
    .join("");

  const optionListEstado = ["<option value=''>-- Todos --</option>"]
    .concat(estados.map((item) => `<option value="${esc(item)}" ${String(item) === String(filtrosActivos.estado) ? "selected" : ""}>${esc(obtenerNombreEstado(item))}</option>`))
    .join("");

  return `
    <div class="card-surface p-4 space-y-3 bg-gradient-to-br ${CARD_TONES.neutral.surface}">
      <h4 class="font-bold text-slate-700 mb-3 inline-flex items-center gap-2">${icon("busqueda", "w-4 h-4")}<span>Filtros</span></h4>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="text-xs font-bold text-slate-600 uppercase block mb-1">Materia</label>
          <select id="filtro-materia" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:border-blue-500">
            ${optionListMateria}
          </select>
        </div>
        
        <div>
          <label class="text-xs font-bold text-slate-600 uppercase block mb-1">Juzgado</label>
          <select id="filtro-juzgado" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:border-blue-500">
            ${optionListJuzgado}
          </select>
        </div>
        
        <div>
          <label class="text-xs font-bold text-slate-600 uppercase block mb-1">Estado</label>
          <select id="filtro-estado" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:border-blue-500">
            ${optionListEstado}
          </select>
        </div>
      </div>

      <div>
        <label class="text-xs font-bold text-slate-600 uppercase block mb-1">Búsqueda General</label>
        <input id="filtro-texto" type="text" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:border-blue-500" 
          placeholder="Código, número o registrado por..." value="${esc(filtrosActivos.texto)}" />
      </div>

      <div class="flex gap-2 justify-end">
        <button id="btn-filtrar" class="btn btn-primary text-sm md:text-base px-5 py-2.5 inline-flex items-center gap-2">${icon("busqueda", "w-4 h-4")}<span>Filtrar</span></button>
        <button id="btn-limpiar-filtros" class="btn btn-secondary text-sm md:text-base px-5 py-2.5 inline-flex items-center gap-2">${icon("refreshCw", "w-4 h-4")}<span>Limpiar</span></button>
      </div>
    </div>
  `;
}

/**
 * Inicializar página de listado
 */
export async function initListadoPage({ mountNode, forceRefresh = false }) {
  try {
    await estadoService.precargar();
  } catch (error) {
    console.warn("⚠️ No se pudo refrescar catálogo de estados:", error?.message || error);
  }

  // ✅ OPTIMIZACIÓN: Mostrar caché primero (si existe) para velocidad inmediata
  const cachedExp = forceRefresh ? [] : expedienteService.listarDelBackendSync();
  
  if (cachedExp.length > 0) {
    console.log("⚡ Mostrando expedientes del caché (carga rápida)");
    renderListadoExpedientes(cachedExp, mountNode);
    
    // En background, actualizar con datos frescos
    expedienteService.listarDelBackend({ forceRefresh: true })
      .then(resultado => {
        if (resultado.success && resultado.data) {
          console.log("✅ Datos actualizados del backend");
          renderListadoExpedientes(resultado.data, mountNode);
        }
      })
      .catch(err => console.warn("⚠️ Error actualizando en background:", err));
    
    return;
  }

  // Si no hay caché, mostrar spinner mientras carga
  mountNode.innerHTML = `
    <div class="text-center py-8">
      <p class="text-slate-500 font-medium inline-flex items-center gap-2">${icon("archiveBox", "w-4 h-4")}<span>Cargando expedientes...</span></p>
      <div class="mt-4 inline-block">
        <div class="animate-spin inline-block w-6 h-6 border-4 border-slate-300 border-t-blue-500 rounded-full"></div>
      </div>
    </div>
  `;

  try {
    // Obtener expedientes del backend
    const resultado = await expedienteService.listarDelBackend({ forceRefresh });

    if (!resultado.success || !resultado.data) {
      const t = ALERT_TONES.warning;
      mountNode.innerHTML = `
        <div class="card-surface p-8 text-center border-l-4 ${t.border} ${t.surface}">
          <p class="${t.text} font-semibold">Error al cargar expedientes</p>
          <p class="text-sm ${t.text} mt-1">No se pudo conectar con el backend. Intenta recargar.</p>
          <button onclick="location.reload()" class="btn btn-primary mt-4 inline-flex items-center gap-2">${icon("refreshCw", "w-4 h-4")}<span>Recargar</span></button>
        </div>
      `;
      return;
    }

    renderListadoExpedientes(resultado.data, mountNode);
  } catch (error) {
    console.error("Error en listadoPage:", error);
    const t = ALERT_TONES.danger;
    mountNode.innerHTML = `
      <div class="card-surface p-8 text-center border-l-4 ${t.border} ${t.surface}">
        <p class="${t.text} font-semibold">Error</p>
        <p class="text-sm ${t.text} mt-1">${error.message}</p>
      </div>
    `;
  }
}

/**
 * Renderizar página de listado con expedientes
 */
function renderListadoExpedientes(expedientes, mountNode) {
  let expedientesFiltrados = [...expedientes];
  let paginaActual = 1;
  const itemsPorPagina = 10;
  let filtrosActivos = {
    materia: "",
    juzgado: "",
    estado: "",
    texto: ""
  };

  const handlerSyncExpedientes = async () => {
    expedienteService.limpiarCacheBackend();
    await initListadoPage({ mountNode, forceRefresh: true });
  };
  if (window.__ceExpedientesUpdatedHandler) {
    window.removeEventListener("expedientes:updated", window.__ceExpedientesUpdatedHandler);
  }
  window.__ceExpedientesUpdatedHandler = handlerSyncExpedientes;
  window.addEventListener("expedientes:updated", window.__ceExpedientesUpdatedHandler);

  const CUSTOM_MODAL_SELECTOR = ".ce-custom-modal";

  function cerrarModalActivo() {
    document.querySelector(CUSTOM_MODAL_SELECTOR)?.remove();
  }

  function crearModal(contenidoHtml) {
    cerrarModalActivo();
    const modal = document.createElement("div");
    modal.className = "ce-custom-modal fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto";
    modal.innerHTML = contenidoHtml;
    document.body.appendChild(modal);
    return modal;
  }

  getCatalogosEdicion().catch(() => {
    // precarga silenciosa
  });

  const renderHTML = () => {
    const resultado = renderTablaExpedientes(expedientesFiltrados, paginaActual, itemsPorPagina);
    const totalPaginas = resultado.totalPaginas;
    
    return `
      <section>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-slate-900 inline-flex items-center gap-2">${icon("archiveBox", "w-5 h-5")}<span>Expedientes Registrados</span></h2>
            <p class="text-sm text-slate-600 mt-1">Total: <span class="font-bold">${expedientesFiltrados.length}</span> de <span class="font-bold">${expedientes.length}</span></p>
          </div>
          <button id="btn-recargar" class="btn btn-secondary inline-flex items-center gap-2">${icon("refreshCw", "w-4 h-4")}<span>Recargar</span></button>
        </div>

        ${renderPanelFiltradores(expedientes, filtrosActivos)}

        <div class="mt-4">
          ${resultado.html}
        </div>

        ${renderPaginacion(paginaActual, totalPaginas)}
      </section>
    `;
  };

  /**
   * Abrir modal para editar expediente
   */
  async function abrirModalEditar(expediente) {
    const formateado = formatearExpediente(expediente);

    // Mostrar modal de inmediato y cargar catálogos/seguimiento en background.
    const idEstadoSistemaSeleccionado = String(expediente.id_estado_sistema || "").trim();
    const idEspecialistaSeleccionado = String(expediente.id_usuario_responsable || "").trim();

    const modal = crearModal(`
      <div class="bg-white rounded-lg shadow-2xl max-w-3xl w-full my-8 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-slate-900">✏️ Editar Expediente</h2>
          <button class="btn-cerrar text-slate-500 hover:text-slate-700 font-bold text-2xl">✕</button>
        </div>
        <form class="space-y-4">
          <!-- Información de solo lectura -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Número Expediente</label>
              <input type="text" value="${formateado.numero}" disabled class="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-600 font-mono" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Año</label>
              <input type="text" value="${formateado.anio}" disabled class="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-600" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Materia</label>
              <input type="text" value="${formateado.materia}" disabled class="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-600" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Registrado por</label>
              <input type="text" value="${formateado.registradoPor || '-'}" disabled class="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-600" />
            </div>
          </div>

          <!-- Campos editables -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Juzgado solo lectura -->
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-blue-700 mb-2">Juzgado</label>
              <input type="text" class="edit-juzgado w-full px-3 py-2 border-2 border-blue-200 rounded bg-slate-100 text-slate-600" value="${formateado.juzgado}" readonly />
            </div>

            <!-- Estado del Expediente en Archivo -->
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-green-700 mb-2">Estado del Expediente</label>
              <select class="edit-estado w-full px-3 py-2 border-2 border-green-300 rounded focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-green-50">
                <option value="">Cargando estados...</option>
              </select>
            </div>

            <!-- Estado del Sistema -->
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-indigo-700 mb-2">Estado del Sistema</label>
              <select class="edit-estado-sistema w-full px-3 py-2 border-2 border-indigo-300 rounded focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-indigo-50">
                <option value="">Cargando estados del sistema...</option>
              </select>
            </div>

            <!-- Ubicación editable -->
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-amber-700 mb-2">Ubicación</label>
              <input type="text" class="edit-ubicacion w-full px-3 py-2 border-2 border-amber-300 rounded focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-amber-50" 
                value="${formateado.ubicacion}" placeholder="Ej: Estante, Archivo A-1" />
            </div>

            <!-- Especialista editable -->
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-purple-700 mb-2">Especialista Asignado</label>
              <select class="edit-especialista w-full px-3 py-2 border-2 border-purple-300 rounded focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-purple-50">
                <option value="">Cargando especialistas...</option>
              </select>
            </div>
          </div>

          <!-- Observaciones -->
          <div>
            <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-2">Observaciones</label>
            <textarea class="edit-observaciones w-full px-3 py-2 border-2 border-slate-300 rounded focus:border-slate-500 focus:ring-2 focus:ring-slate-200 font-mono text-sm bg-slate-50" 
              rows="3" placeholder="Notas adicionales sobre el expediente...">${expediente.observaciones || ""}</textarea>
          </div>

          <!-- Info de campos editables -->
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
            <p class="text-sm font-semibold text-slate-800">
              <strong>Campos editables:</strong> Estado del Expediente, Estado del Sistema, Ubicación, Especialista y Observaciones
            </p>
          </div>
        </form>
        <div class="flex gap-2 justify-end pt-4 border-t border-slate-200">
          <button class="btn-cancelar px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">Cancelar</button>
          <button class="btn-guardar btn btn-primary">Guardar Cambios</button>
        </div>
      </div>
    `);

    modal.querySelector(".btn-cerrar").addEventListener("click", cerrarModalActivo);
    modal.querySelector(".btn-cancelar").addEventListener("click", cerrarModalActivo);

    const cargarCatalogosYValoresIniciales = async () => {
      try {
        const resolverValoresSeguimiento = async () => {
          try {
            let idExpediente = String(expediente.id_expediente || "").trim();

            if (!idExpediente) {
              const codigoExpediente = _normalizarCodigoExpediente(String(
                expediente.codigo_expediente_completo || expediente.numero_expediente || ""
              ));
              if (!codigoExpediente) {
                return {
                  idEstadoSistema: idEstadoSistemaSeleccionado,
                  idEspecialista: idEspecialistaSeleccionado
                };
              }

              const expedienteBackend = await expedienteService.obtenerDelBackendPorCodigo(codigoExpediente);
              idExpediente = String(expedienteBackend?.data?.id_expediente || "").trim();
            }

            if (!idExpediente) {
              return {
                idEstadoSistema: idEstadoSistemaSeleccionado,
                idEspecialista: idEspecialistaSeleccionado
              };
            }

            const ultimoSeguimiento = await expedienteService.obtenerUltimoSeguimiento(idExpediente);
            if (!ultimoSeguimiento.success || !ultimoSeguimiento.data) {
              return {
                idEstadoSistema: idEstadoSistemaSeleccionado,
                idEspecialista: idEspecialistaSeleccionado
              };
            }

            return {
              idEstadoSistema: String(ultimoSeguimiento.data.id_estado_sistema || idEstadoSistemaSeleccionado || "").trim(),
              idEspecialista: String(ultimoSeguimiento.data.id_usuario_responsable || idEspecialistaSeleccionado || "").trim()
            };
          } catch {
            return {
              idEstadoSistema: idEstadoSistemaSeleccionado,
              idEspecialista: idEspecialistaSeleccionado
            };
          }
        };

        const [catalogos, valoresSeguimiento] = await Promise.all([
          getCatalogosEdicion(),
          resolverValoresSeguimiento()
        ]);

        const { estados, estadosSistema, especialistas } = catalogos;
        const idEstadoSistemaFinal = String(valoresSeguimiento.idEstadoSistema || "").trim();
        const idEspecialistaFinal = String(valoresSeguimiento.idEspecialista || "").trim();

        const selectEstado = modal.querySelector(".edit-estado");
        const selectEstadoSistema = modal.querySelector(".edit-estado-sistema");
        const selectEspecialista = modal.querySelector(".edit-especialista");

        if (!selectEstado || !selectEstadoSistema || !selectEspecialista) return;

        const optionsEstados = estados.map(e =>
          `<option value="${e.id_estado}" ${String(e.id_estado) === String(expediente.id_estado) ? 'selected' : ''}>${e.nombre_estado}</option>`
        ).join("");

        const optionsEstadosSistema = estadosSistema.map(es =>
          `<option value="${es.id_estado_sistema}" ${String(es.id_estado_sistema) === idEstadoSistemaFinal ? 'selected' : ''}>${es.nombre_estado_sistema}</option>`
        ).join("");

        const especialistasFiltrados = (especialistas || []).filter(esp => {
          const idRol = String(esp.id_rol || "").trim().toUpperCase();
          const cargo = String(esp.cargo || "").trim().toUpperCase();
          return idRol === "ROL0005" || cargo.includes("ESPECIALISTA");
        });

        const optionsEspecialistas = especialistasFiltrados.map(esp =>
          `<option value="${esp.id_usuario}" ${String(esp.id_usuario) === idEspecialistaFinal ? 'selected' : ''}>${esp.nombre_completo}</option>`
        ).join("");

        selectEstado.innerHTML = `<option value="">-- Seleccionar Estado --</option>${optionsEstados}`;
        selectEstadoSistema.innerHTML = `<option value="">-- Seleccionar Estado --</option>${optionsEstadosSistema}`;
        selectEspecialista.innerHTML = `<option value="">-- Seleccionar Especialista --</option>${optionsEspecialistas}`;

        if (idEstadoSistemaFinal) {
          const existeEstado = Array.from(selectEstadoSistema.options).some((opt) => String(opt.value) === idEstadoSistemaFinal);
          if (existeEstado) selectEstadoSistema.value = idEstadoSistemaFinal;
        }

        if (idEspecialistaFinal) {
          const existeEspecialista = Array.from(selectEspecialista.options).some((opt) => String(opt.value) === idEspecialistaFinal);
          if (existeEspecialista) selectEspecialista.value = idEspecialistaFinal;
        }
      } catch (error) {
        const selectEstado = modal.querySelector(".edit-estado");
        const selectEstadoSistema = modal.querySelector(".edit-estado-sistema");
        const selectEspecialista = modal.querySelector(".edit-especialista");

        if (selectEstado) selectEstado.innerHTML = `<option value="">-- Seleccionar Estado --</option>`;
        if (selectEstadoSistema) selectEstadoSistema.innerHTML = `<option value="">-- Seleccionar Estado --</option>`;
        if (selectEspecialista) selectEspecialista.innerHTML = `<option value="">-- Seleccionar Especialista --</option>`;

        console.warn("⚠️ No se pudieron cargar catálogos/seguimiento en modal editar:", error?.message || error);
      }
    };

    cargarCatalogosYValoresIniciales();
    
    modal.querySelector(".btn-guardar").addEventListener("click", async () => {
      const idEstado = modal.querySelector(".edit-estado").value.trim();
      const idEstadoSistema = modal.querySelector(".edit-estado-sistema").value.trim();
      const idEspecialista = modal.querySelector(".edit-especialista").value.trim();
      const ubicacion = modal.querySelector(".edit-ubicacion").value.trim();
      const observaciones = modal.querySelector(".edit-observaciones").value.trim();
      
      // Validación básica
      if (!idEstado) {
        showToast("Debes seleccionar un estado del expediente", "warning");
        return;
      }

      const btnGuardar = modal.querySelector(".btn-guardar");
      const textoOriginal = btnGuardar.textContent;
      btnGuardar.disabled = true;
      btnGuardar.textContent = "Guardando...";

      try {
          // Leer usuario real desde sesión autenticada (authManager guarda en 'trabajador_validado')
          const trabajador = JSON.parse(localStorage.getItem("trabajador_validado") || "null");
          const usuarioRegistra = trabajador
            ? `${trabajador.dni} - ${trabajador.nombres} ${trabajador.apellidos}`
            : "Sin identificar";

          // Compatible con actualizarExpediente(data) del backend
          const datosActualizacion = {
            id_expediente: String(expediente.id_expediente || "").trim(),
            codigo_expediente_completo: _normalizarCodigoExpediente(String(
              expediente.codigo_expediente_completo || expediente.numero_expediente || ""
            )),
            id_estado: idEstado,
            id_estado_sistema: idEstadoSistema,
            id_usuario_responsable: idEspecialista,
            ubicacion_texto: ubicacion,
            observaciones,
            usuario_registra: usuarioRegistra
        };

        const resultado = await expedienteService.actualizarEnBackend(datosActualizacion);

        if (!resultado.success) {
          showToast(`${resultado.message || "No se pudo actualizar"}`, "error");
          return;
        }

        const index = expedientes.findIndex(e => e.numero_expediente === expediente.numero_expediente);
        if (index !== -1) {
          expedientes[index].id_estado = idEstado;
          expedientes[index].id_estado_sistema = idEstadoSistema;
          expedientes[index].id_usuario_responsable = idEspecialista;
          expedientes[index].ubicacion_texto = ubicacion;
          expedientes[index].observaciones = observaciones;
        }

        showToast("Expediente actualizado correctamente", "success");
        mountNode.innerHTML = renderHTML();
        setupEventListeners();
        cerrarModalActivo();
      } catch (error) {
        showToast(`${error.message}`, "error");
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = textoOriginal;
      }
    });
  }

  /**
   * Abrir modal con detalles del expediente
   */
  function abrirModalDetalles(expediente) {
    const formateado = formatearExpediente(expediente);
    const modal = crearModal(`
      <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-slate-900">Detalles del Expediente</h2>
          <button class="btn-cerrar text-slate-500 hover:text-slate-700 font-bold text-2xl">✕</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
          <div>
            <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Número Expediente</p>
            <p class="text-lg font-mono font-bold text-blue-700">${formateado.numero}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Año</p>
            <p class="text-lg font-bold text-slate-800">${formateado.anio}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Materia</p>
            <p class="text-base text-slate-800">${formateado.materia}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Juzgado</p>
            <p class="text-base text-slate-800">${formateado.juzgado}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Fecha de Ingreso</p>
            <p class="text-base text-slate-800">${formateado.ingreso}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Ubicación</p>
            <p class="text-base text-slate-800">${formateado.ubicacion}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Estado</p>
            <p class="text-base">${statusBadge(formateado.estado)}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Incidente</p>
            <p class="text-base text-slate-800">${formateado.incidente}</p>
          </div>
          <div class="md:col-span-2">
            <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Registrado por</p>
            <p class="text-base text-slate-800">${formateado.registradoPor}</p>
          </div>
          <div class="md:col-span-2">
            <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Observaciones</p>
            <p class="text-base text-slate-800 whitespace-pre-wrap">${formateado.observaciones || "Sin observaciones"}</p>
          </div>
        </div>

        <div class="flex gap-2 justify-end pt-4 border-t border-slate-200">
          <button class="btn-cerrar px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium inline-flex items-center gap-1">${icon("xMark", "w-3.5 h-3.5")}<span>Cerrar</span></button>
          <button class="btn-editar btn btn-primary inline-flex items-center gap-1">${icon("edit", "w-3.5 h-3.5")}<span>Editar</span></button>
        </div>
      </div>
    `);

    modal.querySelectorAll(".btn-cerrar").forEach(btn => {
      btn.addEventListener("click", cerrarModalActivo);
    });
    
    modal.querySelector(".btn-editar").addEventListener("click", () => {
      cerrarModalActivo();
      abrirModalEditar(expediente);
    });
  }

  async function abrirModalSalidaExpediente(expediente) {
    const trabajador = JSON.parse(localStorage.getItem("trabajador_validado") || "null");
    const usuarioRegistra = trabajador
      ? `${trabajador.dni} - ${trabajador.nombres} ${trabajador.apellidos}`
      : "Sin identificar";

    const { especialistas } = await getCatalogosEdicion();

    const modal = crearModal(`
      <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-slate-900">Registrar salida de expediente</h2>
          <button class="btn-cerrar text-slate-500 hover:text-slate-700 font-bold text-2xl">✕</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Tipo de salida</label>
            <select class="salida-tipo w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500">
              <option value="">-- Seleccionar --</option>
              <option value="PRESTAMO">Préstamo</option>
              <option value="SALIDA_INTERNA">Salida interna</option>
              <option value="SALIDA_EXTERNA">Salida externa</option>
              <option value="ENVIO_DEFINITIVO">Envío definitivo</option>
            </select>
          </div>
          <div>
            <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Destino</label>
            <select class="salida-destino w-full border border-slate-300 rounded px-3 py-2 text-sm" disabled>
              <option value="">Seleccione tipo primero</option>
            </select>
          </div>
          <div>
            <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Motivo</label>
            <select class="salida-motivo w-full border border-slate-300 rounded px-3 py-2 text-sm" disabled>
              <option value="">Seleccione tipo primero</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Responsable de entrega</label>
            <input class="salida-entrega w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 text-slate-700" value="${usuarioRegistra}" readonly>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Responsable de recepción (solo especialista/asistente)</label>
            <select class="salida-receptor w-full border border-slate-300 rounded px-3 py-2 text-sm" disabled>
              <option value="">Seleccione destino especialista/asistente</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Observación</label>
            <textarea class="salida-observacion w-full border border-slate-300 rounded px-3 py-2 text-sm" rows="3" placeholder="Observación opcional"></textarea>
          </div>
        </div>

        <div class="flex gap-2 justify-end pt-4 border-t border-slate-200">
          <button class="btn-cancelar px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">Cancelar</button>
          <button class="btn-registrar btn btn-primary">Registrar salida</button>
        </div>
      </div>
    `);

    const cerrar = () => cerrarModalActivo();
    modal.querySelector(".btn-cerrar")?.addEventListener("click", cerrar);
    modal.querySelector(".btn-cancelar")?.addEventListener("click", cerrar);

    const tipoEl = modal.querySelector(".salida-tipo");
    const destinoEl = modal.querySelector(".salida-destino");
    const motivoEl = modal.querySelector(".salida-motivo");
    const receptorEl = modal.querySelector(".salida-receptor");

    const poblarReceptores = () => {
      const destino = String(destinoEl?.value || "").trim().toUpperCase();
      if (!receptorEl) return;

      if (destino !== "ESPECIALISTA" && destino !== "ASISTENTE") {
        receptorEl.innerHTML = `<option value="">Seleccione destino especialista/asistente</option>`;
        receptorEl.disabled = true;
        return;
      }

      const filtrados = (especialistas || []).filter((item) => {
        const idRol = String(item.id_rol || "").trim().toUpperCase();
        const cargo = String(item.cargo || "").trim().toUpperCase();
        if (destino === "ESPECIALISTA") return idRol === "ROL0005" || cargo.includes("ESPECIALISTA");
        return idRol === "ROL0006" || cargo.includes("ASISTENTE");
      });

      const options = filtrados.map((item) => {
        const nombre = String(item.nombre_completo || [item.nombres, item.apellidos].filter(Boolean).join(" ") || "").trim();
        const valor = [String(item.id_usuario || "").trim(), nombre].filter(Boolean).join(" - ");
        return `<option value="${valor}">${nombre}</option>`;
      }).join("");

      receptorEl.innerHTML = `<option value="">-- Seleccionar receptor --</option>${options}`;
      receptorEl.disabled = filtrados.length === 0;
    };

    const poblarSelect = (el, opciones, placeholder) => {
      el.innerHTML = `<option value="">${placeholder}</option>${opciones
        .map((opt) => `<option value="${opt}">${_prettyLabel(opt)}</option>`)
        .join("")}`;
      el.disabled = opciones.length === 0;
    };

    tipoEl?.addEventListener("change", () => {
      const reglas = SALIDA_EXPEDIENTE_RULES[String(tipoEl.value || "").trim()];
      if (!reglas) {
        poblarSelect(destinoEl, [], "Seleccione tipo primero");
        poblarSelect(motivoEl, [], "Seleccione tipo primero");
        return;
      }
      poblarSelect(destinoEl, reglas.destinos, "Seleccione destino");
      poblarSelect(motivoEl, reglas.motivos, "Seleccione motivo");
      poblarReceptores();
    });

    destinoEl?.addEventListener("change", poblarReceptores);

    modal.querySelector(".btn-registrar")?.addEventListener("click", async () => {
      const tipo = String(tipoEl?.value || "").trim();
      const destino = String(destinoEl?.value || "").trim();
      const motivo = String(motivoEl?.value || "").trim();
      const responsableReceptor = String(receptorEl?.value || "").trim();
      const observacionLibre = String(modal.querySelector(".salida-observacion")?.value || "").trim();

      if (!tipo || !destino || !motivo) {
        showToast("Completa tipo, destino y motivo de salida", "warning");
        return;
      }
      if ((destino === "ESPECIALISTA" || destino === "ASISTENTE") && !responsableReceptor) {
        showToast("Selecciona el nombre del especialista/asistente receptor", "warning");
        return;
      }

      const observacionesSalida = [
        `SALIDA: ${_prettyLabel(tipo)}`,
        `DESTINO: ${_prettyLabel(destino)}`,
        `MOTIVO: ${_prettyLabel(motivo)}`,
        responsableReceptor ? `RECEPTOR: ${responsableReceptor}` : "",
        observacionLibre
      ].filter(Boolean).join(" | ");

      const idEstadoDestino = tipo === "ENVIO_DEFINITIVO"
        ? _resolverIdEstadoDesdeCatalogo(["ENVIADO_A_ARCHIVO", "ARCHIVADO"], expediente.id_estado)
        : _resolverIdEstadoDesdeCatalogo(["DERIVADO", "PRESTADO", "ASIGNADO"], expediente.id_estado);

      const payload = {
        id_expediente: String(expediente.id_expediente || "").trim(),
        codigo_expediente_completo: String(expediente.codigo_expediente_completo || expediente.numero_expediente || "").trim(),
        id_estado: idEstadoDestino,
        id_estado_sistema: String(expediente.id_estado_sistema || "").trim(),
        id_usuario_responsable: String(expediente.id_usuario_responsable || "").trim(),
        ubicacion_texto: _prettyLabel(destino),
        observaciones: observacionesSalida,
        usuario_registra: usuarioRegistra
      };

      const result = await expedienteService.actualizarEnBackend(payload);
      if (!result.success) {
        showToast(result.message || "No se pudo registrar la salida", "error");
        return;
      }

      showToast("Salida de expediente registrada", "success");
      cerrar();
      await initListadoPage({ mountNode, forceRefresh: true });
    });
  }

  async function abrirModalRetornoExpediente(expediente) {
    const trabajador = JSON.parse(localStorage.getItem("trabajador_validado") || "null");
    const usuarioRegistra = trabajador
      ? `${trabajador.dni} - ${trabajador.nombres} ${trabajador.apellidos}`
      : "Sin identificar";

    const modal = crearModal(`
      <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-slate-900">Registrar retorno de expediente</h2>
          <button class="btn-cerrar text-slate-500 hover:text-slate-700 font-bold text-2xl">✕</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Motivo de retorno</label>
            <select class="retorno-motivo w-full border border-slate-300 rounded px-3 py-2 text-sm">
              <option value="">-- Seleccionar --</option>
              <option value="DEVOLUCION_PRESTAMO">Devolución de préstamo</option>
              <option value="CULMINO_REVISION">Culminó revisión</option>
              <option value="RETORNO_DESDE_AUDIENCIA">Retorno desde audiencia</option>
            </select>
          </div>
          <div>
            <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Condición de retorno</label>
            <select class="retorno-condicion w-full border border-slate-300 rounded px-3 py-2 text-sm">
              <option value="">-- Seleccionar --</option>
              <option value="CONFORME">Conforme</option>
              <option value="CON_OBSERVACION">Con observación</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Responsable de recepción</label>
            <input class="retorno-recepcion w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 text-slate-700" value="${usuarioRegistra}" readonly>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Observación del retorno</label>
            <textarea class="retorno-observacion w-full border border-slate-300 rounded px-3 py-2 text-sm" rows="3" placeholder="Detalle del retorno (obligatorio si selecciona Con observación)"></textarea>
          </div>
        </div>

        <div class="flex gap-2 justify-end pt-4 border-t border-slate-200">
          <button class="btn-cancelar px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">Cancelar</button>
          <button class="btn-registrar btn btn-primary">Registrar retorno</button>
        </div>
      </div>
    `);

    const cerrar = () => cerrarModalActivo();
    modal.querySelector(".btn-cerrar")?.addEventListener("click", cerrar);
    modal.querySelector(".btn-cancelar")?.addEventListener("click", cerrar);

    modal.querySelector(".btn-registrar")?.addEventListener("click", async () => {
      const motivo = String(modal.querySelector(".retorno-motivo")?.value || "").trim();
      const condicion = String(modal.querySelector(".retorno-condicion")?.value || "").trim();
      const observacion = String(modal.querySelector(".retorno-observacion")?.value || "").trim();

      if (!motivo || !condicion) {
        showToast("Completa motivo y condición del retorno", "warning");
        return;
      }
      if (condicion === "CON_OBSERVACION" && !observacion) {
        showToast("Detalla la observación del retorno", "warning");
        return;
      }

      const idEstadoRetorno = _resolverIdEstadoDesdeCatalogo(
        ["RETORNADO", "REGISTRADO", "EN_ARCHIVO_GENERAL"],
        expediente.id_estado
      );

      const observacionesRetorno = [
        `RETORNO: ${_prettyLabel(motivo)}`,
        `CONDICION: ${_prettyLabel(condicion)}`,
        observacion
      ].filter(Boolean).join(" | ");

      const payload = {
        id_expediente: String(expediente.id_expediente || "").trim(),
        codigo_expediente_completo: String(expediente.codigo_expediente_completo || expediente.numero_expediente || "").trim(),
        id_estado: idEstadoRetorno,
        ubicacion_texto: "ARCHIVO_MODULAR",
        observaciones: observacionesRetorno,
        usuario_registra: usuarioRegistra
      };

      const result = await expedienteService.actualizarEnBackend(payload);
      if (!result.success) {
        showToast(result.message || "No se pudo registrar el retorno", "error");
        return;
      }

      showToast("Retorno de expediente registrado", "success");
      cerrar();
      await initListadoPage({ mountNode, forceRefresh: true });
    });
  }

  /**
   * Configurar event listeners
   */
  function setupEventListeners() {
    const obtenerFiltrosUI = () => ({
      materia: document.getElementById("filtro-materia")?.value || "",
      juzgado: document.getElementById("filtro-juzgado")?.value || "",
      estado: document.getElementById("filtro-estado")?.value || "",
      texto: document.getElementById("filtro-texto")?.value || ""
    });

    const aplicarFiltros = ({ mostrarToast = true } = {}) => {
      filtrosActivos = obtenerFiltrosUI();
      const filtroTexto = (filtrosActivos.texto || "").toLowerCase();

      expedientesFiltrados = expedientes.filter(exp => {
        const cumpleMateria = !filtrosActivos.materia || exp.codigo_materia === filtrosActivos.materia;
        const cumpleJuzgado = !filtrosActivos.juzgado || exp.juzgado_texto === filtrosActivos.juzgado || exp.id_juzgado == filtrosActivos.juzgado;
        const cumpleEstado = !filtrosActivos.estado || exp.id_estado == filtrosActivos.estado;
        const cumpleTexto = !filtroTexto || JSON.stringify(exp).toLowerCase().includes(filtroTexto);

        return cumpleMateria && cumpleJuzgado && cumpleEstado && cumpleTexto;
      });

      const resultsText = expedientesFiltrados.length === 0
        ? "Sin resultados"
        : `${expedientesFiltrados.length} expediente${expedientesFiltrados.length !== 1 ? "s" : ""}`;

      paginaActual = 1;
      if (mostrarToast) showToast(`🔍 ${resultsText}`, "info");
      mountNode.innerHTML = renderHTML();
      setupEventListeners();
    };

    // Event listeners para botones de ver detalles
    document.querySelectorAll(".btn-ver-detalles").forEach(btn => {
      btn.addEventListener("click", () => {
        const numero = btn.getAttribute("data-numero");
        const expediente = expedientes.find(e => e.numero_expediente === numero);
        if (expediente) {
          abrirModalDetalles(expediente);
        } else {
          showToast("❌ Expediente no encontrado", "error");
        }
      });
    });

    document.querySelectorAll(".btn-movimiento-exp").forEach(btn => {
      btn.addEventListener("click", () => {
        const numero = btn.getAttribute("data-numero");
        const accion = String(btn.getAttribute("data-accion") || "salida").trim().toLowerCase();
        const expediente = expedientes.find(e => e.numero_expediente === numero);
        if (!expediente) {
          showToast("❌ Expediente no encontrado", "error");
          return;
        }
        if (accion === "retorno") {
          abrirModalRetornoExpediente(expediente);
          return;
        }
        abrirModalSalidaExpediente(expediente);
      });
    });

    // Boton recargar
    document.getElementById("btn-recargar")?.addEventListener("click", async () => {
      showToast("🔄 Recargando expedientes...", "info");
      paginaActual = 1;
      expedienteService.limpiarCacheBackend();
      resetCatalogosEdicion();
      await initListadoPage({ mountNode, forceRefresh: true });
    });

    // ⚡ LISTENERS DE PAGINACIÓN
    // Botones de número de página
    document.querySelectorAll(".btn-pagina").forEach(btn => {
      btn.addEventListener("click", () => {
        const nuevaPagina = parseInt(btn.getAttribute("data-pagina"), 10);
        paginaActual = nuevaPagina;
        mountNode.innerHTML = renderHTML();
        setupEventListeners();
        // Scroll al inicio de la tabla
        document.querySelector(".card-surface")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // Botón primera página
    document.querySelector(".btn-primera-pagina")?.addEventListener("click", () => {
      paginaActual = 1;
      mountNode.innerHTML = renderHTML();
      setupEventListeners();
      document.querySelector(".card-surface")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Botón página anterior
    document.querySelector(".btn-pagina-anterior")?.addEventListener("click", () => {
      if (paginaActual > 1) {
        paginaActual--;
        mountNode.innerHTML = renderHTML();
        setupEventListeners();
        document.querySelector(".card-surface")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    // Botón página siguiente
    document.querySelector(".btn-pagina-siguiente")?.addEventListener("click", () => {
      const totalPaginas = Math.ceil(expedientesFiltrados.length / itemsPorPagina);
      if (paginaActual < totalPaginas) {
        paginaActual++;
        mountNode.innerHTML = renderHTML();
        setupEventListeners();
        document.querySelector(".card-surface")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    // Botón última página
    document.querySelector(".btn-ultima-pagina")?.addEventListener("click", () => {
      const totalPaginas = Math.ceil(expedientesFiltrados.length / itemsPorPagina);
      paginaActual = totalPaginas;
      mountNode.innerHTML = renderHTML();
      setupEventListeners();
      document.querySelector(".card-surface")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Filtros
    document.getElementById("btn-filtrar")?.addEventListener("click", () => {
      aplicarFiltros({ mostrarToast: true });
    });

    ["filtro-materia", "filtro-juzgado", "filtro-estado"].forEach(id => {
      document.getElementById(id)?.addEventListener("change", () => {
        aplicarFiltros({ mostrarToast: false });
      });
    });

    document.getElementById("filtro-texto")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        aplicarFiltros({ mostrarToast: true });
      }
    });

    document.getElementById("btn-limpiar-filtros")?.addEventListener("click", () => {
      filtrosActivos = {
        materia: "",
        juzgado: "",
        estado: "",
        texto: ""
      };
      expedientesFiltrados = [...expedientes];
      paginaActual = 1;
      showToast("🧹 Filtros limpios", "info");
      mountNode.innerHTML = renderHTML();
      setupEventListeners();
    });
  }
  mountNode.innerHTML = renderHTML();
  setupEventListeners();
}  // ← CIERRE de renderListadoExpedientes

