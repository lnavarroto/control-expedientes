import { showToast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { estadoService } from "../../services/estadoService.js";
import { archivoGeneralService } from "./archivoGeneralService.js";
import { appConfig } from "../../config.js";
import { abrirModalCrearGrupo } from "./ModalCrearGrupo.js";
import { abrirModalVerDetalleGrupo } from "./ModalVerDetalleGrupo.js";
import { abrirModalRegistrarSalida } from "./ModalRegistrarSalida.js";
import { abrirModalRegistrarRetorno } from "./ModalRegistrarRetorno.js";
import { Loader } from "../../components/loader.js";
const HEADER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Zm0 0 8.5 5 8.5-5" /></svg>`;
const TAB_CACHE_TTL_MS = 120000;

const tabDataCache = {
  grupos: null,
  salidas: null,
  expedientesSinGrupo: null
};

// =====================
// CACHÉ DE CATÁLOGOS PARA SEGUIMIENTO
// =====================
const catalogosCache = {
  estadosSistema: {},
  usuarios: {}
};
const seguimientosCache = {};

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
  const idEstado = String(expediente.id_estado || expediente.est || "").trim();
  return estadoNombrePorId.get(idEstado) || idEstado || "-";
}

// =====================
// PRECARGA DE CATÁLOGOS PARA SEGUIMIENTO
// =====================
async function precargarCatalogosSeguimiento() {
  try {
    const [estadosResp, usuariosResp] = await Promise.all([
      fetch(`${appConfig.googleSheetURL}?action=listar_estados_sistema_activos`).then(r => r.json()),
      fetch(`${appConfig.googleSheetURL}?action=listar_usuarios`).then(r => r.json())
    ]);
    
    if (estadosResp.success) {
      estadosResp.data.forEach(e => {
        catalogosCache.estadosSistema[e.id_estado_sistema] = e.nombre_estado_sistema || e.id_estado_sistema;
      });
    }
    
    if (usuariosResp.success) {
      usuariosResp.data.forEach(u => {
        catalogosCache.usuarios[u.id_usuario] = [u.nombres, u.apellidos].filter(Boolean).join(" ") || u.nombre_completo || u.id_usuario;
      });
    }
    
    console.log("✅ Catálogos de seguimiento precargados");
  } catch (e) {
    console.warn("Error precargando catálogos de seguimiento:", e);
  }
}

async function precargarSeguimientos() {
  try {
    const resp = await fetch(`${appConfig.googleSheetURL}?action=listar_seguimientos`);
    const data = await resp.json();
    
    if (data.success && Array.isArray(data.data)) {
      data.data.forEach(seg => {
        const idExp = seg.id_expediente;
        const fechaSeg = seg.fecha_actualizacion || seg.fecha_registro || "";
        const fechaExistente = seguimientosCache[idExp]?.fecha_actualizacion || seguimientosCache[idExp]?.fecha_registro || "";
        
        if (!seguimientosCache[idExp] || fechaSeg > fechaExistente) {
          seguimientosCache[idExp] = seg;
        }
      });
      console.log(`✅ ${Object.keys(seguimientosCache).length} seguimientos precargados`);
    }
  } catch (e) {
    console.warn("Error precargando seguimientos:", e);
  }
}

// =====================
// CARGAR GRUPOS
// =====================
async function cargarGrupos(mountNode) {
  const tabGrupos = document.getElementById("tab-grupos");
  if (!tabGrupos) return;

  // 🎬 Mostrar loader como hijo (SIN destruir tabGrupos)
  tabGrupos.innerHTML = '';
  const loaderWrapper = document.createElement('div');
  loaderWrapper.id = 'loader-grupos';
  loaderWrapper.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:200px';
  tabGrupos.appendChild(loaderWrapper);
  
  Loader.show({
    variante: 'skeleton',
    overlay: false,
    contenedor: loaderWrapper
  });

  let grupos = getCachedTabData("grupos");
  if (!grupos) {
    const response = await archivoGeneralService.listarGrupos();
    if (!response.success) {
      showToast("Error cargando grupos", "error");
      Loader.hideAll();
      return;
    }
    grupos = response.data || [];
    setCachedTabData("grupos", grupos);
  }

  Loader.hideAll();

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
              const salidasActivas = (grupo.salidas || []).filter(s => 
                ["ACTIVA", "ENTREGADO", "EN_PROCESO"].includes(String(s.estado_salida || "").toUpperCase())
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

// =====================
// CARGAR SALIDAS
// =====================
async function cargarSalidas(mountNode) {
  const tabSalidas = document.getElementById("tab-salidas");
  if (!tabSalidas) return;

  // 🎬 Mostrar loader como hijo (SIN destruir tabSalidas)
  tabSalidas.innerHTML = '';
  const loaderWrapper = document.createElement('div');
  loaderWrapper.id = 'loader-salidas';
  loaderWrapper.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:200px';
  tabSalidas.appendChild(loaderWrapper);
  
  Loader.show({
    variante: 'skeleton',
    overlay: false,
    contenedor: loaderWrapper
  });

  let salidas = getCachedTabData("salidas");
  if (!salidas) {
    const response = await archivoGeneralService.listarSalidasGrupo();
    if (!response.success) {
      showToast("Error cargando salidas", "error");
      Loader.hideAll();
      return;
    }
    salidas = response.data || [];
    setCachedTabData("salidas", salidas);
  }

  Loader.hideAll();

  if (salidas.length === 0) {
    tabSalidas.innerHTML = `<div class="text-center py-8"><p class="text-slate-500">No hay salidas registradas</p></div>`;
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
              const estadoBadge = salida.estado_salida === 'ACTIVA' || salida.estado_salida === 'ENTREGADO' ? CARD_TONES.ACTIVA : CARD_TONES.RETORNADO;
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
// =====================
// EXPEDIENTES SIN GRUPO (PAGINADO - 25/50/100 por página)
// =====================
// =====================
// EXPEDIENTES SIN GRUPO
// =====================

async function cargarExpedientesSinGrupo(
  mountNode,
  paginaActual = 1,
  itemsPorPagina = 25,
  filtros = {}
) {
  const tabExpedientes = document.getElementById("tab-expedientes-sin-grupo");
  if (!tabExpedientes) return;

  const cacheActual = getCachedTabData("expedientesSinGrupo");
  const esPrimeraCarga =
    paginaActual === 1 &&
    Object.keys(filtros).length === 0 &&
    !cacheActual;

  let loaderId = null;

  if (esPrimeraCarga) {
    tabExpedientes.innerHTML = "";
    tabExpedientes.style.minHeight = "350px";

    loaderId = Loader.show({
      variante: "expediente",
      mensajes: [
        "Buscando expedientes...",
        "Cargando registros...",
        "Organizando datos...",
        "Casi listo..."
      ],
      overlay: false,
      contenedor: tabExpedientes
    });
  }

  const ocultarLoaderSeguro = () => {
    if (loaderId) {
      tabExpedientes.style.minHeight = "";
      requestAnimationFrame(() => {
        Loader.hide(loaderId).catch(() => {});
      });
    }
  };

  try {
    let expedientesSinGrupo = cacheActual;

    if (!expedientesSinGrupo) {
      const { expedienteService } = await import("../../services/expedienteService.js");

      const [todosResp, gruposResp] = await Promise.all([
        expedienteService.listarLigeroDelBackend(),
        archivoGeneralService.listarGrupos()
      ]);

      if (!todosResp.success) {
        ocultarLoaderSeguro();
        tabExpedientes.innerHTML = `
          <div class="text-center py-8">
            <p class="text-red-500 font-medium">Error cargando expedientes</p>
          </div>
        `;
        showToast("Error cargando expedientes", "error");
        return;
      }

      const grupos = gruposResp.success ? gruposResp.data || [] : [];

      const detalleRespuestas = await Promise.all(
        grupos.map((grupo) =>
          archivoGeneralService.listarDetalleGrupo(grupo.id_grupo)
        )
      );

      const expedientesConGrupo = new Set();

      detalleRespuestas.forEach((detalleResp) => {
        if (detalleResp.success) {
          (detalleResp.data || []).forEach((exp) => {
            expedientesConGrupo.add(String(exp.id_expediente));
          });
        }
      });

      expedientesSinGrupo = (todosResp.data || []).filter((exp) => {
        return !expedientesConGrupo.has(String(exp.id_expediente));
      });

      setCachedTabData("expedientesSinGrupo", expedientesSinGrupo);
    }

    const textoBusqueda = (filtros.texto || "").toLowerCase().trim();
    const filtroAnio = filtros.anio || "";
    const filtroMateria = filtros.materia || "";
    const filtroEspecialista = (filtros.especialista || "").toLowerCase().trim();
    const ordenFiltro = filtros.orden || "reciente";

    let datosFiltrados = [...expedientesSinGrupo];

    if (textoBusqueda) {
      datosFiltrados = datosFiltrados.filter((exp) => {
        const codigo = String(
          exp.numero_expediente ||
          exp.num ||
          exp.codigo_expediente_completo ||
          ""
        ).toLowerCase();

        return codigo.includes(textoBusqueda);
      });
    }

    if (filtroAnio) {
      datosFiltrados = datosFiltrados.filter((exp) => {
        return String(exp.anio || "") === String(filtroAnio);
      });
    }

    if (filtroMateria) {
      datosFiltrados = datosFiltrados.filter((exp) => {
        const materia = String(exp.codigo_materia || exp.mat || "").toUpperCase();
        return materia === filtroMateria.toUpperCase();
      });
    }

    if (filtroEspecialista) {
      datosFiltrados = datosFiltrados.filter((exp) => {
        const ultimoSeg = seguimientosCache[exp.id_expediente];
        const idUsuario = ultimoSeg?.id_usuario_responsable || "";
        const nombreEspecialista = String(
          catalogosCache.usuarios[idUsuario] || idUsuario || ""
        ).toLowerCase();

        return nombreEspecialista.includes(filtroEspecialista);
      });
    }

    switch (ordenFiltro) {
      case "antiguo":
        datosFiltrados.sort((a, b) =>
          String(a.fecha_ingreso || a.ing || "").localeCompare(
            String(b.fecha_ingreso || b.ing || "")
          )
        );
        break;

      case "expediente-asc":
        datosFiltrados.sort((a, b) => {
          const numA = a.numero_expediente || a.num || a.codigo_expediente_completo || "";
          const numB = b.numero_expediente || b.num || b.codigo_expediente_completo || "";
          return String(numA).localeCompare(String(numB));
        });
        break;

      case "expediente-desc":
        datosFiltrados.sort((a, b) => {
          const numA = a.numero_expediente || a.num || a.codigo_expediente_completo || "";
          const numB = b.numero_expediente || b.num || b.codigo_expediente_completo || "";
          return String(numB).localeCompare(String(numA));
        });
        break;

      case "anio-asc":
        datosFiltrados.sort((a, b) => Number(a.anio || 0) - Number(b.anio || 0));
        break;

      case "anio-desc":
        datosFiltrados.sort((a, b) => Number(b.anio || 0) - Number(a.anio || 0));
        break;

      case "reciente":
      default:
        datosFiltrados.sort((a, b) =>
          String(b.fecha_ingreso || b.ing || "").localeCompare(
            String(a.fecha_ingreso || a.ing || "")
          )
        );
        break;
    }

    const aniosUnicos = [
      ...new Set(expedientesSinGrupo.map((exp) => String(exp.anio || "")))
    ]
      .filter(Boolean)
      .sort((a, b) => Number(b) - Number(a));

    const materiasUnicas = [
      ...new Set(
        expedientesSinGrupo.map((exp) =>
          String(exp.codigo_materia || exp.mat || "").toUpperCase()
        )
      )
    ]
      .filter(Boolean)
      .sort();

    if (datosFiltrados.length === 0) {
      tabExpedientes.innerHTML = `
        <div class="space-y-3">
          ${renderFiltrosSG(
            aniosUnicos,
            materiasUnicas,
            filtros,
            expedientesSinGrupo.length,
            datosFiltrados.length
          )}

          <div class="text-center py-8 bg-white border border-slate-200 rounded-lg">
            <p class="text-slate-500">No se encontraron expedientes con los filtros seleccionados</p>
          </div>
        </div>
      `;

      ocultarLoaderSeguro();
      setupFiltrosSG(mountNode, filtros, itemsPorPagina);
      return;
    }

    const totalPaginas = Math.ceil(datosFiltrados.length / itemsPorPagina);
    const paginaValida = Math.min(Math.max(1, paginaActual), totalPaginas);
    const inicio = (paginaValida - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const paginaDatos = datosFiltrados.slice(inicio, fin);

    const generarBotonesPagina = () => {
      const botones = [];
      const ventana = 2;
      const inicioVentana = Math.max(1, paginaValida - ventana);
      const finVentana = Math.min(totalPaginas, paginaValida + ventana);

      if (inicioVentana > 1) {
        botones.push(`<button class="btn-pagina" data-pagina="1">«</button>`);
        if (inicioVentana > 2) {
          botones.push(`<span class="text-slate-400 px-1">...</span>`);
        }
      }

      for (let i = inicioVentana; i <= finVentana; i++) {
        const activo = i === paginaValida;
        botones.push(`
          <button 
            class="btn-pagina ${activo ? "activo" : ""}" 
            data-pagina="${i}" 
            ${activo ? "disabled" : ""}
          >
            ${i}
          </button>
        `);
      }

      if (finVentana < totalPaginas) {
        if (finVentana < totalPaginas - 1) {
          botones.push(`<span class="text-slate-400 px-1">...</span>`);
        }

        botones.push(`
          <button class="btn-pagina" data-pagina="${totalPaginas}">»</button>
        `);
      }

      return botones.join("");
    };

    tabExpedientes.innerHTML = `
      <div class="space-y-3">
        ${renderFiltrosSG(
          aniosUnicos,
          materiasUnicas,
          filtros,
          expedientesSinGrupo.length,
          datosFiltrados.length
        )}

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div class="text-sm text-slate-600">
            Mostrando 
            <span class="font-bold text-slate-800">${inicio + 1}-${Math.min(fin, datosFiltrados.length)}</span> 
            de 
            <span class="font-bold text-slate-800">${datosFiltrados.length}</span> expedientes
            ${
              datosFiltrados.length < expedientesSinGrupo.length
                ? `<span class="text-slate-400"> (filtrado de ${expedientesSinGrupo.length})</span>`
                : ""
            }
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500">Por página:</span>
            <select id="select-limite-sg" class="text-xs border border-slate-300 rounded px-2 py-1 bg-white">
              <option value="25" ${itemsPorPagina === 25 ? "selected" : ""}>25</option>
              <option value="50" ${itemsPorPagina === 50 ? "selected" : ""}>50</option>
              <option value="100" ${itemsPorPagina === 100 ? "selected" : ""}>100</option>
            </select>
          </div>
        </div>

        <div class="border border-slate-200 rounded-md overflow-hidden mb-3 bg-white">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-center px-3 py-3 font-medium text-slate-700 w-12">#</th>
                <th class="text-left px-3 py-3 font-medium text-slate-700">Expediente</th>
                <th class="text-left px-3 py-3 font-medium text-slate-700">Año</th>
                <th class="text-left px-3 py-3 font-medium text-slate-700">Juzgado</th>
                <th class="text-left px-3 py-3 font-medium text-slate-700">Materia</th>
                <th class="text-left px-3 py-3 font-medium text-slate-700">Estado</th>
                <th class="text-left px-3 py-3 font-medium text-slate-700">Estado Sistema</th>
                <th class="text-left px-3 py-3 font-medium text-slate-700">Especialista</th>
              </tr>
            </thead>

            <tbody>
              ${paginaDatos.map((exp, index) => {
                const numeroOrden = inicio + index + 1;
                const ultimoSeg = seguimientosCache[exp.id_expediente];
                const idSistema = ultimoSeg?.id_estado_sistema || "";
                const idUsuario = ultimoSeg?.id_usuario_responsable || "";

                const estadoSistemaNombre =
                  catalogosCache.estadosSistema[idSistema] || idSistema || "—";

                const especialistaNombre =
                  catalogosCache.usuarios[idUsuario] || idUsuario || "—";

                return `
                  <tr class="border-b border-slate-100 hover:bg-slate-50">
                    <td class="px-3 py-3 text-center text-slate-500 font-medium">
                      ${numeroOrden}
                    </td>

                    <td class="px-3 py-3 font-medium text-slate-900">
                      ${_escapeHtml(
                        exp.numero_expediente ||
                        exp.num ||
                        exp.codigo_expediente_completo ||
                        ""
                      )}
                    </td>

                    <td class="px-3 py-3 text-slate-700">
                      ${_escapeHtml(exp.anio || "-")}
                    </td>

                    <td class="px-3 py-3 text-slate-700">
                      ${_escapeHtml(exp.juzgado_texto || exp.juz || "")}
                    </td>

                    <td class="px-3 py-3 text-slate-700">
                      ${_escapeHtml(exp.codigo_materia || exp.mat || "")}
                    </td>

                    <td class="px-3 py-3 text-slate-700">
                      ${_escapeHtml(obtenerEstadoTextoArchivo(exp))}
                    </td>

                    <td class="px-3 py-3 text-slate-700">
                      ${_escapeHtml(estadoSistemaNombre)}
                    </td>

                    <td class="px-3 py-3 text-slate-700">
                      ${_escapeHtml(especialistaNombre)}
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>

        ${
          totalPaginas > 1
            ? `
              <div class="flex items-center justify-center gap-2 flex-wrap">
                <button 
                  class="btn-nav-paginacion" 
                  data-pagina="1" 
                  ${paginaValida === 1 ? "disabled" : ""}
                >
                  ⏮ Primera
                </button>

                <button 
                  class="btn-nav-paginacion" 
                  data-pagina="${paginaValida - 1}" 
                  ${paginaValida === 1 ? "disabled" : ""}
                >
                  ◀ Anterior
                </button>

                <div class="flex items-center gap-1 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  ${generarBotonesPagina()}
                </div>

                <button 
                  class="btn-nav-paginacion" 
                  data-pagina="${paginaValida + 1}" 
                  ${paginaValida === totalPaginas ? "disabled" : ""}
                >
                  Siguiente ▶
                </button>

                <button 
                  class="btn-nav-paginacion" 
                  data-pagina="${totalPaginas}" 
                  ${paginaValida === totalPaginas ? "disabled" : ""}
                >
                  Última ⏭
                </button>
              </div>
            `
            : ""
        }
      </div>
    `;

    ocultarLoaderSeguro();

    tabExpedientes.querySelectorAll(".btn-pagina, .btn-nav-paginacion").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pag = parseInt(btn.dataset.pagina, 10);

        if (!isNaN(pag)) {
          cargarExpedientesSinGrupo(
            mountNode,
            pag,
            itemsPorPagina,
            filtros
          );
        }
      });
    });

    const selectLimite = document.getElementById("select-limite-sg");

    if (selectLimite) {
      selectLimite.addEventListener("change", () => {
        const nuevoLimite = parseInt(selectLimite.value, 10);

        cargarExpedientesSinGrupo(
          mountNode,
          1,
          nuevoLimite,
          filtros
        );
      });
    }

    setupFiltrosSG(mountNode, filtros, itemsPorPagina);
  } catch (error) {
    console.error("Error en cargarExpedientesSinGrupo:", error);

    ocultarLoaderSeguro();

    tabExpedientes.innerHTML = `
      <div class="text-center py-8 bg-white border border-red-200 rounded-lg">
        <p class="text-red-600 font-semibold">Ocurrió un error cargando expedientes sin grupo</p>
        <p class="text-slate-500 text-sm mt-1">Revisa la consola para más detalles.</p>
      </div>
    `;

    showToast("Error cargando expedientes sin grupo", "error");
  }
}

// =====================
// RENDERIZAR FILTROS
// =====================

function renderFiltrosSG(
  aniosUnicos,
  materiasUnicas,
  filtros,
  totalSinFiltro,
  totalFiltrado
) {
  return `
    <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-slate-500">🔍</span>
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">
          Filtros
        </h4>
        <span class="text-xs text-slate-400 ml-auto">
          ${totalFiltrado} de ${totalSinFiltro} expedientes
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div class="relative">
          <input 
            type="text" 
            id="filtro-texto-sg" 
            class="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="Buscar expediente..." 
            value="${_escapeHtml(filtros.texto || "")}"
          >

          <span class="absolute left-2.5 top-2.5 text-slate-400">
            🔍
          </span>
        </div>

        <select 
          id="filtro-anio-sg" 
          class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Todos los años</option>
          ${aniosUnicos.map((a) => `
            <option value="${_escapeHtml(a)}" ${filtros.anio === a ? "selected" : ""}>
              ${_escapeHtml(a)}
            </option>
          `).join("")}
        </select>

        <select 
          id="filtro-materia-sg" 
          class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Todas las materias</option>
          ${materiasUnicas.map((m) => `
            <option value="${_escapeHtml(m)}" ${filtros.materia === m ? "selected" : ""}>
              ${_escapeHtml(m)}
            </option>
          `).join("")}
        </select>

        <input 
          type="text" 
          id="filtro-especialista-sg" 
          class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="Buscar especialista..." 
          value="${_escapeHtml(filtros.especialista || "")}"
        >

        <select 
          id="filtro-orden-sg" 
          class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="reciente" ${filtros.orden === "reciente" ? "selected" : ""}>
            Más recientes
          </option>

          <option value="antiguo" ${filtros.orden === "antiguo" ? "selected" : ""}>
            Más antiguos
          </option>

          <option value="expediente-asc" ${filtros.orden === "expediente-asc" ? "selected" : ""}>
            Exp. A→Z
          </option>

          <option value="expediente-desc" ${filtros.orden === "expediente-desc" ? "selected" : ""}>
            Exp. Z→A
          </option>

          <option value="anio-asc" ${filtros.orden === "anio-asc" ? "selected" : ""}>
            Año ↑
          </option>

          <option value="anio-desc" ${filtros.orden === "anio-desc" ? "selected" : ""}>
            Año ↓
          </option>
        </select>
      </div>

      <div class="flex gap-2 mt-3 justify-end">
        <button 
          id="btn-limpiar-filtros-sg" 
          class="btn btn-secondary text-xs px-3 py-1.5"
        >
          Limpiar filtros
        </button>

        <button 
          id="btn-buscar-filtros-sg" 
          class="btn btn-primary text-xs px-3 py-1.5"
        >
          🔍 Buscar
        </button>
      </div>
    </div>
  `;
}

// =====================
// SETUP FILTROS
// =====================

function setupFiltrosSG(mountNode, filtrosActuales, itemsPorPagina = 25) {
  const aplicarFiltros = () => {
    const nuevosFiltros = {
      texto: document.getElementById("filtro-texto-sg")?.value || "",
      anio: document.getElementById("filtro-anio-sg")?.value || "",
      materia: document.getElementById("filtro-materia-sg")?.value || "",
      especialista: document.getElementById("filtro-especialista-sg")?.value || "",
      orden: document.getElementById("filtro-orden-sg")?.value || "reciente"
    };

    cargarExpedientesSinGrupo(
      mountNode,
      1,
      itemsPorPagina,
      nuevosFiltros
    );
  };

  const textoEl = document.getElementById("filtro-texto-sg");

  if (textoEl) {
    textoEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        aplicarFiltros();
      }
    });
  }

  const especialistaEl = document.getElementById("filtro-especialista-sg");

  if (especialistaEl) {
    especialistaEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        aplicarFiltros();
      }
    });
  }

  ["filtro-anio-sg", "filtro-materia-sg", "filtro-orden-sg"].forEach((id) => {
    const el = document.getElementById(id);

    if (el) {
      el.addEventListener("change", aplicarFiltros);
    }
  });

  const btnBuscar = document.getElementById("btn-buscar-filtros-sg");

  if (btnBuscar) {
    btnBuscar.addEventListener("click", aplicarFiltros);
  }

  const btnLimpiar = document.getElementById("btn-limpiar-filtros-sg");

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      cargarExpedientesSinGrupo(
        mountNode,
        1,
        itemsPorPagina,
        {}
      );
    });
  }
}

// =====================
// INICIALIZAR PÁGINA
// =====================
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

       <div id="tab-grupos" class="tab-content"></div>
<div id="tab-salidas" class="tab-content hidden"></div>
<div id="tab-expedientes-sin-grupo" class="tab-content hidden"></div>
      </div>
    </section>
  `;

  await new Promise(resolve => requestAnimationFrame(resolve));

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
      if (tabElement) tabElement.classList.remove("hidden");

      if (tabId === "grupos") await cargarGrupos(mountNode);
      else if (tabId === "salidas") await cargarSalidas(mountNode);
      else if (tabId === "expedientes-sin-grupo") await cargarExpedientesSinGrupo(mountNode);
    });
  });

  // Cargar pestaña inicial
  await cargarGrupos(mountNode);

  // ⚡ Precargar catálogos de seguimiento en background
  setTimeout(() => {
    Promise.all([
      precargarCatalogosSeguimiento(),
      precargarSeguimientos()
    ]).catch(() => {});
  }, 500);

  // ⚡ Precargar en segundo plano las pestañas más pesadas
setTimeout(() => {
  cargarSalidas(mountNode).catch(() => {});
}, 1500);
}