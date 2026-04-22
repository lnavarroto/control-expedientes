import { renderExpedienteForm, renderFormularioLectora } from "../../components/expedienteForm.js";
import { openModal } from "../../components/modal.js";
import { renderTable } from "../../components/table.js";
import { statusBadge } from "../../components/statusBadge.js";
import { showToast } from "../../components/toast.js";
import { expedienteService } from "../../services/expedienteService.js";
import { juzgadoService } from "../../services/juzgadoService.js";
import { paqueteService } from "../../services/paqueteService.js";
import { estadoService } from "../../services/estadoService.js";
import { authManager } from "../../auth/authManager.js";
import { formatoFechaHora, horaActual, hoyIso } from "../../utils/formatters.js";
import { validarIncidente, validarNumeroExpediente } from "../../utils/validators.js";
import { parsearLectora, extraerCodigoLectora } from "../../utils/lectora.js";
import { guardarExpedienteAlBackendConConfirmacion } from "./registroExpedienteBackendIntegracion.js";
import { icon } from "../../components/icons.js";
import { ALERT_TONES } from "../../core/uiTokens.js";


function filaRegistro(item = {}) {
  const numero = item.numero_expediente || item.numeroExpediente || "-";
  const fecha = item.fecha_ingreso || item.fechaIngreso || "-";
  const hora = item.hora_ingreso || item.horaIngreso || "-";
  const ingreso = (fecha && hora && fecha !== "-" && hora !== "-")
    ? `${fecha} ${hora}`
    : (item.fecha_hora_ingreso || formatoFechaHora(item.fechaIngreso, item.horaIngreso) || "-");

  return {
    id: item.id_expediente || item.id || "-",
    numero,
    juzgado: item.juzgado_texto || item.juzgado || "-",
    ingreso,
    estado: item.id_estado || item.estado || "-",
    usuario: item.registrado_por || "-"
  };
}

function correlativoExpediente(item = {}) {
  const id = String(item.id_expediente || item.id || "").trim();
  const match = id.match(/EXP-(\d+)/i);
  if (!match) return 0;
  return Number(match[1]) || 0;
}

function timestampIngreso(item = {}) {
  const fecha = String(item.fecha_ingreso || item.fechaIngreso || "").trim();
  const hora = String(item.hora_ingreso || item.horaIngreso || "").trim();
  const fechaHora = String(item.fecha_hora_ingreso || "").trim();

  const desdeFechaHora = Date.parse(fechaHora);
  if (!Number.isNaN(desdeFechaHora)) return desdeFechaHora;

  if (fecha) {
    const compuesto = `${fecha} ${hora || "00:00:00"}`;
    const parsed = Date.parse(compuesto);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
}

function abrirModalListadoRegistros(registros = []) {
  const root = document.getElementById("modal-root");
  if (!root) return;

  const registrosOrdenados = [...registros].sort((a, b) => {
    const correlativoA = correlativoExpediente(a);
    const correlativoB = correlativoExpediente(b);
    if (correlativoA !== correlativoB) {
      return correlativoB - correlativoA;
    }

    return timestampIngreso(b) - timestampIngreso(a);
  });

  const rows = registrosOrdenados.map(filaRegistro);
  const columns = [
    { key: "id", label: "ID" },
    { key: "numero", label: "Numero Expediente" },
    { key: "juzgado", label: "Juzgado" },
    { key: "ingreso", label: "Fecha / Hora" },
    { key: "estado", label: "Estado" },
    { key: "usuario", label: "Registrado por" }
  ];

  const modalId = `modal-registros-${Date.now()}`;
  root.innerHTML = `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" id="${modalId}">
      <div class="card-surface w-full max-w-6xl p-4 md:p-6 space-y-4 max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 class="font-bold text-lg text-slate-900">Listado de registros</h3>
          <button id="btn-cerrar-modal-registros" class="text-slate-500 hover:text-slate-700 text-2xl leading-none">&times;</button>
        </div>
        <div class="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label for="filtro-numero-expediente" class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Filtrar por numero de expediente</label>
            <input id="filtro-numero-expediente" class="input-base w-full" placeholder="Ej: 00012-2026-1-3101-CI-01" />
          </div>
          <div class="flex gap-2">
            <button id="btn-filtrar-numero-expediente" class="btn btn-primary inline-flex items-center gap-2">${icon("busqueda", "w-4 h-4")}<span>Filtrar</span></button>
            <button id="btn-limpiar-filtro-expediente" class="btn btn-secondary inline-flex items-center gap-2">${icon("refreshCw", "w-4 h-4")}<span>Limpiar</span></button>
          </div>
        </div>
        <p id="total-registros-modal" class="text-sm text-slate-600">Total: <strong>${rows.length}</strong> registro(s)</p>
        <div id="tabla-registros-modal" class="pr-1"></div>
      </div>
    </div>
  `;

  const tablaContainer = document.getElementById("tabla-registros-modal");
  const totalEl = document.getElementById("total-registros-modal");
  const inputFiltro = document.getElementById("filtro-numero-expediente");
  const btnFiltrar = document.getElementById("btn-filtrar-numero-expediente");
  const btnLimpiar = document.getElementById("btn-limpiar-filtro-expediente");

  const renderFiltrado = () => {
    const valorFiltro = (inputFiltro?.value || "").trim().toUpperCase();
    const rowsFiltradas = !valorFiltro
      ? rows
      : rows.filter((row) => String(row.numero || "").toUpperCase().includes(valorFiltro));

    if (totalEl) {
      totalEl.innerHTML = `Total: <strong>${rowsFiltradas.length}</strong> registro(s)`;
    }

    if (tablaContainer) {
      tablaContainer.innerHTML = renderTable({
        columns,
        rows: rowsFiltradas,
        emptyText: valorFiltro
          ? "No hay registros que coincidan con el numero de expediente"
          : "No hay registros para mostrar"
      });
    }
  };

  btnFiltrar?.addEventListener("click", renderFiltrado);
  btnLimpiar?.addEventListener("click", () => {
    if (inputFiltro) {
      inputFiltro.value = "";
      inputFiltro.focus();
    }
    renderFiltrado();
  });
  inputFiltro?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      renderFiltrado();
    }
  });

  renderFiltrado();

  const close = () => document.getElementById(modalId)?.remove();
  document.getElementById("btn-cerrar-modal-registros")?.addEventListener("click", close);
  document.getElementById(modalId)?.addEventListener("click", (e) => {
    if (e.target?.id === modalId) close();
  });
}



function defaults() {
  return {
    fechaIngreso: hoyIso(),
    horaIngreso: horaActual(),
    estado: "Ingresado",
    incidente: "0",
    codigoCorte: "3101",
    materia: "CI",
    ubicacionActual: "Estante"
  };
}

function parseForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const juzgadoFinal = data.juzgadoManual?.trim()
    ? data.juzgadoManual.trim()
    : data.juzgado;

  let numeroExpediente = data.numeroExpediente?.trim().toUpperCase() || "";

 if (numeroExpediente && !numeroExpediente.includes("-")) {
  const numero = (data.numeroExpediente || "").padStart(5, "0");
  const anio = data.anio || "0000";
  const incidente = data.incidente || "0";
  let codigoCorte = (data.codigoCorte || "3101").toString().trim().toUpperCase();
  const materia = (data.materia || "CI").toString().trim().toUpperCase();
  const determinador = (data.numeroJuzgado || "01").toString().padStart(2, "0");

  let tipoOrgano = (data.tipoOrgano || "").toString().trim().toUpperCase();

  // Si codigoCorte viene como 3101-JR, separar correctamente
  if (codigoCorte.includes("-")) {
    const partesCorte = codigoCorte.split("-");
    codigoCorte = partesCorte[0] || "3101";
    if (!tipoOrgano && partesCorte[1]) {
      tipoOrgano = partesCorte[1];
    }
  }

  if (!tipoOrgano) {
    tipoOrgano = "JR";
  }

  numeroExpediente = `${numero}-${anio}-${incidente}-${codigoCorte}-${tipoOrgano}-${materia}-${determinador}`;
}

return {
  ...data,
  id_juzgado: String(data.id_juzgado || "").trim(),
  juzgado: juzgadoFinal,
  numeroExpediente: numeroExpediente,
  tipoOrgano: extraerTipoOrganoDesdeCodigo(numeroExpediente) || String(data.tipoOrgano || "").trim().toUpperCase() || "JR",
  codigoLecturaRaw: data.codigoLecturaRaw || "",
  textoRelacionado: `${numeroExpediente} ${data.materia} ${juzgadoFinal} ${data.observaciones || ""}`.toLowerCase()
};
}
function extraerTipoOrganoDesdeCodigo(numeroExpediente) {
  const texto = String(numeroExpediente || "").trim().toUpperCase();
  if (!texto) return "";

  const partes = texto.split("-");
  if (partes.length >= 5) {
    return String(partes[4] || "").trim().toUpperCase();
  }

  return "";
}
function intentarAutoCompletar(form, numeroExpediente) {
  // Esta función fue movida al componente numeroExpedienteChip.js
  // Se mantiene aquí solo para compatibilidad temporaria
  const detectado = expedienteService.detectarCampos(numeroExpediente);
  if (!detectado) return false;

  try {
    const setField = (name, value) => {
      const field = form.elements[name];
      if (field && value !== null && value !== undefined) {
        field.value = value;
      }
    };

    setField("anio", detectado.anio);
    setField("incidente", detectado.incidente);
    setField("codigoCorte", detectado.codigoCorte);
    setField("materia", detectado.materia);
    setField("juzgado", detectado.juzgadoSugerido);
    
    return true;
  } catch (error) {
    console.error("Error al autocompletar:", error);
    return false;
  }
}

function actualizarEstadoVisual(form) {
  const preview = document.getElementById("estado-preview");
  if (!preview || !form?.estado) return;
  preview.innerHTML = statusBadge(form.estado.value);
}



function guardarConConfirmacion(form, mountNode, modoLectora = false) {
  const data = parseForm(form);
  const fechaHoraRegistro = {
    fechaIngreso: hoyIso(),
    horaIngreso: horaActual()
  };

  if (form.fechaIngreso) form.fechaIngreso.value = fechaHoraRegistro.fechaIngreso;
  if (form.horaIngreso) form.horaIngreso.value = fechaHoraRegistro.horaIngreso;

  if (!validarNumeroExpediente(data.numeroExpediente)) {
    showToast("Corrija el formato del número de expediente.", "error");
    return;
  }

  if (!validarIncidente(data.incidente)) {
    showToast("El incidente debe estar entre 0 y 999.", "warning");
    return;
  }

  // Validar determinador (01-09) - ser más flexible
  let determinador = data.numeroJuzgado || form.numeroJuzgado?.value?.trim() || "01";
  let determinadorNum = parseInt(determinador, 10);
  
  // Si el determinador es inválido, usar valor por defecto
  if (!determinador || determinador.length !== 2 || !/^\d+$/.test(determinador) || determinadorNum < 1 || determinadorNum > 9) {
    console.warn(`⚠️ Determinador inválido: "${determinador}", usando "01"`, { data, form: form.numeroJuzgado?.value });
    determinador = "01";
    determinadorNum = 1;
    
    // Actualizar en el formulario para futuras referencias
    if (form.numeroJuzgado) {
      form.numeroJuzgado.value = "01";
    }
  }

  // ============ NUEVO: ENVIAR AL BACKEND ============
  const usuario = authManager.getTrabajador();
  if (!usuario) {
    showToast("❌ Debes estar logueado para registrar", "error");
    return;
  }

  // Obtener botón guardar
  const btnGuardar = document.getElementById("btn-guardar") || form.querySelector("button[type='submit']");

  // Llamar nueva función que maneja todo, pasando el determinador validado
return guardarExpedienteAlBackendConConfirmacion(
  {
    numeroExpediente: data.numeroExpediente,
    anio: data.anio || new Date().getFullYear(),
    incidente: data.incidente,
    codigoCorte: data.codigoCorte || "3101",
    tipoOrgano: data.tipoOrgano || extraerTipoOrganoDesdeCodigo(data.numeroExpediente) || "JR",
    materia: data.materia,
    id_juzgado: data.id_juzgado || "",
    juzgado: data.juzgado,
    numeroJuzgado: determinador,
    fechaIngreso: fechaHoraRegistro.fechaIngreso,
    horaIngreso: fechaHoraRegistro.horaIngreso,
    observaciones: data.observaciones,
    codigoLecturaRaw: data.codigoLecturaRaw || ""
  },
  mountNode,
  modoLectora,
  btnGuardar
);
}

export function initRegistroPage({ mountNode }) {
  let modoLectora = false;

  // Renderizar contenedor principal
  mountNode.innerHTML = `
    <section>
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h3 class="font-semibold text-lg">Nuevo registro</h3>
          <p class="text-sm text-slate-500">Completa el formulario para registrar un nuevo expediente.</p>
        </div>
        <div class="flex gap-2">
          <button id="btn-listar-registros" class="btn btn-secondary inline-flex items-center gap-2" title="Ver todos los registros">${icon("list", "w-4 h-4")}<span>Listar</span></button>
          <button id="btn-modo-manual" class="btn btn-secondary inline-flex items-center gap-2" title="Entrada manual con teclado">${icon("edit", "w-4 h-4")}<span>Manual</span></button>
          <button id="btn-modo-lectora" class="btn btn-secondary inline-flex items-center gap-2" title="Presiona Enter para completar con lectora">${icon("shieldCheck", "w-4 h-4")}<span>Lectora</span></button>
        </div>
      </div>
      
      <div id="form-container">${renderExpedienteForm(defaults())}</div>
    </section>
  `;

  // ============ SETUP INICIAL - MODO MANUAL ============
  setupFormManual();

  // ============ BOTONES DE MODO ============
  document.getElementById("btn-listar-registros")?.addEventListener("click", async () => {
    showToast("Cargando registros...", "info");

    const ordenarRegistros = (data = []) => [...data].sort((a, b) => {
      const correlativoA = correlativoExpediente(a);
      const correlativoB = correlativoExpediente(b);
      if (correlativoA !== correlativoB) {
        return correlativoB - correlativoA;
      }
      return timestampIngreso(b) - timestampIngreso(a);
    });

    try {
      const resultado = await expedienteService.listarDelBackend({ forceRefresh: true });
      const registros = resultado?.success && Array.isArray(resultado.data)
        ? resultado.data
        : expedienteService.listar();

      abrirModalListadoRegistros(ordenarRegistros(registros));
    } catch (error) {
      console.warn("⚠️ Error cargando registros para modal:", error);
      abrirModalListadoRegistros(ordenarRegistros(expedienteService.listar()));
    }
  });

  document.getElementById("btn-modo-manual")?.addEventListener("click", () => {
    modoLectora = false;
    const formContainer = document.getElementById("form-container");
    formContainer.innerHTML = renderExpedienteForm(defaults());
    setupFormManual();
    showToast("Modo manual activado", "info");
  });

  document.getElementById("btn-modo-lectora")?.addEventListener("click", () => {
    modoLectora = true;
    const formContainer = document.getElementById("form-container");
    formContainer.innerHTML = renderFormularioLectora(defaults());
    setupFormLectora();
    
    openModal({
      title: "Modo Lectora - Registro de Expedientes",
      content: `
        <div class="space-y-4">
          <p class="text-base font-medium text-slate-700">Usando escáner de códigos de barras - <strong>Solo ENTER ENTER</strong></p>
          
          <div class="${ALERT_TONES.info.surface} border ${ALERT_TONES.info.border} rounded-lg p-4 space-y-2">
            <p class="text-sm ${ALERT_TONES.info.text} font-semibold inline-flex items-center gap-2">${icon("refreshCw", "w-4 h-4")}<span>Flujo rápido (ENTER ENTER):</span></p>
            <ol class="text-sm ${ALERT_TONES.info.text} space-y-2 ml-4 list-decimal">
              <li><strong>ENTER 1:</strong> Escanea el código (se procesará automáticamente)</li>
              <li><strong>ENTER 2:</strong> Presiona ENTER nuevamente para registrar</li>
              <li>El expediente se creará en el backend sin confirmación adicional</li>
            </ol>
          </div>
          
          <div class="${ALERT_TONES.info.surface} border ${ALERT_TONES.info.border} rounded-lg p-3 space-y-2">
            <p class="text-xs ${ALERT_TONES.info.text} font-semibold">Si el escáner no captura bien el código:</p>
            <ul class="text-xs ${ALERT_TONES.info.text} ml-4 list-disc space-y-1">
              <li>Puedes <strong>editar manualmente</strong> el código en el campo</li>
              <li>Debe tener <strong>entre 20-23 dígitos numéricos</strong></li>
              <li>Se aceptan códigos con problemas menores (se autocorrigen)</li>
            </ul>
          </div>
          
          <div class="${ALERT_TONES.warning.surface} border ${ALERT_TONES.warning.border} rounded-lg p-3">
            <p class="text-xs ${ALERT_TONES.warning.text} font-semibold">Nota: Solo se aceptan dígitos (0-9). Caracteres especiales se ignoran automáticamente</p>
          </div>
        </div>
      `,
      confirmText: "Entendido",
      onConfirm: (close) => {
        close();
        document.getElementById("numero-expediente-lectora")?.focus();
        showToast("Escanea + ENTER (dos veces)", "success");
      }
    });
  });

  // ============ SETUP MODO MANUAL ============
  function setupFormManual() {
    const form = document.getElementById("form-expediente");
    if (!form) return;

    document.getElementById("btn-ayuda-fecha-hora")?.addEventListener("click", () => {
      openModal({
        title: "Ayuda de registro",
        content: `
          <div class="space-y-3 text-sm text-slate-700">
            <p class="font-semibold text-slate-900">La fecha y hora del registro se generan automaticamente.</p>
            <p>No necesitas seleccionarlas en el formulario.</p>
            <p>Se toman al momento de presionar <strong>Guardar</strong>.</p>
          </div>
        `,
        confirmText: "Entendido"
      });
    });

    const numeroInput = form.numeroExpediente;
    const checkboxIncidente = document.getElementById("checkbox-incidente");
    const inputIncidente = document.getElementById("input-incidente");
    const inputDeterminador = document.getElementById("input-determinador");

    // ✅ NUEVO: Sincronizar select de juzgado con hidden nombre
    const selectJuzgado = document.getElementById("select-juzgado");
    const hiddenJuzgadoNombre = document.getElementById("hidden-juzgado-nombre");

    if (selectJuzgado && hiddenJuzgadoNombre) {
      selectJuzgado.addEventListener("change", () => {
        const opcionSeleccionada = selectJuzgado.selectedOptions[0];
        hiddenJuzgadoNombre.value = opcionSeleccionada?.dataset?.nombre || "";
      });
    }

    // Lógica del checkbox de incidente
    if (checkboxIncidente && inputIncidente) {
      checkboxIncidente.addEventListener("change", () => {
        inputIncidente.removeAttribute("readonly");
        if (!checkboxIncidente.checked) {
          inputIncidente.setAttribute("readonly", "readonly");
          inputIncidente.value = "0";
        }
      });
    }

    // Validar determinador (01-09)
    if (inputDeterminador) {
      inputDeterminador.addEventListener("change", (e) => {
        let valor = e.target.value.trim();
        if (valor === "") {
          e.target.value = "01";
          return;
        }
        const num = parseInt(valor, 10);
        if (isNaN(num) || num < 1 || num > 9) {
          showToast("El determinador debe ser 01-09", "warning");
          e.target.value = "01";
          return;
        }
        e.target.value = String(num).padStart(2, "0");
      });
    }

    // Autocompletar número expediente con padding (ej: 50 -> 00050)
    if (numeroInput) {
      numeroInput.addEventListener("input", (e) => {
        let valor = e.target.value.toUpperCase();
        
        if (/^\d+$/.test(valor) && valor.length <= 5) {
          e.target.value = valor.slice(0, 5);
        } else if (/^\d+$/.test(valor) && valor.length > 5) {
          e.target.value = valor.slice(0, 5);
        } else {
          e.target.value = valor;
        }
      });

      numeroInput.addEventListener("blur", (e) => {
        let valor = e.target.value.trim();
        if (valor && /^\d+$/.test(valor)) {
          e.target.value = valor.padStart(5, "0");
          validarNumeroRegistro();
        }
      });

      numeroInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          
          const chip = form.querySelector("#numero-expediente-chip");
          const esValido = chip && chip.textContent.includes("Válido");
          
          if (esValido && numeroInput.dataset.enterPresionado === "once") {
            form.dispatchEvent(new Event("submit"));
            numeroInput.dataset.enterPresionado = "";
          } else if (!esValido) {
            let valor = numeroInput.value.trim();
            if (valor && /^\d+$/.test(valor)) {
              numeroInput.value = valor.padStart(5, "0");
              validarNumeroRegistro();
              numeroInput.dataset.enterPresionado = "once";
            }
          } else if (esValido) {
            numeroInput.dataset.enterPresionado = "once";
          }
        }
      });
    }

    // Validación en tiempo real
    function validarNumeroRegistro() {
      const numero = (numeroInput.value.trim() || "").padStart(5, "0").toUpperCase();
      
      if (!numero || numero === "00000") {
        actualizarChipManual("pendiente");
        return;
      }

      const anio = form.anio?.value || "0000";
      const incidente = form.incidente?.value || "0";
      const codigoCorte = form.codigoCorte?.value || "3101-JR";
      const materia = form.materia?.value || "CI";
      const determinador = (form.numeroJuzgado?.value || "01").padStart(2, "0");
      
      const numeroCompleto = `${numero}-${anio}-${incidente}-${codigoCorte}-${materia}-${determinador}`;

      if (validarNumeroExpediente(numeroCompleto)) {
        actualizarChipManual("valido", numeroCompleto);
        intentarAutoCompletar(form, numeroCompleto);
      } else {
        actualizarChipManual("invalido", numeroCompleto);
      }
    }

    function actualizarChipManual(estado, numeroCompleto = "") {
      const badge = form.querySelector("#numero-expediente-chip");
      if (!badge) return;

      const estados = {
        pendiente: "Pendiente de validar",
        valido: `${numeroCompleto || "Válido"}`,
        invalido: `${numeroCompleto || "Inválido"}`
      };
      const texto = estados[estado] || "Pendiente";
      badge.textContent = texto;
      badge.title = numeroCompleto;
      badge.className = `badge ${
        estado === "valido" ? `${ALERT_TONES.success.surface} ${ALERT_TONES.success.text}` : 
        estado === "invalido" ? `${ALERT_TONES.danger.surface} ${ALERT_TONES.danger.text}` : 
        `${ALERT_TONES.neutral.surface} ${ALERT_TONES.neutral.text}`
      }`;
    }

    actualizarEstadoVisual(form);
    actualizarChipManual("pendiente");

    numeroInput.addEventListener("input", validarNumeroRegistro);
    numeroInput.addEventListener("blur", validarNumeroRegistro);

    document.getElementById("btn-limpiar")?.addEventListener("click", () => {
      form?.reset();
      form.fechaIngreso.value = hoyIso();
      form.horaIngreso.value = horaActual();
      form.estado.value = "Ingresado";
      numeroInput.value = "";
      numeroInput.dataset.enterPresionado = "";
      if (checkboxIncidente) checkboxIncidente.checked = false;
      if (inputIncidente) {
        inputIncidente.value = "0";
        inputIncidente.setAttribute("readonly", "readonly");
      }
      if (inputDeterminador) inputDeterminador.value = "01";
      // ✅ NUEVO: Limpiar también el hidden del nombre del juzgado
      if (hiddenJuzgadoNombre) hiddenJuzgadoNombre.value = "";
      actualizarChipManual("pendiente");
      actualizarEstadoVisual(form);
      showToast("Formulario limpio", "info");
    });

    const observacionesInput = form.querySelector("textarea[name='observaciones']");
    if (observacionesInput) {
      observacionesInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          const chip = form.querySelector("#numero-expediente-chip");
          if (chip && chip.textContent.includes("Válido")) {
            e.preventDefault();
            form.dispatchEvent(new Event("submit"));
          }
        }
      });
    }

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      await guardarConConfirmacion(form, mountNode, false);
    });

    form?.estado?.addEventListener("change", () => {
      actualizarEstadoVisual(form);
    });
  }

  // ============ SETUP MODO LECTORA ============
  function setupFormLectora() {
    const form = document.getElementById("form-expediente-lectora");
    if (!form) return;

    const numeroInput = document.getElementById("numero-expediente-lectora");
    const resumenBox = document.getElementById("resumen-lectora");
    const chipBox = document.getElementById("estado-chip-lectora");
    const btnGuardar = document.getElementById("btn-guardar-lectora");

    function actualizarChipLectora(estado, mensaje = "") {
      let html = "";
      if (estado === "pendiente") {
        html = `<div class="px-4 py-3 rounded-lg border ${ALERT_TONES.neutral.border} ${ALERT_TONES.neutral.surface} text-sm ${ALERT_TONES.neutral.text}">
          ${mensaje || "Esperando escaneo..."}
        </div>`;
      } else if (estado === "valido") {
        html = `<div class="px-4 py-3 rounded-lg border-2 ${ALERT_TONES.success.border} ${ALERT_TONES.success.surface} text-sm font-semibold ${ALERT_TONES.success.text}">
          Código válido - Listo para guardar
        </div>`;
      } else if (estado === "invalido") {
        html = `<div class="px-4 py-3 rounded-lg border-2 ${ALERT_TONES.danger.border} ${ALERT_TONES.danger.surface} text-sm font-semibold ${ALERT_TONES.danger.text}">
          Formato inválido (Debe tener 20-23 dígitos)
        </div>`;
      }
      chipBox.innerHTML = html;
    }

    function procesarCodigoLectora(codigo) {
      const valor = codigo.trim();
      
      // Extraer SOLO dígitos válidos
      const codigoExtraido = /^\d+/.exec(valor)?.[0];
      if (!codigoExtraido) {
        actualizarChipLectora("invalido");
        resumenBox.classList.add("hidden");
        btnGuardar.disabled = true;
        showToast("Debe ingresar solo dígitos numéricos", "error");
        return;
      }
      
      // ✅ VALIDACIÓN FLEXIBLE: Aceptar 20-23 dígitos (no solo 20 o 23)
      if (codigoExtraido.length < 20 || codigoExtraido.length > 23) {
        actualizarChipLectora("invalido");
        resumenBox.classList.add("hidden");
        btnGuardar.disabled = true;
        const longitud = codigoExtraido.length;
        showToast(`Código tiene ${longitud} dígitos. Debe tener 20-23 dígitos`, "error");
        return;
      }
      
      // Normalizar: Tomar exactamente 23 primeros dígitos o 20 si es más corto
      // En realidad, si es entre 20-23, usar tal cual (no recortar)
      const codigoFinal = codigoExtraido.length >= 23 ? codigoExtraido.substring(0, 23) : codigoExtraido;

      // Parsear
      const parsed = parsearLectora(codigoFinal);
      if (!parsed) {
        actualizarChipLectora("invalido");
        resumenBox.classList.add("hidden");
        btnGuardar.disabled = true;
        console.error("❌ Error al parsear código:", { codigo, longitud: codigoFinal.length });
        showToast("Formato de código de barras no reconocido. Verifica el código ingresado.", "error");
        return;
      }
// ✅ Validar duplicado comparando código completo exacto
const expedientesBackend = expedienteService.listarDelBackendSync();
const codigoCompletoParseado = parsed.codigoLecturaRaw || parsed.numeroExpediente || "";

const yaExisteEnBackend = expedientesBackend.some(exp =>
  // Comparar contra código de barras crudo (registros nuevos)
  String(exp.codigo_expediente_completo || "").trim() === codigoFinal.trim() ||
  // Comparar contra número legible (registros antiguos)
  String(exp.codigo_expediente_completo || "").trim() === parsed.numeroExpediente.trim() ||
  String(exp.numero_expediente || "").trim() === parsed.numeroExpediente.trim()
);

if (yaExisteEnBackend) {
  actualizarChipLectora("invalido");
  resumenBox.classList.add("hidden");
  btnGuardar.disabled = true;
  showToast(
    `❌ DUPLICADO: El expediente ${codigoCompletoParseado} ya está registrado en el servidor`,
    "error"
  );
  return;
}

      // Mapeo automático: determinador → juzgado específico + tipo de juzgado
      const mapDeterminador = {
        "01": ["1er", "Primer"],
        "02": ["2do", "Segundo"],
        "03": ["3er", "Primer"],
        "04": ["4", "Segundo"],
        "05": ["5", "Primer"],
        "06": ["6", "Segundo"],
        "07": ["7", "Primer"],
        "08": ["8", "Segundoo"],
        "09": ["9", "Primer"]
      };
      
      // Determinar tipo de especialidad basada en el tipo de juzgado del code
      const mapEspecialidad = {
        "JR": "Civil",      // Juzgado Primera Instancia (Civil)
        "SP": "Penal"       // Sala Penal
      };
      
      // Buscar juzgado específico basado en determinador + tipo
      const patternsABuscar = mapDeterminador[parsed.numeroJuzgado] || ["1er", "Primer"];
      const especialidad = mapEspecialidad[parsed.tipoJuzgado] || "Civil";
      const juzgados = juzgadoService.listarSync();
      
      let juzgadoDetectado = null;
      for (const pattern of patternsABuscar) {
        juzgadoDetectado = juzgados.find(j => 
          j.nombre.includes(pattern) && j.nombre.includes(especialidad)
        );
        if (juzgadoDetectado) break;
      }
      
      // Si no encuentra por especialidad, usar por defecto
      if (!juzgadoDetectado) {
        juzgadoDetectado = juzgados.find(j => 
          j.nombre.includes(patternsABuscar[0])
        );
      }
      
   const juzgadoId = juzgadoDetectado
  ? String(juzgadoDetectado.id_juzgado || juzgadoDetectado.id || "").trim()
  : "";

const juzgadoNombre = juzgadoDetectado
  ? String(juzgadoDetectado.nombre_juzgado || juzgadoDetectado.nombre || "").trim()
  : `Juzgado ${especialidad} - Det. ${parsed.numeroJuzgado} (${parsed.tipoJuzgado})`;

// Actualizar formulario con datos parseados
form.numeroExpediente.value = parsed.numeroExpediente;
document.getElementById("input-anio").value = parsed.anio;
document.getElementById("input-incidente").value = parsed.incidente;
document.getElementById("input-codigo-corte").value = parsed.codigoCorte;
document.getElementById("input-materia").value = parsed.materia;
document.getElementById("input-codigo-lectura-raw").value = parsed.codigoLecturaRaw || "";

// Guardar juzgado detectado
document.getElementById("input-juzgado").value = juzgadoNombre;
form.juzgado.value = juzgadoNombre;

// Guardar también el ID real del juzgado en hidden
let hiddenIdJuzgado = form.querySelector("input[name='id_juzgado']");
if (!hiddenIdJuzgado) {
  hiddenIdJuzgado = document.createElement("input");
  hiddenIdJuzgado.type = "hidden";
  hiddenIdJuzgado.name = "id_juzgado";
  form.appendChild(hiddenIdJuzgado);
}
hiddenIdJuzgado.value = juzgadoId;

// Guardar tipo de órgano en hidden
let hiddenTipoOrgano = form.querySelector("input[name='tipoOrgano']");
if (!hiddenTipoOrgano) {
  hiddenTipoOrgano = document.createElement("input");
  hiddenTipoOrgano.type = "hidden";
  hiddenTipoOrgano.name = "tipoOrgano";
  form.appendChild(hiddenTipoOrgano);
}
hiddenTipoOrgano.value = String(parsed.tipoJuzgado || "").trim().toUpperCase();

// Guardar determinador
form.numeroJuzgado.value = parsed.numeroJuzgado || "01";
form.numeroJuzgado.style.display = "none";
      
      // Auto-llenar ubicación y estado
      if (!form.ubicacionActual.value) form.ubicacionActual.value = "Estante";
      if (!form.estado.value) form.estado.value = "Ingresado";

      // Mostrar resumen CON CÓDIGO COMPLETO EN UNA LÍNEA
      const paqueteNombre = form.paqueteId?.value ? document.querySelector(`input[name="paqueteId"] + [data-package="${form.paqueteId.value}"]`)?.textContent || "---" : "---";
      
      document.getElementById("resumen-expediente-completo").textContent = parsed.numeroExpediente;
      document.getElementById("resumen-juzgado").textContent = juzgadoNombre;
      document.getElementById("resumen-paquete").textContent = form.paqueteId.value || "---";
      document.getElementById("resumen-ubicacion").textContent = form.ubicacionActual.value || "Estante";
      document.getElementById("resumen-estado").textContent = form.estado.value || "Ingresado";

      // Mostrar mensaje incluyendo tipo de registro (principal/cautelar) detectado por lectora
      showToast(
        `${parsed.tipoRegistro}: ${parsed.incidente} · ${juzgadoNombre} (det: ${parsed.numeroJuzgado})`,
        "success"
      );

      resumenBox.classList.remove("hidden");
      actualizarChipLectora("valido");
      btnGuardar.disabled = false;
      
      // ⚡ NUEVO: Permitir presionar ENTER nuevamente para enviar automáticamente
      numeroInput.dataset.listoParaEnviar = "true";
    }

    // Event listeners
    numeroInput.addEventListener("input", (e) => {
      // Limpiar caracteres no numéricos y limitar a 30 primeros dígitos
      // (para capturar códigos que vienen con información extra)
      const soloNumeros = e.target.value.replace(/[^\d]/g, "");
      e.target.value = soloNumeros.substring(0, 30);
      
      // Mostrar feedback visual mientras escribe
      const longitud = soloNumeros.length;
      if (longitud === 0) {
        actualizarChipLectora("pendiente");
        resumenBox.classList.add("hidden");
      } else if (longitud >= 20 && longitud <= 23) {
        actualizarChipLectora("pendiente", `✓ ${longitud} dígitos - Presiona ENTER`);
      } else if (longitud > 23) {
        actualizarChipLectora("pendiente", `${longitud} dígitos (máximo 23)`);
      } else {
        actualizarChipLectora("pendiente", `${longitud}/20 dígitos... sigue escribiendo`);
      }
    });

    numeroInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        
        // Si ya procesó un código válido, presionar ENTER nuevamente envía automáticamente
        if (numeroInput.dataset.listoParaEnviar === "true") {
          form.dispatchEvent(new Event("submit"));
        } else {
          // Primera vez: procesar código
          procesarCodigoLectora(numeroInput.value);
        }
      }
    });

    // Botón Limpiar
    document.getElementById("btn-limpiar-lectora-btn")?.addEventListener("click", () => {
      numeroInput.value = "";
      numeroInput.dataset.listoParaEnviar = "false";
      document.getElementById("input-codigo-lectura-raw").value = "";
      resumenBox.classList.add("hidden");
      actualizarChipLectora("pendiente");
      btnGuardar.disabled = true;
      numeroInput.focus();
      showToast("Formulario limpio", "info");
    });

    // Botón Editar - Abrir modal para editar TODO
    document.getElementById("btn-editar-lectora")?.addEventListener("click", () => {
      // Obtener valores actuales
      const numeroExpediente = form.numeroExpediente?.value || "";
      const juzgadoActual = form.juzgado?.value || "";
      const paqueteId = form.paqueteId?.value || "";
      const ubicacionActual = form.ubicacionActual?.value || "Estante";
      const estado = form.estado?.value || "Ingresado";
      const determinador = form.numeroJuzgado?.value || "01";
      
      // Obtener lista de opciones del usuario
      const juzgados = juzgadoService.listarSync();
      const paquetes = paqueteService.listarSync();
      const UBICACIONES = ["Estante", "Archivo", "Pendiente", "Devolución"];
      const estados = estadoService.listarSync();

      openModal({
        title: "✏️ Editar datos completos",
        content: `
          <div class="space-y-4">
            <!-- Número de expediente EDITABLE -->
            <div>
              <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Número de Expediente</label>
              <input type="text" id="modal-numero-expediente" value="${numeroExpediente}" 
                class="w-full border-2 border-slate-300 rounded px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
                placeholder="00461-2024-0-3101-CI-02" />
              <p class="text-xs text-slate-600 mt-1">Formato: NUMERO-AÑO-INCIDENTE-CORTE-MATERIA-DETERMINADOR</p>
            </div>
            
            <!-- Determinador info -->
            <div class="bg-blue-50 p-3 rounded border border-blue-200">
              <p class="text-xs font-bold text-blue-700 uppercase">Determinador detectado</p>
              <p class="font-mono text-lg font-bold text-blue-900 mt-1">${determinador}</p>
              <p class="text-xs text-blue-600 mt-2">Auto-detectado: ${juzgadoActual}</p>
            </div>
            
            <!-- Selector de Juzgado Específico -->
            <div>
              <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Juzgado Específico</label>
              <select id="modal-juzgado" class="w-full border-2 border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
  <option value="">-- Seleccionar --</option>
  ${juzgados.map(j => {
    const id = String(j.id_juzgado || j.id || "").trim();
    const nombre = String(j.nombre_juzgado || j.nombre || "").trim();
    const selected = nombre === juzgadoActual ? "selected" : "";
    return `<option value="${id}" data-nombre="${nombre}" ${selected}>${nombre}</option>`;
  }).join('')}
</select>
            </div>
            
            <!-- Selector de Paquete -->
            <div>
              <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Paquete (Opcional)</label>
              <select id="modal-paquete" class="w-full border-2 border-slate-300 rounded px-3 py-2 text-sm focus:border-slate-500 focus:outline-none">
                <option value="">-- Sin paquete --</option>
                ${paquetes.map(p => `<option value="${p.id}" ${p.id === paqueteId ? 'selected' : ''}>${p.codigo}</option>`).join('')}
              </select>
            </div>
            
            <!-- Selector de Ubicación -->
            <div>
              <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Ubicación</label>
              <select id="modal-ubicacion" class="w-full border-2 border-slate-300 rounded px-3 py-2 text-sm focus:border-slate-500 focus:outline-none">
                ${UBICACIONES.map(u => `<option value="${u}" ${u === ubicacionActual ? 'selected' : ''}>${u}</option>`).join('')}
              </select>
            </div>
            
            <!-- Selector de Estado -->
            <div>
              <label class="text-xs font-bold text-slate-700 uppercase block mb-1">Estado</label>
              <select id="modal-estado" class="w-full border-2 border-slate-300 rounded px-3 py-2 text-sm focus:border-slate-500 focus:outline-none">
                ${estados.map(e => `<option value="${e.nombre}" ${e.nombre === estado ? 'selected' : ''}>${e.nombre}</option>`).join('')}
              </select>
            </div>
          </div>
        `,
        confirmText: "Guardar cambios",
        onConfirm: (close) => {
          const nuevoNumero = document.getElementById("modal-numero-expediente")?.value || numeroExpediente;
          const selectJuzgado = document.getElementById("modal-juzgado");
const nuevoJuzgadoId = selectJuzgado?.value || "";
const nuevoJuzgadoTexto = selectJuzgado?.selectedOptions?.[0]?.dataset?.nombre || juzgadoActual;
          const nuevoPaquete = document.getElementById("modal-paquete")?.value || "";
          const nuevaUbicacion = document.getElementById("modal-ubicacion")?.value || "Estante";
          const nuevoEstado = document.getElementById("modal-estado")?.value || "Ingresado";
          
          if (!nuevoJuzgadoTexto) {
            showToast("⚠️ Debes seleccionar un juzgado", "warning");
            return;
          }
          
          if (!nuevoNumero) {
            showToast("⚠️ El número de expediente no puede estar vacío", "warning");
            return;
          }
          
          // Guardar cambios en el formulario
          form.numeroExpediente.value = nuevoNumero;
          form.juzgado.value = nuevoJuzgadoTexto;
document.getElementById("input-juzgado").value = nuevoJuzgadoTexto;
let hiddenIdJuzgado = form.querySelector("input[name='id_juzgado']");
if (!hiddenIdJuzgado) {
  hiddenIdJuzgado = document.createElement("input");
  hiddenIdJuzgado.type = "hidden";
  hiddenIdJuzgado.name = "id_juzgado";
  form.appendChild(hiddenIdJuzgado);
}
hiddenIdJuzgado.value = nuevoJuzgadoId;

          form.paqueteId.value = nuevoPaquete;
          form.ubicacionActual.value = nuevaUbicacion;
          form.estado.value = nuevoEstado;
          
          // Actualizar resumen
          document.getElementById("resumen-expediente-completo").textContent = nuevoNumero;
          document.getElementById("resumen-juzgado").textContent = nuevoJuzgadoTexto;
          document.getElementById("resumen-paquete").textContent = nuevoPaquete || "---";
          document.getElementById("resumen-ubicacion").textContent = nuevaUbicacion;
          document.getElementById("resumen-estado").textContent = nuevoEstado;
          
          showToast("✅ Datos actualizados", "success");
          close();
        }
      });
    });

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (form.numeroExpediente.value.trim()) {
        await guardarConConfirmacion(form, mountNode, true);
      }
    });

    actualizarChipLectora("pendiente");
    numeroInput.focus();
  }
}
