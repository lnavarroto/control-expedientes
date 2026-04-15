/**
 * Gestor de autenticación del sistema
 * Valida trabajadores contra BD de Google Sheets
 */

export class AuthManager {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.trabajador = null;
    this.loadFromStorage();
  }

  /**
   * Cargar trabajador validado from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem("trabajador_validado");
      if (stored) {
        this.trabajador = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error al cargar trabajador:", error);
      this.trabajador = null;
    }
  }

  /**
   * Validar trabajador por DNI contra backend usando JSONP
   * @param {string} dni - DNI del trabajador
   * @returns {Promise<{success: boolean, message: string, trabajador: object}>}
   */
  async validarTrabajador(dni) {
    if (!dni || dni.trim().length === 0) {
      return {
        success: false,
        message: "El DNI es requerido",
        trabajador: null
      };
    }

    try {
      console.log("🔍 Iniciando validación de trabajador con DNI:", dni);

      // Construir URL para fetch
      const url = `${this.apiUrl}?action=obtener_usuario_por_dni&dni=${encodeURIComponent(dni.trim())}`;
      console.log("📡 Llamando a:", url);

      // Hacer llamada fetch
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`❌ Error HTTP ${response.status}: ${response.statusText}`);
        return {
          success: false,
          message: `Error del servidor (${response.status}). Por favor, intenta más tarde.`,
          trabajador: null
        };
      }

      const responseData = await response.json();
      console.log("📡 Respuesta del backend:", responseData);

      // Procesar respuesta
      let usuario = null;
      
      if (responseData.success && responseData.data) {
        usuario = responseData.data;
      } else if (responseData.data) {
        usuario = responseData.data;
      }

      if (!usuario) {
        return {
          success: false,
          message: responseData.error || "No se encontró un trabajador activo con ese DNI. Acceso denegado.",
          trabajador: null
        };
      }

      // Verificar que el trabajador está activo
      const activo = String(usuario.activo || "").trim().toUpperCase();
      if (activo !== "SI") {
        return {
          success: false,
          message: "El trabajador está inactivo. Acceso denegado.",
          trabajador: null
        };
      }

      // Trabajador válido - guardar en memoria y localStorage
      this.trabajador = {
        id_usuario: usuario.id_usuario,
        dni: usuario.dni,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        telefono: usuario.telefono,
        cargo: usuario.cargo,
        area_modulo: usuario.area_modulo,
        rol: usuario.rol,
        activo: usuario.activo,
        validado_en: new Date().toISOString()
      };

      console.log("✅ Trabajador validado:", this.trabajador);
      localStorage.setItem("trabajador_validado", JSON.stringify(this.trabajador));

      return {
        success: true,
        message: "Trabajador validado correctamente. Acceso autorizado.",
        trabajador: this.trabajador
      };

    } catch (error) {
      console.error("❌ Error al validar trabajador:", error);
      return {
        success: false,
        message: "Error de conexión con el servidor. Verifica tu conexión a internet.",
        trabajador: null
      };
    }
  }

  /**
   * Obtener trabajador actualmente validado
   */
  getTrabajador() {
    return this.trabajador;
  }

  /**
   * Verificar si hay trabajador validado
   */
  isAutenticado() {
    return this.trabajador !== null && this.trabajador.activo === "SI";
  }

  /**
   * Logout - limpiar sesión
   */
  logout() {
    this.trabajador = null;
    localStorage.removeItem("trabajador_validado");
  }

  /**
   * Obtener nombre completo del trabajador
   */
  getNombreCompleto() {
    if (!this.trabajador) return null;
    return `${this.trabajador.nombres} ${this.trabajador.apellidos}`.trim();
  }

  /**
   * Obtener cargo del trabajador
   */
  getCargo() {
    return this.trabajador?.cargo || null;
  }

  /**
   * Obtener rol del trabajador
   */
  getRol() {
    return this.trabajador?.rol || null;
  }
}

// Exportar instancia global
export let authManager = null;

export function initAuthManager(apiUrl) {
  authManager = new AuthManager(apiUrl);
  return authManager;
}
