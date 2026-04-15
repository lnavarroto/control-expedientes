/**
 * Servicio de Juzgados
 * Gestiona CRUD de juzgados con persistencia en localStorage
 */

const STORAGE_KEY = "juzgados";

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

  listar() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  obtener(id) {
    return this.listar().find(j => j.id === id);
  },

  guardar(juzgado) {
    const lista = this.listar();
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
    const lista = this.listar().filter(j => j.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
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
