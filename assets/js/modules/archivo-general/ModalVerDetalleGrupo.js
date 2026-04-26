import { openModal } from "../../components/modal.js";
import { showToast } from "../../components/toast.js";
import { renderTable } from "../../components/table.js";
import { archivoGeneralService } from "./archivoGeneralService.js";
import { abrirModalAsignarExpedientes } from "./ModalAsignarExpedientes.js";
import { abrirModalAsignarGrupoAPaquete } from "./ModalAsignarGrupoAPaquete.js";
import { estadoService } from "../../services/estadoService.js";
import { materiaService } from "../../services/materiaService.js";

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

function _formatFechaIngreso(expediente) {
  const raw = expediente?.fecha_ingreso || expediente?.fecha_hora_ingreso || expediente?.fecha_registro || "";
  if (!raw) return "-";
  const fecha = new Date(raw);
  if (Number.isNaN(fecha.getTime())) return _escapeHtml(raw);
  return fecha.toLocaleDateString("es-PE");
}

function _getUsuario() {
  try {
    const stored = localStorage.getItem("trabajador_validado");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function _obtenerRealizadoPor(usuario) {
  if (!usuario) return "SISTEMA";
  const nombre = [usuario.nombres, usuario.apellidos].filter(Boolean).join(" ").trim();
  return [usuario.id_usuario, nombre].filter(Boolean).join(" - ") || "SISTEMA";
}

export async function abrirModalVerDetalleGrupo(id_grupo, onSuccess) {
  const estadosCatalogo = estadoService.listarSync();
  const materiasCatalogo = materiaService.listarSync();
  const estadoNombrePorId = new Map(
    (estadosCatalogo || []).map((estado) => [String(estado.id || "").trim(), String(estado.nombre || "").trim()])
  );
  const materiaNombrePorId = new Map(
    (materiasCatalogo || []).map((materia) => [String(materia.id || "").trim(), String(materia.nombre || "").trim()])
  );

  const obtenerEstadoTexto = (expediente) => {
    const estadoDirecto = String(expediente.estado_texto || expediente.estado_sistema || expediente.estado || "").trim();
    if (estadoDirecto && Number.isNaN(Number(estadoDirecto))) return estadoDirecto;
    const idEstado = String(expediente.id_estado || expediente.id_estado_sistema || "").trim();
    return estadoNombrePorId.get(idEstado) || estadoDirecto || idEstado || "-";
  };

  const obtenerMateriaTexto = (expediente) => {
    const materiaDirecta = String(expediente.materia_texto || expediente.materia || "").trim();
    if (materiaDirecta) return materiaDirecta;
    const idMateria = String(expediente.id_materia || "").trim();
    return materiaNombrePorId.get(idMateria) || idMateria || "-";
  };

  const response = await archivoGeneralService.obtenerGrupoConDetalle(id_grupo);
  if (!response.success) {
    showToast("Error cargando detalle del grupo", "error");
    return;
  }

  const grupo = response.data || {};
  const expedientes = grupo.expedientes || [];
  
  // Asegurar que salidas siempre es un array
  let salidas = grupo.salidas || [];
  if (!Array.isArray(salidas)) salidas = [];
  
  // Si no hay salidas en grupo, intentar obtenerlas directamente
  if (salidas.length === 0) {
    const salidasResp = await archivoGeneralService.listarSalidasGrupo(id_grupo);
    if (salidasResp.success && Array.isArray(salidasResp.data)) {
      salidas = salidasResp.data;
    }
  }

  const estadoBadge = CARD_TONES[grupo.estado_grupo] || CARD_TONES.ACTIVO;

  // Paginación: mostrar solo primeros 100 expedientes
  const ITEMS_POR_BATCH = 100;
  let indexRenderizado = 0;

   const renderExpedientesBatch = (items) => {
     return items.map(detalle => {
       const exp = detalle.expediente || detalle; // Los datos vienen anidados en .expediente
       const numeroExpediente = String(exp.numero_expediente || exp.codigo_expediente_completo || detalle.id_expediente || "-").trim();
       const materiaTexto = obtenerMateriaTexto(exp);
       const juzgadoTexto = String(exp.juzgado_texto || exp.juzgado || "-").trim() || "-";
       const estadoTexto = obtenerEstadoTexto(exp);
       return `
         <tr class="border-b border-slate-100 hover:bg-slate-50" data-exp-id="${_escapeHtml(detalle.id_expediente || '')}">
           <td class="px-3 py-2 text-slate-900">${_escapeHtml(numeroExpediente)}</td>
           <td class="px-3 py-2 text-slate-600">${_escapeHtml(materiaTexto)}</td>
           <td class="px-3 py-2 text-slate-600">${_escapeHtml(juzgadoTexto)}</td>
           <td class="px-3 py-2 text-slate-600">${_formatFechaIngreso(exp)}</td>
           <td class="px-3 py-2 text-slate-600">${_escapeHtml(estadoTexto)}</td>
           <td class="px-3 py-2 text-center">
             <button class="btn-quitar-expediente px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 cursor-pointer" data-exp-id="${_escapeHtml(detalle.id_expediente || '')}">
               Quitar
             </button>
           </td>
         </tr>
       `;
     }).join('');
   };

  const agregarEventListenersExpedientes = () => {
    document.querySelectorAll(".btn-quitar-expediente").forEach(btn => {
      if (btn.dataset.bound) return; // Ya tiene listener
      btn.dataset.bound = "true";
      btn.addEventListener("click", async (e) => {
        const id_exp = btn.dataset.expId;
        const usuario = _getUsuario();
        const desasignadoPor = _obtenerRealizadoPor(usuario);

        if (!confirm("¿Está seguro de quitar este expediente?")) return;

        btn.disabled = true;
        try {
          const resp = await archivoGeneralService.desasignarExpediente({
            id_grupo,
            id_expediente: id_exp,
            desasignado_por: desasignadoPor
          });

          if (resp.success) {
            showToast("Expediente removido", "success");
            if (typeof onSuccess === "function") onSuccess();
          } else {
            showToast(resp.error || "Error al remover", "error");
          }
        } catch (err) {
          showToast("Error inesperado", "error");
          console.error(err);
        } finally {
          btn.disabled = false;
        }
      });
    });
  };

  let content = `
    <div class="space-y-4">
      <div class="bg-slate-50 p-3 rounded-md border border-slate-200">
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><span class="font-medium text-slate-600">Código:</span> ${_escapeHtml(grupo.codigo_grupo || '')}</div>
          <div><span class="font-medium text-slate-600">Especialista:</span> ${_escapeHtml(grupo.nombre_especialista || '')}</div>
          <div><span class="font-medium text-slate-600">Total Expedientes:</span> ${grupo.total_expedientes || 0}</div>
          <div class="flex items-center gap-2">
            <span class="font-medium text-slate-600">Estado:</span>
            <span class="px-2 py-1 rounded text-xs font-semibold border ${estadoBadge}">
              ${_escapeHtml(grupo.estado_grupo || 'DESCONOCIDO')}
            </span>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-slate-200">
          <button id="btn-asignar-paquete" class="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 cursor-pointer">
            📦 Asignar a Paquete Archivo
          </button>
        </div>
      </div>

      <div class="border-t border-slate-200 pt-4">
        <div id="tabs-container" class="flex gap-2 border-b border-slate-200 mb-4">
          <button class="tab-btn px-4 py-2 text-sm font-medium text-slate-700 border-b-2 border-transparent hover:text-slate-900 cursor-pointer active" data-tab="expedientes">
            Expedientes (${expedientes.length})
          </button>
          <button class="tab-btn px-4 py-2 text-sm font-medium text-slate-700 border-b-2 border-transparent hover:text-slate-900 cursor-pointer" data-tab="salidas">
            Salidas (${salidas.length})
          </button>
        </div>

        <div id="tab-expedientes" class="tab-content">
          <div class="space-y-2">
            ${expedientes.length > 0 ? `
              <div class="border border-slate-200 rounded-md overflow-hidden flex flex-col">
                <div class="overflow-y-auto" style="max-height: 400px;">
                  <table class="w-full text-sm">
                    <thead class="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th class="text-left px-3 py-2 font-medium text-slate-700">Nro. Expediente</th>
                        <th class="text-left px-3 py-2 font-medium text-slate-700">Materia</th>
                        <th class="text-left px-3 py-2 font-medium text-slate-700">Juzgado</th>
                        <th class="text-left px-3 py-2 font-medium text-slate-700">Fecha Ingreso</th>
                        <th class="text-left px-3 py-2 font-medium text-slate-700">Estado</th>
                        <th class="text-center px-3 py-2 font-medium text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="expedientes-tbody">
                      <!-- Se llena dinámicamente -->
                    </tbody>
                  </table>
                </div>
              </div>
              <button id="btn-agregar-expedientes" class="btn btn-primary w-full">+ Agregar Expedientes</button>
            ` : `
              <p class="text-sm text-slate-500 italic">No hay expedientes asignados</p>
              <button id="btn-agregar-expedientes" class="btn btn-primary w-full">+ Agregar Expedientes</button>
            `}
          </div>
        </div>

        <div id="tab-salidas" class="tab-content hidden">
          <div class="space-y-2">
            ${salidas.length > 0 ? `
              <div class="border border-slate-200 rounded-md overflow-hidden">
                <table class="w-full text-sm">
                  <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th class="text-left px-3 py-2 font-medium text-slate-700">Rótulo</th>
                      <th class="text-left px-3 py-2 font-medium text-slate-700">Tipo</th>
                      <th class="text-left px-3 py-2 font-medium text-slate-700">Destino</th>
                      <th class="text-left px-3 py-2 font-medium text-slate-700">Salida</th>
                      <th class="text-left px-3 py-2 font-medium text-slate-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${salidas.map(sal => {
                      const estadoSalida = String(sal.estado_salida || '').toUpperCase();
                      const estadoSalidaBadge = ["ACTIVA", "PENDIENTE", "EN_PROCESO"].includes(estadoSalida)
                        ? CARD_TONES.ACTIVA
                        : estadoSalida === "ENVIADO_DEFINITIVO"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : CARD_TONES.RETORNADO;
                      return `
                        <tr class="border-b border-slate-100 hover:bg-slate-50">
                          <td class="px-3 py-2 text-slate-900">${_escapeHtml(sal.rotulo_salida || '')}</td>
                          <td class="px-3 py-2 text-slate-600">${_escapeHtml(sal.tipo_salida || '')}</td>
                          <td class="px-3 py-2 text-slate-600">${_escapeHtml(sal.destino_salida || '')}</td>
                          <td class="px-3 py-2 text-slate-600">${sal.fecha_hora_salida ? new Date(sal.fecha_hora_salida).toLocaleDateString('es-PE') : '-'}</td>
                          <td class="px-3 py-2">
                            <span class="px-2 py-1 rounded text-xs font-semibold border ${estadoSalidaBadge}">
                              ${_escapeHtml(sal.estado_salida || '')}
                            </span>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <p class="text-sm text-slate-500 italic">No hay salidas registradas</p>
            `}
          </div>
        </div>
      </div>
    </div>
  `;

  openModal({
    title: `Detalle Grupo: ${_escapeHtml(grupo.codigo_grupo || '')}`,
    content,
    confirmText: "Cerrar",
    cancelText: "",
    panelClass: "",
    panelWidthClass: "max-w-4xl",
    onConfirm: (close) => close()
  });

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active", "border-blue-500", "text-blue-600"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
      
      btn.classList.add("active", "border-blue-500", "text-blue-600");
      const tabId = btn.dataset.tab;
      document.getElementById(`tab-${tabId}`).classList.remove("hidden");
    });
  });

  // Agregar expedientes
  const btnAgregar = document.getElementById("btn-agregar-expedientes");
  if (btnAgregar) {
    btnAgregar.addEventListener("click", () => {
      const modalRoot = document.getElementById("modal-root");
      if (modalRoot) {
        modalRoot.innerHTML = "";
      }
      document.body.classList.remove("modal-open");
      abrirModalAsignarExpedientes(id_grupo, onSuccess);
    });
  }

  // Asignar grupo a paquete archivo
  const btnAsignarPaquete = document.getElementById("btn-asignar-paquete");
  if (btnAsignarPaquete) {
    btnAsignarPaquete.addEventListener("click", () => {
      const modalRoot = document.getElementById("modal-root");
      if (modalRoot) {
        modalRoot.innerHTML = "";
      }
      document.body.classList.remove("modal-open");
      abrirModalAsignarGrupoAPaquete(id_grupo, grupo.codigo_grupo || '', onSuccess);
    });
  }

   // Paginación: Renderizar primeros 100 expedientes
   const tbody = document.getElementById("expedientes-tbody");
   if (tbody && expedientes.length > 0) {
     const primeraBatch = expedientes.slice(0, ITEMS_POR_BATCH);
     const html = renderExpedientesBatch(primeraBatch);
     tbody.innerHTML = html;
     indexRenderizado = ITEMS_POR_BATCH;
     agregarEventListenersExpedientes();

     // Configurar lazy loading con IntersectionObserver si hay más expedientes
     if (expedientes.length > ITEMS_POR_BATCH) {
       const lastRow = tbody.querySelector("tr:last-child");
       if (lastRow) {
         const observer = new IntersectionObserver((entries) => {
           if (entries[0].isIntersecting && indexRenderizado < expedientes.length) {
             const siguienteBatch = expedientes.slice(indexRenderizado, indexRenderizado + ITEMS_POR_BATCH);
             tbody.insertAdjacentHTML("beforeend", renderExpedientesBatch(siguienteBatch));
             indexRenderizado += ITEMS_POR_BATCH;
             agregarEventListenersExpedientes();
             
             // Reobservar el último elemento
             const newLastRow = tbody.querySelector("tr:last-child");
             if (newLastRow && indexRenderizado < expedientes.length) {
               observer.observe(newLastRow);
             }
           }
         });
         observer.observe(lastRow);
       }
     }
   }
}

