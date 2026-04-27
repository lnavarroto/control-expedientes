import { initRouter, navegarA } from "./router.js";
import { initAuthManager, authManager } from "./auth/authManager.js";
import { initLoginPage } from "./modules/auth/loginPage.js";
import { showToast } from "./components/toast.js";

// URL del Cloudflare Worker (Proxy sin CORS) - PRODUCCIÓN ✅
const BACKEND_URL = "https://proxy-apps-script.ln142843.workers.dev";

function aplicarMayusculasGlobales() {
  const tiposPermitidos = new Set(["text", "search", "email", "password", "tel", "url"]);

  const esCampoTextoValido = (el) => {
    if (!el || !el.tagName) return false;
    const tag = String(el.tagName).toUpperCase();
    if (tag === "TEXTAREA") return true;
    if (tag !== "INPUT") return false;
    const tipo = String(el.type || "text").toLowerCase();
    return tiposPermitidos.has(tipo);
  };

  const convertirAMayusculas = (el) => {
    if (!esCampoTextoValido(el) || typeof el.value !== "string") return;
    const valorAnterior = el.value;
    const valorNuevo = valorAnterior.toLocaleUpperCase("es-PE");
    if (valorAnterior === valorNuevo) return;

    const inicio = el.selectionStart;
    const fin = el.selectionEnd;
    el.value = valorNuevo;

    try {
      if (typeof inicio === "number" && typeof fin === "number") {
        el.setSelectionRange(inicio, fin);
      }
    } catch {
      // Ignorar en tipos que no soportan setSelectionRange.
    }
  };

  document.addEventListener("focusin", (event) => {
    const el = event.target;
    if (!esCampoTextoValido(el)) return;
    el.style.textTransform = "uppercase";
  });

  document.addEventListener("input", (event) => {
    convertirAMayusculas(event.target);
  });

  document.addEventListener("change", (event) => {
    convertirAMayusculas(event.target);
  });

  document.addEventListener("blur", (event) => {
    convertirAMayusculas(event.target);
  }, true);
}

function aplicarSoloNumerosGlobales() {
  const patronesCampoNumerico = [
    /(^|_)(dni)(_|$)/i,
    /(^|_)(anio)(_|$)/i,
    /(^|_)(incidente)(_|$)/i,
    /(^|_)(codigo_corte)(_|$)/i,
    /(^|_)(id_juzgado)(_|$)/i,
    /(^|_)(id_estado)(_|$)/i,
    /(^|_)(id_materia)(_|$)/i,
    /(^|_)(telefono)(_|$)/i,
    /numero[-_]?expediente/i,
    /numerojuzgado/i,
    /determinador/i,
    /codigo[-_]?lectora/i,
    /codigo[-_]?barras/i
  ];

  const esSoloNumeros = (el) => {
    if (!el || !el.tagName || String(el.tagName).toUpperCase() !== "INPUT") return false;

    // Permite excepciones puntuales para campos que manejan formato con guiones.
    if (el.dataset && el.dataset.allowFormattedExpediente === "true") return false;

    if (el.dataset && el.dataset.onlyNumbers === "true") return true;

    const tipo = String(el.type || "text").toLowerCase();
    if (tipo === "number") return true;

    const identificador = `${String(el.id || "")} ${String(el.name || "")}`.trim();
    return patronesCampoNumerico.some((patron) => patron.test(identificador));
  };

  const limpiarValorNumerico = (el) => {
    if (!esSoloNumeros(el) || typeof el.value !== "string") return;

    const anterior = el.value;
    const limpio = anterior.replace(/\D+/g, "");
    if (anterior === limpio) return;

    const inicio = el.selectionStart;
    el.value = limpio;
    try {
      if (typeof inicio === "number") {
        const pos = Math.min(inicio, limpio.length);
        el.setSelectionRange(pos, pos);
      }
    } catch {
      // Ignorar si el input no soporta cursor selection.
    }
  };

  document.addEventListener("focusin", (event) => {
    const el = event.target;
    if (!esSoloNumeros(el)) return;
    el.setAttribute("inputmode", "numeric");
    el.setAttribute("pattern", "[0-9]*");
  });

  document.addEventListener("input", (event) => {
    limpiarValorNumerico(event.target);
  });

  document.addEventListener("change", (event) => {
    limpiarValorNumerico(event.target);
  });

  document.addEventListener("paste", (event) => {
    const el = event.target;
    if (!esSoloNumeros(el)) return;
    setTimeout(() => limpiarValorNumerico(el), 0);
  });

  document.addEventListener("keydown", (event) => {
    const el = event.target;
    if (!esSoloNumeros(el)) return;

    const permitidas = new Set(["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter"]);
    if (permitidas.has(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  });
}

// Callback reutilizable para cuando la sesión expira por inactividad
function onSesionExpirada() {
  showToast("Tu sesión se cerró por inactividad (30 min).", "warning");
  setTimeout(() => {
    window.location.href = "/pages/login.html";
  }, 2000);
}

document.addEventListener("DOMContentLoaded", async () => {
  aplicarMayusculasGlobales();
  aplicarSoloNumerosGlobales();

  // Inicializar gestor de autenticación
  initAuthManager(BACKEND_URL);

  // Obtener elemento raíz
  const app = document.getElementById("app");
  if (!app) {
    console.error("No se encontró elemento #app");
    return;
  }

  // Verificar si hay trabajador validado
  if (authManager.isAutenticado()) {
    // Ya está autenticado - iniciar router normal
    console.log(`✅ Sesión activa: ${authManager.getNombreCompleto()}`);
    document.body.dataset.page = "dashboard";
    authManager.iniciarVigilanteInactividad(onSesionExpirada); // ← NUEVO
    initRouter();
  } else {
    // No autenticado - mostrar página de login
    console.log("⚠️ No autenticado - mostrando login");

    // Renderizar página de login
    initLoginPage({
      mountNode: app,
      onLoginSuccess: (trabajador) => {
        console.log("✅ Login exitoso:", trabajador.nombres);
        showToast(`Bienvenido ${trabajador.nombres} ${trabajador.apellidos}`, "success");

        // Esperar 1 segundo y luego iniciar router
        setTimeout(() => {
          app.innerHTML = ""; // Limpiar
          document.body.dataset.page = "dashboard"; // ← ESTABLECER PÁGINA A DASHBOARD
          authManager.iniciarVigilanteInactividad(onSesionExpirada); // ← NUEVO
          initRouter(); // Iniciar aplicación normal
        }, 1000);
      }
    });
  }
});