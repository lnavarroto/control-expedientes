import { renderExpedienteForm, renderFormularioLectora } from "../../components/expedienteForm.js";
import { openModal } from "../../components/modal.js";
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
    showToast("Corrija el formato del número de expediente.", "error");
    return;
  }

  if (!validarIncidente(data.incidente)) {
    showToast("El incidente debe estar entre 0 y 999.", "warning");
    return;
  }

  // Validar determinador (01-09) - ser más flexible
  const determinador = data.numeroJuzgado || form.numeroJuzgado?.value?.trim() || "";
  const determinadorNum = parseInt(determinador, 10);
  if (!determinador || determinador.length !== 2 || !/^\d+$/.test(determinador) || determinadorNum < 1 || determinadorNum > 9) {
    showToast(`Determinador inválido: "${determinador}" debe ser 2 dígitos entre 01-09`, "warning");
    return;
  }

  // ============ NUEVO: ENVIAR AL BACKEND ============
  const usuario = authManager.getTrabajador();
  if (!usuario) {
    showToast("❌ Debes estar logueado para registrar", "error");
    return;
  }

  // Obtener botón guardar
  const btnGuardar = document.getElementById("btn-guardar") || form.querySelector("button[type='submit']");

  // Llamar nueva función que maneja todo
  return guardarExpedienteAlBackendConConfirmacion(
    {
      numeroExpediente: data.numeroExpediente,
      anio: data.anio || new Date().getFullYear(),
      incidente: data.incidente,
      codigoCorte: data.codigoCorte || "3101",
      tipoOrgano: data.tipoOrgano || "1",
      materia: data.materia,
      id_juzgado: form.juzgado?.value || "",
      juzgado: data.juzgado,
      fechaIngreso: data.fechaIngreso,
      horaIngreso: data.horaIngreso,
      observaciones: data.observaciones
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
          <button id="btn-modo-manual" class="btn btn-secondary" title="Entrada manual con teclado">🖱️ Manual</button>
          <button id="btn-modo-lectora" class="btn btn-secondary" title="Presiona Enter para completar con lectora">📱 Lectora</button>
        </div>
      </div>
      
      <div id="form-container">${renderExpedienteForm(defaults())}</div>
    </section>
  `;

  // ============ SETUP INICIAL - MODO MANUAL ============
  setupFormManual();

  // ============ BOTONES DE MODO ============
  document.getElementById("btn-modo-manual")?.addEventListener("click", () => {
    modoLectora = false;
    const formContainer = document.getElementById("form-container");
    formContainer.innerHTML = renderExpedienteForm(defaults());
    setupFormManual();
    showToast("🖱️ Modo manual activado", "info");
  });

  document.getElementById("btn-modo-lectora")?.addEventListener("click", () => {
    modoLectora = true;
    const formContainer = document.getElementById("form-container");
    formContainer.innerHTML = renderFormularioLectora(defaults());
    setupFormLectora();
    
    openModal({
      title: "📱 Modo Lectora - Registro de Expedientes",
      content: `
        <div class="space-y-4">
          <p class="text-base font-medium text-slate-700">Usando escáner de códigos de barras - <strong>Solo ENTER ENTER</strong></p>
          
          <div class="bg-sky-50 border border-sky-300 rounded-lg p-4 space-y-2">
            <p class="text-sm text-sky-900 font-semibold">⚡ Flujo rápido (ENTER ENTER):</p>
            <ol class="text-sm text-sky-800 space-y-2 ml-4 list-decimal">
              <li><strong>ENTER 1:</strong> Escanea el código (se procesará automáticamente)</li>
              <li><strong>ENTER 2:</strong> Presiona ENTER nuevamente para registrar</li>
              <li>El expediente se creará en el backend sin confirmación adicional</li>
            </ol>
          </div>
          
          <div class="bg-amber-50 border border-amber-300 rounded-lg p-3">
            <p class="text-xs text-amber-700 font-semibold">💡 Nota: El código de barras debe tener entre 20-23 dígitos</p>
          </div>
        </div>
      `,
      confirmText: "Entendido",
      onConfirm: (close) => {
        close();
        document.getElementById("numero-expediente-lectora")?.focus();
        showToast("⚡ Escanea + ENTER (dos veces)", "success");
      }
    });
  });

  // ============ SETUP MODO MANUAL ============
  function setupFormManual() {
    const form = document.getElementById("form-expediente");
    if (!form) return;

    const numeroInput = form.numeroExpediente;
    const checkboxIncidente = document.getElementById("checkbox-incidente");
    const inputIncidente = document.getElementById("input-incidente");
    const inputDeterminador = document.getElementById("input-determinador");

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
      // Solo permitir números mientras escribe
      numeroInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/[^\d]/g, "").slice(0, 5);
      });

      // Al perder foco, aplicar padding
      numeroInput.addEventListener("blur", (e) => {
        let valor = e.target.value.trim();
        if (valor && /^\d+$/.test(valor)) {
          // Solo números, aplicar padding a 5 dígitos
          e.target.value = valor.padStart(5, "0");
          validarNumeroRegistro();
        }
      });

      // ⚡ NUEVO: Permitir ENTER en el número para:
      // 1ra vez: validar
      // 2da vez: enviar (si ya está validado)
      numeroInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          
          const chip = form.querySelector("#numero-expediente-chip");
          const esValido = chip && chip.textContent.includes("✅");
          
          if (esValido && numeroInput.dataset.enterPresionado === "once") {
            // Segunda vez presionando ENTER: enviar directamente
            form.dispatchEvent(new Event("submit"));
            numeroInput.dataset.enterPresionado = "";
          } else if (!esValido) {
            // Primera vez: validar/autocompletar
            let valor = numeroInput.value.trim();
            if (valor && /^\d+$/.test(valor)) {
              numeroInput.value = valor.padStart(5, "0");
              validarNumeroRegistro();
              numeroInput.dataset.enterPresionado = "once";
            }
          } else if (esValido) {
            // Ya está válido, marcar que ENTER fue presionado
            numeroInput.dataset.enterPresionado = "once";
          }
        }
      });
    }

    // Validación en tiempo real
    function validarNumeroRegistro() {
      const valor = numeroInput.value.trim().toUpperCase();

      if (!valor) {
        actualizarChipManual("pendiente");
        return;
      }

      if (validarNumeroExpediente(valor)) {
        actualizarChipManual("valido");
        intentarAutoCompletar(form, valor);
      } else {
        actualizarChipManual("invalido");
      }
    }

    function actualizarChipManual(estado) {
      const badge = form.querySelector("#numero-expediente-chip");
      if (!badge) return;

      const estados = {
        pendiente: "Pendiente de validar",
        valido: "✅ Válido",
        invalido: "❌ Inválido"
      };
      badge.textContent = estados[estado] || "Pendiente";
      badge.className = `badge ${
        estado === "valido" ? "bg-green-100 text-green-800" : 
        estado === "invalido" ? "bg-red-100 text-red-800" : 
        "bg-slate-100 text-slate-700"
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
      actualizarChipManual("pendiente");
      actualizarEstadoVisual(form);
      showToast("Formulario limpio", "info");
    });

    // Permitir ENTER para enviar directamente si el chip es válido
    const observacionesInput = form.querySelector("textarea[name='observaciones']");
    if (observacionesInput) {
      observacionesInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          const chip = form.querySelector("#numero-expediente-chip");
          if (chip && chip.textContent.includes("✅")) {
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
        html = `<div class="px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-600">
          ⏳ Esperando escaneo...
        </div>`;
      } else if (estado === "valido") {
        html = `<div class="px-4 py-3 rounded-lg border-2 border-green-400 bg-green-50 text-sm font-semibold text-green-700">
          ✅ Código válido - Listo para guardar
        </div>`;
      } else if (estado === "invalido") {
        html = `<div class="px-4 py-3 rounded-lg border-2 border-red-400 bg-red-50 text-sm font-semibold text-red-700">
          ❌ Formato inválido (Debe tener 20-23 dígitos)
        </div>`;
      }
      chipBox.innerHTML = html;
    }

    function procesarCodigoLectora(codigo) {
      const valor = codigo.trim();
      
      // Extraer SOLO dígitos válidos (20-23 dígitos numéricos)
      const codigoExtraido = /^\d+/.exec(valor)?.[0];
      if (!codigoExtraido || (codigoExtraido.length < 20 && codigoExtraido.length !== 23)) {
        actualizarChipLectora("invalido");
        resumenBox.classList.add("hidden");
        btnGuardar.disabled = true;
        showToast("❌ Código inválido (debe contener 20-23 dígitos)", "error");
        return;
      }
      
      // Tomar solo 20 o 23 dígitos
      const codigoFinal = codigoExtraido.substring(0, 23);

      // Parsear
      const parsed = parsearLectora(codigoFinal);
      if (!parsed) {
        actualizarChipLectora("invalido");
        resumenBox.classList.add("hidden");
        btnGuardar.disabled = true;
        showToast("❌ No se pudo procesar el código de barras", "error");
        return;
      }

      // ✅ VALIDAR DUPLICADO: Usar datos del BACKEND (fuente de verdad)
      const expedientesBackend = expedienteService.listarDelBackendSync();
      const yaExisteEnBackend = expedientesBackend.some(exp => 
        exp.numeroExpediente === parsed.numeroExpediente
      );

      if (yaExisteEnBackend) {
        actualizarChipLectora("invalido");
        resumenBox.classList.add("hidden");
        btnGuardar.disabled = true;
        showToast(`❌ DUPLICADO: El expediente ${parsed.numeroExpediente} ya está registrado en el servidor`, "error");
        return;
      }

      // Mapeo automático: determinador → juzgado específico
      const mapDeterminador = {
        "01": ["1er", "Primer"],
        "02": ["2do", "Segundo"],
        "03": ["3er", "Tercer"],
        "04": ["4", "Cuarto"],
        "05": ["5", "Quinto"],
        "06": ["6", "Sexto"],
        "07": ["7", "Séptimo"],
        "08": ["8", "Octavo"],
        "09": ["9", "Noveno"]
      };
      
      // Buscar juzgado específico basado en determinador
      const patternsABuscar = mapDeterminador[parsed.numeroJuzgado] || ["1er", "Primer"];
      const juzgados = juzgadoService.listarSync();
      
      let juzgadoDetectado = null;
      for (const pattern of patternsABuscar) {
        juzgadoDetectado = juzgados.find(j => j.nombre.includes(pattern) && j.nombre.includes("Civil"));
        if (juzgadoDetectado) break;
      }
      
      const juzgadoNombre = juzgadoDetectado ? juzgadoDetectado.nombre : `Juzgado Civil - Det. ${parsed.numeroJuzgado}`;

      // Actualizar formulario con datos parseados
      form.numeroExpediente.value = parsed.numeroExpediente;
      document.getElementById("input-anio").value = parsed.anio;
      document.getElementById("input-incidente").value = parsed.incidente;
      document.getElementById("input-codigo-corte").value = parsed.codigoCorte;
      document.getElementById("input-materia").value = parsed.materia;
      
      // Guardar juzgado específico detectado
      document.getElementById("input-juzgado").value = juzgadoNombre;
      form.juzgado.value = juzgadoNombre; // También en el formulario
      
      // Guardar determinador (numeroJuzgado) - importante para la validación
      form.numeroJuzgado.value = parsed.numeroJuzgado || "01";
      form.numeroJuzgado.style.display = "none"; // Ocultar del formulario
      
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

      // Mostrar mensaje con determinador
      showToast(`✅ Detectado: ${juzgadoNombre} (determinador: ${parsed.numeroJuzgado})`, "success");

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
                ${juzgados.map(j => `<option value="${j.nombre}" ${j.nombre === juzgadoActual ? 'selected' : ''}>${j.nombre}</option>`).join('')}
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
          const nuevoJuzgado = document.getElementById("modal-juzgado")?.value || juzgadoActual;
          const nuevoPaquete = document.getElementById("modal-paquete")?.value || "";
          const nuevaUbicacion = document.getElementById("modal-ubicacion")?.value || "Estante";
          const nuevoEstado = document.getElementById("modal-estado")?.value || "Ingresado";
          
          if (!nuevoJuzgado) {
            showToast("⚠️ Debes seleccionar un juzgado", "warning");
            return;
          }
          
          if (!nuevoNumero) {
            showToast("⚠️ El número de expediente no puede estar vacío", "warning");
            return;
          }
          
          // Guardar cambios en el formulario
          form.numeroExpediente.value = nuevoNumero;
          form.juzgado.value = nuevoJuzgado;
          document.getElementById("input-juzgado").value = nuevoJuzgado;
          form.paqueteId.value = nuevoPaquete;
          form.ubicacionActual.value = nuevaUbicacion;
          form.estado.value = nuevoEstado;
          
          // Actualizar resumen
          document.getElementById("resumen-expediente-completo").textContent = nuevoNumero;
          document.getElementById("resumen-juzgado").textContent = nuevoJuzgado;
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
