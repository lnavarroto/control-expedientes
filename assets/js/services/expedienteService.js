import {
  ESTADOS_EXPEDIENTE,
  EXPEDIENTES_INICIALES,
  MOVIMIENTOS_INICIALES
} from "../data/mockData.js";
import {
  STORAGE_KEYS,
  ensureCollection,
  readJson,
  uid,
  writeJson
} from "../utils/storage.js";
import { parseNumeroExpediente } from "../utils/expedienteParser.js";

function initData() {
  ensureCollection(STORAGE_KEYS.expedientes, EXPEDIENTES_INICIALES);
  ensureCollection(STORAGE_KEYS.movimientos, MOVIMIENTOS_INICIALES);
}

function guardarExpedientes(expedientes) {
  writeJson(STORAGE_KEYS.expedientes, expedientes);
}

function guardarMovimientos(movimientos) {
  writeJson(STORAGE_KEYS.movimientos, movimientos);
}

function filtrarTexto(base, texto) {
  return base.toLowerCase().includes((texto || "").toLowerCase());
}

export const expedienteService = {
  init() {
    initData();
  },

  estados() {
    return ESTADOS_EXPEDIENTE;
  },

  listar() {
    return readJson(STORAGE_KEYS.expedientes, []);
  },

  listarMovimientos() {
    return readJson(STORAGE_KEYS.movimientos, []);
  },

  obtener(id) {
    return this.listar().find((item) => item.id === id);
  },

  detectarCampos(numeroExpediente) {
    return parseNumeroExpediente(numeroExpediente);
  },

  guardar(payload) {
    const expedientes = this.listar();
    const existente = expedientes.find((item) => item.id === payload.id);

    if (existente) {
      Object.assign(existente, payload);
      guardarExpedientes(expedientes);
      return existente;
    }

    const nuevo = {
      ...payload,
      id: uid("EXP")
    };
    expedientes.unshift(nuevo);
    guardarExpedientes(expedientes);

    this.registrarMovimiento({
      expedienteId: nuevo.id,
      numeroExpediente: nuevo.numeroExpediente,
      origen: "Mesa de partes",
      destino: nuevo.ubicacionActual,
      motivo: "Registro inicial",
      observacion: nuevo.observaciones || "Registro de expediente"
    });

    return nuevo;
  },

  actualizarUbicacionEstado({ id, ubicacionActual, estado, motivo, observacion, usuario = "OPERADOR" }) {
    const expedientes = this.listar();
    const expediente = expedientes.find((item) => item.id === id);
    if (!expediente) return null;

    const origen = expediente.ubicacionActual;
    expediente.ubicacionActual = ubicacionActual || expediente.ubicacionActual;
    expediente.estado = estado || expediente.estado;

    guardarExpedientes(expedientes);

    this.registrarMovimiento({
      expedienteId: expediente.id,
      numeroExpediente: expediente.numeroExpediente,
      origen,
      destino: expediente.ubicacionActual,
      motivo: motivo || "Actualizacion de ubicacion",
      observacion: observacion || "Sin observaciones",
      usuario
    });

    return expediente;
  },

  registrarMovimiento({ expedienteId, numeroExpediente, origen, destino, motivo, observacion, usuario = "OPERADOR" }) {
    const movimientos = this.listarMovimientos();
    const now = new Date();
    movimientos.unshift({
      id: uid("MOV"),
      expedienteId,
      numeroExpediente,
      fecha: now.toISOString().slice(0, 10),
      hora: now.toTimeString().slice(0, 5),
      usuario,
      origen,
      destino,
      motivo,
      observacion
    });
    guardarMovimientos(movimientos);
  },

  buscar(filtros = {}) {
    return this.listar().filter((item) => {
      const cumpleTexto = !filtros.texto || filtrarTexto(JSON.stringify(item), filtros.texto);
      const cumpleMateria = !filtros.materia || item.materia === filtros.materia;
      const cumpleJuzgado = !filtros.juzgado || item.juzgado === filtros.juzgado;
      const cumplePaquete = !filtros.paqueteId || item.paqueteId === filtros.paqueteId;
      const cumpleUbicacion = !filtros.ubicacionActual || item.ubicacionActual === filtros.ubicacionActual;
      const cumpleEstado = !filtros.estado || item.estado === filtros.estado;
      const cumpleFecha = !filtros.fechaIngreso || item.fechaIngreso === filtros.fechaIngreso;

      return (
        cumpleTexto &&
        cumpleMateria &&
        cumpleJuzgado &&
        cumplePaquete &&
        cumpleUbicacion &&
        cumpleEstado &&
        cumpleFecha
      );
    });
  },

  obtenerResumen() {
    const expedientes = this.listar();
    const hoy = new Date().toISOString().slice(0, 10);

    return {
      hoy: expedientes.filter((item) => item.fechaIngreso === hoy).length,
      paquetes: expedientes.filter((item) => Boolean(item.paqueteId)).length,
      transito: expedientes.filter((item) => item.estado === "En transito").length,
      ubicados: expedientes.filter((item) => item.estado === "Ubicado").length,
      retirados: expedientes.filter((item) => item.estado === "Prestado" || item.estado === "Derivado").length
    };
  }
};
