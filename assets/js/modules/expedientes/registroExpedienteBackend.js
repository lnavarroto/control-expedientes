/**
 * Módulo de Registro de Expedientes contra Backend
 * Integración con Google Apps Script
 */

import { appConfig } from "../../config.js";
import { showToast } from "../../components/toast.js";

// Variables para prevenir doble envío
let enviandoExpediente = false;
const expedientesEnProceso = new Set();

/**
 * Validar campos obligatorios para registro
 */
export function validarRegistroExpediente(datos) {
  const errores = [];

  if (!datos.numero_expediente || !datos.numero_expediente.trim()) {
    errores.push("Número de expediente es obligatorio");
  }
  if (!datos.anio || !datos.anio.toString().trim()) {
    errores.push("Año es obligatorio");
  }
  if (datos.incidente === null || datos.incidente === undefined || datos.incidente.toString() === "") {
    errores.push("Incidente es obligatorio");
  }
  if (!datos.codigo_corte || !datos.codigo_corte.trim()) {
    errores.push("Código de corte es obligatorio");
  }
  if (!datos.tipo_organo || !datos.tipo_organo.toString().trim()) {
    errores.push("Tipo de órgano es obligatorio");
  }
  if (!datos.codigo_materia || !datos.codigo_materia.trim()) {
    errores.push("Materia es obligatoria");
  }
  if (!datos.id_juzgado || !datos.id_juzgado.toString().trim()) {
    errores.push("Juzgado es obligatorio");
  }
  if (!datos.dni_usuario || !datos.dni_usuario.trim()) {
    errores.push("DNI del usuario registrador es obligatorio");
  }
  if (!datos.nombres_usuario || !datos.nombres_usuario.trim()) {
    errores.push("Nombres del usuario registrador son obligatorios");
  }
  if (!datos.apellidos_usuario || !datos.apellidos_usuario.trim()) {
    errores.push("Apellidos del usuario registrador son obligatorios");
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

/**
 * Construir payload para enviar al backend
 */
export function construirPayloadExpediente(formData, usuario) {
  const numeroExp = (formData.numero_expediente || "").toString().trim();
  const anio = (formData.anio || new Date().getFullYear()).toString();
  const incidente = (formData.incidente || "0").toString();
  const codigoCorte = (formData.codigo_corte || "3101").toString().trim();
  const tipoOrgano = (formData.tipo_organo || "1").toString().trim();
  const codigoMateria = (formData.codigo_materia || "").toString().trim();
  
  // Construir código completo
  const codigoCompleto = [
    numeroExp.padStart(5, "0"),
    anio,
    incidente.padStart(1, "0"),
    codigoCorte,
    codigoMateria.substring(0, 2).padEnd(2, "-"),
    incidente.padStart(2, "0")
  ].join("-");

  return {
    action: "crear_expediente",
    numero_expediente: numeroExp,
    anio: anio,
    incidente: incidente,
    codigo_corte: codigoCorte,
    tipo_organo: tipoOrgano,
    codigo_materia: codigoMateria,
    id_juzgado: formData.id_juzgado ? formData.id_juzgado.toString() : "",
    juzgado_texto: formData.juzgado_texto || "",
    observaciones: (formData.observaciones || "").toString().trim(),
    origen_registro: "MANUAL",
    registrado_por: `${usuario.nombres} ${usuario.apellidos}`,
    dni_usuario: usuario.dni,
    nombres_usuario: usuario.nombres,
    apellidos_usuario: usuario.apellidos
  };
}

/**
 * Enviar expediente al backend
 */
export async function enviarExpedienteAlBackend(payload, btnGuardar) {
  if (enviandoExpediente) {
    showToast("⏳ Ya hay un registro en proceso. Espera a que termine.", "warning");
    return { success: false, message: "Envío en progreso" };
  }

  const codigoExp = `${payload.numero_expediente}-${payload.anio}`;
  
  if (expedientesEnProceso.has(codigoExp)) {
    showToast("⚠️ Este expediente ya está siendo registrado. Evita doble clic.", "warning");
    return { success: false, message: "Expediente duplicado en proceso" };
  }

  try {
    enviandoExpediente = true;
    expedientesEnProceso.add(codigoExp);
    
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.style.opacity = "0.6";
      btnGuardar.style.cursor = "wait";
    }

    const response = await fetch(appConfig.googleSheetURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultado = await response.json();

    if (resultado.success) {
      showToast(
        `✅ Expediente registrado exitosamente: ${codigoExp}`,
        "success"
      );
      return { success: true, data: resultado.data };
    } else {
      const mensaje = resultado.message || "Error al registrar expediente";
      
      // Detectar si es error de duplicado
      if (mensaje.toLowerCase().includes("ya existe")) {
        showToast(
          `❌ ${mensaje}. Este expediente ya está registrado.`,
          "error"
        );
      } else {
        showToast(`❌ Error: ${mensaje}`, "error");
      }
      
      return { success: false, message: mensaje };
    }
  } catch (error) {
    console.error("Error al enviar expediente:", error);
    showToast(
      `❌ Error de conexión: ${error.message}. Verifica tu conexión a internet.`,
      "error"
    );
    return { success: false, message: error.message };
  } finally {
    enviandoExpediente = false;
    expedientesEnProceso.delete(codigoExp);
    
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.style.opacity = "1";
      btnGuardar.style.cursor = "pointer";
    }
  }
}

/**
 * Obtener expedientes del backend
 */
export async function obtenerExpedientesDelBackend() {
  try {
    const url = `${appConfig.googleSheetURL}?action=listar_expedientes`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultado = await response.json();

    if (resultado.success && Array.isArray(resultado.data)) {
      return {
        success: true,
        data: resultado.data,
        total: resultado.data.length
      };
    } else {
      console.warn("Respuesta inesperada del backend:", resultado);
      return {
        success: false,
        data: [],
        message: "No se puedo leer expedientes"
      };
    }
  } catch (error) {
    console.error("Error obteniendo expedientes:", error);
    return {
      success: false,
      data: [],
      message: error.message
    };
  }
}

/**
 * Obtener un expediente por código
 */
export async function obtenerExpedientePorCodigo(codigo) {
  try {
    const url = `${appConfig.googleSheetURL}?action=obtener_expediente_por_codigo&codigo=${encodeURIComponent(
      codigo
    )}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultado = await response.json();

    if (resultado.success) {
      return { success: true, data: resultado.data };
    } else {
      return { success: false, message: "Expediente no encontrado" };
    }
  } catch (error) {
    console.error("Error obteniendo expediente:", error);
    return { success: false, message: error.message };
  }
}
