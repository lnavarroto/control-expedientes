import { renderTable } from "../../components/table.js";
import { openModal } from "../../components/modal.js";
import { showToast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { expedienteService } from "../../services/expedienteService.js";
import { ubicacionConfigService } from "../../services/ubicacionConfigService.js";
import { estadoService } from "../../services/estadoService.js";
import {
  paqueteService,
  sugerirPaqueteParaExpediente,
  crearPaqueteArchivo,
  asignarExpedienteAPaquete,
  asignarExpedientesAPaqueteLote,
  desasignarExpedienteDePaquete,
  listarPaquetesArchivo,
  listarExpedientesPorPaquete,
  listarMateriasActivas,
  listarResponsablesActivos,
  crearPaquete,
  asignarColorEspecialista
} from "../../services/paqueteService.js";
import { abrirModalAsignarUbicacionPaquete as abrirModalAsignarUbicacionPaqueteComponente } from "./AsignarUbicacionPaquete.js";
import { abrirModalMoverPaqueteUbicacion } from "./MoverPaqueteUbicacion.js";

const PAGE_SIZE = 10;

const _COLOR_BADGE = {
  AZUL: "bg-blue-100 text-blue-800 border-blue-200",
  ROJO: "bg-red-100 text-red-800 border-red-200",
  VERDE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  AMARILLO: "bg-amber-100 text-amber-800 border-amber-200",
  NARANJA: "bg-orange-100 text-orange-800 border-orange-200",
  MORADO: "bg-violet-100 text-violet-800 border-violet-200",
  CELESTE: "bg-cyan-100 text-cyan-800 border-cyan-200",
  GRIS: "bg-slate-100 text-slate-800 border-slate-200"
};

function _escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function _normalizarTextoBusqueda(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const estadosCatalogo = estadoService.listarSync();
const estadoNombrePorId = new Map(
  (estadosCatalogo || []).map((estado) => [String(estado.id || "").trim(), String(estado.nombre || "").trim()])
);

function obtenerEstadoTexto(expediente) {
  const idEstado = String(expediente.id_estado || "").trim();
  return estadoNombrePorId.get(idEstado) || idEstado || "-";
}

function _getUsuario() {
  try {
    const stored = localStorage.getItem("trabajador_validado");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function _obtenerAsignadoPor(usuario) {
  if (!usuario) return "SISTEMA";
  const dni = String(usuario.dni || "").trim();
  const nombre = [usuario.nombres, usuario.apellidos].filter(Boolean).join(" ").trim();
  return [dni, nombre].filter(Boolean).join(" - ") || "SISTEMA";
}

function _getColorClass(color) {
  return _COLOR_BADGE[String(color || "").trim().toUpperCase()] || _COLOR_BADGE.GRIS;
}

function _formatearFechaCorta(value) {
  const texto = String(value || "").trim();
  if (!texto) return "Sin fecha";

  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) return texto;

  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function _obtenerUbicacionExpediente(expediente = {}) {
  return String(
    expediente.ubicacion_texto || expediente.nombre_ubicacion || expediente.id_ubicacion_actual || ""
  ).trim();
}

function numeroExpedienteLabel(expediente = {}) {
  const codigo = String(expediente.codigo_expediente_completo || "").trim();
  if (codigo) return codigo;

  const numero = String(expediente.numero_expediente || "").trim();
  const anio = String(expediente.anio || "").trim();
  return [numero, anio].filter(Boolean).join("-") || String(expediente.id_expediente || expediente.id || "Sin código");
}

function expedienteDisponibleParaAsignacion(expediente = {}) {
  return !expedienteTienePaquete(expediente) && String(expediente.activo || "SI").trim().toUpperCase() !== "NO";
}

function _textoBusquedaExpediente(expediente = {}) {
  return _normalizarTextoBusqueda([
    expediente.codigo_expediente_completo,
    expediente.numero_expediente,
    expediente.anio,
    expediente.codigo_materia,
    expediente.juzgado_texto,
    expediente.id_estado,
    _obtenerUbicacionExpediente(expediente)
  ].filter(Boolean).join(" "));
}

async function _asignarCodigoAPaqueteArchivo({ codigo, idPaqueteArchivo, asignadoPor }) {
  const resultadoExpediente = await expedienteService.obtenerDelBackendPorCodigo(codigo);
  if (!resultadoExpediente?.success || !resultadoExpediente.data?.id_expediente) {
    throw new Error(resultadoExpediente?.message || "No se encontró el expediente");
  }

  const resultadoAsignacion = await asignarExpedienteAPaquete({
    id_expediente: String(resultadoExpediente.data.id_expediente || "").trim(),
    id_paquete_archivo: String(idPaqueteArchivo || "").trim(),
    asignado_por: asignadoPor
  });

  if (!resultadoAsignacion?.success) {
    throw new Error(resultadoAsignacion?.error || "No se pudo asignar el expediente");
  }

  return resultadoAsignacion;
}

async function _desasignarCodigoDePaquete({ codigo, desasignadoPor }) {
  const resultadoExpediente = await expedienteService.obtenerDelBackendPorCodigo(codigo);
  if (!resultadoExpediente?.success || !resultadoExpediente.data?.id_expediente) {
    throw new Error(resultadoExpediente?.message || "No se encontró el expediente");
  }

  const resultadoDesasignacion = await desasignarExpedienteDePaquete({
    id_expediente: String(resultadoExpediente.data.id_expediente || "").trim(),
    desasignado_por: desasignadoPor
  });

  if (!resultadoDesasignacion?.success) {
    throw new Error(resultadoDesasignacion?.error || "No se pudo desasignar el expediente");
  }

  return resultadoDesasignacion;
}

function expedienteTienePaquete(expediente) {
  const paqueteId = expediente.paqueteId || expediente.id_paquete || "";
  return Boolean(String(paqueteId).trim());
}
function abrirModalAsignarExpedienteManual(paquetesArchivo, onAsignado, inlineMountId = "") {
  const usuario = _getUsuario();
  if (!usuario) {
    showToast("Debes estar logueado", "error");
    return;
  }

  const paqueteInicial = Array.isArray(paquetesArchivo) ? paquetesArchivo : [];

  openModal({
    inlineMountId,
    title: "Asignación de Expedientes",
    content: `
      <style>
        @keyframes spinner-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .assign-shell {
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
          min-height: 0;
        }

        .assign-tabs {
          display: inline-flex;
          gap: 6px;
          padding: 6px;
          border-radius: 14px;
          border: 1px solid #dbe2ea;
          background: linear-gradient(180deg, #f8fbff 0%, #f1f5f9 100%);
        }

        .assign-tab-btn {
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          padding: 9px 14px;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .assign-tab-btn.active {
          background: #ffffff;
          color: #1d4ed8;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
        }

        .assign-tab-panel {
          display: none;
          min-height: 0;
        }

        .assign-tab-panel.active {
          display: block;
        }

        .assign-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
        }

        .assign-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .assign-form-group label {
          font-size: 11px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .assign-form-group input,
        .assign-form-group select {
          width: 100%;
          min-height: 40px;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff;
          color: #0f172a;
          font-size: 13px;
        }

        .assign-form-group input:focus,
        .assign-form-group select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .assign-msg {
          display: none;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .assign-msg.show { display: block; }
        .assign-msg.info { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .assign-msg.success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        .assign-msg.warning { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
        .assign-msg.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

        .assign-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 120px;
          gap: 8px;
          align-items: end;
        }

        .assign-search {
          display: flex;
          gap: 8px;
        }

        .assign-search button {
          min-width: 92px;
          min-height: 40px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .assign-counter {
          grid-column: 1 / -1;
          padding: 8px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
        }

        .assign-table-wrap {
          min-height: 260px;
          max-height: min(38vh, 360px);
          overflow: auto;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #ffffff;
        }

        .assign-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .assign-table thead th {
          position: sticky;
          top: 0;
          z-index: 1;
          padding: 8px 10px;
          text-align: left;
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .assign-table tbody td {
          padding: 8px 10px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          color: #334155;
        }

        .assign-table tbody tr:hover { background: #f8fbff; }
        .assign-table tbody tr.is-selected { background: #edf4ff; }

        .assign-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 86px;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .assign-badge.available {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .assign-actions {
          position: sticky;
          bottom: 0;
          z-index: 2;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 10px;
          margin-top: 6px;
          background: linear-gradient(180deg, rgba(255,255,255,0.7) 0%, #ffffff 32%);
          border-top: 1px solid #e2e8f0;
          backdrop-filter: blur(4px);
        }

        .assign-pagination {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .assign-pagination button,
        .assign-primary-btn {
          min-height: 40px;
          border: none;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .assign-pagination button {
          padding: 0 12px;
          background: #e2e8f0;
          color: #475569;
        }

        .assign-pagination button:disabled,
        .assign-primary-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .assign-page-info {
          min-width: 120px;
          text-align: center;
          padding: 0 12px;
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
        }

        .assign-primary-btn {
          width: 100%;
          max-width: 260px;
          padding: 0 14px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.2);
        }

        .assign-overlay {
          position: fixed;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.38);
          z-index: 50;
        }

        .assign-overlay.show { display: flex; }

        .assign-overlay-card {
          min-width: 260px;
          padding: 22px 24px;
          border-radius: 18px;
          background: #ffffff;
          text-align: center;
          box-shadow: 0 22px 42px rgba(15, 23, 42, 0.24);
        }

        .assign-spinner {
          width: 38px;
          height: 38px;
          margin: 0 auto 12px;
          border: 4px solid #dbeafe;
          border-top-color: #2563eb;
          border-radius: 999px;
          animation: spinner-spin 0.8s linear infinite;
        }

        .assign-overlay-text {
          color: #0f172a;
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .assign-overlay-progress {
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .assign-grid {
            grid-template-columns: 1fr;
          }

          .assign-search {
            flex-direction: column;
          }

          .assign-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .assign-primary-btn {
            max-width: none;
          }

          .assign-table-wrap {
            max-height: min(34vh, 300px);
          }
        }
      </style>

      <div class="assign-shell">
        <div class="assign-overlay" id="assign-overlay">
          <div class="assign-overlay-card">
            <div class="assign-spinner"></div>
            <div class="assign-overlay-text">Asignando expedientes...</div>
            <div class="assign-overlay-progress" id="assign-progress">0 de 0</div>
          </div>
        </div>

        <div class="assign-tabs">
          <button class="assign-tab-btn active" id="tab-individual" data-tab="individual">Asignación Individual</button>
          <button class="assign-tab-btn" id="tab-grupal" data-tab="grupal">Asignación Grupal</button>
        </div>

        <div class="assign-tab-panel active" id="panel-individual">
          <div class="assign-form">
            <div class="assign-form-group">
              <label>Paquete Destino *</label>
              <select id="ind-paquete">
                <option value="">-- Selecciona --</option>
              </select>
            </div>
            <div class="assign-form-group">
              <label>Código del Expediente *</label>
              <input type="text" id="ind-codigo" placeholder="Ej: 00059-2019-0-3101-JR-CI-01" autocomplete="off" />
            </div>
            <div class="assign-actions">
              <div></div>
              <button class="assign-primary-btn" id="ind-btn-asignar">Asignar Expediente</button>
            </div>
            <div id="ind-msg" class="assign-msg"></div>
          </div>
        </div>

        <div class="assign-tab-panel" id="panel-grupal">
          <div class="assign-form">
            <div class="assign-form-group">
              <label>Paquete Destino *</label>
              <select id="group-paquete">
                <option value="">-- Selecciona --</option>
              </select>
            </div>

            <div class="assign-grid">
              <div class="assign-search">
                <input type="text" id="group-search-input" placeholder="Buscar por código, número o juzgado" autocomplete="off" />
                <button id="group-search-btn">Buscar</button>
              </div>
              <div class="assign-form-group">
                <label>Año</label>
                <select id="group-year-filter">
                  <option value="">Todos</option>
                </select>
              </div>
              <div class="assign-counter" id="group-counter">Cargando...</div>
            </div>

            <div class="assign-table-wrap" id="group-table-wrap">
              <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">Cargando expedientes...</div>
            </div>

            <div class="assign-actions">
              <div class="assign-pagination">
                <button id="group-prev">Anterior</button>
                <div class="assign-page-info" id="group-page-info">Página 1 de 1</div>
                <button id="group-next">Siguiente</button>
              </div>
              <button class="assign-primary-btn" id="group-btn-asignar" disabled>Asignar 0 seleccionados</button>
            </div>
            <div id="group-msg" class="assign-msg"></div>
          </div>
        </div>
      </div>
    `,
    panelWidthClass: "max-w-4xl",
    panelClass: "flex flex-col",
    bodyClass: "flex-1 min-h-0 overflow-hidden",
    bodyScrollable: false,
    confirmText: "Cerrar",
    cancelText: "",
    onConfirm: (close) => close(),
    onCancel: (close) => close()
  });

  setTimeout(() => {
    const tabIndividual = document.getElementById("tab-individual");
    const tabGrupal = document.getElementById("tab-grupal");
    const indPaquete = document.getElementById("ind-paquete");
    const indCodigo = document.getElementById("ind-codigo");
    const indBtnAsignar = document.getElementById("ind-btn-asignar");
    const indMsg = document.getElementById("ind-msg");
    const groupPaquete = document.getElementById("group-paquete");
    const groupSearchInput = document.getElementById("group-search-input");
    const groupSearchBtn = document.getElementById("group-search-btn");
    const groupYearFilter = document.getElementById("group-year-filter");
    const groupCounter = document.getElementById("group-counter");
    const groupTableWrap = document.getElementById("group-table-wrap");
    const groupPrev = document.getElementById("group-prev");
    const groupNext = document.getElementById("group-next");
    const groupPageInfo = document.getElementById("group-page-info");
    const groupBtnAsignar = document.getElementById("group-btn-asignar");
    const groupMsg = document.getElementById("group-msg");
    const assignOverlay = document.getElementById("assign-overlay");
    const assignProgress = document.getElementById("assign-progress");
    const asignadoPor = _obtenerAsignadoPor(usuario);

    const switchTab = (tabName) => {
      document.querySelectorAll(".assign-tab-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
      });
      document.querySelectorAll(".assign-tab-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === `panel-${tabName}`);
      });
    };

    tabIndividual?.addEventListener("click", () => switchTab("individual"));
    tabGrupal?.addEventListener("click", () => switchTab("grupal"));

    const showIndMsg = (texto, tipo) => {
      if (!indMsg) return;
      indMsg.textContent = texto;
      indMsg.className = `assign-msg show ${tipo}`;
    };

    const showGroupMsg = (texto, tipo) => {
      if (!groupMsg) return;
      groupMsg.textContent = texto;
      groupMsg.className = `assign-msg show ${tipo}`;
    };

    const populatePaquetes = (selectEl) => {
      if (!selectEl) return;
      const activos = paqueteInicial.filter((item) => String(item.activo || "SI").toUpperCase() !== "NO");
      selectEl.innerHTML = `
        <option value="">-- Selecciona --</option>
        ${activos.map((item) => `<option value="${item.id_paquete_archivo}">${_escapeHtml(item.rotulo_paquete)}</option>`).join("")}
      `;
    };

    populatePaquetes(indPaquete);
    populatePaquetes(groupPaquete);

    indBtnAsignar?.addEventListener("click", async () => {
      const codigo = String(indCodigo?.value || "").trim();
      const paquete = String(indPaquete?.value || "").trim();
      if (!codigo || !paquete) {
        showIndMsg("Completa paquete y código", "warning");
        return;
      }

      indBtnAsignar.disabled = true;
      showIndMsg("Procesando...", "info");
      try {
        await _asignarCodigoAPaqueteArchivo({ codigo, idPaqueteArchivo: paquete, asignadoPor });
        showIndMsg("✓ Expediente asignado correctamente", "success");
        showToast("✓ Asignado", "success");
        if (indCodigo) indCodigo.value = "";
        onAsignado?.();
      } catch (error) {
        showIndMsg(error.message || "Error al asignar", "error");
      } finally {
        indBtnAsignar.disabled = false;
        indCodigo?.focus();
      }
    });

    const groupState = {
      expedientes: [],
      searchTerm: "",
      yearFilter: "",
      currentPage: 1,
      selectedIds: new Set()
    };

    const populateGroupYears = () => {
      if (!groupYearFilter) return;
      const previo = String(groupState.yearFilter || "").trim();
      const years = Array.from(new Set(
        groupState.expedientes
          .map((item) => String(item.anio || "").trim())
          .filter((year) => /^\d{4}$/.test(year))
      )).sort((a, b) => Number(b) - Number(a));

      groupYearFilter.innerHTML = `
        <option value="">Todos</option>
        ${years.map((year) => `<option value="${year}">${year}</option>`).join("")}
      `;

      if (previo && years.includes(previo)) {
        groupState.yearFilter = previo;
        groupYearFilter.value = previo;
      } else {
        groupState.yearFilter = "";
      }
    };

    const getFilteredExpedientes = () => {
      return groupState.expedientes.filter((expediente) => {
        const disponible = expedienteDisponibleParaAsignacion(expediente);
        const matchesSearch = !groupState.searchTerm || _textoBusquedaExpediente(expediente).includes(groupState.searchTerm);
        const matchesYear = !groupState.yearFilter || String(expediente.anio || "").trim() === groupState.yearFilter;
        return disponible && matchesSearch && matchesYear;
      });
    };

    const getTotalPages = (filtered) => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    const getPageItems = (filtered) => {
      const totalPages = getTotalPages(filtered);
      groupState.currentPage = Math.min(Math.max(groupState.currentPage, 1), totalPages);
      const start = (groupState.currentPage - 1) * PAGE_SIZE;
      return filtered.slice(start, start + PAGE_SIZE);
    };

    const renderGrupalTable = () => {
      const filtered = getFilteredExpedientes();
      const pageItems = getPageItems(filtered);
      const totalPages = getTotalPages(filtered);

      if (groupCounter) {
        groupCounter.textContent = `${filtered.length} disponibles de ${groupState.expedientes.length} | Seleccionados: ${groupState.selectedIds.size}`;
      }
      if (groupPageInfo) {
        groupPageInfo.textContent = `Página ${groupState.currentPage} de ${totalPages}`;
      }
      if (groupPrev) groupPrev.disabled = groupState.currentPage <= 1;
      if (groupNext) groupNext.disabled = groupState.currentPage >= totalPages;
      if (groupBtnAsignar) {
        const count = groupState.selectedIds.size;
        groupBtnAsignar.textContent = `Asignar ${count} seleccionados`;
        groupBtnAsignar.disabled = !String(groupPaquete?.value || "").trim() || count === 0;
      }

      if (!groupTableWrap) return;

      if (groupState.expedientes.length === 0) {
        groupTableWrap.innerHTML = `<div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">No hay expedientes</div>`;
        return;
      }

      if (filtered.length === 0) {
        groupTableWrap.innerHTML = `<div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">No hay expedientes disponibles con ese filtro</div>`;
        return;
      }

      groupTableWrap.innerHTML = `
        <table class="assign-table">
          <thead>
            <tr>
              <th><input type="checkbox" id="group-select-all" /></th>
              <th>Código</th>
              <th>Número</th>
              <th>Año</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${pageItems.map((expediente) => {
              const id = String(expediente.id_expediente || "").trim();
              const selected = groupState.selectedIds.has(id);
              return `
                <tr class="${selected ? "is-selected" : ""}" data-exp-id="${_escapeHtml(id)}">
                  <td><input type="checkbox" class="group-row-check" data-id="${_escapeHtml(id)}" ${selected ? "checked" : ""} /></td>
                  <td>${_escapeHtml(expediente.codigo_expediente_completo || "-")}</td>
                  <td>${_escapeHtml(expediente.numero_expediente || "-")}</td>
                  <td>${_escapeHtml(expediente.anio || "-")}</td>
                  <td><span class="assign-badge available">Disponible</span></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `;

      const selectAll = document.getElementById("group-select-all");
      if (selectAll) {
        const visibleSelected = pageItems.filter((item) => groupState.selectedIds.has(String(item.id_expediente || "").trim())).length;
        selectAll.checked = visibleSelected > 0 && visibleSelected === pageItems.length;
        selectAll.addEventListener("change", (event) => {
          pageItems.forEach((item) => {
            const id = String(item.id_expediente || "").trim();
            if (event.target.checked) groupState.selectedIds.add(id);
            else groupState.selectedIds.delete(id);
          });
          renderGrupalTable();
        });
      }

      groupTableWrap.querySelectorAll(".group-row-check").forEach((checkbox) => {
        checkbox.addEventListener("change", (event) => {
          const id = String(event.target.dataset.id || "").trim();
          if (event.target.checked) groupState.selectedIds.add(id);
          else groupState.selectedIds.delete(id);
          renderGrupalTable();
        });
      });

      groupTableWrap.querySelectorAll("tbody tr").forEach((row) => {
        row.addEventListener("click", (event) => {
          if (event.target.tagName === "INPUT") return;
          const checkbox = row.querySelector(".group-row-check");
          if (!checkbox) return;
          checkbox.checked = !checkbox.checked;
          const id = String(checkbox.dataset.id || "").trim();
          if (checkbox.checked) groupState.selectedIds.add(id);
          else groupState.selectedIds.delete(id);
          renderGrupalTable();
        });
      });
    };

    const loadGrupalData = async () => {
      if (groupTableWrap) {
        groupTableWrap.innerHTML = `<div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">Cargando...</div>`;
      }

      try {
        const res = await expedienteService.listarDelBackend();
        if (!res.success) throw new Error(res.message || "Error cargando expedientes");
        groupState.expedientes = Array.isArray(res.data) ? res.data : [];
        groupState.currentPage = 1;
        groupState.selectedIds.clear();
        populateGroupYears();
        renderGrupalTable();
      } catch (error) {
        if (groupTableWrap) {
          groupTableWrap.innerHTML = `<div style="padding: 20px; text-align: center; color: #991b1b; font-size: 12px;">${error.message}</div>`;
        }
      }
    };

    groupPaquete?.addEventListener("change", () => renderGrupalTable());
    groupSearchBtn?.addEventListener("click", () => {
      groupState.searchTerm = _normalizarTextoBusqueda(groupSearchInput?.value || "");
      groupState.currentPage = 1;
      renderGrupalTable();
    });
    groupSearchInput?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      groupState.searchTerm = _normalizarTextoBusqueda(groupSearchInput?.value || "");
      groupState.currentPage = 1;
      renderGrupalTable();
    });
    groupYearFilter?.addEventListener("change", (event) => {
      groupState.yearFilter = String(event.target.value || "").trim();
      groupState.currentPage = 1;
      renderGrupalTable();
    });
    groupPrev?.addEventListener("click", () => {
      if (groupState.currentPage <= 1) return;
      groupState.currentPage -= 1;
      renderGrupalTable();
    });
    groupNext?.addEventListener("click", () => {
      const totalPages = getTotalPages(getFilteredExpedientes());
      if (groupState.currentPage >= totalPages) return;
      groupState.currentPage += 1;
      renderGrupalTable();
    });

    groupBtnAsignar?.addEventListener("click", async () => {
      const paquete = String(groupPaquete?.value || "").trim();
      if (!paquete || groupState.selectedIds.size === 0) {
        showGroupMsg("Selecciona paquete y expedientes", "warning");
        return;
      }

      const ids = Array.from(groupState.selectedIds);
      if (assignOverlay) assignOverlay.classList.add("show");
      if (assignProgress) assignProgress.textContent = `0 de ${ids.length}`;
      if (groupBtnAsignar) groupBtnAsignar.disabled = true;

      let success = 0;
      let failed = 0;
      let primerError = "";

      try {
        const resLote = await asignarExpedientesAPaqueteLote({
          ids_expedientes: ids,
          id_paquete_archivo: paquete,
          asignado_por: asignadoPor
        });

        if (!resLote?.success) {
          throw new Error(resLote?.error || "No se pudo ejecutar la asignación por lote");
        }

        const resultados = Array.isArray(resLote.data) ? resLote.data : [];
        success = resultados.filter((item) => item?.success).length;
        failed = Math.max(ids.length - success, 0);
        primerError = resultados.find((item) => !item?.success)?.mensaje || "";
      } catch (error) {
        failed = ids.length;
        primerError = error.message || "Error en asignación por lote";
      } finally {
        if (assignProgress) assignProgress.textContent = `${ids.length} de ${ids.length}`;
        if (assignOverlay) assignOverlay.classList.remove("show");
      }

      if (groupBtnAsignar) groupBtnAsignar.disabled = false;

      if (success > 0) showToast(`${success} asignados`, "success");
      if (failed > 0) showGroupMsg(primerError || `${failed} no pudieron asignarse`, "warning");
      else showGroupMsg("✓ Asignación completada", "success");

      groupState.selectedIds.clear();
      await loadGrupalData();
      onAsignado?.();
    });

    loadGrupalData();
  }, 0);
}

function abrirModalQuitarExpedienteManual(paquetesArchivo, onDesasignado, inlineMountId = "") {
  const usuario = _getUsuario();
  if (!usuario) {
    showToast("Debes estar logueado", "error");
    return;
  }

  const desasignadoPor = _obtenerAsignadoPor(usuario);
  const paquetesDisponibles = Array.isArray(paquetesArchivo) ? paquetesArchivo : [];

  openModal({
    inlineMountId,
    title: "Quitar Expediente de Paquete",
    content: `
      <style>
        .remove-shell {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
        }

        .remove-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 120px;
          gap: 10px;
          align-items: end;
        }

        .remove-search {
          display: flex;
          gap: 8px;
        }

        .remove-search button {
          min-width: 92px;
        }

        .remove-counter {
          padding: 8px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
        }

        .remove-table-wrap {
          min-height: 260px;
          max-height: min(42vh, 380px);
          overflow: auto;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #ffffff;
        }

        .remove-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .remove-table thead th {
          position: sticky;
          top: 0;
          z-index: 1;
          padding: 8px 10px;
          text-align: left;
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .remove-table tbody td {
          padding: 8px 10px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          color: #334155;
        }

        .remove-table tbody tr {
          cursor: pointer;
        }

        .remove-table tbody tr:hover {
          background: #fff7ed;
        }

        .remove-table tbody tr.is-selected {
          background: #ffedd5;
          box-shadow: inset 3px 0 0 #f97316;
        }

        .remove-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 92px;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid #fed7aa;
          background: #fff7ed;
          color: #c2410c;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .remove-actions {
          display: flex;
          justify-content: flex-end;
        }

        @media (max-width: 768px) {
          .remove-grid {
            grid-template-columns: 1fr;
          }

          .remove-search {
            flex-direction: column;
          }
        }
      </style>
      <div class="remove-shell">
        <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Selecciona primero el paquete y luego el expediente que deseas quitar de la asignación activa.
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Paquete con expedientes</label>
          <select id="remove-paquete" class="select-base w-full">
            <option value="">-- Selecciona un paquete --</option>
            ${paquetesDisponibles
              .map((item) => `<option value="${_escapeHtml(item.id_paquete_archivo)}">${_escapeHtml(item.rotulo_paquete || item.id_paquete_archivo)}</option>`)
              .join("")}
          </select>
        </div>

        <div class="remove-grid">
          <div class="remove-search">
            <input id="remove-search-input" class="input-base w-full" placeholder="Buscar por código, número o año" autocomplete="off" />
            <button id="remove-search-btn" type="button" class="btn btn-secondary font-semibold">Buscar</button>
          </div>
          <div class="remove-counter" id="remove-counter">Selecciona un paquete</div>
        </div>

        <div id="remove-table-wrap" class="remove-table-wrap">
          <div class="px-4 py-10 text-center text-sm text-slate-500">Selecciona un paquete para ver sus expedientes asignados.</div>
        </div>

        <div class="remove-actions">
          <button id="remove-exp-btn" type="button" class="btn btn-secondary w-full md:w-auto font-semibold" disabled>Quitar Asignación</button>
        </div>
        <div id="remove-exp-msg" class="hidden rounded-lg border px-3 py-2 text-sm"></div>
      </div>
    `,
    panelWidthClass: "max-w-4xl",
    confirmText: "Cerrar",
    cancelText: "",
    onConfirm: (close) => close(),
    onCancel: (close) => close()
  });

  setTimeout(() => {
    const selectPaquete = document.getElementById("remove-paquete");
    const inputSearch = document.getElementById("remove-search-input");
    const btnSearch = document.getElementById("remove-search-btn");
    const counter = document.getElementById("remove-counter");
    const tableWrap = document.getElementById("remove-table-wrap");
    const btnQuitar = document.getElementById("remove-exp-btn");
    const msg = document.getElementById("remove-exp-msg");

    const state = {
      paqueteId: "",
      expedientes: [],
      searchTerm: "",
      selectedId: "",
      selectedCodigo: ""
    };

    const setMsg = (text = "", type = "info") => {
      if (!msg) return;
      if (!text) {
        msg.className = "hidden rounded-lg border px-3 py-2 text-sm";
        msg.textContent = "";
        return;
      }
      const tones = {
        info: "border-blue-200 bg-blue-50 text-blue-700",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
        error: "border-red-200 bg-red-50 text-red-700"
      };
      msg.className = `rounded-lg border px-3 py-2 text-sm ${tones[type] || tones.info}`;
      msg.textContent = text;
    };

    const filteredRows = () => {
      if (!state.searchTerm) return state.expedientes;
      return state.expedientes.filter((item) => {
        const expediente = item.expediente || {};
        return _textoBusquedaExpediente(expediente).includes(state.searchTerm);
      });
    };

    const renderRows = () => {
      if (!tableWrap) return;

      const filtered = filteredRows();

      if (counter) {
        const base = state.paqueteId
          ? `${filtered.length} expediente(s) en listado de ${state.expedientes.length}`
          : "Selecciona un paquete";
        const extra = state.selectedCodigo ? ` | Seleccionado: ${state.selectedCodigo}` : "";
        counter.textContent = `${base}${extra}`;
      }

      btnQuitar.disabled = !state.selectedId;

      if (!state.paqueteId) {
        tableWrap.innerHTML = `<div class="px-4 py-10 text-center text-sm text-slate-500">Selecciona un paquete para ver sus expedientes asignados.</div>`;
        return;
      }

      if (state.expedientes.length === 0) {
        tableWrap.innerHTML = `<div class="px-4 py-10 text-center text-sm text-slate-500">Este paquete no tiene expedientes asignados.</div>`;
        return;
      }

      if (filtered.length === 0) {
        tableWrap.innerHTML = `<div class="px-4 py-10 text-center text-sm text-slate-500">No hay coincidencias para esa búsqueda.</div>`;
        return;
      }

      tableWrap.innerHTML = `
        <table class="remove-table">
          <thead>
            <tr>
              <th>Elegir</th>
              <th>Código</th>
              <th>Número</th>
              <th>Año</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((item) => {
              const expediente = item.expediente || {};
              const expedienteId = String(item.id_expediente || expediente.id_expediente || "").trim();
              const codigo = String(expediente.codigo_expediente_completo || expediente.numero_expediente || expedienteId || "-").trim();
              const selected = expedienteId && expedienteId === state.selectedId;

              return `
                <tr class="${selected ? "is-selected" : ""}" data-exp-id="${_escapeHtml(expedienteId)}" data-exp-codigo="${_escapeHtml(codigo)}">
                  <td>
                    <input type="radio" name="remove-expediente" class="h-4 w-4" value="${_escapeHtml(expedienteId)}" ${selected ? "checked" : ""} />
                  </td>
                  <td class="font-mono text-xs text-slate-700">${_escapeHtml(codigo)}</td>
                  <td>${_escapeHtml(expediente.numero_expediente || "-")}</td>
                  <td>${_escapeHtml(expediente.anio || "-")}</td>
                  <td><span class="remove-chip">Asignado</span></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `;

      tableWrap.querySelectorAll('input[name="remove-expediente"]').forEach((radio) => {
        radio.addEventListener("change", (event) => {
          const row = event.target.closest("tr");
          state.selectedId = String(event.target.value || "").trim();
          state.selectedCodigo = String(row?.dataset.expCodigo || "").trim();
          renderRows();
        });
      });

      tableWrap.querySelectorAll("tbody tr").forEach((row) => {
        row.addEventListener("click", (event) => {
          if (event.target.tagName === "INPUT") return;
          state.selectedId = String(row.dataset.expId || "").trim();
          state.selectedCodigo = String(row.dataset.expCodigo || "").trim();
          renderRows();
        });
      });
    };

    const loadExpedientes = async () => {
      if (!state.paqueteId) {
        state.expedientes = [];
        state.selectedId = "";
        state.selectedCodigo = "";
        renderRows();
        return;
      }

      if (tableWrap) {
        tableWrap.innerHTML = `<div class="px-4 py-10 text-center text-sm text-slate-500">Cargando expedientes del paquete...</div>`;
      }

      try {
        const resultado = await listarExpedientesPorPaquete(state.paqueteId);
        if (!resultado?.success) {
          throw new Error(resultado?.error || "No se pudieron cargar los expedientes del paquete");
        }

        state.expedientes = Array.isArray(resultado.data) ? resultado.data : [];
        state.selectedId = "";
        state.selectedCodigo = "";
        renderRows();
      } catch (error) {
        state.expedientes = [];
        state.selectedId = "";
        state.selectedCodigo = "";
        if (tableWrap) {
          tableWrap.innerHTML = `<div class="px-4 py-10 text-center text-sm text-red-600">${_escapeHtml(error.message || "No se pudo cargar el listado")}</div>`;
        }
        if (counter) {
          counter.textContent = "No se pudo cargar el listado";
        }
      }
    };

    const ejecutarQuitar = async () => {
      if (!state.selectedId) {
        setMsg("Selecciona un expediente del listado", "warning");
        return;
      }

      btnQuitar.disabled = true;
      setMsg(`Procesando desasignación de ${state.selectedCodigo || "expediente"}...`, "info");

      try {
        const resultado = await desasignarExpedienteDePaquete({
          id_expediente: state.selectedId,
          desasignado_por: desasignadoPor
        });

        if (!resultado?.success) {
          throw new Error(resultado?.error || "No se pudo desasignar el expediente");
        }

        setMsg("✓ Expediente desasignado correctamente", "success");
        showToast("✓ Expediente desasignado", "success");
        await loadExpedientes();
        onDesasignado?.();
      } catch (error) {
        setMsg(error.message || "No se pudo desasignar el expediente", "error");
      } finally {
        btnQuitar.disabled = !state.selectedId;
      }
    };

    selectPaquete?.addEventListener("change", (event) => {
      state.paqueteId = String(event.target.value || "").trim();
      state.searchTerm = "";
      if (inputSearch) inputSearch.value = "";
      setMsg();
      loadExpedientes();
    });

    btnSearch?.addEventListener("click", () => {
      state.searchTerm = _normalizarTextoBusqueda(inputSearch?.value || "");
      renderRows();
    });

    inputSearch?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      state.searchTerm = _normalizarTextoBusqueda(inputSearch?.value || "");
      renderRows();
    });

    btnQuitar?.addEventListener("click", ejecutarQuitar);
    renderRows();
  }, 0);
}

function abrirModalCrearPaquete({ onCreated }) {
  openModal({
    title: "Crear Nuevo Paquete",
    panelClass: "max-h-[90vh] flex flex-col",
    bodyClass: "overflow-y-auto pr-1",
    bodyScrollable: true,
    content: `
      <div class="space-y-5">
        <p class="text-sm text-slate-600">
          Registra un paquete en la tabla paquetes.
        </p>
        <form id="modal-form-paquete" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Código del Paquete</label>
            <input name="codigo_paquete" class="input-base w-full" placeholder="Ej: PQT21" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Nombre del Paquete</label>
            <input name="nombre_paquete" class="input-base w-full" placeholder="Ej: Paquete 21" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Descripción</label>
            <input name="descripcion" class="input-base w-full" placeholder="Ej: Contiene registros del 2100 al 2199" required />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Activo</label>
            <select name="activo" class="select-base w-full" required>
              <option value="SI" selected>SI</option>
              <option value="NO">NO</option>
            </select>
          </div>
        </form>
      </div>
    `,
    confirmText: "Guardar Paquete",
    onConfirm: async (close) => {
      const form = document.getElementById("modal-form-paquete");
      const data = Object.fromEntries(new FormData(form).entries());

      const payload = {
        codigo_paquete: String(data.codigo_paquete || "").trim(),
        nombre_paquete: String(data.nombre_paquete || "").trim(),
        descripcion: String(data.descripcion || "").trim(),
        activo: String(data.activo || "SI").trim().toUpperCase() === "NO" ? "NO" : "SI"
      };

      if (!payload.codigo_paquete || !payload.nombre_paquete || !payload.descripcion) {
        showToast("Completa código, nombre y descripción", "warning");
        return;
      }

      const resultado = await crearPaquete(payload);
      if (!resultado?.success) {
        showToast(resultado?.error || "No se pudo crear el paquete", "error");
        return;
      }

      close();
      showToast(resultado?.message || "Paquete creado correctamente", "success");
      onCreated?.();
    }
  });
}

function abrirModalAsignarMasivoAPaquete({ onAsignado, inlineMountId = "", initialPackageId = "" }) {
  openModal({
    inlineMountId,
    title: "Asignación Masiva",
    content: `
      <style>
        .mass-assign-shell { position: relative; }
        .mass-assign-help { 
          background: none; border: none; color: var(--color-primary, #2563eb); 
          cursor: pointer; font-weight: 600; font-size: 14px; text-decoration: underline;
          padding: 0; transition: color 0.15s ease;
        }
        .mass-assign-help:hover { 
          color: var(--color-primary-hover, #1d4ed8); 
        }
        .mass-assign-help-box { 
          display: none; border: 1px solid var(--color-border, #cbd5e1); border-radius: 16px;
          background: var(--color-surface-muted, #f8fafc); padding: 12px 14px;
          color: var(--color-text-muted, #475569); font-size: 13px; line-height: 1.5;
        }
        .mass-assign-help-box.is-visible { display: block; }
        .mass-assign-shell {
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: 100%;
          min-height: 0;
        }
        .mass-assign-table-wrap {
          flex: 1;
          min-height: 220px;
          max-height: 36vh;
          overflow: auto;
          border: 1px solid var(--color-border, #dbe2ea);
          border-radius: 14px;
          background: var(--color-surface, #ffffff);
        }
        .mass-assign-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .mass-assign-table thead th {
          position: sticky; top: 0; z-index: 1; background: #f8fafc; color: #475569;
          text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; font-weight: 700;
          padding: 9px 11px; border-bottom: 1px solid #dbe2ea; text-align: left; white-space: nowrap;
        }
        .mass-assign-table tbody td { padding: 9px 11px; border-bottom: 1px solid #eef2f7; vertical-align: middle; color: #334155; }
        .mass-assign-row { cursor: pointer; transition: background-color 0.18s ease; }
        .mass-assign-row:hover { background: rgba(15, 23, 42, 0.03); }
        .mass-assign-row.is-selected { background: rgba(37, 99, 235, 0.08); box-shadow: inset 3px 0 0 var(--color-primary, #2563eb); }
        .mass-assign-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 102px; padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .mass-assign-badge--available { background: rgba(22, 163, 74, 0.12); color: #15803d; border: 1px solid rgba(22, 163, 74, 0.18); }
        .mass-assign-badge--assigned { background: rgba(249, 115, 22, 0.12); color: #c2410c; border: 1px solid rgba(249, 115, 22, 0.18); }
        .mass-assign-overlay { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; z-index: 30; background: rgba(0, 0, 0, 0.6); border-radius: 24px; backdrop-filter: blur(2px); }
        .mass-assign-overlay.is-visible { display: flex; }
        .mass-assign-overlay-card { min-width: 280px; padding: 24px 28px; border-radius: 20px; background: #ffffff; text-align: center; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.22); }
        .mass-assign-spinner { width: 44px; height: 44px; margin: 0 auto 16px; border-radius: 999px; border: 4px solid rgba(148, 163, 184, 0.28); border-top-color: var(--color-primary, #2563eb); animation: mass-assign-spin 0.8s linear infinite; }
        .mass-assign-page-info { min-width: 132px; text-align: center; }
        .mass-assign-sticky-actions {
          position: sticky;
          bottom: 0;
          z-index: 4;
          padding-top: 10px;
          margin-top: 8px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.86) 0%, #ffffff 28%);
          border-top: 1px solid #e2e8f0;
          backdrop-filter: blur(4px);
        }
        @media (max-width: 1024px) {
          .mass-assign-table-wrap { max-height: 32vh; }
        }
        @media (max-width: 768px) {
          .mass-assign-table-wrap { max-height: 28vh; }
        }
        @keyframes mass-assign-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      </style>

      <div id="mass-assign-shell" class="mass-assign-shell">
        <div id="mass-assign-overlay" class="mass-assign-overlay" aria-hidden="true">
          <div class="mass-assign-overlay-card">
            <div class="mass-assign-spinner"></div>
            <p class="text-lg font-bold text-slate-900">Asignando expedientes...</p>
            <p id="mass-assign-overlay-progress" class="mt-2 text-sm text-slate-500">0 de 0</p>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <button id="mass-assign-help-toggle" type="button" class="mass-assign-help">Ayuda</button>
        </div>

        <div id="mass-assign-help-box" class="mass-assign-help-box">
          Selecciona un paquete destino, usa el buscador para filtrar el padrón cargado en memoria y marca los expedientes que quieras asignar. El sistema conservará tu selección aunque cambies de página o vuelvas a buscar.
        </div>

      <div class="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Paquete Destino *</label>
            <select id="mass-assign-paquete" class="select-base w-full">
              <option value="">-- Selecciona un paquete --</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Buscar</label>
            <input id="mass-assign-search" class="input-base w-full" placeholder="Busca por código, número, año, materia, juzgado..." autocomplete="off" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Año</label>
            <select id="mass-assign-year" class="select-base w-full">
              <option value="">Todos</option>
            </select>
          </div>
          <div class="flex justify-end gap-2">
            <button id="mass-assign-search-btn" type="button" class="btn btn-primary px-5 font-semibold">Buscar</button>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <p id="mass-assign-counter">Mostrando 0 de 0 expediente(s) | Seleccionados: 0</p>
        </div>

        <div id="mass-assign-feedback" class="hidden rounded-2xl p-3 text-sm font-medium"></div>

        <div id="mass-assign-table-wrap" class="mass-assign-table-wrap"></div>

        <div class="mass-assign-sticky-actions">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-center gap-2">
              <button id="mass-assign-prev" type="button" class="btn btn-secondary px-4 text-sm">Anterior</button>
              <div id="mass-assign-page-info" class="mass-assign-page-info rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">Página 1 de 1</div>
              <button id="mass-assign-next" type="button" class="btn btn-secondary px-4 text-sm">Siguiente</button>
            </div>
            <button id="mass-assign-submit" type="button" class="btn btn-primary px-6 font-semibold" disabled>Asignar 0 expediente(s) al paquete</button>
          </div>
        </div>
      </div>
    `,
    panelWidthClass: "max-w-6xl",
    panelClass: "p-3 lg:p-4 h-[78vh] max-h-[78vh] flex flex-col",
    bodyClass: "flex-1 min-h-0 overflow-hidden",
    bodyScrollable: false,
    confirmText: "Cerrar",
    cancelText: "",
    onConfirm: (close) => close(),
    onCancel: (close) => close()
  });

  setTimeout(() => {
    const helpToggle = document.getElementById("mass-assign-help-toggle");
    const helpBox = document.getElementById("mass-assign-help-box");
    const selectPaquete = document.getElementById("mass-assign-paquete");
    const inputSearch = document.getElementById("mass-assign-search");
    const selectYear = document.getElementById("mass-assign-year");
    const btnSearch = document.getElementById("mass-assign-search-btn");
    const counter = document.getElementById("mass-assign-counter");
    const feedback = document.getElementById("mass-assign-feedback");
    const tableWrap = document.getElementById("mass-assign-table-wrap");
    const btnPrev = document.getElementById("mass-assign-prev");
    const btnNext = document.getElementById("mass-assign-next");
    const pageInfo = document.getElementById("mass-assign-page-info");
    const btnSubmit = document.getElementById("mass-assign-submit");
    const overlay = document.getElementById("mass-assign-overlay");
    const overlayProgress = document.getElementById("mass-assign-overlay-progress");

    const state = {
      paquetes: [],
      expedientes: [],
      selectedIds: new Set(),
      searchTerm: "",
      yearFilter: "",
      currentPage: 1,
      currentPackageId: String(initialPackageId || "").trim(),
      isAssigning: false
    };

    const asignadoPor = _obtenerAsignadoPor(usuario);

    const setFeedback = (message = "", type = "info") => {
      if (!feedback) return;
      if (!message) {
        feedback.classList.add("hidden");
        feedback.textContent = "";
        feedback.className = "hidden rounded-2xl p-3 text-sm font-medium";
        return;
      }

      const tones = {
        info: "bg-blue-50 border border-blue-200 text-blue-700",
        success: "bg-green-50 border border-green-200 text-green-700",
        warning: "bg-yellow-50 border border-yellow-200 text-yellow-700",
        error: "bg-red-50 border border-red-200 text-red-700"
      };

      feedback.className = `rounded-2xl p-3 text-sm font-medium ${tones[type] || tones.info}`;
      feedback.textContent = message;
      feedback.classList.remove("hidden");
    };

    const toggleOverlay = (visible, current = 0, total = 0) => {
      if (!overlay || !overlayProgress) return;
      overlay.classList.toggle("is-visible", visible);
      overlay.setAttribute("aria-hidden", visible ? "false" : "true");
      overlayProgress.textContent = `${current} de ${total}`;
    };

    const populatePaquetes = () => {
      if (!selectPaquete) return;
      const currentValue = state.currentPackageId;
      selectPaquete.innerHTML = `
        <option value="">-- Selecciona un paquete --</option>
        ${state.paquetes
          .map((item) => `<option value="${item.id_paquete_archivo}">${_escapeHtml(item.rotulo_paquete)}</option>`)
          .join("")}
      `;
      if (currentValue) {
        selectPaquete.value = currentValue;
      }
    };

    const populateYears = () => {
      if (!selectYear) return;
      const previous = String(state.yearFilter || "").trim();
      const years = Array.from(
        new Set(
          state.expedientes
            .map((item) => String(item.anio || "").trim())
            .filter((year) => /^\d{4}$/.test(year))
        )
      ).sort((a, b) => Number(b) - Number(a));

      selectYear.innerHTML = `
        <option value="">Todos</option>
        ${years.map((year) => `<option value="${year}">${year}</option>`).join("")}
      `;

      if (previous && years.includes(previous)) {
        state.yearFilter = previous;
        selectYear.value = previous;
      } else {
        state.yearFilter = "";
        selectYear.value = "";
      }
    };

    const getFilteredExpedientes = () => {
      return state.expedientes.filter((item) => {
        const disponible = expedienteDisponibleParaAsignacion(item);
        const matchesSearch = !state.searchTerm || _textoBusquedaExpediente(item).includes(state.searchTerm);
        const matchesYear = !state.yearFilter || String(item.anio || "").trim() === state.yearFilter;
        return disponible && matchesSearch && matchesYear;
      });
    };

    const getTotalPages = (filtered) => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    const getVisiblePageItems = (filtered) => {
      const totalPages = getTotalPages(filtered);
      state.currentPage = Math.min(Math.max(state.currentPage, 1), totalPages);
      const start = (state.currentPage - 1) * PAGE_SIZE;
      return filtered.slice(start, start + PAGE_SIZE);
    };

    const getHeaderCheckboxState = (pageItems) => {
      if (pageItems.length === 0) return { checked: false, indeterminate: false };
      const selectedVisible = pageItems.filter((item) => state.selectedIds.has(String(item.id_expediente))).length;
      return {
        checked: selectedVisible > 0 && selectedVisible === pageItems.length,
        indeterminate: selectedVisible > 0 && selectedVisible < pageItems.length
      };
    };

    const renderCounter = (filtered) => {
      if (!counter) return;
      counter.textContent = `Mostrando ${filtered.length} disponible(s) de ${state.expedientes.length} expediente(s) | Seleccionados: ${state.selectedIds.size}`;
    };

    const renderPagination = (filtered) => {
      const totalPages = getTotalPages(filtered);
      if (pageInfo) {
        pageInfo.textContent = `Página ${state.currentPage} de ${totalPages}`;
      }
      if (btnPrev) btnPrev.disabled = state.currentPage <= 1 || state.isAssigning;
      if (btnNext) btnNext.disabled = state.currentPage >= totalPages || state.isAssigning;
    };

    const renderSubmitButton = () => {
      if (!btnSubmit) return;
      const count = state.selectedIds.size;
      btnSubmit.textContent = `Asignar ${count} expediente(s) al paquete`;
      btnSubmit.disabled = state.isAssigning || !state.currentPackageId || count === 0;
    };

    const renderTable = () => {
      if (!tableWrap) return;

      const filtered = getFilteredExpedientes();
      const pageItems = getVisiblePageItems(filtered);
      const headerState = getHeaderCheckboxState(pageItems);

      renderCounter(filtered);
      renderPagination(filtered);
      renderSubmitButton();

      if (state.expedientes.length === 0) {
        tableWrap.innerHTML = `
          <div class="p-10 text-center text-sm text-slate-500">
            <p class="text-base font-semibold text-slate-700">No hay expedientes para mostrar.</p>
          </div>
        `;
        return;
      }

      if (filtered.length === 0) {
        tableWrap.innerHTML = `
          <div class="p-10 text-center text-sm text-slate-500">
            <p class="text-base font-semibold text-slate-700">No hay expedientes disponibles para mostrar.</p>
            <p class="mt-2 text-xs text-slate-500">Los expedientes ya asignados no aparecen en este listado.</p>
          </div>
        `;
        return;
      }

      tableWrap.innerHTML = `
        <div class="mass-assign-table-wrap">
          <table class="mass-assign-table">
            <thead>
              <tr>
                <th>
                  <label class="inline-flex items-center gap-2 cursor-pointer">
                    <input id="mass-assign-select-all" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" ${headerState.checked ? "checked" : ""} />
                    <span>Seleccionar</span>
                  </label>
                </th>
                <th>Estado Asignación</th>
                <th>Código</th>
                <th>Número</th>
                <th>Año</th>
                <th>Materia</th>
                <th>Ubicación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${pageItems.map((expediente) => {
                const id = String(expediente.id_expediente || "").trim();
                const selected = state.selectedIds.has(id);
                const assigned = Boolean(String(expediente.id_paquete || "").trim());
                const ubicacion = _obtenerUbicacionExpediente(expediente) || "—";
                return `
                  <tr class="mass-assign-row ${selected ? "is-selected" : ""}" data-role="mass-row" data-id="${_escapeHtml(id)}">
                    <td>
                      <input type="checkbox" class="mass-assign-row-check h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" data-id="${_escapeHtml(id)}" ${selected ? "checked" : ""} />
                    </td>
                    <td>
                      <span class="mass-assign-badge ${assigned ? "mass-assign-badge--assigned" : "mass-assign-badge--available"}">
                        ${assigned ? "Asignado" : "Disponible"}
                      </span>
                    </td>
                    <td class="font-mono font-semibold text-slate-800">${_escapeHtml(expediente.codigo_expediente_completo || "—")}</td>
                    <td>${_escapeHtml(expediente.numero_expediente || "—")}</td>
                    <td>${_escapeHtml(expediente.anio || "—")}</td>
                    <td>${_escapeHtml(expediente.codigo_materia || "—")}</td>
                    <td>${_escapeHtml(ubicacion)}</td>
                    <td>${_escapeHtml(obtenerEstadoTexto(expediente))}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;

      const selectAll = document.getElementById("mass-assign-select-all");
      if (selectAll) {
        selectAll.indeterminate = headerState.indeterminate;
      }
    };

    const renderAll = () => {
      renderTable();
    };

    const loadData = async ({ preservePackage = true } = {}) => {
      const previousPackage = preservePackage ? state.currentPackageId : "";
      setFeedback("");
      if (tableWrap) {
        tableWrap.innerHTML = `
          <div class="p-10 text-center text-sm text-slate-500">
            <p class="text-base font-semibold text-slate-700">Cargando expedientes...</p>
          </div>
        `;
      }

      try {
        const [resPaquetes, resExpedientes] = await Promise.all([
          listarPaquetesArchivo(),
          expedienteService.listarDelBackend()
        ]);

        if (!resPaquetes?.success) throw new Error(resPaquetes?.error || "No se pudieron cargar los paquetes archivo");
        if (!resExpedientes?.success) throw new Error(resExpedientes?.message || "No se pudieron cargar los expedientes");

        state.paquetes = Array.isArray(resPaquetes.data) ? resPaquetes.data : [];
        state.expedientes = Array.isArray(resExpedientes.data) ? resExpedientes.data : [];
        state.selectedIds.clear();
        state.currentPage = 1;
        state.currentPackageId = previousPackage;

        populatePaquetes();
        populateYears();
        renderAll();
      } catch (error) {
        state.paquetes = [];
        state.expedientes = [];
        state.selectedIds.clear();
        state.currentPage = 1;
        populatePaquetes();
        populateYears();
        renderAll();
        setFeedback(error.message || "Error cargando datos del modal", "error");
      }
    };

    const toggleSelection = (id, checked) => {
      if (!id) return;
      if (checked) state.selectedIds.add(id);
      else state.selectedIds.delete(id);
      renderAll();
    };

    const toggleVisiblePageSelection = (checked) => {
      const filtered = getFilteredExpedientes();
      const pageItems = getVisiblePageItems(filtered);
      pageItems.forEach((item) => {
        const id = String(item.id_expediente || "").trim();
        if (!id) return;
        if (checked) state.selectedIds.add(id);
        else state.selectedIds.delete(id);
      });
      renderAll();
    };

    const assignSelected = async () => {
      if (state.isAssigning) return;
      if (!state.currentPackageId) {
        showToast("Selecciona un paquete destino", "warning");
        return;
      }

      const ids = Array.from(state.selectedIds);
      if (ids.length === 0) {
        showToast("Selecciona al menos un expediente", "warning");
        return;
      }

      state.isAssigning = true;
      renderSubmitButton();
      toggleOverlay(true, 0, ids.length);
      setFeedback("");

      let successCount = 0;
      let failedCount = 0;
      let primerFallo = "";

      try {
        const resLote = await asignarExpedientesAPaqueteLote({
          ids_expedientes: ids,
          id_paquete_archivo: state.currentPackageId,
          asignado_por: asignadoPor
        });

        if (!resLote?.success) {
          throw new Error(resLote?.error || "No se pudo asignar el lote de expedientes");
        }

        const resultados = Array.isArray(resLote.data) ? resLote.data : [];
        successCount = resultados.filter((item) => item?.success).length;
        failedCount = Math.max(ids.length - successCount, 0);
        primerFallo = resultados.find((item) => !item?.success)?.mensaje || "";
        toggleOverlay(true, ids.length, ids.length);
      } finally {
        state.isAssigning = false;
        toggleOverlay(false, ids.length, ids.length);
      }

      if (successCount > 0) {
        showToast(`${successCount} expedientes asignados correctamente`, "success");
      }
      if (failedCount > 0) {
        showToast(`${failedCount} expedientes no pudieron asignarse`, "warning");
        setFeedback(primerFallo || `No se pudieron asignar ${failedCount} expediente(s). El proceso continuó con los demás.`, "warning");
      } else {
        setFeedback("Asignación masiva completada correctamente.", "success");
      }

      await loadData({ preservePackage: true });
      renderSubmitButton();
      onAsignado?.();
    };

    helpToggle?.addEventListener("click", () => {
      helpBox?.classList.toggle("is-visible");
    });

    selectPaquete?.addEventListener("change", (event) => {
      state.currentPackageId = String(event.target.value || "").trim();
      renderAll();
    });

    btnSearch?.addEventListener("click", () => {
      state.searchTerm = _normalizarTextoBusqueda(inputSearch?.value || "");
      state.currentPage = 1;
      renderAll();
    });

    selectYear?.addEventListener("change", (event) => {
      state.yearFilter = String(event.target.value || "").trim();
      state.currentPage = 1;
      renderAll();
    });

    inputSearch?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      state.searchTerm = _normalizarTextoBusqueda(inputSearch?.value || "");
      state.currentPage = 1;
      renderAll();
    });

    btnPrev?.addEventListener("click", () => {
      if (state.currentPage <= 1) return;
      state.currentPage -= 1;
      renderAll();
    });

    btnNext?.addEventListener("click", () => {
      const totalPages = getTotalPages(getFilteredExpedientes());
      if (state.currentPage >= totalPages) return;
      state.currentPage += 1;
      renderAll();
    });

    btnSubmit?.addEventListener("click", () => {
      assignSelected();
    });

    tableWrap?.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;

      if (target.id === "mass-assign-select-all") {
        toggleVisiblePageSelection(target.checked);
        return;
      }

      if (target.classList.contains("mass-assign-row-check")) {
        toggleSelection(String(target.dataset.id || "").trim(), target.checked);
      }
    });

    tableWrap?.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("input, button, label")) return;

      const row = target.closest('[data-role="mass-row"]');
      if (!row) return;

      const id = String(row.getAttribute("data-id") || "").trim();
      if (!id) return;
      toggleSelection(id, !state.selectedIds.has(id));
    });

    state.currentPackageId = "";
    populatePaquetes();
    loadData({ preservePackage: false });
  }, 0);
}

function abrirModalCrearContinuacion({ paquetes, onCreated }) {
  const paqueteOptions = paquetes
    .map((p) => `<option value="${p.id}">${p.codigo} — ${p.descripcion}</option>`)
    .join("");

  openModal({
    title: "Crear Continuación de Paquete",
    content: `
      <div class="space-y-5">
        <p class="text-sm text-slate-600">
          Crea una continuación vinculada a un paquete existente.
        </p>
        <form id="modal-form-continuacion" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Paquete Base</label>
            <select class="select-base w-full" name="paqueteBaseId" required>
              <option value="">-- Selecciona un paquete --</option>
              ${paqueteOptions}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Descripción (Opcional)</label>
            <input name="descripcion" class="input-base w-full" placeholder="Notas adicionales" />
          </div>
        </form>
      </div>
    `,
    confirmText: "Crear Continuación",
    onConfirm: (close) => {
      const form = document.getElementById("modal-form-continuacion");
      const data = Object.fromEntries(new FormData(form).entries());
      const nuevo = paqueteService.crearContinuacion(data);
      if (!nuevo) {
        showToast("❌ No se pudo crear la continuación", "error");
        return;
      }
      close();
      showToast(`✅ Continuación creada: ${nuevo.codigo}`, "success");
      onCreated?.();
    }
  });
}

function abrirModalAsignacion({ paquetes, expedientes, onAssigned }) {
  const disponibles = expedientes.filter((item) => !expedienteTienePaquete(item));
  const usuario = _getUsuario();
  const asignadoPor = usuario ? _obtenerAsignadoPor(usuario) : "SISTEMA";

  if (!disponibles.length) {
    showToast("No hay expedientes disponibles sin paquete", "warning");
    return;
  }

  const paqueteOptions = paquetes
    .map((p) => `<option value="${p.id_paquete_archivo || p.id}">${p.rotulo_paquete || p.codigo} — ${p.descripcion || ""}</option>`)
    .join("");

  const buildExpOptions = (lista) => lista
    .map((e) => `<option value="${e.id_expediente || e.id}">${numeroExpedienteLabel(e)}</option>`)
    .join("");

  openModal({
    title: "Asignar Expediente a Paquete",
    content: `
      <div class="space-y-5">
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            🔍 Buscar por Código
          </label>
          <input 
            id="asig-buscar" 
            class="input-base w-full" 
            placeholder="Ej: 00059-2019-0-3101-JR-CI-01" 
            type="text"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            📄 Expedientes Disponibles
          </label>
          <select 
            id="asig-expediente" 
            class="select-base w-full"
          >
            ${buildExpOptions(disponibles)}
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            📦 Paquete Destino
          </label>
          <select id="asig-paquete" class="select-base w-full">
            ${paqueteOptions}
          </select>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded p-3">
          <p id="asig-info" class="text-xs text-slate-600 font-medium">
            💡 Puedes buscar por código o seleccionar de la lista. Se mostrarán ${disponibles.length} expediente(s) disponible(s).
          </p>
        </div>
      </div>
    `,
    confirmText: "Asignar Expediente",
    onConfirm: async (close) => {
      const expedienteId = document.getElementById("asig-expediente")?.value;
      const paqueteId = document.getElementById("asig-paquete")?.value;

      if (!expedienteId || !paqueteId) {
        showToast("Selecciona expediente y paquete", "warning");
        return;
      }

      try {
        const res = await asignarExpedienteAPaquete({
          id_expediente: String(expedienteId).trim(),
          id_paquete_archivo: String(paqueteId).trim(),
          asignado_por: asignadoPor
        });

        if (!res?.success) {
          throw new Error(res?.error || "No se pudo asignar el expediente");
        }
      } catch (error) {
        showToast(error.message || "No se pudo asignar el expediente", "error");
        return;
      }

      close();
      showToast("✅ Expediente asignado al paquete", "success");
      onAssigned?.();
    }
  });

  setTimeout(() => {
    const buscarInput = document.getElementById("asig-buscar");
    const selectExp = document.getElementById("asig-expediente");
    const info = document.getElementById("asig-info");

    if (!buscarInput || !selectExp) return;

    const refrescarOpciones = () => {
      const query = String(buscarInput.value || "").trim().toLowerCase();
      const filtrados = query
        ? disponibles.filter((e) => numeroExpedienteLabel(e).toLowerCase().includes(query))
        : disponibles;

      selectExp.innerHTML = buildExpOptions(filtrados);
      info.textContent = filtrados.length
        ? `✨ Se encontraron ${filtrados.length} expediente(s) disponible(s)`
        : "❌ Sin coincidencias para esa búsqueda";
    };

    buscarInput.addEventListener("input", refrescarOpciones);
  }, 0);
}

export async function initPaquetesPage({ mountNode }) {
  let page = 1;
  let paquetes = paqueteService.listarSync();
  let expedientes = expedienteService.listar();
  let paquetesArchivo = [];
  let materias = [];
  let responsables = [];
  let paquetesArchivoInFlight = null;
  let paquetesArchivoLastLoadedAt = 0;
  let catalogosPaquetesInFlight = null;
  let catalogosPaquetesLastLoadedAt = 0;
  const PAQUETES_ARCHIVO_CACHE_MS = 90000;
  const tabs = {
    listado: "tab-panel-listado",
    archivo: "tab-panel-archivo",
    asignar: "tab-panel-asignar",
    quitar: "tab-panel-quitar",
    colores: "tab-panel-colores"
  };
  const tabState = {
    active: "listado",
    initialized: {
      listado: false,
      archivo: false,
      asignar: false,
      quitar: false,
      colores: false
    }
  };

  const pintarBotonTabActivo = (tabKey) => {
    const map = {
      listado: "btn-listado-paquetes",
      archivo: "btn-listado-paquetes-archivo",
      asignar: "btn-asignar-exp-manual",
      quitar: "btn-quitar-exp-manual",
      colores: "btn-listado-colores-especialistas"
    };

    Object.values(map).forEach((value) => {
      const ids = Array.isArray(value) ? value : [value];
      ids.forEach((id) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.classList.remove("ring-2", "ring-blue-400", "ring-offset-2");
      });
    });

    const activos = map[tabKey];
    (Array.isArray(activos) ? activos : [activos]).forEach((id) => {
      const btn = document.getElementById(id);
      btn?.classList.add("ring-2", "ring-blue-400", "ring-offset-2");
    });
  };

  const inicializarTabSiHaceFalta = async (tabKey) => {
    const panelId = tabs[tabKey];
    const panel = panelId ? document.getElementById(panelId) : null;
    if (tabState.initialized[tabKey] && panel && panel.children.length > 0) return;

    switch (tabKey) {
      case "listado":
        abrirModalListadoPaquetes(tabs.listado);
        break;
      case "archivo": {
        const panelArchivo = document.getElementById(tabs.archivo);
        if (panelArchivo && !panelArchivo.dataset.rendered) {
          panelArchivo.innerHTML = `
            <div class="h-full min-h-0 flex flex-col gap-3">
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-lg font-bold text-slate-900">Listado de Paquetes para Archivo</h3>
                <button id="btn-recargar-paquetes-archivo" type="button" class="btn btn-secondary text-sm px-3 py-1.5">Recargar</button>
              </div>
              <div id="tabla-paquetes-archivo-tab" class="flex-1 min-h-0 overflow-auto"></div>
            </div>
          `;
          panelArchivo.dataset.rendered = "1";
          panelArchivo.querySelector("#btn-recargar-paquetes-archivo")?.addEventListener("click", async () => {
            await cargarPaquetesArchivo({ forceRefresh: true });
            showToast("Listado de paquetes para archivo actualizado", "success");
          });
        }
        await cargarPaquetesArchivo();
        break;
      }
      case "asignar":
          await cargarPaquetesArchivo();
        abrirModalAsignarExpedienteManual(paquetesArchivo, () => cargarPaquetesArchivo({ forceRefresh: true }), tabs.asignar);
        break;
      case "quitar":
          await cargarPaquetesArchivo();
        abrirModalQuitarExpedienteManual(paquetesArchivo, () => cargarPaquetesArchivo({ forceRefresh: true }), tabs.quitar);
        break;
      case "colores":
          await cargarCatalogosPaquetes();
        abrirModalColoresYEspecialistas(tabs.colores);
        break;
      default:
        break;
    }

    tabState.initialized[tabKey] = true;
  };

  const activarTab = async (tabKey) => {
    tabState.active = tabKey;

    Object.values(tabs).forEach((panelId) => {
      const panel = document.getElementById(panelId);
      if (!panel) return;
      panel.classList.add("hidden");
    });

    const panelActivo = document.getElementById(tabs[tabKey]);
    panelActivo?.classList.remove("hidden");

    await inicializarTabSiHaceFalta(tabKey);
    pintarBotonTabActivo(tabKey);
  };

  const obtenerPaquetesActivosRapido = async () => {
    const cache = paqueteService.listarSync();
    if (cache.length > 0) {
      paquetes = cache;
      // Refresca en segundo plano sin bloquear UI.
      paqueteService.listar().then((fresh) => {
        paquetes = fresh;
      }).catch((err) => {
        console.warn("Error refrescando paquetes activos:", err);
      });
      return cache;
    }

    const fresh = await paqueteService.listar();
    paquetes = fresh;
    return fresh;
  };

  const refrescarData = async () => {
    paquetes = await paqueteService.listar();
    expedientes = expedienteService.listar();
  };

  const cargarPaquetesArchivo = async ({ forceRefresh = false } = {}) => {
    const pintarCargandoPaquetes = (targetId) => {
      const nodo = document.getElementById(targetId);
      if (!nodo) return;
      nodo.innerHTML = `
        <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Llamando los datos de paquetes...
        </div>
      `;
    };

    const cacheVigente = paquetesArchivoLastLoadedAt > 0 && (Date.now() - paquetesArchivoLastLoadedAt) < PAQUETES_ARCHIVO_CACHE_MS;

    if (!forceRefresh && cacheVigente && paquetesArchivo.length) {
      renderTablaPaquetesArchivo(paquetesArchivo, "tabla-paquetes-archivo");
      renderTablaPaquetesArchivo(paquetesArchivo, "tabla-paquetes-archivo-tab");
      return {
        success: true,
        data: paquetesArchivo
      };
    }

    if (!forceRefresh && paquetesArchivoInFlight) {
      return paquetesArchivoInFlight;
    }

    pintarCargandoPaquetes("tabla-paquetes-archivo");
    pintarCargandoPaquetes("tabla-paquetes-archivo-tab");

    paquetesArchivoInFlight = (async () => {
    const paqResult = await listarPaquetesArchivo();

    if (paqResult?.success) {
      paquetesArchivo = Array.isArray(paqResult.data) ? paqResult.data : [];
    } else {
      const errorPaq = paqResult?.error || "Respuesta invalida de listarPaquetesArchivo";
      console.warn("Error cargando paquetes archivo:", errorPaq);
      paquetesArchivo = [];
    }

    paquetesArchivoLastLoadedAt = Date.now();

    renderTablaPaquetesArchivo(paquetesArchivo, "tabla-paquetes-archivo");
    renderTablaPaquetesArchivo(paquetesArchivo, "tabla-paquetes-archivo-tab");

    return {
      success: true,
      data: paquetesArchivo
    };
    })();

    try {
      return await paquetesArchivoInFlight;
    } finally {
      paquetesArchivoInFlight = null;
    }
  };

  const cargarCatalogosPaquetes = async ({ forceRefresh = false } = {}) => {
    const cacheVigente = catalogosPaquetesLastLoadedAt > 0 && (Date.now() - catalogosPaquetesLastLoadedAt) < PAQUETES_ARCHIVO_CACHE_MS;

    if (!forceRefresh && cacheVigente && materias.length && responsables.length) {
      return { success: true, materias, responsables };
    }

    if (!forceRefresh && catalogosPaquetesInFlight) {
      return catalogosPaquetesInFlight;
    }

    catalogosPaquetesInFlight = (async () => {
      const [matResult, respResult] = await Promise.allSettled([
        listarMateriasActivas(),
        listarResponsablesActivos()
      ]);

      if (matResult.status === "fulfilled" && matResult.value?.success) {
        materias = Array.isArray(matResult.value.data) ? matResult.value.data : [];
      } else {
        const errorMat =
          matResult.status === "fulfilled"
            ? matResult.value?.error || "Respuesta invalida de listarMateriasActivas"
            : matResult.reason?.message || "Fallo de red en listarMateriasActivas";
        console.warn("No se pudieron cargar materias activas:", errorMat);
        materias = [];
      }

      if (respResult.status === "fulfilled" && respResult.value?.success) {
        responsables = Array.isArray(respResult.value.data) ? respResult.value.data : [];
      } else {
        const errorResp =
          respResult.status === "fulfilled"
            ? respResult.value?.error || "Respuesta invalida de listarResponsablesActivos"
            : respResult.reason?.message || "Fallo de red en listarResponsablesActivos";
        console.warn("No se pudieron cargar responsables activos:", errorResp);
        responsables = [];
      }

      catalogosPaquetesLastLoadedAt = Date.now();
      return { success: true, materias, responsables };
    })();

    try {
      return await catalogosPaquetesInFlight;
    } finally {
      catalogosPaquetesInFlight = null;
    }
  };

  const abrirModalCrearPaqueteArchivo = (materiasActivas, paquetesActivos, onCreated) => {
    const opcionesMaterias = (materiasActivas || [])
      .map((item) => `<option value="${_escapeHtml(item.id_materia)}">${_escapeHtml(item.nombre_materia || item.abreviatura || item.id_materia)}</option>`)
      .join("");
    const opcionesPaquetes = (paquetesActivos || [])
      .map((item) => `<option value="${_escapeHtml(item.id || item.codigo)}">${_escapeHtml(item.codigo)} - ${_escapeHtml(item.descripcion || "")}</option>`)
      .join("");

    openModal({
      title: "Crear Paquete de Archivo",
      content: `
        <form id="form-crear-paquete-archivo" class="space-y-4">
          <input type="hidden" name="color_especialista" value="GRIS" />
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Año</label>
              <input name="anio" class="input-base w-full" value="${new Date().getFullYear()}" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Materia</label>
            <select name="id_materia" class="select-base w-full">
              <option value="">-- Selecciona --</option>
              ${opcionesMaterias}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Paquete Base</label>
            <select name="id_paquete" class="select-base w-full">
              <option value="">-- Selecciona --</option>
              ${opcionesPaquetes}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Descripción</label>
            <textarea name="descripcion" class="input-base w-full min-h-24" placeholder="Detalle opcional del paquete"></textarea>
          </div>
        </form>
      `,
      confirmText: "Guardar",
      cancelText: "Cancelar",
      onConfirm: async (close) => {
        const form = document.getElementById("form-crear-paquete-archivo");
        const data = Object.fromEntries(new FormData(form).entries());

        const resultado = await crearPaqueteArchivo({
          anio: String(data.anio || "").trim(),
          id_materia: String(data.id_materia || "").trim(),
          id_paquete: String(data.id_paquete || "").trim(),
          color_especialista: String(data.color_especialista || "").trim(),
          descripcion: String(data.descripcion || "").trim()
        });

        if (!resultado?.success) {
          showToast(resultado?.error || "No se pudo crear el paquete archivo", "error");
          return;
        }

        close();
        showToast("Paquete archivo creado correctamente", "success");
        onCreated?.();
      }
    });
  };

  const abrirModalExpedientesPaquete = (paqueteArchivo) => {
    openModal({
      title: `Expedientes - ${paqueteArchivo.rotulo_paquete || paqueteArchivo.id_paquete_archivo}`,
      content: `
        <div id="detalle-expedientes-paquete" class="space-y-3">
          <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Cargando expedientes...</div>
        </div>
      `,
      confirmText: "Cerrar",
      cancelText: "",
      onConfirm: (close) => close(),
      onCancel: (close) => close()
    });

    setTimeout(async () => {
      const contenedor = document.getElementById("detalle-expedientes-paquete");
      if (!contenedor) return;

      try {
        const resultado = await listarExpedientesPorPaquete(paqueteArchivo.id_paquete_archivo);
        if (!resultado?.success) {
          throw new Error(resultado?.error || "No se pudieron cargar los expedientes del paquete");
        }

        const filas = Array.isArray(resultado.data) ? resultado.data : [];
        if (filas.length === 0) {
          contenedor.innerHTML = `<div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Este paquete no tiene expedientes asignados.</div>`;
          return;
        }

        contenedor.innerHTML = `
          <div class="max-h-[55vh] overflow-auto rounded-xl border border-slate-200">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-bold uppercase text-slate-600">Código</th>
                  <th class="px-3 py-2 text-left text-xs font-bold uppercase text-slate-600">Número</th>
                  <th class="px-3 py-2 text-left text-xs font-bold uppercase text-slate-600">Año</th>
                  <th class="px-3 py-2 text-left text-xs font-bold uppercase text-slate-600">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filas.map((item) => {
                  const expediente = item.expediente || {};
                  return `
                    <tr>
                      <td class="px-3 py-2 font-mono text-xs text-slate-700">${_escapeHtml(expediente.codigo_expediente_completo || "-")}</td>
                      <td class="px-3 py-2 text-slate-700">${_escapeHtml(expediente.numero_expediente || "-")}</td>
                      <td class="px-3 py-2 text-slate-700">${_escapeHtml(expediente.anio || "-")}</td>
                      <td class="px-3 py-2 text-slate-500">${_escapeHtml(obtenerEstadoTexto(expediente))}</td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        `;
      } catch (error) {
        contenedor.innerHTML = `<div class="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">${_escapeHtml(error.message || "No se pudieron cargar los expedientes")}</div>`;
      }
    }, 0);
  };

  const abrirModalAsignarUbicacionPaquete = (paqueteInicialId = "") => {
    const ubicacionesActivas = ubicacionConfigService
      .listar()
      .filter((item) => item.activo)
      .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));

    openModal({
      title: "Asignar ubicación a un paquete",
      content: `
        <div class="space-y-4">
          <div class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Selecciona un paquete del archivo modular, revisa sus expedientes y define la ubicación física donde será guardado.
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Paquete</label>
              <select id="modal-paquete-ubicacion" class="select-base w-full">
                <option value="">-- Selecciona un paquete --</option>
                ${(paquetesArchivo || []).map((item) => `<option value="${_escapeHtml(item.id_paquete_archivo || "")}" ${String(item.id_paquete_archivo || "") === String(paqueteInicialId || "") ? "selected" : ""}>${_escapeHtml(item.rotulo_paquete || item.id_paquete_archivo || "-")}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Ubicación destino</label>
              <select id="modal-ubicacion-paquete" class="select-base w-full">
                <option value="">-- Selecciona ubicación --</option>
                ${ubicacionesActivas.map((item) => `<option value="${_escapeHtml(item.nombre || item.codigo || "")}">${_escapeHtml(item.nombre || item.codigo || "-")}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-white p-4">
            <div class="flex items-center justify-between gap-3 mb-3">
              <h4 class="text-sm font-bold text-slate-900">Expedientes del paquete</h4>
              <span id="modal-paquete-ubicacion-counter" class="text-xs font-semibold text-slate-500">Selecciona un paquete</span>
            </div>
            <div id="modal-paquete-ubicacion-detalle" class="max-h-[40vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 text-center">
              Selecciona un paquete para visualizar sus expedientes.
            </div>
          </div>
        </div>
      `,
      confirmText: "Asignar ubicación",
      cancelText: "Cancelar",
      onConfirm: (close) => {
        const paqueteId = String(document.getElementById("modal-paquete-ubicacion")?.value || "").trim();
        const ubicacion = String(document.getElementById("modal-ubicacion-paquete")?.value || "").trim();

        if (!paqueteId) {
          showToast("Selecciona un paquete", "warning");
          return;
        }

        if (!ubicacion) {
          showToast("Selecciona una ubicación", "warning");
          return;
        }

        showToast(`Ubicación seleccionada: ${ubicacion}. Falta conectar guardado en backend.`, "info");
        close();
      }
    });

    setTimeout(() => {
      const selectPaquete = document.getElementById("modal-paquete-ubicacion");
      const detalle = document.getElementById("modal-paquete-ubicacion-detalle");
      const counter = document.getElementById("modal-paquete-ubicacion-counter");

      const renderExpedientesPaquete = async () => {
        const paqueteId = String(selectPaquete?.value || "").trim();
        if (!detalle || !counter) return;

        if (!paqueteId) {
          counter.textContent = "Selecciona un paquete";
          detalle.className = "max-h-[40vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 text-center";
          detalle.innerHTML = "Selecciona un paquete para visualizar sus expedientes.";
          return;
        }

        detalle.className = "max-h-[40vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 text-center";
        detalle.innerHTML = "Cargando expedientes del paquete...";

        try {
          const resultado = await listarExpedientesPorPaquete(paqueteId);
          if (!resultado?.success) {
            throw new Error(resultado?.error || "No se pudieron cargar los expedientes del paquete");
          }

          const filas = Array.isArray(resultado.data) ? resultado.data : [];
          counter.textContent = `${filas.length} expediente(s)`;

          if (!filas.length) {
            detalle.innerHTML = "Este paquete no tiene expedientes asignados.";
            return;
          }

          detalle.className = "max-h-[40vh] overflow-auto rounded-lg border border-slate-200 bg-white";
          detalle.innerHTML = `
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-bold uppercase text-slate-600">Código</th>
                  <th class="px-3 py-2 text-left text-xs font-bold uppercase text-slate-600">Número</th>
                  <th class="px-3 py-2 text-left text-xs font-bold uppercase text-slate-600">Estado</th>
                  <th class="px-3 py-2 text-left text-xs font-bold uppercase text-slate-600">Ubicación actual</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filas.map((item) => {
                  const expediente = item.expediente || {};
                  return `
                    <tr>
                      <td class="px-3 py-2 font-mono text-xs text-slate-700">${_escapeHtml(expediente.codigo_expediente_completo || "-")}</td>
                      <td class="px-3 py-2 text-slate-700">${_escapeHtml(expediente.numero_expediente || "-")}</td>
                      <td class="px-3 py-2 text-slate-500">${_escapeHtml(obtenerEstadoTexto(expediente))}</td>
                      <td class="px-3 py-2 text-slate-500">${_escapeHtml(expediente.nombre_ubicacion || expediente.ubicacion_texto || expediente.id_ubicacion_actual || "-")}</td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          `;
        } catch (error) {
          counter.textContent = "Error";
          detalle.className = "max-h-[40vh] overflow-auto rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700";
          detalle.innerHTML = _escapeHtml(error.message || "No se pudieron cargar los expedientes del paquete");
        }
      };

      selectPaquete?.addEventListener("change", renderExpedientesPaquete);
      renderExpedientesPaquete();
    }, 0);
  };

  const renderTablaPaquetesArchivo = (lista, targetId = "tabla-paquetes-archivo") => {
    const contenedor = document.getElementById(targetId);
    if (!contenedor) return;

    const rows = (Array.isArray(lista) ? lista : []).map((item) => ({
      codigo: `<div class="font-semibold text-slate-800">${_escapeHtml(item.rotulo_paquete || "-")}</div><div class="text-xs text-slate-500">${_escapeHtml(item.id_paquete_archivo || "-")}</div>`,
      especialista: _escapeHtml(item.especialista || item.responsable || item.color_especialista || "-"),
      totalExpedientes: _escapeHtml(item.total_expedientes || item.cantidad_expedientes || item.expedientes_count || "-"),
      estado: String(item.id_ubicacion || item.ubicacion_texto || "").trim()
        ? `<span class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">ARCHIVADO</span>`
        : `<span class="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">ASIGNADO</span>`,
      fecha: _escapeHtml(_formatearFechaCorta(item.fecha_actualizacion || item.fecha_creacion || "")),
      ubicacion: _escapeHtml(item.ubicacion_texto || "Sin ubicación"),
      acciones: `
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn btn-secondary text-xs px-3 inline-flex items-center gap-1.5" data-action="ver-expedientes" data-paquete="${_escapeHtml(item.id_paquete_archivo || "")}">
            ${icon("eye", "w-3.5 h-3.5")}
            <span>Listado de expedientes</span>
          </button>
          <button type="button" class="btn btn-secondary text-xs px-3 inline-flex items-center gap-1.5" data-action="asignar-masivo" data-paquete="${_escapeHtml(item.id_paquete_archivo || "")}">
            ${icon("transfer", "w-3.5 h-3.5")}
            <span>Asignación masiva</span>
          </button>
          <button type="button" class="btn btn-secondary text-xs px-3 inline-flex items-center gap-1.5" data-action="ver-rotulo" data-paquete="${_escapeHtml(item.id_paquete_archivo || "")}">
            ${icon("bookOpen", "w-3.5 h-3.5")}
            <span>Rótulo</span>
          </button>
          ${String(item.id_ubicacion || item.ubicacion_texto || "").trim()
            ? `<button type="button" class="btn btn-secondary text-xs px-3 inline-flex items-center gap-1.5" data-action="mover-ubicacion" data-paquete="${_escapeHtml(item.id_paquete_archivo || "")}">📦 <span>Mover</span></button>`
            : `<button type="button" class="btn btn-primary text-xs px-3 inline-flex items-center gap-1.5" data-action="ubicar-paquete" data-paquete="${_escapeHtml(item.id_paquete_archivo || "")}">📍 <span>Ubicar</span></button>`}
        </div>
      `
    }));

    contenedor.innerHTML = renderTable({
      columns: [
        { key: "codigo", label: "Código" },
        { key: "especialista", label: "Especialista" },
        { key: "totalExpedientes", label: "Total Expedientes" },
        { key: "estado", label: "Estado" },
        { key: "fecha", label: "Fecha" },
        { key: "ubicacion", label: "Ubicación" },
        { key: "acciones", label: "Acciones" }
      ],
      rows,
      emptyText: "No hay paquetes archivo registrados"
    });

    contenedor.querySelectorAll('[data-action="ver-expedientes"]').forEach((button) => {
      button.addEventListener("click", () => {
        const paquete = paquetesArchivo.find((item) => String(item.id_paquete_archivo || "") === String(button.dataset.paquete || ""));
        if (!paquete) {
          showToast("No se encontró el paquete seleccionado", "warning");
          return;
        }
        abrirModalExpedientesPaquete(paquete);
      });
    });

    contenedor.querySelectorAll('[data-action="asignar-masivo"]').forEach((button) => {
      button.addEventListener("click", () => {
        abrirModalAsignarMasivoAPaquete({
          onAsignado: () => cargarPaquetesArchivo({ forceRefresh: true }),
          initialPackageId: String(button.dataset.paquete || "").trim()
        });
      });
    });

    contenedor.querySelectorAll('[data-action="ver-rotulo"]').forEach((button) => {
      button.addEventListener("click", () => {
        const paquete = paquetesArchivo.find((item) => String(item.id_paquete_archivo || "") === String(button.dataset.paquete || ""));
        if (!paquete) {
          showToast("No se encontró el paquete seleccionado", "warning");
          return;
        }

        openModal({
          title: `<div class="w-full text-center text-lg font-bold text-slate-900">Rótulo del paquete</div>`,
          content: `
            <div class="space-y-3 text-sm text-slate-700">
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p><span class="font-semibold">ID:</span> ${_escapeHtml(paquete.id_paquete_archivo || "-")}</p>
                <p class="mt-1"><span class="font-semibold">Rótulo:</span> ${_escapeHtml(paquete.rotulo_paquete || "-")}</p>
              </div>
              <div id="rotulo-preview-shell" class="rounded-xl border border-slate-200 bg-white p-4">
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Vista previa del diseño</p>
                <div class="mt-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4">
                  <p class="text-lg font-extrabold text-slate-900">${_escapeHtml(paquete.rotulo_paquete || "SIN ROTULO")}</p>
                  <p class="mt-1 text-xs text-slate-500">${_escapeHtml(paquete.id_paquete_archivo || "-")}</p>
                </div>
              </div>
              <div class="rounded-xl border border-slate-200 bg-white p-4">
                <p><span class="font-semibold">Año:</span> ${_escapeHtml(paquete.anio || "-")}</p>
                <p class="mt-1"><span class="font-semibold">Materia:</span> ${_escapeHtml(paquete.id_materia || "-")}</p>
                <p class="mt-1"><span class="font-semibold">Paquete:</span> ${_escapeHtml(paquete.id_paquete || "-")}</p>
                <p class="mt-1"><span class="font-semibold">Grupo:</span> ${_escapeHtml(paquete.grupo || "-")}</p>
                <p class="mt-1"><span class="font-semibold">Color:</span> ${_escapeHtml(paquete.color_especialista || "-")}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button id="btn-ver-diseno-rotulo" type="button" class="btn btn-secondary text-xs px-3 inline-flex items-center gap-1.5">${icon("eye", "w-3.5 h-3.5")}<span>Ver diseño</span></button>
                <button id="btn-imprimir-rotulo" type="button" class="btn btn-primary text-xs px-3 inline-flex items-center gap-1.5">${icon("download", "w-3.5 h-3.5")}<span>Imprimir</span></button>
              </div>
            </div>
          `,
          confirmText: "Cerrar",
          cancelText: "",
          onConfirm: (close) => close(),
          onCancel: (close) => close()
        });

        setTimeout(() => {
          const vista = document.getElementById("rotulo-preview-shell");
          const btnVer = document.getElementById("btn-ver-diseno-rotulo");
          const btnImprimir = document.getElementById("btn-imprimir-rotulo");

          btnVer?.addEventListener("click", () => {
            vista?.scrollIntoView({ behavior: "smooth", block: "start" });
          });

          btnImprimir?.addEventListener("click", () => {
            const w = window.open("", "_blank", "width=900,height=700");
            if (!w) {
              showToast("No se pudo abrir la vista de impresión", "warning");
              return;
            }

            const rotulo = _escapeHtml(paquete.rotulo_paquete || "SIN ROTULO");
            const id = _escapeHtml(paquete.id_paquete_archivo || "-");
            const anio = _escapeHtml(paquete.anio || "-");
            const materia = _escapeHtml(paquete.id_materia || "-");
            const grupo = _escapeHtml(paquete.grupo || "-");
            const color = _escapeHtml(paquete.color_especialista || "-");

            w.document.write(`
              <!doctype html>
              <html>
                <head>
                  <meta charset="utf-8" />
                  <title>Rótulo ${id}</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
                    .label { border: 2px solid #334155; border-radius: 12px; padding: 20px; max-width: 720px; }
                    .title { font-size: 28px; font-weight: 800; letter-spacing: 0.04em; }
                    .meta { margin-top: 10px; font-size: 14px; color: #334155; }
                    .meta p { margin: 4px 0; }
                    @media print { body { margin: 0; padding: 12mm; } }
                  </style>
                </head>
                <body>
                  <div class="label">
                    <div class="title">${rotulo}</div>
                    <div class="meta">
                      <p><strong>ID:</strong> ${id}</p>
                      <p><strong>Año:</strong> ${anio}</p>
                      <p><strong>Materia:</strong> ${materia}</p>
                      <p><strong>Grupo:</strong> ${grupo}</p>
                      <p><strong>Color:</strong> ${color}</p>
                    </div>
                  </div>
                  <script>
                    window.onload = function () { window.print(); };
                  </script>
                </body>
              </html>
            `);
            w.document.close();
          });
        }, 0);
      });
    });

    contenedor.querySelectorAll('[data-action="ubicar-paquete"]').forEach((button) => {
      button.addEventListener("click", () => {
        const paquete = paquetesArchivo.find((item) => String(item.id_paquete_archivo || "") === String(button.dataset.paquete || ""));
        if (!paquete) {
          showToast("No se encontró el paquete seleccionado", "warning");
          return;
        }
        abrirModalAsignarUbicacionPaqueteComponente({
          paquete,
          onSuccess: async () => {
            await cargarPaquetesArchivo({ forceRefresh: true });
          }
        });
      });
    });

    contenedor.querySelectorAll('[data-action="mover-ubicacion"]').forEach((button) => {
      button.addEventListener("click", () => {
        const paquete = paquetesArchivo.find((item) => String(item.id_paquete_archivo || "") === String(button.dataset.paquete || ""));
        if (!paquete) {
          showToast("No se encontró el paquete seleccionado", "warning");
          return;
        }
        abrirModalMoverPaqueteUbicacion({
          paquete,
          onSuccess: async () => {
            await cargarPaquetesArchivo({ forceRefresh: true });
          }
        });
      });
    });
  };

  const renderSugerenciaPaquete = (payload, onUpdated) => {
    const contenedor = document.getElementById("sugerencia-paquete");
    if (!contenedor) return;

    const expediente = payload?.expediente || {};
    const sugerencia = payload?.sugerencia || {};
    const usuario = _getUsuario();
    const asignadoPor = _obtenerAsignadoPor(usuario);

    contenedor.className = "mb-6";
    contenedor.innerHTML = `
      <div class="card-surface p-5 space-y-4 border border-blue-200 bg-blue-50/40">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-blue-700">Sugerencia encontrada</p>
          <h3 class="text-lg font-bold text-slate-900 mt-1">${_escapeHtml(expediente.codigo_expediente_completo || "Expediente")}</h3>
          <p class="text-sm text-slate-600 mt-1">Año ${_escapeHtml(expediente.anio || "-")} | Materia ${_escapeHtml(sugerencia.id_materia || expediente.id_materia || "-")} | Paquete ${_escapeHtml(sugerencia.id_paquete || "-")}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <p><span class="font-semibold">Rótulo sugerido:</span> ${_escapeHtml(sugerencia.rotulo_sugerido || "-")}</p>
          <p class="mt-1"><span class="font-semibold">Grupo:</span> ${_escapeHtml(sugerencia.grupo || "-")} | <span class="font-semibold">Color:</span> ${_escapeHtml(sugerencia.color_especialista || "-")}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button id="btn-confirmar-sugerencia" type="button" class="btn btn-primary">Crear y asignar</button>
          <button id="btn-cerrar-sugerencia" type="button" class="btn btn-secondary">Cerrar</button>
        </div>
      </div>
    `;

    contenedor.classList.remove("hidden");

    document.getElementById("btn-cerrar-sugerencia")?.addEventListener("click", () => {
      contenedor.classList.add("hidden");
      contenedor.innerHTML = "";
    });

    document.getElementById("btn-confirmar-sugerencia")?.addEventListener("click", async () => {
      try {
        let idPaqueteArchivo = String(sugerencia.paquete_archivo_existente?.id_paquete_archivo || "").trim();

        if (!idPaqueteArchivo) {
          const creado = await crearPaqueteArchivo({
            anio: String(sugerencia.anio || expediente.anio || "").trim(),
            id_materia: String(sugerencia.id_materia || expediente.id_materia || "").trim(),
            id_paquete: String(sugerencia.id_paquete || "").trim(),
            grupo: String(sugerencia.grupo || "").trim(),
            color_especialista: String(sugerencia.color_especialista || "").trim(),
            descripcion: ""
          });

          if (!creado?.success) {
            throw new Error(creado?.error || "No se pudo crear el paquete archivo sugerido");
          }

          idPaqueteArchivo = String(creado.data?.id_paquete_archivo || "").trim();
        }

        const asignacion = await asignarExpedienteAPaquete({
          id_expediente: String(expediente.id_expediente || "").trim(),
          id_paquete_archivo: idPaqueteArchivo,
          asignado_por: asignadoPor
        });

        if (!asignacion?.success) {
          throw new Error(asignacion?.error || "No se pudo asignar el expediente al paquete sugerido");
        }

        showToast("Expediente asignado correctamente al paquete sugerido", "success");
        contenedor.classList.add("hidden");
        contenedor.innerHTML = "";
        onUpdated?.();
      } catch (error) {
        showToast(error.message || "No se pudo completar la asignación sugerida", "error");
      }
    });
  };

function abrirModalColoresYEspecialistas(inlineMountId = "") {
  const colores = Object.keys(_COLOR_BADGE);

  const obtenerEspecialistas = () => (responsables || [])
    .map((item) => ({
      id_usuario: String(item.id_usuario || "").trim(),
      nombre_completo: String(item.nombre_completo || "").trim(),
      rol: String(item.id_rol || "").trim().toUpperCase() === "ROL0005" ? "Especialista" : "Asistente",
      color_asignado: String(item.color_asignado || "").trim().toUpperCase(),
      fecha_color_actualizacion: String(item.fecha_color_actualizacion || item.fecha_color_creacion || "").trim()
    }))
    .filter((item) => item.id_usuario && item.nombre_completo)
    .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));

  const renderColorPill = (color, extraClass = "") => `
    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${_getColorClass(color)} ${extraClass}">
      ${_escapeHtml(color || "SIN COLOR")}
    </span>
  `;

  openModal({
    inlineMountId,
    title: "Colores y Especialistas",
    panelWidthClass: "max-w-6xl",
    bodyClass: "p-1",
    bodyScrollable: false,
    confirmText: "Cerrar",
    cancelText: "",
    onConfirm: (close) => close(),
    onCancel: (close) => close(),
    content: `
      <div class="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-4 h-[78vh] min-h-0">

        <!-- COLUMNA IZQUIERDA -->
        <div class="flex flex-col gap-4 min-h-0">

          <!-- TARJETAS ESTADÍSTICAS -->
          <div class="flex flex-row gap-2 text-center">
            <div class="flex-1 rounded-xl border border-sky-200 bg-sky-50 px-2 py-2.5">
              <p class="text-xs font-bold uppercase tracking-wide text-sky-700 truncate">Especialistas</p>
              <p id="color-modal-total" class="text-2xl font-black text-slate-900">0</p>
            </div>
            <div class="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2.5">
              <p class="text-xs font-bold uppercase tracking-wide text-emerald-700 truncate">Con color</p>
              <p id="color-modal-assigned" class="text-2xl font-black text-slate-900">0</p>
            </div>
            <div class="flex-1 rounded-xl border border-amber-200 bg-amber-50 px-2 py-2.5">
              <p class="text-xs font-bold uppercase tracking-wide text-amber-700 truncate">Pendientes</p>
              <p id="color-modal-pending" class="text-2xl font-black text-slate-900">0</p>
            </div>
          </div>

          <!-- FORMULARIO -->
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            <div class="flex items-center gap-2">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white flex-shrink-0">
                ${icon("target", "w-4 h-4")}
              </span>
              <div>
                <h4 class="text-sm font-bold text-slate-900">Asignar color por especialista</h4>
                <p class="text-xs text-slate-500">Selecciona un responsable y guarda el color.</p>
              </div>
            </div>

            <!-- Paleta -->
            <div class="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Paleta disponible</p>
              <div class="flex flex-wrap gap-2">
                ${colores.map((c) => renderColorPill(c)).join("")}
              </div>
            </div>

            <form id="form-color-especialista" class="space-y-4">
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Especialista</label>
                  <select id="color-especialista-select" class="select-base w-full text-sm">
                    <option value="">Selecciona un usuario</option>
                    ${obtenerEspecialistas().map((item) => `
                      <option value="${_escapeHtml(item.id_usuario)}">
                        ${_escapeHtml(item.nombre_completo)}${item.color_asignado ? ` · ${_escapeHtml(item.color_asignado)}` : ""}
                      </option>
                    `).join("")}
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Color</label>
                  <select id="color-palette-select" class="select-base w-full text-sm">
                    ${colores.map((color) => `<option value="${color}">${color}</option>`).join("")}
                  </select>
                </div>
              </div>

              <!-- Vista previa -->
              <div class="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
                <div class="min-w-0">
                  <p id="color-preview-name" class="text-sm font-bold text-slate-900 truncate">Sin especialista seleccionado</p>
                  <p id="color-preview-meta" class="text-xs text-slate-500 truncate">Elige un especialista para visualizar.</p>
                </div>
                <div id="color-preview-badge" class="flex-shrink-0">
                  ${renderColorPill(colores[0] || "GRIS")}
                </div>
              </div>

              <div id="color-modal-feedback" class="hidden rounded-lg px-3 py-2 text-sm font-medium"></div>

              <button
                id="color-modal-submit"
                type="submit"
                class="btn btn-primary inline-flex items-center gap-2 px-4 py-2 font-semibold text-sm w-full justify-center"
              >
                ${icon("check", "w-4 h-4")}
                <span>Guardar color</span>
              </button>
            </form>
          </div>
        </div>

        <!-- COLUMNA DERECHA -->
        <div class="min-h-0">
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm h-full min-h-0 flex flex-col">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-3">
              <div>
                <h4 class="text-sm font-bold text-slate-900">Colores ya asignados</h4>
                <p class="text-xs text-slate-500">Consulta, filtra y reutiliza la configuración.</p>
              </div>

              <div class="sm:w-56">
                <div class="relative">
                  <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    ${icon("busqueda", "w-3.5 h-3.5")}
                  </span>
                  <input
                    id="color-modal-search"
                    type="text"
                    class="input-base w-full pl-8 text-sm py-1.5"
                    placeholder="Nombre o color"
                  />
                </div>
              </div>
            </div>

            <div id="color-modal-list" class="flex-1 min-h-0 overflow-hidden"></div>
          </div>
        </div>

      </div>
    `
  });

  const form = document.getElementById("form-color-especialista");
  const especialistaSelect = document.getElementById("color-especialista-select");
  const colorSelect = document.getElementById("color-palette-select");
  const previewName = document.getElementById("color-preview-name");
  const previewMeta = document.getElementById("color-preview-meta");
  const previewBadge = document.getElementById("color-preview-badge");
  const feedback = document.getElementById("color-modal-feedback");
  const listContainer = document.getElementById("color-modal-list");
  const searchInput = document.getElementById("color-modal-search");
  const totalNode = document.getElementById("color-modal-total");
  const assignedNode = document.getElementById("color-modal-assigned");
  const pendingNode = document.getElementById("color-modal-pending");
  const submitButton = document.getElementById("color-modal-submit");

  const setFeedback = (message = "", type = "info") => {
    if (!feedback) return;

    if (!message) {
      feedback.className = "hidden rounded-lg px-3 py-2 text-sm font-medium";
      feedback.textContent = "";
      return;
    }

    const tones = {
      success: "border border-emerald-200 bg-emerald-50 text-emerald-700",
      error: "border border-red-200 bg-red-50 text-red-700",
      warning: "border border-amber-200 bg-amber-50 text-amber-700",
      info: "border border-sky-200 bg-sky-50 text-sky-700"
    };

    feedback.className = `rounded-lg px-3 py-2 text-sm font-medium ${tones[type] || tones.info}`;
    feedback.textContent = message;
  };

  const renderPreview = () => {
    const selectedId = String(especialistaSelect?.value || "").trim();
    const selectedColor = String(colorSelect?.value || colores[0] || "GRIS").trim().toUpperCase();
    const especialista = obtenerEspecialistas().find((item) => item.id_usuario === selectedId);

    if (!especialista) {
      previewName.textContent = "Sin especialista seleccionado";
      previewMeta.textContent = "Elige un especialista para visualizar su asignación.";
      previewBadge.innerHTML = renderColorPill(selectedColor || "GRIS");
      return;
    }

    previewName.textContent = especialista.nombre_completo;
    previewMeta.textContent = especialista.color_asignado
      ? `Color actual: ${especialista.color_asignado} · ${_formatearFechaCorta(especialista.fecha_color_actualizacion)}`
      : `Sin color asignado · ${especialista.rol}`;
    previewBadge.innerHTML = renderColorPill(selectedColor || especialista.color_asignado || "GRIS");
  };

  const renderList = (query = "") => {
    const especialistas = obtenerEspecialistas();
    const texto = _normalizarTextoBusqueda(query);

    const filtrados = especialistas.filter((item) => {
      if (!texto) return true;
      return _normalizarTextoBusqueda(`${item.nombre_completo} ${item.color_asignado} ${item.rol}`).includes(texto);
    });

    const asignados = especialistas.filter((item) => item.color_asignado);

    totalNode.textContent = String(especialistas.length);
    assignedNode.textContent = String(asignados.length);
    pendingNode.textContent = String(especialistas.length - asignados.length);

    if (!filtrados.length) {
      listContainer.innerHTML = `
        <div class="h-full min-h-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 flex items-center justify-center">
          No hay especialistas que coincidan.
        </div>
      `;
      return;
    }

    listContainer.innerHTML = `
      <div class="h-full min-h-0 flex flex-col">
        <div class="mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span class="font-semibold text-slate-700">${filtrados.length} resultado(s)</span>
          <span>${asignados.length} con color activo</span>
        </div>

        <div class="flex-1 min-h-0 overflow-auto rounded-xl border border-slate-200">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-slate-50 z-10">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Especialista</th>
                <th class="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">Color</th>
                <th class="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-600">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              ${filtrados.map((item) => `
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-3 py-2">
                    <p class="font-semibold text-slate-900 text-xs">${_escapeHtml(item.nombre_completo)}</p>
                    <p class="text-xs text-slate-400">${_escapeHtml(item.rol)}</p>
                  </td>
                  <td class="px-3 py-2">
                    ${item.color_asignado
                      ? renderColorPill(item.color_asignado)
                      : `<span class="text-xs text-slate-400">Sin asignar</span>`}
                  </td>
                  <td class="px-3 py-2 text-right">
                    <button
                      type="button"
                      class="btn btn-secondary text-xs inline-flex items-center gap-1 py-1 px-2"
                      data-color-user="${_escapeHtml(item.id_usuario)}"
                      data-color-value="${_escapeHtml(item.color_asignado || "")}"
                    >
                      ${icon("edit", "w-3 h-3")}
                      <span>${item.color_asignado ? "Cambiar" : "Asignar"}</span>
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    listContainer.querySelectorAll("[data-color-user]").forEach((button) => {
      button.addEventListener("click", () => {
        especialistaSelect.value = String(button.dataset.colorUser || "");
        if (String(button.dataset.colorValue || "").trim()) {
          colorSelect.value = String(button.dataset.colorValue || "").trim().toUpperCase();
        }
        renderPreview();
        especialistaSelect.focus();
      });
    });
  };

  especialistaSelect?.addEventListener("change", renderPreview);
  colorSelect?.addEventListener("change", renderPreview);
  searchInput?.addEventListener("input", (event) => renderList(event.target.value || ""));

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const idUsuario = String(especialistaSelect?.value || "").trim();
    const color = String(colorSelect?.value || "").trim().toUpperCase();

    if (!idUsuario || !color) {
      setFeedback("Selecciona un especialista y un color.", "warning");
      return;
    }

    try {
      setFeedback("Guardando...", "info");
      submitButton.disabled = true;

      const response = await asignarColorEspecialista({ id_usuario: idUsuario, color });
      if (!response?.success) {
        throw new Error(response?.error || "No se pudo guardar el color");
      }

      const refreshed = await listarResponsablesActivos();
      if (refreshed?.success && Array.isArray(refreshed.data)) {
        responsables = refreshed.data;
      }

      renderPreview();
      renderList(searchInput?.value || "");
      setFeedback(response?.message || "Color guardado correctamente.", "success");
      showToast(response?.message || "Color guardado correctamente", "success");
    } catch (error) {
      setFeedback(error.message || "No se pudo guardar.", "error");
      showToast(error.message || "No se pudo guardar el color", "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  renderPreview();
  renderList();
}

  function abrirModalListadoPaquetes(inlineMountId = "") {
      const obtenerPaquetes = () => {
        const fuente = Array.isArray(paquetes) ? paquetes : [];

        return fuente
        .map((item, index) => {
          const descripcionRaw = String(item.descripcion || "").trim();
          const numeros = (descripcionRaw.match(/\d+/g) || []).map((n) => Number(n));
          const desde = Number.isFinite(numeros[0]) ? numeros[0] : index * 100;
          const hasta = Number.isFinite(numeros[1]) ? numeros[1] : (desde + 99);
          const nombrePaquete = String(item.nombre_paquete || item.nombre || "").trim();
          const descripcionBase = String(item.descripcion || `Contiene registros del ${desde} al ${hasta}`).trim();
          const descripcionFinal = nombrePaquete
            ? `${nombrePaquete} - ${descripcionBase}`
            : descripcionBase;

          const estadoPaquete = String(item.estado_paquete || "").trim().toUpperCase();
          const activoRaw = String(item.activo || "").trim().toUpperCase();
          const activo = activoRaw
            ? activoRaw !== "NO"
            : (estadoPaquete ? estadoPaquete === "ACTIVO" : true);

          return {
            id: String(item.id_paquete || item.id || "").trim(),
            codigo: String(item.codigo_paquete || item.codigo || "").trim(),
            descripcion: descripcionFinal,
            fechaCreacion: String(item.fecha_creacion || item.fechaCreacion || item.fecha_creado || "").trim(),
            activo
          };
        })
        .sort((a, b) => {
          const num = (s) => parseInt(String(s).replace(/\D/g, "") || "0", 10);
          return num(a.codigo) - num(b.codigo) || String(a.codigo).localeCompare(String(b.codigo));
        });
      };

      const state = {
        searchTerm: "",
        estado: "Todas",
        page: 1,
        pageSize: 10,
        isLoading: false
      };

      const exportarCsv = (rows) => {
        const headers = ["CODIGO", "DESCRIPCION", "CREACION", "ESTADO"];
        const body = rows.map((r) => [r.codigo, r.descripcion, r.fechaCreacion, r.activo ? "ACTIVO" : "INACTIVO"]);
        const csv = [headers, ...body]
          .map((cols) => cols.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(","))
          .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `paquetes_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      };

      openModal({
        inlineMountId,
        title: `<div class="flex items-center gap-2"><button id="btn-modal-crear-paquete" type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">${icon("plus", "w-3.5 h-3.5")}<span>Crear Paquete</span></button><span class="ml-2 text-lg font-extrabold text-slate-900">Listado de Paquetes</span></div>`,
        panelWidthClass: "max-w-3xl",
        bodyClass: "pr-1",
        bodyScrollable: true,
        confirmText: "",
        cancelText: "",
        content: `
          <div class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
              <div class="px-4 py-2.5 text-sm font-semibold text-blue-700 border-b md:border-b-0 md:border-r border-slate-200">Total de Paquetes: <span id="paquete-modal-total">0</span> (Todos Activos)</div>
              <div class="px-4 py-2.5 text-sm font-semibold text-emerald-700">Última Actualización: <span id="paquete-modal-latest">-</span></div>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm space-y-2.5">
              <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_150px_110px] gap-2 items-end">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Buscar</label>
                  <div class="relative">
                    <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">${icon("busqueda", "w-3.5 h-3.5")}</span>
                    <input id="paquete-modal-search" type="text" class="input-base w-full pl-8 text-sm py-1.5" placeholder="Codigo o descripcion" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">Estado</label>
                  <select id="paquete-modal-estado" class="select-base w-full text-sm">
                    <option value="Todas">Todas</option>
                    <option value="Activa">Activa</option>
                    <option value="Inactiva">Inactiva</option>
                  </select>
                </div>
                <button id="paquete-modal-filtrar" type="button" class="btn btn-secondary text-sm font-semibold py-2">Filtrar</button>
              </div>

              <div id="paquete-modal-list"></div>

              <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                <div id="paquete-modal-page-info" class="font-semibold text-slate-700">Página 1 de 1</div>
                <div class="flex items-center gap-2">
                  <button id="paquete-modal-prev" type="button" class="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50">&lt; anterior</button>
                  <button id="paquete-modal-next" type="button" class="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50">siguiente &gt;</button>
                </div>
                <div class="flex items-center gap-1.5">
                  <span>Mostrar</span>
                  <select id="paquete-modal-size" class="select-base text-xs py-1 px-2 min-h-0">
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                  <span>por página</span>
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-1 border-t border-slate-200">
                <button id="paquete-modal-cerrar" type="button" class="btn btn-secondary text-sm px-4">Cerrar</button>
                <button id="paquete-modal-export" type="button" class="btn btn-primary text-sm px-4 inline-flex items-center gap-1.5">${icon("download", "w-4 h-4")}<span>Exportar Lista</span></button>
              </div>
            </div>
          </div>
        `
      });

      const createBtn = document.getElementById("btn-modal-crear-paquete");
      const searchInput = document.getElementById("paquete-modal-search");
      const estadoSelect = document.getElementById("paquete-modal-estado");
      const filtrarBtn = document.getElementById("paquete-modal-filtrar");
      const listContainer = document.getElementById("paquete-modal-list");
      const totalNode = document.getElementById("paquete-modal-total");
      const latestNode = document.getElementById("paquete-modal-latest");
      const pageInfo = document.getElementById("paquete-modal-page-info");
      const prevBtn = document.getElementById("paquete-modal-prev");
      const nextBtn = document.getElementById("paquete-modal-next");
      const sizeSelect = document.getElementById("paquete-modal-size");
      const closeBtn = document.getElementById("paquete-modal-cerrar");
      const exportBtn = document.getElementById("paquete-modal-export");

      const aplicarFiltros = () => {
        const lista = obtenerPaquetes();
        const texto = _normalizarTextoBusqueda(state.searchTerm);

        return lista.filter((item) => {
          const matchTexto = !texto || _normalizarTextoBusqueda(`${item.codigo} ${item.descripcion} ${item.fechaCreacion}`).includes(texto);
          const matchEstado = state.estado === "Todas" || (state.estado === "Activa" ? item.activo : !item.activo);
          return matchTexto && matchEstado;
        });
      };

      const renderPaquetes = () => {
        const lista = obtenerPaquetes();
        const filtrados = aplicarFiltros();
        const totalPages = Math.max(1, Math.ceil(filtrados.length / state.pageSize));
        state.page = Math.min(Math.max(1, state.page), totalPages);
        const start = (state.page - 1) * state.pageSize;
        const visibles = filtrados.slice(start, start + state.pageSize);

        totalNode.textContent = String(lista.length);
        latestNode.textContent = lista.length
          ? _formatearFechaCorta(lista.reduce((acc, item) => item.fechaCreacion > acc ? item.fechaCreacion : acc, lista[0].fechaCreacion || ""))
          : "Sin datos";
        pageInfo.textContent = `Página ${state.page} de ${totalPages}`;
        prevBtn.disabled = state.page <= 1;
        nextBtn.disabled = state.page >= totalPages;

        if (state.isLoading && lista.length === 0) {
          listContainer.innerHTML = `<div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Llamando los datos de paquetes...</div>`;
          return;
        }

        if (!filtrados.length) {
          listContainer.innerHTML = `<div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No hay paquetes que coincidan.</div>`;
          return;
        }

        listContainer.innerHTML = `
          <div class="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-slate-50">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">CODIGO</th>
                  <th class="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">DESCRIPCION</th>
                  <th class="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">CREACION</th>
                  <th class="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-600">ESTADO</th>
                  <th class="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-slate-600">ACCIONES</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                ${visibles.map((item) => `
                  <tr>
                    <td class="px-3 py-2">
                      <div class="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1">
                        <span class="text-blue-600">${icon("archiveBox", "w-3.5 h-3.5")}</span>
                        <span class="font-mono text-xs font-bold text-blue-900">${_escapeHtml(item.codigo || "-")}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2 text-xs text-slate-700">${_escapeHtml(item.descripcion || "Sin descripción")}</td>
                    <td class="px-3 py-2 text-xs text-slate-500">${_escapeHtml(_formatearFechaCorta(item.fechaCreacion))}</td>
                    <td class="px-3 py-2 text-center">
                      <span class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        ${item.activo ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-right">
                      <div class="inline-flex items-center gap-1.5 text-slate-500">
                        <button type="button" class="rounded-md p-1 hover:bg-slate-100" title="Ver" data-action="ver-paquete" data-codigo="${_escapeHtml(item.codigo || "")}" data-descripcion="${_escapeHtml(item.descripcion || "")}" data-fecha="${_escapeHtml(item.fechaCreacion || "")}" data-estado="${item.activo ? "ACTIVO" : "INACTIVO"}">${icon("eye", "w-3.5 h-3.5")}</button>
                        <button type="button" class="rounded-md p-1 hover:bg-slate-100" title="Editar">${icon("edit", "w-3.5 h-3.5")}</button>
                      </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;
      };

      createBtn?.addEventListener("click", async () => {
        abrirModalCrearPaquete({
          onCreated: async () => {
            try {
              paquetes = await paqueteService.listar({ forceRefresh: true });
            } catch (err) {
              console.warn("Error refrescando paquetes:", err);
            }
            state.page = 1;
            renderPaquetes();
          }
        });
      });

      searchInput?.addEventListener("input", (event) => {
        state.searchTerm = String(event.target.value || "");
      });

      estadoSelect?.addEventListener("change", (event) => {
        state.estado = String(event.target.value || "Todas");
      });

      filtrarBtn?.addEventListener("click", () => {
        state.page = 1;
        renderPaquetes();
      });

      sizeSelect?.addEventListener("change", (event) => {
        state.pageSize = Number(event.target.value || 10);
        state.page = 1;
        renderPaquetes();
      });

      prevBtn?.addEventListener("click", () => {
        if (state.page <= 1) return;
        state.page -= 1;
        renderPaquetes();
      });

      nextBtn?.addEventListener("click", () => {
        state.page += 1;
        renderPaquetes();
      });

      closeBtn?.addEventListener("click", () => {
        document.getElementById("modal-close")?.click();
      });

      exportBtn?.addEventListener("click", () => {
        exportarCsv(aplicarFiltros());
        showToast("Lista exportada correctamente", "success");
      });

      listContainer?.addEventListener("click", (event) => {
        const button = event.target.closest('[data-action="ver-paquete"]');
        if (!button) return;

        const codigo = String(button.dataset.codigo || "").trim();
        const descripcion = String(button.dataset.descripcion || "").trim();
        const fecha = String(button.dataset.fecha || "").trim();
        const estado = String(button.dataset.estado || "").trim();

        openModal({
          title: `<div class="w-full text-center text-lg font-bold text-slate-900">Panel de Rótulo</div>`,
          content: `
            <div class="space-y-3 text-sm text-slate-700">
              <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Vista del rótulo</p>
                <div class="mt-2 rounded-lg border-2 border-dashed border-slate-300 bg-white p-4">
                  <p class="text-base font-extrabold text-slate-900">${_escapeHtml(codigo || "SIN CODIGO")}</p>
                  <p class="mt-1 text-sm text-slate-700">${_escapeHtml(descripcion || "Sin descripción")}</p>
                </div>
              </div>
              <div class="rounded-xl border border-slate-200 bg-white p-4">
                <p><span class="font-semibold">Fecha:</span> ${_escapeHtml(_formatearFechaCorta(fecha))}</p>
                <p class="mt-1"><span class="font-semibold">Estado:</span> ${_escapeHtml(estado || "-")}</p>
              </div>
            </div>
          `,
          confirmText: "Cerrar",
          cancelText: "",
          onConfirm: (close) => close(),
          onCancel: (close) => close()
        });
      });

      renderPaquetes();

      // Refresca desde la fuente real de paquetes para evitar datos desactualizados al abrir el modal.
      state.isLoading = true;
      renderPaquetes();
      paqueteService.listar().then((fresh) => {
        paquetes = Array.isArray(fresh) ? fresh : [];
        state.page = 1;
        state.isLoading = false;
        renderPaquetes();
      }).catch((err) => {
        state.isLoading = false;
        renderPaquetes();
        console.warn("No se pudo refrescar listado de paquetes:", err);
      });
    }

  const render = () => {
    mountNode.innerHTML = `
      <!-- SECCIÓN: PAQUETES ARCHIVO (BACKEND) -->
      <section class="mb-10">
        <div class="mb-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 text-blue-700 shadow-sm ring-1 ring-blue-200/70">${icon("paquetes", "w-6 h-6")}</span>
              <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Gestión de Paquetes del Archivo</h2>
            </div>
            <div class="paquete-toolbar ml-10 sm:ml-0">
              <button id="btn-crear-paq-archivo" class="paquete-action-btn paquete-action-btn--primary" type="button">
                <span class="paquete-action-btn__icon">${icon("plus", "w-5 h-5")}</span>
                <span class="paquete-action-btn__content">
                  <span class="paquete-action-btn__title">Nuevo Paquete</span>
                  <span class="paquete-action-btn__hint">Crear registro</span>
                </span>
              </button>
              <button id="btn-asignar-exp-manual" class="paquete-action-btn paquete-action-btn--assign" type="button">
                <span class="paquete-action-btn__icon">${icon("transfer", "w-5 h-5")}</span>
                <span class="paquete-action-btn__content">
                  <span class="paquete-action-btn__title">Asignar Expedientes</span>
                  <span class="paquete-action-btn__hint">Agregar al paquete</span>
                </span>
              </button>
              <button id="btn-asignar-ubicacion-paquete" class="paquete-action-btn paquete-action-btn--catalog" type="button">
                <span class="paquete-action-btn__icon">${icon("mapPin", "w-5 h-5")}</span>
                <span class="paquete-action-btn__content">
                  <span class="paquete-action-btn__title">Asignar ubicación a un paquete</span>
                  <span class="paquete-action-btn__hint">Definir resguardo físico</span>
                </span>
              </button>
              <button id="btn-quitar-exp-manual" class="paquete-action-btn paquete-action-btn--remove" type="button">
                <span class="paquete-action-btn__icon">${icon("cancel", "w-5 h-5")}</span>
                <span class="paquete-action-btn__content">
                  <span class="paquete-action-btn__title">Quitar Expediente</span>
                  <span class="paquete-action-btn__hint">Retirar asignación</span>
                </span>
              </button>
              <button id="btn-listado-colores-especialistas" class="paquete-action-btn paquete-action-btn--catalog" type="button">
                <span class="paquete-action-btn__icon">${icon("target", "w-5 h-5")}</span>
                <span class="paquete-action-btn__content">
                  <span class="paquete-action-btn__title">Colores y Especialistas</span>
                  <span class="paquete-action-btn__hint">Ver catálogo</span>
                </span>
              </button>
              <button id="btn-listado-paquetes" class="paquete-action-btn paquete-action-btn--list" type="button">
                <span class="paquete-action-btn__icon">${icon("list", "w-5 h-5")}</span>
                <span class="paquete-action-btn__content">
                  <span class="paquete-action-btn__title">Listado de Paquetes</span>
                  <span class="paquete-action-btn__hint">Ver activos</span>
                </span>
              </button>
              <button id="btn-listado-paquetes-archivo" class="paquete-action-btn paquete-action-btn--list" type="button">
                <span class="paquete-action-btn__icon">${icon("archiveBox", "w-5 h-5")}</span>
                <span class="paquete-action-btn__content">
                  <span class="paquete-action-btn__title">Paquetes para Archivo</span>
                  <span class="paquete-action-btn__hint">Tabla paquetes_archivo</span>
                </span>
              </button>
            </div>
          </div>
          <p class="text-sm text-slate-500 ml-10">Gestión de paquetes archivo: búsqueda automática o creación/asignación manual</p>
        </div>

        <div class="card-surface p-6 mb-6">
          <form id="form-buscar-exp-paquete" class="flex flex-col sm:flex-row gap-4 items-end">
            <div class="flex-1">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Código del Expediente</label>
              <input
                id="input-codigo-exp-paquete"
                name="codigo_expediente"
                class="input-base w-full"
                placeholder="Ej: 00059-2019-0-3101-JR-CI-01"
                autocomplete="off"
                required
              />
            </div>
            <button type="submit" class="btn btn-primary px-6 py-2 font-semibold whitespace-nowrap">
              🔍 Buscar expediente
            </button>
          </form>
          <div id="loading-buscar-exp" class="hidden mt-3 text-sm text-slate-500">⏳ Consultando...</div>
        </div>

        <div id="sugerencia-paquete" class="hidden mb-6"></div>

        <div id="gestion-tabs-workspace" class="card-surface p-4 mb-6 h-[calc(100vh-19rem)] min-h-[560px] overflow-hidden">
          <div id="tab-panel-listado" class="h-full min-h-0 overflow-hidden"></div>
          <div id="tab-panel-archivo" class="hidden h-full min-h-0 overflow-hidden"></div>
          <div id="tab-panel-asignar" class="hidden h-full min-h-0 overflow-hidden"></div>
          <div id="tab-panel-quitar" class="hidden h-full min-h-0 overflow-hidden"></div>
          <div id="tab-panel-colores" class="hidden h-full min-h-0 overflow-hidden"></div>
        </div>

        <div id="tabla-paquetes-archivo" class="hidden">
          <div class="card-surface p-6 text-center text-slate-500">⏳ Cargando paquetes archivo...</div>
        </div>
      </section>
    `;

    // --- EVENTOS SECCIÓN PAQUETES ARCHIVO ---
    document.getElementById("form-buscar-exp-paquete")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("input-codigo-exp-paquete");
      const loading = document.getElementById("loading-buscar-exp");
      const codigo = String(input?.value || "").trim();
      if (!codigo) return;

      input.disabled = true;
      loading?.classList.remove("hidden");
      const sugerenciaContenedor = document.getElementById("sugerencia-paquete");
      if (sugerenciaContenedor) sugerenciaContenedor.classList.add("hidden");

      try {
        const usuario = _getUsuario();
        const idUsuarioEspecialista = String(usuario?.id_usuario || "").trim();
        const resSug = await sugerirPaqueteParaExpediente(codigo, idUsuarioEspecialista);
        if (!resSug.success) throw new Error(resSug.error || "Expediente no encontrado");
        renderSugerenciaPaquete(resSug.data, () => cargarPaquetesArchivo({ forceRefresh: true }));
      } catch (err) {
        showToast(err.message || "Error al buscar expediente", "error");
      } finally {
        input.disabled = false;
        loading?.classList.add("hidden");
      }
    });

    // Repoblar tabla de paquetes archivo con datos en caché
    document.getElementById("btn-crear-paq-archivo")?.addEventListener("click", async () => {
      let paquetesActivos = paquetes;
      try {
        paquetesActivos = await obtenerPaquetesActivosRapido();
        await cargarCatalogosPaquetes();
      } catch (err) {
        console.warn("Error cargando paquetes activos:", err);
      }
      abrirModalCrearPaqueteArchivo(materias, paquetesActivos, () => cargarPaquetesArchivo({ forceRefresh: true }));
    });

    document.getElementById("btn-asignar-exp-manual")?.addEventListener("click", () => {
      activarTab("asignar");
    });

    document.getElementById("btn-asignar-ubicacion-paquete")?.addEventListener("click", async () => {
      await activarTab("archivo");
      showToast("Usa el botón 📍 Ubicar o 📦 Mover en la fila del paquete", "info");
    });

    document.getElementById("btn-quitar-exp-manual")?.addEventListener("click", () => {
      activarTab("quitar");
    });

    document.getElementById("btn-listado-colores-especialistas")?.addEventListener("click", () => {
      activarTab("colores");
    });

    document.getElementById("btn-listado-paquetes")?.addEventListener("click", () => {
      activarTab("listado");
    });

    document.getElementById("btn-listado-paquetes-archivo")?.addEventListener("click", () => {
      activarTab("archivo");
    });

    activarTab("listado");

    // Repoblar tabla de paquetes archivo con datos en caché
    renderTablaPaquetesArchivo(paquetesArchivo);
  };

  render();
  paqueteService.listar().then((fresh) => {
    paquetes = fresh;
  }).catch((err) => {
    console.warn("Error precargando paquetes activos:", err);
  });
  cargarPaquetesArchivo();
}
