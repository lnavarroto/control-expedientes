import { icon } from "./icons.js";

export function renderHeader(title, sesion) {
  return `
    <header class="px-5 py-2 border-b border-slate-200 bg-white/50 backdrop-blur-sm flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-600 uppercase tracking-wide">${title}</h2>
      <button id="btn-header-logout" class="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-red-100 hover:bg-red-200 text-red-700 transition-colors font-medium">
        <span class="text-sm">${icon("logout", "w-4 h-4")}</span>
        <span>Cerrar sesión</span>
      </button>
    </header>
  `;
}
