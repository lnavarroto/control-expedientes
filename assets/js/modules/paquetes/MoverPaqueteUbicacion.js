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

export async function abrirModalMoverPaqueteUbicacion({ paquete, onSuccess }) {
  const idPaquete = String(paquete?.id_paquete_archivo || "").trim();
  if (!idPaquete) {
    showToast("No se encontro el paquete seleccionado", "warning");
    return;
  }

  const ubicacionActual = String(paquete?.ubicacion_texto || "").trim() || "Sin ubicacion";
  const idUbicacionActual = String(paquete?.id_ubicacion || "").trim();
  const idPisoActual = String(paquete?.id_piso || "").trim();

  openModal({
    title: "Mover paquete de ubicacion",
    content: `
      <div class="space-y-4">
        <div class="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p class="font-semibold">Ubicacion actual</p>
          <p class="mt-1">${escapeHtml(ubicacionActual)}</p>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Buscar estante</label>
          <input id="mov-ubi-search" class="input-base w-full" placeholder="Filtra por codigo o nombre" />
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Nuevo estante *</label>
            <select id="mov-ubi-estante" class="select-base w-full">
              <option value="">Cargando estantes...</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Nuevo piso (opcional)</label>
            <select id="mov-ubi-piso" class="select-base w-full" disabled>
              <option value="">Selecciona un estante</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Motivo del cambio *</label>
          <input id="mov-ubi-motivo" class="input-base w-full" placeholder="Ej: optimizacion de espacio" />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Observacion</label>
          <textarea id="mov-ubi-observacion" class="input-base w-full min-h-24" placeholder="Detalle opcional"></textarea>
        </div>
      </div>
    `,
    confirmText: "Mover paquete",
    cancelText: "Cancelar",
    onConfirm: async (close) => {
      const estanteSelect = document.getElementById("mov-ubi-estante");
      const pisoSelect = document.getElementById("mov-ubi-piso");
      const motivoEl = document.getElementById("mov-ubi-motivo");
      const obsEl = document.getElementById("mov-ubi-observacion");

      const idUbicacion = String(estanteSelect?.value || "").trim();
      const idPiso = String(pisoSelect?.value || "").trim();
      const motivo = String(motivoEl?.value || "").trim();
      const observacion = String(obsEl?.value || "").trim();

      if (!idUbicacion) {
        showToast("El nuevo estante es obligatorio", "warning");
        return;
      }
      if (!motivo) {
        showToast("El motivo del cambio es obligatorio", "warning");
        return;
      }

      if (idUbicacion === idUbicacionActual && idPiso === idPisoActual) {
        showToast("La nueva ubicacion es igual a la actual", "warning");
        return;
      }

      const labelEstante = estanteSelect?.selectedOptions?.[0]?.textContent?.trim() || "Nuevo estante";
      const labelPiso = pisoSelect?.selectedOptions?.[0]?.textContent?.trim() || "";
      const nuevaUbicacionTexto = labelPiso && labelPiso !== "-- Sin piso --"
        ? `${labelEstante} - ${labelPiso}`
        : labelEstante;

      const confirmar = window.confirm(`Esta seguro de mover este paquete a ${nuevaUbicacionTexto}?`);
      if (!confirmar) return;

      const payload = {
        id_paquete_archivo: idPaquete,
        id_ubicacion: idUbicacion,
        id_piso: idPiso,
        realizado_por: getUsuarioLogueado(),
        observacion: `REUBICACION: ${motivo}${observacion ? ` - ${observacion}` : ""}`
      };

      const response = await asignarUbicacionPaquete(payload);
      if (!response?.success) {
        showToast(response?.error || response?.message || "No se pudo mover el paquete", "error");
        return;
      }

      expedienteService.limpiarCacheBackend();
      window.dispatchEvent(new CustomEvent("expedientes:updated", {
        detail: { source: "mover_ubicacion_paquete", id_paquete_archivo: idPaquete }
      }));

      close();
      showToast(`Paquete movido a ${response?.data?.ubicacion_texto || nuevaUbicacionTexto}`, "success");
      onSuccess?.(response?.data || {});
    }
  });

  setTimeout(async () => {
    const searchInput = document.getElementById("mov-ubi-search");
    const estanteSelect = document.getElementById("mov-ubi-estante");
    const pisoSelect = document.getElementById("mov-ubi-piso");
    let estantes = [];

    const renderEstantes = (query = "") => {
      if (!estanteSelect) return;
      const q = String(query || "").trim().toLowerCase();
      const filtered = !q
        ? estantes
        : estantes.filter((item) => {
          const texto = `${item.codigo_ubicacion || ""} ${item.nombre_ubicacion || ""}`.toLowerCase();
          return texto.includes(q);
        });

      estanteSelect.innerHTML = `
        <option value="">-- Selecciona estante --</option>
        ${filtered.map((item) => {
          const idUbicacion = String(item.id_ubicacion || item.id || item.codigo_ubicacion || "").trim();
          const nombreUbicacion = String(item.nombre_ubicacion || item.nombre || item.codigo_ubicacion || idUbicacion || "-").trim();
          return `<option value="${escapeHtml(idUbicacion)}">${escapeHtml(nombreUbicacion)}</option>`;
        }).join("")}
      `;
    };

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
      estantes = obtenerArrayRespuesta(resultado, ["data", "ubicaciones", "items", "resultado"]);

      if (!estanteSelect) return;
      if (!estantes.length) {
        estanteSelect.innerHTML = `<option value="">No hay estantes activos</option>`;
        estanteSelect.disabled = true;
        resetPisos("Sin estante");
        return;
      }

      renderEstantes("");
      estanteSelect.disabled = false;
      searchInput?.addEventListener("input", (event) => {
        renderEstantes(String(event.target.value || ""));
      });

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
