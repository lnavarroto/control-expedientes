import { icon } from "./icons.js";

const links = [
  { key: "dashboard", label: "Dashboard", iconName: "dashboard", category: "Operaciones" },
  { key: "registro", label: "Registrar expedientes", iconName: "registro", category: "Operaciones" },
  { key: "expedientes", label: "Ver expedientes", iconName: "expedientes", category: "Operaciones" },
  { key: "busqueda", label: "Búsqueda avanzada", iconName: "busqueda", category: "Operaciones" },
  { key: "ubicaciones", label: "Gestión de ubicaciones", iconName: "ubicaciones", category: "Gestión" },
  { key: "paquetes", label: "Gestión de paquetes", iconName: "paquetes", category: "Gestión" },
  { key: "movimientos", label: "Movimientos", iconName: "movimientos", category: "Gestión" },
  { key: "configuracion", label: "Configuración", iconName: "configuracion", category: "Sistema" }
];

export function renderSidebar(activePage) {
  // Agrupar links por categoría
  const grouped = {};
  links.forEach(link => {
    if (!grouped[link.category]) grouped[link.category] = [];
    grouped[link.category].push(link);
  });

  let navHTML = '';
  Object.keys(grouped).forEach(category => {
    navHTML += `
      <div class="mb-6">
        <p class="text-xs uppercase tracking-widest font-semibold text-slate-400 px-2 mb-2">${category}</p>
        <div class="space-y-1">
          ${grouped[category]
            .map(link => {
              const activeClass = activePage === link.key ? "active" : "";
              return `<button class="nav-link ${activeClass}" data-nav-page="${link.key}" type="button" title="${link.label}"><span class="flex items-center gap-3"><span class="text-lg flex-shrink-0">${icon(link.iconName)}</span><span class="text-sm font-medium truncate">${link.label}</span></span></button>`;
            })
            .join('')}
        </div>
      </div>
    `;
  });

  return `
    <div class="flex flex-col h-full">
      <div class="pb-6 border-b border-slate-700/50">
        <div class="px-4 py-3 bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-lg border border-blue-500/20 mb-4">
          <p class="text-xs uppercase tracking-widest font-bold text-blue-400 mb-1">Control de</p>
          <h1 class="font-bold text-xl text-white" style="font-family: 'Merriweather', serif;">Expedientes</h1>
        </div>
        <p class="text-xs text-slate-400 px-4">Sistema de gestión documental judicial</p>
      </div>

      <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-2" id="sidebar-nav">
        ${navHTML}
      </nav>

      <div class="border-t border-slate-700/50 pt-4 px-3">
        <button id="btn-logout" class="nav-link w-full justify-center hover:bg-red-500/10 hover:text-red-400 text-slate-300 transition-all duration-200" type="button">
          <span class="flex items-center gap-2"><span class="text-lg">${icon("logout")}</span><span class="text-sm font-medium">Cerrar sesión</span></span>
        </button>
      </div>
    </div>
  `;
}
