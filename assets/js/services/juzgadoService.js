/**
 * Servicio de Juzgados
 * Obtiene juzgados desde Google Sheet App Script con caché inteligente
 */

import { appConfig } from "../config.js";

const STORAGE_KEY = "juzgados";
const CACHE_TIMESTAMP_KEY = "juzgados_tiempo";
const CACHE_TIME = 3600000; // 1 hora en milisegundos

const JUZGADOS_INICIALES = [
  { id: "1", codigo: "JC01", nombre: "Juzgado Civil 01", tipo: "Civil", abreviatura: "JC", activo: true, observacion: "" },
  { id: "2", codigo: "JC02", nombre: "Juzgado Civil 02", tipo: "Civil", abreviatura: "JC", activo: true, observacion: "" },
  { id: "3", codigo: "JM01", nombre: "Juzgado Mixto 01", tipo: "Mixto", abreviatura: "JM", activo: true, observacion: "" },
  { id: "4", codigo: "JP01", nombre: "Juzgado Penal 01", tipo: "Penal", abreviatura: "JP", activo: true, observacion: "" },
  { id: "5", codigo: "JL01", nombre: "Juzgado Laboral 01", tipo: "Laboral", abreviatura: "JL", activo: false, observacion: "En mantenimiento" }
];

export const juzgadoService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(JUZGADOS_INICIALES));
    }
  },

  // Precargar datos desde Google Sheet (llamar una sola vez al iniciar sesión)
  async precargar() {
    try {
      const url = `${appConfig.googleSheetURL}?action=listar_juzgados_activos`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const resultado = await response.json();
      
      if (resultado.success && Array.isArray(resultado.data)) {
        const dataMapeada = resultado.data.map(item => {
          const activoStr = String(item.activo || "").trim().toUpperCase();
          return {
            id: item.id_juzgado || item.id,
            codigo: item.codigo_juzgado || item.codigo,
            nombre: item.nombre_juzgado || item.nombre,
            tipo: item.tipo_juzgado || item.tipo,
            abreviatura: item.abreviatura || item.abreviatura,
            activo: activoStr === "TRUE" || activoStr === "SI" || item.activo === true,
            observacion: item.observacion || ""
          };
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataMapeada));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log("✅ Juzgados precargados desde Google Sheet");
        return dataMapeada;
      }
      throw new Error("Respuesta inválida");
    } catch (error) {
      console.warn("⚠️ Error precargando juzgados:", error);
      return this.listarSync();
    }
  },

  // Obtener del caché localmente (instantáneo, sin HTTP)
  listarSync() {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : JUZGADOS_INICIALES;
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
      const url = `${appConfig.googleSheetURL}?action=listar_juzgados_activos`;
      const response = await fetch(url);
      
      if (response.ok) {
        const resultado = await response.json();
        if (resultado.success && Array.isArray(resultado.data)) {
          const dataMapeada = resultado.data.map(item => {
            const activoStr = String(item.activo || "").trim().toUpperCase();
            return {
              id: item.id_juzgado || item.id,
              codigo: item.codigo_juzgado || item.codigo,
              nombre: item.nombre_juzgado || item.nombre,
              tipo: item.tipo_juzgado || item.tipo,
              abreviatura: item.abreviatura || item.abreviatura,
              activo: activoStr === "TRUE" || activoStr === "SI" || item.activo === true,
              observacion: item.observacion || ""
            };
          });
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataMapeada));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
          return dataMapeada;
        }
      }
    } catch (error) {
      console.warn("⚠️ Error actualizando juzgados en background:", error);
    }

    // Devolver último caché conocido
    return this.listarSync();
  },

  obtener(id) {
    const data = localStorage.getItem(STORAGE_KEY);
    const lista = data ? JSON.parse(data) : JUZGADOS_INICIALES;
    return lista.find(j => j.id === id);
  },

  guardar(juzgado) {
    const data = localStorage.getItem(STORAGE_KEY);
    const lista = data ? JSON.parse(data) : JUZGADOS_INICIALES;
    
    if (juzgado.id) {
      const idx = lista.findIndex(j => j.id === juzgado.id);
      if (idx !== -1) {
        lista[idx] = juzgado;
      }
    } else {
      juzgado.id = Date.now().toString();
      lista.push(juzgado);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    return juzgado;
  },

  eliminar(id) {
    const data = localStorage.getItem(STORAGE_KEY);
    const lista = data ? JSON.parse(data) : JUZGADOS_INICIALES;
    const listaFiltrada = lista.filter(j => j.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listaFiltrada));
  },

  toggleActivo(id) {
    const juzgado = this.obtener(id);
    if (juzgado) {
      juzgado.activo = !juzgado.activo;
      this.guardar(juzgado);
    }
  },

  tipos() {
    return ["Civil", "Penal", "Mixto", "Laboral", "Comercial", "Familia"];
  }
};
