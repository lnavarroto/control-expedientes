/**
 * Componente Dashboard - Cards resumen de Configuración
 */

export function renderConfigDashboard(stats) {
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="dashboard-card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5 shadow-sm hover:shadow-md transition">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-blue-700">Juzgados</p>
            <p class="text-2xl font-bold text-blue-900 mt-1">${stats.juzgados}</p>
          </div>
          <div class="text-2xl">⚖️</div>
        </div>
        <p class="text-xs text-blue-600 mt-3">Activos en el sistema</p>
      </div>

      <div class="dashboard-card bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-5 shadow-sm hover:shadow-md transition">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-emerald-700">Materias</p>
            <p class="text-2xl font-bold text-emerald-900 mt-1">${stats.materias}</p>
          </div>
          <div class="text-2xl">📚</div>
        </div>
        <p class="text-xs text-emerald-600 mt-3">Categorías judiciales</p>
      </div>

      <div class="dashboard-card bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-5 shadow-sm hover:shadow-md transition">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-purple-700">Ubicaciones</p>
            <p class="text-2xl font-bold text-purple-900 mt-1">${stats.ubicaciones}</p>
          </div>
          <div class="text-2xl">📍</div>
        </div>
        <p class="text-xs text-purple-600 mt-3">Puntos de archivo</p>
      </div>

      <div class="dashboard-card bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-5 shadow-sm hover:shadow-md transition">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-medium text-orange-700">Estados</p>
            <p class="text-2xl font-bold text-orange-900 mt-1">${stats.estados}</p>
          </div>
          <div class="text-2xl">🎯</div>
        </div>
        <p class="text-xs text-orange-600 mt-3">Estados disponibles</p>
      </div>
    </div>
  `;
}

export function renderConfigMenu(modules, activeModule) {
  return `
    <nav class="space-y-1">
      ${modules.map(mod => `
        <button 
          class="config-menu-item w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
            activeModule === mod.id 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-700 hover:bg-slate-100'
          }"
          data-module="${mod.id}"
        >
          <span class="text-lg">${mod.icon}</span>
          <div>
            <p class="font-medium">${mod.label}</p>
            <p class="text-xs opacity-75">${mod.description}</p>
          </div>
        </button>
      `).join('')}
    </nav>
  `;
}
