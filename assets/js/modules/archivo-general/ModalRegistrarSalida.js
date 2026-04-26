import { openModal } from "../../components/modal.js";
import { showToast } from "../../components/toast.js";
import { archivoGeneralService } from "./archivoGeneralService.js";

function _escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

const SALIDA_RULES = {
  // Para PAQUETES (flujo simple)
  PARA_ARCHIVO: {
    destinos: ["ESPECIALISTA", "ASISTENTE"],
    motivos: ["ORDENAMIENTO", "ARCHIVO"],
    estados: ["PENDIENTE", "EN_PROCESO"]
  },
  // Para EXPEDIENTES (flujo complejo)
  PRESTAMO: {
    destinos: ["JUZGADO", "JUEZ", "ESPECIALISTA", "ASISTENTE", "AREA_USUARIA", "SALA_AUDIENCIA"],
    motivos: ["LECTURA_EXPEDIENTE", "CONSULTA", "REVISION_INTERNA", "AUDIENCIA", "APOYO_ORDENAMIENTO"],
    estados: ["PENDIENTE", "EN_PROCESO", "DEVUELTO"]
  },
  SALIDA_INTERNA: {
    destinos: ["JUZGADO", "JUEZ", "ESPECIALISTA", "ASISTENTE", "AREA_DIGITALIZACION", "SALA_AUDIENCIA"],
    motivos: ["REVISION_INTERNA", "DIGITALIZACION", "AUDIENCIA", "ORDENAMIENTO", "APOYO_ORDENAMIENTO"],
    estados: ["PENDIENTE", "EN_PROCESO", "DEVUELTO"]
  },
  SALIDA_EXTERNA: {
    destinos: ["OTRO_JUZGADO", "ENTIDAD_EXTERNA", "MESA_PARTES", "FISCALIA", "PROCURADURIA"],
    motivos: ["TRASLADO", "CONSULTA_EXTERNA", "REMISION_TEMPORAL", "REVISION_EXTERNA"],
    estados: ["PENDIENTE", "EN_PROCESO", "DEVUELTO"]
  },
  ENVIO_DEFINITIVO: {
    destinos: ["ARCHIVO_CENTRAL", "ARCHIVO_GENERAL", "OTRO_JUZGADO", "ENTIDAD_EXTERNA"],
    motivos: ["REMISION_FINAL", "CIERRE_EXPEDIENTE", "ARCHIVO_DEFINITIVO", "TRANSFERENCIA_DEFINITIVA"],
    estados: ["PENDIENTE", "ENVIADO_DEFINITIVO"]
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

export async function abrirModalRegistrarSalida(id_grupo, tipoObjeto = 'expediente', onSuccess) {
  // Permitir parámetros en cualquier orden para compatibilidad hacia atrás
  if (typeof tipoObjeto === 'function') {
    onSuccess = tipoObjeto;
    tipoObjeto = 'expediente';
  }

  const esPaquete = String(tipoObjeto).toLowerCase() === 'paquete';
  const usuarioActual = _getUsuario();
  const responsableEntregaDefault = _obtenerRealizadoPor(usuarioActual);
  let responsables = [];
  if (esPaquete) {
    try {
      const resp = await archivoGeneralService.listarResponsables();
      if (resp.success && Array.isArray(resp.data)) {
        responsables = resp.data;
      }
    } catch (error) {
      console.warn("No se pudo cargar responsables activos", error);
    }
  }
  const tituloModal = esPaquete ? "Registrar Salida de Paquete" : "Registrar Salida de Grupo";
  const textoDescripcion = esPaquete 
    ? "Complete los datos para registrar la salida del paquete hacia archivo. Los campos con * son obligatorios."
    : "Complete los datos para registrar la salida del grupo. Los campos con * son obligatorios.";

  let tiposHtml = '';
  if (esPaquete) {
    // Para paquete: solo opción PARA_ARCHIVO
    tiposHtml = `<option value="PARA_ARCHIVO">Para Archivo</option>`;
  } else {
    // Para expediente: 4 tipos
    tiposHtml = `
      <option value="">-- Seleccionar --</option>
      <option value="PRESTAMO">Préstamo</option>
      <option value="SALIDA_INTERNA">Salida Interna</option>
      <option value="SALIDA_EXTERNA">Salida Externa</option>
      <option value="ENVIO_DEFINITIVO">Envío Definitivo</option>
    `;
  }

  const content = `
    <div class="space-y-4">
      <div class="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        ${_escapeHtml(textoDescripcion)}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Tipo de Salida *</label>
          <select id="select-tipo-salida" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            ${tiposHtml}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Motivo de Salida *</label>
          <select id="select-motivo-salida" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- Seleccionar --</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Destino de Salida *</label>
        <select id="select-destino-salida" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" ${esPaquete ? '' : 'disabled'}>
          <option value="">${esPaquete ? '-- Seleccionar --' : 'Seleccione primero tipo de salida'}</option>
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Responsable de Entrega *</label>
          <input type="text" id="input-responsable-entrega" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-700" value="${_escapeHtml(responsableEntregaDefault)}" readonly>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Responsable de Recepción${esPaquete ? " *" : ""}</label>
          ${esPaquete
            ? `<select id="select-responsable-recepcion" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Seleccionar receptor --</option>
              </select>`
            : `<input type="text" id="input-responsable-recepcion" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nombre completo">`
          }
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Estado de Salida *</label>
        <select id="select-estado-salida" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-slate-50 text-slate-600" ${esPaquete ? '' : 'disabled'}>
          <option value="">${esPaquete ? '-- Seleccionar --' : 'Seleccione primero tipo de salida'}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Observación</label>
        <textarea id="textarea-observacion" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Observación adicional..."></textarea>
      </div>
    </div>
  `;

  openModal({
    title: tituloModal,
    content,
    confirmText: "Registrar Salida",
    cancelText: "Cancelar",
    panelClass: "",
    panelWidthClass: "max-w-3xl",
    onConfirm: async (close) => {
      const tipoSalida = document.getElementById("select-tipo-salida").value.trim();
      const destino = document.getElementById("select-destino-salida").value.trim();
      const responsableEntrega = String(document.getElementById("input-responsable-entrega")?.value || responsableEntregaDefault).trim();
      const responsableRecepcion = esPaquete
        ? String(document.getElementById("select-responsable-recepcion")?.value || "").trim()
        : String(document.getElementById("input-responsable-recepcion")?.value || "").trim();
      const motivo = document.getElementById("select-motivo-salida").value.trim();
      const estadoSalida = document.getElementById("select-estado-salida").value.trim();
      const observacion = document.getElementById("textarea-observacion").value.trim();

      if (!tipoSalida) {
        showToast("Debes seleccionar un tipo de salida", "warning");
        return;
      }
      if (!destino) {
        showToast("Destino es requerido", "warning");
        return;
      }
      if (!responsableEntrega) {
        showToast("Responsable de entrega es requerido", "warning");
        return;
      }
      if (!motivo) {
        showToast("Debes seleccionar un motivo de salida", "warning");
        return;
      }
      if (esPaquete && !responsableRecepcion) {
        showToast("Debes seleccionar el responsable de recepción", "warning");
        return;
      }
      if (!estadoSalida) {
        showToast("Debes seleccionar un estado de salida", "warning");
        return;
      }

      const confirmBtn = document.getElementById("modal-confirm");
      if (confirmBtn) confirmBtn.disabled = true;

      try {
        const usuario = _getUsuario();
        const realizadoPor = _obtenerRealizadoPor(usuario);

        const response = await archivoGeneralService.registrarSalida({
          id_grupo,
          tipo_salida: tipoSalida,
          destino_salida: destino,
          responsable_entrega: responsableEntrega,
          responsable_recepcion: responsableRecepcion,
          motivo_salida: motivo,
          estado_salida: estadoSalida,
          observacion: observacion,
          realizado_por: realizadoPor
        });

        if (response.success) {
          showToast(`Salida registrada: ${response.data?.rotulo_salida || 'SAL-XXX'}`, "success");
          close();
          if (typeof onSuccess === "function") onSuccess();
        } else {
          showToast(response.error || "Error al registrar", "error");
        }
      } catch (err) {
        showToast("Error inesperado", "error");
        console.error(err);
      } finally {
        if (confirmBtn) confirmBtn.disabled = false;
      }
    }
  });

  // Auto-seleccionar PARA_ARCHIVO si es paquete
  const selectTipoSalida = document.getElementById("select-tipo-salida");
  if (esPaquete && selectTipoSalida) {
    selectTipoSalida.value = "PARA_ARCHIVO";
    selectTipoSalida.disabled = true;
  }

  // Listeners dinámicos
  const selectMotivoSalida = document.getElementById("select-motivo-salida");
  const selectDestinoSalida = document.getElementById("select-destino-salida");
  const selectEstadoSalida = document.getElementById("select-estado-salida");
  const selectResponsableRecepcion = document.getElementById("select-responsable-recepcion");

  const llenarOpciones = (selectEl, opciones, placeholder) => {
    if (!selectEl) return;
    selectEl.innerHTML = `<option value="">${_escapeHtml(placeholder)}</option>` + opciones
      .map((valor) => `<option value="${_escapeHtml(valor)}">${_escapeHtml(_prettyLabel(valor))}</option>`)
      .join("");
    selectEl.disabled = opciones.length === 0;
  };

  if (selectTipoSalida && selectDestinoSalida && selectMotivoSalida && selectEstadoSalida) {
    const poblarResponsablesPaquete = () => {
      if (!esPaquete || !selectResponsableRecepcion) return;
      const tipoDestino = String(selectDestinoSalida.value || "").trim().toUpperCase();

      const filtrados = (responsables || []).filter((item) => {
        const idRol = String(item.id_rol || "").trim().toUpperCase();
        const cargo = String(item.cargo || "").trim().toUpperCase();
        if (tipoDestino === "ESPECIALISTA") {
          return idRol === "ROL0005" || cargo.includes("ESPECIALISTA");
        }
        if (tipoDestino === "ASISTENTE") {
          return idRol === "ROL0006" || cargo.includes("ASISTENTE");
        }
        return true;
      });

      const options = filtrados.map((item) => {
        const nombre = String(item.nombre_completo || [item.nombres, item.apellidos].filter(Boolean).join(" ") || "").trim();
        const cargo = String(item.cargo || "").trim();
        const valor = [String(item.id_usuario || "").trim(), nombre].filter(Boolean).join(" - ");
        const label = cargo ? `${nombre} (${cargo})` : nombre;
        return `<option value="${_escapeHtml(valor)}">${_escapeHtml(label)}</option>`;
      }).join("");

      selectResponsableRecepcion.innerHTML = `<option value="">-- Seleccionar receptor --</option>${options}`;
      selectResponsableRecepcion.disabled = filtrados.length === 0;
    };

    // Función para actualizar selects dependientes
    const actualizarOpciones = () => {
      const tipo = String(selectTipoSalida.value || "").trim();
      const reglas = SALIDA_RULES[tipo];

      if (!reglas) {
        llenarOpciones(selectDestinoSalida, [], "Seleccione primero tipo de salida");
        llenarOpciones(selectMotivoSalida, [], "Seleccione primero tipo de salida");
        llenarOpciones(selectEstadoSalida, [], "Seleccione primero tipo de salida");
        if (selectResponsableRecepcion) {
          selectResponsableRecepcion.innerHTML = `<option value="">-- Seleccionar receptor --</option>`;
          selectResponsableRecepcion.disabled = true;
        }
        return;
      }

      llenarOpciones(selectDestinoSalida, reglas.destinos, "-- Seleccionar destino --");
      llenarOpciones(selectMotivoSalida, reglas.motivos, "-- Seleccionar motivo --");
      llenarOpciones(selectEstadoSalida, reglas.estados, "-- Seleccionar estado --");

      if (tipo === "ENVIO_DEFINITIVO") {
        selectEstadoSalida.value = "ENVIADO_DEFINITIVO";
      } else {
        selectEstadoSalida.value = "PENDIENTE";
      }

      poblarResponsablesPaquete();
    };

    // Para paquete: llenar opciones inmediatamente
    if (esPaquete) {
      actualizarOpciones();
      selectDestinoSalida?.addEventListener("change", poblarResponsablesPaquete);
    } else {
      // Para expediente: escuchar cambios en tipo de salida
      selectTipoSalida.addEventListener("change", actualizarOpciones);
    }
  }
}
