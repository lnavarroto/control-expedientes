/**
 * Servicio de Paquetes
 * Lee paquetes activos desde backend y mantiene cache local.
 */

import { PAQUETES_INICIALES } from "../data/mockData.js";
import { expedienteService } from "./expedienteService.js";
import { STORAGE_KEYS, writeJson, readJson, uid } from "../utils/storage.js";
import { appConfig } from "../config.js";

const STORAGE_KEY = STORAGE_KEYS.paquetes || "paquetes";
const CACHE_TIMESTAMP_KEY = "paquetes_tiempo";
const CACHE_TIME = 3600000; // 1 hora en milisegundos

function guardar(paquetes) {
  writeJson(STORAGE_KEY, paquetes);
}

function refrescarTimestampCache() {
  localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
}

function normalizarPaquete(item = {}) {
  const id = String(item.id_paquete || item.id || item.codigo_paquete || item.codigo || "").trim();
  return {
    id,
    codigo: String(item.codigo_paquete || item.codigo || id || "-").trim(),
    descripcion: String(item.descripcion_paquete || item.descripcion || item.nombre_paquete || "Sin descripcion").trim(),
    fechaCreacion: String(item.fecha_creacion || item.fecha_registro || item.fecha || "").trim()
  };
}

function cacheVigente() {
  const timestamp = Number(localStorage.getItem(CACHE_TIMESTAMP_KEY) || 0);
  return timestamp && (Date.now() - timestamp) < CACHE_TIME;
}

export const paqueteService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PAQUETES_INICIALES));
    }
  },

  // Precargar catálogo de paquetes desde backend
  async precargar() {
    return this.listar();
  },

  // Obtener del caché localmente (instantáneo, sin HTTP)
  listarSync() {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : PAQUETES_INICIALES;
  },

  // Obtener datos de backend y cachear
  async listar() {
    if (cacheVigente()) {
      return this.listarSync();
    }

    try {
      const url = `${appConfig.googleSheetURL}?action=listar_paquetes_activos&_ts=${Date.now()}`;
      const response = await fetch(url, { method: "GET", cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const resultado = await response.json();
      if (!resultado?.success || !Array.isArray(resultado.data)) {
        throw new Error("Respuesta invalida de listar_paquetes_activos");
      }

      const normalizados = resultado.data
        .map(normalizarPaquete)
        .filter((p) => p.id);

      guardar(normalizados);
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      return normalizados;
    } catch (error) {
      console.warn("⚠️ Error listando paquetes del backend, usando cache local:", error);
      return this.listarSync();
    }
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
    refrescarTimestampCache();
    return nuevo;
  },

  crearContinuacion({ paqueteBaseId, descripcion = "" }) {
    const paquetes = this.listarSync();
    const base = paquetes.find((p) => String(p.id) === String(paqueteBaseId));
    if (!base) return null;

    const codigoBase = String(base.codigo || "").trim();
    if (!codigoBase) return null;

    const patron = new RegExp(`^${codigoBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-C(\\d{2})$`, "i");
    const maxCorrelativo = paquetes.reduce((max, item) => {
      const match = String(item.codigo || "").trim().match(patron);
      if (!match) return max;
      const n = Number(match[1]);
      return Number.isNaN(n) ? max : Math.max(max, n);
    }, 0);

    const siguiente = String(maxCorrelativo + 1).padStart(2, "0");
    const codigo = `${codigoBase}-C${siguiente}`;
    const descripcionFinal = (descripcion || `Continuacion de ${codigoBase}`).trim();

    return this.crear({ codigo, descripcion: descripcionFinal });
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
