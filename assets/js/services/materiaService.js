/**
 * Servicio de Materias
 * Obtiene materias desde Google Sheet App Script con caché inteligente
 */

import { appConfig } from "../config.js";

const STORAGE_KEY = "materias";
const CACHE_TIMESTAMP_KEY = "materias_tiempo";
const CACHE_TIME = 3600000; // 1 hora en milisegundos

const MATERIAS_INICIALES = [
  { id: "1", codigo: "CI", nombre: "Civil", abreviatura: "CI", descripcion: "Asuntos civiles generales", activo: true },
  { id: "2", codigo: "LA", nombre: "Laboral", abreviatura: "LA", descripcion: "Asuntos laborales", activo: true },
  { id: "3", codigo: "FA", nombre: "Familia", abreviatura: "FA", descripcion: "Asuntos de familia", activo: true },
  { id: "4", codigo: "FC", nombre: "Familia y Comercial", abreviatura: "FC", descripcion: "Asuntos de familia y comercial", activo: true },
  { id: "5", codigo: "PE", nombre: "Penal", abreviatura: "PE", descripcion: "Asuntos penales", activo: false },
  { id: "6", codigo: "CO", nombre: "Comercial", abreviatura: "CO", descripcion: "Asuntos comerciales", activo: true }
];

export const materiaService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MATERIAS_INICIALES));
    }
  },

  // Precargar datos desde Google Sheet (llamar una sola vez al iniciar sesión)
  async precargar() {
    try {
      const url = `${appConfig.googleSheetURL}?action=listar_materias_activas`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const resultado = await response.json();
      
      if (resultado.success && Array.isArray(resultado.data)) {
        const dataMapeada = resultado.data.map(item => ({
          id: item.id_materia || item.id,
          codigo: item.codigo_materia || item.codigo,
          nombre: item.nombre_materia || item.nombre,
          abreviatura: item.abreviatura || item.abreviatura,
          descripcion: item.descripcion || item.descripcion,
          activo: String(item.activo || "").toUpperCase() === "SI" || item.activo === true
        }));
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataMapeada));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log("✅ Materias precargadas desde Google Sheet");
        return dataMapeada;
      }
      throw new Error("Respuesta inválida");
    } catch (error) {
      console.warn("⚠️ Error precargando materias:", error);
      return this.listarSync();
    }
  },

  // Obtener del caché localmente (instantáneo, sin HTTP)
  listarSync() {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : MATERIAS_INICIALES;
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
      const url = `${appConfig.googleSheetURL}?action=listar_materias_activas`;
      const response = await fetch(url);
      
      if (response.ok) {
        const resultado = await response.json();
        if (resultado.success && Array.isArray(resultado.data)) {
          const dataMapeada = resultado.data.map(item => ({
            id: item.id_materia || item.id,
            codigo: item.codigo_materia || item.codigo,
            nombre: item.nombre_materia || item.nombre,
            abreviatura: item.abreviatura || item.abreviatura,
            descripcion: item.descripcion || item.descripcion,
            activo: String(item.activo || "").toUpperCase() === "SI" || item.activo === true
          }));
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataMapeada));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
          return dataMapeada;
        }
      }
    } catch (error) {
      console.warn("⚠️ Error actualizando materias en background:", error);
    }

    // Devolver último caché conocido
    return this.listarSync();
  },

  obtener(id) {
    const data = localStorage.getItem(STORAGE_KEY);
    const lista = data ? JSON.parse(data) : MATERIAS_INICIALES;
    return lista.find(m => m.id === id);
  },

  guardar(materia) {
    const data = localStorage.getItem(STORAGE_KEY);
    const lista = data ? JSON.parse(data) : MATERIAS_INICIALES;
    
    if (materia.id) {
      const idx = lista.findIndex(m => m.id === materia.id);
      if (idx !== -1) {
        lista[idx] = materia;
      }
    } else {
      materia.id = Date.now().toString();
      lista.push(materia);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    return materia;
  },

  eliminar(id) {
    const data = localStorage.getItem(STORAGE_KEY);
    const lista = data ? JSON.parse(data) : MATERIAS_INICIALES;
    const listaFiltrada = lista.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listaFiltrada));
  },

  toggleActivo(id) {
    const materia = this.obtener(id);
    if (materia) {
      materia.activo = !materia.activo;
      this.guardar(materia);
    }
  }
};
