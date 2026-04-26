/**
 * Funciones de Registro de Expedientes contra Backend
 * Integración segura con validaciones
 */

import { authManager } from "../../auth/authManager.js";
import { showToast } from "../../components/toast.js";
import { expedienteService } from "../../services/expedienteService.js";
import { juzgadoService } from "../../services/juzgadoService.js";
import { materiaService } from "../../services/materiaService.js";
import { appConfig } from "../../config.js";

// Variables de control de doble envío
let enviandoExpediente = false;
const expedientesEnProceso = new Map();

// ✅ REEMPLAZAR POR ESTO - respeta el código completo
function extraerNumeroExpedienteBase(valor) {
  const texto = String(valor || "").trim().toUpperCase();
  if (!texto) return "";

  // Si ya es código completo con guiones, devolverlo tal cual
  if (texto.includes("-")) return texto;

  // Si es solo número, formatear con ceros
  const matchInicio = texto.match(/^(\d+)/);
  if (matchInicio) {
    return String(matchInicio[1]).padStart(5, "0");
  }

  const soloDigitos = texto.replace(/\D/g, "");
  if (!soloDigitos) return "";

  return soloDigitos.slice(0, 5).padStart(5, "0");
}

function resetearFormularioManual() {
  const form = document.getElementById("form-expediente");
  if (!form) return;

  form.numeroExpediente.value = "";
  form.numeroExpediente.dataset.enterPresionado = "";
  form.anio.value = "";
  form.incidente.value = "0";
  document.getElementById("checkbox-incidente")?.checked && document.getElementById("checkbox-incidente").dispatchEvent(new Event("change"));
  form.codigoCorte.value = "3101";
  form.materia.value = "CI";
  form.numeroJuzgado.value = "01";
  form.fechaIngreso.value = new Date().toISOString().split("T")[0];
  form.horaIngreso.value = new Date().toTimeString().slice(0, 5);
  form.estado.value = "Ingresado";
  form.ubicacionActual.value = "Estante";
  form.juzgado.value = "";
  form.paqueteId.value = "";
  if (form.codigoLecturaRaw) form.codigoLecturaRaw.value = "";
  form.observaciones.value = "";

  const badge = form.querySelector("#numero-expediente-chip");
  if (badge) {
    badge.textContent = "Pendiente de validar";
    badge.className = "badge bg-slate-100 text-slate-700 text-xs px-3 py-1 font-semibold";
  }

  form.numeroExpediente.focus();
}

function resetearFormularioLectora() {
  const form = document.getElementById("form-expediente-lectora");
  const numeroInput = document.getElementById("numero-expediente-lectora");

  if (form) {
    form.numeroExpediente.value = "";
    form.numeroJuzgado.value = "01";
  }

  if (numeroInput) {
    numeroInput.value = "";
    numeroInput.dataset.listoParaEnviar = "false";
    numeroInput.focus();
  }

  document.getElementById("input-anio").value = "";
  document.getElementById("input-incidente").value = "0";
  document.getElementById("input-codigo-corte").value = "";
  document.getElementById("input-materia").value = "";
  document.getElementById("input-juzgado").value = "";
  document.getElementById("input-numero-juzgado").value = "01";
  document.getElementById("input-codigo-lectura-raw").value = "";
  document.getElementById("resumen-expediente-completo").textContent = "-";
  document.getElementById("resumen-juzgado").textContent = "-";
  document.getElementById("resumen-paquete").textContent = "---";
  document.getElementById("resumen-ubicacion").textContent = "-";
  document.getElementById("resumen-estado").textContent = "-";

  const resumenBox = document.getElementById("resumen-lectora");
  if (resumenBox) resumenBox.classList.add("hidden");

  // Limpiar observaciones
  if (form) {
    const observacionesTextarea = form.querySelector("textarea[name='observaciones']");
    if (observacionesTextarea) {
      observacionesTextarea.value = "";
    }
  }
}

/**
 * Construir payload para enviar al backend
 */
export function construirPayloadRegistro(formData, usuario) {
  const juzgados = juzgadoService.listarSync();
  const materias = materiaService.listarSync();

  let juzgadoTexto = formData.juzgado || "";
  const idJuzgado = String(formData.id_juzgado || "").trim();

  if (idJuzgado) {
    const juz = juzgados.find(j =>
      String(j.id_juzgado || "").trim() === idJuzgado
    );

    if (juz) {
  juzgadoTexto = String(juz.nombre_juzgado || juz.nombre || "").trim(); // ✅ correcto
}
  }

  let codigoMateria = formData.materia || "CI";
  if (formData.codigo_materia) {
    codigoMateria = formData.codigo_materia;
  } else {
    const mat = materias.find(m =>
      m.nombre === formData.materia || m.abreviatura === formData.materia
    );
    if (mat) {
      codigoMateria = mat.codigo;
    }
  }

  const numeroExpRaw = (formData.numeroExpediente || "").toString().trim().toUpperCase();
  const anio = (formData.anio || new Date().getFullYear()).toString();
  const incidente = (formData.incidente || "0").toString();
  const codigoCorte = (formData.codigoCorte || "3101").toString();
  const tipoOrgano = (formData.tipoOrgano || "").toString().trim().toUpperCase();

  const codigoBarras = (formData.codigoLecturaRaw || "").toString().trim();
  const numeroExpCompleto = numeroExpRaw;

  return {
    action: "registrar_expediente",
    codigo_expediente_completo: codigoBarras || numeroExpCompleto,
    numero_expediente: numeroExpCompleto,
    anio: anio,
    incidente: incidente,
    codigo_corte: codigoCorte,
    tipo_organo: tipoOrgano,
    codigo_materia: codigoMateria,
    id_juzgado: idJuzgado,
    juzgado_texto: juzgadoTexto,
    fecha_ingreso: formData.fechaIngreso || new Date().toISOString().slice(0, 10),
    hora_ingreso: formData.horaIngreso || new Date().toTimeString().slice(0, 5),
    observaciones: (formData.observaciones || "").toString().trim(),
    origen_registro: "MANUAL",
    registrado_por: `${usuario.nombres} ${usuario.apellidos}`,
    dni_usuario: usuario.dni,
    nombres_usuario: usuario.nombres,
    apellidos_usuario: usuario.apellidos
  };
}

/**
 * Enviar expediente al backend con prevención de doble envío
 */
export async function enviarExpedienteAlBackend(payload, btnGuardar) {
  if (enviandoExpediente) {
    showToast("⏳ Ya hay un registro en proceso. Espera a que termine.", "warning");
    return { success: false, error: "Ya se está enviando otro expediente" };
  }

  const codigoKey = payload.codigo_expediente_completo ||
                    `${payload.numero_expediente}-${payload.anio}`;

  if (expedientesEnProceso.has(codigoKey)) {
    showToast("⚠️ Este expediente ya está siendo registrado. Evita doble clic.", "warning");
    return { success: false, error: "Expediente ya en proceso" };
  }

  // ✅ Validar duplicado cubriendo registros nuevos (código barras) y antiguos (número legible)
  const expedientesBackend = expedienteService.listarDelBackendSync();
  const codigoNuevo = String(payload.codigo_expediente_completo || "").trim();
  const numeroNuevo = String(payload.numero_expediente || "").trim();

  const yaExisteLocalmente = expedientesBackend.some(exp => {
    const codigoExistente = String(exp.codigo_expediente_completo || "").trim();
    const numeroExistente = String(exp.numero_expediente || "").trim();
    return (
      codigoExistente === codigoNuevo ||  // registros nuevos (código barras)
      codigoExistente === numeroNuevo ||  // registros antiguos (número legible)
      numeroExistente === numeroNuevo     // número legible contra número legible
    );
  });

  if (yaExisteLocalmente) {
    showToast(
      `❌ DUPLICADO: El expediente ${numeroNuevo} ya está registrado`,
      "error"
    );
    return { success: false, error: "Duplicado", isDuplicate: true };
  }

  try {
    enviandoExpediente = true;
    expedientesEnProceso.set(codigoKey, Date.now());

    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.style.opacity = "0.6";
      btnGuardar.style.cursor = "wait";
      btnGuardar.textContent = "⏳ Registrando...";
    }

    console.log("📤 Enviando expediente al backend:", payload);

    const response = await fetch(appConfig.registroExpedienteURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const resultado = await response.json();

    if (resultado.success) {
      showToast(
        `✅ Expediente registrado: ${numeroNuevo}`,
        "success"
      );

      // Limpiar caché de expedientes para que se recargue en próxima consulta
      localStorage.removeItem("expedientes_backend_cache");
      localStorage.removeItem("expedientes_backend_tiempo");

      return { success: true, data: resultado.data };
    } else {
      const mensaje = resultado.error || resultado.message || "Error desconocido";

      if (mensaje.toLowerCase().includes("ya existe") || mensaje.toLowerCase().includes("duplicad")) {
        showToast(
          `❌ DUPLICADO: El expediente ${numeroNuevo} ya existe en el servidor`,
          "error"
        );
        return { success: false, error: "Duplicado", isDuplicate: true };
      }

      showToast(`❌ ${mensaje}`, "error");
      return { success: false, error: mensaje };
    }
  } catch (error) {
    console.error("❌ Error enviando expediente:", error);
    showToast(
      `❌ Error de conexión: ${error.message}`,
      "error"
    );
    return { success: false, error: error.message };
  } finally {
    enviandoExpediente = false;
    expedientesEnProceso.delete(codigoKey);

    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.style.opacity = "1";
      btnGuardar.style.cursor = "pointer";
      btnGuardar.textContent = "✅ Guardar";
    }
  }
}

/**
 * Guardar formulario con confirmación y envío al backend
 */
export async function guardarExpedienteAlBackendConConfirmacion(
  formData,
  mountNode,
  modoLectora,
  btnGuardar
) {
  // Verificar usuario logueado
  const usuario = authManager.getTrabajador();
  if (!usuario || !usuario.dni) {
    showToast("❌ Debes estar logueado para registrar expedientes", "error");
    return;
  }

  // Construir payload
  const payload = construirPayloadRegistro(formData, usuario);

  // Validaciones
  const validaciones = {
    numero_expediente: payload.numero_expediente,
    anio: payload.anio,
    codigo_corte: payload.codigo_corte,
    tipo_organo: payload.tipo_organo,
    codigo_materia: payload.codigo_materia,
    id_juzgado: payload.id_juzgado
  };

  const errores = [];
  for (const [campo, valor] of Object.entries(validaciones)) {
    if (!valor || valor === "undefined") {
      errores.push(`${campo} es obligatorio`);
    }
  }

  if (errores.length > 0) {
    showToast(`❌ ${errores[0]}`, "error");
    return;
  }

  // Registrar DIRECTAMENTE sin modal de confirmación
  try {
    // Obtener referencia al botón guardar real si existe
    const btnOriginal = document.getElementById("btn-guardar") || btnGuardar;

    // Enviar al backend
    const resultado = await enviarExpedienteAlBackend(payload, btnOriginal);

    if (resultado.success) {
      // Guardar también localmente para historial
      expedienteService.guardar({
        id: `EXP-${Date.now()}`,
        numeroExpediente: payload.numero_expediente,
        anio: payload.anio,
        incidente: payload.incidente,
        codigoCorte: payload.codigo_corte,
        materia: payload.codigo_materia,
        juzgado: payload.juzgado_texto,
        fechaIngreso: payload.fecha_ingreso,
        horaIngreso: payload.hora_ingreso,
        estado: "Ingresado",
        ubicacionActual: "Archivo",
        observaciones: payload.observaciones
      });

      // Reiniciar formulario si fue manual
      if (!modoLectora) {
        resetearFormularioManual();
        showToast("✅ Formulario listo para el próximo expediente", "success");
      } else {
        resetearFormularioLectora();
      }

      return { success: true };
    } else {
      return resultado;
    }
  } catch (error) {
    console.error("Error al guardar:", error);
    showToast(`❌ Error inesperado: ${error.message}`, "error");
    return { success: false, error: error.message };
  }
}
