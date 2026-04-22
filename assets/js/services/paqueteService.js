/**
 * Servicio de Paquetes
 * Lee paquetes activos desde backend y mantiene cache en memoria.
 */

import { appConfig } from "../config.js";

const STORAGE_KEY_LEGACY = "paquetes";
const CACHE_TIMESTAMP_KEY_LEGACY = "paquetes_tiempo";
const CACHE_TIME = 300000; // 5 minutos

let paquetesCache = [];
let cacheTimestamp = 0;
let inFlightListar = null;

function normalizarPaquete(item = {}) {
  const id = String(item.id_paquete || item.id || item.codigo_paquete || item.codigo || "").trim();
  return {
    id,
    codigo: String(item.codigo_paquete || item.codigo || id || "-").trim(),
    descripcion: String(item.descripcion_paquete || item.descripcion || item.nombre_paquete || "Sin descripcion").trim(),
    fechaCreacion: String(item.fecha_creacion || item.fecha_registro || item.fecha || "").trim()
  };
}

export const paqueteService = {
  init() {
    // Limpia residuos de versiones antiguas que guardaban paquetes en localStorage.
    try {
      localStorage.removeItem(STORAGE_KEY_LEGACY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY_LEGACY);
    } catch {
      // No-op
    }
    paquetesCache = [];
    cacheTimestamp = 0;
    inFlightListar = null;
  },

  // Precargar catálogo de paquetes desde backend
  async precargar() {
    return this.listar();
  },

  // Obtener del caché en memoria (instantáneo, sin HTTP)
  listarSync() {
    return Array.isArray(paquetesCache) ? [...paquetesCache] : [];
  },

  // Obtener datos de backend y cachear en memoria
  async listar(options = {}) {
    const { forceRefresh = false } = options;
    const cacheVigente = paquetesCache.length > 0 && (Date.now() - cacheTimestamp) < CACHE_TIME;

    if (!forceRefresh && cacheVigente) {
      return this.listarSync();
    }

    if (!forceRefresh && inFlightListar) {
      return inFlightListar;
    }

    inFlightListar = (async () => {
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

        paquetesCache = normalizados;
        cacheTimestamp = Date.now();
        return [...paquetesCache];
      } catch (error) {
        console.warn("⚠️ Error listando paquetes del backend, usando caché en memoria:", error);
        return this.listarSync();
      } finally {
        inFlightListar = null;
      }
    })();

    return inFlightListar;
  },

  // Compatibilidad temporal: estos flujos locales quedaron deshabilitados.
  crear() {
    console.warn("⚠️ crear() local deshabilitado. Usa crear_paquete_archivo en backend.");
    return null;
  },

  crearContinuacion() {
    console.warn("⚠️ crearContinuacion() local deshabilitado. Usa flujo backend.");
    return null;
  },

  contarExpedientes() {
    return 0;
  },

  asignarExpediente() {
    console.warn("⚠️ asignarExpediente() local deshabilitado. Usa asignar_expediente_paquete en backend.");
    return null;
  },

  quitarExpediente() {
    console.warn("⚠️ quitarExpediente() local deshabilitado. Requiere endpoint backend.");
    return null;
  }
};

// ============================================================
// PAQUETES ARCHIVO - Nuevas funciones para backend
// ============================================================

export async function sugerirPaqueteParaExpediente(codigoExpediente, idUsuarioEspecialista = "") {
  const params = new URLSearchParams({
    action: "sugerir_paquete_para_expediente",
    codigo_expediente_completo: codigoExpediente
  });

  if (String(idUsuarioEspecialista || "").trim()) {
    params.set("id_usuario_especialista", String(idUsuarioEspecialista || "").trim());
  }

  const url = `${appConfig.googleSheetURL}?${params}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  return await res.json();
}

export async function listarPaquetesArchivo() {
  const url = `${appConfig.googleSheetURL}?action=listar_paquetes_archivo`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  return await res.json();
}

export async function listarExpedientesPorPaquete(idPaqueteArchivo) {
  const url = `${appConfig.googleSheetURL}?${new URLSearchParams({
    action: "listar_expedientes_por_paquete",
    id_paquete_archivo: idPaqueteArchivo
  })}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  return await res.json();
}

export async function crearPaqueteArchivo(payload) {
  const res = await fetch(appConfig.googleSheetURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "crear_paquete_archivo", ...payload })
  });
  return await res.json();
}

export async function asignarExpedienteAPaquete(payload) {
  const res = await fetch(appConfig.googleSheetURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "asignar_expediente_paquete", ...payload })
  });
  return await res.json();
}

export async function asignarExpedientesAPaqueteLote(payload) {
  const res = await fetch(appConfig.googleSheetURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "asignar_expedientes_paquete_lote", ...payload })
  });
  return await res.json();
}

export async function desasignarExpedienteDePaquete(payload) {
  const res = await fetch(appConfig.googleSheetURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "desasignar_expediente_paquete", ...payload })
  });
  return await res.json();
}

export async function listarMateriasActivas() {
  const url = `${appConfig.googleSheetURL}?action=listar_materias_activas`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  return await res.json();
}

export async function listarResponsablesActivos() {
  const url = `${appConfig.googleSheetURL}?action=listar_responsables_activos`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  return await res.json();
}

export async function crearPaquete(payload) {
  const res = await fetch(appConfig.googleSheetURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "crear_paquete", ...payload })
  });
  return await res.json();
}

export async function asignarColorEspecialista(payload) {
  const res = await fetch(appConfig.googleSheetURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "asignar_color_especialista", ...payload })
  });
  return await res.json();
}
