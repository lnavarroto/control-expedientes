import { renderAppLayout } from "./components/layout.js";
import { authManager } from "./auth/authManager.js";
import { expedienteService } from "./services/expedienteService.js";
import { paqueteService } from "./services/paqueteService.js";
import { estadoService } from "./services/estadoService.js";
import { materiaService } from "./services/materiaService.js";
import { juzgadoService } from "./services/juzgadoService.js";
import { openModal } from "./components/modal.js";
import { showToast } from "./components/toast.js";
import { initDashboardPage } from "./modules/dashboard/dashboardPage.js";
import { initRegistroPage } from "./modules/expedientes/registroPage.js";
import { initListadoPage } from "./modules/expedientes/listadoPageBackend.js";
import { initBusquedaPage } from "./modules/busqueda/busquedaPage.js";
import { initUbicacionesPage } from "./modules/ubicaciones/ubicacionesPage.js";
import { initPaquetesPage } from "./modules/paquetes/paquetesPage.js";
import { initMovimientosPage } from "./modules/movimientos/movimientosPage.js";
import { initActualizacionPage } from "./modules/actualizacion/actualizacionPage.js";
import { initConfiguacionPage } from "./modules/configuracion/configuracionPage.js";

const ROUTES = {
  dashboard: { title: "Dashboard Institucional", init: initDashboardPage },
  registro: { title: "Registro de Expedientes", init: initRegistroPage },
  expedientes: { title: "Listado de Expedientes", init: initListadoPage },
  busqueda: { title: "Búsqueda de Expedientes", init: initBusquedaPage },
  ubicaciones: { title: "Gestión de Ubicaciones", init: initUbicacionesPage },
  paquetes: { title: "Gestión de Paquetes", init: initPaquetesPage },
  movimientos: { title: "Movimientos e Historial", init: initMovimientosPage },
  actualizacion: { title: "Actualización de Datos", init: initActualizacionPage },
  configuracion: { title: "Configuración del Sistema", init: initConfiguacionPage }
};

function inPagesFolder() {
  return window.location.pathname.includes("/pages/");
}

function redirectToLogin() {
  authManager.logout();
  showToast("Sesión cerrada. Redirigiendo a login...", "info");
  setTimeout(() => {
    window.location.href = inPagesFolder() ? "login.html" : "pages/login.html";
  }, 1000);
}

export function navegarA(pagina) {
  console.log(`📍 navegarA() llamado con: ${pagina}`);
  
  if (!authManager.isAutenticado()) {
    showToast("Sesión no válida. Por favor inicia sesión nuevamente.", "warning");
    redirectToLogin();
    return;
  }
  
  const page = document.body;
  page.dataset.page = pagina;
  console.log(`✏️  Cambiando dataset.page a: ${pagina}`);
  initRouter();
}

export async function initRouter() {
  // Verificar autenticación
  if (!authManager.isAutenticado()) {
    console.warn("⚠️ Usuario no autenticado. Requiere login.");
    redirectToLogin();
    return;
  }

  expedienteService.init();
  paqueteService.init();
  
  // Precargar datos desde Google Sheet (en paralelo, sin esperar)
  materiaService.precargar().catch(err => console.warn("⚠️ Error precargando materias:", err));
  juzgadoService.precargar().catch(err => console.warn("⚠️ Error precargando juzgados:", err));
  estadoService.precargar().catch(err => console.warn("⚠️ Error precargando estados:", err));
  paqueteService.precargar().catch(err => console.warn("⚠️ Error precargando paquetes:", err));

  const page = document.body.dataset.page || "dashboard";
  const route = ROUTES[page];
  const mountNode = document.getElementById("app");

  if (!route || !mountNode) {
    console.error(`❌ Ruta no encontrada o mountNode no disponible: ${page}`);
    return;
  }

  // Obtener datos del trabajador
  const trabajador = authManager.getTrabajador();
  const sesion = {
    id_usuario: trabajador.id_usuario,
    nombres: trabajador.nombres,
    apellidos: trabajador.apellidos,
    correo: trabajador.correo,
    cargo: trabajador.cargo,
    rol: trabajador.rol,
    area_modulo: trabajador.area_modulo
  };

  // Renderizar layout con módulo
  renderAppLayout({
    mountNode,
    pageTitle: route.title,
    activePage: page,
    sesion,
    content: "<section id='module-root' class='space-y-6'></section>"
  });

  // Setup navegación del sidebar
  const navBtns = document.querySelectorAll("[data-nav-page]");
  console.log(`✅ Found ${navBtns.length} navigation buttons`);
  
  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetPage = btn.dataset.navPage;
      console.log(`🔄 Navegando a: ${targetPage}`);
      navegarA(targetPage);
    });
  });

  // Setup logout para sidebar y cabecera
  const bindLogout = (buttonId) => {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener("click", () => {
      openModal({
        title: "🚪 Cerrar Sesión",
        content: `
          <div class="space-y-4">
            <p class="text-base text-slate-700">¿Estás seguro de que deseas cerrar sesión?</p>
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p class="text-sm text-amber-800">
                Se cerrará tu sesión actual y deberás ingresar nuevamente con tu DNI.
              </p>
            </div>
          </div>
        `,
        confirmText: "Sí, cerrar sesión",
        cancelText: "Cancelar",
        onConfirm: (close) => {
          button.classList.add("animate-pulse");
          button.disabled = true;
          showToast("Cerrando sesión...", "info");

          setTimeout(() => {
            close();
            setTimeout(() => {
              redirectToLogin();
            }, 500);
          }, 500);
        },
        onCancel: (close) => {
          close();
        }
      });
    });
  };

  bindLogout("btn-logout");
  bindLogout("btn-header-logout");

  // Inicializar módulo
  const moduleRoot = document.getElementById("module-root");
  if (moduleRoot && route.init) {
    console.log(`🚀 Inicializando módulo: ${page}`);
    
    // Ejecutar init (puede ser async o sync)
    const result = route.init({ mountNode: moduleRoot });
    
    // Si es una Promise, esperar a que se resuelva
    if (result instanceof Promise) {
      result
        .then(() => console.log(`✅ Módulo ${page} cargado exitosamente`))
        .catch(err => console.error(`❌ Error cargando ${page}:`, err));
    } else {
      console.log(`✅ Módulo ${page} cargado exitosamente`);
    }
  } else {
    console.error(`❌ Error: No se pudo cargar el módulo ${page}`, { moduleRoot, routeInit: route.init });
  }
}

