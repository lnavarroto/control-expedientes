export function renderHeader(title, sesion) {
  return `
    <header class="px-5 py-2 border-b border-slate-200 bg-white/50 backdrop-blur-sm flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-600 uppercase tracking-wide">${title}</h2>
      <button id="btn-logout" class="px-3 py-1.5 text-xs rounded-md bg-red-100 hover:bg-red-200 text-red-700 transition-colors font-medium">Cerrar sesión</button>
    </header>
  `;
}
