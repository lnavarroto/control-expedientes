// ============================================================================
// SISTEMA DE ARCHIVO - MÓDULO CIVIL SULLANA
// Backend en Google Apps Script
// FASE 1: Usuarios, Expedientes, Movimientos
// ============================================================================

// CONFIG CENTRAL
const CONFIG = {
  SPREADSHEET_ID: "TU_SPREADSHEET_ID_AQUI", // Reemplazar con tu ID
  SHEETS: {
    usuarios: "usuarios",
    roles: "roles",
    juzgados: "juzgados",
    materias: "materias",
    ubicaciones: "ubicaciones",
    estados_expediente: "estados_expediente",
    paquetes: "paquetes",
    expedientes: "expedientes",
    movimientos_expediente: "movimientos_expediente",
    paquete_expediente: "paquete_expediente",
    parametros_sistema: "parametros_sistema",
    auditoria: "auditoria"
  }
};

// ============================================================================
// ENTRY POINTS PRINCIPALES
// ============================================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // USUARIOS
    if (action === "crear_usuario") return crearUsuario(data);
    if (action === "actualizar_usuario") return actualizarUsuario(data);
    
    // EXPEDIENTES
    if (action === "crear_expediente") return crearExpediente(data);
    if (action === "actualizar_estado_expediente") return actualizarEstadoExpediente(data);
    if (action === "actualizar_ubicacion_expediente") return actualizarUbicacionExpediente(data);
    
    // MOVIMIENTOS
    if (action === "registrar_movimiento") return registrarMovimiento(data);

    return respuestaError("Acción no válida");
  } catch (error) {
    return respuestaError(error.message);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const params = e.parameter;

    // USUARIOS
    if (action === "listar_usuarios") return listarUsuarios();
    if (action === "obtener_usuario_por_dni") {
      return obtenerUsuarioPorDNI(params.dni);
    }
    
    // EXPEDIENTES
    if (action === "listar_expedientes") return listarExpedientes();
    if (action === "obtener_expediente_por_codigo") {
      return obtenerExpedientePorCodigo(params.codigo);
    }
    if (action === "obtener_expediente_por_id") {
      return obtenerExpedientePorId(params.id);
    }
    if (action === "buscar_expedientes") {
      return buscarExpedientes(params);
    }
    
    // MOVIMIENTOS
    if (action === "listar_movimientos_por_expediente") {
      return listarMovimientosPorExpediente(params.expediente_id);
    }

    // DATOS MAESTROS
    if (action === "listar_juzgados") return listarJuzgados();
    if (action === "listar_materias") return listarMaterias();
    if (action === "listar_ubicaciones") return listarUbicaciones();
    if (action === "listar_estados") return listarEstados();

    return respuestaError("Acción no válida");
  } catch (error) {
    return respuestaError(error.message);
  }
}

// ============================================================================
// FUNCIONES UTILITARIAS CORE
// ============================================================================

/**
 * Obtiene spreadsheet activo
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

/**
 * Obtiene una hoja por nombre
 */
function getSheet(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Hoja no encontrada: ${sheetName}`);
  }
  return sheet;
}

/**
 * Obtiene headers de una hoja (primera fila)
 */
function getHeaders(sheet) {
  const data = sheet.getDataRange().getValues();
  return data.length > 0 ? data[0] : [];
}

/**
 * Mapea una fila a objeto usando headers
 */
function mapRowToObject(row, headers) {
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = row[index] !== undefined ? row[index] : null;
  });
  return obj;
}

/**
 * Obtiene todos los datos de una hoja como array de objetos
 */
function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) return [];
  
  const headers = data[0];
  return data.slice(1).map(row => mapRowToObject(row, headers));
}

/**
 * Encuentra index de columna por header
 */
function getColumnIndex(headers, columnName) {
  return headers.indexOf(columnName);
}

/**
 * Genera ID único
 */
function generarID(prefijo = "ID") {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return `${prefijo}-${timestamp}-${random}`;
}

/**
 * Respuesta exitosa estandarizada
 */
function respuestaExito(data = null, mensaje = "Operación exitosa") {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: mensaje,
      data: data
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Respuesta error estandarizada
 */
function respuestaError(error, codigo = 400) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : error,
      code: codigo
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// USUARIOS
// ============================================================================

function crearUsuario(data) {
  // Validaciones
  if (!data.dni) throw new Error("DNI requerido");
  if (!data.nombres) throw new Error("Nombres requeridos");
  if (!data.apellidos) throw new Error("Apellidos requeridos");

  const sheet = getSheet(CONFIG.SHEETS.usuarios);
  const headers = getHeaders(sheet);

  // Verificar DNI único
  const datosExistentes = getSheetData(CONFIG.SHEETS.usuarios);
  if (datosExistentes.some(u => u.dni === data.dni)) {
    throw new Error("DNI ya existe en el sistema");
  }

  // Preparar fila
  const fila = headers.map(header => {
    switch (header) {
      case "id_usuario":
        return generarID("USR");
      case "dni":
        return data.dni;
      case "nombres":
        return data.nombres;
      case "apellidos":
        return data.apellidos;
      case "correo":
        return data.correo || "";
      case "telefono":
        return data.telefono || "";
      case "cargo":
        return data.cargo || "";
      case "area_modulo":
        return data.area_modulo || "";
      case "rol":
        return data.rol || "";
      case "activo":
        return "SI";
      case "fecha_creacion":
        return new Date();
      case "fecha_actualizacion":
        return new Date();
      default:
        return "";
    }
  });

  sheet.appendRow(fila);
  
  // Retornar usuario creado
  const usuarioCreado = mapRowToObject(fila, headers);
  return respuestaExito(usuarioCreado, "Usuario creado exitosamente");
}

function actualizarUsuario(data) {
  if (!data.id_usuario) throw new Error("ID usuario requerido");

  const sheet = getSheet(CONFIG.SHEETS.usuarios);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];

  // Buscar usuario
  let rowIndex = -1;
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][getColumnIndex(headers, "id_usuario")] === data.id_usuario) {
      rowIndex = i + 1; // +1 porque appendRow es 1-indexed
      break;
    }
  }

  if (rowIndex === -1) throw new Error("Usuario no encontrado");

  // Actualizar campos
  headers.forEach((header, colIndex) => {
    if (data[header] !== undefined) {
      sheet.getRange(rowIndex, colIndex + 1).setValue(data[header]);
    }
  });

  // Actualizar fecha de modificación
  const fechaIndex = getColumnIndex(headers, "fecha_actualizacion");
  if (fechaIndex >= 0) {
    sheet.getRange(rowIndex, fechaIndex + 1).setValue(new Date());
  }

  return respuestaExito(data, "Usuario actualizado exitosamente");
}

function listarUsuarios() {
  const datos = getSheetData(CONFIG.SHEETS.usuarios);
  return respuestaExito(datos, `${datos.length} usuarios encontrados`);
}

function obtenerUsuarioPorDNI(dni) {
  if (!dni) throw new Error("DNI requerido");

  const datos = getSheetData(CONFIG.SHEETS.usuarios);
  const usuario = datos.find(u => u.dni === dni);

  if (!usuario) throw new Error("Usuario no encontrado");

  return respuestaExito(usuario);
}

// ============================================================================
// EXPEDIENTES
// ============================================================================

function crearExpediente(data) {
  // Validaciones
  if (!data.numero_expediente) throw new Error("Número de expediente requerido");
  if (!data.id_juzgado) throw new Error("Juzgado requerido");

  const sheet = getSheet(CONFIG.SHEETS.expedientes);
  const headers = getHeaders(sheet);

  // Verificar expediente único
  const expedientesExistentes = getSheetData(CONFIG.SHEETS.expedientes);
  if (expedientesExistentes.some(e => e.numero_expediente === data.numero_expediente)) {
    throw new Error("Expediente ya existe en el sistema");
  }

  // Generar código completo
  const codigoCompleto = data.codigo_expediente_completo || generarCodigoExpediente(
    data.numero_expediente,
    data.anio || new Date().getFullYear().toString(),
    data.tipo_organo || "1",
    data.codigo_corte || "3101",
    data.codigo_materia || "CI"
  );

  // Preparar fila
  const fila = headers.map(header => {
    switch (header) {
      case "id_expediente":
        return generarID("EXP");
      case "codigo_expediente_completo":
        return codigoCompleto;
      case "numero_expediente":
        return data.numero_expediente;
      case "anio":
        return data.anio || new Date().getFullYear();
      case "incidente":
        return data.incidente || "0";
      case "codigo_corte":
        return data.codigo_corte || "3101";
      case "tipo_organo":
        return data.tipo_organo || "1";
      case "codigo_materia":
        return data.codigo_materia || "CI";
      case "id_juzgado":
        return data.id_juzgado;
      case "juzgado_texto":
        return buscarValorEnSheet(CONFIG.SHEETS.juzgados, "id_juzgado", data.id_juzgado, "nombre_juzgado") || "";
      case "fecha_ingreso":
        return data.fecha_ingreso || new Date();
      case "hora_ingreso":
        return data.hora_ingreso || new Date().toLocaleTimeString();
      case "fecha_hora_ingreso":
        return new Date();
      case "id_ubicacion_actual":
        return data.id_ubicacion_actual || "";
      case "ubicacion_texto":
        return buscarValorEnSheet(CONFIG.SHEETS.ubicaciones, "id_ubicacion", data.id_ubicacion_actual, "nombre_ubicacion") || "";
      case "id_paquete":
        return data.id_paquete || "";
      case "id_estado":
        return data.id_estado || "1"; // Estado por defecto
      case "observaciones":
        return data.observaciones || "";
      case "origen_registro":
        return data.origen_registro || "MANUAL";
      case "registrado_por":
        return data.registrado_por || "";
      case "activo":
        return "SI";
      case "fecha_creacion":
        return new Date();
      case "fecha_actualizacion":
        return new Date();
      default:
        return "";
    }
  });

  sheet.appendRow(fila);
  
  const expedienteCreado = mapRowToObject(fila, headers);
  return respuestaExito(expedienteCreado, "Expediente creado exitosamente");
}

function generarCodigoExpediente(numero, anio, tipoOrgano, codigoCorte, materia) {
  // Formato: 00012-2026-1-3101-CI-01
  return `${numero.padStart(5, '0')}-${anio}-${tipoOrgano}-${codigoCorte}-${materia}-01`;
}

function buscarValorEnSheet(sheetName, columnaId, valorId, columnaRetorno) {
  try {
    const datos = getSheetData(sheetName);
    const registro = datos.find(r => r[columnaId] === valorId);
    return registro ? registro[columnaRetorno] : null;
  } catch (e) {
    return null;
  }
}

function actualizarEstadoExpediente(data) {
  if (!data.id_expediente) throw new Error("ID expediente requerido");
  if (!data.id_estado) throw new Error("Estado requerido");

  const sheet = getSheet(CONFIG.SHEETS.expedientes);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];

  // Buscar expediente
  let rowIndex = -1;
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][getColumnIndex(headers, "id_expediente")] === data.id_expediente) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) throw new Error("Expediente no encontrado");

  // Obtener estado anterior
  const estadoAnteriorIndex = getColumnIndex(headers, "id_estado");
  const estadoAnterior = allData[rowIndex - 1][estadoAnteriorIndex];

  // Actualizar estado
  sheet.getRange(rowIndex, estadoAnteriorIndex + 1).setValue(data.id_estado);
  
  // Actualizar fecha
  const fechaIndex = getColumnIndex(headers, "fecha_actualizacion");
  if (fechaIndex >= 0) {
    sheet.getRange(rowIndex, fechaIndex + 1).setValue(new Date());
  }

  // Registrar movimiento de cambio de estado
  if (data.id_expediente && estadoAnterior !== data.id_estado) {
    registrarMovimientoInterno({
      id_expediente: data.id_expediente,
      tipo_movimiento: "CAMBIO_ESTADO",
      estado_anterior: estadoAnterior,
      estado_nuevo: data.id_estado,
      motivo: data.motivo || "Cambio de estado"
    });
  }

  return respuestaExito(data, "Estado actualizado exitosamente");
}

function actualizarUbicacionExpediente(data) {
  if (!data.id_expediente) throw new Error("ID expediente requerido");
  if (!data.id_ubicacion_actual) throw new Error("Ubicación requerida");

  const sheet = getSheet(CONFIG.SHEETS.expedientes);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];

  // Buscar expediente
  let rowIndex = -1;
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][getColumnIndex(headers, "id_expediente")] === data.id_expediente) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) throw new Error("Expediente no encontrado");

  // Obtener ubicación anterior
  const ubicacionIndex = getColumnIndex(headers, "id_ubicacion_actual");
  const ubicacionAnterior = allData[rowIndex - 1][ubicacionIndex];

  // Actualizar ubicación
  sheet.getRange(rowIndex, ubicacionIndex + 1).setValue(data.id_ubicacion_actual);
  
  // Actualizar texto de ubicación
  const ubicacionTextIndex = getColumnIndex(headers, "ubicacion_texto");
  if (ubicacionTextIndex >= 0) {
    const nombreUbicacion = buscarValorEnSheet(CONFIG.SHEETS.ubicaciones, "id_ubicacion", data.id_ubicacion_actual, "nombre_ubicacion");
    sheet.getRange(rowIndex, ubicacionTextIndex + 1).setValue(nombreUbicacion || "");
  }
  
  // Actualizar fecha
  const fechaIndex = getColumnIndex(headers, "fecha_actualizacion");
  if (fechaIndex >= 0) {
    sheet.getRange(rowIndex, fechaIndex + 1).setValue(new Date());
  }

  // Registrar movimiento
  registrarMovimientoInterno({
    id_expediente: data.id_expediente,
    tipo_movimiento: "CAMBIO_UBICACION",
    ubicacion_origen: ubicacionAnterior,
    ubicacion_destino: data.id_ubicacion_actual,
    motivo: data.motivo || "Cambio de ubicación"
  });

  return respuestaExito(data, "Ubicación actualizada exitosamente");
}

function listarExpedientes() {
  const datos = getSheetData(CONFIG.SHEETS.expedientes);
  return respuestaExito(datos, `${datos.length} expedientes encontrados`);
}

function obtenerExpedientePorCodigo(codigo) {
  if (!codigo) throw new Error("Código requerido");

  const datos = getSheetData(CONFIG.SHEETS.expedientes);
  const expediente = datos.find(e => 
    e.codigo_expediente_completo === codigo || 
    e.numero_expediente === codigo
  );

  if (!expediente) throw new Error("Expediente no encontrado");

  return respuestaExito(expediente);
}

function obtenerExpedientePorId(id) {
  if (!id) throw new Error("ID requerido");

  const datos = getSheetData(CONFIG.SHEETS.expedientes);
  const expediente = datos.find(e => e.id_expediente === id);

  if (!expediente) throw new Error("Expediente no encontrado");

  return respuestaExito(expediente);
}

function buscarExpedientes(params) {
  let datos = getSheetData(CONFIG.SHEETS.expedientes);

  // Filtro por número
  if (params.numero) {
    datos = datos.filter(e => 
      e.numero_expediente?.toString().includes(params.numero)
    );
  }

  // Filtro por juzgado
  if (params.id_juzgado) {
    datos = datos.filter(e => e.id_juzgado === params.id_juzgado);
  }

  // Filtro por estado
  if (params.id_estado) {
    datos = datos.filter(e => e.id_estado === params.id_estado);
  }

  // Filtro por materia
  if (params.codigo_materia) {
    datos = datos.filter(e => e.codigo_materia === params.codigo_materia);
  }

  // Filtro por ubicación
  if (params.id_ubicacion_actual) {
    datos = datos.filter(e => e.id_ubicacion_actual === params.id_ubicacion_actual);
  }

  // Filtro activos
  if (params.activo) {
    datos = datos.filter(e => e.activo === "SI");
  }

  return respuestaExito(datos, `${datos.length} expedientes encontrados`);
}

// ============================================================================
// MOVIMIENTOS
// ============================================================================

function registrarMovimiento(data) {
  // Validaciones
  if (!data.id_expediente) throw new Error("ID expediente requerido");
  if (!data.tipo_movimiento) throw new Error("Tipo de movimiento requerido");

  const sheet = getSheet(CONFIG.SHEETS.movimientos_expediente);
  const headers = getHeaders(sheet);

  // Preparar fila
  const fila = headers.map(header => {
    switch (header) {
      case "id_movimiento":
        return generarID("MOV");
      case "id_expediente":
        return data.id_expediente;
      case "tipo_movimiento":
        return data.tipo_movimiento;
      case "ubicacion_origen":
        return data.ubicacion_origen || "";
      case "ubicacion_destino":
        return data.ubicacion_destino || "";
      case "estado_anterior":
        return data.estado_anterior || "";
      case "estado_nuevo":
        return data.estado_nuevo || "";
      case "fecha_movimiento":
        return data.fecha_movimiento || new Date();
      case "hora_movimiento":
        return data.hora_movimiento || new Date().toLocaleTimeString();
      case "fecha_hora_movimiento":
        return new Date();
      case "motivo":
        return data.motivo || "";
      case "observacion":
        return data.observacion || "";
      case "realizado_por":
        return data.realizado_por || "";
      case "destino_externo":
        return data.destino_externo || "";
      case "activo":
        return "SI";
      default:
        return "";
    }
  });

  sheet.appendRow(fila);
  
  const movimientoCreado = mapRowToObject(fila, headers);
  return respuestaExito(movimientoCreado, "Movimiento registrado exitosamente");
}

function registrarMovimientoInterno(data) {
  // Función interna para registrar movimientos sin devolver respuesta HTTP
  try {
    const sheet = getSheet(CONFIG.SHEETS.movimientos_expediente);
    const headers = getHeaders(sheet);

    const fila = headers.map(header => {
      switch (header) {
        case "id_movimiento":
          return generarID("MOV");
        case "id_expediente":
          return data.id_expediente;
        case "tipo_movimiento":
          return data.tipo_movimiento;
        case "ubicacion_origen":
          return data.ubicacion_origen || "";
        case "ubicacion_destino":
          return data.ubicacion_destino || "";
        case "estado_anterior":
          return data.estado_anterior || "";
        case "estado_nuevo":
          return data.estado_nuevo || "";
        case "fecha_movimiento":
          return new Date();
        case "hora_movimiento":
          return new Date().toLocaleTimeString();
        case "fecha_hora_movimiento":
          return new Date();
        case "motivo":
          return data.motivo || "";
        case "observacion":
          return data.observacion || "";
        case "realizado_por":
          return "SISTEMA";
        case "destino_externo":
          return "";
        case "activo":
          return "SI";
        default:
          return "";
      }
    });

    sheet.appendRow(fila);
  } catch (e) {
    // Log silencioso de errores internos
    console.error("Error al registrar movimiento interno:", e);
  }
}

function listarMovimientosPorExpediente(expedienteId) {
  if (!expedienteId) throw new Error("ID expediente requerido");

  let datos = getSheetData(CONFIG.SHEETS.movimientos_expediente);
  datos = datos.filter(m => m.id_expediente === expedienteId);

  return respuestaExito(datos, `${datos.length} movimientos encontrados`);
}

// ============================================================================
// DATOS MAESTROS (READ-ONLY)
// ============================================================================

function listarJuzgados() {
  const datos = getSheetData(CONFIG.SHEETS.juzgados);
  const activos = datos.filter(j => j.activo === "SI");
  return respuestaExito(activos, `${activos.length} juzgados encontrados`);
}

function listarMaterias() {
  const datos = getSheetData(CONFIG.SHEETS.materias);
  const activas = datos.filter(m => m.activo === "SI");
  return respuestaExito(activas, `${activas.length} materias encontradas`);
}

function listarUbicaciones() {
  const datos = getSheetData(CONFIG.SHEETS.ubicaciones);
  const activas = datos.filter(u => u.activo === "SI");
  return respuestaExito(activas, `${activas.length} ubicaciones encontradas`);
}

function listarEstados() {
  const datos = getSheetData(CONFIG.SHEETS.estados_expediente);
  const activos = datos.filter(e => e.activo === "SI");
  return respuestaExito(activos, `${activos.length} estados encontrados`);
}
