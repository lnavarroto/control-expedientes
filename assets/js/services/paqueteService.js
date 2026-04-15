import { PAQUETES_INICIALES } from "../data/mockData.js";
import { expedienteService } from "./expedienteService.js";
import { STORAGE_KEYS, ensureCollection, readJson, uid, writeJson } from "../utils/storage.js";

function initPaquetes() {
  ensureCollection(STORAGE_KEYS.paquetes, PAQUETES_INICIALES);
}

function guardar(paquetes) {
  writeJson(STORAGE_KEYS.paquetes, paquetes);
}

export const paqueteService = {
  init() {
    initPaquetes();
  },

  listar() {
    return readJson(STORAGE_KEYS.paquetes, []);
  },

  crear({ codigo, descripcion }) {
    const paquetes = this.listar();
    const nuevo = {
      id: uid("PQT"),
      codigo,
      descripcion,
      fechaCreacion: new Date().toISOString().slice(0, 10)
    };
    paquetes.unshift(nuevo);
    guardar(paquetes);
    return nuevo;
  },

  contarExpedientes(paqueteId) {
    return expedienteService.listar().filter((item) => item.paqueteId === paqueteId).length;
  },

  asignarExpediente({ expedienteId, paqueteId }) {
    const expediente = expedienteService.obtener(expedienteId);
    if (!expediente) return null;

    expedienteService.guardar({
      ...expediente,
      paqueteId,
      estado: "En paquete"
    });

    return expedienteService.obtener(expedienteId);
  },

  quitarExpediente(expedienteId) {
    const expediente = expedienteService.obtener(expedienteId);
    if (!expediente) return null;

    expedienteService.guardar({
      ...expediente,
      paqueteId: "",
      estado: "Ubicado"
    });

    return expedienteService.obtener(expedienteId);
  }
};
