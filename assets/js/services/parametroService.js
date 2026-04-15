/**
 * Servicio de Parámetros del Sistema
 * Gestiona configuración general del sistema
 */

const STORAGE_KEY = "parametros_sistema";

const PARAMETROS_INICIALES = {
  nombreInstitucion: "Poder Judicial del Perú",
  nombreModulo: "Módulo Civil - Archivo Sullana",
  codigoCorteDefecto: "3101",
  formatoExpediente: "NNNNN-AAAA-0-CCCC-TT-MM-DD",
  modoRegistroPorDefecto: "manual",
  juzgadoDefecto: "JC01",
  materiaDefecto: "CI",
  registrosPorPagina: 15,
  mostrarAyudaVisual: true,
  activarValidacionEnTiempoReal: true,
  permitirEdicionLectora: false,
  logoUrl: null,
  telefonoSoporte: "+51 973-123456",
  correoSoporte: "soporte@judicial.gob.pe"
};

export const parametroService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PARAMETROS_INICIALES));
    }
  },

  obtener() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : PARAMETROS_INICIALES;
  },

  guardar(parametros) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parametros));
    return parametros;
  },

  actualizar(cambios) {
    const parametros = this.obtener();
    const actualizado = { ...parametros, ...cambios };
    this.guardar(actualizado);
    return actualizado;
  },

  obtenerValor(clave) {
    const parametros = this.obtener();
    return parametros[clave];
  },

  establecerValor(clave, valor) {
    const cambios = {};
    cambios[clave] = valor;
    return this.actualizar(cambios);
  }
};
