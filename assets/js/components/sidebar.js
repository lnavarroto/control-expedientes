import { icon } from "./icons.js";

const links = [
  { key: "dashboard", label: "Dashboard", iconName: "dashboard" },
  { key: "registro", label: "Registrar expedientes", iconName: "registro" },
  { key: "expedientes", label: "Ver expedientes", iconName: "expedientes" },
  { key: "ubicaciones", label: "Gestión de ubicaciones", iconName: "ubicaciones" },
  { key: "paquetes", label: "Gestión de paquetes", iconName: "paquetes" },
  { key: "busqueda", label: "Búsqueda avanzada", iconName: "busqueda" },
  { key: "movimientos", label: "Movimientos", iconName: "movimientos" },
  { key: "configuracion", label: "Configuración", iconName: "configuracion" }
];

export function renderSidebar(activePage) {
  const items = links
    .map((link) => {
      const activeClass = activePage === link.key ? "active" : "";
      return `<button class="nav-link ${activeClass}" data-nav-page="${link.key}" type="button">${icon(link.iconName)}<span>${link.label}</span></button>`;
    })
    .join("");

  return `
    <div class="mb-8">
      <p class="text-xs uppercase tracking-[0.2em] text-slate-300">Módulo Civil</p>
      <h1 class="font-bold text-2xl mt-2" style="font-family: 'Merriweather', serif;">Archivo Sullana</h1>
      <p class="text-slate-300 text-sm mt-2">Sistema de gestión documental judicial</p>
    </div>
    <nav class="space-y-1" id="sidebar-nav">${items}</nav>
    <div class="mt-8 pt-5 border-t border-slate-700">
      <button id="btn-logout" class="nav-link w-full" type="button">${icon("logout")}<span>Cerrar sesión</span></button>
    </div>
  `;
}
