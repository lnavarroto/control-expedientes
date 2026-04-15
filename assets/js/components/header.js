export function renderHeader(title, sesion) {
  const fecha = new Intl.DateTimeFormat("es-PE", { dateStyle: "full" }).format(new Date());
  const nombreCompleto = sesion?.nombres ? `${sesion.nombres} ${sesion.apellidos || ""}`.trim() : "Usuario";
  const dni = sesion?.dni || "-";
  const cargo = sesion?.cargo || sesion?.rol || "Trabajador";
  
  return `
    <header class="card-surface px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-xl md:text-2xl font-bold" style="font-family: 'Merriweather', serif;">${title}</h2>
        <p class="text-sm text-slate-500 capitalize">${fecha}</p>
      </div>
      <div class="text-sm text-right">
        <p class="font-semibold text-slate-700">${nombreCompleto}</p>
        <p class="text-slate-500 flex items-center justify-end gap-1">
          <span class="font-mono">${dni}</span>
          <span>·</span>
          <span>${cargo}</span>
          <button id="btn-logout" class="ml-3 px-2 py-1 text-xs rounded bg-red-100 hover:bg-red-200 text-red-700 transition-colors">Cerrar sesión</button>
        </p>
      </div>
    </header>
  `;
}
