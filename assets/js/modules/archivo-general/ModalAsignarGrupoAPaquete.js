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

export async function abrirModalAsignarGrupoAPaquete(id_grupo, codigoGrupo, onSuccess) {
  // Obtener lista de paquetes archivo activos
  const paquetesResp = await archivoGeneralService.listarPaquetesArchivo();
  
  if (!paquetesResp.success) {
    showToast("Error al cargar paquetes archivo", "error");
    return;
  }

  const paquetes = (paquetesResp.data || []).filter(p => p.activo || String(p.activo).toLowerCase() === "sí" || p.activo === true);

  if (paquetes.length === 0) {
    showToast("No hay paquetes archivo disponibles", "warning");
    return;
  }

  let idPaqueteSeleccionado = "";

  const content = `
    <div class="space-y-4">
      <div class="bg-blue-50 p-3 rounded-md border border-blue-200">
        <p class="text-sm text-blue-700">
          <strong>Grupo:</strong> ${_escapeHtml(codigoGrupo)} se asignará a un paquete archivo.
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Seleccionar Paquete Archivo *</label>
        <select id="select-paquete-archivo" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">-- Seleccionar paquete --</option>
          ${paquetes.map(paq => `
            <option value="${_escapeHtml(paq.id_paquete_archivo || '')}">
              ${_escapeHtml(paq.codigo_paquete || paq.nombre_paquete || 'Sin nombre')}
              ${paq.descripcion ? ` - ${_escapeHtml(paq.descripcion)}` : ''}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="bg-amber-50 p-3 rounded-md border border-amber-200">
        <p class="text-xs text-amber-700">
          ℹ️ Se asignarán todos los expedientes del grupo a este paquete archivo.
        </p>
      </div>
    </div>
  `;

  openModal({
    title: "Asignar Grupo a Paquete Archivo",
    content,
    confirmText: "Asignar",
    cancelText: "Cancelar",
    panelClass: "",
    panelWidthClass: "max-w-lg",
    onConfirm: async (close) => {
      const selectPaq = document.getElementById("select-paquete-archivo");
      idPaqueteSeleccionado = selectPaq?.value?.trim() || "";

      if (!idPaqueteSeleccionado) {
        showToast("Debes seleccionar un paquete archivo", "warning");
        return;
      }

      const confirmBtn = document.querySelector("#modal-root .modal-btn-confirm");
      if (confirmBtn) confirmBtn.disabled = true;

      try {
        const usuario = _getUsuario();
        const asignadoPor = _obtenerRealizadoPor(usuario);

        const response = await archivoGeneralService.asignarGrupoAPaqueteArchivo({
          id_grupo,
          id_paquete_archivo: idPaqueteSeleccionado,
          asignado_por: asignadoPor
        });

        if (response.success) {
          showToast(`Grupo asignado al paquete archivo exitosamente`, "success");
          close();
          if (typeof onSuccess === "function") onSuccess();
        } else {
          showToast(response.error || "Error al asignar grupo", "error");
        }
      } catch (err) {
        showToast("Error inesperado", "error");
        console.error(err);
      } finally {
        if (confirmBtn) confirmBtn.disabled = false;
      }
    }
  });
}
