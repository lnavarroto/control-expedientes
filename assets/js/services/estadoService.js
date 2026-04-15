/**
 * Servicio de Estados
 * Gestiona CRUD de estados de expedientes
 */

const STORAGE_KEY = "estados";

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

  listar() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  obtener(id) {
    return this.listar().find(e => e.id === id);
  },

  guardar(estado) {
    const lista = this.listar();
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
    const lista = this.listar().filter(e => e.id !== id);
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
