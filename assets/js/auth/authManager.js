
const TIEMPO_INACTIVIDAD_MS = 30 * 60 * 1000; // 30 minutos
const STORAGE_KEY = "trabajador_validado";

export class AuthManager {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.trabajador = null;
    this._intervalVerificacion = null;
    this._handlerActividad = null;
    this.loadFromStorage();
  }

  /**
   * Cargar trabajador validado from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
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

      // Verificar que tiene acceso al sistema
      const acceso = String(usuario.acceso_sistema || "").trim().toUpperCase();
      if (acceso !== "SI") {
        return {
          success: false,
          message: "Usuario sin acceso al sistema. Contacte al administrador.",
          trabajador: null
        };
      }

      // Trabajador válido - guardar en memoria y localStorage (con timestamp de actividad)
      this.trabajador = {
        id_usuario: usuario.id_usuario,
        dni: usuario.dni,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        telefono: usuario.telefono,
        cargo: usuario.cargo,
        area_modulo: usuario.area_modulo,
        id_rol: usuario.id_rol,
        activo: usuario.activo,
        acceso_sistema: usuario.acceso_sistema,
        validado_en: new Date().toISOString(),
        ultima_actividad: Date.now()         // ← NUEVO: timestamp para control de inactividad
      };

      console.log("✅ Trabajador validado:", this.trabajador);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.trabajador));

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

  // ===========================================================
  // CONTROL DE INACTIVIDAD
  // ===========================================================

  /**
   * Renueva el timestamp de última actividad en localStorage y en memoria.
   * Se llama automáticamente en cada interacción del usuario.
   */
  _renovarActividad() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const sesion = JSON.parse(stored);
      sesion.ultima_actividad = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
      if (this.trabajador) {
        this.trabajador.ultima_actividad = sesion.ultima_actividad;
      }
    } catch (e) {
      // silencioso
    }
  }

  /**
   * Verifica si la sesión expiró por inactividad.
   * @returns {boolean} true = sesión vigente, false = expirada
   */
  _sesionVigente() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    try {
      const sesion = JSON.parse(stored);
      // Si el dato no tiene ultima_actividad (sesión antigua al deploy), 
      // la renovamos para no cerrar sesiones válidas inesperadamente
      if (!sesion.ultima_actividad) {
        sesion.ultima_actividad = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
        return true;
      }
      return (Date.now() - sesion.ultima_actividad) < TIEMPO_INACTIVIDAD_MS;
    } catch (e) {
      return false;
    }
  }

  /**
   * Inicia el vigilante de inactividad.
   * Llamar desde app.js justo después de confirmar autenticación.
   * @param {Function} onExpiracion - Callback opcional cuando la sesión expira
   */
  iniciarVigilanteInactividad(onExpiracion) {
    // Evitar duplicados si se llama más de una vez
    this.detenerVigilanteInactividad();

    // Handler de actividad del usuario (guardado para poder removerlo luego)
    this._handlerActividad = () => this._renovarActividad();

    const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    eventos.forEach(ev => {
      document.addEventListener(ev, this._handlerActividad, { passive: true });
    });

    // Verificar cada 60 segundos
    this._intervalVerificacion = setInterval(() => {
      if (!this._sesionVigente()) {
        console.warn("⏰ Sesión expirada por inactividad.");
        this.detenerVigilanteInactividad();
        this.trabajador = null;
        localStorage.removeItem(STORAGE_KEY);

        if (typeof onExpiracion === "function") {
          onExpiracion();
        } else {
          // Comportamiento por defecto: redirigir al login
          alert("Tu sesión se cerró automáticamente por inactividad (30 minutos).");
          window.location.href = "/pages/login.html";
        }
      }
    }, 60 * 1000);

    console.log("🛡️ Vigilante de inactividad iniciado (30 min).");
  }

  /**
   * Detiene el vigilante de inactividad.
   * Se llama automáticamente en logout() y cuando la sesión expira.
   */
  detenerVigilanteInactividad() {
    if (this._intervalVerificacion) {
      clearInterval(this._intervalVerificacion);
      this._intervalVerificacion = null;
    }
    if (this._handlerActividad) {
      const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
      eventos.forEach(ev => {
        document.removeEventListener(ev, this._handlerActividad);
      });
      this._handlerActividad = null;
    }
  }

  // ===========================================================
  // MÉTODOS EXISTENTES (sin cambios)
  // ===========================================================

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
   * Logout - limpiar sesión y detener vigilante
   */
  logout() {
    this.detenerVigilanteInactividad();  // ← NUEVO: limpia el intervalo y listeners
    this.trabajador = null;
    localStorage.removeItem(STORAGE_KEY);
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
   * Obtener id_rol del trabajador
   */
  getRol() {
    return this.trabajador?.id_rol || null;
  }

  /**
   * Mapa de roles para comparaciones legibles
   * Uso: if (this.getRol() === AuthManager.roles.ADMIN)
   */
  static get roles() {
    return {
      ADMIN: "ROL0001",
      ARCH:  "ROL0002",
      MDP:   "ROL0003",
      LECT:  "ROL0004",
      ESP:   "ROL0005",
      ASI:   "ROL0006"
    };
  }
}

// Exportar instancia global
export let authManager = null;

export function initAuthManager(apiUrl) {
  authManager = new AuthManager(apiUrl);
  return authManager;
}