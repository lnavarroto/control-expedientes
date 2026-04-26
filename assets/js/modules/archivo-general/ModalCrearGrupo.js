import { openModal } from "../../components/modal.js";
import { showToast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { archivoGeneralService } from "./archivoGeneralService.js";

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

function _escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function abrirModalCrearGrupo(onSuccess) {
  const especialistasResp = await archivoGeneralService.listarEspecialistas();
  if (!especialistasResp.success) {
    showToast("Error cargando especialistas", "error");
    return;
  }

  const expedientesResp = await archivoGeneralService.listarExpedientes();
  const expedientes = expedientesResp.success ? expedientesResp.data : [];

  const especialistas = especialistasResp.data || [];

  let selectedExpedientes = [];
  let mostrarSelector = false;

  const content = `
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Especialista</label>
        <select id="select-especialista" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">-- Seleccionar --</option>
          ${especialistas.map(e => `<option value="${_escapeHtml(e.id_usuario || '')}">${_escapeHtml(e.nombres || '')} ${_escapeHtml(e.apellidos || '')}</option>`).join('')}
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Observación</label>
        <textarea id="textarea-observacion" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="Observación opcional..."></textarea>
      </div>

      <div class="border-t border-slate-200 pt-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="checkbox-asignar-expedientes" class="w-4 h-4 border-slate-300 rounded focus:ring-2 focus:ring-blue-500">
          <span class="text-sm font-medium text-slate-700">¿Asignar expedientes ahora?</span>
        </label>
      </div>

      <div id="expedientes-selector" class="hidden border-t border-slate-200 pt-4">
        <div class="mb-3">
          <input type="text" id="input-buscar-expedientes" class="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Buscar expediente...">
        </div>
        <div id="expedientes-list" class="max-h-64 overflow-y-auto border border-slate-200 rounded-md">
          ${expedientes.map(exp => `
            <label class="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100">
              <input type="checkbox" class="expediente-checkbox w-4 h-4 border-slate-300 rounded" value="${_escapeHtml(exp.id_expediente || '')}">
              <span class="text-sm text-slate-700">${_escapeHtml(exp.codigo_expediente_completo || '')} (${_escapeHtml(exp.anio || '')})</span>
            </label>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  openModal({
    title: "Crear Nuevo Grupo",
    content,
    confirmText: "Crear Grupo",
    cancelText: "Cancelar",
    panelClass: "",
    panelWidthClass: "max-w-2xl",
    onConfirm: async (close) => {
      const especialistaId = document.getElementById("select-especialista").value.trim();
      const observacion = document.getElementById("textarea-observacion").value.trim();

      if (!especialistaId) {
        showToast("Debes seleccionar un especialista", "warning");
        return;
      }

      const checkboxes = document.querySelectorAll(".expediente-checkbox:checked");
      selectedExpedientes = Array.from(checkboxes).map(cb => cb.value);

      const confirmBtn = event?.target;
      if (confirmBtn) confirmBtn.disabled = true;

      try {
        const payload = {
          id_usuario_especialista: especialistaId,
          observacion: observacion,
          ids_expedientes: selectedExpedientes.length > 0 ? selectedExpedientes : undefined
        };

        const response = await archivoGeneralService.crearGrupo(payload);

        if (response.success) {
          showToast(`Grupo creado: ${response.data?.codigo_grupo || 'GRP-XXX'}`, "success");
          close();
          if (typeof onSuccess === "function") onSuccess();
        } else {
          showToast(response.error || "Error al crear grupo", "error");
        }
      } catch (err) {
        showToast("Error inesperado", "error");
        console.error(err);
      } finally {
        if (confirmBtn) confirmBtn.disabled = false;
      }
    }
  });

  // Event listeners
  const checkboxAsignar = document.getElementById("checkbox-asignar-expedientes");
  const expedientesSelector = document.getElementById("expedientes-selector");
  const inputBuscar = document.getElementById("input-buscar-expedientes");

  if (checkboxAsignar) {
    checkboxAsignar.addEventListener("change", (e) => {
      expedientesSelector.classList.toggle("hidden", !e.target.checked);
    });
  }

  if (inputBuscar) {
    inputBuscar.addEventListener("input", (e) => {
      const texto = e.target.value.toLowerCase();
      document.querySelectorAll(".expediente-checkbox").forEach(cb => {
        const label = cb.closest("label");
        const visible = label.textContent.toLowerCase().includes(texto);
        label.style.display = visible ? "" : "none";
      });
    });
  }

  // Update selectedExpedientes cuando cambien los checkboxes
  document.querySelectorAll(".expediente-checkbox").forEach(cb => {
    cb.addEventListener("change", () => {
      selectedExpedientes = Array.from(document.querySelectorAll(".expediente-checkbox:checked")).map(c => c.value);
    });
  });
}
