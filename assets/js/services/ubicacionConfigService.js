/**
 * Servicio de Ubicaciones (Configuración)
 * Gestiona catálogo maestro de ubicaciones
 */

const STORAGE_KEY = "ubicaciones_config";

const UBICACIONES_INICIALES = [
  { id: "1", codigo: "EST", nombre: "Estante", tipo: "Almacenamiento", descripcion: "Estantería principal", activo: true },
  { id: "2", codigo: "ANA", nombre: "Anaquel", tipo: "Almacenamiento", descripcion: "Anaquel de archivo", activo: true },
  { id: "3", codigo: "ARC", nombre: "Archivo Temporal", tipo: "Almacenamiento", descripcion: "Archivo provisional", activo: true },
  { id: "4", codigo: "MPA", nombre: "Mesa de Partes", tipo: "Frontal", descripcion: "Recepción de documentos", activo: true },
  { id: "5", codigo: "JUZ", nombre: "Juzgado", tipo: "Externo", descripcion: "En poder del juzgado", activo: true },
  { id: "6", codigo: "PRE", nombre: "Préstamo Interno", tipo: "Movimiento", descripcion: "Préstamo dentro de la institución", activo: true },
  { id: "7", codigo: "COP", nombre: "Copia", tipo: "Movimiento", descripcion: "En proceso de copia", activo: true }
];

export const ubicacionConfigService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(UBICACIONES_INICIALES));
    }
  },

  listar() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  obtener(id) {
    return this.listar().find(u => u.id === id);
  },

  guardar(ubicacion) {
    const lista = this.listar();
    if (ubicacion.id) {
      const idx = lista.findIndex(u => u.id === ubicacion.id);
      if (idx !== -1) {
        lista[idx] = ubicacion;
      }
    } else {
      ubicacion.id = Date.now().toString();
      lista.push(ubicacion);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    return ubicacion;
  },

  eliminar(id) {
    const lista = this.listar().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  },

  toggleActivo(id) {
    const ubicacion = this.obtener(id);
    if (ubicacion) {
      ubicacion.activo = !ubicacion.activo;
      this.guardar(ubicacion);
    }
  },

  tipos() {
    return ["Almacenamiento", "Frontal", "Externo", "Movimiento"];
  }
};
