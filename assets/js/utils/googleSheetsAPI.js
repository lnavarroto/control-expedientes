// ============================================================================
// INTEGRACION FRONTEND - Google Apps Script API
// Sistema de Archivo - Módulo Civil Sullana
// ============================================================================

/**
 * Configuración de conexión con Google Apps Script
 * 
 * PASO 1: Despliega tu Apps Script como API web
 * - Vé a Apps Script
 * - Deploy > New deployment > Web app
 * - Execute as: Tu cuenta
 * - Who has access: Anyone
 * - Copia la URL del deployment
 * 
 * PASO 2: Reemplaza URL_API_GOOGLE_APPS_SCRIPT con tu URL
 */

const API_CONFIG = {
  // Reemplazar con tu URL de deployment de Apps Script
  BASE_URL: "https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercontent/exec",
  TIMEOUT: 10000 // milisegundos
};

// ============================================================================
// CLASE API - Cliente para comunicación con backend
// ============================================================================

class ArchivoAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Realiza GET request
   */
  async get(action, params = {}) {
    try {
      const queryParams = new URLSearchParams({ action, ...params }).toString();
      const url = `${this.baseUrl}?${queryParams}`;

      const response = await fetch(url, { method: "GET" });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Error desconocido");
      }

      return data.data;
    } catch (error) {
      console.error("❌ Error GET:", error);
      throw error;
    }
  }

  /**
   * Realiza POST request
   */
  async post(action, payload = {}) {
    try {
      const body = JSON.stringify({ action, ...payload });

      const response = await fetch(this.baseUrl, {
        method: "POST",
        contentType: "application/json",
        payload: body
      });

      const data = JSON.parse(response.getContentText());

      if (!data.success) {
        throw new Error(data.error || "Error desconocido");
      }

      return data.data;
    } catch (error) {
      console.error("❌ Error POST:", error);
      throw error;
    }
  }
}

// Instancia global de la API
const archivoAPI = new ArchivoAPI(API_CONFIG.BASE_URL);

// ============================================================================
// USUARIOS - Ejemplos de uso
// ============================================================================

/**
 * Crear nuevo usuario
 * @example
 * crearUsuarioFE({
 *   dni: "12345678",
 *   nombres: "Juan",
 *   apellidos: "Pérez",
 *   correo: "juan@example.com",
 *   cargo: "Archivador",
 *   rol: "Archivador"
 * })
 */
async function crearUsuarioFE(datos) {
  try {
    const usuario = await archivoAPI.post("crear_usuario", datos);
    showToast(`✅ Usuario ${usuario.nombres} creado`, "success");
    return usuario;
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
}

/**
 * Actualizar usuario
 */
async function actualizarUsuarioFE(id_usuario, datos) {
  try {
    await archivoAPI.post("actualizar_usuario", { id_usuario, ...datos });
    showToast("✅ Usuario actualizado", "success");
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
}

/**
 * Listar todos los usuarios
 */
async function listarUsuariosFE() {
  try {
    const usuarios = await archivoAPI.get("listar_usuarios");
    console.log("📋 Usuarios:", usuarios);
    return usuarios;
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
}

/**
 * Obtener usuario por DNI
 */
async function obtenerUsuarioPorDNIFE(dni) {
  try {
    const usuario = await archivoAPI.get("obtener_usuario_por_dni", { dni });
    console.log("👤 Usuario:", usuario);
    return usuario;
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
}

// ============================================================================
// EXPEDIENTES - Ejemplos de uso
// ============================================================================

/**
 * Crear expediente
 * @example
 * crearExpedienteFE({
 *   numero_expediente: "00123",
 *   anio: "2026",
 *   id_juzgado: "JZ-001",
 *   codigo_materia: "CI",
 *   origen_registro: "LECTORA",
 *   registrado_por: "USR-001"
 * })
 */
async function crearExpedienteFE(datos) {
  try {
    const expediente = await archivoAPI.post("crear_expediente", datos);
    showToast(`✅ Expediente ${expediente.numero_expediente} creado`, "success");
    return expediente;
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
}

/**
 * Listar todos los expedientes
 */
async function listarExpedientesFE() {
  try {
    const expedientes = await archivoAPI.get("listar_expedientes");
    return expedientes;
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
}

/**
 * Obtener expediente por código o número
 */
async function obtenerExpedienteFE(codigo) {
  try {
    const expediente = await archivoAPI.get("obtener_expediente_por_codigo", { codigo });
    return expediente;
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
}

/**
 * Buscar expedientes con filtros
 * @example
 * buscarExpedientesFE({
 *   numero: "00123",
 *   id_juzgado: "JZ-001",
 *   id_estado: "EST-001",
 *   activo: "SI"
 * })
 */
async function buscarExpedientesFE(filtros = {}) {
  try {
    const expedientes = await archivoAPI.get("buscar_expedientes", filtros);
    return expedientes;
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
}

/**
 * Actualizar estado del expediente
 */
async function actualizarEstadoExpedienteFE(id_expediente, id_estado, motivo = "") {
  try {
    await archivoAPI.post("actualizar_estado_expediente", {
      id_expediente,
      id_estado,
      motivo
    });
    showToast("✅ Estado actualizado", "success");
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
}

/**
 * Actualizar ubicación del expediente
 */
async function actualizarUbicacionExpedienteFE(id_expediente, id_ubicacion_actual, motivo = "") {
  try {
    await archivoAPI.post("actualizar_ubicacion_expediente", {
      id_expediente,
      id_ubicacion_actual,
      motivo
    });
    showToast("✅ Ubicación actualizada", "success");
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
}

// ============================================================================
// MOVIMIENTOS - Ejemplos de uso
// ============================================================================

/**
 * Registrar movimiento de expediente
 */
async function registrarMovimientoFE(datos) {
  try {
    const movimiento = await archivoAPI.post("registrar_movimiento", datos);
    showToast("✅ Movimiento registrado", "success");
    return movimiento;
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
}

/**
 * Listar movimientos de un expediente
 */
async function listarMovimientosFE(expediente_id) {
  try {
    const movimientos = await archivoAPI.get("listar_movimientos_por_expediente", { expediente_id });
    return movimientos;
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
}

// ============================================================================
// DATOS MAESTROS - Listar valores
// ============================================================================

/**
 * Listar juzgados activos
 */
async function listarJuzgadosFE() {
  try {
    return await archivoAPI.get("listar_juzgados");
  } catch (error) {
    console.error("❌ Error al listar juzgados:", error);
    return [];
  }
}

/**
 * Listar materias activas
 */
async function listarMateriasFE() {
  try {
    return await archivoAPI.get("listar_materias");
  } catch (error) {
    console.error("❌ Error al listar materias:", error);
    return [];
  }
}

/**
 * Listar ubicaciones activas
 */
async function listarUbicacionesFE() {
  try {
    return await archivoAPI.get("listar_ubicaciones");
  } catch (error) {
    console.error("❌ Error al listar ubicaciones:", error);
    return [];
  }
}

/**
 * Listar estados de expediente
 */
async function listarEstadosFE() {
  try {
    return await archivoAPI.get("listar_estados");
  } catch (error) {
    console.error("❌ Error al listar estados:", error);
    return [];
  }
}

// ============================================================================
// FLUJO COMPLETO - Ejemplo de integración
// ============================================================================

/**
 * Flujo completo de registro:
 * 1. Crear usuario (si es nuevo)
 * 2. Crear expediente
 * 3. Registrar movimiento inicial
 */
async function flujoRegistroCompleto(datosUsuario, datosExpediente) {
  try {
    // 1. Crear usuario
    const usuario = await crearUsuarioFE(datosUsuario);
    
    // 2. Crear expediente
    const expediente = await crearExpedienteFE({
      ...datosExpediente,
      registrado_por: usuario.id_usuario
    });

    // 3. Registrar movimiento inicial
    await registrarMovimientoFE({
      id_expediente: expediente.id_expediente,
      tipo_movimiento: "INGRESO",
      motivo: "Ingreso inicial al archivo",
      realizado_por: usuario.id_usuario
    });

    showToast("✅ Flujo completo finalizado", "success");
    return expediente;
  } catch (error) {
    showToast(`❌ Error en flujo: ${error.message}`, "error");
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Mostrar notificación (requires showToast function)
 */
function showToast(mensaje, tipo = "info") {
  // Esta función debe estar definida en tu proyecto
  // O usa: alert(mensaje) como fallback
  console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
}

/**
 * Cargar juzgados en un select HTML
 */
async function cargarJuzgadosEnSelect(selectId) {
  try {
    const juzgados = await listarJuzgadosFE();
    const select = document.getElementById(selectId);
    
    select.innerHTML = '<option value="">Seleccionar juzgado...</option>';
    juzgados.forEach(j => {
      const option = document.createElement("option");
      option.value = j.id_juzgado;
      option.textContent = j.nombre_juzgado;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar juzgados:", error);
  }
}

/**
 * Cargar ubicaciones en un select HTML
 */
async function cargarUbicacionesEnSelect(selectId) {
  try {
    const ubicaciones = await listarUbicacionesFE();
    const select = document.getElementById(selectId);
    
    select.innerHTML = '<option value="">Seleccionar ubicación...</option>';
    ubicaciones.forEach(u => {
      const option = document.createElement("option");
      option.value = u.id_ubicacion;
      option.textContent = u.nombre_ubicacion;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar ubicaciones:", error);
  }
}
