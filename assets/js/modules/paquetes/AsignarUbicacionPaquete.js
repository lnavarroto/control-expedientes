import { openModal } from "../../components/modal.js";
import { showToast } from "../../components/toast.js";
import {
  listarUbicacionesActivas,
  listarPisosPorUbicacion,
  asignarUbicacionPaquete
} from "../../services/paqueteService.js";
import { expedienteService } from "../../services/expedienteService.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getUsuarioLogueado() {
  try {
    const raw = localStorage.getItem("trabajador_validado");
    if (!raw) return "SISTEMA";
    const user = JSON.parse(raw);
    const nombre = [user.nombres, user.apellidos].filter(Boolean).join(" ").trim();
    return [String(user.dni || "").trim(), nombre].filter(Boolean).join(" - ") || "SISTEMA";
  } catch {
    return "SISTEMA";
  }
}

function obtenerArrayRespuesta(resultado, claves = []) {
  if (Array.isArray(resultado)) return resultado;
  if (!resultado || typeof resultado !== "object") return [];
  for (const clave of claves) {
    if (Array.isArray(resultado[clave])) return resultado[clave];
  }
  return [];
}

export async function abrirModalAsignarUbicacionPaquete({ paquete, onSuccess }) {
  const idPaquete = String(paquete?.id_paquete_archivo || "").trim();
  if (!idPaquete) {
    showToast("No se encontro el paquete seleccionado", "warning");
    return;
  }

  openModal({
    title: "Asignar ubicacion del paquete",
    content: `
      <div class="space-y-4">
        <div class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <p><span class="font-semibold">Paquete:</span> ${escapeHtml(paquete.rotulo_paquete || idPaquete)}</p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Estante *</label>
            <select id="asig-ubi-estante" class="select-base w-full">
              <option value="">Cargando estantes...</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Piso (opcional)</label>
            <select id="asig-ubi-piso" class="select-base w-full" disabled>
              <option value="">Selecciona un estante</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Observacion</label>
          <textarea id="asig-ubi-observacion" class="input-base w-full min-h-24" placeholder="Detalle opcional"></textarea>
        </div>
      </div>
    `,
    confirmText: "Asignar ubicacion",
    cancelText: "Cancelar",
    onConfirm: async (close) => {
      const estanteSelect = document.getElementById("asig-ubi-estante");
      const pisoSelect = document.getElementById("asig-ubi-piso");
      const observacionEl = document.getElementById("asig-ubi-observacion");

      const idUbicacion = String(estanteSelect?.value || "").trim();
      const idPiso = String(pisoSelect?.value || "").trim();
      const observacion = String(observacionEl?.value || "").trim();

      if (!idUbicacion) {
        showToast("El estante es obligatorio", "warning");
        return;
      }

      const payload = {
        id_paquete_archivo: idPaquete,
        id_ubicacion: idUbicacion,
        id_piso: idPiso,
        realizado_por: getUsuarioLogueado(),
        observacion
      };

      const response = await asignarUbicacionPaquete(payload);
      if (!response?.success) {
        showToast(response?.error || response?.message || "No se pudo asignar la ubicacion", "error");
        return;
      }

      expedienteService.limpiarCacheBackend();
      window.dispatchEvent(new CustomEvent("expedientes:updated", {
        detail: { source: "asignar_ubicacion_paquete", id_paquete_archivo: idPaquete }
      }));

      showToast(response?.message || "Paquete ubicado correctamente", "success");
      close();
      onSuccess?.(response?.data || {});
    }
  });

  setTimeout(async () => {
    const estanteSelect = document.getElementById("asig-ubi-estante");
    const pisoSelect = document.getElementById("asig-ubi-piso");

    const resetPisos = (msg = "Selecciona un estante") => {
      if (!pisoSelect) return;
      pisoSelect.innerHTML = `<option value="">${escapeHtml(msg)}</option>`;
      pisoSelect.disabled = true;
    };

    const cargarPisos = async (idUbicacion) => {
      if (!pisoSelect) return;
      if (!idUbicacion) {
        resetPisos();
        return;
      }

      pisoSelect.innerHTML = `<option value="">Cargando...</option>`;
      pisoSelect.disabled = true;

      const resultado = await listarPisosPorUbicacion(idUbicacion);
      if (resultado && resultado.success === false) {
        showToast(resultado.error || resultado.message || "No se pudieron cargar los pisos", "warning");
        resetPisos("Sin pisos disponibles");
        return;
      }

      const pisos = obtenerArrayRespuesta(resultado, ["data", "pisos", "items", "resultado"]);

      if (!pisos.length) {
        resetPisos("Sin pisos registrados (opcional)");
        return;
      }

      pisoSelect.innerHTML = `
        <option value="">-- Sin piso --</option>
        ${pisos.map((item) => {
          const idPiso = String(item.id_piso || item.id || item.codigo_piso || "").trim();
          const nombrePiso = String(item.nombre_piso || item.nombre || item.codigo_piso || idPiso || "-").trim();
          return `<option value="${escapeHtml(idPiso)}">${escapeHtml(nombrePiso)}</option>`;
        }).join("")}
      `;
      pisoSelect.disabled = false;
    };

    try {
      const resultado = await listarUbicacionesActivas();
      if (resultado && resultado.success === false) {
        throw new Error(resultado.error || resultado.message || "No se pudieron cargar estantes");
      }
      const estantes = obtenerArrayRespuesta(resultado, ["data", "ubicaciones", "items", "resultado"]);

      if (!estanteSelect) return;
      if (!estantes.length) {
        estanteSelect.innerHTML = `<option value="">No hay estantes activos</option>`;
        estanteSelect.disabled = true;
        resetPisos("Sin estante");
        return;
      }

      estanteSelect.innerHTML = `
        <option value="">-- Selecciona estante --</option>
        ${estantes.map((item) => {
          const idUbicacion = String(item.id_ubicacion || item.id || item.codigo_ubicacion || "").trim();
          const nombreUbicacion = String(item.nombre_ubicacion || item.nombre || item.codigo_ubicacion || idUbicacion || "-").trim();
          return `<option value="${escapeHtml(idUbicacion)}">${escapeHtml(nombreUbicacion)}</option>`;
        }).join("")}
      `;
      estanteSelect.disabled = false;

      estanteSelect.addEventListener("change", (event) => {
        cargarPisos(String(event.target.value || "").trim());
      });

      resetPisos();
    } catch (error) {
      if (estanteSelect) {
        estanteSelect.innerHTML = `<option value="">Error cargando estantes</option>`;
        estanteSelect.disabled = true;
      }
      resetPisos("No disponible");
      showToast(error.message || "No se pudieron cargar ubicaciones", "error");
    }
  }, 0);
}
