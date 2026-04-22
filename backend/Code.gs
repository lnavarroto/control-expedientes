const SHEET_NAME = "usuarios";
const SHEET_MATERIAS = "materias";
const SHEET_JUZGADOS = "juzgados";
const SHEET_ESTADOS = "estados";
const SHEET_ESTADOS_SISTEMA = "estados_sistema_expediente";
const SHEET_PAQUETES = "paquetes";
const SHEET_EXPEDIENTES = "expedientes";
const SHEET_SEGUIMIENTO = "seguimiento_expediente";
const SHEET_PAQUETES_ARCHIVO = "paquetes_archivo";
const SHEET_PAQUETE_EXPEDIENTE = "paquete_expediente";
const SHEET_COLOR_ESPECIALISTA = "color_especialista";
const SHEET_MOVIMIENTOS = "movimientos_expediente";

// =========================
// TIMEZONE GLOBAL
// =========================
const TIMEZONE = Session.getScriptTimeZone();

// =========================
// ENTRY POINTS
// =========================

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = data.action;
    let resultado;

    switch (action) {
      case "crear_usuario":               resultado = crearUsuario(data); break;
      case "login_usuario":               resultado = loginUsuario(data); break;
      case "registrar_expediente":        resultado = registrarExpediente(data); break;
      case "actualizar_expediente":       resultado = actualizarExpediente(data); break;
      case "crear_paquete_archivo":       resultado = crearPaqueteArchivo(data); break;
      case "crear_paquete":               resultado = crearPaquete(data); break;
      case "asignar_expediente_paquete":  resultado = asignarExpedienteAPaquete(data); break;
      case "asignar_expedientes_paquete_lote": resultado = asignarExpedientesAPaqueteLote(data); break;
      case "asignar_color_especialista":  resultado = asignarColorEspecialista(data); break;
      case "desasignar_expediente_paquete": resultado = desasignarExpedienteDePaquete(data); break;
      default: resultado = { success: false, error: "Acción POST no válida" }; break;
    }

    return jsonResponse(resultado);
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

function doGet(e) {
  try {
    const action   = (e && e.parameter && e.parameter.action)   || "";
    const callback = (e && e.parameter && e.parameter.callback) || "";
    let resultado;

    switch (action) {
      case "listar_usuarios":               resultado = listarUsuarios(); break;
      case "obtener_usuario_por_dni":       resultado = obtenerUsuarioPorDni(e.parameter.dni || ""); break;
      case "listar_materias_activas":       resultado = listarMateriasActivas(); break;
      case "listar_juzgados_activos":       resultado = listarJuzgadosActivos(); break;
      case "listar_estados_activos":        resultado = listarEstadosActivos(); break;
      case "listar_estados_sistema_activos": resultado = listarEstadosSistemaActivos(); break;
      case "listar_especialistas_activos":  resultado = listarEspecialistasActivosDesdeUsuarios(); break;
      case "listar_paquetes_archivo_con_expedientes": resultado = listarPaquetesArchivoConExpedientes(); break;
      case "listar_asistentes_activos":     resultado = listarAsistentesActivosDesdeUsuarios(); break;
      case "listar_responsables_activos":   resultado = listarResponsablesActivos(); break;
      case "listar_paquetes_activos":       resultado = listarPaquetesActivos(); break;
      case "listar_expedientes":            resultado = listarExpedientes(); break;
      case "obtener_expediente_por_codigo":
        resultado = obtenerExpedientePorCodigo(e.parameter.codigo || e.parameter.codigo_expediente_completo);
        break;
      case "sugerir_paquete_para_expediente":
        resultado = sugerirPaqueteParaExpediente(
          e.parameter.codigo_expediente_completo || "",
          e.parameter.id_usuario_especialista || ""
        );
        break;
      case "listar_paquetes_archivo":       resultado = listarPaquetesArchivo(); break;
      case "listar_expedientes_por_paquete":
        resultado = listarExpedientesPorPaquete(e.parameter.id_paquete_archivo || "");
        break;
      default: resultado = { success: false, error: "Acción GET no válida" };
    }

    if (callback) {
      return ContentService
        .createTextOutput(callback + "(" + JSON.stringify(resultado) + ");")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return jsonResponse(resultado);

  } catch (error) {
    const resultado = { success: false, error: error.message };
    const callback  = (e && e.parameter && e.parameter.callback) || "";
    if (callback) {
      return ContentService
        .createTextOutput(callback + "(" + JSON.stringify(resultado) + ");")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return jsonResponse(resultado);
  }
}

// =========================
// LOCK
// =========================
function ejecutarConLock(fn, tiempoEsperaMs) {
  tiempoEsperaMs = tiempoEsperaMs || 15000;
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(tiempoEsperaMs);
  } catch (e) {
    return { success: false, error: "El sistema está ocupado. Intente nuevamente." };
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// =========================
// USUARIOS
// =========================
function crearUsuario(data) {
  return ejecutarConLock(function () {
    const sheet = getSheet(SHEET_NAME);

    const dni            = String(data.dni            || "").trim();
    const nombres        = String(data.nombres        || "").trim();
    const apellidos      = String(data.apellidos      || "").trim();
    const correo         = String(data.correo         || "").trim();
    const telefono       = String(data.telefono       || "").trim();
    const cargo          = String(data.cargo          || "").trim();
    const area_modulo    = String(data.area_modulo    || "").trim();
    const id_rol         = String(data.id_rol         || "").trim();
    const acceso_sistema = String(data.acceso_sistema || "NO").trim();

    if (!dni || !nombres || !apellidos || !id_rol) {
      return { success: false, error: "Faltan campos obligatorios" };
    }
    if (!/^\d{8}$/.test(dni)) {
      return { success: false, error: "El DNI debe tener 8 dígitos" };
    }

    const existe = buscarFilaPorCampo(sheet, "dni", dni);
    if (existe) return { success: false, error: "Ya existe un usuario con ese DNI" };

    const ahora               = new Date();
    const fecha_creacion      = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const fecha_actualizacion = fecha_creacion;

    const fila = buildRowFromHeaders(sheet, {
      id_usuario: generarID(sheet, "USR"),
      dni, nombres, apellidos, correo, telefono, cargo, area_modulo, id_rol,
      activo: "SI",
      acceso_sistema: acceso_sistema || "NO",
      fecha_creacion, fecha_actualizacion
    });

    sheet.appendRow(fila);
    return { success: true, message: "Usuario creado correctamente" };
  });
}

function loginUsuario(data) {
  const dni = String(data.dni || "").trim();
  if (!dni) return { success: false, error: "Debe ingresar el DNI" };
  if (!/^\d{8}$/.test(dni)) return { success: false, error: "El DNI debe tener 8 dígitos" };

  const resultado = obtenerUsuarioPorDni(dni);
  if (!resultado.success) return { success: false, error: "Usuario no encontrado" };

  const usuario = resultado.data;
  if (!esActivo(usuario.activo))          return { success: false, error: "Usuario inactivo" };
  if (!esActivo(usuario.acceso_sistema))  return { success: false, error: "Usuario sin acceso al sistema" };

  return {
    success: true,
    message: "Login correcto",
    data: {
      id_usuario: usuario.id_usuario, dni: usuario.dni,
      nombres: usuario.nombres, apellidos: usuario.apellidos,
      correo: usuario.correo, telefono: usuario.telefono,
      cargo: usuario.cargo, area_modulo: usuario.area_modulo,
      id_rol: usuario.id_rol, activo: usuario.activo,
      acceso_sistema: usuario.acceso_sistema
    }
  };
}

function listarUsuarios() {
  const sheet = getSheet(SHEET_NAME);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const headers = data[0];
  const rows    = data.slice(1).filter(row => row.some(cell => cell !== ""));
  return { success: true, data: rows.map(row => mapRowToObject(headers, row)) };
}

function obtenerUsuarioPorDni(dni) {
  const sheet = getSheet(SHEET_NAME);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, error: "No hay usuarios registrados" };
  const headers = data[0];
  const rows    = data.slice(1).filter(row => row.some(cell => cell !== ""));
  const usuario = rows.map(row => mapRowToObject(headers, row))
    .find(item => String(item.dni || "").trim() === String(dni || "").trim());
  if (!usuario) return { success: false, error: "Usuario no encontrado" };
  return { success: true, data: usuario };
}

// =========================
// MATERIAS
// =========================
function listarMateriasActivas() {
  const sheet = getSheet(SHEET_MATERIAS);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const headers = data[0];
  const rows    = data.slice(1).filter(row => row.some(cell => cell !== ""));
  const resultado = rows.map(row => mapRowToObject(headers, row))
    .filter(item => esActivo(item.activo))
    .sort((a, b) => String(a.nombre_materia || "").localeCompare(String(b.nombre_materia || "")));
  return { success: true, data: resultado };
}

// =========================
// JUZGADOS
// =========================
function listarJuzgadosActivos() {
  const sheet = getSheet(SHEET_JUZGADOS);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const headers = data[0];
  const rows    = data.slice(1).filter(row => row.some(cell => cell !== ""));
  const resultado = rows.map(row => mapRowToObject(headers, row))
    .filter(item => esActivo(item.activo))
    .sort((a, b) => String(a.nombre_juzgado || "").localeCompare(String(b.nombre_juzgado || "")));
  return { success: true, data: resultado };
}

// =========================
// ESTADOS
// =========================
function listarEstadosActivos() {
  const sheet = getSheet(SHEET_ESTADOS);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const headers = data[0];
  const rows    = data.slice(1).filter(row => row.some(cell => cell !== ""));
  const resultado = rows.map(row => mapRowToObject(headers, row))
    .filter(item => esActivo(item.activo))
    .sort((a, b) => Number(a.id_estado || 0) - Number(b.id_estado || 0));
  return { success: true, data: resultado };
}

function listarEstadosSistemaActivos() {
  return listarActivosPorHoja(SHEET_ESTADOS_SISTEMA, function(a, b) {
    return Number(a.id_estado_sistema || 0) - Number(b.id_estado_sistema || 0);
  });
}

// =========================
// ESPECIALISTAS / ASISTENTES / RESPONSABLES
// =========================
function listarEspecialistasActivosDesdeUsuarios() {
  return _listarUsuariosPorRol("ROL0005");
}

function listarAsistentesActivosDesdeUsuarios() {
  return _listarUsuariosPorRol("ROL0006");
}

function listarResponsablesActivos() {
  return _listarUsuariosPorRol(["ROL0005", "ROL0006"]);
}

function _listarUsuariosPorRol(roles) {
  const sheet = getSheet(SHEET_NAME);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const headers      = data[0];
  const rows         = data.slice(1).filter(row => row.some(cell => cell !== ""));
  const rolesArray   = Array.isArray(roles) ? roles : [roles];
  const resultado    = rows.map(row => mapRowToObject(headers, row))
    .filter(item =>
      esActivo(item.activo) &&
      rolesArray.includes(String(item.id_rol || "").trim().toUpperCase())
    )
    .map(item => {
      item.nombre_completo = [String(item.nombres || "").trim(), String(item.apellidos || "").trim()]
        .filter(Boolean).join(" ");
      return item;
    })
    .sort((a, b) => String(a.nombre_completo || "").localeCompare(String(b.nombre_completo || "")));
  return { success: true, data: resultado };
}

// =========================
// PAQUETES
// =========================
function listarPaquetesActivos() {
  const sheet = getSheet(SHEET_PAQUETES);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const headers = data[0];
  const rows    = data.slice(1).filter(row => row.some(cell => cell !== ""));
  const resultado = rows.map(row => mapRowToObject(headers, row))
    .filter(item => esActivo(item.activo))
    .sort((a, b) => Number(a.id_paquete || 0) - Number(b.id_paquete || 0));
  return { success: true, data: resultado };
}

function crearPaquete(data) {
  return ejecutarConLock(function () {
    const sheet  = getSheet(SHEET_PAQUETES);
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return { success: false, error: "La hoja paquetes no tiene estructura válida" };

    const headers        = values[0];
    const rows           = values.slice(1).filter(row => row.some(cell => cell !== ""));
    const codigo_paquete = String(data.codigo_paquete || data.codigo || "").trim().toUpperCase();
    const nombre_paquete = String(data.nombre_paquete || data.nombre || "").trim();
    const descripcion    = String(data.descripcion    || "").trim();
    const activo         = String(data.activo || "SI").trim().toUpperCase() === "NO" ? "NO" : "SI";

    if (!codigo_paquete || !nombre_paquete || !descripcion) {
      return { success: false, error: "Faltan campos obligatorios: codigo_paquete, nombre_paquete, descripcion" };
    }

    const existeCodigo = rows.map(row => mapRowToObject(headers, row))
      .some(item => String(item.codigo_paquete || "").trim().toUpperCase() === codigo_paquete);
    if (existeCodigo) return { success: false, error: "Ya existe un paquete con ese código" };

    const idColIndex = headers.indexOf("id_paquete");
    let siguienteId  = 1;
    if (idColIndex !== -1) {
      const maxId = rows.reduce(function(acc, row) {
        const n = Number(String(row[idColIndex] || "").trim());
        return Number.isFinite(n) ? Math.max(acc, n) : acc;
      }, 0);
      siguienteId = maxId + 1;
    }

    const ahora               = new Date();
    const fecha_creacion      = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const fecha_actualizacion = fecha_creacion;
    const estado_paquete      = activo === "SI" ? "ACTIVO" : "INACTIVO";

    sheet.appendRow(buildRowFromHeaders(sheet, {
      id_paquete: siguienteId, codigo_paquete, nombre_paquete, descripcion,
      estado_paquete, activo, fecha_creacion, fecha_actualizacion
    }));

    return {
      success: true, message: "Paquete creado correctamente",
      data: { id_paquete: siguienteId, codigo_paquete, nombre_paquete, descripcion, estado_paquete, activo, fecha_creacion, fecha_actualizacion }
    };
  });
}

// =========================
// EXPEDIENTES
// =========================
function registrarExpediente(data) {
  return ejecutarConLock(function () {
    const sheet = getSheet(SHEET_EXPEDIENTES);

    const numero_expediente_raw = String(data.numero_expediente || "").trim();
    const esCodCompleto         = numero_expediente_raw.includes("-");
    const numero_expediente     = formatearNumeroExpediente(numero_expediente_raw);
    const anio                  = String(data.anio           || "").trim();
    const incidente             = String(data.incidente      || "").trim();
    const codigo_corte          = String(data.codigo_corte   || "").trim();
    const tipo_organo           = String(data.tipo_organo    || "").trim();
    const codigo_materia        = String(data.codigo_materia || "").trim();
    const id_juzgado            = String(data.id_juzgado     || "").trim();
    const juzgado_texto         = String(data.juzgado_texto  || "").trim();
    const observaciones         = String(data.observaciones  || "").trim();
    const origen_registro       = String(data.origen_registro || "SISTEMA").trim();
    const dni_usuario           = String(data.dni_usuario      || "").trim();
    const nombres_usuario       = String(data.nombres_usuario  || "").trim();
    const apellidos_usuario     = String(data.apellidos_usuario || "").trim();

    if (!numero_expediente_raw || !anio || !incidente || !codigo_corte ||
        !tipo_organo || !codigo_materia || !id_juzgado || !juzgado_texto ||
        !dni_usuario || !nombres_usuario) {
      return { success: false, error: "Faltan campos obligatorios para registrar el expediente" };
    }

    const codigo_expediente_completo =
      String(data.codigo_expediente_completo || "").trim() ||
      (esCodCompleto ? numero_expediente_raw : "") ||
      construirCodigoExpediente(numero_expediente, anio, incidente, codigo_corte, tipo_organo, codigo_materia, id_juzgado);

    const existePorCodigo = buscarFilaPorCampo(sheet, "codigo_expediente_completo", codigo_expediente_completo);
    if (existePorCodigo) {
      return { success: false, error: "Ya existe un expediente con el código: " + codigo_expediente_completo };
    }

    const estadoRegistrado = obtenerEstadoRegistrado();
    if (!estadoRegistrado.success) return estadoRegistrado;

    const ahora               = new Date();
    const fecha_ingreso       = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd");
    const hora_ingreso        = Utilities.formatDate(ahora, TIMEZONE, "HH:mm:ss");
    const fecha_hora_ingreso  = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const fecha_creacion      = fecha_hora_ingreso;
    const fecha_actualizacion = fecha_hora_ingreso;

    const registrado_por = `${dni_usuario} - ${[nombres_usuario, apellidos_usuario].filter(Boolean).join(" ").trim()}`;

    sheet.appendRow(buildRowFromHeaders(sheet, {
      id_expediente:              generarID(sheet, "EXP"),
      codigo_expediente_completo, numero_expediente,
      anio, incidente, codigo_corte, tipo_organo, codigo_materia,
      id_juzgado, juzgado_texto,
      fecha_ingreso, hora_ingreso, fecha_hora_ingreso,
      id_ubicacion_actual: "", ubicacion_texto: "", id_paquete: "",
      id_estado:           estadoRegistrado.data.id_estado,
      observaciones, origen_registro, registrado_por,
      activo: "SI", fecha_creacion, fecha_actualizacion
    }));

    return {
      success: true, message: "Expediente registrado correctamente",
      data: {
        id_expediente:              generarVistaIdUltimo(sheet, "id_expediente"),
        codigo_expediente_completo, numero_expediente,
        id_estado:                  estadoRegistrado.data.id_estado,
        nombre_estado:              estadoRegistrado.data.nombre_estado,
        registrado_por
      }
    };
  });
}

function listarExpedientes() {
  const sheet = getSheet(SHEET_EXPEDIENTES);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const headers = data[0];
  const rows    = data.slice(1).filter(row => row.some(cell => cell !== ""));
  const resultado = rows.map(row => mapRowToObject(headers, row))
    .sort((a, b) => String(b.fecha_creacion || "").localeCompare(String(a.fecha_creacion || "")));
  return { success: true, data: resultado };
}

function obtenerExpedientePorCodigo(codigo) {
  const sheet = getSheet(SHEET_EXPEDIENTES);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, error: "No hay expedientes registrados" };
  const valorBuscado = String(codigo || "").trim();
  if (!valorBuscado) return { success: false, error: "Debe enviar el código o número del expediente" };
  const headers = data[0];
  const rows    = data.slice(1).filter(row => row.some(cell => cell !== ""));
  const expediente = rows.map(row => mapRowToObject(headers, row))
    .find(item =>
      String(item.codigo_expediente_completo || "").trim() === valorBuscado ||
      String(item.numero_expediente          || "").trim() === valorBuscado
    );
  if (!expediente) return { success: false, error: "Expediente no encontrado" };
  return { success: true, data: expediente };
}

function obtenerEstadoRegistrado() {
  const sheet = getSheet(SHEET_ESTADOS);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, error: "No hay estados registrados" };
  const headers = data[0];
  const rows    = data.slice(1).filter(row => row.some(cell => cell !== ""));
  const estado  = rows.map(row => mapRowToObject(headers, row))
    .find(item => String(item.codigo_estado || "").trim().toUpperCase() === "REG" && esActivo(item.activo));
  if (!estado) return { success: false, error: "No existe un estado activo con código REG" };
  return { success: true, data: estado };
}

// =========================
// ACTUALIZAR EXPEDIENTE - batch
// =========================
function actualizarExpediente(data) {
  return ejecutarConLock(function () {
    const sheet  = getSheet(SHEET_EXPEDIENTES);
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return { success: false, error: "No hay expedientes registrados" };

    const headers          = values[0];
    const idExpediente     = String(data.id_expediente              || "").trim();
    const codigoExpediente = String(data.codigo_expediente_completo || "").trim();

    if (!idExpediente && !codigoExpediente) {
      return { success: false, error: "Debe enviar id_expediente o codigo_expediente_completo" };
    }

    const colIdExp     = headers.indexOf("id_expediente");
    const colCodExp    = headers.indexOf("codigo_expediente_completo");
    if (colIdExp === -1 || colCodExp === -1) {
      return { success: false, error: "No existen las columnas clave del expediente" };
    }

    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      const filaId     = String(values[i][colIdExp]  || "").trim();
      const filaCodigo = String(values[i][colCodExp] || "").trim();
      if ((idExpediente && filaId === idExpediente) || (codigoExpediente && filaCodigo === codigoExpediente)) {
        rowIndex = i + 1;
        break;
      }
    }
    if (rowIndex === -1) return { success: false, error: "Expediente no encontrado" };

    const camposPermitidos = ["id_ubicacion_actual", "ubicacion_texto", "id_paquete", "id_estado", "observaciones"];
    let seActualizoAlgo    = false;

    // Leer fila completa, modificar en memoria, escribir una sola vez
    const filaActual = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];

    camposPermitidos.forEach(function(campo) {
      const colIndex = headers.indexOf(campo);
      if (colIndex === -1) return;
      if (Object.prototype.hasOwnProperty.call(data, campo)) {
        filaActual[colIndex] = data[campo] === null ? "" : data[campo];
        seActualizoAlgo = true;
      }
    });

    if (!seActualizoAlgo) return { success: false, error: "No se enviaron campos válidos para actualizar" };

    const colFechaAct = headers.indexOf("fecha_actualizacion");
    if (colFechaAct !== -1) {
      filaActual[colFechaAct] = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    }

    sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).setValues([filaActual]);

    const expedienteActualizado = mapRowToObject(headers, filaActual);
    registrarSeguimientoDesdeActualizacion(expedienteActualizado, data);

    return { success: true, message: "Expediente actualizado correctamente", data: expedienteActualizado };
  });
}

function registrarSeguimientoDesdeActualizacion(expediente, data) {
  const sheet = getSheet(SHEET_SEGUIMIENTO);
  const ahora = new Date();
  const fecha_registro      = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  const fecha_actualizacion = fecha_registro;
  const usuarioRegistra     = String(data.usuario_registra || data.registrado_por || "").trim();

  const fila = buildRowFromHeaders(sheet, {
    id_seguimiento:         generarID(sheet, "SEG"),
    id_expediente:          expediente.id_expediente || "",
    id_estado:              Object.prototype.hasOwnProperty.call(data, "id_estado")              ? (data.id_estado              === null ? "" : data.id_estado)              : "",
    id_estado_sistema:      Object.prototype.hasOwnProperty.call(data, "id_estado_sistema")      ? (data.id_estado_sistema      === null ? "" : data.id_estado_sistema)      : "",
    id_usuario_responsable: Object.prototype.hasOwnProperty.call(data, "id_usuario_responsable") ? (data.id_usuario_responsable === null ? "" : data.id_usuario_responsable) : "",
    observacion:            Object.prototype.hasOwnProperty.call(data, "observacion")            ? (data.observacion            === null ? "" : data.observacion)            : (data.observaciones || ""),
    fecha_registro,
    fecha_actualizacion,
    usuario_registra: usuarioRegistra,
    activo: "SI"
  });

  sheet.appendRow(fila);
}

// =========================
// PAQUETES ARCHIVO
// =========================
function crearPaqueteArchivo(data) {
  return ejecutarConLock(function () {
    const sheet = getSheet(SHEET_PAQUETES_ARCHIVO);

    const anio               = String(data.anio               || "").trim();
    const id_materia         = String(data.id_materia         || "").trim();
    const color_especialista = String(data.color_especialista || "").trim().toUpperCase();
    const descripcion        = String(data.descripcion        || "").trim();

    let id_paquete = String(data.id_paquete || "").trim();
    if (/^\d+$/.test(id_paquete)) id_paquete = "PQT" + id_paquete;

    if (!anio || !id_materia || !id_paquete) {
      return { success: false, error: "Faltan campos obligatorios: anio, id_materia, id_paquete" };
    }

    const sheetPaq   = getSheet(SHEET_PAQUETES);
    const dataPaq    = sheetPaq.getDataRange().getValues();
    const headersPaq = dataPaq[0];
    const rowsPaq    = dataPaq.slice(1).filter(r => r.some(c => c !== ""));

    const paqueteValido = rowsPaq.map(row => mapRowToObject(headersPaq, row))
      .find(item => String(item.codigo_paquete || "").trim() === id_paquete && esActivo(item.activo));
    if (!paqueteValido) return { success: false, error: "No existe un paquete activo con código: " + id_paquete };

    const grupo          = String(data.grupo || "").trim() || obtenerSiguienteGrupoPaquete(anio, id_materia, id_paquete);
    const nombreMateria  = obtenerNombreCortoMateria(id_materia);
    const rotulo_paquete = construirRotuloPaquete(anio, nombreMateria, id_paquete, grupo, color_especialista);

    const existe = buscarFilaPorCampo(sheet, "rotulo_paquete", rotulo_paquete);
    if (existe) return { success: false, error: "Ya existe un paquete archivo con ese rótulo: " + rotulo_paquete };

    const ahora               = new Date();
    const fecha_creacion      = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const fecha_actualizacion = fecha_creacion;
    const id_paquete_archivo  = generarID(sheet, "PAQ");

    sheet.appendRow(buildRowFromHeaders(sheet, {
      id_paquete_archivo, anio, id_materia, id_paquete, grupo,
      color_especialista, rotulo_paquete, descripcion,
      activo: "SI", fecha_creacion, fecha_actualizacion
    }));

    return {
      success: true, message: "Paquete archivo creado correctamente",
      data: { id_paquete_archivo, rotulo_paquete, anio, id_materia, id_paquete, grupo, color_especialista }
    };
  });
}

// =========================
// CONSTRUIR RÓTULO - SIN COLOR (formato: 2019-CI-PQT2-G1)
// =========================
function construirRotuloPaquete(anio, nombreMateria, codigo_paquete, grupo, color_especialista) {
  // color_especialista se recibe pero NO se incluye en el rótulo por ahora
  return [anio, nombreMateria, codigo_paquete, grupo].join("-");
}

// =========================
// SUGERIR PAQUETE
// =========================
function sugerirPaqueteParaExpediente(codigoExpediente, idUsuarioEspecialista) {
  if (!codigoExpediente)       return { success: false, error: "Debe enviar el código del expediente" };
  if (!idUsuarioEspecialista)  return { success: false, error: "Debe enviar el id_usuario_especialista" };

  const resultExp = obtenerExpedientePorCodigo(codigoExpediente);
  if (!resultExp.success) return resultExp;

  const expediente        = resultExp.data;
  const anio              = String(expediente.anio || "").trim();
  const id_materia        = normalizarIdMateria(expediente.codigo_materia || expediente.id_materia || "");
  const numero_expediente = Number(extraerNumeroExpedienteBase(expediente.numero_expediente || 0) || 0);

  if (!anio || !id_materia) return { success: false, error: "El expediente no tiene año o materia definidos" };

  const color = obtenerColorEspecialista(idUsuarioEspecialista);
  if (!color) return { success: false, error: "El especialista no tiene color asignado" };

  const numeroPaquete = Math.floor(numero_expediente / 100);
  const id_paquete    = "PQT" + numeroPaquete;

  const sheetPaq   = getSheet(SHEET_PAQUETES);
  const dataPaq    = sheetPaq.getDataRange().getValues();
  const headersPaq = dataPaq[0];
  const rowsPaq    = dataPaq.slice(1).filter(r => r.some(c => c !== ""));

  const paqueteValido = rowsPaq.map(row => mapRowToObject(headersPaq, row))
    .find(item => String(item.codigo_paquete || "").trim() === id_paquete && esActivo(item.activo));
  if (!paqueteValido) return { success: false, error: "No existe un paquete activo para el rango: " + id_paquete };

  const grupoSugerido   = obtenerSiguienteGrupoPaquete(anio, id_materia, id_paquete);
  const nombreMateria   = obtenerNombreCortoMateria(id_materia);
  const rotulo_sugerido = construirRotuloPaquete(anio, nombreMateria, id_paquete, grupoSugerido, color);

  return {
    success: true,
    data: {
      expediente: { id_expediente: expediente.id_expediente, codigo_expediente_completo: expediente.codigo_expediente_completo, numero_expediente, anio, id_materia },
      sugerencia: { anio, id_materia, id_paquete, grupo: grupoSugerido, color_especialista: color, id_usuario_especialista: idUsuarioEspecialista, rotulo_sugerido, debe_crear_paquete: true }
    }
  };
}

function obtenerSiguienteGrupoPaquete(anio, id_materia, id_paquete) {
  const sheet = getSheet(SHEET_PAQUETES_ARCHIVO);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return "G1";
  const headers = data[0];
  const rows    = data.slice(1).filter(r => r.some(c => c !== ""));
  const grupos  = rows.map(row => mapRowToObject(headers, row))
    .filter(item =>
      String(item.anio       || "").trim() === String(anio       || "").trim() &&
      String(item.id_materia || "").trim() === String(id_materia || "").trim() &&
      String(item.id_paquete || "").trim() === String(id_paquete || "").trim() &&
      esActivo(item.activo)
    )
    .map(item => String(item.grupo || "").trim().toUpperCase())
    .filter(g => /^G\d+$/.test(g))
    .map(g => Number(g.replace("G", "")));
  if (grupos.length === 0) return "G1";
  return "G" + (Math.max.apply(null, grupos) + 1);
}

// =========================
// ASIGNAR EXPEDIENTE A PAQUETE
// =========================
function _asignarUnExpediente(data) {
  const sheetPE = getSheet(SHEET_PAQUETE_EXPEDIENTE);

  const id_expediente      = String(data.id_expediente      || "").trim();
  const id_paquete_archivo = String(data.id_paquete_archivo || "").trim();
  const asignado_por       = String(data.asignado_por       || "").trim();

  if (!id_expediente || !id_paquete_archivo || !asignado_por) {
    return { success: false, error: "Faltan campos: id_expediente, id_paquete_archivo, asignado_por" };
  }

  const sheetEXP   = getSheet(SHEET_EXPEDIENTES);
  const dataEXP    = sheetEXP.getDataRange().getValues();
  const headersEXP = dataEXP[0];
  const rowsEXP    = dataEXP.slice(1).filter(r => r.some(c => c !== ""));

  const expediente = rowsEXP.map(row => mapRowToObject(headersEXP, row))
    .find(item => String(item.id_expediente || "").trim() === id_expediente);
  if (!expediente) return { success: false, error: "Expediente no encontrado: " + id_expediente };

  const sheetPA   = getSheet(SHEET_PAQUETES_ARCHIVO);
  const dataPA    = sheetPA.getDataRange().getValues();
  const headersPA = dataPA[0];
  const rowsPA    = dataPA.slice(1).filter(r => r.some(c => c !== ""));

  const paqueteArchivo = rowsPA.map(row => mapRowToObject(headersPA, row))
    .find(item => String(item.id_paquete_archivo || "").trim() === id_paquete_archivo && esActivo(item.activo));
  if (!paqueteArchivo) return { success: false, error: "Paquete archivo no encontrado o inactivo: " + id_paquete_archivo };

  if (String(expediente.anio || "").trim() !== String(paqueteArchivo.anio || "").trim()) {
    return { success: false, error: "El año del expediente no coincide con el año del paquete" };
  }

  const materiaExp = normalizarIdMateria(expediente.codigo_materia || expediente.id_materia || "");
  const materiaPaq = normalizarIdMateria(paqueteArchivo.id_materia || paqueteArchivo.codigo_materia || "");
  if (!materiaExp || !materiaPaq) return { success: false, error: "No se pudo determinar la materia" };
  if (materiaExp !== materiaPaq)  return { success: false, error: "La materia del expediente no coincide con la del paquete" };

  const numExp        = Number(extraerNumeroExpedienteBase(expediente.numero_expediente || 0) || 0);
  const paqEsperado   = "PQT" + Math.floor(numExp / 100);
  if (String(paqueteArchivo.id_paquete || "").trim() !== paqEsperado) {
    return { success: false, error: "El expediente no corresponde a ese paquete por rango numérico" };
  }

  const colIdExpEXP = headersEXP.indexOf("id_expediente");
  let rowExpediente = -1;
  for (let i = 1; i < dataEXP.length; i++) {
    if (String(dataEXP[i][colIdExpEXP] || "").trim() === id_expediente) { rowExpediente = i + 1; break; }
  }

  const dataPE    = sheetPE.getDataRange().getValues();
  const headersPE = dataPE[0];
  const colIdExpPE     = headersPE.indexOf("id_expediente");
  const colActivoPE    = headersPE.indexOf("activo");
  const colFechaActPE  = headersPE.indexOf("fecha_actualizacion");
  const colIdPaquetePE = headersPE.indexOf("id_paquete_archivo");
  let rotuloPaqueteAnterior = "";

  if (colIdExpPE !== -1 && colActivoPE !== -1) {
    for (let i = 1; i < dataPE.length; i++) {
      if (String(dataPE[i][colIdExpPE] || "").trim() === id_expediente &&
          String(dataPE[i][colActivoPE] || "").trim().toUpperCase() === "SI") {
        if (colIdPaquetePE !== -1) {
          const idPaqAnt = String(dataPE[i][colIdPaquetePE] || "").trim();
          if (idPaqAnt) {
            const paqAnt = rowsPA.map(row => mapRowToObject(headersPA, row))
              .find(item => String(item.id_paquete_archivo || "").trim() === idPaqAnt);
            if (paqAnt) rotuloPaqueteAnterior = String(paqAnt.rotulo_paquete || "").trim();
          }
        }
        sheetPE.getRange(i + 1, colActivoPE + 1).setValue("NO");
        if (colFechaActPE !== -1) {
          sheetPE.getRange(i + 1, colFechaActPE + 1).setValue(Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss"));
        }
      }
    }
  }

  const ahora                 = new Date();
  const ahoraStr              = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  const id_paquete_expediente = generarID(sheetPE, "PEXP");

  sheetPE.appendRow(buildRowFromHeaders(sheetPE, {
    id_paquete_expediente, id_paquete_archivo, id_expediente,
    fecha_asignacion: ahoraStr, asignado_por,
    estado_asignacion: "ASIGNADO", fecha_estado: ahoraStr, activo: "SI"
  }));

  const colIdPaqEXP = headersEXP.indexOf("id_paquete");
  if (colIdPaqEXP !== -1 && rowExpediente !== -1) {
    const filaEXP = sheetEXP.getRange(rowExpediente, 1, 1, sheetEXP.getLastColumn()).getValues()[0];
    filaEXP[colIdPaqEXP] = id_paquete_archivo;
    const colFechaActEXP = headersEXP.indexOf("fecha_actualizacion");
    if (colFechaActEXP !== -1) filaEXP[colFechaActEXP] = ahoraStr;
    sheetEXP.getRange(rowExpediente, 1, 1, sheetEXP.getLastColumn()).setValues([filaEXP]);
  }

  registrarMovimientoExpediente({
    id_expediente,
    tipo_movimiento:   rotuloPaqueteAnterior ? "REASIGNACION_PAQUETE" : "ASIGNACION_PAQUETE",
    ubicacion_origen:  rotuloPaqueteAnterior,
    ubicacion_destino: paqueteArchivo.rotulo_paquete || "",
    estado_anterior:   String(expediente.id_estado || "").trim(),
    estado_nuevo:      String(expediente.id_estado || "").trim(),
    motivo:            rotuloPaqueteAnterior ? "Reasignación a nuevo paquete archivo" : "Asignación inicial a paquete archivo",
    observacion:       String(data.observacion || "").trim(),
    realizado_por:     asignado_por,
    destino_externo:   ""
  });

  return {
    success: true, message: "Expediente asignado correctamente al paquete",
    data: { id_paquete_expediente, id_expediente, id_paquete_archivo, rotulo_paquete: paqueteArchivo.rotulo_paquete, fecha_asignacion: ahoraStr, asignado_por }
  };
}

function asignarExpedienteAPaquete(data) {
  return ejecutarConLock(function () { return _asignarUnExpediente(data); });
}

function asignarExpedientesAPaqueteLote(data) {
  return ejecutarConLock(function () {
    const ids                = data.ids_expedientes;
    const id_paquete_archivo = String(data.id_paquete_archivo || "").trim();
    const asignado_por       = String(data.asignado_por       || "").trim();

    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, error: "Debe enviar ids_expedientes como array" };
    }

    const resultados = ids.map(function(id) {
      const res = _asignarUnExpediente({ id_expediente: id, id_paquete_archivo, asignado_por });
      return { id_expediente: id, success: res.success, mensaje: res.success ? res.message : res.error };
    });

    const exitosos = resultados.filter(r => r.success).length;
    return { success: true, message: `${exitosos} de ${ids.length} expedientes asignados correctamente`, data: resultados };
  });
}

// =========================
// DESASIGNAR EXPEDIENTE
// =========================
function desasignarExpedienteDePaquete(data) {
  return ejecutarConLock(function () {
    const sheetPE  = getSheet(SHEET_PAQUETE_EXPEDIENTE);
    const sheetEXP = getSheet(SHEET_EXPEDIENTES);

    const id_expediente   = String(data.id_expediente   || "").trim();
    const desasignado_por = String(data.desasignado_por || "").trim();
    const observacion     = String(data.observacion     || "").trim();

    if (!id_expediente || !desasignado_por) {
      return { success: false, error: "Faltan campos: id_expediente, desasignado_por" };
    }

    const dataPE = sheetPE.getDataRange().getValues();
    if (dataPE.length <= 1) return { success: false, error: "No hay asignaciones registradas" };

    const headersPE        = dataPE[0];
    const colIdExpPE       = headersPE.indexOf("id_expediente");
    const colActivoPE      = headersPE.indexOf("activo");
    const colFechaActPE    = headersPE.indexOf("fecha_actualizacion");
    const colEstadoPE      = headersPE.indexOf("estado_asignacion");
    const colFechaEstPE    = headersPE.indexOf("fecha_estado");
    const colObsPE         = headersPE.indexOf("observacion_estado");

    let encontrada = false;
    const ahoraStr = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");

    for (let i = 1; i < dataPE.length; i++) {
      if (String(dataPE[i][colIdExpPE]  || "").trim() === id_expediente &&
          String(dataPE[i][colActivoPE] || "").trim().toUpperCase() === "SI") {
        sheetPE.getRange(i + 1, colActivoPE + 1).setValue("NO");
        if (colEstadoPE  !== -1) sheetPE.getRange(i + 1, colEstadoPE  + 1).setValue("DISPONIBLE");
        if (colFechaEstPE !== -1) sheetPE.getRange(i + 1, colFechaEstPE + 1).setValue(ahoraStr);
        if (colObsPE     !== -1) sheetPE.getRange(i + 1, colObsPE     + 1).setValue(observacion);
        if (colFechaActPE !== -1) sheetPE.getRange(i + 1, colFechaActPE + 1).setValue(ahoraStr);
        encontrada = true;
      }
    }

    if (!encontrada) return { success: false, error: "El expediente no tiene una asignación activa" };

    const dataEXP    = sheetEXP.getDataRange().getValues();
    const headersEXP = dataEXP[0];
    const colIdExp   = headersEXP.indexOf("id_expediente");
    const colIdPaq   = headersEXP.indexOf("id_paquete");
    const colUbi     = headersEXP.indexOf("id_ubicacion_actual");
    const colUbiTxt  = headersEXP.indexOf("ubicacion_texto");
    const colFecAct  = headersEXP.indexOf("fecha_actualizacion");

    for (let i = 1; i < dataEXP.length; i++) {
      if (String(dataEXP[i][colIdExp] || "").trim() === id_expediente) {
        const fila = sheetEXP.getRange(i + 1, 1, 1, sheetEXP.getLastColumn()).getValues()[0];
        if (colIdPaq  !== -1) fila[colIdPaq]  = "";
        if (colUbi    !== -1) fila[colUbi]    = "";
        if (colUbiTxt !== -1) fila[colUbiTxt] = "";
        if (colFecAct !== -1) fila[colFecAct] = ahoraStr;
        sheetEXP.getRange(i + 1, 1, 1, sheetEXP.getLastColumn()).setValues([fila]);
        break;
      }
    }

    return {
      success: true, message: "Expediente desasignado correctamente",
      data: { id_expediente, estado_asignacion: "DISPONIBLE", desasignado_por, fecha_estado: ahoraStr }
    };
  });
}

// =========================
// LISTAR PAQUETES ARCHIVO
// =========================
function listarPaquetesArchivo() {
  const sheet = getSheet(SHEET_PAQUETES_ARCHIVO);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const headers = data[0];
  const rows    = data.slice(1).filter(r => r.some(c => c !== ""));
  const resultado = rows.map(row => mapRowToObject(headers, row))
    .filter(item => esActivo(item.activo))
    .sort((a, b) => String(a.rotulo_paquete || "").localeCompare(String(b.rotulo_paquete || "")));
  return { success: true, data: resultado };
}

function listarPaquetesArchivoConExpedientes() {
  const sheetPA   = getSheet(SHEET_PAQUETES_ARCHIVO);
  const dataPA    = sheetPA.getDataRange().getValues();
  const headersPA = dataPA[0];
  const rowsPA    = dataPA.slice(1).filter(r => r.some(c => c !== ""));
  const paquetes  = rowsPA.map(row => mapRowToObject(headersPA, row)).filter(item => esActivo(item.activo));
  if (paquetes.length === 0) return { success: true, data: [] };

  const sheetPE   = getSheet(SHEET_PAQUETE_EXPEDIENTE);
  const dataPE    = sheetPE.getDataRange().getValues();
  const headersPE = dataPE[0];
  const rowsPE    = dataPE.slice(1).filter(r => r.some(c => c !== ""));
  const asignaciones = rowsPE.map(row => mapRowToObject(headersPE, row)).filter(item => esActivo(item.activo));

  const sheetEXP   = getSheet(SHEET_EXPEDIENTES);
  const dataEXP    = sheetEXP.getDataRange().getValues();
  const headersEXP = dataEXP[0];
  const rowsEXP    = dataEXP.slice(1).filter(r => r.some(c => c !== ""));

  const expedientesMap = {};
  rowsEXP.forEach(row => {
    const obj = mapRowToObject(headersEXP, row);
    expedientesMap[String(obj.id_expediente || "").trim()] = obj;
  });

  const asignacionesPorPaquete = {};
  asignaciones.forEach(asig => {
    const idPaq = String(asig.id_paquete_archivo || "").trim();
    if (!asignacionesPorPaquete[idPaq]) asignacionesPorPaquete[idPaq] = [];
    asignacionesPorPaquete[idPaq].push({
      ...asig,
      expediente: expedientesMap[String(asig.id_expediente || "").trim()] || null
    });
  });

  return {
    success: true,
    data: paquetes.map(paquete => ({
      ...paquete,
      expedientes: asignacionesPorPaquete[String(paquete.id_paquete_archivo || "").trim()] || []
    }))
  };
}

function listarExpedientesPorPaquete(id_paquete_archivo) {
  if (!id_paquete_archivo) return { success: false, error: "Debe enviar id_paquete_archivo" };

  const sheetPE   = getSheet(SHEET_PAQUETE_EXPEDIENTE);
  const dataPE    = sheetPE.getDataRange().getValues();
  const headersPE = dataPE[0];
  const rowsPE    = dataPE.slice(1).filter(r => r.some(c => c !== ""));

  const asignaciones = rowsPE.map(row => mapRowToObject(headersPE, row))
    .filter(item => String(item.id_paquete_archivo || "").trim() === id_paquete_archivo && esActivo(item.activo));
  if (asignaciones.length === 0) return { success: true, data: [] };

  const sheetEXP   = getSheet(SHEET_EXPEDIENTES);
  const dataEXP    = sheetEXP.getDataRange().getValues();
  const headersEXP = dataEXP[0];
  const rowsEXP    = dataEXP.slice(1).filter(r => r.some(c => c !== ""));

  const expedientesMap = {};
  rowsEXP.forEach(row => {
    const obj = mapRowToObject(headersEXP, row);
    expedientesMap[String(obj.id_expediente || "").trim()] = obj;
  });

  return {
    success: true,
    data: asignaciones.map(asig => ({ ...asig, expediente: expedientesMap[String(asig.id_expediente || "").trim()] || null }))
  };
}

// =========================
// COLOR ESPECIALISTA
// =========================
function asignarColorEspecialista(data) {
  return ejecutarConLock(function () {
    const sheetColor    = getSheet(SHEET_COLOR_ESPECIALISTA);
    const sheetUsuarios = getSheet(SHEET_NAME);

    const id_usuario = String(data.id_usuario || "").trim();
    const color      = String(data.color      || "").trim().toUpperCase();

    if (!id_usuario || !color) return { success: false, error: "Faltan campos obligatorios: id_usuario, color" };

    const dataUsuarios    = sheetUsuarios.getDataRange().getValues();
    if (dataUsuarios.length <= 1) return { success: false, error: "No hay usuarios registrados" };
    const headersUsuarios = dataUsuarios[0];
    const rowsUsuarios    = dataUsuarios.slice(1).filter(r => r.some(c => c !== ""));

    const usuario = rowsUsuarios.map(row => mapRowToObject(headersUsuarios, row))
      .find(item =>
        String(item.id_usuario || "").trim() === id_usuario &&
        String(item.id_rol     || "").trim().toUpperCase() === "ROL0005" &&
        esActivo(item.activo)
      );
    if (!usuario) return { success: false, error: "El usuario no existe o no es un especialista activo" };

    const nombre_especialista = [String(usuario.nombres || "").trim(), String(usuario.apellidos || "").trim()].filter(Boolean).join(" ");
    const yaExiste            = buscarFilaPorCampo(sheetColor, "id_usuario", id_usuario);
    if (yaExiste) return { success: false, error: "Ese especialista ya tiene un color asignado" };

    const ahora               = new Date();
    const fecha_creacion      = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const fecha_actualizacion = fecha_creacion;

    sheetColor.appendRow(buildRowFromHeaders(sheetColor, {
      id_color_especialista: generarID(sheetColor, "COL"),
      id_usuario, nombre_especialista, color,
      activo: "SI", fecha_creacion, fecha_actualizacion
    }));

    return { success: true, message: "Color asignado correctamente al especialista", data: { id_usuario, nombre_especialista, color } };
  });
}

function obtenerColorEspecialista(id_usuario) {
  const sheet = getSheet(SHEET_COLOR_ESPECIALISTA);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;
  const headers = data[0];
  const rows    = data.slice(1).filter(r => r.some(c => c !== ""));
  const registro = rows.map(row => mapRowToObject(headers, row))
    .find(item => String(item.id_usuario || "").trim() === String(id_usuario || "").trim() && esActivo(item.activo));
  if (!registro) return null;
  return String(registro.color || "").trim().toUpperCase();
}

// =========================
// MOVIMIENTOS
// =========================
function registrarMovimientoExpediente(data) {
  const sheet  = getSheet(SHEET_MOVIMIENTOS);
  const ahora  = new Date();
  const ahoraStr = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");

  sheet.appendRow(buildRowFromHeaders(sheet, {
    id_movimiento:         generarID(sheet, "MOV"),
    id_expediente:         String(data.id_expediente       || "").trim(),
    tipo_movimiento:       String(data.tipo_movimiento     || "").trim(),
    ubicacion_origen:      String(data.ubicacion_origen    || "").trim(),
    ubicacion_destino:     String(data.ubicacion_destino   || "").trim(),
    estado_anterior:       String(data.estado_anterior     || "").trim(),
    estado_nuevo:          String(data.estado_nuevo        || "").trim(),
    fecha_movimiento:      Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd"),
    hora_movimiento:       Utilities.formatDate(ahora, TIMEZONE, "HH:mm:ss"),
    fecha_hora_movimiento: ahoraStr,
    motivo:                String(data.motivo              || "").trim(),
    observacion:           String(data.observacion         || "").trim(),
    realizado_por:         String(data.realizado_por       || "").trim(),
    destino_externo:       String(data.destino_externo     || "").trim(),
    activo:                "SI"
  }));
}

// =========================
// AUXILIARES
// =========================
function getSheet(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error("No existe la hoja: " + sheetName);
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function mapRowToObject(headers, row) {
  const obj = {};
  headers.forEach(function(header, index) {
    const value = row[index];
    if (value instanceof Date) {
      const campo = String(header || "").trim();
      if (campo === "fecha_ingreso") {
        obj[header] = Utilities.formatDate(value, TIMEZONE, "yyyy-MM-dd");
      } else if (campo === "hora_ingreso") {
        obj[header] = Utilities.formatDate(value, TIMEZONE, "HH:mm:ss");
      } else {
        obj[header] = Utilities.formatDate(value, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
      }
    } else {
      obj[header] = value;
    }
  });
  return obj;
}

function buscarFilaPorCampo(sheet, campo, valorBuscado) {
  const data    = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;
  const headers  = data[0];
  const colIndex = headers.indexOf(campo);
  if (colIndex === -1) throw new Error("No existe la columna: " + campo);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex] || "").trim() === String(valorBuscado || "").trim()) return i + 1;
  }
  return null;
}

function buildRowFromHeaders(sheet, dataObj) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.map(function(header) { return dataObj[header] !== undefined ? dataObj[header] : ""; });
}

function generarID(sheet, prefijo) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return prefijo + "-0001";
  const headers  = data[0];
  const colIndex = headers.indexOf(headers.find(h => String(h).toLowerCase().startsWith("id_")) || headers[0]);
  if (colIndex === -1) return prefijo + "-" + String(data.length).padStart(4, "0");
  const numerosUsados = data.slice(1)
    .map(row => String(row[colIndex] || ""))
    .filter(id => id.startsWith(prefijo + "-"))
    .map(id => { const n = parseInt(id.replace(prefijo + "-", ""), 10); return isNaN(n) ? 0 : n; });
  const siguiente = numerosUsados.length > 0 ? Math.max.apply(null, numerosUsados) + 1 : 1;
  return prefijo + "-" + String(siguiente).padStart(4, "0");
}

function generarVistaIdUltimo(sheet, campo) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return "";
  const headers  = data[0];
  const colIndex = headers.indexOf(campo);
  if (colIndex === -1) return "";
  return data[data.length - 1][colIndex];
}

function esActivo(valor) {
  const texto = String(valor || "").trim().toUpperCase();
  return texto === "SI" || texto === "TRUE" || texto === "ACTIVO";
}

function listarActivosPorHoja(sheetName, sortFn, transformFn) {
  const sheet = getSheet(sheetName);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const headers = data[0];
  const rows    = data.slice(1).filter(row => row.some(cell => cell !== ""));
  let resultado = rows.map(row => mapRowToObject(headers, row)).filter(item => esActivo(item.activo));
  if (typeof transformFn === "function") resultado = resultado.map(transformFn);
  if (typeof sortFn      === "function") resultado = resultado.sort(sortFn);
  return { success: true, data: resultado };
}

function construirCodigoExpediente(numero_expediente, anio, incidente, codigo_corte, tipo_organo, codigo_materia, id_juzgado) {
  if (String(numero_expediente || "").includes("-")) return String(numero_expediente).trim();
  return [
    String(numero_expediente).padStart(5, "0"),
    anio,
    String(incidente).padStart(1, "0"),
    codigo_corte,
    tipo_organo,
    codigo_materia,
    String(id_juzgado).padStart(2, "0")
  ].join("-");
}

function extraerNumeroExpedienteBase(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  if (texto.includes("-")) {
    const num = parseInt(texto.split("-")[0], 10);
    return isNaN(num) ? "" : num;
  }
  const num = parseInt(texto, 10);
  return isNaN(num) ? "" : num;
}

function formatearNumeroExpediente(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  if (texto.includes("-")) return texto;
  const num = parseInt(texto, 10);
  if (isNaN(num)) return "";
  return String(num).padStart(5, "0");
}

function obtenerNombreCortoMateria(id_materia) {
  try {
    const sheet = getSheet(SHEET_MATERIAS);
    const data  = sheet.getDataRange().getValues();
    if (data.length <= 1) return id_materia;
    const headers      = data[0];
    const rows         = data.slice(1).filter(r => r.some(c => c !== ""));
    const valorMateria = String(id_materia || "").trim();
    const materia      = rows.map(row => mapRowToObject(headers, row))
      .find(item =>
        String(item.id_materia    || "").trim()          === valorMateria ||
        String(item.abreviatura   || "").trim().toUpperCase() === valorMateria.toUpperCase() ||
        String(item.nombre_materia|| "").trim().toUpperCase() === valorMateria.toUpperCase()
      );
    if (!materia) return valorMateria;
    return String(materia.abreviatura || materia.nombre_materia || valorMateria).trim().toUpperCase();
  } catch (e) {
    return id_materia;
  }
}

function normalizarIdMateria(valorMateria) {
  try {
    const valor = String(valorMateria || "").trim();
    if (!valor) return "";
    const sheet       = getSheet(SHEET_MATERIAS);
    const data        = sheet.getDataRange().getValues();
    if (data.length <= 1) return valor;
    const headers     = data[0];
    const rows        = data.slice(1).filter(r => r.some(c => c !== ""));
    const valorUpper  = valor.toUpperCase();
    const materia     = rows.map(row => mapRowToObject(headers, row))
      .find(item =>
        String(item.id_materia    || "").trim()          === valor ||
        String(item.abreviatura   || "").trim().toUpperCase() === valorUpper ||
        String(item.nombre_materia|| "").trim().toUpperCase() === valorUpper
      );
    return materia ? String(materia.id_materia || "").trim() : valor;
  } catch (e) {
    return String(valorMateria || "").trim();
  }
}