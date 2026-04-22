import { STORAGE_KEYS, readJson, writeJson } from "../utils/storage.js";
import { validarDniPeruano } from "../utils/validators.js";

function crearSesion(dni) {
  return {
    dni,
    nombre: "Operador Archivo",
    id_rol: "ROL0002",
    acceso_sistema: "SI",
    fechaIngreso: new Date().toISOString()
  };
}

export const authService = {
  login(dni) {
    if (!validarDniPeruano(dni)) {
      return { success: false, message: "El DNI debe tener 8 digitos numericos." };
    }

    const sesion = crearSesion(dni);
    writeJson(STORAGE_KEYS.sesion, sesion);
    return { success: true, sesion };
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.sesion);
  },

  getSesion() {
    return readJson(STORAGE_KEYS.sesion, null);
  },

  isAuthenticated() {
    return Boolean(this.getSesion());
  }
};
