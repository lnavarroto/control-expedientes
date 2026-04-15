import { renderSummaryCard } from "../../components/summaryCard.js";
import { expedienteService } from "../../services/expedienteService.js";
import { navegarA } from "../../router.js";

export function initDashboardPage({ mountNode }) {
  const resumen = expedienteService.obtenerResumen();
  const cards = [
    { title: "Expedientes registrados hoy", value: resumen.hoy, accent: "#0f3557" },
    { title: "Expedientes en paquetes", value: resumen.paquetes, accent: "#1d5f8b" },
    { title: "Expedientes en tránsito", value: resumen.transito, accent: "#b2711f" },
    { title: "Expedientes ubicados", value: resumen.ubicados, accent: "#1d7a46" },
    { title: "Prestados / derivados", value: resumen.retirados, accent: "#ab2f2f" }
  ];

  const quickActions = [
    { 
      label: "Registrar expedientes", 
      page: "registro", 
      detail: "Ingreso manual o por lectora",
      icon: "📝",
      color: "from-blue-50 to-blue-100",
      border: "border-blue-300"
    },
    { 
      label: "Ver expedientes", 
      page: "expedientes", 
      detail: "Listado con filtros y acciones",
      icon: "📋",
      color: "from-slate-50 to-slate-100",
      border: "border-slate-300"
    },
    { 
      label: "Gestión de ubicaciones", 
      page: "ubicaciones", 
      detail: "Movimientos y trazabilidad",
      icon: "📍",
      color: "from-green-50 to-green-100",
      border: "border-green-300"
    },
    { 
      label: "Gestión de paquetes", 
      page: "paquetes", 
      detail: "Agrupar y reasignar",
      icon: "📦",
      color: "from-amber-50 to-amber-100",
      border: "border-amber-300"
    },
    { 
      label: "Búsqueda de expedientes", 
      page: "busqueda", 
      detail: "Consulta avanzada",
      icon: "🔍",
      color: "from-purple-50 to-purple-100",
      border: "border-purple-300"
    },
    { 
      label: "Movimientos e historial", 
      page: "movimientos", 
      detail: "Control de traslado",
      icon: "📊",
      color: "from-orange-50 to-orange-100",
      border: "border-orange-300"
    },
    { 
      label: "Actualización de datos", 
      page: "actualizacion", 
      detail: "Preparado para sincronización",
      icon: "🔄",
      color: "from-rose-50 to-rose-100",
      border: "border-rose-300"
    }
  ];

  mountNode.innerHTML = `
    <section class="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">${cards.map((card) => renderSummaryCard(card)).join("")}</section>
    <section class="card-surface p-6">
      <h3 class="font-bold text-xl text-slate-900">⚡ Accesos rápidos</h3>
      <p class="text-slate-500 text-sm mt-1">Navegación principal para operaciones diarias del archivo.</p>
      <div class="mt-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4" id="quick-actions-container">
        ${quickActions
          .map(
            (item) => `
          <button 
            class="quick-action-btn group relative overflow-hidden rounded-lg border-2 ${item.border} bg-gradient-to-br ${item.color} p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 cursor-pointer"
            data-page="${item.page}"
          >
            <!-- Background gradient effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <!-- Content -->
            <div class="relative z-10">
              <div class="flex items-start gap-3">
                <span class="text-3xl">${item.icon}</span>
                <div class="text-left">
                  <p class="font-bold text-slate-900 group-hover:text-slate-900 transition-colors">${item.label}</p>
                  <p class="text-xs text-slate-600 mt-1">${item.detail}</p>
                </div>
              </div>
            </div>
          </button>
        `
          )
          .join("")}
      </div>
    </section>
  `;

  // Agregar listeners a los botones
  document.querySelectorAll(".quick-action-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      navegarA(page);
    });
  });
}
