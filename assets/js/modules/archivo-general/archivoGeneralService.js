import { appConfig } from "../../config.js";

const API_URL = appConfig.googleSheetURL;

// Cache global para expedientes (TTL: 10 minutos)
const _cache = {
  expedientes: null,
  expedientesTime: 0
};

const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

async function fetchAPI(action, params = {}) {
  try {
    if (["listar_grupos_archivo_general", "listar_detalle_grupo_archivo", "obtener_grupo_con_detalle", "listar_salidas_archivo_general", "listar_especialistas_activos", "listar_asistentes_activos", "listar_responsables_activos", "listar_expedientes"].includes(action)) {
      // GET request
      const queryParams = new URLSearchParams({ action, ...params });
      const response = await fetch(`${API_URL}?${queryParams}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      return data;
    } else {
      // POST request
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...params })
      });
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error(`Error en API call (${action}):`, error);
    return { success: false, error: error.message, data: [] };
  }
}

export const archivoGeneralService = {
  // GETs
  async listarGrupos() {
    return await fetchAPI("listar_grupos_archivo_general");
  },

  async obtenerGrupoConDetalle(id_grupo) {
    return await fetchAPI("obtener_grupo_con_detalle", { id_grupo });
  },

  async listarDetalleGrupo(id_grupo) {
    return await fetchAPI("listar_detalle_grupo_archivo", { id_grupo });
  },

  async listarSalidasGrupo(id_grupo) {
    return await fetchAPI("listar_salidas_archivo_general", { id_grupo });
  },

  async listarEspecialistas() {
    return await fetchAPI("listar_especialistas_activos");
  },
  async listarAsistentes() {
  return await fetchAPI("listar_asistentes_activos");
},
  async listarResponsables() {
    return await fetchAPI("listar_responsables_activos");
  },

  async listarExpedientes() {
    // Usar caché si existe y no ha expirado
    const now = Date.now();
    if (_cache.expedientes && (now - _cache.expedientesTime) < CACHE_TTL) {
      return { success: true, data: _cache.expedientes };
    }

    // Si no hay caché, traer del API
    const response = await fetchAPI("listar_expedientes");
    
    // Guardar en caché si fue exitoso
    if (response.success && response.data) {
      _cache.expedientes = response.data;
      _cache.expedientesTime = now;
    }
    
    return response;
  },

  // Método para limpiar caché manualmente
  clearExpedientesCache() {
    _cache.expedientes = null;
    _cache.expedientesTime = 0;
  },

  // POSTs
  async crearGrupo(payload) {
    return await fetchAPI("crear_grupo_archivo_general", payload);
  },

  async asignarExpedientes(payload) {
    const response = await fetchAPI("asignar_expedientes_grupo_archivo", payload);
    // Limpiar caché de expedientes tras asignar (para que refresque)
    if (response.success) {
      this.clearExpedientesCache();
    }
    return response;
  },

  async desasignarExpediente(payload) {
    const response = await fetchAPI("desasignar_expediente_grupo_archivo", payload);
    // Limpiar caché de expedientes tras desasignar
    if (response.success) {
      this.clearExpedientesCache();
    }
    return response;
  },

  async registrarSalida(payload) {
    return await fetchAPI("registrar_salida_archivo_general", payload);
  },

  async registrarRetorno(payload) {
    return await fetchAPI("registrar_retorno_archivo_general", payload);
  },

  async asignarGrupoAPaqueteArchivo(payload) {
    return await fetchAPI("asignar_grupo_a_paquete_archivo", payload);
  },

  async listarPaquetesArchivo() {
    return await fetchAPI("listar_paquetes_archivo");
  }
};
