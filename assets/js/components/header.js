import { icon } from "./icons.js";

export function renderHeader(title, sesion) {
  return `
    <header class="px-5 py-3 border-b border-slate-200 bg-white/70 backdrop-blur-sm flex items-center justify-between gap-3 rounded-xl">
      <div class="flex items-center gap-3 min-w-0">
        <button id="btn-hamburger" class="lg:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl border border-slate-200 bg-slate-900 text-white hover:bg-slate-700 transition-colors shrink-0" type="button" aria-label="Abrir menú">
          <span class="hamburger-line block w-5 h-0.5 bg-white rounded transition-all"></span>
          <span class="hamburger-line block w-5 h-0.5 bg-white rounded mt-1 transition-all"></span>
          <span class="hamburger-line block w-5 h-0.5 bg-white rounded mt-1 transition-all"></span>
        </button>
        <h2 class="text-base md:text-lg font-bold text-slate-800 tracking-tight truncate">${title}</h2>
      </div>
      <button id="btn-header-logout" class="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors font-semibold border border-red-200/80">
        <span class="text-sm">${icon("logout", "w-4 h-4")}</span>
        <span>Cerrar sesión</span>
      </button>
    </header>
  `;
}
