import { initRouter, navegarA } from "./router.js";
import { initAuthManager, authManager } from "./auth/authManager.js";
import { initLoginPage } from "./modules/auth/loginPage.js";
import { showToast } from "./components/toast.js";

// URL del backend - Google Apps Script
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwrFNxpklDaeqa4HSyRwaRbjSoWvJH_n0FacXR_JMr0jiGj_eGH_fnGLMCNBi6t_UpL/exec";

document.addEventListener("DOMContentLoaded", async () => {
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
          initRouter(); // Iniciar aplicación normal
        }, 1000);
      }
    });
  }
});
