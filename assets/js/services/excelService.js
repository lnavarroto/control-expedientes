import { readJson, STORAGE_KEYS } from "../utils/storage.js";

export const excelService = {
  async obtenerRegistros() {
    return readJson(STORAGE_KEYS.expedientes, []);
  },

  async guardarRegistros(registros) {
    return Promise.resolve({ success: true, total: registros.length });
  },

  async sincronizar() {
    return Promise.resolve({
      success: true,
      mensaje: "Capa Excel lista para integrar en siguiente fase"
    });
  }
};
