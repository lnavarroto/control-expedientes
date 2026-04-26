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
const SHEET_GRUPO_ARCHIVO         = "grupo_archivo_general";
const SHEET_GRUPO_ARCHIVO_DETALLE = "grupo_archivo_general_detalle";
const SHEET_SALIDA_ARCHIVO        = "salida_archivo_general";
// =========================
// TIMEZONE GLOBAL
// =========================
const TIMEZONE = Session.getScriptTimeZone();

// =========================
// ENTRY POINTS
// =========================

function doPost(e) {
  try {
    const rawData = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = rawData.action;

    const validacionMayusculasPost = validarPayloadMayusculas(rawData, ["action", "callback"]);
    if (!validacionMayusculasPost.success) {
      return jsonResponse({ success: false, error: validacionMayusculasPost.error });
    }

    const data = normalizarPayloadAMayusculas(rawData, ["action", "callback"]);
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
      case "desasignar_expediente_paquete": resultado = desasignarExpedienteDePaquete(data); break;
      case "crear_grupo_archivo_general":         resultado = crearGrupoArchivoGeneral(data); break;
  case "asignar_expedientes_grupo_archivo":   resultado = asignarExpedientesGrupoArchivo(data); break;
  case "desasignar_expediente_grupo_archivo": resultado = desasignarExpedienteGrupoArchivo(data); break;
  case "asignar_grupo_a_paquete_archivo": resultado = asignarGrupoAPaqueteArchivo(data); break;
  case "registrar_salida_archivo_general":    resultado = registrarSalidaArchivoGeneral(data); break;
  case "registrar_retorno_archivo_general":   resultado = registrarRetornoArchivoGeneral(data); break;
      default: resultado = { success: false, error: "Acción POST no válida" }; break;
    }

    return jsonResponse(resultado);
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

function doGet(e) {
  try {
    const paramsRaw = (e && e.parameter) || {};
    const validacionMayusculasGet = validarPayloadMayusculas(paramsRaw, ["action", "callback"]);
    if (!validacionMayusculasGet.success) {
      return jsonResponse({ success: false, error: validacionMayusculasGet.error });
    }

    const params = normalizarPayloadAMayusculas(paramsRaw, ["action", "callback"]);
    const action   = params.action || "";
    const callback = params.callback || "";
    let resultado;

    switch (action) {
      case "listar_usuarios":               resultado = listarUsuarios(); break;
      case "obtener_usuario_por_dni":       resultado = obtenerUsuarioPorDni(params.dni || ""); break;
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
        resultado = obtenerExpedientePorCodigo(params.codigo || params.codigo_expediente_completo);
        break;
      case "sugerir_paquete_para_expediente":
        resultado = sugerirPaqueteParaExpediente(
          params.codigo_expediente_completo || "",
          params.id_usuario_especialista || ""
        );
        break;
      case "listar_paquetes_archivo":       resultado = listarPaquetesArchivo(); break;
      case "listar_grupos_archivo_general":    resultado = listarGruposArchivoGeneral(); break;
  case "listar_detalle_grupo_archivo":
    resultado = listarDetalleGrupoArchivo(params.id_grupo || "");
    break;
  case "listar_salidas_archivo_general":   resultado = listarSalidasArchivoGeneral(params.id_grupo || ""); break;
  case "obtener_grupo_con_detalle":
    resultado = obtenerGrupoConDetalle(params.id_grupo || "");
    break;
      case "listar_expedientes_por_paquete":
        resultado = listarExpedientesPorPaquete(params.id_paquete_archivo || "");
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

function _normalizarEstadoNombre(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function _obtenerMapaEstadosActivos() {
  const listado = listarEstadosActivos();
  if (!listado.success || !Array.isArray(listado.data)) return {};
  const mapa = {};
  listado.data.forEach(function(item) {
    const clave = _normalizarEstadoNombre(item.nombre_estado || item.nombre || "");
    if (clave && !mapa[clave]) mapa[clave] = String(item.id_estado || "").trim();
  });
  return mapa;
}

function _resolverIdEstado(aliasList, idFallback) {
  const mapa = _obtenerMapaEstadosActivos();
  const aliases = Array.isArray(aliasList) ? aliasList : [aliasList];
  for (var i = 0; i < aliases.length; i++) {
    var key = _normalizarEstadoNombre(aliases[i]);
    if (key && mapa[key]) return mapa[key];
  }
  return String(idFallback || "").trim();
}

function _setEstadoExpedienteEnFila(fila, headersEXP, nuevoIdEstado, ahoraStr) {
  const colEstado = headersEXP.indexOf("id_estado");
  const colFecAct = headersEXP.indexOf("fecha_actualizacion");
  if (colEstado !== -1 && nuevoIdEstado) fila[colEstado] = nuevoIdEstado;
  if (colFecAct !== -1 && ahoraStr) fila[colFecAct] = ahoraStr;
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
    const origenRegistroRaw     = String(data.origen_registro || "").trim().toUpperCase();
    const origen_registro       = origenRegistroRaw === "LECTORA" ? "LECTORA" : "MANUAL";
    const dni_usuario           = String(data.dni_usuario      || "").trim();
    const nombres_usuario       = String(data.nombres_usuario  || "").trim();
    const apellidos_usuario     = String(data.apellidos_usuario || "").trim();

    if (!numero_expediente_raw || !anio || !incidente || !codigo_corte ||
        !tipo_organo || !codigo_materia || !id_juzgado || !juzgado_texto ||
        !dni_usuario || !nombres_usuario) {
      return { success: false, error: "Faltan campos obligatorios para registrar el expediente" };
    }

    if (!/^\d{4}$/.test(anio)) {
      return { success: false, error: "El campo ANIO debe contener solo 4 dígitos" };
    }
    if (!/^\d+$/.test(incidente)) {
      return { success: false, error: "El campo INCIDENTE debe contener solo números" };
    }
    if (!/^\d+$/.test(codigo_corte)) {
      return { success: false, error: "El campo CODIGO_CORTE debe contener solo números" };
    }
    if (!/^\d+$/.test(id_juzgado)) {
      return { success: false, error: "El campo ID_JUZGADO debe contener solo números" };
    }
    if (!/^\d{8}$/.test(dni_usuario)) {
      return { success: false, error: "El campo DNI_USUARIO debe contener exactamente 8 dígitos" };
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
    const rotulo_paquete = construirRotuloPaquete(anio, nombreMateria, id_paquete, grupo);

    const existe = buscarFilaPorCampo(sheet, "rotulo_paquete", rotulo_paquete);
    if (existe) return { success: false, error: "Ya existe un paquete archivo con ese rótulo: " + rotulo_paquete };

    const ahora               = new Date();
    const fecha_creacion      = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const fecha_actualizacion = fecha_creacion;
    const id_paquete_archivo  = generarID(sheet, "PAQ");

    sheet.appendRow(buildRowFromHeaders(sheet, {
      id_paquete_archivo,
      anio,
      id_materia,
      id_paquete,
      grupo,
      color_especialista: color_especialista || "",
      rotulo_paquete,
      descripcion,
      activo: "SI",
      fecha_creacion,
      fecha_actualizacion
    }));

    return {
      success: true,
      message: "Paquete archivo creado correctamente",
      data: {
        id_paquete_archivo,
        rotulo_paquete,
        anio,
        id_materia,
        id_paquete,
        grupo,
        color_especialista: color_especialista || ""
      }
    };
  });
}

// =========================
// CONSTRUIR RÓTULO - SIN COLOR (formato: 2019-CI-PQT2-G1)
// =========================
function construirRotuloPaquete(anio, nombreMateria, codigo_paquete, grupo) {
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
  const colEstadoEXP = headersEXP.indexOf("id_estado");
  const estadoAnterior = String(expediente.id_estado || "").trim();
  const estadoNuevo = _resolverIdEstado(["ASIGNADO", "EN_PAQUETE"], estadoAnterior);
  if (colIdPaqEXP !== -1 && rowExpediente !== -1) {
    const filaEXP = sheetEXP.getRange(rowExpediente, 1, 1, sheetEXP.getLastColumn()).getValues()[0];
    filaEXP[colIdPaqEXP] = id_paquete_archivo;
    if (colEstadoEXP !== -1) filaEXP[colEstadoEXP] = estadoNuevo;
    const colFechaActEXP = headersEXP.indexOf("fecha_actualizacion");
    if (colFechaActEXP !== -1) filaEXP[colFechaActEXP] = ahoraStr;
    sheetEXP.getRange(rowExpediente, 1, 1, sheetEXP.getLastColumn()).setValues([filaEXP]);
  }

  registrarMovimientoExpediente({
    id_expediente,
    tipo_movimiento:   rotuloPaqueteAnterior ? "REASIGNACION_PAQUETE" : "ASIGNACION_PAQUETE",
    ubicacion_origen:  rotuloPaqueteAnterior,
    ubicacion_destino: paqueteArchivo.rotulo_paquete || "",
    estado_anterior:   estadoAnterior,
    estado_nuevo:      estadoNuevo,
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
function desasignarExpedienteDePaquete(data) {
  return ejecutarConLock(function () {
    const sheetPE  = getSheet(SHEET_PAQUETE_EXPEDIENTE);
    const sheetEXP = getSheet(SHEET_EXPEDIENTES);
    const sheetPA  = getSheet(SHEET_PAQUETES_ARCHIVO);

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
    const colIdPaqArchPE   = headersPE.indexOf("id_paquete_archivo");

    let encontrada = false;
    let id_paquete_archivo_anterior = "";
    const ahoraStr = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");

    for (let i = 1; i < dataPE.length; i++) {
      if (
        String(dataPE[i][colIdExpPE] || "").trim() === id_expediente &&
        String(dataPE[i][colActivoPE] || "").trim().toUpperCase() === "SI"
      ) {
        if (colIdPaqArchPE !== -1) {
          id_paquete_archivo_anterior = String(dataPE[i][colIdPaqArchPE] || "").trim();
        }

        sheetPE.getRange(i + 1, colActivoPE + 1).setValue("NO");
        if (colEstadoPE   !== -1) sheetPE.getRange(i + 1, colEstadoPE   + 1).setValue("DISPONIBLE");
        if (colFechaEstPE !== -1) sheetPE.getRange(i + 1, colFechaEstPE + 1).setValue(ahoraStr);
        if (colObsPE      !== -1) sheetPE.getRange(i + 1, colObsPE      + 1).setValue(observacion);
        if (colFechaActPE !== -1) sheetPE.getRange(i + 1, colFechaActPE + 1).setValue(ahoraStr);

        encontrada = true;
      }
    }

    if (!encontrada) {
      return { success: false, error: "El expediente no tiene una asignación activa" };
    }

    const dataEXP    = sheetEXP.getDataRange().getValues();
    const headersEXP = dataEXP[0];
    const colIdExp   = headersEXP.indexOf("id_expediente");
    const colIdPaq   = headersEXP.indexOf("id_paquete");
    const colUbi     = headersEXP.indexOf("id_ubicacion_actual");
    const colUbiTxt  = headersEXP.indexOf("ubicacion_texto");
    const colFecAct  = headersEXP.indexOf("fecha_actualizacion");
    const colEstado  = headersEXP.indexOf("id_estado");

    let expedienteActual = null;

    for (let i = 1; i < dataEXP.length; i++) {
      if (String(dataEXP[i][colIdExp] || "").trim() === id_expediente) {
        const fila = sheetEXP.getRange(i + 1, 1, 1, sheetEXP.getLastColumn()).getValues()[0];

        expedienteActual = mapRowToObject(headersEXP, fila);
        const estadoAnterior = String(expedienteActual.id_estado || "").trim();
        const estadoNuevo = _resolverIdEstado(["RETORNADO", "REGISTRADO"], estadoAnterior);

        if (colIdPaq  !== -1) fila[colIdPaq]  = "";
        if (colUbi    !== -1) fila[colUbi]    = "";
        if (colUbiTxt !== -1) fila[colUbiTxt] = "";
        if (colEstado !== -1) fila[colEstado] = estadoNuevo;
        if (colFecAct !== -1) fila[colFecAct] = ahoraStr;

        sheetEXP.getRange(i + 1, 1, 1, sheetEXP.getLastColumn()).setValues([fila]);
        break;
      }
    }

    let rotuloPaqueteAnterior = "";
    if (id_paquete_archivo_anterior) {
      const dataPA    = sheetPA.getDataRange().getValues();
      const headersPA = dataPA[0];
      const rowsPA    = dataPA.slice(1).filter(r => r.some(c => c !== ""));

      const paqueteAnterior = rowsPA
        .map(row => mapRowToObject(headersPA, row))
        .find(item => String(item.id_paquete_archivo || "").trim() === id_paquete_archivo_anterior);

      if (paqueteAnterior) {
        rotuloPaqueteAnterior = String(paqueteAnterior.rotulo_paquete || "").trim();
      }
    }

    registrarMovimientoExpediente({
      id_expediente:    id_expediente,
      tipo_movimiento:  "DESASIGNACION_PAQUETE",
      ubicacion_origen: rotuloPaqueteAnterior,
      ubicacion_destino: "",
      estado_anterior:  expedienteActual ? String(expedienteActual.id_estado || "").trim() : "",
      estado_nuevo:     _resolverIdEstado(["RETORNADO", "REGISTRADO"], expedienteActual ? String(expedienteActual.id_estado || "").trim() : ""),
      motivo:           "Desasignación de expediente del paquete archivo",
      observacion:      observacion,
      realizado_por:    desasignado_por,
      destino_externo:  ""
    });

    return {
      success: true,
      message: "Expediente desasignado correctamente",
      data: {
        id_expediente,
        estado_asignacion: "DISPONIBLE",
        desasignado_por,
        fecha_estado: ahoraStr
      }
    };
  });
}
// =========================
// 1. CREAR GRUPO ARCHIVO GENERAL
// =========================
// Payload esperado:
// {
//   action: "crear_grupo_archivo_general",
//   id_usuario_especialista: "USR-0001",
//   nombre_especialista: "Luis Pérez",        // opcional, se puede obtener del usuario
//   observacion: "Grupo de expedientes civiles 2024",
//   ids_expedientes: ["EXP-0001", "EXP-0002"] // opcional: asignar en el mismo paso
// }
function crearGrupoArchivoGeneral(data) {
  return ejecutarConLock(function () {
    const sheet = getSheet(SHEET_GRUPO_ARCHIVO);
 
    const id_usuario_especialista = String(data.id_usuario_especialista || "").trim();
    const observacion             = String(data.observacion             || "").trim();
    let   nombre_especialista     = String(data.nombre_especialista     || "").trim();
 
    if (!id_usuario_especialista) {
      return { success: false, error: "Falta campo obligatorio: id_usuario_especialista" };
    }
 
    // Obtener nombre del especialista desde la hoja de usuarios si no se envió
    if (!nombre_especialista) {
      const sheetUsuarios = getSheet(SHEET_NAME);
      const dataUs        = sheetUsuarios.getDataRange().getValues();
      const headersUs     = dataUs[0];
      const rowsUs        = dataUs.slice(1).filter(r => r.some(c => c !== ""));
      const usuario       = rowsUs.map(row => mapRowToObject(headersUs, row))
        .find(item => String(item.id_usuario || "").trim() === id_usuario_especialista && esActivo(item.activo));
      if (!usuario) return { success: false, error: "Especialista no encontrado o inactivo" };
      nombre_especialista = [String(usuario.nombres || "").trim(), String(usuario.apellidos || "").trim()]
        .filter(Boolean).join(" ");
    }
 
    // Generar codigo_grupo: tomar abreviatura del nombre + correlativo
    // Ej: LUIS-G1, LUIS-G2 ...
    const abreviatura = nombre_especialista.split(" ")[0].toUpperCase().substring(0, 6);
 
    // Contar grupos existentes de este especialista para generar el correlativo
    const dataGrupos    = sheet.getDataRange().getValues();
    const headersGrupos = dataGrupos[0];
    const rowsGrupos    = dataGrupos.length > 1
      ? dataGrupos.slice(1).filter(r => r.some(c => c !== "")).map(r => mapRowToObject(headersGrupos, r))
      : [];
 
    const gruposEspecialista = rowsGrupos.filter(
      item => String(item.id_usuario_especialista || "").trim() === id_usuario_especialista
    );
    const correlativo  = gruposEspecialista.length + 1;
    const codigo_grupo = abreviatura + "-G" + correlativo;
 
    // Verificar que no exista ya ese código
    const existeCodigo = rowsGrupos.some(
      item => String(item.codigo_grupo || "").trim().toUpperCase() === codigo_grupo.toUpperCase()
    );
    if (existeCodigo) {
      return { success: false, error: "Ya existe un grupo con el código: " + codigo_grupo };
    }
 
    const ahora               = new Date();
    const fecha_creacion      = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const fecha_actualizacion = fecha_creacion;
    const id_grupo            = generarID(sheet, "GRP");
 
    sheet.appendRow(buildRowFromHeaders(sheet, {
      id_grupo,
      id_usuario_especialista,
      nombre_especialista,
      codigo_grupo,
      total_expedientes: 0,
      estado_grupo: "ACTIVO",
      observacion,
      activo: "SI",
      fecha_creacion,
      fecha_actualizacion
    }));
 
    // Si se enviaron expedientes, asignarlos inmediatamente
    let resultadosAsignacion = [];
    const ids_expedientes = Array.isArray(data.ids_expedientes) ? data.ids_expedientes : [];
    if (ids_expedientes.length > 0) {
      const resultLote = _asignarExpedientesAGrupo({
        id_grupo,
        ids_expedientes,
        asignado_por: nombre_especialista
      });
      resultadosAsignacion = resultLote.data || [];
    }
 
    return {
      success: true,
      message: "Grupo de archivo general creado correctamente",
      data: {
        id_grupo,
        codigo_grupo,
        id_usuario_especialista,
        nombre_especialista,
        total_expedientes: ids_expedientes.length,
        estado_grupo: "ACTIVO",
        fecha_creacion,
        asignaciones: resultadosAsignacion
      }
    };
  });
}
 
// =========================
// 2. ASIGNAR EXPEDIENTES A GRUPO (lote)
// =========================
// Payload esperado:
// {
//   action: "asignar_expedientes_grupo_archivo",
//   id_grupo: "GRP-0001",
//   ids_expedientes: ["EXP-0001", "EXP-0002"],
//   asignado_por: "USR-0001 - Luis Pérez"
// }
function asignarExpedientesGrupoArchivo(data) {
  return ejecutarConLock(function () {
    return _asignarExpedientesAGrupo(data);
  });
}
 
function _asignarExpedientesAGrupo(data) {
  const sheetDetalle = getSheet(SHEET_GRUPO_ARCHIVO_DETALLE);
  const sheetGrupo   = getSheet(SHEET_GRUPO_ARCHIVO);
  const sheetEXP     = getSheet(SHEET_EXPEDIENTES);
 
  const id_grupo        = String(data.id_grupo        || "").trim();
  const ids_expedientes = Array.isArray(data.ids_expedientes) ? data.ids_expedientes : [];
  const asignado_por    = String(data.asignado_por    || "").trim();
 
  if (!id_grupo)                     return { success: false, error: "Falta: id_grupo" };
  if (ids_expedientes.length === 0)  return { success: false, error: "Falta: ids_expedientes (array)" };
  if (!asignado_por)                 return { success: false, error: "Falta: asignado_por" };
 
  // Validar que el grupo existe y está activo
  const dataGrupo    = sheetGrupo.getDataRange().getValues();
  const headersGrupo = dataGrupo[0];
  const rowsGrupo    = dataGrupo.slice(1).filter(r => r.some(c => c !== ""));
  const grupo        = rowsGrupo.map(r => mapRowToObject(headersGrupo, r))
    .find(item => String(item.id_grupo || "").trim() === id_grupo && esActivo(item.activo));
  if (!grupo) return { success: false, error: "Grupo no encontrado o inactivo: " + id_grupo };
 
  // Cargar detalle existente para verificar duplicados
  const dataDetalle    = sheetDetalle.getDataRange().getValues();
  const headersDetalle = dataDetalle.length > 1 ? dataDetalle[0] : [];
  const rowsDetalle    = dataDetalle.length > 1
    ? dataDetalle.slice(1).filter(r => r.some(c => c !== "")).map(r => mapRowToObject(headersDetalle, r))
    : [];
 
  // Cargar expedientes para validar existencia
  const dataEXP    = sheetEXP.getDataRange().getValues();
  const headersEXP = dataEXP[0];
  const colEstadoEXP = headersEXP.indexOf("id_estado");
  const colIdUbicacionEXP = headersEXP.indexOf("id_ubicacion_actual");
  const colUbicacionTxtEXP = headersEXP.indexOf("ubicacion_texto");
  const colFechaActEXP = headersEXP.indexOf("fecha_actualizacion");
  const expMap     = {};
  const expRowMap  = {};
  dataEXP.slice(1).filter(r => r.some(c => c !== "")).forEach(r => {
    const obj = mapRowToObject(headersEXP, r);
    const key = String(obj.id_expediente || "").trim();
    expMap[key] = obj;
  });
  for (let i = 1; i < dataEXP.length; i++) {
    const idExp = String(dataEXP[i][headersEXP.indexOf("id_expediente")] || "").trim();
    if (idExp) expRowMap[idExp] = i + 1;
  }
 
  const ahora       = new Date();
  const ahoraStr    = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  const resultados  = [];
  let   asignados   = 0;
 
  ids_expedientes.forEach(function(id_exp) {
    const id_expediente = String(id_exp || "").trim();
    if (!id_expediente) {
      resultados.push({ id_expediente, success: false, mensaje: "ID vacío" });
      return;
    }
    if (!expMap[id_expediente]) {
      resultados.push({ id_expediente, success: false, mensaje: "Expediente no encontrado" });
      return;
    }
    // Verificar si ya está asignado activamente a ALGÚN grupo
    const yaAsignado = rowsDetalle.find(
      item => String(item.id_expediente || "").trim() === id_expediente &&
              esActivo(item.activo)
    );
    if (yaAsignado) {
      resultados.push({ id_expediente, success: false, mensaje: "Ya está asignado al grupo: " + (yaAsignado.id_grupo || "") });
      return;
    }
 
    const id_detalle = generarID(sheetDetalle, "GDET");
    sheetDetalle.appendRow(buildRowFromHeaders(sheetDetalle, {
      id_detalle,
      id_grupo,
      id_expediente,
      activo: "SI",
      fecha_asignacion: ahoraStr,
      asignado_por
    }));

    const rowExp = expRowMap[id_expediente];
    if (rowExp) {
      const filaEXP = sheetEXP.getRange(rowExp, 1, 1, sheetEXP.getLastColumn()).getValues()[0];
      const estadoAnterior = String(filaEXP[colEstadoEXP] || "").trim();
      const estadoNuevo = _resolverIdEstado(["ASIGNADO", "EN_PAQUETE"], estadoAnterior);
      if (colEstadoEXP !== -1) filaEXP[colEstadoEXP] = estadoNuevo;
      if (colIdUbicacionEXP !== -1) filaEXP[colIdUbicacionEXP] = id_grupo;
      if (colUbicacionTxtEXP !== -1) filaEXP[colUbicacionTxtEXP] = "GRUPO: " + String(grupo.codigo_grupo || id_grupo);
      if (colFechaActEXP !== -1) filaEXP[colFechaActEXP] = ahoraStr;
      sheetEXP.getRange(rowExp, 1, 1, sheetEXP.getLastColumn()).setValues([filaEXP]);

      registrarMovimientoExpediente({
        id_expediente,
        tipo_movimiento: "ASIGNACION_GRUPO_ARCHIVO",
        ubicacion_origen: String(expMap[id_expediente].ubicacion_texto || "").trim(),
        ubicacion_destino: "GRUPO: " + String(grupo.codigo_grupo || id_grupo),
        estado_anterior: estadoAnterior,
        estado_nuevo: estadoNuevo,
        motivo: "Asignación de expediente a grupo de archivo general",
        observacion: "Grupo " + String(grupo.codigo_grupo || id_grupo),
        realizado_por: asignado_por,
        destino_externo: ""
      });
    }
 
    asignados++;
    resultados.push({ id_expediente, success: true, mensaje: "Asignado correctamente", id_detalle });
  });
 
  // Actualizar total_expedientes en el grupo
  if (asignados > 0) {
    _actualizarTotalExpedientesGrupo(sheetGrupo, headersGrupo, id_grupo, asignados);
  }
 
  return {
    success: true,
    message: asignados + " de " + ids_expedientes.length + " expedientes asignados al grupo " + grupo.codigo_grupo,
    data: resultados
  };
}
 
// Incrementa el counter total_expedientes del grupo
function _actualizarTotalExpedientesGrupo(sheetGrupo, headersGrupo, id_grupo, incremento) {
  const colIdGrupo  = headersGrupo.indexOf("id_grupo");
  const colTotal    = headersGrupo.indexOf("total_expedientes");
  const colFecAct   = headersGrupo.indexOf("fecha_actualizacion");
  if (colIdGrupo === -1 || colTotal === -1) return;
 
  const dataGrupo = sheetGrupo.getDataRange().getValues();
  for (let i = 1; i < dataGrupo.length; i++) {
    if (String(dataGrupo[i][colIdGrupo] || "").trim() === id_grupo) {
      const actual = Number(dataGrupo[i][colTotal] || 0);
      sheetGrupo.getRange(i + 1, colTotal + 1).setValue(actual + incremento);
      if (colFecAct !== -1) {
        sheetGrupo.getRange(i + 1, colFecAct + 1).setValue(
          Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss")
        );
      }
      break;
    }
  }
}
 
// =========================
// 3. DESASIGNAR EXPEDIENTE DE GRUPO
// =========================
// Payload:
// {
//   action: "desasignar_expediente_grupo_archivo",
//   id_grupo: "GRP-0001",
//   id_expediente: "EXP-0001",
//   desasignado_por: "USR-0001 - Luis Pérez"
// }
function desasignarExpedienteGrupoArchivo(data) {
  return ejecutarConLock(function () {
    const sheetDetalle = getSheet(SHEET_GRUPO_ARCHIVO_DETALLE);
    const sheetGrupo   = getSheet(SHEET_GRUPO_ARCHIVO);
    const sheetEXP     = getSheet(SHEET_EXPEDIENTES);
 
    const id_grupo        = String(data.id_grupo        || "").trim();
    const id_expediente   = String(data.id_expediente   || "").trim();
    const desasignado_por = String(data.desasignado_por || "").trim();
 
    if (!id_grupo || !id_expediente || !desasignado_por) {
      return { success: false, error: "Faltan campos: id_grupo, id_expediente, desasignado_por" };
    }
 
    const dataDetalle    = sheetDetalle.getDataRange().getValues();
    if (dataDetalle.length <= 1) return { success: false, error: "No hay asignaciones registradas" };
 
    const headersDetalle = dataDetalle[0];
    const colIdGrupoDet  = headersDetalle.indexOf("id_grupo");
    const colIdExpDet    = headersDetalle.indexOf("id_expediente");
    const colActivoDet   = headersDetalle.indexOf("activo");
    const colFecActDet   = headersDetalle.indexOf("fecha_asignacion");
 
    const ahoraStr = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    let encontrado = false;
 
    for (let i = 1; i < dataDetalle.length; i++) {
      if (
        String(dataDetalle[i][colIdGrupoDet] || "").trim() === id_grupo &&
        String(dataDetalle[i][colIdExpDet]   || "").trim() === id_expediente &&
        String(dataDetalle[i][colActivoDet]  || "").trim().toUpperCase() === "SI"
      ) {
        sheetDetalle.getRange(i + 1, colActivoDet + 1).setValue("NO");
        if (colFecActDet !== -1) sheetDetalle.getRange(i + 1, colFecActDet + 1).setValue(ahoraStr);
        encontrado = true;
        break;
      }
    }
 
    if (!encontrado) return { success: false, error: "No se encontró asignación activa para ese expediente en el grupo" };
 
    // Decrementar total_expedientes
    const dataGrupo    = sheetGrupo.getDataRange().getValues();
    const headersGrupo = dataGrupo[0];
    _actualizarTotalExpedientesGrupo(sheetGrupo, headersGrupo, id_grupo, -1);

    const grupo = dataGrupo.slice(1)
      .map(r => mapRowToObject(headersGrupo, r))
      .find(g => String(g.id_grupo || "").trim() === id_grupo) || {};

    const dataEXP = sheetEXP.getDataRange().getValues();
    const headersEXP = dataEXP[0];
    const colIdExp = headersEXP.indexOf("id_expediente");
    const colEstado = headersEXP.indexOf("id_estado");
    const colIdUbicacion = headersEXP.indexOf("id_ubicacion_actual");
    const colUbicacionTxt = headersEXP.indexOf("ubicacion_texto");
    const colFecAct = headersEXP.indexOf("fecha_actualizacion");

    for (let i = 1; i < dataEXP.length; i++) {
      if (String(dataEXP[i][colIdExp] || "").trim() === id_expediente) {
        const fila = sheetEXP.getRange(i + 1, 1, 1, sheetEXP.getLastColumn()).getValues()[0];
        const estadoAnterior = String(fila[colEstado] || "").trim();
        const estadoNuevo = _resolverIdEstado(["RETORNADO", "REGISTRADO"], estadoAnterior);
        if (colEstado !== -1) fila[colEstado] = estadoNuevo;
        if (colIdUbicacion !== -1) fila[colIdUbicacion] = "";
        if (colUbicacionTxt !== -1) fila[colUbicacionTxt] = "";
        if (colFecAct !== -1) fila[colFecAct] = ahoraStr;
        sheetEXP.getRange(i + 1, 1, 1, sheetEXP.getLastColumn()).setValues([fila]);

        registrarMovimientoExpediente({
          id_expediente,
          tipo_movimiento: "RETORNO",
          ubicacion_origen: "GRUPO: " + String(grupo.codigo_grupo || id_grupo),
          ubicacion_destino: "",
          estado_anterior: estadoAnterior,
          estado_nuevo: estadoNuevo,
          motivo: "Retorno de expediente desde grupo de archivo general",
          observacion: "Desasignación de grupo",
          realizado_por: desasignado_por,
          destino_externo: ""
        });
        break;
      }
    }
 
    return {
      success: true,
      message: "Expediente desasignado del grupo correctamente",
      data: { id_grupo, id_expediente, desasignado_por, fecha: ahoraStr }
    };
  });
}
 
// =========================
// 4. REGISTRAR SALIDA ARCHIVO GENERAL
// =========================
// Payload:
// {
//   action: "registrar_salida_archivo_general",
//   id_grupo: "GRP-0001",
//   tipo_salida: "PRESTAMO" | "TRANSFERENCIA" | "CONSULTA" | "OTRO",
//   destino_salida: "Juzgado Civil N°1",
//   responsable_entrega: "Luis Pérez",
//   responsable_recepcion: "Juan Torres",
//   motivo_salida: "Solicitud de préstamo para audiencia",
//   observacion: "Entregar a secretaría",
//   realizado_por: "USR-0001 - Luis Pérez"
// }
function registrarSalidaArchivoGeneral(data) {
  return ejecutarConLock(function () {
    const sheetSalida = getSheet(SHEET_SALIDA_ARCHIVO);
    const sheetGrupo  = getSheet(SHEET_GRUPO_ARCHIVO);
 
    const id_grupo              = String(data.id_grupo              || "").trim();
    const tipo_salida           = String(data.tipo_salida           || "PRESTAMO").trim().toUpperCase();
    const destino_salida        = String(data.destino_salida        || "").trim();
    const responsable_entrega   = String(data.responsable_entrega   || "").trim();
    const responsable_recepcion = String(data.responsable_recepcion || "").trim();
    const motivo_salida         = String(data.motivo_salida         || "").trim();
    const estado_salida_in      = String(data.estado_salida         || "").trim().toUpperCase();
    const observacion           = String(data.observacion           || "").trim();
    const realizado_por         = String(data.realizado_por         || "").trim();
 
    if (!id_grupo || !destino_salida || !responsable_entrega || !realizado_por) {
      return { success: false, error: "Faltan campos obligatorios: id_grupo, destino_salida, responsable_entrega, realizado_por" };
    }
 
    // Validar grupo
    const dataGrupo    = sheetGrupo.getDataRange().getValues();
    const headersGrupo = dataGrupo[0];
    const rowsGrupo    = dataGrupo.slice(1).filter(r => r.some(c => c !== ""));
    const grupo        = rowsGrupo.map(r => mapRowToObject(headersGrupo, r))
      .find(item => String(item.id_grupo || "").trim() === id_grupo && esActivo(item.activo));
    if (!grupo) return { success: false, error: "Grupo no encontrado o inactivo: " + id_grupo };
 
    // Verificar que no haya una salida activa para este grupo (sin retorno)
    const dataSalida    = sheetSalida.getDataRange().getValues();
    const headersSalida = dataSalida.length > 1 ? dataSalida[0] : [];
    const rowsSalida    = dataSalida.length > 1
      ? dataSalida.slice(1).filter(r => r.some(c => c !== "")).map(r => mapRowToObject(headersSalida, r))
      : [];
 
    const ESTADOS_SALIDA_ACTIVOS = ["ACTIVA", "PENDIENTE", "EN_PROCESO"];
    const salidaActiva = rowsSalida.find(
      item => String(item.id_grupo || "").trim() === id_grupo &&
              esActivo(item.activo) &&
              ESTADOS_SALIDA_ACTIVOS.indexOf(String(item.estado_salida || "").trim().toUpperCase()) !== -1
    );
    if (salidaActiva) {
      return { success: false, error: "Ya existe una salida activa para este grupo. Registre el retorno primero." };
    }
 
    const ahora               = new Date();
    const fecha_hora_salida   = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const fecha_creacion      = fecha_hora_salida;
 
    // Generar rótulo de salida: codigo_grupo + correlativo de salidas
    const salidasGrupo = rowsSalida.filter(item => String(item.id_grupo || "").trim() === id_grupo);
    const correlativo  = String(salidasGrupo.length + 1).padStart(3, "0");
    const rotulo_salida = grupo.codigo_grupo + "-" + correlativo;
 
    const id_salida = generarID(sheetSalida, "SAL");
 
    const ESTADOS_SALIDA_PERMITIDOS = ["ACTIVA", "PENDIENTE", "EN_PROCESO", "ENVIADO_DEFINITIVO"];
    const estado_salida = ESTADOS_SALIDA_PERMITIDOS.indexOf(estado_salida_in) !== -1
      ? estado_salida_in
      : "ACTIVA";

    sheetSalida.appendRow(buildRowFromHeaders(sheetSalida, {
      id_salida,
      id_grupo,
      rotulo_salida,
      tipo_salida,
      destino_salida,
      responsable_entrega,
      responsable_recepcion,
      fecha_hora_salida,
      fecha_hora_retorno:  "",
      estado_salida:       estado_salida,
      motivo_salida,
      observacion,
      realizado_por,
      activo:              "SI",
      fecha_creacion
    }));
 
    // Actualizar estado del grupo
    _actualizarEstadoGrupo(sheetGrupo, headersGrupo, dataGrupo, id_grupo, "EN_PRESTAMO");

    // Actualizar estado de expedientes del grupo a ENVIADO A ARCHIVO
    const sheetDetalle = getSheet(SHEET_GRUPO_ARCHIVO_DETALLE);
    const dataDetalle = sheetDetalle.getDataRange().getValues();
    const headersDetalle = dataDetalle.length > 1 ? dataDetalle[0] : [];
    const rowsDetalle = dataDetalle.length > 1
      ? dataDetalle.slice(1).filter(r => r.some(c => c !== "")).map(r => mapRowToObject(headersDetalle, r))
      : [];

    const idsExpGrupo = rowsDetalle
      .filter(item => String(item.id_grupo || "").trim() === id_grupo && esActivo(item.activo))
      .map(item => String(item.id_expediente || "").trim())
      .filter(Boolean);

    if (idsExpGrupo.length > 0) {
      const sheetEXP = getSheet(SHEET_EXPEDIENTES);
      const dataEXP = sheetEXP.getDataRange().getValues();
      const headersEXP = dataEXP[0];
      const colIdExp = headersEXP.indexOf("id_expediente");
      const colEstado = headersEXP.indexOf("id_estado");
      const colFecAct = headersEXP.indexOf("fecha_actualizacion");
      const estadoDestino = _resolverIdEstado(["ENVIADO_A_ARCHIVO", "ARCHIVADO"], "");

      for (let i = 1; i < dataEXP.length; i++) {
        const idExp = String(dataEXP[i][colIdExp] || "").trim();
        if (idsExpGrupo.indexOf(idExp) === -1) continue;

        const fila = sheetEXP.getRange(i + 1, 1, 1, sheetEXP.getLastColumn()).getValues()[0];
        const estadoAnterior = String(fila[colEstado] || "").trim();
        if (colEstado !== -1 && estadoDestino) fila[colEstado] = estadoDestino;
        if (colFecAct !== -1) fila[colFecAct] = fecha_hora_salida;
        sheetEXP.getRange(i + 1, 1, 1, sheetEXP.getLastColumn()).setValues([fila]);

        registrarMovimientoExpediente({
          id_expediente: idExp,
          tipo_movimiento: "SALIDA",
          ubicacion_origen: "GRUPO: " + String(grupo.codigo_grupo || id_grupo),
          ubicacion_destino: destino_salida,
          estado_anterior: estadoAnterior,
          estado_nuevo: estadoDestino || estadoAnterior,
          motivo: motivo_salida || "Salida de archivo general",
          observacion: observacion,
          realizado_por: realizado_por,
          destino_externo: destino_salida
        });
      }
    }
 
    return {
      success: true,
      message: "Salida registrada correctamente",
      data: {
        id_salida,
        rotulo_salida,
        id_grupo,
        codigo_grupo: grupo.codigo_grupo,
        tipo_salida,
        destino_salida,
        responsable_entrega,
        responsable_recepcion,
        fecha_hora_salida,
        estado_salida
      }
    };
  });
}
 
// =========================
// 5. REGISTRAR RETORNO ARCHIVO GENERAL
// =========================
// Payload:
// {
//   action: "registrar_retorno_archivo_general",
//   id_salida: "SAL-0001",
//   observacion: "Retornado sin novedades",
//   realizado_por: "USR-0001 - Luis Pérez"
// }
function registrarRetornoArchivoGeneral(data) {
  return ejecutarConLock(function () {
    const sheetSalida = getSheet(SHEET_SALIDA_ARCHIVO);
    const sheetGrupo  = getSheet(SHEET_GRUPO_ARCHIVO);
    const ESTADOS_SALIDA_ACTIVOS = ["ACTIVA", "PENDIENTE", "EN_PROCESO"];
 
    const id_salida   = String(data.id_salida   || "").trim();
    const observacion = String(data.observacion || "").trim();
    const realizado_por = String(data.realizado_por || "").trim();
 
    if (!id_salida || !realizado_por) {
      return { success: false, error: "Faltan campos: id_salida, realizado_por" };
    }
 
    const dataSalida    = sheetSalida.getDataRange().getValues();
    if (dataSalida.length <= 1) return { success: false, error: "No hay salidas registradas" };
 
    const headersSalida     = dataSalida[0];
    const colIdSalida       = headersSalida.indexOf("id_salida");
    const colEstadoSal      = headersSalida.indexOf("estado_salida");
    const colFechaRetorno   = headersSalida.indexOf("fecha_hora_retorno");
    const colObsSal         = headersSalida.indexOf("observacion");
    const colIdGrupoSal     = headersSalida.indexOf("id_grupo");
    const colActivoSal      = headersSalida.indexOf("activo");
 
    const ahora           = new Date();
    const ahoraStr        = Utilities.formatDate(ahora, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    let   id_grupo_retorn = "";
    let   encontrado      = false;
 
    for (let i = 1; i < dataSalida.length; i++) {
      if (
        String(dataSalida[i][colIdSalida]  || "").trim() === id_salida &&
        ESTADOS_SALIDA_ACTIVOS.indexOf(String(dataSalida[i][colEstadoSal] || "").trim().toUpperCase()) !== -1 &&
        String(dataSalida[i][colActivoSal] || "").trim().toUpperCase() === "SI"
      ) {
        id_grupo_retorn = String(dataSalida[i][colIdGrupoSal] || "").trim();
        sheetSalida.getRange(i + 1, colEstadoSal    + 1).setValue("RETORNADO");
        sheetSalida.getRange(i + 1, colFechaRetorno + 1).setValue(ahoraStr);
        if (observacion && colObsSal !== -1) {
          const obsActual = String(dataSalida[i][colObsSal] || "").trim();
          sheetSalida.getRange(i + 1, colObsSal + 1).setValue(
            obsActual ? obsActual + " | RETORNO: " + observacion : "RETORNO: " + observacion
          );
        }
        encontrado = true;
        break;
      }
    }
 
    if (!encontrado) return { success: false, error: "No se encontró una salida pendiente de retorno con ese id_salida" };
 
    // Volver estado del grupo a ACTIVO
    if (id_grupo_retorn) {
      const dataGrupo    = sheetGrupo.getDataRange().getValues();
      const headersGrupo = dataGrupo[0];
      _actualizarEstadoGrupo(sheetGrupo, headersGrupo, dataGrupo, id_grupo_retorn, "ACTIVO");

      // Actualizar estado de expedientes del grupo a RETORNADO
      const sheetDetalle = getSheet(SHEET_GRUPO_ARCHIVO_DETALLE);
      const dataDetalle = sheetDetalle.getDataRange().getValues();
      const headersDetalle = dataDetalle.length > 1 ? dataDetalle[0] : [];
      const rowsDetalle = dataDetalle.length > 1
        ? dataDetalle.slice(1).filter(r => r.some(c => c !== "")).map(r => mapRowToObject(headersDetalle, r))
        : [];

      const idsExpGrupo = rowsDetalle
        .filter(item => String(item.id_grupo || "").trim() === id_grupo_retorn && esActivo(item.activo))
        .map(item => String(item.id_expediente || "").trim())
        .filter(Boolean);

      if (idsExpGrupo.length > 0) {
        const sheetEXP = getSheet(SHEET_EXPEDIENTES);
        const dataEXP = sheetEXP.getDataRange().getValues();
        const headersEXP = dataEXP[0];
        const colIdExp = headersEXP.indexOf("id_expediente");
        const colEstado = headersEXP.indexOf("id_estado");
        const colFecAct = headersEXP.indexOf("fecha_actualizacion");
        const estadoRetornado = _resolverIdEstado(["RETORNADO", "REGISTRADO"], "");

        for (let i = 1; i < dataEXP.length; i++) {
          const idExp = String(dataEXP[i][colIdExp] || "").trim();
          if (idsExpGrupo.indexOf(idExp) === -1) continue;

          const fila = sheetEXP.getRange(i + 1, 1, 1, sheetEXP.getLastColumn()).getValues()[0];
          const estadoAnterior = String(fila[colEstado] || "").trim();
          if (colEstado !== -1 && estadoRetornado) fila[colEstado] = estadoRetornado;
          if (colFecAct !== -1) fila[colFecAct] = ahoraStr;
          sheetEXP.getRange(i + 1, 1, 1, sheetEXP.getLastColumn()).setValues([fila]);

          registrarMovimientoExpediente({
            id_expediente: idExp,
            tipo_movimiento: "RETORNO",
            ubicacion_origen: "EXTERNO",
            ubicacion_destino: "GRUPO: " + id_grupo_retorn,
            estado_anterior: estadoAnterior,
            estado_nuevo: estadoRetornado || estadoAnterior,
            motivo: "Retorno de salida de archivo general",
            observacion: observacion,
            realizado_por: realizado_por,
            destino_externo: ""
          });
        }
      }
    }
 
    return {
      success: true,
      message: "Retorno registrado correctamente",
      data: { id_salida, estado_salida: "RETORNADO", fecha_hora_retorno: ahoraStr, realizado_por }
    };
  });
}
 
// Actualiza estado_grupo en la hoja grupo_archivo_general
function _actualizarEstadoGrupo(sheetGrupo, headersGrupo, dataGrupo, id_grupo, nuevoEstado) {
  const colIdGrupo    = headersGrupo.indexOf("id_grupo");
  const colEstado     = headersGrupo.indexOf("estado_grupo");
  const colFecAct     = headersGrupo.indexOf("fecha_actualizacion");
  if (colIdGrupo === -1 || colEstado === -1) return;
 
  for (let i = 1; i < dataGrupo.length; i++) {
    if (String(dataGrupo[i][colIdGrupo] || "").trim() === id_grupo) {
      sheetGrupo.getRange(i + 1, colEstado + 1).setValue(nuevoEstado);
      if (colFecAct !== -1) {
        sheetGrupo.getRange(i + 1, colFecAct + 1).setValue(
          Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss")
        );
      }
      break;
    }
  }
}
 
// =========================
// GETS - LISTAR GRUPOS
// =========================
// GET ?action=listar_grupos_archivo_general
function listarGruposArchivoGeneral() {
  const sheet = getSheet(SHEET_GRUPO_ARCHIVO);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const headers = data[0];
  const rows    = data.slice(1).filter(r => r.some(c => c !== ""));
  const resultado = rows.map(row => mapRowToObject(headers, row))
    .filter(item => esActivo(item.activo))
    .sort((a, b) => String(b.fecha_creacion || "").localeCompare(String(a.fecha_creacion || "")));
  return { success: true, data: resultado };
}
 
// GET ?action=listar_detalle_grupo_archivo&id_grupo=GRP-0001
function listarDetalleGrupoArchivo(id_grupo) {
  if (!id_grupo) return { success: false, error: "Debe enviar id_grupo" };
 
  const sheetDetalle = getSheet(SHEET_GRUPO_ARCHIVO_DETALLE);
  const dataDetalle  = sheetDetalle.getDataRange().getValues();
  if (dataDetalle.length <= 1) return { success: true, data: [] };
 
  const headersDetalle = dataDetalle[0];
  const rowsDetalle    = dataDetalle.slice(1).filter(r => r.some(c => c !== ""))
    .map(r => mapRowToObject(headersDetalle, r))
    .filter(item => String(item.id_grupo || "").trim() === id_grupo && esActivo(item.activo));
 
  if (rowsDetalle.length === 0) return { success: true, data: [] };
 
  // Enriquecer con datos del expediente
  const sheetEXP   = getSheet(SHEET_EXPEDIENTES);
  const dataEXP    = sheetEXP.getDataRange().getValues();
  const headersEXP = dataEXP[0];
  const expMap     = {};
  dataEXP.slice(1).filter(r => r.some(c => c !== "")).forEach(r => {
    const obj = mapRowToObject(headersEXP, r);
    expMap[String(obj.id_expediente || "").trim()] = obj;
  });
 
  return {
    success: true,
    data: rowsDetalle.map(item => ({
      ...item,
      expediente: expMap[String(item.id_expediente || "").trim()] || null
    }))
  };
}
 
// GET ?action=obtener_grupo_con_detalle&id_grupo=GRP-0001
function obtenerGrupoConDetalle(id_grupo) {
  if (!id_grupo) return { success: false, error: "Debe enviar id_grupo" };
 
  const sheetGrupo = getSheet(SHEET_GRUPO_ARCHIVO);
  const dataGrupo  = sheetGrupo.getDataRange().getValues();
  if (dataGrupo.length <= 1) return { success: false, error: "No hay grupos registrados" };
 
  const headersGrupo = dataGrupo[0];
  const rowsGrupo    = dataGrupo.slice(1).filter(r => r.some(c => c !== ""));
  const grupo        = rowsGrupo.map(r => mapRowToObject(headersGrupo, r))
    .find(item => String(item.id_grupo || "").trim() === id_grupo);
  if (!grupo) return { success: false, error: "Grupo no encontrado: " + id_grupo };
 
  const detalleResult = listarDetalleGrupoArchivo(id_grupo);
  const salidasResult = listarSalidasArchivoGeneral(id_grupo);
 
  return {
    success: true,
    data: {
      ...grupo,
      expedientes: detalleResult.data || [],
      salidas:     salidasResult.data || []
    }
  };
}
 
// GET ?action=listar_salidas_archivo_general  (opcional: &id_grupo=GRP-0001)
function listarSalidasArchivoGeneral(id_grupo_filtro) {
  const sheet = getSheet(SHEET_SALIDA_ARCHIVO);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const headers = data[0];
  let rows = data.slice(1).filter(r => r.some(c => c !== "")).map(r => mapRowToObject(headers, r));
 
  if (id_grupo_filtro) {
    rows = rows.filter(item => String(item.id_grupo || "").trim() === id_grupo_filtro);
  }
 
  rows = rows
    .filter(item => esActivo(item.activo))
    .sort((a, b) => String(b.fecha_creacion || "").localeCompare(String(a.fecha_creacion || "")));
 
  return { success: true, data: rows };
}
// =========================
// ASIGNAR GRUPO COMPLETO A PAQUETE ARCHIVO
// =========================
// Payload esperado:
// {
//   action: "asignar_grupo_a_paquete_archivo",
//   id_grupo: "GRP-0001",
//   id_paquete_archivo: "PAQ-0001",
//   asignado_por: "USR-0001 - Luis Pérez"
// }
function asignarGrupoAPaqueteArchivo(data) {
  return ejecutarConLock(function () {
    const sheetDetalle = getSheet(SHEET_GRUPO_ARCHIVO_DETALLE);
    const sheetPA      = getSheet(SHEET_PAQUETES_ARCHIVO);
    const sheetPE      = getSheet(SHEET_PAQUETE_EXPEDIENTE);
    const sheetEXP     = getSheet(SHEET_EXPEDIENTES);
    const sheetGrupo   = getSheet(SHEET_GRUPO_ARCHIVO);

    const id_grupo           = String(data.id_grupo           || "").trim();
    const id_paquete_archivo = String(data.id_paquete_archivo || "").trim();
    const asignado_por       = String(data.asignado_por       || "").trim();

    if (!id_grupo || !id_paquete_archivo || !asignado_por) {
      return { success: false, error: "Faltan campos obligatorios: id_grupo, id_paquete_archivo, asignado_por" };
    }

    // --- 1. Validar que el grupo existe y está activo ---
    const dataGrupo    = sheetGrupo.getDataRange().getValues();
    const headersGrupo = dataGrupo[0];
    const rowsGrupo    = dataGrupo.slice(1).filter(r => r.some(c => c !== ""));
    const grupo        = rowsGrupo.map(r => mapRowToObject(headersGrupo, r))
      .find(item => String(item.id_grupo || "").trim() === id_grupo && esActivo(item.activo));
    if (!grupo) return { success: false, error: "Grupo no encontrado o inactivo: " + id_grupo };

    // --- 2. Validar que el paquete archivo existe y está activo ---
    const dataPA    = sheetPA.getDataRange().getValues();
    const headersPA = dataPA[0];
    const rowsPA    = dataPA.slice(1).filter(r => r.some(c => c !== ""));
    const paqueteArchivo = rowsPA.map(r => mapRowToObject(headersPA, r))
      .find(item => String(item.id_paquete_archivo || "").trim() === id_paquete_archivo && esActivo(item.activo));
    if (!paqueteArchivo) return { success: false, error: "Paquete archivo no encontrado o inactivo: " + id_paquete_archivo };

    // --- 3. Obtener expedientes activos del grupo ---
    const dataDetalle    = sheetDetalle.getDataRange().getValues();
    const headersDetalle = dataDetalle.length > 1 ? dataDetalle[0] : [];
    const rowsDetalle    = dataDetalle.length > 1
      ? dataDetalle.slice(1).filter(r => r.some(c => c !== "")).map(r => mapRowToObject(headersDetalle, r))
      : [];

    const expedientesDelGrupo = rowsDetalle.filter(
      item => String(item.id_grupo || "").trim() === id_grupo && esActivo(item.activo)
    );
    if (expedientesDelGrupo.length === 0) {
      return { success: false, error: "El grupo no tiene expedientes activos asignados" };
    }

    // --- 4. Cargar hoja expedientes como mapa id → fila ---
    const dataEXP    = sheetEXP.getDataRange().getValues();
    const headersEXP = dataEXP[0];
    const colIdExpEXP    = headersEXP.indexOf("id_expediente");
    const colIdPaqEXP    = headersEXP.indexOf("id_paquete");
    const colEstadoEXP   = headersEXP.indexOf("id_estado");
    const colFecActEXP   = headersEXP.indexOf("fecha_actualizacion");

    const expRowIndexMap = {};  // id_expediente → rowIndex (1-based, para getRange)
    const expObjMap      = {};  // id_expediente → objeto mapeado
    for (let i = 1; i < dataEXP.length; i++) {
      const idExp = String(dataEXP[i][colIdExpEXP] || "").trim();
      if (idExp) {
        expRowIndexMap[idExp] = i + 1;
        expObjMap[idExp]      = mapRowToObject(headersEXP, dataEXP[i]);
      }
    }

    // --- 5. Cargar hoja paquete_expediente para manejar reasignaciones ---
    const dataPE    = sheetPE.getDataRange().getValues();
    const headersPE = dataPE.length > 1 ? dataPE[0] : [];
    const colIdExpPE    = headersPE.indexOf("id_expediente");
    const colActivoPE   = headersPE.indexOf("activo");
    const colFecActPE   = headersPE.indexOf("fecha_actualizacion");
    const colEstadoPE   = headersPE.indexOf("estado_asignacion");
    const colFecEstPE   = headersPE.indexOf("fecha_estado");
    const colIdPaqPE    = headersPE.indexOf("id_paquete_archivo");

    const ahoraStr = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const resultados = [];
    let asignados    = 0;
    let reasignados  = 0;

    expedientesDelGrupo.forEach(function (detalle) {
      const id_expediente = String(detalle.id_expediente || "").trim();
      if (!id_expediente) {
        resultados.push({ id_expediente, success: false, mensaje: "ID de expediente vacío en el detalle del grupo" });
        return;
      }

      const expediente = expObjMap[id_expediente];
      if (!expediente) {
        resultados.push({ id_expediente, success: false, mensaje: "Expediente no encontrado en la hoja de expedientes" });
        return;
      }

      // --- 5a. Desactivar asignación anterior en paquete_expediente (si existe) ---
      let rotuloPaqueteAnterior = "";
      if (colIdExpPE !== -1 && colActivoPE !== -1) {
        for (let i = 1; i < dataPE.length; i++) {
          if (
            String(dataPE[i][colIdExpPE]  || "").trim() === id_expediente &&
            String(dataPE[i][colActivoPE] || "").trim().toUpperCase() === "SI"
          ) {
            // Obtener rótulo anterior antes de desactivar
            if (colIdPaqPE !== -1) {
              const idPaqAnt = String(dataPE[i][colIdPaqPE] || "").trim();
              if (idPaqAnt) {
                const paqAnt = rowsPA.find(item => String(item.id_paquete_archivo || "").trim() === idPaqAnt);
                if (paqAnt) rotuloPaqueteAnterior = String(paqAnt.rotulo_paquete || "").trim();
              }
            }
            sheetPE.getRange(i + 1, colActivoPE + 1).setValue("NO");
            if (colEstadoPE  !== -1) sheetPE.getRange(i + 1, colEstadoPE  + 1).setValue("DISPONIBLE");
            if (colFecEstPE  !== -1) sheetPE.getRange(i + 1, colFecEstPE  + 1).setValue(ahoraStr);
            if (colFecActPE  !== -1) sheetPE.getRange(i + 1, colFecActPE  + 1).setValue(ahoraStr);
          }
        }
      }

      // --- 5b. Insertar nueva asignación en paquete_expediente ---
      const id_paquete_expediente = generarID(sheetPE, "PEXP");
      sheetPE.appendRow(buildRowFromHeaders(sheetPE, {
        id_paquete_expediente,
        id_paquete_archivo,
        id_expediente,
        fecha_asignacion:   ahoraStr,
        asignado_por,
        estado_asignacion:  "ASIGNADO",
        fecha_estado:       ahoraStr,
        activo:             "SI"
      }));

      // --- 5c. Actualizar campo id_paquete en la hoja expedientes ---
      const rowExpediente = expRowIndexMap[id_expediente];
      if (rowExpediente && colIdPaqEXP !== -1) {
        const filaEXP = sheetEXP.getRange(rowExpediente, 1, 1, sheetEXP.getLastColumn()).getValues()[0];
        const estadoAnterior = String(filaEXP[colEstadoEXP] || "").trim();
        const estadoArchivado = _resolverIdEstado(["ARCHIVADO", "ENVIADO_A_ARCHIVO"], estadoAnterior);
        filaEXP[colIdPaqEXP] = id_paquete_archivo;
        if (colEstadoEXP !== -1) filaEXP[colEstadoEXP] = estadoArchivado;
        if (colFecActEXP !== -1) filaEXP[colFecActEXP] = ahoraStr;
        sheetEXP.getRange(rowExpediente, 1, 1, sheetEXP.getLastColumn()).setValues([filaEXP]);

        // --- 5d. Registrar movimiento ---
        const estaReasignando = rotuloPaqueteAnterior !== "";
        registrarMovimientoExpediente({
          id_expediente,
          tipo_movimiento:   estaReasignando ? "REASIGNACION_PAQUETE" : "ASIGNACION_PAQUETE",
          ubicacion_origen:  rotuloPaqueteAnterior,
          ubicacion_destino: paqueteArchivo.rotulo_paquete || "",
          estado_anterior:   estadoAnterior,
          estado_nuevo:      estadoArchivado,
          motivo:            "Asignación masiva desde grupo " + grupo.codigo_grupo,
          observacion:       "",
          realizado_por:     asignado_por,
          destino_externo:   ""
        });

        if (estaReasignando) reasignados++; else asignados++;
        resultados.push({
          id_expediente,
          success:  true,
          operacion: estaReasignando ? "REASIGNADO" : "ASIGNADO",
          mensaje:   estaReasignando
            ? "Reasignado desde " + rotuloPaqueteAnterior
            : "Asignado correctamente"
        });
      }
    });

    const fallidos = resultados.filter(r => !r.success).length;

    return {
      success: true,
      message: `${asignados} asignados, ${reasignados} reasignados, ${fallidos} fallidos — grupo: ${grupo.codigo_grupo} → paquete: ${paqueteArchivo.rotulo_paquete}`,
      data: {
        id_grupo,
        codigo_grupo:       grupo.codigo_grupo,
        id_paquete_archivo,
        rotulo_paquete:     paqueteArchivo.rotulo_paquete,
        total_procesados:   resultados.length,
        asignados,
        reasignados,
        fallidos,
        detalle:            resultados
      }
    };
  });
}

function validarPayloadMayusculas(valor, clavesExcluidas, rutaActual) {
  const excluidas = Array.isArray(clavesExcluidas) ? clavesExcluidas : [];
  const ruta = String(rutaActual || "");

  if (valor === null || valor === undefined) {
    return { success: true };
  }

  if (typeof valor === "string") {
    const contieneMinusculas = /[a-záéíóúñü]/.test(valor);
    if (contieneMinusculas) {
      return {
        success: false,
        error: "Solo se permite MAYUSCULAS. Campo inválido: " + (ruta || "VALOR")
      };
    }
    return { success: true };
  }

  if (Array.isArray(valor)) {
    for (let i = 0; i < valor.length; i++) {
      const check = validarPayloadMayusculas(valor[i], excluidas, ruta ? (ruta + "[" + i + "]") : ("[" + i + "]"));
      if (!check.success) return check;
    }
    return { success: true };
  }

  if (typeof valor === "object") {
    const keys = Object.keys(valor);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (excluidas.indexOf(key) !== -1) continue;
      const nextPath = ruta ? (ruta + "." + key) : key;
      const check = validarPayloadMayusculas(valor[key], excluidas, nextPath);
      if (!check.success) return check;
    }
  }

  return { success: true };
}

function normalizarPayloadAMayusculas(valor, clavesExcluidas, claveActual) {
  const excluidas = Array.isArray(clavesExcluidas) ? clavesExcluidas : [];
  const clave = String(claveActual || "");

  if (valor === null || valor === undefined) return valor;

  if (typeof valor === "string") {
    if (clave && excluidas.indexOf(clave) !== -1) return valor;
    return valor.toUpperCase();
  }

  if (Array.isArray(valor)) {
    return valor.map(function(item) {
      return normalizarPayloadAMayusculas(item, excluidas, "");
    });
  }

  if (typeof valor === "object") {
    const out = {};
    const keys = Object.keys(valor);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (excluidas.indexOf(key) !== -1) {
        out[key] = valor[key];
      } else {
        out[key] = normalizarPayloadAMayusculas(valor[key], excluidas, key);
      }
    }
    return out;
  }

  return valor;
}