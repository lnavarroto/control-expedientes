// pages/login.js - VERSIÓN SIN SALTO DE TAMAÑO
import { showToast } from "../../components/toast.js";
import { authManager } from "../../auth/authManager.js";
import { icon } from "../../components/icons.js";
import { Loader } from "../../components/loader.js";

// Variables para control de estado
let isLoading = false;
let currentLoaderId = null;
let timeoutMensaje = null;

export function initLoginPage({ mountNode, onLoginSuccess }) {
  mountNode.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo/Encabezado -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <span class="text-white">${icon("shieldCheck", "w-8 h-8")}</span>
          </div>
          <h1 class="text-3xl font-bold text-white mb-2">Control de Expedientes</h1>
          <p class="text-slate-300 text-sm">Poder Judicial del Perú | Módulo Civil Sullana</p>
        </div>

        <!-- Card de Login con altura FIJA para evitar saltos -->
        <div class="bg-white rounded-lg shadow-2xl overflow-hidden relative" style="height: 560px;">
          <!-- Contenido del card (visible por defecto) -->
          <div id="login-card-content" class="p-8 space-y-6 absolute inset-0 overflow-y-auto">
            <div class="text-center">
              <h2 class="text-2xl font-bold text-slate-900">Validar Acceso</h2>
              <p class="text-sm text-slate-600 mt-1">Ingresa tu DNI para acceder al sistema</p>
            </div>

            <!-- Formulario -->
            <form id="form-login-auth" class="space-y-4" novalidate>
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

              <!-- Contenedor de mensajes - altura fija -->
              <div id="validation-status" class="h-14 relative">
                <!-- Los mensajes se insertan aquí -->
              </div>

              <button
                type="submit"
                id="btn-login"
                class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span id="btn-text" class="inline-flex items-center gap-2">${icon("lock", "w-4 h-4")}<span>Validar Acceso</span></span>
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
              <p class="font-semibold mb-2 inline-flex items-center gap-2">${icon("sliders", "w-4 h-4")}<span>Requisitos de acceso:</span></p>
              <ul class="space-y-1 ml-4 list-disc">
                <li>Estar registrado en el sistema</li>
                <li>Estado ACTIVO en base de datos</li>
                <li>DNI validado y verificado</li>
              </ul>
            </div>

            <div class="text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
              <p>Sistema seguro de autenticación | Validación en línea</p>
            </div>
          </div>
          
          <!-- Contenedor para Loader (misma posición absoluta, mismo tamaño) -->
          <div id="login-loader-container" class="absolute inset-0 bg-white items-center justify-center hidden" style="display: none;">
          </div>
        </div>

        <div class="text-center text-xs text-slate-400 mt-4">
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
  const loginCardContent = document.getElementById("login-card-content");
  const loginLoaderContainer = document.getElementById("login-loader-container");

  /**
   * Mostrar mensaje de error (sin deformar)
   */
  function mostrarError(mensaje) {
    if (timeoutMensaje) clearTimeout(timeoutMensaje);
    
    validationStatus.innerHTML = `
      <div class="absolute left-0 right-0 top-0 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg flex items-start gap-2 shadow-md z-10" style="animation: slideInDown 0.3s ease forwards;">
        <span class="text-red-500 flex-shrink-0">${icon("alertCircle", "w-4 h-4")}</span>
        <p class="text-sm text-red-700 flex-1">${mensaje}</p>
        <button class="text-red-500 hover:text-red-700 flex-shrink-0" onclick="this.parentElement.parentElement.innerHTML = ''">✕</button>
      </div>
    `;
    
    timeoutMensaje = setTimeout(() => {
      if (validationStatus.innerHTML !== '') {
        validationStatus.innerHTML = '';
      }
    }, 4000);
  }

  /**
   * Mostrar loader animado durante la validación (SIN CAMBIAR TAMAÑO)
   */
  function mostrarLoaderValidacion(dni) {
    isLoading = true;
    
    // Limpiar mensajes
    validationStatus.innerHTML = '';
    
    // Ocultar contenido del card (pero el contenedor mantiene el tamaño)
    if (loginCardContent) {
      loginCardContent.style.opacity = "0";
      loginCardContent.style.visibility = "hidden";
    }
    
    // Mostrar contenedor del loader (mismo tamaño, misma posición)
    if (loginLoaderContainer) {
      loginLoaderContainer.style.display = "flex";
      loginLoaderContainer.classList.remove("hidden");
      
      // Usar el Loader hermoso
      currentLoaderId = Loader.show({
        variante: 'verificacion',
        mensajes: [
          `Verificando DNI: ${dni}...`,
          'Consultando base de datos...',
          'Validando credenciales...',
          'Verificando permisos...'
        ],
        submensaje: 'Por favor espere',
        overlay: false,
        contenedor: loginLoaderContainer
      });
    }
    
    // Deshabilitar botón e input
    if (btnLogin) btnLogin.disabled = true;
    if (dniInput) dniInput.disabled = true;
  }

  /**
   * Ocultar loader y restaurar formulario (SIN CAMBIAR TAMAÑO)
   */
  function ocultarLoaderError() {
    isLoading = false;
    
    // Ocultar loader
    if (currentLoaderId) {
      Loader.hide(currentLoaderId);
      currentLoaderId = null;
    }
    
    // Ocultar contenedor del loader
    if (loginLoaderContainer) {
      loginLoaderContainer.style.display = "none";
      loginLoaderContainer.classList.add("hidden");
    }
    
    // Mostrar contenido del card
    if (loginCardContent) {
      loginCardContent.style.opacity = "1";
      loginCardContent.style.visibility = "visible";
    }
    
    // Habilitar inputs
    if (btnLogin) btnLogin.disabled = false;
    if (dniInput) {
      dniInput.disabled = false;
      dniInput.focus();
    }
  }

  /**
   * Mostrar loader de éxito y redirección (SIN CAMBIAR TAMAÑO)
   */
  function mostrarLoaderExito(nombreCompleto) {
    if (currentLoaderId) {
      Loader.hide(currentLoaderId);
      
      currentLoaderId = Loader.show({
        variante: 'verificacion',
        mensajes: [
          `✅ ¡Bienvenido ${nombreCompleto}!`,
          'Cargando panel principal...',
          'Preparando el sistema...'
        ],
        submensaje: 'Acceso concedido',
        overlay: false,
        contenedor: loginLoaderContainer
      });
    }
  }

  /**
   * Limpiar mensajes
   */
  function limpiarMensajes() {
    if (timeoutMensaje) clearTimeout(timeoutMensaje);
    validationStatus.innerHTML = '';
  }

  /**
   * Handler principal del login
   */
  async function handleLogin(e) {
    e.preventDefault();

    if (isLoading) return;

    const dni = dniInput.value.trim();

    if (!dni || dni.length !== 8) {
      mostrarError("Ingresa exactamente 8 dígitos numéricos");
      dniInput.focus();
      return;
    }

    limpiarMensajes();
    mostrarLoaderValidacion(dni);

    try {
      const resultado = await authManager.validarTrabajador(dni);

      if (resultado.success) {
        const nombreCompleto = `${resultado.trabajador.nombres} ${resultado.trabajador.apellidos}`;
        mostrarLoaderExito(nombreCompleto);
        
        setTimeout(async () => {
          try {
            authManager.iniciarVigilanteInactividad(() => {
              window.location.href = "/pages/login.html";
            });
            
            await precargarSistema();
            
            if (onLoginSuccess) {
              onLoginSuccess(resultado.trabajador);
            }
          } catch (error) {
            console.error("Error en post-login:", error);
            if (onLoginSuccess) {
              onLoginSuccess(resultado.trabajador);
            }
          }
        }, 1800);
        
      } else {
        ocultarLoaderError();
        
        let mensajeError = resultado.message;
        if (mensajeError.includes("sin acceso")) {
          mensajeError = "Usuario sin autorización. Contacte al administrador del sistema.";
        } else if (mensajeError.includes("inactivo")) {
          mensajeError = "Usuario inactivo. Contacte a su supervisor.";
        } else if (mensajeError.includes("No se encontró")) {
          mensajeError = "DNI no registrado en el sistema. Verifique sus datos.";
        }
        
        mostrarError(mensajeError);
        showToast(mensajeError, "error");
        dniInput.value = "";
        dniInput.focus();
      }
      
    } catch (error) {
      console.error("Error en login:", error);
      ocultarLoaderError();
      mostrarError("Error de conexión. Verifique su internet e intente nuevamente.");
      showToast("Error de conexión al servidor", "error");
      dniInput.value = "";
      dniInput.focus();
    }
  }

  // Event Listeners
  form.addEventListener("submit", handleLogin);

  dniInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
    limpiarMensajes();
  });

  dniInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && dniInput.value.length === 8) {
      handleLogin(e);
    }
  });
}

// Agregar estilos de animación
if (!document.getElementById("login-animation-styles")) {
  const style = document.createElement("style");
  style.id = "login-animation-styles";
  style.textContent = `
    @keyframes slideInDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Precarga de catálogos
 */
async function precargarSistema() {
  try {
    console.log("🚀 Iniciando precarga de catálogos...");
    const { appConfig } = await import("../../config.js");
    
    const resultados = await Promise.allSettled([
      fetch(`${appConfig.googleSheetURL}?action=listar_estados_activos`).then(r => r.json()),
      fetch(`${appConfig.googleSheetURL}?action=listar_estados_sistema_activos`).then(r => r.json()),
      fetch(`${appConfig.googleSheetURL}?action=listar_juzgados_activos`).then(r => r.json()),
      fetch(`${appConfig.googleSheetURL}?action=listar_materias_activas`).then(r => r.json()),
      fetch(`${appConfig.googleSheetURL}?action=listar_usuarios`).then(r => r.json()),
    ]);
    
    const exitosas = resultados.filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log(`✅ Precarga completa: ${exitosas}/5 catálogos listos`);
    
  } catch (error) {
    console.warn("⚠️ Error en precarga:", error.message);
  }
}