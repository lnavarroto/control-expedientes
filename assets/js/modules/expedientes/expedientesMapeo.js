/**
 * Utilidades para mapeo de estados y datos del backend
 */

import { estadoService } from "../../services/estadoService.js";
import { materiaService } from "../../services/materiaService.js";
import { juzgadoService } from "../../services/juzgadoService.js";
import { statusBadge } from "../../components/statusBadge.js";

const TZ_FIJA = "America/Lima";

function _normalizarIdEstado(valor) {
  const texto = String(valor || "").trim().toUpperCase();
  if (!texto) return "";
  const soloDigitos = texto.replace(/\D+/g, "");
  if (!soloDigitos) return texto;
  return String(parseInt(soloDigitos, 10));
}

function extraerFechaVisual(valor) {
  if (!valor) return null;
  const texto = String(valor).trim();

  // YYYY-MM-DD (tambien cubre ISO: YYYY-MM-DDTHH:mm:ss)
  const isoDate = texto.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    const [, anio, mes, dia] = isoDate;
    return `${dia}/${mes}/${anio}`;
  }

  // DD/MM/YYYY
  const localDate = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (localDate) {
    const [, dia, mes, anio] = localDate;
    return `${dia}/${mes}/${anio}`;
  }

  return null;
}

function extraerHoraVisual(valor) {
  if (!valor) return null;
  const texto = String(valor).trim();

  // Hora serializada por Google Sheets (ej: 1899-12-30T20:07:12.000Z)
  // Se convierte a hora fija de Lima para recuperar la hora real registrada.
  if (/^1899-12-30T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(texto)) {
    const dt = new Date(texto);
    if (!Number.isNaN(dt.getTime())) {
      return new Intl.DateTimeFormat("es-PE", {
        timeZone: TZ_FIJA,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(dt);
    }
  }

  // HH:mm:ss (incluye casos como 1899-12-30T23:00:35.000Z)
  const hhmmss = texto.match(/(\d{2}:\d{2}:\d{2})/);
  if (hhmmss) return hhmmss[1];

  // HH:mm
  const hhmm = texto.match(/(\d{2}:\d{2})/);
  if (hhmm) return `${hhmm[1]}:00`;

  return null;
}

function formatearDesdeFechaHoraPlano(valor) {
  if (!valor) return null;
  const texto = String(valor).trim();

  // Fecha-hora ISO UTC enviada por Apps Script/JSON
  if (texto.includes("T") && texto.endsWith("Z")) {
    const dt = new Date(texto);
    if (!Number.isNaN(dt.getTime())) {
      const fecha = new Intl.DateTimeFormat("es-PE", {
        timeZone: TZ_FIJA,
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }).format(dt);
      const hora = new Intl.DateTimeFormat("es-PE", {
        timeZone: TZ_FIJA,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(dt);
      return `${fecha} ${hora}`;
    }
  }

  const match = texto.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (!match) return null;
  const [, anio, mes, dia, hora] = match;
  return `${dia}/${mes}/${anio} ${hora}`;
}

/**
 * Formatea fecha/hora sin conversiones de zona horaria.
 * Ejemplos de entrada validos:
 * - fechaStr: 2026-04-15, horaStr: 15:13:04
 * - fechaStr: 2026-04-15T07:00:00.000Z, horaStr: 1899-12-30T23:00:35.000Z
 * - fechaStr: 2026-04-15 15:13:04
 */
export function formatearFecha(fechaStr, horaStr = null) {
  try {
    const fecha = extraerFechaVisual(fechaStr);
    if (!fecha) return "---";

    const hora = extraerHoraVisual(horaStr) || extraerHoraVisual(fechaStr);
    return hora ? `${fecha} ${hora}` : fecha;
  } catch (error) {
    console.warn("Error formateando fecha:", error, "fechaStr:", fechaStr, "horaStr:", horaStr);
    return "---";
  }
}

function resolverFechaHoraIngreso(exp) {
  const textoCompleto = String(exp.fecha_hora_ingreso || "").trim();

  // 🔴 NUEVO: si ya viene listo (dd/MM/yyyy HH:mm:ss), devolver directo
  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(textoCompleto)) {
    return textoCompleto;
  }

  // 1) Priorizar campos separados
  const fecha = extraerFechaVisual(exp.fecha_ingreso);
  const hora = extraerHoraVisual(exp.hora_ingreso);
  if (fecha && hora) return `${fecha} ${hora}`;

  // 2) Fallback: campo combinado
  const desdeFechaHoraIngreso = formatearDesdeFechaHoraPlano(exp.fecha_hora_ingreso);
  if (desdeFechaHoraIngreso) return desdeFechaHoraIngreso;

  // 3) Último fallback
  return formatearFecha(exp.fecha_ingreso, exp.hora_ingreso);
}

/**
 * Obtener nombre de estado por ID
 */
export function obtenerNombreEstado(idEstado) {
  const estados = estadoService.listarSync();
  if (!estados || estados.length === 0) {
    return idEstado || "---";
  }

  const idBuscadoRaw = String(idEstado || "").trim();
  const idBuscadoNorm = _normalizarIdEstado(idBuscadoRaw);

  const estado = estados.find((e) => {
    const idRaw = String(e.id || "").trim();
    if (!idRaw) return false;
    if (idRaw === idBuscadoRaw) return true;
    return _normalizarIdEstado(idRaw) === idBuscadoNorm;
  });
  
  return estado ? estado.nombre : idEstado || "---";
}

/**
 * Obtener color de estado por ID
 */
export function obtenerColorEstado(idEstado) {
  const estados = estadoService.listarSync();
  const idBuscadoRaw = String(idEstado || "").trim();
  const idBuscadoNorm = _normalizarIdEstado(idBuscadoRaw);
  const estado = estados.find((e) => {
    const idRaw = String(e.id || "").trim();
    if (!idRaw) return false;
    if (idRaw === idBuscadoRaw) return true;
    return _normalizarIdEstado(idRaw) === idBuscadoNorm;
  });
  
  return estado?.color || "slate";
}

/**
 * Obtener nombre de materia por código
 */
export function obtenerNombreMateria(codigoMateria) {
  const materias = materiaService.listarSync();
  if (!materias || materias.length === 0) {
    return codigoMateria || "---";
  }

  const materia = materias.find(m => 
    m.codigo === codigoMateria || 
    m.abreviatura === codigoMateria
  );
  
  return materia ? `${materia.abreviatura} - ${materia.nombre}` : codigoMateria || "---";
}

/**
 * Obtener nombre de juzgado por ID
 */
export function obtenerNombreJuzgado(idJuzgado) {
  const juzgados = juzgadoService.listarSync();
  if (!juzgados || juzgados.length === 0) {
    return idJuzgado || "---";
  }

  const juzgado = juzgados.find(j => 
    j.id === idJuzgado || j.id === idJuzgado?.toString()
  );
  
  return juzgado ? juzgado.nombre : idJuzgado || "---";
}

/**
 * Formatear expediente para mostrar en tabla
 */
export function formatearExpediente(exp, estadoMap = null) {
  const fechaHoraIngreso = resolverFechaHoraIngreso(exp);

  return {
    codigo: exp.codigo_expediente_completo || "---",
    numero: exp.numero_expediente || "---",
    anio: exp.anio || "---",
    incidente: exp.incidente || "---",
    corte: exp.codigo_corte || "---",
    organo: exp.tipo_organo || "---",
    materia: obtenerNombreMateria(exp.codigo_materia),
    juzgado: exp.juzgado_texto || obtenerNombreJuzgado(exp.id_juzgado) || "---",
    ingreso: fechaHoraIngreso,
    ubicacion: exp.ubicacion || "---",
    estado: obtenerNombreEstado(exp.id_estado),
    estadoColor: obtenerColorEstado(exp.id_estado),
    registradoPor: exp.registrado_por || "---",
    observaciones: exp.observaciones || "---",
    activo: exp.activo === "SI" || exp.activo === true ? "✓" : "✗",
    // Datos completos para modal
    detalles: {
      numeroCompleto: exp.numero_expediente,
      anio: exp.anio,
      incidente: exp.incidente,
      codigoCorte: exp.codigo_corte,
      materia: obtenerNombreMateria(exp.codigo_materia),
      juzgado: exp.juzgado_texto || obtenerNombreJuzgado(exp.id_juzgado),
      fechaIngreso: fechaHoraIngreso,
      ubicacion: exp.ubicacion,
      estado: obtenerNombreEstado(exp.id_estado),
      registradoPor: exp.registrado_por,
      observaciones: exp.observaciones,
      id: exp.id
    }
  };
}

/**
 * Formatear fila para mostrar en tabla Bootstrap
 */
export function formatearFilaTabla(exp) {
  const formateado = formatearExpediente(exp);
  const estadoHtml = statusBadge(formateado.estado);

  return {
    codigo: formateado.codigo,
    numero: formateado.numero,
    materia: formateado.materia,
    juzgado: formateado.juzgado,
    ingreso: formateado.ingreso,
    estado: estadoHtml,
    registradoPor: formateado.registradoPor,
    observaciones: formateado.observaciones
  };
}
