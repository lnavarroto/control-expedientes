/**
 * Servicio de Perfil del Trabajador
 * Gestiona datos del usuario/operador del sistema
 */

const STORAGE_KEY = "perfil_trabajador";

const PERFIL_INICIAL = {
  id: "1",
  nombres: "Juan Carlos",
  apellidos: "García Mendoza",
  dni: "12345678",
  cargo: "Archivero",
  area: "Archivo Módulo Civil",
  correo: "juan.garcia@judicial.gob.pe",
  telefono: "973-123456",
  nombreVisible: "J. García",
  avatar: null,
  fechaIngreso: "2022-01-15"
};

export const perfilService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PERFIL_INICIAL));
    }
  },

  obtener() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : PERFIL_INICIAL;
  },

  guardar(perfil) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perfil));
    return perfil;
  },

  actualizar(datos) {
    const perfil = this.obtener();
    const actualizado = { ...perfil, ...datos };
    this.guardar(actualizado);
    return actualizado;
  },

  obtenerNombres() {
    const perfil = this.obtener();
    return `${perfil.nombres} ${perfil.apellidos}`;
  },

  cargos() {
    return ["Archivero", "Jefe de Archivo", "Analista", "Supervisor", "Administrador"];
  },

  areas() {
    return ["Archivo Módulo Civil", "Archivo Módulo Penal", "Archivo Módulo Laboral", "Dirección", "Otros"];
  }
};
