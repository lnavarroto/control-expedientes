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
const CACHE_SEGUIMIENTOS_BACKEND = "seguimientos_backend_cache";
const CACHE_TIME = 300000; // 5 minutos
const CACHE_CATALOGOS = "catalogos_cache";
const CACHE_CATALOGOS_TIMESTAMP = "catalogos_cache_tiempo";
const CACHE_CATALOGOS_TIME = 300000; // 5 minutos para catálogos
let inFlightListarBackend = null;

// =============================
// HELPERS PRIVADOS
// =============================

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

function extraerFecha(fechaString) {
  if (!fechaString) return "";
  return String(fechaString).split(" ")[0] || "";
}

function extraerHora(fechaString) {
  if (!fechaString) return "";
  const partes = String(fechaString).split(" ");
  return partes.length > 1 ? partes[1] : "";
}

// =============================
// SERVICIO
// =============================

export const expedienteService = {

  // ---------- Cache ----------

  limpiarCacheBackend() {
    localStorage.removeItem(CACHE_EXPEDIENTES_BACKEND);
    localStorage.removeItem(CACHE_TIMESTAMP_EXPEDIENTES);
    localStorage.removeItem(CACHE_SEGUIMIENTOS_BACKEND);
  },

  // ---------- Inicialización ----------

  init() {
    initData();
    this.precargarDelBackend();
  },

  async precargarDelBackend() {
    try {
      await this.listarDelBackend();
      console.log("✅ Expedientes pre-cargados del backend");
    } catch (error) {
      console.warn("⚠️ No se pudieron pre-cargar expedientes del backend");
    }
  },

  // ---------- Catálogos ----------

  estados() {
    return ESTADOS_EXPEDIENTE;
  },

  // ---------- CRUD Local (Legacy) ----------

  listar() {
    return readJson(STORAGE_KEYS.expedientes, []);
  },

async listarMovimientos() {
  try {
    // 1. Obtener seguimientos (siempre fresco)
    const url = `${appConfig.googleSheetURL}?action=listar_seguimientos&_ts=${Date.now()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    // 2. Obtener catálogos (con caché)
    const catalogos = await this._obtenerCatalogos();

    // 3. Mapear con nombres
    return result.data.map(item => ({
      id: item.id_seguimiento || "",
      fecha: extraerFecha(item.fecha_actualizacion || item.fecha_registro || ""),
      hora: extraerHora(item.fecha_actualizacion || item.fecha_registro || ""),
      numeroExpediente: catalogos.expedientes[item.id_expediente] || item.id_expediente || "",
      usuario: item.usuario_registra || "",
      origen: catalogos.estados[item.id_estado] || item.id_estado || "",
      destino: catalogos.estadosSistema[item.id_estado_sistema] || item.id_estado_sistema || "",
      id_usuario_responsable: catalogos.usuarios[item.id_usuario_responsable] || item.id_usuario_responsable || "",
      observacion: item.observacion || ""
    }));
    
  } catch (error) {
    console.error("Error cargando seguimientos:", error);
    return [];
  }
},
async listarMovimientosActivos() {
  try {
    // 1. Obtener movimientos del backend
    const url = `${appConfig.googleSheetURL}?action=listar_movimientos&_ts=${Date.now()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success || !Array.isArray(result.data)) {
      console.warn("⚠️ Sin datos de movimientos del backend");
      return [];
    }

    // 2. Obtener catálogos para JOINs
    const catalogos = await this._obtenerCatalogos();

    // 3. Mapear con nombres reales
    return result.data.map(item => ({
      id: item.id_movimiento || "",
      fecha: item.fecha_movimiento || extraerFecha(item.fecha_hora_movimiento || ""),
      hora: item.hora_movimiento || extraerHora(item.fecha_hora_movimiento || ""),
      numeroExpediente: catalogos.expedientes[item.id_expediente] || item.id_expediente || "",
      id_expediente: item.id_expediente || "",
      tipo: item.tipo_movimiento || "TRASLADO",
      origen: item.ubicacion_origen || "",
      destino: item.ubicacion_destino || "",
      estadoAnterior: catalogos.estados[item.estado_anterior] || catalogos.estadosSistema[item.estado_anterior] || item.estado_anterior || "",
      estadoNuevo: catalogos.estados[item.estado_nuevo] || catalogos.estadosSistema[item.estado_nuevo] || item.estado_nuevo || "",
      realizadoPor: catalogos.usuarios[item.realizado_por] || item.realizado_por || "",
      motivo: item.motivo || "",
      observacion: item.observacion || "",
      destinoExterno: item.destino_externo || "",
      activo: item.activo || ""
    }));
    
  } catch (error) {
    console.error("❌ Error cargando movimientos:", error);
    return [];
  }
},
async listarSalidasArchivoGeneral() {
  try {
    const url = `${appConfig.googleSheetURL}?action=listar_salidas_todas&_ts=${Date.now()}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    const catalogos = await this._obtenerCatalogos();

    return result.data.map(item => ({
      id: item.id_salida || "",
      fechaSalida: extraerFecha(item.fecha_hora_salida || ""),
      horaSalida: extraerHora(item.fecha_hora_salida || ""),
      fechaRetorno: extraerFecha(item.fecha_hora_retorno || ""),
      horaRetorno: extraerHora(item.fecha_hora_retorno || ""),
      rotulo: item.rotulo_salida || "",
      tipo: item.tipo_salida || "",
      destino: item.destino_salida || "",
      idGrupo: item.id_grupo || "",
      responsableEntrega: catalogos.usuarios[item.responsable_entrega] || item.responsable_entrega || "",
      responsableRecepcion: catalogos.usuarios[item.responsable_recepcion] || item.responsable_recepcion || "",
      estado: item.estado_salida || "",
      motivo: item.motivo_salida || "",
      observacion: item.observacion || "",
      realizadoPor: catalogos.usuarios[item.realizado_por] || item.realizado_por || "",
      activo: item.activo || ""
    }));
    
  } catch (error) {
    console.error("Error cargando salidas:", error);
    return [];
  }
},
/**
 * Obtener catálogos con caché (10 minutos)
 */
async _obtenerCatalogos() {
  const timestamp = Number(localStorage.getItem(CACHE_CATALOGOS_TIMESTAMP) || 0);
  const cacheValido = (Date.now() - timestamp) < CACHE_CATALOGOS_TIME;
  
  if (cacheValido) {
    const cached = localStorage.getItem(CACHE_CATALOGOS);
    if (cached) {
      console.log("📦 Usando catálogos en caché");
      return JSON.parse(cached);
    }
  }
  
  console.log("🔄 Cargando catálogos frescos...");
  
  const [expedientesRes, estadosRes, estadosSistemaRes, usuariosRes] = await Promise.all([
    fetch(`${appConfig.googleSheetURL}?action=listar_expedientes`).then(r => r.json()),
    fetch(`${appConfig.googleSheetURL}?action=listar_estados_activos`).then(r => r.json()),
    fetch(`${appConfig.googleSheetURL}?action=listar_estados_sistema_activos`).then(r => r.json()),
    fetch(`${appConfig.googleSheetURL}?action=listar_usuarios`).then(r => r.json())
  ]);

  const catalogos = {
    expedientes: {},
    estados: {},
    estadosSistema: {},
    usuarios: {}
  };

  if (expedientesRes.success) {
    expedientesRes.data.forEach(exp => {
      catalogos.expedientes[exp.id_expediente] = exp.numero_expediente || exp.codigo_expediente_completo || exp.id_expediente;
    });
  }

  if (estadosRes.success) {
    estadosRes.data.forEach(est => {
      catalogos.estados[est.id_estado] = est.nombre_estado || est.codigo_estado || est.id_estado;
    });
  }

  if (estadosSistemaRes.success) {
    estadosSistemaRes.data.forEach(est => {
      catalogos.estadosSistema[est.id_estado_sistema] = est.nombre_estado_sistema || est.id_estado_sistema;
    });
  }

  if (usuariosRes.success) {
    usuariosRes.data.forEach(usr => {
      catalogos.usuarios[usr.id_usuario] = [usr.nombres, usr.apellidos]
        .filter(Boolean)
        .join(" ") || usr.nombre_completo || usr.id_usuario;
    });
  }

  // Guardar en caché
  localStorage.setItem(CACHE_CATALOGOS, JSON.stringify(catalogos));
  localStorage.setItem(CACHE_CATALOGOS_TIMESTAMP, Date.now().toString());
  
  return catalogos;
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

  this._registrarMovimientoLocal({
  expedienteId: nuevo.id,
  numeroExpediente: nuevo.numeroExpediente,
  origen: "Mesa de partes",
  destino: nuevo.ubicacionActual,
  motivo: "Registro inicial",
  observacion: nuevo.observaciones || "Registro de expediente"
});

    return nuevo;
  },
  async registrarMovimiento(data) {
  try {
    const payload = {
      action: "registrar_movimiento",
      ...data
    };
    
    const response = await fetch(appConfig.googleSheetURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log("✅ Movimiento registrado:", data.tipo_movimiento);
      return { success: true, data: result.data };
    }
    
    return { success: false, message: result.error };
  } catch (error) {
    console.error("Error registrando movimiento:", error);
    return { success: false, message: error.message };
  }
},
  actualizarUbicacionEstado({ id, ubicacionActual, estado, motivo, observacion, usuario = "OPERADOR" }) {
    const expedientes = this.listar();
    const expediente = expedientes.find((item) => item.id === id);
    if (!expediente) return null;

    const origen = expediente.ubicacionActual;
    expediente.ubicacionActual = ubicacionActual || expediente.ubicacionActual;
    expediente.estado = estado || expediente.estado;

    guardarExpedientes(expedientes);

   this._registrarMovimientoLocal({
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

_registrarMovimientoLocal({ expedienteId, numeroExpediente, origen, destino, motivo, observacion, usuario = "OPERADOR" }) {
  const movimientos = readJson(STORAGE_KEYS.movimientos, []);
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
        const response = await fetch(url, { method: "GET", cache: "no-store" });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const resultado = await response.json();

        if (resultado.success && Array.isArray(resultado.data)) {
          localStorage.setItem(CACHE_EXPEDIENTES_BACKEND, JSON.stringify(resultado.data));
          localStorage.setItem(CACHE_TIMESTAMP_EXPEDIENTES, Date.now().toString());
          console.log(`✅ ${resultado.data.length} expedientes obtenidos del backend`);
          return { success: true, data: resultado.data };
        }
        throw new Error("Respuesta inválida del backend");
      } catch (error) {
        console.warn("⚠️ Error obteniendo expedientes del backend:", error);
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

  listarDelBackendSync() {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_EXPEDIENTES);
    const ahora = Date.now();
    const cacheValido = timestamp && ahora - parseInt(timestamp) < CACHE_TIME;

    if (cacheValido) {
      const cached = localStorage.getItem(CACHE_EXPEDIENTES_BACKEND);
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  },

  async obtenerDelBackendPorCodigo(codigo) {
    try {
      const url = `${appConfig.googleSheetURL}?action=obtener_expediente_por_codigo&codigo=${encodeURIComponent(codigo)}`;
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

  async obtenerUltimoSeguimiento(idExpediente) {
    try {
      const id = String(idExpediente || "").trim();
      if (!id) {
        return { success: false, message: "id_expediente requerido", data: null };
      }

      const url = `${appConfig.googleSheetURL}?action=obtener_ultimo_seguimiento&id_expediente=${encodeURIComponent(id)}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const resultado = await response.json();
      if (resultado.success) {
        return { success: true, data: resultado.data || null, message: resultado.message || "" };
      }

      return { success: false, message: resultado.error || "No se pudo obtener el último seguimiento", data: null };
    } catch (error) {
      console.error("Error obteniendo último seguimiento:", error);
      return { success: false, message: error.message, data: null };
    }
  },

  async listarSeguimientosDelBackend({ forceRefresh = false, idExpediente = null } = {}) {
    try {
      let url = `${appConfig.googleSheetURL}?action=listar_seguimientos`;
      if (idExpediente) {
        url += `&id_expediente=${encodeURIComponent(idExpediente)}`;
      }
      if (forceRefresh) {
        url += `&_ts=${Date.now()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        cache: forceRefresh ? "no-store" : "default"
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const resultado = await response.json();

      if (resultado.success && Array.isArray(resultado.data)) {
        const movimientos = resultado.data.map(item => ({
          id: item.id_seguimiento,
          fecha: extraerFecha(item.fecha_actualizacion || item.fecha_registro),
          hora: extraerHora(item.fecha_actualizacion || item.fecha_registro),
          numeroExpediente: item.id_expediente,
          id_expediente: item.id_expediente,
          id_estado: item.id_estado,
          id_estado_sistema: item.id_estado_sistema,
          usuario: item.usuario_registra || item.id_usuario_responsable || "",
          origen: item.id_estado || "",
          destino: item.id_estado_sistema || "",
          motivo: "Actualización de estado",
          observacion: item.observacion || ""
        }));

        localStorage.setItem(CACHE_SEGUIMIENTOS_BACKEND, JSON.stringify(movimientos));
        console.log(`✅ ${movimientos.length} seguimientos obtenidos del backend`);
        return { success: true, data: movimientos };
      }

      return { success: false, data: [], message: resultado.error || "Sin datos" };
    } catch (error) {
      console.warn("⚠️ Error obteniendo seguimientos del backend:", error);
      const cached = localStorage.getItem(CACHE_SEGUIMIENTOS_BACKEND);
      if (cached) {
        console.log("📦 Usando cache de seguimientos");
        return { success: true, data: JSON.parse(cached) };
      }
      return { success: false, data: [], message: error.message };
    }
  },

  async actualizarEnBackend(data) {
    try {
      const url = `${appConfig.googleSheetURL}?action=actualizar_expediente`;
      const payload = {
        action: "actualizar_expediente",
        ...data
      };
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store"
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const resultado = await response.json();

      if (resultado.success) {
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

}; // ← ÚNICO CIERRE DEL OBJETO