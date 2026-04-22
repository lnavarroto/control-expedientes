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
import { appConfig } from "../config.js";

// Cache para expedientes del backend
const CACHE_EXPEDIENTES_BACKEND = "expedientes_backend_cache";
const CACHE_TIMESTAMP_EXPEDIENTES = "expedientes_backend_tiempo";
const CACHE_TIME = 300000; // 5 minutos para expedientes (más fresco que otros catálogos)
let inFlightListarBackend = null;

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
    limpiarCacheBackend() {
      localStorage.removeItem(CACHE_EXPEDIENTES_BACKEND);
      localStorage.removeItem(CACHE_TIMESTAMP_EXPEDIENTES);
    },

  init() {
    initData();
    // Pre-cargar expedientes del backend al iniciar (en background)
    this.precargarDelBackend();
  },

  /**
   * Pre-cargar expedientes del backend en background
   */
  async precargarDelBackend() {
    try {
      await this.listarDelBackend();
      console.log("✅ Expedientes pre-cargados del backend");
    } catch (error) {
      console.warn("⚠️ No se pudieron pre-cargar expedientes del backend");
    }
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
  },

  // ============ FUNCIONES DE BACKEND ============

  /**
   * Obtener expedientes del backend con cache
   */
  async listarDelBackend({ forceRefresh = false } = {}) {
    const timestamp = Number(localStorage.getItem(CACHE_TIMESTAMP_EXPEDIENTES) || 0);
    const cacheCrudo = localStorage.getItem(CACHE_EXPEDIENTES_BACKEND);
    const cacheValido = Boolean(cacheCrudo) && (Date.now() - timestamp) < CACHE_TIME;

    if (!forceRefresh && cacheValido) {
      return { success: true, data: JSON.parse(cacheCrudo) };
    }

    if (!forceRefresh && inFlightListarBackend) {
      return inFlightListarBackend;
    }

    inFlightListarBackend = (async () => {
    try {
      const url = `${appConfig.googleSheetURL}?action=listar_expedientes&_ts=${Date.now()}`;
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const resultado = await response.json();

      if (resultado.success && Array.isArray(resultado.data)) {
        // Cachear resultados
        localStorage.setItem(CACHE_EXPEDIENTES_BACKEND, JSON.stringify(resultado.data));
        localStorage.setItem(CACHE_TIMESTAMP_EXPEDIENTES, Date.now().toString());
        console.log(`✅ ${resultado.data.length} expedientes obtenidos del backend`);
        return {
          success: true,
          data: resultado.data
        };
      }
      throw new Error("Respuesta inválida del backend");
    } catch (error) {
      console.warn("⚠️ Error obteniendo expedientes del backend:", error);
      // Intentar retornar cache si existe (excepto si se exigio refresco real)
      if (forceRefresh) {
        return { success: false, data: [], message: error.message };
      }

      const cached = localStorage.getItem(CACHE_EXPEDIENTES_BACKEND);
      if (cached) {
        console.log("📦 Usando cache de expedientes");
        return { success: true, data: JSON.parse(cached) };
      }
      return { success: false, data: [], message: error.message };
    } finally {
      inFlightListarBackend = null;
    }
    })();

    return inFlightListarBackend;
  },

  /**
   * Obtener expedientes del cache (sin esperar HTTP)
   */
  listarDelBackendSync() {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_EXPEDIENTES);
    const ahora = Date.now();
    const cacheValido =
      timestamp && ahora - parseInt(timestamp) < CACHE_TIME;

    if (cacheValido) {
      const cached = localStorage.getItem(CACHE_EXPEDIENTES_BACKEND);
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  },

  /**
   * Obtener un expediente por código del backend
   */
  async obtenerDelBackendPorCodigo(codigo) {
    try {
      const url = `${appConfig.googleSheetURL}?action=obtener_expediente_por_codigo&codigo=${encodeURIComponent(
        codigo
      )}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const resultado = await response.json();

      if (resultado.success) {
        return { success: true, data: resultado.data };
      }
      return { success: false, message: resultado.error || "Expediente no encontrado" };
    } catch (error) {
      console.error("Error obteniendo expediente:", error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Actualizar expediente en el backend
   */
  async actualizarEnBackend(data) {
    try {
      const url = `${appConfig.googleSheetURL}?action=actualizar_expediente`;
      const payload = {
        action: "actualizar_expediente",
        ...data
      };
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        cache: "no-store"
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const resultado = await response.json();

      if (resultado.success) {
        // Limpiar cache para forzar refresco
        this.limpiarCacheBackend();
        console.log("✅ Expediente actualizado en el backend");
        return { success: true, data: resultado.data };
      }
      
      return { success: false, message: resultado.error || "Error al actualizar" };
    } catch (error) {
      console.error("Error actualizando expediente:", error);
      return { success: false, message: error.message };
    }
  }
};
