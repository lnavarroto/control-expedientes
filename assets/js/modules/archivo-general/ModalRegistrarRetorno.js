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

function _prettyLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function _formatFechaCorta(value) {
  if (!value) return "-";
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return _escapeHtml(value);
  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

const ESTADOS_SALIDA_RETORNABLES = ["ACTIVA", "PENDIENTE", "EN_PROCESO"];

export async function abrirModalRegistrarRetorno(id_grupo, onSuccess) {
  // Obtener salidas abiertas del grupo
  // Obtener todas las salidas y filtrar por grupo
  const salidasResp = await archivoGeneralService.listarSalidasGrupo(id_grupo);
  if (!salidasResp.success) {
    showToast("Error cargando salidas", "error");
    return;
  }

  const salidas = (salidasResp.data || []).filter(s => String(s.id_grupo || "").trim() === id_grupo);
  const salidaActiva = salidas.find((salida) => {
    const estado = String(salida.estado_salida || "").trim().toUpperCase();
    return ESTADOS_SALIDA_RETORNABLES.includes(estado);
  });

  if (!salidaActiva) {
    showToast("No hay salida pendiente de retorno para este grupo", "warning");
    return;
  }

  const id_salida = salidaActiva.id_salida;
  const estadoSalida = String(salidaActiva.estado_salida || "").trim().toUpperCase();
  const tipoSalida = String(salidaActiva.tipo_salida || "").trim();

  const content = `
    <div class="retorno-modal-wrap">
      <section class="retorno-modal-hero">
        <div>
          <p class="retorno-modal-kicker">Control de retorno</p>
          <h4 class="retorno-modal-heading">Confirme el retorno del movimiento ${_escapeHtml(salidaActiva.rotulo_salida || "")}</h4>
          <p class="retorno-modal-copy">Revise los datos de la salida antes de cerrar el movimiento. Al confirmar, el grupo volverá a estado activo.</p>
        </div>
        <span class="retorno-modal-status retorno-modal-status--open">${_escapeHtml(_prettyLabel(estadoSalida || "PENDIENTE"))}</span>
      </section>

      <section class="retorno-modal-summary">
        <article class="retorno-modal-card retorno-modal-card--strong">
          <span class="retorno-modal-label">Rótulo</span>
          <strong class="retorno-modal-value">${_escapeHtml(salidaActiva.rotulo_salida || "-")}</strong>
          <span class="retorno-modal-meta">${_escapeHtml(_prettyLabel(tipoSalida || "SIN_TIPO"))}</span>
        </article>

        <article class="retorno-modal-card">
          <span class="retorno-modal-label">Destino</span>
          <strong class="retorno-modal-value">${_escapeHtml(_prettyLabel(salidaActiva.destino_salida || "-"))}</strong>
        </article>

        <article class="retorno-modal-card">
          <span class="retorno-modal-label">Responsable de entrega</span>
          <strong class="retorno-modal-value">${_escapeHtml(salidaActiva.responsable_entrega || "-")}</strong>
        </article>

        <article class="retorno-modal-card">
          <span class="retorno-modal-label">Fecha de salida</span>
          <strong class="retorno-modal-value">${_formatFechaCorta(salidaActiva.fecha_hora_salida)}</strong>
        </article>
      </section>

      <div class="retorno-modal-note">
        <span class="retorno-modal-note-dot"></span>
        <p>Este retorno cerrará la salida actual y liberará nuevamente el grupo para futuras operaciones.</p>
      </div>

      <section class="retorno-modal-form">
        <label for="textarea-observacion-retorno" class="retorno-modal-textarea-label">Observación del retorno</label>
        <textarea id="textarea-observacion-retorno" class="retorno-modal-textarea" rows="4" placeholder="Detalle breve del retorno, conformidad o incidencia si aplica..."></textarea>
        <p class="retorno-modal-help">Campo opcional. Se guardará en el historial de la salida.</p>
      </section>
    </div>
  `;

  openModal({
    title: "Registrar Retorno",
    content,
    confirmText: "Confirmar Retorno",
    cancelText: "Cancelar",
    panelClass: "retorno-modal-panel",
    panelWidthClass: "max-w-3xl",
    onConfirm: async (close) => {
      const observacion = document.getElementById("textarea-observacion-retorno").value.trim();

      const confirmBtn = document.getElementById("modal-confirm");
      if (confirmBtn) confirmBtn.disabled = true;

      try {
        const usuario = _getUsuario();
        const realizadoPor = _obtenerRealizadoPor(usuario);

        const response = await archivoGeneralService.registrarRetorno({
          id_salida: id_salida,
          observacion: observacion,
          realizado_por: realizadoPor
        });

        if (response.success) {
          showToast("Retorno registrado exitosamente", "success");
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
}
