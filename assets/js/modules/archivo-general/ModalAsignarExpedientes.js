import { openModal } from "../../components/modal.js";
import { showToast } from "../../components/toast.js";
import { archivoGeneralService } from "./archivoGeneralService.js";
import { estadoService } from "../../services/estadoService.js";
import { materiaService } from "../../services/materiaService.js";

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

export async function abrirModalAsignarExpedientes(id_grupo, onSuccess) {
  const estadosCatalogo = estadoService.listarSync();
  const materiasCatalogo = materiaService.listarSync();
  const estadoNombrePorId = new Map(
    (estadosCatalogo || []).map((estado) => [String(estado.id || "").trim(), String(estado.nombre || "").trim()])
  );
  const materiaNombrePorId = new Map(
    (materiasCatalogo || []).map((materia) => [String(materia.id || "").trim(), String(materia.nombre || "").trim()])
  );

  const obtenerNombreEstado = (exp) => {
    const nombreDirecto = String(exp.estado_texto || exp.estado || exp.estado_sistema || "").trim();
    if (nombreDirecto && Number.isNaN(Number(nombreDirecto))) return nombreDirecto;
    const idEstado = String(exp.id_estado || exp.id_estado_sistema || "").trim();
    return estadoNombrePorId.get(idEstado) || nombreDirecto || idEstado || "-";
  };

  const obtenerNumeroPrincipal = (exp) => {
    const numero = String(exp.numero_expediente || "").trim();
    return numero || String(exp.codigo_expediente_completo || "").trim() || "SIN NUMERO";
  };

  const obtenerMateriaNombre = (exp) => {
    const materiaDirecta = String(exp.materia_texto || exp.materia || "").trim();
    if (materiaDirecta) return materiaDirecta;
    const idMateria = String(exp.id_materia || "").trim();
    return materiaNombrePorId.get(idMateria) || idMateria || "-";
  };

  // Obtener expedientes del grupo actual y todos los expedientes
  const [detalleResp, todosResp] = await Promise.all([
    archivoGeneralService.listarDetalleGrupo(id_grupo),
    archivoGeneralService.listarExpedientes()
  ]);

  if (!todosResp.success) {
    showToast("Error cargando expedientes", "error");
    return;
  }

  const expedientesDelGrupo = detalleResp.success ? (detalleResp.data || []).map(e => e.id_expediente) : [];
  const expedientesDisponibles = (todosResp.data || []).filter(e => !expedientesDelGrupo.includes(e.id_expediente));
  const aniosDisponibles = Array.from(
    new Set(
      expedientesDisponibles
        .map((exp) => String(exp.anio || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => Number(b) - Number(a));

  const selectedExpedientes = new Set();
  let filtroTexto = "";
  let filtroAnio = "";
  let indexRenderizado = 0;
  const ITEMS_POR_BATCH = 100;

  const aplicarFiltros = () => {
    const texto = filtroTexto.toLowerCase().trim();
    return expedientesDisponibles.filter((exp) => {
      const codigo = String(exp.codigo_expediente_completo || "").toLowerCase();
      const numeroSimple = String(exp.numero_expediente || "").toLowerCase();
      const anio = String(exp.anio || "").trim();
      const coincideTexto = !texto || codigo.includes(texto) || numeroSimple.includes(texto);
      const coincideAnio = !filtroAnio || anio === filtroAnio;
      return coincideTexto && coincideAnio;
    });
  };

  const renderBatch = (items, append = false) => {
    const listNode = document.getElementById("expedientes-list");
    if (!listNode) return;

    const html = items.map((exp) => {
      const id = String(exp.id_expediente || "");
      const checked = selectedExpedientes.has(id) ? "checked" : "";
      const numeroPrincipal = obtenerNumeroPrincipal(exp);
      const codigoCompleto = String(exp.codigo_expediente_completo || "").trim();
      const materiaNombre = obtenerMateriaNombre(exp);
      const estadoNombre = obtenerNombreEstado(exp);
      return `
        <label class="asignar-expedientes-row">
          <input type="checkbox" class="expediente-checkbox asignar-expedientes-checkbox" value="${_escapeHtml(id)}" ${checked}>
          <div class="asignar-expedientes-row-content">
            <div class="asignar-expedientes-code">${_escapeHtml(numeroPrincipal)}</div>
            <div class="asignar-expedientes-meta">
              Materia: ${_escapeHtml(materiaNombre)} • Juzgado: ${_escapeHtml(exp.juzgado_texto || "-")} • Estado: ${_escapeHtml(estadoNombre)} • Año: <span class="font-medium">${_escapeHtml(exp.anio || "-")}</span> • Codigo: ${_escapeHtml(codigoCompleto || "-")}
            </div>
          </div>
        </label>
      `;
    }).join("");

    if (append) {
      listNode.insertAdjacentHTML("beforeend", html);
    } else {
      listNode.innerHTML = html;
    }

    // Agregar event listeners solo a los nuevos elementos
    const newCheckboxes = listNode.querySelectorAll(".expediente-checkbox:not([data-bound])");
    newCheckboxes.forEach((checkbox) => {
      checkbox.setAttribute("data-bound", "true");
      checkbox.addEventListener("change", (e) => {
        const id = String(e.target.value);
        if (e.target.checked) {
          selectedExpedientes.add(id);
        } else {
          selectedExpedientes.delete(id);
        }
        const selectedNodeLive = document.getElementById("expedientes-selected-count");
        if (selectedNodeLive) {
          selectedNodeLive.textContent = `${selectedExpedientes.size} seleccionado(s)`;
        }
      });
    });
  };

  const renderListado = () => {
    const listNode = document.getElementById("expedientes-list");
    const countNode = document.getElementById("expedientes-visible-count");
    const selectedNode = document.getElementById("expedientes-selected-count");
    if (!listNode) return;

    const filtrados = aplicarFiltros();

    if (countNode) {
      countNode.textContent = `${filtrados.length} visible(s)`;
    }
    if (selectedNode) {
      selectedNode.textContent = `${selectedExpedientes.size} seleccionado(s)`;
    }

    if (filtrados.length === 0) {
      listNode.innerHTML = `
        <div class="asignar-expedientes-empty">
          No hay expedientes para los filtros seleccionados
        </div>
      `;
      return;
    }

    // Renderizar solo los primeros ITEMS_POR_BATCH
    indexRenderizado = 0;
    const primerasBatch = filtrados.slice(0, ITEMS_POR_BATCH);
    renderBatch(primerasBatch, false);
    indexRenderizado = primerasBatch.length;

    // Configurar infinite scroll con IntersectionObserver
    setTimeout(() => {
      if (filtrados.length <= ITEMS_POR_BATCH) return;

      let observer = null;
      const observarUltimaFila = () => {
        const lastRow = listNode.querySelector(".asignar-expedientes-row:last-child");
        if (!lastRow) return;
        if (observer) observer.disconnect();

        observer = new IntersectionObserver((entries) => {
          if (!entries[0].isIntersecting) return;
          if (indexRenderizado >= filtrados.length) {
            observer.disconnect();
            return;
          }

          const siguienteBatch = filtrados.slice(indexRenderizado, indexRenderizado + ITEMS_POR_BATCH);
          renderBatch(siguienteBatch, true);
          indexRenderizado += siguienteBatch.length;
          observarUltimaFila();
        });

        observer.observe(lastRow);
      };

      observarUltimaFila();
    }, 0);
  };

  const content = `
    <div class="asignar-expedientes-wrap">
      <div class="asignar-expedientes-filters">
        <div class="asignar-expedientes-field asignar-expedientes-field--search">
          <label class="asignar-expedientes-label">Buscar por número/código</label>
          <input type="text" id="input-buscar-expedientes" class="asignar-expedientes-input" placeholder="Ej: 01345-2024 o parte del número...">
        </div>
        <div class="asignar-expedientes-field">
          <label class="asignar-expedientes-label">Filtrar por año</label>
          <select id="select-filtrar-anio" class="asignar-expedientes-select">
            <option value="">Todos los años</option>
            ${aniosDisponibles.map((anio) => `<option value="${_escapeHtml(anio)}">${_escapeHtml(anio)}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="asignar-expedientes-toolbar">
        <div class="asignar-expedientes-counters">
          <span id="expedientes-visible-count" class="asignar-expedientes-pill">0 visible(s)</span>
          <span id="expedientes-selected-count" class="asignar-expedientes-pill asignar-expedientes-pill--selected">0 seleccionado(s)</span>
        </div>
        <div class="asignar-expedientes-actions">
          <button type="button" id="btn-select-visible" class="asignar-expedientes-action-btn">Seleccionar visibles</button>
          <button type="button" id="btn-clear-selection" class="asignar-expedientes-action-btn">Limpiar selección</button>
        </div>
      </div>

      <div id="expedientes-list" class="asignar-expedientes-list">
        ${expedientesDisponibles.length > 0 ? "" : `
          <div class="asignar-expedientes-empty">
            No hay expedientes disponibles para asignar
          </div>
        `}
      </div>
    </div>
  `;

  openModal({
    title: "Asignar Expedientes",
    content,
    confirmText: expedientesDisponibles.length > 0 ? "Asignar" : "",
    cancelText: "Cancelar",
    panelClass: "asignar-expedientes-panel",
    panelWidthClass: "",
    onConfirm: async (close) => {
      if (selectedExpedientes.size === 0) {
        showToast("Debes seleccionar al menos un expediente", "warning");
        return;
      }

      const confirmBtn = document.getElementById("modal-confirm");
      if (confirmBtn) confirmBtn.disabled = true;

      try {
        const usuario = _getUsuario();
        const asignadoPor = _obtenerRealizadoPor(usuario);

        const response = await archivoGeneralService.asignarExpedientes({
          id_grupo,
          ids_expedientes: Array.from(selectedExpedientes),
          asignado_por: asignadoPor
        });

        if (response.success) {
          showToast(`${selectedExpedientes.size} expediente(s) asignado(s)`, "success");
          close();
          if (typeof onSuccess === "function") onSuccess();
        } else {
          showToast(response.error || "Error al asignar", "error");
        }
      } catch (err) {
        showToast("Error inesperado", "error");
        console.error(err);
      } finally {
        if (confirmBtn) confirmBtn.disabled = false;
      }
    }
  });

  if (expedientesDisponibles.length === 0) return;

  const panel = document.querySelector("#modal-root .modal-panel");
  if (panel) {
    panel.style.width = "min(1080px, 96vw)";
    panel.style.maxWidth = "min(1080px, 96vw)";
  }

  renderListado();

  // Buscar por número/código
  const inputBuscar = document.getElementById("input-buscar-expedientes");
  if (inputBuscar) {
    inputBuscar.addEventListener("input", (e) => {
      filtroTexto = String(e.target.value || "");
      renderListado();
    });
  }

  const selectAnio = document.getElementById("select-filtrar-anio");
  if (selectAnio) {
    selectAnio.addEventListener("change", (e) => {
      filtroAnio = String(e.target.value || "");
      renderListado();
    });
  }

  const btnSelectVisible = document.getElementById("btn-select-visible");
  if (btnSelectVisible) {
    btnSelectVisible.addEventListener("click", () => {
      aplicarFiltros().forEach((exp) => selectedExpedientes.add(String(exp.id_expediente || "")));
      renderListado();
    });
  }

  const btnClearSelection = document.getElementById("btn-clear-selection");
  if (btnClearSelection) {
    btnClearSelection.addEventListener("click", () => {
      selectedExpedientes.clear();
      renderListado();
    });
  }
}
