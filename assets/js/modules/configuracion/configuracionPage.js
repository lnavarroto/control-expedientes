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
import { ubicacionService } from "../../services/ubicacionService.js";
import { estadoService } from "../../services/estadoService.js";
import { icon } from "../../components/icons.js";

const MODULES = [
  { id: "dashboard", label: "Panel General", description: "Vista general del sistema", iconName: "dashboard", isSpecial: true },
  { id: "juzgados", label: "Juzgados", description: "Gestión de juzgados", iconName: "scales" },
  { id: "materias", label: "Materias", description: "Categorías judiciales", iconName: "bookOpen" },
  { id: "ubicaciones", label: "Ubicaciones", description: "Puntos de archivo", iconName: "mapPin" },
  { id: "estados", label: "Estados", description: "Estados de expedientes", iconName: "target" },
  { id: "perfil", label: "Mi Perfil", description: "Datos del operador", iconName: "user" },
  { id: "parametros", label: "Parámetros", description: "Configuración del sistema", iconName: "sliders" },
  { id: "actualizacion", label: "Actualización", description: "Sincronización de datos", iconName: "refreshCw" }
];

function getStats() {
  return {
    juzgados: juzgadoService.listar().filter(j => j.activo).length,
    materias: materiaService.listar().filter(m => m.activo).length,
    ubicaciones: ubicacionService.listarDesdeLocalStorage().filter(u => u.activo === "SI").length,
    estados: estadoService.listar().filter(e => e.activo).length
  };
}

function renderDashboardModule() {
  const stats = getStats();
  return `
    <div class="space-y-6">

      <!-- Hero banner configuración -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700 via-slate-800 to-indigo-900 p-4 md:p-5 shadow-lg">
        <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full -mr-32 -mt-32 opacity-10"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-slate-500 rounded-full -ml-24 -mb-24 opacity-10"></div>
        <div class="relative z-10 flex items-center gap-3">
          <span class="text-white opacity-90">${icon("sliders", "w-8 h-8 md:w-9 md:h-9")}</span>
          <div>
            <h1 class="text-xl md:text-2xl font-bold text-white">Panel de Configuración</h1>
            <p class="text-slate-300 text-sm font-medium mt-0.5">Gestiona juzgados, materias, estados y parámetros del sistema</p>
          </div>
        </div>
      </div>

      <!-- KPI cards catálogos -->
      <div>
        <h2 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span class="w-1 h-6 bg-gradient-to-b from-indigo-500 to-slate-600 rounded-full"></span>
          Catálogos activos
        </h2>
        ${renderConfigDashboard(stats)}
      </div>

      <!-- Info + Accesos rápidos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Info del sistema -->
        <div class="card-surface p-5">
          <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span class="text-slate-500">${icon("database", "w-4 h-4")}</span>
            Información del Sistema
          </h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between items-center py-2 border-b border-slate-100">
              <span class="text-slate-600">Módulo</span>
              <span class="font-semibold text-slate-800">Archivo Sullana</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-100">
              <span class="text-slate-600">Fecha del sistema</span>
              <span class="font-medium text-slate-800">${new Date().toLocaleDateString('es-PE')}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-100">
              <span class="text-slate-600">Total registros catálogo</span>
              <span class="badge bg-indigo-100 text-indigo-800 font-semibold">${juzgadoService.listar().length + materiaService.listar().length + ubicacionService.listarDesdeLocalStorage().length}</span>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="text-slate-600">Estado del sistema</span>
              <span class="badge bg-emerald-100 text-emerald-800 font-semibold">Operativo</span>
            </div>
          </div>
        </div>

        <!-- Accesos rápidos -->
        <div class="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl border border-indigo-200 p-5">
          <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span class="text-indigo-600">${icon("target", "w-4 h-4")}</span>
            Accesos Rápidos
          </h3>
          <div class="space-y-2">
            ${[
              { label: "Gestionar juzgados",  mod: "juzgados",    iconName: "scales"    },
              { label: "Gestionar materias",   mod: "materias",    iconName: "bookOpen"  },
              { label: "Revisar parámetros",   mod: "parametros",  iconName: "sliders"   },
              { label: "Ver mi perfil",        mod: "perfil",      iconName: "user"      }
            ].map(a => `
              <button class="quick-cfg-btn w-full text-left px-4 py-2.5 rounded-lg bg-white hover:bg-indigo-50 transition-colors border border-indigo-100 shadow-sm text-sm flex items-center gap-3 font-medium text-slate-700 hover:text-indigo-700" data-module="${a.mod}">
                <span class="text-indigo-500">${icon(a.iconName, "w-4 h-4")}</span>
                ${a.label}
              </button>
            `).join("")}
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
          <div class="bg-white rounded-xl shadow border border-slate-200 overflow-hidden sticky top-4">
            <!-- Sidebar header gradient -->
            <div class="relative bg-gradient-to-br from-slate-700 via-slate-800 to-indigo-900 px-4 py-4">
              <div class="absolute top-0 right-0 w-20 h-20 bg-indigo-500 rounded-full -mr-10 -mt-10 opacity-10"></div>
              <div class="relative z-10 flex items-center gap-2">
                <span class="text-white opacity-80">${icon("sliders", "w-5 h-5")}</span>
                <div>
                  <p class="text-xs font-bold uppercase tracking-widest text-slate-300">Centro de</p>
                  <p class="text-sm font-bold text-white leading-tight">Configuración</p>
                </div>
              </div>
            </div>
            <div class="p-3">
              ${renderConfigMenu(MODULES, currentModule)}
            </div>
          </div>
        </aside>

        <!-- Contenido Principal -->
        <main class="lg:col-span-4">
          <div class="space-y-4">
            <!-- Module header -->
            <div class="card-surface p-4 flex items-center gap-4">
              <div class="p-2.5 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 shadow-sm" id="module-icon"></div>
              <div class="flex-1 min-w-0">
                <h1 id="module-title" class="text-xl md:text-2xl font-bold text-slate-900 leading-tight"></h1>
                <p id="module-desc" class="text-sm text-slate-500 mt-0.5"></p>
              </div>
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
    document.getElementById("module-icon").innerHTML = icon(module.iconName || "dashboard", "w-6 h-6");

    // Actualizar contenido
    const contentContainer = document.getElementById("module-content");
    contentContainer.innerHTML = "";

    if (moduleId === "dashboard") {
      contentContainer.innerHTML = renderDashboardModule();
      // Conectar accesos rápidos del dashboard al router interno
      contentContainer.querySelectorAll(".quick-cfg-btn").forEach(btn => {
        btn.addEventListener("click", () => switchModule(btn.dataset.module));
      });
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
      const isActive = btn.dataset.module === moduleId;
      btn.classList.toggle("bg-gradient-to-r",       isActive);
      btn.classList.toggle("from-indigo-600",         isActive);
      btn.classList.toggle("to-slate-700",            isActive);
      btn.classList.toggle("text-white",              isActive);
      btn.classList.toggle("shadow-md",               isActive);
      btn.classList.toggle("text-slate-700",          !isActive);
      btn.classList.toggle("hover:bg-slate-100",      !isActive);
      btn.classList.toggle("hover:text-slate-900",    !isActive);
      // icono interno
      const iconSpan = btn.querySelector("span");
      if (iconSpan) {
        iconSpan.classList.toggle("text-white",       isActive);
        iconSpan.classList.toggle("text-slate-500",   !isActive);
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
