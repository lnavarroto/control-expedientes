/**
 * Servicio de Materias
 * Gestiona CRUD de materias judiciales
 */

const STORAGE_KEY = "materias";

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

  listar() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  obtener(id) {
    return this.listar().find(m => m.id === id);
  },

  guardar(materia) {
    const lista = this.listar();
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
    const lista = this.listar().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  },

  toggleActivo(id) {
    const materia = this.obtener(id);
    if (materia) {
      materia.activo = !materia.activo;
      this.guardar(materia);
    }
  }
};
