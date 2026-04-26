import { openModal } from "../../components/modal.js";
import { statusBadge } from "../../components/statusBadge.js";
import { renderTable } from "../../components/table.js";
import { showToast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { expedienteService } from "../../services/expedienteService.js";
import { formatoFechaHora } from "../../utils/formatters.js";
import { validarNumeroExpediente } from "../../utils/validators.js";
import { parsearLectora } from "../../utils/lectora.js";
import { ALERT_TONES } from "../../core/uiTokens.js";

const PAGE_SIZE_DEFAULT = 8;
const SORTABLE_COLUMNS = ["expediente", "materia", "juzgado", "ingreso", "ubicacion", "paquete", "estado"];

const SALIDA_EXPEDIENTE_RULES = {
  PRESTAMO: {
    destinos: ["JUZGADO", "JUEZ", "ESPECIALISTA", "ASISTENTE", "AREA_USUARIA", "SALA_AUDIENCIA"],
    motivos: ["LECTURA_EXPEDIENTE", "CONSULTA", "REVISION_INTERNA", "AUDIENCIA", "APOYO_ORDENAMIENTO"]
  },
  SALIDA_INTERNA: {
    destinos: ["JUZGADO", "JUEZ", "ESPECIALISTA", "ASISTENTE", "AREA_DIGITALIZACION", "SALA_AUDIENCIA"],
    motivos: ["REVISION_INTERNA", "DIGITALIZACION", "AUDIENCIA", "ORDENAMIENTO", "APOYO_ORDENAMIENTO"]
  },
  SALIDA_EXTERNA: {
    destinos: ["OTRO_JUZGADO", "ENTIDAD_EXTERNA", "MESA_PARTES", "FISCALIA", "PROCURADURIA"],
    motivos: ["TRASLADO", "CONSULTA_EXTERNA", "REMISION_TEMPORAL", "REVISION_EXTERNA"]
  },
  ENVIO_DEFINITIVO: {
    destinos: ["ARCHIVO_CENTRAL", "ARCHIVO_GENERAL", "OTRO_JUZGADO", "ENTIDAD_EXTERNA"],
    motivos: ["REMISION_FINAL", "CIERRE_EXPEDIENTE", "ARCHIVO_DEFINITIVO", "TRANSFERENCIA_DEFINITIVA"]
  }
};

function prettyLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function obtenerUsuarioLogueadoTexto() {
  try {
    const trabajador = JSON.parse(localStorage.getItem("trabajador_validado") || "null");
    if (!trabajador) return "Sin identificar";
    return `${trabajador.dni} - ${trabajador.nombres} ${trabajador.apellidos}`;
  } catch {
    return "Sin identificar";
  }
}

function esEstadoPrestamoLegacy(estado) {
  const base = normalizarTexto(estado || "");
  return base.includes("prestamo") || base.includes("prestado") || base.includes("derivado");
}

function resolverEstadoRetornoLegacy() {
  const estados = (expedienteService.estados() || []).map((e) => String(e || ""));
  const estadoRetornado = estados.find((e) => normalizarTexto(e).includes("retornad"));
  if (estadoRetornado) return estadoRetornado;
  const estadoRegistrado = estados.find((e) => normalizarTexto(e).includes("registrad"));
  return estadoRegistrado || "Registrado";
}

function actionButtons(id, estado) {
  const esPrestamo = esEstadoPrestamoLegacy(estado);
  const accionPrimaria = esPrestamo ? "retorno" : "salida";
  const textoPrimario = esPrestamo ? "Retorno" : "Salida";
  return `
    <div class="flex items-start gap-2">
      <button class="btn btn-secondary text-xs inline-flex items-center gap-1" data-action="detalle" data-id="${id}">${icon("eye", "w-3.5 h-3.5")}<span>Ver</span></button>
      <button class="btn btn-secondary text-xs inline-flex items-center gap-1" data-action="${accionPrimaria}" data-id="${id}">${icon("moveRight", "w-3.5 h-3.5")}<span>${textoPrimario}</span></button>
      <details class="relative">
        <summary class="btn btn-secondary text-xs list-none cursor-pointer">Acciones</summary>
        <div class="absolute right-0 mt-1 w-36 rounded-lg border border-slate-200 bg-white shadow-lg p-1 z-20">
          <button class="w-full text-left px-2 py-1.5 rounded text-xs text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1" data-action="editar" data-id="${id}">${icon("edit", "w-3.5 h-3.5")}<span>Editar</span></button>
          <button class="w-full text-left px-2 py-1.5 rounded text-xs text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1" data-action="mover" data-id="${id}">${icon("transfer", "w-3.5 h-3.5")}<span>Mover</span></button>
        </div>
      </details>
    </div>
  `;
}

function renderSortIcon(sortState, key) {
  if (sortState.key !== key) return "<span class='text-slate-300'>↕</span>";
  return sortState.direction === "asc"
    ? "<span class='text-slate-600'>↑</span>"
    : "<span class='text-slate-600'>↓</span>";
}

function renderListado(data, sortState) {
  const columns = [
    { key: "expediente", label: "Expediente" },
    { key: "materia", label: "Materia" },
    { key: "juzgado", label: "Juzgado" },
    { key: "ingreso", label: "Fecha / Hora" },
    { key: "ubicacion", label: "Ubicación" },
    { key: "paquete", label: "Paquete" },
    { key: "estado", label: "Estado" },
    { key: "acciones", label: "Acciones" }
  ];

  const header = columns
    .map((column) => {
      if (!SORTABLE_COLUMNS.includes(column.key)) {
        return `<th class="px-4 py-3 text-left font-semibold uppercase">${column.label}</th>`;
      }

      return `
        <th class="px-4 py-3 text-left font-semibold uppercase">
          <button class="inline-flex items-center gap-1 hover:text-slate-700 transition-colors" data-sort-key="${column.key}">
            <span>${column.label}</span>
            ${renderSortIcon(sortState, column.key)}
          </button>
        </th>
      `;
    })
    .join("");

  const rows = data
    .map((item) => {
      return `
        <tr class="transition-colors">
          <td class="px-4 py-3 border-t border-slate-100 align-top text-slate-700">${item.numeroExpediente}</td>
          <td class="px-4 py-3 border-t border-slate-100 align-top text-slate-700">${item.materia}</td>
          <td class="px-4 py-3 border-t border-slate-100 align-top text-slate-700">${item.juzgado}</td>
          <td class="px-4 py-3 border-t border-slate-100 align-top text-slate-700">${formatoFechaHora(item.fechaIngreso, item.horaIngreso)}</td>
          <td class="px-4 py-3 border-t border-slate-100 align-top text-slate-700">${item.ubicacionActual}</td>
          <td class="px-4 py-3 border-t border-slate-100 align-top text-slate-700">${item.paqueteId || "-"}</td>
          <td class="px-4 py-3 border-t border-slate-100 align-top">${statusBadge(item.estado)}</td>
          <td class="px-4 py-3 border-t border-slate-100 align-top">${actionButtons(item.id, item.estado)}</td>
        </tr>
      `;
    })
    .join("");

  if (!rows) {
    return renderTable({
      columns,
      rows: [],
      emptyText: "No se encontraron expedientes para los filtros actuales"
    });
  }

  return `
    <div class="card-surface table-shell overflow-hidden">
      <div class="overflow-x-auto overflow-y-auto max-h-[68vh]">
        <table class="w-full text-sm">
          <thead>${header}</thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderFiltersPanel(data) {
  const materias = [...new Set(data.map((item) => item.materia).filter(Boolean))];
  const juzgados = [...new Set(data.map((item) => item.juzgado).filter(Boolean))];
  const ubicaciones = [...new Set(data.map((item) => item.ubicacionActual).filter(Boolean))];

  const optionList = (items) => ['<option value="">Todos</option>']
    .concat(items.map((item) => `<option value="${item}">${item}</option>`))
    .join("");

  return `
    <section class="card-surface p-4 md:p-5 space-y-4">
      <div>
        <h3 class="font-semibold text-lg">Filtros de expedientes</h3>
        <p class="text-sm text-slate-500">Búsqueda avanzada para control documental y trazabilidad judicial.</p>
      </div>

      <div class="card-soft p-3 md:p-4">
        <div class="flex flex-wrap items-center justify-between gap-2 md:gap-3 mb-3">
          <div>
            <h4 class="text-xs uppercase tracking-wide text-slate-600 font-bold">Búsqueda general</h4>
            <p class="text-xs text-slate-500">Por número, observación, juzgado o texto relacionado</p>
          </div>
          <div class="flex gap-2">
            <button id="btn-listar-manual" class="btn btn-secondary text-sm inline-flex items-center gap-1" title="Búsqueda manual">${icon("edit", "w-4 h-4")}<span>Manual</span></button>
            <button id="btn-listar-lectora" class="btn btn-secondary text-sm inline-flex items-center gap-1" title="Búsqueda por lectora">${icon("shieldCheck", "w-4 h-4")}<span>Lectora</span></button>
          </div>
        </div>
        
        <div id="estado-chip-listar" style="margin-bottom: 8px; min-height: 32px;"></div>
        
        <input id="filtro-texto" class="input-base mb-2" placeholder="N° expediente, observación, juzgado o texto relacionado" />
        
        <div id="modo-lectora-hint" class="hidden rounded-lg border ${ALERT_TONES.info.border} ${ALERT_TONES.info.surface} px-3 py-2 text-xs ${ALERT_TONES.info.text}">
          <span class="font-medium">Modo lectora:</span> Escanea el código y presione Enter para buscar automáticamente.
        </div>
      </div>

      <div class="card-soft p-3 md:p-4 grid md:grid-cols-3 gap-2 md:gap-3">
        <h4 class="md:col-span-3 text-xs uppercase tracking-wide text-slate-600 font-bold">Datos judiciales</h4>
        <select id="filtro-materia" class="select-base">${optionList(materias)}</select>
        <select id="filtro-juzgado" class="select-base">${optionList(juzgados)}</select>
        <select id="filtro-estado" class="select-base">${optionList(expedienteService.estados())}</select>
      </div>

      <div class="card-soft p-3 md:p-4 grid md:grid-cols-4 gap-2 md:gap-3">
        <h4 class="md:col-span-4 text-xs uppercase tracking-wide text-slate-600 font-bold">Ubicación y control</h4>
        <select id="filtro-ubicacion" class="select-base">${optionList(ubicaciones)}</select>
        <input id="filtro-paquete" class="input-base" placeholder="Código o ID de paquete" />
        <input id="filtro-fecha-desde" class="input-base" type="date" />
        <input id="filtro-fecha-hasta" class="input-base" type="date" />
      </div>

      <div class="flex flex-wrap gap-2 justify-end">
        <label class="inline-flex items-center gap-2 text-sm text-slate-600">
          <span>Filas por página</span>
          <select id="page-size" class="select-base w-auto">
            <option value="8" selected>8</option>
            <option value="15">15</option>
            <option value="25">25</option>
          </select>
        </label>
        <button id="btn-buscar-filtros" class="btn btn-primary inline-flex items-center gap-2">${icon("busqueda", "w-4 h-4")}<span>Buscar</span></button>
        <button id="btn-limpiar-filtros" class="btn btn-secondary">Limpiar filtros</button>
      </div>
    </section>
  `;
}

function normalizarTexto(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function filtrarExpedientes(data, filtros) {
  return data.filter((item) => {
    const textoBase = normalizarTexto(JSON.stringify(item));
    const filtroTexto = normalizarTexto(filtros.texto || "");

    const cumpleTexto = !filtroTexto || textoBase.includes(filtroTexto);
    const cumpleMateria = !filtros.materia || item.materia === filtros.materia;
    const cumpleJuzgado = !filtros.juzgado || item.juzgado === filtros.juzgado;
    const cumpleEstado = !filtros.estado || item.estado === filtros.estado;
    const cumpleUbicacion = !filtros.ubicacion || item.ubicacionActual === filtros.ubicacion;
    const cumplePaquete = !filtros.paquete || normalizarTexto(item.paqueteId || "").includes(normalizarTexto(filtros.paquete));

    const fechaItem = item.fechaIngreso || "";
    const cumpleFechaDesde = !filtros.fechaDesde || (fechaItem && fechaItem >= filtros.fechaDesde);
    const cumpleFechaHasta = !filtros.fechaHasta || (fechaItem && fechaItem <= filtros.fechaHasta);

    return (
      cumpleTexto &&
      cumpleMateria &&
      cumpleJuzgado &&
      cumpleEstado &&
      cumpleUbicacion &&
      cumplePaquete &&
      cumpleFechaDesde &&
      cumpleFechaHasta
    );
  });
}

function getFiltros() {
  return {
    texto: document.getElementById("filtro-texto")?.value || "",
    materia: document.getElementById("filtro-materia")?.value || "",
    juzgado: document.getElementById("filtro-juzgado")?.value || "",
    estado: document.getElementById("filtro-estado")?.value || "",
    ubicacion: document.getElementById("filtro-ubicacion")?.value || "",
    paquete: document.getElementById("filtro-paquete")?.value || "",
    fechaDesde: document.getElementById("filtro-fecha-desde")?.value || "",
    fechaHasta: document.getElementById("filtro-fecha-hasta")?.value || ""
  };
}

function renderPagination(totalItems, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return `
    <div class="card-surface p-3 flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm text-slate-600">Página ${page} de ${totalPages} · ${totalItems} resultado(s)</p>
      <div class="flex items-center gap-2">
        <button id="page-prev" class="btn btn-secondary text-sm" ${page <= 1 ? "disabled" : ""}>Anterior</button>
        <button id="page-next" class="btn btn-secondary text-sm" ${page >= totalPages ? "disabled" : ""}>Siguiente</button>
      </div>
    </div>
  `;
}

function sliceByPage(data, page, pageSize) {
  const start = (page - 1) * pageSize;
  return data.slice(start, start + pageSize);
}

function valorOrden(item, key) {
  if (key === "expediente") {
    // Extraer número numérico del expediente para ordenar correctamente
    const match = item.numeroExpediente?.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
  if (key === "materia") return item.materia || "";
  if (key === "juzgado") return item.juzgado || "";
  if (key === "ubicacion") return item.ubicacionActual || "";
  if (key === "paquete") return item.paqueteId || "";
  if (key === "estado") return item.estado || "";
  if (key === "ingreso") return `${item.fechaIngreso || ""} ${item.horaIngreso || ""}`;
  return "";
}

function ordenarExpedientes(data, sortState) {
  const sorted = [...data];
  sorted.sort((a, b) => {
    const valueA = valorOrden(a, sortState.key);
    const valueB = valorOrden(b, sortState.key);
    
    // Para expediente, ordenar numéricamente
    if (sortState.key === "expediente") {
      const numA = typeof valueA === 'number' ? valueA : 0;
      const numB = typeof valueB === 'number' ? valueB : 0;
      return sortState.direction === "asc" ? numA - numB : numB - numA;
    }
    
    // Para otros campos, ordenar alfabéticamente
    const textA = normalizarTexto(String(valueA));
    const textB = normalizarTexto(String(valueB));
    if (textA < textB) return sortState.direction === "asc" ? -1 : 1;
    if (textA > textB) return sortState.direction === "asc" ? 1 : -1;
    return 0;
  });
  return sorted;
}

function modalDetalle(expediente) {
  const movimientos = expedienteService
    .listarMovimientos()
    .filter((mov) => mov.expedienteId === expediente.id)
    .slice(0, 12);

  const ultimaAccion = movimientos[0];
  const trazabilidad = {
    totalMovimientos: movimientos.length,
    ultimaFecha: ultimaAccion ? `${ultimaAccion.fecha} ${ultimaAccion.hora}` : "Sin movimientos",
    ultimoDestino: ultimaAccion?.destino || "-",
    ultimoMotivo: ultimaAccion?.motivo || "-"
  };

  const datosTab = `
    <div class="grid md:grid-cols-2 gap-3 text-sm">
      <div><span class="text-slate-500">Materia:</span> <strong>${expediente.materia}</strong></div>
      <div><span class="text-slate-500">Juzgado:</span> <strong>${expediente.juzgado}</strong></div>
      <div><span class="text-slate-500">Código corte:</span> <strong>${expediente.codigoCorte}</strong></div>
      <div><span class="text-slate-500">Incidente:</span> <strong>${expediente.incidente}</strong></div>
      <div><span class="text-slate-500">Ingreso:</span> <strong>${formatoFechaHora(expediente.fechaIngreso, expediente.horaIngreso)}</strong></div>
      <div><span class="text-slate-500">Ubicación:</span> <strong>${expediente.ubicacionActual}</strong></div>
      <div><span class="text-slate-500">Paquete:</span> <strong>${expediente.paqueteId || "-"}</strong></div>
      <div><span class="text-slate-500">Estado:</span> ${statusBadge(expediente.estado)}</div>
      <div class="md:col-span-2"><span class="text-slate-500">Observaciones:</span> <strong>${expediente.observaciones || "Sin observaciones"}</strong></div>
    </div>
  `;

  const movimientosTab = movimientos.length
    ? `
      <div class="space-y-2 max-h-72 overflow-y-auto pr-1 text-sm">
        ${movimientos
          .map(
            (mov) => `
          <div class="rounded-lg border border-slate-200 p-3 bg-slate-50">
            <p><strong>${mov.fecha} ${mov.hora}</strong> · ${mov.usuario}</p>
            <p class="text-slate-600">${mov.origen} → ${mov.destino}</p>
            <p class="text-slate-600">Motivo: ${mov.motivo}</p>
            <p class="text-slate-500">${mov.observacion || "Sin observación"}</p>
          </div>
        `
          )
          .join("")}
      </div>
    `
    : '<p class="text-sm text-slate-500">No hay movimientos registrados para este expediente.</p>';

  const trazabilidadTab = `
    <div class="grid sm:grid-cols-2 gap-3 text-sm">
      <div class="card-soft p-3"><p class="text-slate-500">Total movimientos</p><p class="text-xl font-bold">${trazabilidad.totalMovimientos}</p></div>
      <div class="card-soft p-3"><p class="text-slate-500">Última actualización</p><p class="font-bold">${trazabilidad.ultimaFecha}</p></div>
      <div class="card-soft p-3"><p class="text-slate-500">Último destino</p><p class="font-bold">${trazabilidad.ultimoDestino}</p></div>
      <div class="card-soft p-3"><p class="text-slate-500">Último motivo</p><p class="font-bold">${trazabilidad.ultimoMotivo}</p></div>
    </div>
  `;

  openModal({
    title: `Detalle judicial ${expediente.numeroExpediente}`,
    content: `
      <div class="space-y-4">
        <div class="flex gap-2 border-b border-slate-200 pb-2">
          <button class="btn btn-secondary text-xs" data-tab="datos">Datos</button>
          <button class="btn btn-secondary text-xs" data-tab="movimientos">Movimientos</button>
          <button class="btn btn-secondary text-xs" data-tab="trazabilidad">Trazabilidad</button>
        </div>
        <div id="tab-datos">${datosTab}</div>
        <div id="tab-movimientos" class="hidden">${movimientosTab}</div>
        <div id="tab-trazabilidad" class="hidden">${trazabilidadTab}</div>
      </div>
    `,
    confirmText: "Cerrar",
    onConfirm: (close) => close()
  });

  setTimeout(() => {
    const tabs = ["datos", "movimientos", "trazabilidad"];
    const showTab = (tabName) => {
      tabs.forEach((name) => {
        const target = document.getElementById(`tab-${name}`);
        if (!target) return;
        target.classList.toggle("hidden", name !== tabName);
      });
    };

    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => showTab(button.dataset.tab));
    });
  }, 0);
}

function modalMovimiento(expediente, onSaved) {
  openModal({
    title: `Actualizar expediente ${expediente.numeroExpediente}`,
    content: `
      <div class="grid gap-3">
        <div>
          <label class="text-sm">Nueva ubicación</label>
          <input id="modal-ubicacion" class="input-base" value="${expediente.ubicacionActual}" />
        </div>
        <div>
          <label class="text-sm">Estado</label>
          <select id="modal-estado" class="select-base">
            ${expedienteService
              .estados()
              .map((estado) => `<option value="${estado}" ${estado === expediente.estado ? "selected" : ""}>${estado}</option>`)
              .join("")}
          </select>
        </div>
        <div>
          <label class="text-sm">Motivo</label>
          <input id="modal-motivo" class="input-base" value="Actualización de expediente" />
        </div>
      </div>
    `,
    onConfirm: (close) => {
      expedienteService.actualizarUbicacionEstado({
        id: expediente.id,
        ubicacionActual: document.getElementById("modal-ubicacion")?.value,
        estado: document.getElementById("modal-estado")?.value,
        motivo: document.getElementById("modal-motivo")?.value,
        observacion: "Actualizado desde listado"
      });
      close();
      onSaved();
      showToast("Expediente actualizado", "success");
    },
    confirmText: "Guardar cambios"
  });
}

function modalSalida(expediente, onSaved) {
  openModal({
    title: `Registrar salida ${expediente.numeroExpediente}`,
    content: `
      <div class="grid gap-3">
        <div>
          <label class="text-sm">Tipo de salida</label>
          <select id="modal-salida-tipo" class="select-base">
            <option value="">Seleccione tipo</option>
            <option value="PRESTAMO">Préstamo</option>
            <option value="SALIDA_INTERNA">Salida interna</option>
            <option value="SALIDA_EXTERNA">Salida externa</option>
            <option value="ENVIO_DEFINITIVO">Envío definitivo</option>
          </select>
        </div>
        <div>
          <label class="text-sm">Destino</label>
          <select id="modal-salida-destino" class="select-base" disabled>
            <option value="">Seleccione tipo primero</option>
          </select>
        </div>
        <div>
          <label class="text-sm">Motivo de salida</label>
          <select id="modal-salida-motivo" class="select-base" disabled>
            <option value="">Seleccione tipo primero</option>
          </select>
        </div>
        <div>
          <label class="text-sm">Observación</label>
          <input id="modal-salida-observacion" class="input-base" placeholder="Observación opcional" value="Salida registrada desde listado" />
        </div>
      </div>
    `,
    confirmText: "Registrar salida",
    onConfirm: (close) => {
      const tipo = document.getElementById("modal-salida-tipo")?.value || "";
      const destino = document.getElementById("modal-salida-destino")?.value || "";
      const motivo = document.getElementById("modal-salida-motivo")?.value || "";
      const observacion = document.getElementById("modal-salida-observacion")?.value || "Salida registrada desde listado";

      if (!tipo) {
        showToast("Debes seleccionar tipo de salida", "warning");
        return;
      }
      if (!destino) {
        showToast("Debes seleccionar destino", "warning");
        return;
      }
      if (!motivo) {
        showToast("Debes seleccionar motivo de salida", "warning");
        return;
      }

      expedienteService.actualizarUbicacionEstado({
        id: expediente.id,
        ubicacionActual: prettyLabel(destino),
        estado: "Derivado",
        motivo: prettyLabel(motivo),
        observacion
      });

      close();
      onSaved();
      showToast("Salida registrada correctamente", "success");
    }
  });

  const tipoEl = document.getElementById("modal-salida-tipo");
  const destinoEl = document.getElementById("modal-salida-destino");
  const motivoEl = document.getElementById("modal-salida-motivo");

  const poblarSelect = (el, opciones, placeholder) => {
    if (!el) return;
    el.innerHTML = `<option value="">${placeholder}</option>${opciones
      .map((opt) => `<option value="${opt}">${prettyLabel(opt)}</option>`)
      .join("")}`;
    el.disabled = opciones.length === 0;
  };

  tipoEl?.addEventListener("change", () => {
    const reglas = SALIDA_EXPEDIENTE_RULES[String(tipoEl.value || "").trim()];
    if (!reglas) {
      poblarSelect(destinoEl, [], "Seleccione tipo primero");
      poblarSelect(motivoEl, [], "Seleccione tipo primero");
      return;
    }
    poblarSelect(destinoEl, reglas.destinos, "Seleccione destino");
    poblarSelect(motivoEl, reglas.motivos, "Seleccione motivo");
  });
}

function modalRetorno(expediente, onSaved) {
  const responsableRecepcion = obtenerUsuarioLogueadoTexto();

  openModal({
    title: `Registrar retorno ${expediente.numeroExpediente}`,
    content: `
      <div class="grid gap-3">
        <div>
          <label class="text-sm">Motivo de retorno</label>
          <select id="modal-retorno-motivo" class="select-base">
            <option value="">Seleccione motivo</option>
            <option value="DEVOLUCION_PRESTAMO">Devolución de préstamo</option>
            <option value="CULMINO_REVISION">Culminó revisión</option>
            <option value="RETORNO_DESDE_AUDIENCIA">Retorno desde audiencia</option>
          </select>
        </div>
        <div>
          <label class="text-sm">Condición de retorno</label>
          <select id="modal-retorno-condicion" class="select-base">
            <option value="">Seleccione condición</option>
            <option value="CONFORME">Conforme</option>
            <option value="CON_OBSERVACION">Con observación</option>
          </select>
        </div>
        <div>
          <label class="text-sm">Responsable de recepción</label>
          <input id="modal-retorno-responsable" class="input-base" value="${responsableRecepcion}" readonly />
        </div>
        <div>
          <label class="text-sm">Observación</label>
          <input id="modal-retorno-observacion" class="input-base" placeholder="Detalle del retorno (obligatorio si hay observación)" />
        </div>
      </div>
    `,
    confirmText: "Registrar retorno",
    onConfirm: (close) => {
      const motivo = document.getElementById("modal-retorno-motivo")?.value || "";
      const condicion = document.getElementById("modal-retorno-condicion")?.value || "";
      const observacion = document.getElementById("modal-retorno-observacion")?.value || "";

      if (!motivo) {
        showToast("Debes seleccionar motivo de retorno", "warning");
        return;
      }
      if (!condicion) {
        showToast("Debes seleccionar condición de retorno", "warning");
        return;
      }
      if (condicion === "CON_OBSERVACION" && !String(observacion).trim()) {
        showToast("Debes detallar la observación del retorno", "warning");
        return;
      }

      const estadoRetorno = resolverEstadoRetornoLegacy();
      const observacionFinal = [
        `RETORNO: ${prettyLabel(motivo)}`,
        `CONDICION: ${prettyLabel(condicion)}`,
        String(observacion || "").trim()
      ].filter(Boolean).join(" | ");

      expedienteService.actualizarUbicacionEstado({
        id: expediente.id,
        ubicacionActual: "ARCHIVO_MODULAR",
        estado: estadoRetorno,
        motivo: prettyLabel(motivo),
        observacion: observacionFinal
      });

      close();
      onSaved();
      showToast("Retorno registrado correctamente", "success");
    }
  });
}

export function initListadoPage({ mountNode }) {
  const data = expedienteService.listar();
  let page = 1;
  let pageSize = PAGE_SIZE_DEFAULT;
  let sortState = { key: "expediente", direction: "desc" };
  let modoLectoraListado = false;

  mountNode.innerHTML = `
    ${renderFiltersPanel(data)}
    <section id="listado-container"></section>
    <section id="pagination-container" class="mt-3"></section>
  `;

  // Función para actualizar chip de estado
  function actualizarChipListado(estado, esLectora) {
    const chip = document.getElementById("estado-chip-listar");
    let html = '';
    
    if (estado === "pendiente") {
      html = `<div class="px-2 py-1 rounded border ${ALERT_TONES.neutral.border} ${ALERT_TONES.neutral.surface} text-xs ${ALERT_TONES.neutral.text}">
        ${esLectora ? "Modo lectora" : "Modo manual"} - Esperando entrada...
      </div>`;
    } else if (estado === "valido") {
      html = `<div class="px-2 py-1 rounded border ${ALERT_TONES.success.border} ${ALERT_TONES.success.surface} text-xs font-semibold ${ALERT_TONES.success.text}">
        Válido - Buscando automáticamente...
      </div>`;
    }
    
    chip.innerHTML = html;
  }

  // Validar entrada de filtro
  function validarNumeroListado() {
    const filtroTexto = document.getElementById("filtro-texto");
    const valor = filtroTexto.value.trim().toUpperCase();

    if (!valor) {
      actualizarChipListado("pendiente", modoLectoraListado);
      return;
    }

    if (modoLectoraListado && (/^\d{20}$/.test(valor) || /^\d{23}$/.test(valor))) {
      const parsed = parsearLectora(valor);
      if (parsed) {
        actualizarChipListado("valido", true);
        filtroTexto.value = parsed.numeroExpediente;
        page = 1;
        renderResults();
        return;
      }
    }

    if (!modoLectoraListado && validarNumeroExpediente(valor)) {
      actualizarChipListado("valido", false);
      page = 1;
      renderResults();
    }
  }

  actualizarChipListado("pendiente", false);

  // Listeners de botones Manual/Lectora
  document.getElementById("btn-listar-manual")?.addEventListener("click", () => {
    modoLectoraListado = false;
    const filtroTexto = document.getElementById("filtro-texto");
    filtroTexto.value = "";
    filtroTexto.focus();
    actualizarChipListado("pendiente", false);
    document.getElementById("modo-lectora-hint")?.classList.add("hidden");
    showToast("Búsqueda manual activada", "info");
  });

  document.getElementById("btn-listar-lectora")?.addEventListener("click", () => {
    modoLectoraListado = true;
    const filtroTexto = document.getElementById("filtro-texto");
    filtroTexto.value = "";
    filtroTexto.focus();
    actualizarChipListado("pendiente", true);
    document.getElementById("modo-lectora-hint")?.classList.remove("hidden");
    
    openModal({
      title: "Modo Lectora - Ver Expedientes",
      content: `
        <div class="space-y-4">
          <p class="text-base font-medium text-slate-700">N° expediente, observación, juzgado o texto relacionado</p>
          
          <div class="${ALERT_TONES.info.surface} border ${ALERT_TONES.info.border} rounded-lg p-4 space-y-2">
            <p class="text-sm ${ALERT_TONES.info.text} font-semibold inline-flex items-center gap-2">${icon("list", "w-4 h-4")}<span>Instrucciones:</span></p>
            <ol class="text-sm ${ALERT_TONES.info.text} space-y-2 ml-4 list-decimal">
              <li>Acerca el código de barras al escáner</li>
              <li>El código se ingresará automáticamente</li>
              <li>Presiona <strong>ENTER</strong> para buscar automáticamente</li>
              <li>Los expedientes coincidentes aparecerán en la lista</li>
            </ol>
          </div>
          
          <p class="text-xs text-slate-600 italic">El código de barras debe tener entre 20-23 dígitos</p>
        </div>
      `,
      confirmText: "Entendido",
      onConfirm: (close) => {
        close();
        showToast("Escanea el código y presione Enter para buscar automáticamente", "success");
      }
    });
  });

  // Listener para tecla Enter en modo lectora
  const filtroTexto = document.getElementById("filtro-texto");
  filtroTexto?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && modoLectoraListado) {
      e.preventDefault();
      validarNumeroListado();
    }
  });

  filtroTexto?.addEventListener("input", () => {
    if (modoLectoraListado) {
      validarNumeroListado();
    }
  });

  function renderResults() {
    const filtros = getFiltros();
    const filtered = filtrarExpedientes(data, filtros);
    const sorted = ordenarExpedientes(filtered, sortState);
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    page = Math.min(page, totalPages);

    document.getElementById("listado-container").innerHTML = renderListado(sliceByPage(sorted, page, pageSize), sortState);
    document.getElementById("pagination-container").innerHTML = renderPagination(sorted.length, page, pageSize);

    bindActions();
    bindPagination(sorted.length);
    bindSort();
  }

  function bindActions() {
    mountNode.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        const expediente = expedienteService.obtener(id);
        if (!expediente) return;

        if (button.dataset.action === "detalle") {
          modalDetalle(expediente);
          return;
        }

        if (button.dataset.action === "salida") {
          modalSalida(expediente, () => initListadoPage({ mountNode }));
          return;
        }

        if (button.dataset.action === "retorno") {
          modalRetorno(expediente, () => initListadoPage({ mountNode }));
          return;
        }

        modalMovimiento(expediente, () => initListadoPage({ mountNode }));
      });
    });
  }

  function bindPagination(totalItems) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    document.getElementById("page-prev")?.addEventListener("click", () => {
      if (page > 1) {
        page -= 1;
        renderResults();
      }
    });
    document.getElementById("page-next")?.addEventListener("click", () => {
      if (page < totalPages) {
        page += 1;
        renderResults();
      }
    });
  }

  function bindSort() {
    mountNode.querySelectorAll("[data-sort-key]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.sortKey;
        if (!key) return;

        if (sortState.key === key) {
          sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
        } else {
          sortState = { key, direction: "asc" };
        }

        page = 1;
        renderResults();
      });
    });
  }

  [
    "filtro-texto",
    "filtro-materia",
    "filtro-juzgado",
    "filtro-estado",
    "filtro-ubicacion",
    "filtro-paquete",
    "filtro-fecha-desde",
    "filtro-fecha-hasta"
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      page = 1;
      renderResults();
    });
    document.getElementById(id)?.addEventListener("change", () => {
      page = 1;
      renderResults();
    });
  });

  document.getElementById("btn-limpiar-filtros")?.addEventListener("click", () => {
    [
      "filtro-texto",
      "filtro-materia",
      "filtro-juzgado",
      "filtro-estado",
      "filtro-ubicacion",
      "filtro-paquete",
      "filtro-fecha-desde",
      "filtro-fecha-hasta"
    ].forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;
      element.value = "";
    });
    page = 1;
    renderResults();
    showToast("Filtros reiniciados", "info");
  });

  document.getElementById("btn-buscar-filtros")?.addEventListener("click", () => {
    page = 1;
    renderResults();
    showToast("Búsqueda aplicada", "info");
  });

  document.getElementById("page-size")?.addEventListener("change", (event) => {
    pageSize = Number(event.target.value) || PAGE_SIZE_DEFAULT;
    page = 1;
    renderResults();
  });

  renderResults();
}
