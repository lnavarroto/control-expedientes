/**
 * Página Principal de Configuración - Panel Administrativo Profesional
 */

import { renderConfigDashboard, renderConfigMenu } from "../../components/configDashboard.js";
import { initJuzgadosModule } from "./juzgados.js";
import { initMateriasModule } from "./materias.js";
import { initUbicacionesConfigModule } from "./ubicaciones-config.js";
import { initEstadosModule } from "./estados.js";
import { initPerfilModule } from "./perfil.js";
import { initParametrosModule } from "./parametros.js";
import { initActualizacionModule } from "./actualizacion.js";
import { juzgadoService } from "../../services/juzgadoService.js";
import { materiaService } from "../../services/materiaService.js";
import { ubicacionConfigService } from "../../services/ubicacionConfigService.js";
import { estadoService } from "../../services/estadoService.js";

const MODULES = [
  { id: "dashboard", label: "Panel General", description: "Vista general del sistema", icon: "📊", isSpecial: true },
  { id: "juzgados", label: "Juzgados", description: "Gestión de juzgados", icon: "⚖️" },
  { id: "materias", label: "Materias", description: "Categorías judiciales", icon: "📚" },
  { id: "ubicaciones", label: "Ubicaciones", description: "Puntos de archivo", icon: "📍" },
  { id: "estados", label: "Estados", description: "Estados de expedientes", icon: "🎯" },
  { id: "perfil", label: "Mi Perfil", description: "Datos del operador", icon: "👤" },
  { id: "parametros", label: "Parámetros", description: "Configuración del sistema", icon: "⚙️" },
  { id: "actualizacion", label: "Actualización", description: "Sincronización de datos", icon: "🔄" }
];

function getStats() {
  return {
    juzgados: juzgadoService.listar().filter(j => j.activo).length,
    materias: materiaService.listar().filter(m => m.activo).length,
    ubicaciones: ubicacionConfigService.listar().filter(u => u.activo).length,
    estados: estadoService.listar().filter(e => e.activo).length
  };
}

function renderDashboardModule() {
  const stats = getStats();
  return `
    <div class="space-y-6">
      ${renderConfigDashboard(stats)}
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h3 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <span class="text-xl">📋</span>
            Información del Sistema
          </h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between pb-2 border-b border-slate-200">
              <span class="text-slate-600">Módulo Civil</span>
              <span class="font-medium">Archivo Sullana</span>
            </div>
            <div class="flex justify-between pb-2 border-b border-slate-200">
              <span class="text-slate-600">Fecha Sistema</span>
              <span class="font-medium">${new Date().toLocaleDateString('es-PE')}</span>
            </div>
            <div class="flex justify-between pb-2 border-b border-slate-200">
              <span class="text-slate-600">Total Registros</span>
              <span class="font-medium badge bg-blue-100 text-blue-800">${juzgadoService.listar().length + materiaService.listar().length + ubicacionConfigService.listar().length}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Estado</span>
              <span class="font-medium badge bg-emerald-100 text-emerald-800">✓ Operativo</span>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <h3 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <span class="text-xl">💡</span>
            Accesos Rápidos
          </h3>
          <div class="space-y-2">
            <button class="w-full text-left px-4 py-2 rounded bg-white hover:bg-blue-50 transition border border-blue-200 text-sm">
              → Crear nuevo juzgado
            </button>
            <button class="w-full text-left px-4 py-2 rounded bg-white hover:bg-blue-50 transition border border-blue-200 text-sm">
              → Gestionar materias
            </button>
            <button class="w-full text-left px-4 py-2 rounded bg-white hover:bg-blue-50 transition border border-blue-200 text-sm">
              → Revisar parámetros
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initConfiguacionPage({ mountNode }) {
  let currentModule = "dashboard";

  function renderLayout() {
    return `
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Sidebar -->
        <aside class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow border border-slate-200 p-4 sticky top-4">
            <h2 class="font-bold text-sm uppercase tracking-wide text-slate-700 mb-4 px-2">Centro de Control</h2>
            ${renderConfigMenu(MODULES, currentModule)}
          </div>
        </aside>

        <!-- Contenido Principal -->
        <main class="lg:col-span-4">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h1 id="module-title" class="text-3xl font-bold text-slate-900"></h1>
                <p id="module-desc" class="text-slate-600 mt-1"></p>
              </div>
              <div class="text-5xl" id="module-icon"></div>
            </div>
            
            <div id="module-content" class="space-y-6"></div>
          </div>
        </main>
      </div>
    `;
  }

  function switchModule(moduleId) {
    currentModule = moduleId;
    const module = MODULES.find(m => m.id === moduleId);
    
    // Actualizar header
    document.getElementById("module-title").textContent = module.label;
    document.getElementById("module-desc").textContent = module.description;
    document.getElementById("module-icon").textContent = module.icon;

    // Actualizar contenido
    const contentContainer = document.getElementById("module-content");
    contentContainer.innerHTML = "";

    if (moduleId === "dashboard") {
      contentContainer.innerHTML = renderDashboardModule();
    } else {
      // Contenedor para módulos
      const moduleNode = document.createElement("div");
      contentContainer.appendChild(moduleNode);
      
      // Renderizar módulo correspondiente
      switch (moduleId) {
        case "juzgados":
          initJuzgadosModule(moduleNode);
          break;
        case "materias":
          initMateriasModule(moduleNode);
          break;
        case "ubicaciones":
          initUbicacionesConfigModule(moduleNode);
          break;
        case "estados":
          initEstadosModule(moduleNode);
          break;
        case "perfil":
          initPerfilModule(moduleNode);
          break;
        case "parametros":
          initParametrosModule(moduleNode);
          break;
        case "actualizacion":
          initActualizacionModule(moduleNode);
          break;
      }
    }

    // Actualizar menu activo
    document.querySelectorAll(".config-menu-item").forEach(btn => {
      btn.classList.remove("bg-blue-600", "text-white", "shadow-md");
      btn.classList.add("text-slate-700", "hover:bg-slate-100");
      if (btn.dataset.module === moduleId) {
        btn.classList.remove("text-slate-700", "hover:bg-slate-100");
        btn.classList.add("bg-blue-600", "text-white", "shadow-md");
      }
    });
  }

  mountNode.innerHTML = renderLayout();

  // Event listeners
  document.querySelectorAll(".config-menu-item").forEach(btn => {
    btn.addEventListener("click", () => {
      switchModule(btn.dataset.module);
    });
  });

  // Inicializar con dashboard
  switchModule("dashboard");
}
