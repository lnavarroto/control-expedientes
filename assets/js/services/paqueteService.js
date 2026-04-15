/**
 * Servicio de Paquetes
 * Usa cache local (backend no soporta endpoint listar_paquetes aún)
 */

import { appConfig } from "../config.js";
import { PAQUETES_INICIALES } from "../data/mockData.js";
import { expedienteService } from "./expedienteService.js";
import { STORAGE_KEYS, writeJson, readJson, uid } from "../utils/storage.js";

const STORAGE_KEY = STORAGE_KEYS.paquetes || "paquetes";
const CACHE_TIMESTAMP_KEY = "paquetes_tiempo";
const CACHE_TIME = 3600000; // 1 hora en milisegundos

function guardar(paquetes) {
  writeJson(STORAGE_KEY, paquetes);
}

export const paqueteService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PAQUETES_INICIALES));
    }
  },

  // Precargar datos (en futuro, cuando backend support listar_paquetes)
  async precargar() {
    console.log("⚠️ Paquetes: usando cache local (backend aún no soporta endpoint listar_paquetes)");
    // Por ahora solo retorna desde cache
    return this.listarSync();
  },

  // Obtener del caché localmente (instantáneo, sin HTTP)
  listarSync() {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : PAQUETES_INICIALES;
  },

  // Obtener datos del cache local
  async listar() {
    return this.listarSync();
  },

  crear({ codigo, descripcion }) {
    const paquetes = this.listarSync();
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
