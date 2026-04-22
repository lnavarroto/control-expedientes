import { renderTable } from "../../components/table.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { expedienteService } from "../../services/expedienteService.js";
import { ubicacionService } from "../../services/ubicacionService.js";
import { validarNumeroExpediente } from "../../utils/validators.js";
import { parsearLectora } from "../../utils/lectora.js";
import { icon } from "../../components/icons.js";
import { ALERT_TONES } from "../../core/uiTokens.js";

function renderHistorial(expedienteId) {
  const historial = expedienteService
    .listarMovimientos()
    .filter((item) => item.expedienteId === expedienteId)
    .slice(0, 10)
    .map((item) => ({
      fecha: item.fecha,
      hora: item.hora,
      usuario: item.usuario,
      origen: item.origen,
      destino: item.destino,
      motivo: item.motivo,
      observacion: item.observacion
    }));

  return renderTable({
    columns: [
      { key: "fecha", label: "Fecha" },
      { key: "hora", label: "Hora" },
      { key: "usuario", label: "Usuario" },
      { key: "origen", label: "Origen" },
      { key: "destino", label: "Destino" },
      { key: "motivo", label: "Motivo" },
      { key: "observacion", label: "Observación" }
    ],
    rows: historial,
    emptyText: "Sin movimientos registrados"
  });
}

export function initUbicacionesPage({ mountNode, sesion }) {
  const expedientes = expedienteService.listar();
  const expedienteOptions = expedientes
    .map((item) => `<option value="${item.id}">${item.numeroExpediente} (${item.ubicacionActual})</option>`)
    .join("");
  let selectedId = expedientes[0]?.id || "";

  mountNode.innerHTML = `
    <section class="card-surface p-5">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 class="font-semibold text-lg">Registrar movimiento y ubicación</h3>
          <p class="text-sm text-slate-500">Entrada manual o por lectora con autocompletado automático.</p>
        </div>
        <div class="flex gap-2">
          <button id="ubi-modo-manual" class="btn btn-secondary inline-flex items-center gap-2" title="Entrada manual">${icon("edit", "w-4 h-4")}<span>Manual</span></button>
          <button id="ubi-modo-lectora" class="btn btn-secondary inline-flex items-center gap-2" title="Entrada por lectora">${icon("shieldCheck", "w-4 h-4")}<span>Lectora</span></button>
        </div>
      </div>

      <div id="estado-chip-ubicacion" style="margin-bottom: 12px; min-height: 36px;"></div>

      <div id="modo-lectora-alerta" class="hidden rounded-xl border ${ALERT_TONES.info.border} ${ALERT_TONES.info.surface} px-4 py-3 text-sm ${ALERT_TONES.info.text} mb-4">
        <span class="font-medium">Modo lectora activo</span> - Escanee el código y presione Enter para llenar automaticamente.
      </div>

      <form id="form-ubicacion" class="grid md:grid-cols-2 gap-3">
        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Número de expediente (lectora o manual)</label>
          <input id="numero-expediente-input" class="input-base md:col-span-3" placeholder="Escanea o escribe número..." />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm font-semibold">O seleccionar de lista</label>
          <select class="select-base" id="expediente-id">${expedienteOptions}</select>
        </div>

        <div>
          <label class="text-sm font-semibold">Ubicación destino</label>
          <input class="input-base" name="ubicacionActual" placeholder="Ej: Juzgado" required />
        </div>
        <div>
          <label class="text-sm font-semibold">Nuevo estado</label>
          <select class="select-base" name="estado">${expedienteService.estados().map((e) => `<option value="${e}">${e}</option>`).join("")}</select>
        </div>
        <div>
          <label class="text-sm font-semibold">Motivo</label>
          <input class="input-base" name="motivo" placeholder="Ej: Préstamo interno" required />
        </div>
        <div>
          <label class="text-sm font-semibold">Observación</label>
          <input class="input-base" name="observacion" placeholder="Detalle del movimiento" />
        </div>
        <div class="md:col-span-2 flex justify-end gap-2">
          <button id="btn-limpiar-ubi" class="btn btn-secondary text-sm md:text-base px-5 py-2.5 inline-flex items-center gap-2" type="button">${icon("refreshCw", "w-4 h-4")}<span>Limpiar</span></button>
          <button class="btn btn-primary text-sm md:text-base px-5 py-2.5 inline-flex items-center gap-2" type="submit">${icon("check", "w-4 h-4")}<span>Registrar movimiento</span></button>
        </div>
      </form>
    </section>
    <section>
      <h3 class="font-semibold text-lg mb-3">Historial del expediente seleccionado</h3>
      <div id="historial-contenedor">${renderHistorial(selectedId)}</div>
    </section>
  `;

  const formUbicacion = document.getElementById("form-ubicacion");
  const selectExpediente = document.getElementById("expediente-id");
  const numeroInput = document.getElementById("numero-expediente-input");
  const modoAlerta = document.getElementById("modo-lectora-alerta");
  let modoLectoraUbicacion = false;

  // Chip de estado
  function actualizarChipUbicacion(estado, esLectora) {
    const chip = document.getElementById("estado-chip-ubicacion");
    let html = '';
    
    if (estado === "pendiente") {
      html = `<div class="px-3 py-2 rounded-lg border ${ALERT_TONES.neutral.border} ${ALERT_TONES.neutral.surface} text-sm ${ALERT_TONES.neutral.text}">
        ${esLectora ? "Modo lectora" : "Modo manual"} - Esperando entrada...
      </div>`;
    } else if (estado === "valido") {
      html = `<div class="px-3 py-2 rounded-lg border-2 ${ALERT_TONES.success.border} ${ALERT_TONES.success.surface} text-sm font-semibold ${ALERT_TONES.success.text}">
        Válido - Expediente verificado
      </div>`;
    } else if (estado === "invalido") {
      html = `<div class="px-3 py-2 rounded-lg border-2 ${ALERT_TONES.danger.border} ${ALERT_TONES.danger.surface} text-sm font-semibold ${ALERT_TONES.danger.text}">
        Inválido - Revisar formato
      </div>`;
    }
    
    chip.innerHTML = html;
  }

  // Validar y autocompletar
  function validarNumeroUbicacion() {
    const valor = numeroInput.value.trim().toUpperCase();

    if (!valor) {
      actualizarChipUbicacion("pendiente", modoLectoraUbicacion);
      return;
    }

    // MODO LECTORA
    if (modoLectoraUbicacion && (/^\d{20}$/.test(valor) || /^\d{23}$/.test(valor))) {
      const parsed = parsearLectora(valor);
      if (parsed) {
        actualizarChipUbicacion("valido", true);
        numeroInput.value = parsed.numeroExpediente;
        
        // Buscar y seleccionar expediente - COMPARAR SOLO EL NÚMERO BASE
        const numeroBase = parsed.numeroExpediente.split('-')[0]; // Obtener solo "00587"
        const expediente = expedienteService.listar().find((e) => {
          const eNumeroBase = (e.numeroExpediente || '').split('-')[0];
          return eNumeroBase === numeroBase;
        });
        
        if (expediente) {
          selectExpediente.value = expediente.id;
          selectedId = expediente.id;
          document.getElementById("historial-contenedor").innerHTML = renderHistorial(selectedId);
          showToast("✅ Expediente encontrado y seleccionado", "success");
        } else {
          showToast("⚠️ Expediente no existe en el sistema", "warning");
        }
        return;
      }
    }

    // VALIDACIÓN ESTÁNDAR
    if (validarNumeroExpediente(valor)) {
      actualizarChipUbicacion("valido", modoLectoraUbicacion);
      
      // Buscar expediente - COMPARACIÓN FLEXIBLE
      const numeroBase = valor.split('-')[0];
      const expediente = expedienteService.listar().find((e) => {
        const eNumeroBase = (e.numeroExpediente || '').split('-')[0];
        return eNumeroBase === numeroBase || e.numeroExpediente === valor;
      });
      
      if (expediente) {
        selectExpediente.value = expediente.id;
        selectedId = expediente.id;
        document.getElementById("historial-contenedor").innerHTML = renderHistorial(selectedId);
        showToast("✅ Expediente encontrado", "success");
      } else {
        showToast("⚠️ Expediente no encontrado", "warning");
      }
    } else {
      actualizarChipUbicacion("invalido", modoLectoraUbicacion);
    }
  }

  actualizarChipUbicacion("pendiente", false);

  // Listeners de validación
  numeroInput.addEventListener("input", validarNumeroUbicacion);
  numeroInput.addEventListener("blur", validarNumeroUbicacion);
  numeroInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && modoLectoraUbicacion) {
      e.preventDefault();
      validarNumeroUbicacion();
    }
  });

  // Botones de modo
  document.getElementById("ubi-modo-manual")?.addEventListener("click", () => {
    modoLectoraUbicacion = false;
    numeroInput.value = "";
    numeroInput.focus();
    actualizarChipUbicacion("pendiente", false);
    modoAlerta.classList.add("hidden");
    showToast("Modo manual", "info");
  });

  document.getElementById("ubi-modo-lectora")?.addEventListener("click", () => {
    modoLectoraUbicacion = true;
    numeroInput.value = "";
    numeroInput.focus();
    actualizarChipUbicacion("pendiente", true);
    modoAlerta.classList.remove("hidden");
    
    openModal({
      title: "Modo Lectora - Registrar Movimiento",
      content: `
        <div class="space-y-4">
          <p class="text-base font-medium text-slate-700">Registrar ubicación y movimiento del expediente</p>
          
          <div class="${ALERT_TONES.info.surface} border ${ALERT_TONES.info.border} rounded-lg p-4 space-y-2">
            <p class="text-sm ${ALERT_TONES.info.text} font-semibold inline-flex items-center gap-2">${icon("list", "w-4 h-4")}<span>Instrucciones:</span></p>
            <ol class="text-sm ${ALERT_TONES.info.text} space-y-2 ml-4 list-decimal">
              <li>Acerca el código de barras al escáner</li>
              <li>El código se ingresará automáticamente</li>
              <li>Se buscará el expediente en el sistema</li>
              <li>Presiona <strong>ENTER</strong> para completar la búsqueda</li>
              <li>Completa la ubicación y el motivo del movimiento</li>
              <li>Registra el cambio</li>
            </ol>
          </div>
          
          <p class="text-xs text-slate-600 italic">El código de barras debe tener entre 20-23 dígitos</p>
        </div>
      `,
      confirmText: "Entendido",
      onConfirm: (close) => {
        close();
        showToast("Escanea el código del expediente", "success");
      }
    });
  });

  // Cambiar expediente desde select
  selectExpediente.addEventListener("change", (e) => {
    selectedId = e.target.value ? parseInt(e.target.value) : null;
    document.getElementById("historial-contenedor").innerHTML = renderHistorial(selectedId);
  });

  // Submit del formulario
  formUbicacion.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!selectExpediente.value) {
      alert("Por favor selecciona un expediente");
      return;
    }

    const datos = new FormData(formUbicacion);
    const movimiento = {
      expedienteId: parseInt(selectExpediente.value),
      ubicacionActual: datos.get("ubicacionActual"),
      estado: datos.get("estado"),
      motivo: datos.get("motivo"),
      observacion: datos.get("observacion"),
      fecha: new Date().toISOString(),
    };

    try {
      ubicacionService.guardarMovimiento(movimiento);
      showToast("✅ Movimiento registrado exitosamente", "success");
      formUbicacion.reset();
      numeroInput.value = "";
      actualizarChipUbicacion("pendiente", modoLectoraUbicacion);
      document.getElementById("historial-contenedor").innerHTML = renderHistorial(selectExpediente.value);
    } catch (error) {
      showToast(`❌ Error: ${error.message}`, "error");
    }
  });

  // Botón limpiar
  document.getElementById("btn-limpiar-ubi").addEventListener("click", () => {
    formUbicacion.reset();
    numeroInput.value = "";
    actualizarChipUbicacion("pendiente", modoLectoraUbicacion);
  });
}

