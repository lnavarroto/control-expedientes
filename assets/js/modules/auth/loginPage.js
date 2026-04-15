import { showToast } from "../../components/toast.js";
import { authManager } from "../../auth/authManager.js";

export function initLoginPage({ mountNode, onLoginSuccess }) {
  mountNode.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <!-- Container principal -->
      <div class="w-full max-w-md">
        <!-- Logo/Encabezado -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <span class="text-3xl">⚖️</span>
          </div>
          <h1 class="text-3xl font-bold text-white mb-2">Control de Expedientes</h1>
          <p class="text-slate-300 text-sm">Poder Judicial del Perú | Módulo Civil Sullana</p>
        </div>

        <!-- Card de Login -->
        <div class="bg-white rounded-lg shadow-2xl p-8 space-y-6">
          <!-- Título -->
          <div class="text-center">
            <h2 class="text-2xl font-bold text-slate-900">Validar Acceso</h2>
            <p class="text-sm text-slate-600 mt-1">Ingresa tu DNI para acceder al sistema</p>
          </div>

          <!-- Formulario -->
          <form id="form-login-auth" class="space-y-4" novalidate>
            <!-- Input DNI -->
            <div>
              <label for="dni-input" class="block text-sm font-medium text-slate-700 mb-2">
                DNI del Trabajador
              </label>
              <input
                id="dni-input"
                type="text"
                placeholder="Ej: 12345678"
                class="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                maxlength="8"
                inputmode="numeric"
                pattern="[0-9]*"
                required
                autofocus
              />
              <p class="text-xs text-slate-500 mt-1">Exactamente 8 dígitos numéricos</p>
            </div>

            <!-- Estado de validación -->
            <div id="validation-status" class="hidden rounded-lg p-3 text-sm" role="alert"></div>

            <!-- Botón Submit -->
            <button
              type="submit"
              id="btn-login"
              class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span id="btn-text">🔐 Validar Acceso</span>
              <span id="btn-spinner" class="hidden">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            </button>
          </form>

          <!-- Información adicional -->
          <div class="bg-sky-50 border border-sky-200 rounded-lg p-4 text-xs text-sky-800">
            <p class="font-semibold mb-2">💡 Requisitos de acceso:</p>
            <ul class="space-y-1 ml-4 list-disc">
              <li>Estar registrado en el sistema</li>
              <li>Estado ACTIVO en base de datos</li>
              <li>DNI validado y verificado</li>
            </ul>
          </div>

          <!-- Footer -->
          <div class="text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
            <p>Sistema seguro de autenticación | Validación en línea</p>
          </div>
        </div>

        <!-- Información de conexión -->
        <div id="connection-status" class="text-center text-xs text-slate-400 mt-4">
          <span>✓ Sistema conectado a base de datos</span>
        </div>
      </div>
    </div>
  `;

  // Elementos del DOM
  const form = document.getElementById("form-login-auth");
  const dniInput = document.getElementById("dni-input");
  const btnLogin = document.getElementById("btn-login");
  const validationStatus = document.getElementById("validation-status");

  /**
   * Mostrar estado de validación
   */
  function mostrarEstado(tipo, mensaje) {
    validationStatus.classList.remove("hidden", "bg-red-50", "text-red-800", "border", "border-red-200", "bg-green-50", "text-green-800", "border-green-200", "bg-blue-50", "text-blue-800", "border-blue-200");
    
    if (tipo === "error") {
      validationStatus.classList.add("bg-red-50", "text-red-800", "border", "border-red-200");
      validationStatus.innerHTML = `<strong>❌ Error:</strong> ${mensaje}`;
    } else if (tipo === "success") {
      validationStatus.classList.add("bg-green-50", "text-green-800", "border", "border-green-200");
      validationStatus.innerHTML = `<strong>✅ Éxito:</strong> ${mensaje}`;
    } else if (tipo === "loading") {
      validationStatus.classList.add("bg-blue-50", "text-blue-800", "border", "border-blue-200");
      validationStatus.innerHTML = `<strong>⏳ Validando...</strong> ${mensaje}`;
    }
    validationStatus.classList.remove("hidden");
  }

  /**
   * Limpiar estado
   */
  function limpiarEstado() {
    validationStatus.classList.add("hidden");
  }

  /**
   * Handler de submit del formulario
   */
  async function handleLogin(e) {
    e.preventDefault();

    const dni = dniInput.value.trim();

    if (!dni || dni.length !== 8) {
      mostrarEstado("error", "Ingresa exactamente 8 dígitos");
      dniInput.focus();
      return;
    }

    // Mostrar estado de carga y animación
    btnLogin.disabled = true;
    const btnSpinner = document.getElementById("btn-spinner");
    const btnText = document.getElementById("btn-text");
    
    btnText.classList.add("hidden");
    btnSpinner.classList.remove("hidden");
    mostrarEstado("loading", "Validando identidad...");

    try {
      // Validar trabajador contra backend
      const resultado = await authManager.validarTrabajador(dni);

      if (resultado.success) {
        // Éxito
        btnText.textContent = "✅ Acceso autorizado";
        btnText.classList.remove("hidden");
        btnSpinner.classList.add("hidden");
        
        mostrarEstado("success", resultado.message);
        showToast(`Bienvenido ${resultado.trabajador.nombres}`, "success");

        // Ejecutar callback después de 1 segundo
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(resultado.trabajador);
          }
        }, 1000);
      } else {
        // Error de validación
        btnText.classList.remove("hidden");
        btnSpinner.classList.add("hidden");
        
        mostrarEstado("error", resultado.message);
        showToast(resultado.message, "error");
        dniInput.value = "";
        dniInput.focus();
      }
    } catch (error) {
      console.error("Error en login:", error);
      btnText.classList.remove("hidden");
      btnSpinner.classList.add("hidden");
      
      mostrarEstado("error", "Error al procesar la solicitud");
      showToast("Error del sistema", "error");
    } finally {
      btnLogin.disabled = false;
    }
  }

  // Event Listeners
  form.addEventListener("submit", handleLogin);

  // Validar que solo sea números y máximo 8 dígitos
  dniInput.addEventListener("input", (e) => {
    // Solo permitir números
    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
    limpiarEstado();
  });

  // Mostrar/ocultar spinner según longitud
  dniInput.addEventListener("input", () => {
    const btnSpinner = document.getElementById("btn-spinner");
    const btnText = document.getElementById("btn-text");
    
    if (dniInput.value.length === 8) {
      // Habilitar botón con animación suave
      btnLogin.disabled = false;
      btnSpinner.classList.add("animate-pulse");
    } else {
      btnSpinner.classList.remove("animate-pulse");
      btnLogin.disabled = false;
    }
  });

  // Enter en input también valida
  dniInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && dniInput.value.length === 8) {
      handleLogin(e);
    }
  });

  // Auto-submit cuando completa 8 dígitos (opcional)
  dniInput.addEventListener("input", () => {
    if (dniInput.value.length === 8) {
      // Opcionalmente, submit automático después de 500ms
      setTimeout(() => {
        if (dniInput.value.length === 8) {
          // No autosubmit, dejar que el usuario haga clic
          // O descomenta esto para auto-submit:
          // handleLogin(new Event("submit"));
        }
      }, 300);
    }
  });
}

