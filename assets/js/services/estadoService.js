/**
 * Servicio de Estados
 * Obtiene estados desde Google Sheet App Script con caché inteligente
 */

import { appConfig } from "../config.js";

const STORAGE_KEY = "estados";
const CACHE_TIMESTAMP_KEY = "estados_tiempo";
const CACHE_TIME = 3600000; // 1 hora en milisegundos

const ESTADOS_INICIALES = [
  { id: "1", nombre: "Ingresado", codigo: "ING", descripcion: "Expediente acaba de ingresar", color: "emerald", activo: true },
  { id: "2", nombre: "Ubicado", codigo: "UBI", descripcion: "Expediente ubicado en archivo", color: "blue", activo: true },
  { id: "3", nombre: "En paquete", codigo: "PAQ", descripcion: "Expediente incluido en paquete", color: "indigo", activo: true },
  { id: "4", nombre: "En tránsito", codigo: "TRA", descripcion: "Expediente en movimiento", color: "amber", activo: true },
  { id: "5", nombre: "Prestado", codigo: "PRE", descripcion: "Expediente prestado", color: "orange", activo: true },
  { id: "6", nombre: "Derivado", codigo: "DER", descripcion: "Expediente derivado a otra dependencia", color: "violet", activo: true },
  { id: "7", nombre: "Retornado", codigo: "RET", descripcion: "Expediente retornado", color: "cyan", activo: true },
  { id: "8", nombre: "Archivado", codigo: "ARC", descripcion: "Expediente en archivo definitivo", color: "slate", activo: true }
];

export const estadoService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ESTADOS_INICIALES));
    }
  },

  // Precargar datos desde Google Sheet (llamar una sola vez al iniciar sesión)
  async precargar() {
    try {
      // Intentar con el endpoint listar_estados primero
      let url = `${appConfig.googleSheetURL}?action=listar_estados`;
      let response = await fetch(url);
      
      // Si falla, intentar con listar_estados_activos
      if (!response.ok || response.status === 404) {
        console.log("⚠️ Intentando endpoint alternativo: listar_estados_activos");
        url = `${appConfig.googleSheetURL}?action=listar_estados_activos`;
        response = await fetch(url);
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const resultado = await response.json();
      
      if (resultado.success && Array.isArray(resultado.data)) {
        const dataMapeada = resultado.data.map(item => {
          const activoStr = String(item.activo || "").trim().toUpperCase();
          return {
            id: item.id_estado || item.id,
            nombre: item.nombre_estado || item.nombre,
            codigo: item.codigo_estado || item.codigo || "",
            descripcion: item.descripcion || "",
            color: item.color || "emerald",
            activo: activoStr === "TRUE" || activoStr === "SI" || item.activo === true
          };
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataMapeada));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log("✅ Estados precargados desde Google Sheet");
        return dataMapeada;
      }
      
      // Si no tiene estructura esperada, usar datos locales
      console.warn("⚠️ Estados: respuesta del backend sin estructura esperada, usando datos locales");
      return this.listarSync();
    } catch (error) {
      console.warn("⚠️ Error precargando estados (usando cache local):", error.message);
      return this.listarSync();
    }
  },

  // Obtener del caché localmente (instantáneo, sin HTTP)
  listarSync() {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : ESTADOS_INICIALES;
  },

  // Obtener datos, actualizar en background si caché es viejo
  async listar() {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const ahora = Date.now();
    const cacheViejo = !timestamp || (ahora - parseInt(timestamp)) > CACHE_TIME;

    // Si caché está fresco, devolver inmediatamente
    if (!cacheViejo) {
      return this.listarSync();
    }

    // Si caché es viejo, actualizar en background silenciosamente
    try {
      let url = `${appConfig.googleSheetURL}?action=listar_estados`;
      let response = await fetch(url);
      
      // Si falla, intentar con listar_estados_activos
      if (!response.ok || response.status === 404) {
        url = `${appConfig.googleSheetURL}?action=listar_estados_activos`;
        response = await fetch(url);
      }
      
      if (response.ok) {
        const resultado = await response.json();
        if (resultado.success && Array.isArray(resultado.data)) {
          const dataMapeada = resultado.data.map(item => {
            const activoStr = String(item.activo || "").trim().toUpperCase();
            return {
              id: item.id_estado || item.id,
              nombre: item.nombre_estado || item.nombre,
              codigo: item.codigo_estado || item.codigo || "",
              descripcion: item.descripcion || "",
              color: item.color || "emerald",
              activo: activoStr === "TRUE" || activoStr === "SI" || item.activo === true
            };
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataMapeada));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        }
      }
    } catch (error) {
      console.warn("⚠️ Error actualizando estados en background:", error);
    }

    // Retornar caché actual (viejo o actualizado)
    return this.listarSync();
  },

  obtener(id) {
    return this.listarSync().find(e => e.id === id);
  },

  guardar(estado) {
    const lista = this.listarSync();
    if (estado.id) {
      const idx = lista.findIndex(e => e.id === estado.id);
      if (idx !== -1) {
        lista[idx] = estado;
      }
    } else {
      estado.id = Date.now().toString();
      lista.push(estado);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    return estado;
  },

  eliminar(id) {
    const lista = this.listarSync().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  },

  toggleActivo(id) {
    const estado = this.obtener(id);
    if (estado) {
      estado.activo = !estado.activo;
      this.guardar(estado);
    }
  },

  colores() {
    return ["emerald", "blue", "indigo", "amber", "orange", "violet", "cyan", "slate", "red", "pink"];
  }
};
