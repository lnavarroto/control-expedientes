/**
 * Página de Listado de Expedientes - Backend Integration
 */

import { openModal } from "../../components/modal.js";
import { showToast } from "../../components/toast.js";
import { expedienteService } from "../../services/expedienteService.js";
import { estadoService } from "../../services/estadoService.js";
import { formatoFechaHora } from "../../utils/formatters.js";
import {
  obtenerNombreEstado,
  obtenerColorEstado,
  obtenerNombreMateria,
  obtenerNombreJuzgado,
  formatearExpediente
} from "./expedientesMapeo.js";

/**
 * Renderizar tabla de expedientes del backend con paginación
 */
function renderTablaExpedientes(expedientes, paginaActual = 1, itemsPorPagina = 10) {
  if (!expedientes || expedientes.length === 0) {
    return {
      html: `
        <div class="card-surface p-8 text-center">
          <p class="text-slate-500 font-medium mb-2">📭 No hay expedientes registrados</p>
          <p class="text-xs text-slate-400">Los expedientes aparecerán aquí cuando se registren nuevos</p>
        </div>
      `,
      totalPaginas: 0,
      paginaActual: 0
    };
  }

  // 🔄 ORDENAR DEL ÚLTIMO AL PRIMERO (descendente)
  const expedientesOrdenados = [...expedientes].sort((a, b) => {
    const fechaA = new Date(a.fecha_ingreso || 0);
    const fechaB = new Date(b.fecha_ingreso || 0);
    return fechaB - fechaA; // Descendente (más reciente primero)
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
    const numeroGlobal = inicio + indexEnPagina + 1;
    const estadoHtml = `
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold 
        bg-${formateado.estadoColor}-100 text-${formateado.estadoColor}-700">
        • ${formateado.estado}
      </span>
    `;

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
          <button class="btn btn-secondary text-xs btn-ver-detalles" data-numero="${formateado.numero}">👁️ Ver</button>
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
function renderPanelFiltradores(expedientes) {
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

  const optionList = (items, mapFn = i => i) => {
    return ["<option value=''>-- Todos --"]
      .concat(
        items.map(item => 
          `<option value="${item}">${mapFn(item)}</option>`
        )
      )
      .join("");
  };

  return `
    <div class="card-surface p-4 space-y-3 bg-gradient-to-br from-slate-50 to-slate-100">
      <h4 class="font-bold text-slate-700 mb-3">🔍 Filtros</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="text-xs font-bold text-slate-600 uppercase block mb-1">Materia</label>
          <select id="filtro-materia" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:border-blue-500">
            ${optionList(materias, m => obtenerNombreMateria(m))}
          </select>
        </div>
        
        <div>
          <label class="text-xs font-bold text-slate-600 uppercase block mb-1">Juzgado</label>
          <select id="filtro-juzgado" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:border-blue-500">
            ${optionList(juzgados)}
          </select>
        </div>
        
        <div>
          <label class="text-xs font-bold text-slate-600 uppercase block mb-1">Estado</label>
          <select id="filtro-estado" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:border-blue-500">
            ${optionList(estados, e => obtenerNombreEstado(e))}
          </select>
        </div>
      </div>

      <div>
        <label class="text-xs font-bold text-slate-600 uppercase block mb-1">Búsqueda General</label>
        <input id="filtro-texto" type="text" class="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:border-blue-500" 
          placeholder="Código, número o registrado por..." />
      </div>

      <div class="flex gap-2 justify-end">
        <button id="btn-filtrar" class="btn btn-primary text-xs">🔍 Filtrar</button>
        <button id="btn-limpiar-filtros" class="btn btn-secondary text-xs">✕ Limpiar</button>
      </div>
    </div>
  `;
}

/**
 * Inicializar página de listado
 */
export async function initListadoPage({ mountNode }) {
  // ✅ OPTIMIZACIÓN: Mostrar caché primero (si existe) para velocidad inmediata
  const cachedExp = expedienteService.listarDelBackendSync();
  
  if (cachedExp.length > 0) {
    console.log("⚡ Mostrando expedientes del caché (carga rápida)");
    renderListadoExpedientes(cachedExp, mountNode);
    
    // En background, actualizar con datos frescos
    expedienteService.listarDelBackend()
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
      <p class="text-slate-500 font-medium">📂 Cargando expedientes...</p>
      <div class="mt-4 inline-block">
        <div class="animate-spin inline-block w-6 h-6 border-4 border-slate-300 border-t-blue-500 rounded-full"></div>
      </div>
    </div>
  `;

  try {
    // Obtener expedientes del backend
    const resultado = await expedienteService.listarDelBackend();

    if (!resultado.success || !resultado.data) {
      mountNode.innerHTML = `
        <div class="card-surface p-8 text-center border-l-4 border-orange-400 bg-orange-50">
          <p class="text-orange-800 font-semibold">⚠️ Error al cargar expedientes</p>
          <p class="text-sm text-orange-700 mt-1">No se pudo conectar con el backend. Intenta recargar.</p>
          <button onclick="location.reload()" class="btn btn-primary mt-4">🔄 Recargar</button>
        </div>
      `;
      return;
    }

    renderListadoExpedientes(resultado.data, mountNode);
  } catch (error) {
    console.error("Error en listadoPage:", error);
    mountNode.innerHTML = `
      <div class="card-surface p-8 text-center border-l-4 border-red-400 bg-red-50">
        <p class="text-red-800 font-semibold">❌ Error</p>
        <p class="text-sm text-red-700 mt-1">${error.message}</p>
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

  const renderHTML = () => {
    const resultado = renderTablaExpedientes(expedientesFiltrados, paginaActual, itemsPorPagina);
    const totalPaginas = resultado.totalPaginas;
    
    return `
      <section>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-slate-900">📋 Expedientes Registrados</h2>
            <p class="text-sm text-slate-600 mt-1">Total: <span class="font-bold">${expedientesFiltrados.length}</span> de <span class="font-bold">${expedientes.length}</span></p>
          </div>
          <button id="btn-recargar" class="btn btn-secondary">🔄 Recargar</button>
        </div>

        ${renderPanelFiltradores(expedientes)}

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
  function abrirModalEditar(expediente) {
    const formateado = formatearExpediente(expediente);
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto";
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-slate-900">✏️ Editar Expediente</h2>
          <button class="btn-cerrar text-slate-500 hover:text-slate-700 font-bold text-2xl">✕</button>
        </div>
        <form class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Número Expediente</label>
              <input type="text" value="${formateado.numero}" disabled class="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-600" />
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
              <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Juzgado</label>\n              <input type="text" value="${formateado.juzgado}" disabled class="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-600" />
            </div>\n            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Ubicación</label>
              <input type="text" class="edit-ubicacion w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value="${formateado.ubicacion}" />
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Estado</label>
              <input type="text" class="edit-estado w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value="${formateado.estado}" />
            </div>
          </div>
          <div>
            <label class="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1">Observaciones</label>
            <textarea class="edit-observaciones w-full px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm" rows="4">${expediente.observaciones || ""}</textarea>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-blue-800">ℹ️ Solo puedes editar: <strong>Ubicación, Estado y Observaciones</strong></p>
          </div>
        </form>
        <div class="flex gap-2 justify-end pt-4 border-t border-slate-200">
          <button class="btn-cancelar px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">Cancelar</button>
          <button class="btn-guardar px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 font-medium">✅ Guardar Cambios</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector(".btn-cerrar").addEventListener("click", () => modal.remove());
    modal.querySelector(".btn-cancelar").addEventListener("click", () => modal.remove());
    
    modal.querySelector(".btn-guardar").addEventListener("click", () => {
      const ubicacion = modal.querySelector(".edit-ubicacion").value.trim();
      const estado = modal.querySelector(".edit-estado").value.trim();
      const observaciones = modal.querySelector(".edit-observaciones").value.trim();
      
      console.log("💾 Guardando expediente:", { numero: expediente.numero_expediente, ubicacion, estado, observaciones });
      showToast("✅ ¡Expediente actualizado correctamente!", "success");
      
      const index = expedientes.findIndex(e => e.numero_expediente === expediente.numero_expediente);
      if (index !== -1) {
        expedientes[index].ubicacion = ubicacion;
        expedientes[index].id_estado = estado;
        expedientes[index].observaciones = observaciones;
      }
      modal.remove();
    });
  }

  /**
   * Abrir modal con detalles del expediente
   */
  function abrirModalDetalles(expediente) {
    const formateado = formatearExpediente(expediente);
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto";
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-slate-900">📋 Detalles del Expediente</h2>
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
            <p class="text-base"><span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-${formateado.estadoColor}-100 text-${formateado.estadoColor}-700">• ${formateado.estado}</span></p>
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
          <button class="btn-cerrar px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">Cerrar</button>
          <button class="btn-editar px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 font-medium">✏️ Editar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".btn-cerrar").forEach = function() {}; // Fix for single button
    modal.querySelectorAll(".btn-cerrar").forEach(btn => {
      btn.addEventListener("click", () => modal.remove());
    });
    
    modal.querySelector(".btn-editar").addEventListener("click", () => {
      modal.remove();
      abrirModalEditar(expediente);
    });
  }

  /**
   * Configurar event listeners
   */
  function setupEventListeners() {
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

    // Boton recargar
    document.getElementById("btn-recargar")?.addEventListener("click", async () => {
      showToast("🔄 Recargando expedientes...", "info");
      paginaActual = 1;
      await initListadoPage({ mountNode });
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

    // Filtrar expedientes
    document.getElementById("btn-filtrar")?.addEventListener("click", () => {
      const filtroMateria = document.getElementById("filtro-materia")?.value || "";
      const filtroJuzgado = document.getElementById("filtro-juzgado")?.value || "";
      const filtroEstado = document.getElementById("filtro-estado")?.value || "";
      const filtroTexto = document.getElementById("filtro-texto")?.value.toLowerCase() || "";

      expedientesFiltrados = expedientes.filter(exp => {
        const cumpleMateria = !filtroMateria || exp.codigo_materia === filtroMateria;
        const cumpleJuzgado = !filtroJuzgado || exp.juzgado_texto === filtroJuzgado || exp.id_juzgado == filtroJuzgado;
        const cumpleEstado = !filtroEstado || exp.id_estado == filtroEstado;
        const cumpleTexto = !filtroTexto || JSON.stringify(exp).toLowerCase().includes(filtroTexto);

        return cumpleMateria && cumpleJuzgado && cumpleEstado && cumpleTexto;
      });

      const resultsText = expedientesFiltrados.length === 0 
        ? "Sin resultados" 
        : `${expedientesFiltrados.length} expediente${expedientesFiltrados.length !== 1 ? 's' : ''}`;
      
      paginaActual = 1; // Resetear a primera página al filtrar
      showToast(`🔍 ${resultsText}`, "info");
      mountNode.innerHTML = renderHTML();
      setupEventListeners();
    });

    // Limpiar filtros
    document.getElementById("btn-limpiar-filtros")?.addEventListener("click", () => {
      document.getElementById("filtro-materia").value = "";
      document.getElementById("filtro-juzgado").value = "";
      document.getElementById("filtro-estado").value = "";
      document.getElementById("filtro-texto").value = "";
      expedientesFiltrados = [...expedientes];
      paginaActual = 1; // Resetear a primera página
      showToast("🧹 Filtros limpios", "info");
      mountNode.innerHTML = renderHTML();
      setupEventListeners();
    });
  }

  mountNode.innerHTML = renderHTML();
  setupEventListeners();
}
