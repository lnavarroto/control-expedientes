// services/ubicacionService.js
import { expedienteService } from "./expedienteService.js";
import { appConfig } from "../config.js";

// ============================================
// CATÁLOGO DE UBICACIONES (Configuración)
// ============================================

const STORAGE_KEY_UBICACIONES = "ubicaciones_config";
const STORAGE_KEY_DETALLES = "ubicaciones_detalle_config";

const UBICACIONES_INICIALES = [
  { id_ubicacion: "1", codigo_ubicacion: "EST", nombre_ubicacion: "Estante", tipo_ubicacion: "Almacenamiento", descripcion: "Estantería principal", activo: "SI" },
  { id_ubicacion: "2", codigo_ubicacion: "ANA", nombre_ubicacion: "Anaquel", tipo_ubicacion: "Almacenamiento", descripcion: "Anaquel de archivo", activo: "SI" },
  { id_ubicacion: "3", codigo_ubicacion: "ARC", nombre_ubicacion: "Archivo Temporal", tipo_ubicacion: "Almacenamiento", descripcion: "Archivo provisional", activo: "SI" },
  { id_ubicacion: "4", codigo_ubicacion: "MPA", nombre_ubicacion: "Mesa de Partes", tipo_ubicacion: "Frontal", descripcion: "Recepción de documentos", activo: "SI" },
  { id_ubicacion: "5", codigo_ubicacion: "JUZ", nombre_ubicacion: "Juzgado", tipo_ubicacion: "Externo", descripcion: "En poder del juzgado", activo: "SI" },
  { id_ubicacion: "6", codigo_ubicacion: "PRE", nombre_ubicacion: "Préstamo Interno", tipo_ubicacion: "Movimiento", descripcion: "Préstamo dentro de la institución", activo: "SI" },
  { id_ubicacion: "7", codigo_ubicacion: "COP", nombre_ubicacion: "Copia", tipo_ubicacion: "Movimiento", descripcion: "En proceso de copia", activo: "SI" }
];

const DETALLES_INICIALES = [
  { id_piso: "1", id_ubicacion: "1", codigo_piso: "EST-01", nombre_piso: "Estante Norte", activo: "SI" },
  { id_piso: "2", id_ubicacion: "1", codigo_piso: "EST-02", nombre_piso: "Estante Sur", activo: "SI" },
  { id_piso: "3", id_ubicacion: "2", codigo_piso: "ANA-01", nombre_piso: "Anaquel Principal", activo: "SI" },
  { id_piso: "4", id_ubicacion: "4", codigo_piso: "MPA-01", nombre_piso: "Recepción", activo: "SI" }
];

class UbicacionService {
  constructor() {
    this.cacheUbicaciones = null;
    this.cacheDetalles = null;
    this.init();
  }

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  
  init() {
    // Inicializar ubicaciones si no existen
    if (!localStorage.getItem(STORAGE_KEY_UBICACIONES)) {
      localStorage.setItem(STORAGE_KEY_UBICACIONES, JSON.stringify(UBICACIONES_INICIALES));
    }
    
    // Inicializar detalles si no existen
    if (!localStorage.getItem(STORAGE_KEY_DETALLES)) {
      localStorage.setItem(STORAGE_KEY_DETALLES, JSON.stringify(DETALLES_INICIALES));
    }
    
    // Cargar caché
    this.cacheUbicaciones = this.listarDesdeLocalStorage();
    this.cacheDetalles = this.listarDetallesDesdeLocalStorage();
  }

  // ============================================
  // MÉTODOS PARA UBICACIONES (CRUD)
  // ============================================
  
  /**
   * Listar todas las ubicaciones (desde caché o localStorage)
   */
  listarUbicaciones() {
    try {
      // Intentar desde caché
      if (this.cacheUbicaciones) {
        return Promise.resolve({ success: true, data: this.cacheUbicaciones });
      }
      
      // Si no hay caché, cargar desde localStorage
      const data = this.listarDesdeLocalStorage();
      this.cacheUbicaciones = data;
      return Promise.resolve({ success: true, data });
    } catch (error) {
      console.error("Error listando ubicaciones:", error);
      return Promise.resolve({ success: false, data: [], error: error.message });
    }
  }

  /**
   * Listar ubicaciones desde localStorage (síncrono)
   */
  listarDesdeLocalStorage() {
    const data = localStorage.getItem(STORAGE_KEY_UBICACIONES);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Obtener una ubicación por ID
   */
  obtenerUbicacion(id) {
    const ubicaciones = this.listarDesdeLocalStorage();
    return ubicaciones.find(u => u.id_ubicacion == id);
  }

  /**
   * Crear una nueva ubicación
   */
  async crearUbicacion(datos) {
    try {
      const ubicaciones = this.listarDesdeLocalStorage();
      const nuevoId = (Math.max(...ubicaciones.map(u => parseInt(u.id_ubicacion)), 0) + 1).toString();
      
      const nuevaUbicacion = {
        id_ubicacion: nuevoId,
        codigo_ubicacion: datos.codigo_ubicacion,
        nombre_ubicacion: datos.nombre_ubicacion,
        tipo_ubicacion: datos.tipo_ubicacion || "Almacenamiento",
        descripcion: datos.descripcion || "",
        activo: datos.activo || "SI",
        fecha_creacion: new Date().toISOString()
      };
      
      ubicaciones.push(nuevaUbicacion);
      localStorage.setItem(STORAGE_KEY_UBICACIONES, JSON.stringify(ubicaciones));
      
      // Actualizar caché
      this.cacheUbicaciones = ubicaciones;
      
      return { success: true, data: nuevaUbicacion };
    } catch (error) {
      console.error("Error creando ubicación:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualizar una ubicación existente
   */
  async actualizarUbicacion(datos) {
    try {
      const ubicaciones = this.listarDesdeLocalStorage();
      const index = ubicaciones.findIndex(u => u.id_ubicacion == datos.id_ubicacion);
      
      if (index === -1) {
        return { success: false, error: "Ubicación no encontrada" };
      }
      
      ubicaciones[index] = {
        ...ubicaciones[index],
        codigo_ubicacion: datos.codigo_ubicacion || ubicaciones[index].codigo_ubicacion,
        nombre_ubicacion: datos.nombre_ubicacion || ubicaciones[index].nombre_ubicacion,
        tipo_ubicacion: datos.tipo_ubicacion || ubicaciones[index].tipo_ubicacion,
        descripcion: datos.descripcion !== undefined ? datos.descripcion : ubicaciones[index].descripcion,
        activo: datos.activo || ubicaciones[index].activo
      };
      
      localStorage.setItem(STORAGE_KEY_UBICACIONES, JSON.stringify(ubicaciones));
      
      // Actualizar caché
      this.cacheUbicaciones = ubicaciones;
      
      return { success: true, data: ubicaciones[index] };
    } catch (error) {
      console.error("Error actualizando ubicación:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar una ubicación
   */
  eliminarUbicacion(id) {
    const ubicaciones = this.listarDesdeLocalStorage().filter(u => u.id_ubicacion != id);
    localStorage.setItem(STORAGE_KEY_UBICACIONES, JSON.stringify(ubicaciones));
    this.cacheUbicaciones = ubicaciones;
  }

  /**
   * Cambiar estado activo/inactivo
   */
  toggleActivo(id) {
    const ubicacion = this.obtenerUbicacion(id);
    if (ubicacion) {
      ubicacion.activo = ubicacion.activo === "SI" ? "NO" : "SI";
      this.actualizarUbicacion(ubicacion);
    }
  }

  /**
   * Obtener tipos de ubicación disponibles
   */
  tiposUbicacion() {
    return ["Almacenamiento", "Frontal", "Externo", "Movimiento", "PISO", "ESTANTE", "CAJA", "ARCHIVO"];
  }

  // ============================================
  // MÉTODOS PARA DETALLES DE UBICACIONES
  // ============================================
  
  /**
   * Listar todos los detalles de ubicaciones
   */
  async listarDetallesUbicacion() {
    try {
      if (this.cacheDetalles) {
        return { success: true, data: this.cacheDetalles };
      }
      
      const data = this.listarDetallesDesdeLocalStorage();
      this.cacheDetalles = data;
      return { success: true, data };
    } catch (error) {
      console.error("Error listando detalles:", error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Listar detalles desde localStorage
   */
  listarDetallesDesdeLocalStorage() {
    const data = localStorage.getItem(STORAGE_KEY_DETALLES);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Obtener detalles por ID de ubicación padre
   */
  obtenerDetallesPorUbicacion(idUbicacion) {
    const detalles = this.listarDetallesDesdeLocalStorage();
    return detalles.filter(d => d.id_ubicacion == idUbicacion);
  }

  /**
   * Crear un nuevo detalle de ubicación
   */
  async crearDetalleUbicacion(datos) {
    try {
      const detalles = this.listarDetallesDesdeLocalStorage();
      const nuevoId = (Math.max(...detalles.map(d => parseInt(d.id_piso)), 0) + 1).toString();
      
      const nuevoDetalle = {
        id_piso: nuevoId,
        id_ubicacion: datos.id_ubicacion,
        codigo_piso: datos.codigo_piso,
        nombre_piso: datos.nombre_piso,
        activo: datos.activo || "SI",
        fecha_creacion: new Date().toISOString()
      };
      
      detalles.push(nuevoDetalle);
      localStorage.setItem(STORAGE_KEY_DETALLES, JSON.stringify(detalles));
      
      // Actualizar caché
      this.cacheDetalles = detalles;
      
      return { success: true, data: nuevoDetalle };
    } catch (error) {
      console.error("Error creando detalle:", error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // MÉTODOS PARA MOVIMIENTOS DE EXPEDIENTES
  // ============================================
  
  /**
   * Mover expediente a una nueva ubicación
   */
  moverExpediente(payload) {
    return expedienteService.actualizarUbicacionEstado(payload);
  }

  /**
   * Guardar movimiento de expediente (registro histórico)
   */
  async guardarMovimiento(movimiento) {
    try {
      // Obtener movimientos existentes o crear array vacío
      const movimientosKey = "movimientos_ubicacion";
      let movimientos = localStorage.getItem(movimientosKey);
      movimientos = movimientos ? JSON.parse(movimientos) : [];
      
      // Agregar nuevo movimiento
      const nuevoMovimiento = {
        id_movimiento: Date.now().toString(),
        ...movimiento,
        fecha_registro: new Date().toISOString()
      };
      
      movimientos.unshift(nuevoMovimiento); // Agregar al inicio
      
      // Limitar a 1000 movimientos (para no saturar localStorage)
      if (movimientos.length > 1000) {
        movimientos = movimientos.slice(0, 1000);
      }
      
      localStorage.setItem(movimientosKey, JSON.stringify(movimientos));
      
      // También actualizar el expediente si es necesario
      if (movimiento.expedienteId && movimiento.ubicacionActual) {
        await expedienteService.actualizarUbicacionEstado({
          expedienteId: movimiento.expedienteId,
          ubicacionActual: movimiento.ubicacionActual,
          estado: movimiento.estado
        });
      }
      
      return { success: true, data: nuevoMovimiento };
    } catch (error) {
      console.error("Error guardando movimiento:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Listar movimientos de ubicación
   */
  async listarMovimientos() {
    try {
      const movimientosKey = "movimientos_ubicacion";
      let movimientos = localStorage.getItem(movimientosKey);
      movimientos = movimientos ? JSON.parse(movimientos) : [];
      return { success: true, data: movimientos };
    } catch (error) {
      console.error("Error listando movimientos:", error);
      return { success: false, data: [], error: error.message };
    }
  }

  /**
   * Obtener historial de movimientos por expediente
   */
  historialPorExpediente(expedienteId) {
    const movimientosKey = "movimientos_ubicacion";
    let movimientos = localStorage.getItem(movimientosKey);
    movimientos = movimientos ? JSON.parse(movimientos) : [];
    
    return movimientos.filter((movimiento) => movimiento.expedienteId == expedienteId);
  }

  /**
   * Limpiar toda la caché
   */
  limpiarCache() {
    this.cacheUbicaciones = null;
    this.cacheDetalles = null;
  }

  /**
   * Resetear datos a valores iniciales (solo para pruebas)
   */
  resetearDatos() {
    localStorage.setItem(STORAGE_KEY_UBICACIONES, JSON.stringify(UBICACIONES_INICIALES));
    localStorage.setItem(STORAGE_KEY_DETALLES, JSON.stringify(DETALLES_INICIALES));
    localStorage.removeItem("movimientos_ubicacion");
    this.limpiarCache();
    this.init();
  }
}

// Exportar instancia única
export const ubicacionService = new UbicacionService();