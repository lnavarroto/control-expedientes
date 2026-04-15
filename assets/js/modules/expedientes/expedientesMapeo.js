/**
 * Utilidades para mapeo de estados y datos del backend
 */

import { estadoService } from "../../services/estadoService.js";
import { materiaService } from "../../services/materiaService.js";
import { juzgadoService } from "../../services/juzgadoService.js";

/**
 * Formatear fecha ISO a DD/MM/YYYY HH:MM:SS
 */
export function formatearFecha(fechaStr, horaStr = null) {
  if (!fechaStr) return "---";
  
  try {
    // Si es ISO format (2026-04-15T07:00:00.000Z)
    if (fechaStr.includes("T")) {
      const fecha = new Date(fechaStr);
      const dia = String(fecha.getDate()).padStart(2, "0");
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const año = fecha.getFullYear();
      const horas = String(fecha.getHours()).padStart(2, "0");
      const minutos = String(fecha.getMinutes()).padStart(2, "0");
      const segundos = String(fecha.getSeconds()).padStart(2, "0");
      return `${dia}/${mes}/${año} ${horas}:${minutos}:${segundos}`;
    }
    
    // Si es formato DD/MM/YYYY o similar, retornar como está
    if (fechaStr.includes("/")) {
      return horaStr ? `${fechaStr} ${horaStr}` : fechaStr;
    }
    
    // Si es YYYY-MM-DD
    if (fechaStr.includes("-")) {
      const [año, mes, dia] = fechaStr.split("-");
      return `${dia}/${mes}/${año}` + (horaStr ? ` ${horaStr}` : "");
    }
    
    return fechaStr;
  } catch (error) {
    console.warn("Error formateando fecha:", error);
    return fechaStr || "---";
  }
}

/**
 * Obtener nombre de estado por ID
 */
export function obtenerNombreEstado(idEstado) {
  const estados = estadoService.listarSync();
  if (!estados || estados.length === 0) {
    return idEstado || "---";
  }

  const estado = estados.find(e => 
    e.id === idEstado || e.id === idEstado?.toString()
  );
  
  return estado ? estado.nombre : idEstado || "---";
}

/**
 * Obtener color de estado por ID
 */
export function obtenerColorEstado(idEstado) {
  const estados = estadoService.listarSync();
  const estado = estados.find(e => 
    e.id === idEstado || e.id === idEstado?.toString()
  );
  
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
  return {
    codigo: exp.codigo_expediente_completo || "---",
    numero: exp.numero_expediente || "---",
    anio: exp.anio || "---",
    incidente: exp.incidente || "---",
    corte: exp.codigo_corte || "---",
    organo: exp.tipo_organo || "---",
    materia: obtenerNombreMateria(exp.codigo_materia),
    juzgado: exp.juzgado_texto || obtenerNombreJuzgado(exp.id_juzgado) || "---",
    ingreso: formatearFecha(exp.fecha_ingreso, exp.hora_ingreso),
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
      fechaIngreso: formatearFecha(exp.fecha_ingreso, exp.hora_ingreso),
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
  
  const estadoHtml = `
    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold 
      bg-${formateado.estadoColor}-100 text-${formateado.estadoColor}-700">
      ${formateado.estado}
    </span>
  `;

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
