/**
 * Componente Dashboard - Cards resumen de Configuración
 */

import { icon } from "./icons.js";
import { CARD_TONES } from "../core/uiTokens.js";

export function renderConfigDashboard(stats) {
  const cards = [
    { label: "Juzgados", value: stats.juzgados, detail: "Activos en el sistema", iconName: "scales", tone: "primary" },
    { label: "Materias", value: stats.materias, detail: "Categorías judiciales", iconName: "bookOpen", tone: "success" },
    { label: "Ubicaciones", value: stats.ubicaciones, detail: "Puntos de archivo", iconName: "mapPin", tone: "accent" },
    { label: "Estados", value: stats.estados, detail: "Estados disponibles", iconName: "target", tone: "warning" }
  ];

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      ${cards.map((card) => {
        const tone = CARD_TONES[card.tone] || CARD_TONES.neutral;
        return `
          <div class="dashboard-card bg-gradient-to-br ${tone.surface} border ${tone.border} rounded-lg p-5 shadow-sm hover:shadow-md transition">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium ${tone.text}">${card.label}</p>
                <p class="text-2xl font-bold text-slate-900 mt-1">${card.value}</p>
              </div>
              <div class="${tone.icon}">${icon(card.iconName, "w-6 h-6")}</div>
            </div>
            <p class="text-xs ${tone.text} mt-3">${card.detail}</p>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

export function renderConfigMenu(modules, activeModule) {
  return `
    <nav class="space-y-1">
      ${modules.map(mod => {
        const isActive = activeModule === mod.id;
        return `
          <button 
            class="config-menu-item w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 ${
              isActive
                ? 'bg-gradient-to-r from-indigo-600 to-slate-700 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }${mod.isSpecial && !isActive ? ' border border-slate-200' : ''}"
            data-module="${mod.id}"
          >
            <span class="inline-flex shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}">${icon(mod.iconName || mod.icon, "w-4 h-4")}</span>
            <div class="min-w-0 flex-1">
              <p class="font-medium text-sm leading-tight">${mod.label}</p>
              <p class="text-xs opacity-60 leading-tight truncate">${mod.description}</p>
            </div>
          </button>
        `;
      }).join('')}
    </nav>
  `;
}
