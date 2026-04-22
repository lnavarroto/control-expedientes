import { icon } from "./icons.js";

const SIDEBAR_BRAND_TITLE = "Control de Expedientes";
const SIDEBAR_BRAND_ICON = "../assets/icons/favicon.ico";

const links = [
  { key: "dashboard", label: "Dashboard", iconName: "dashboard", category: "Operaciones" },
  { key: "registro", label: "Registrar expedientes", iconName: "registro", category: "Operaciones" },
  { key: "expedientes", label: "Ver expedientes", iconName: "expedientes", category: "Operaciones" },
  { key: "busqueda", label: "Búsqueda avanzada", iconName: "busqueda", category: "Operaciones" },
  { key: "ubicaciones", label: "Gestión de ubicaciones", iconName: "ubicaciones", category: "Gestión" },
  { key: "paquetes", label: "Gestión de paquetes", iconName: "paquetes", category: "Gestión" },
  { key: "movimientos", label: "Movimientos", iconName: "transfer", category: "Gestión" },
  { key: "configuracion", label: "Configuración", iconName: "configuracion", category: "Sistema" }
];

export function renderSidebar(activePage, collapsed = false) {
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
        <p class="sidebar-category text-xs uppercase tracking-widest font-semibold text-slate-400 px-2 mb-2">${category}</p>
        <div class="space-y-1">
          ${grouped[category]
            .map(link => {
              const activeClass = activePage === link.key ? "active" : "";
              return `<button class="nav-link ${activeClass}" data-nav-page="${link.key}" type="button" title="${link.label}"><span class="flex items-center gap-3 w-full nav-link-inner"><span class="text-lg flex-shrink-0">${icon(link.iconName)}</span><span class="nav-label text-sm font-medium truncate">${link.label}</span></span></button>`;
            })
            .join('')}
        </div>
      </div>
    `;
  });

  return `
    <div class="flex flex-col h-full">
      <div class="pb-6 border-b border-slate-700/50">
        <div class="sidebar-top-row relative mb-4">
          <div class="sidebar-brand-card min-w-0 w-full pr-16 px-4 py-3.5 rounded-2xl" title="${SIDEBAR_BRAND_TITLE}">
            <div class="sidebar-brand-card-inner flex items-center gap-3">
              <div class="sidebar-brand-icon flex h-9 w-14 items-center justify-center overflow-hidden">
                <img src="${SIDEBAR_BRAND_ICON}" alt="${SIDEBAR_BRAND_TITLE}" class="sidebar-brand-image h-full w-full object-contain" />
              </div>
              <div class="min-w-0">
                <p class="sidebar-brand-kicker text-[0.62rem] uppercase tracking-[0.22em] text-blue-200/80 font-semibold mb-1">Plataforma judicial</p>
                <h1 class="sidebar-brand-title font-bold text-xl text-white leading-tight" style="font-family: 'Merriweather', serif;">${SIDEBAR_BRAND_TITLE}</h1>
              </div>
            </div>
          </div>
          <button id="btn-sidebar-toggle" class="btn-sidebar-toggle absolute right-1 top-1/2 -translate-y-1/2 shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-300/20 bg-slate-900/75 text-blue-100 hover:bg-blue-500/20 hover:text-white transition-colors" type="button" title="${collapsed ? "Expandir menu" : "Colapsar menu"}">
            ${collapsed ? icon("chevronRight", "w-5 h-5") : icon("chevronLeft", "w-5 h-5")}
          </button>
        </div>
        <p class="sidebar-description text-xs text-slate-400 px-4">Sistema de gestión documental judicial</p>
      </div>

      <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-2" id="sidebar-nav">
        ${navHTML}
      </nav>

      <div class="border-t border-slate-700/50 pt-4 px-3">
        <button id="btn-logout" class="nav-link w-full hover:bg-red-500/10 hover:text-red-400 text-slate-300 transition-all duration-200" type="button" title="Cerrar sesion">
          <span class="flex items-center gap-2 w-full nav-link-inner"><span class="text-lg">${icon("logout")}</span><span class="nav-label text-sm font-medium">Cerrar sesión</span></span>
        </button>
      </div>
    </div>
  `;
}
