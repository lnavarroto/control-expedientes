import { renderExpedienteForm } from "../../components/expedienteForm.js";
import { openModal } from "../../components/modal.js";
import { renderTable } from "../../components/table.js";
import { statusBadge } from "../../components/statusBadge.js";
import { showToast } from "../../components/toast.js";
import { expedienteService } from "../../services/expedienteService.js";
import { formatoFechaHora, horaActual, hoyIso } from "../../utils/formatters.js";
import { validarIncidente, validarNumeroExpediente } from "../../utils/validators.js";
import { parsearLectora } from "../../utils/lectora.js";

function renderRecientes() {
  const rows = expedienteService
    .listar()
    .slice(0, 6)
    .map((item) => ({
      expediente: item.numeroExpediente,
      materia: item.materia,
      juzgado: item.juzgado,
      ingreso: formatoFechaHora(item.fechaIngreso, item.horaIngreso),
      ubicacion: item.ubicacionActual,
      estado: statusBadge(item.estado)
    }));

  return renderTable({
    columns: [
      { key: "expediente", label: "Expediente" },
      { key: "materia", label: "Materia" },
      { key: "juzgado", label: "Juzgado" },
      { key: "ingreso", label: "Fecha / Hora" },
      { key: "ubicacion", label: "Ubicación" },
      { key: "estado", label: "Estado" }
    ],
    rows
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
  const juzgadoFinal = data.juzgadoManual?.trim() ? data.juzgadoManual.trim() : data.juzgado;
  return {
    ...data,
    juzgado: juzgadoFinal,
    numeroExpediente: data.numeroExpediente.trim().toUpperCase(),
    textoRelacionado: `${data.numeroExpediente} ${data.materia} ${juzgadoFinal} ${data.observaciones || ""}`.toLowerCase()
  };
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

  if (!validarNumeroExpediente(data.numeroExpediente)) {
    setFormFeedback("Corrija el formato del número de expediente.", "error");
    showToast("Formato de expediente inválido", "error");
    return;
  }

  if (!validarIncidente(data.incidente)) {
    setFormFeedback("El incidente debe estar entre 0 y 999.", "warning");
    showToast("Incidente debe estar entre 0 y 999", "warning");
    return;
  }

  // Agregar tipo de ingreso a los datos
  data.tipoIngreso = modoLectora ? "LECTORA" : "MANUAL";

  const tipoIngresoIcon = modoLectora ? "📱" : "🖱️";
  const tipoIngresoTexto = modoLectora ? "Lectora (Escáner)" : "Manual (Teclado)";

  openModal({
    title: "Confirmar registro de expediente",
    content: `
      <div class="space-y-2 text-sm text-slate-700">
        <p>Se registrará el expediente <strong>${data.numeroExpediente}</strong>.</p>
        <p>Juzgado: <strong>${data.juzgado}</strong></p>
        <p>Estado inicial: <strong>${data.estado}</strong></p>
        <p class="mt-3 pt-3 border-t border-slate-300"><strong>Tipo de ingreso:</strong> ${tipoIngresoIcon} ${tipoIngresoTexto}</p>
      </div>
    `,
    confirmText: "Confirmar y guardar",
    onConfirm: (close) => {
      expedienteService.guardar(data);
      close();
      showToast("Expediente guardado correctamente", "success");
      initRegistroPage({ mountNode });
    }
  });
}

export function initRegistroPage({ mountNode }) {
  mountNode.innerHTML = `
    <section>
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h3 class="font-semibold text-lg">Nuevo registro</h3>
          <p class="text-sm text-slate-500">Completa el formulario para registrar un nuevo expediente.</p>
        </div>
        <div class="flex gap-2">
          <button id="btn-modo-manual" class="btn btn-secondary" title="Entrada manual con teclado">🖱️ Manual</button>
          <button id="btn-modo-lectora" class="btn btn-secondary" title="Presiona Enter para completar con lectora">📱 Lectora</button>
        </div>
      </div>
      
      <div id="estado-chip" style="margin-bottom: 12px; min-height: 36px;"></div>
      ${renderExpedienteForm(defaults())}
    </section>
    <section>
      <h3 class="font-semibold text-lg mb-3">Registros recientes</h3>
      ${renderRecientes()}
    </section>
  `;

  const form = document.getElementById("form-expediente");
  const numeroInput = form.numeroExpediente;
  let modoLectora = false;

  // Funciones de interfaz
  function actualizarChip(estado, esLectora) {
    const chip = document.getElementById("estado-chip");
    let html = '';
    
    if (estado === "pendiente") {
      html = `<div class="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-600">
        Esperando entrada...
      </div>`;
    } else if (estado === "valido") {
      const icono = esLectora ? "📱" : "🖱️";
      html = `<div class="px-3 py-2 rounded-lg border-2 border-green-400 bg-green-50 text-sm font-semibold text-green-700">
        ${icono} Válido - Datos verificados
      </div>`;
    } else if (estado === "invalido") {
      const icono = esLectora ? "📱" : "🖱️";
      html = `<div class="px-3 py-2 rounded-lg border-2 border-red-400 bg-red-50 text-sm font-semibold text-red-700">
        ${icono} Inválido - Revisar formato
      </div>`;
    }
    
    chip.innerHTML = html;
  }

  // Validar número de expediente
  function validarNumeroRegistro() {
    const valor = numeroInput.value.trim().toUpperCase();

    if (!valor) {
      actualizarChip("pendiente", modoLectora);
      return;
    }

    // SI ES MODO LECTORA
    if (modoLectora) {
      // Detectar si es código de lectora (20-23 dígitos)
      if (/^\d{20}$/.test(valor) || /^\d{23}$/.test(valor)) {
        const parsed = parsearLectora(valor);
        if (parsed) {
          actualizarChip("valido", true);
          numeroInput.value = parsed.numeroExpediente;
          intentarAutoCompletar(form, parsed.numeroExpediente);
          showToast("✅ Código parseado correctamente", "success");
          return;
        }
      }
    }

    // VALIDACIÓN ESTÁNDAR (ambos modos)
    if (validarNumeroExpediente(valor)) {
      actualizarChip("valido", modoLectora);
      intentarAutoCompletar(form, valor);
    } else {
      actualizarChip("invalido", modoLectora);
    }
  }

  actualizarEstadoVisual(form);
  actualizarChip("pendiente", false);

  // Listeners para validación en tiempo real
  numeroInput.addEventListener("input", validarNumeroRegistro);
  numeroInput.addEventListener("blur", validarNumeroRegistro);
  numeroInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && modoLectora) {
      e.preventDefault();
      validarNumeroRegistro();
    }
  });

  // Botones de modo
  document.getElementById("btn-modo-manual")?.addEventListener("click", () => {
    modoLectora = false;
    numeroInput.value = "";
    numeroInput.focus();
    actualizarChip("pendiente", false);
    showToast("🖱️ Modo manual activado", "info");
  });

  document.getElementById("btn-modo-lectora")?.addEventListener("click", () => {
    modoLectora = true;
    numeroInput.value = "";
    numeroInput.focus();
    actualizarChip("pendiente", true);
    
    openModal({
      title: "📱 Modo Lectora - Registro de Expedientes",
      content: `
        <div class="space-y-4">
          <p class="text-base font-medium text-slate-700">Usando escáner de códigos de barras</p>
          
          <div class="bg-sky-50 border border-sky-300 rounded-lg p-4 space-y-2">
            <p class="text-sm text-sky-900 font-semibold">📋 Instrucciones:</p>
            <ol class="text-sm text-sky-800 space-y-2 ml-4 list-decimal">
              <li>Acerca el código de barras al escáner</li>
              <li>El código se ingresará automáticamente</li>
              <li>Presiona <strong>ENTER</strong> para registrar</li>
              <li>El expediente se creará automáticamente</li>
            </ol>
          </div>
          
          <p class="text-xs text-slate-600 italic">El código de barras debe tener entre 20-23 dígitos</p>
        </div>
      `,
      confirmText: "Entendido",
      onConfirm: (close) => {
        close();
        showToast("📱 Escanea el código y presiona ENTER", "success");
      }
    });
  });

  document.getElementById("btn-limpiar")?.addEventListener("click", () => {
    form?.reset();
    form.fechaIngreso.value = hoyIso();
    form.horaIngreso.value = horaActual();
    form.estado.value = "Ingresado";
    numeroInput.value = "";
    modoLectora = false;
    actualizarChip("pendiente", false);
    actualizarEstadoVisual(form);
    showToast("Formulario limpio", "info");
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    guardarConConfirmacion(form, mountNode, modoLectora);
  });

  form?.estado?.addEventListener("change", () => {
    actualizarEstadoVisual(form);
  });
}
