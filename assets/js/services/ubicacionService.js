import { expedienteService } from "./expedienteService.js";

export const ubicacionService = {
  moverExpediente(payload) {
    return expedienteService.actualizarUbicacionEstado(payload);
  },

  historialPorExpediente(expedienteId) {
    return expedienteService
      .listarMovimientos()
      .filter((movimiento) => movimiento.expedienteId === expedienteId);
  }
};
