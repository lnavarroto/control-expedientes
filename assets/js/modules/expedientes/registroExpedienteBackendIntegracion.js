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

/**
 * Construir payload para enviar al backend
 */
export function construirPayloadRegistro(formData, usuario) {
  const juzgados = juzgadoService.listarSync();
  const materias = materiaService.listarSync();

  // Obtener nombre de juzgado
  let juzgadoTexto = formData.juzgado || "";
  if (formData.id_juzgado) {
    const juz = juzgados.find(j => j.id === formData.id_juzgado || j.nombre === formData.juzgado);
    if (juz) {
      juzgadoTexto = juz.nombre;
    }
  }

  // Obtener código de materia
  let codigoMateria = formData.materia || "CI";
  if (formData.codigo_materia) {
    codigoMateria = formData.codigo_materia;
  } else {
    const mat = materias.find(m => m.nombre === formData.materia || m.abreviatura === formData.materia);
    if (mat) {
      codigoMateria = mat.codigo;
    }
  }

  const numeroExp = (formData.numeroExpediente || "").toString().padStart(5, "0");
  const anio = (formData.anio || new Date().getFullYear()).toString();
  const incidente = (formData.incidente || "0").toString();
  const codigoCorte = (formData.codigoCorte || "3101").toString();
  const tipoOrgano = (formData.tipoOrgano || "1").toString();

  return {
    action: "registrar_expediente",
    numero_expediente: numeroExp,
    anio: anio,
    incidente: incidente,
    codigo_corte: codigoCorte,
    tipo_organo: tipoOrgano,
    codigo_materia: codigoMateria,
    id_juzgado: formData.id_juzgado || "",
    juzgado_texto: juzgadoTexto,
    fecha_ingreso: formData.fechaIngreso || new Date().toISOString().slice(0, 10),
    hora_ingreso: formData.horaIngreso || new Date().toTimeString().slice(0, 5),
    observaciones: (formData.observaciones || "").toString().trim(),
    origen_registro: "SISTEMA",
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

  const codigoKey = `${payload.numero_expediente}-${payload.anio}`;

  if (expedientesEnProceso.has(codigoKey)) {
    showToast("⚠️ Este expediente ya está siendo registrado. Evita doble clic.", "warning");
    return { success: false, error: "Expediente ya en proceso" };
  }

  // ✅ VALIDACIÓN LOCAL RÁPIDA: Verificar contra caché del backend PRIMERO
  const expedientesBackend = expedienteService.listarDelBackendSync();
  const yaExisteLocalmente = expedientesBackend.some(exp => {
    const numExp = `${String(exp.numero_expediente || "").padStart(5, "0")}-${exp.anio || payload.anio}`;
    return numExp === codigoKey;
  });

  if (yaExisteLocalmente) {
    showToast(`❌ DUPLICADO: El expediente ${codigoKey} ya está registrado en el servidor`, "error");
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
        `✅ Expediente registrado: ${codigoKey}`,
        "success"
      );

      // Limpiar caché de expedientes para que se recargue en próxima consulta
      localStorage.removeItem("expedientes_backend_cache");
      localStorage.removeItem("expedientes_backend_tiempo");

      return { success: true, data: resultado.data };
    } else {
      const mensaje = resultado.message || "Error desconocido";

      if (mensaje.toLowerCase().includes("ya existe") || mensaje.toLowerCase().includes("duplicad")) {
        showToast(
          `❌ DUPLICADO: El expediente ${codigoKey} ya existe en el servidor`,
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

    // Restaurar botón
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
        setTimeout(() => {
          if (mountNode) {
            location.reload(); // Recargar para sincronizar con backend
          }
        }, 800);
      } else {
        // Si fue lectora, limpiar solo el input
        const numeroInput = document.getElementById("numero-expediente-lectora");
        if (numeroInput) {
          numeroInput.value = "";
          numeroInput.focus();
        }
        const resumenBox = document.getElementById("resumen-lectora");
        if (resumenBox) resumenBox.classList.add("hidden");
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
