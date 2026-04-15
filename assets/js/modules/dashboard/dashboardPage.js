import { renderSummaryCard } from "../../components/summaryCard.js";
import { expedienteService } from "../../services/expedienteService.js";
import { navegarA } from "../../router.js";
import { authManager } from "../../auth/authManager.js";

export async function initDashboardPage({ mountNode }) {
  function renderDashboard(expedientes) {
    // Obtener datos del usuario
    const trabajador = authManager.getTrabajador();
    const nombreUsuario = trabajador?.nombres || "Usuario";
    const cargoUsuario = trabajador?.cargo || "Sin cargo";

    const hoy = new Date().toISOString().slice(0, 10);
    const total = expedientes.length;
    const resumen = {
      hoy: expedientes.filter(e => { const fecha = e.fecha_ingreso || ""; return fecha.startsWith(hoy) || fecha === hoy; }).length,
      paquetes: expedientes.filter(e => e.id_paquete || e.paqueteId).length,
      transito: expedientes.filter(e => e.id_estado === "3" || e.estado?.toLowerCase().includes("tránsito")).length,
      ubicados: expedientes.filter(e => e.id_estado === "2" || e.estado?.toLowerCase().includes("ubicado")).length,
      retirados: expedientes.filter(e => e.id_estado === "4" || e.id_estado === "5" || e.estado?.toLowerCase().includes("prestado") || e.estado?.toLowerCase().includes("derivado")).length
    };

    const stats = [
      { icon: "📅", label: "Hoy", value: resumen.hoy, percent: total > 0 ? Math.round((resumen.hoy/total)*100) : 0, color: "from-blue-500 to-blue-600", light: "from-blue-50 to-blue-100" },
      { icon: "📦", label: "Paquetes", value: resumen.paquetes, percent: total > 0 ? Math.round((resumen.paquetes/total)*100) : 0, color: "from-amber-500 to-amber-600", light: "from-amber-50 to-amber-100" },
      { icon: "🚚", label: "Tránsito", value: resumen.transito, percent: total > 0 ? Math.round((resumen.transito/total)*100) : 0, color: "from-orange-500 to-orange-600", light: "from-orange-50 to-orange-100" },
      { icon: "📍", label: "Ubicados", value: resumen.ubicados, percent: total > 0 ? Math.round((resumen.ubicados/total)*100) : 0, color: "from-green-500 to-green-600", light: "from-green-50 to-green-100" },
      { icon: "🔄", label: "Otros", value: resumen.retirados, percent: total > 0 ? Math.round((resumen.retirados/total)*100) : 0, color: "from-red-500 to-red-600", light: "from-red-50 to-red-100" }
    ];

    const quickActions = [
      { label: "Registrar", page: "registro", detail: "Ingreso manual o lectora", icon: "✍️", bg: "from-blue-500 to-cyan-500", light: "from-blue-50 to-cyan-50", border: "border-blue-200" },
      { label: "Ver listado", page: "expedientes", detail: "Con filtros y opciones", icon: "📋", bg: "from-slate-500 to-slate-600", light: "from-slate-50 to-slate-100", border: "border-slate-200" },
      { label: "Ubicaciones", page: "ubicaciones", detail: "Movimientos en tiempo real", icon: "🗺️", bg: "from-green-500 to-emerald-500", light: "from-green-50 to-emerald-50", border: "border-green-200" },
      { label: "Paquetes", page: "paquetes", detail: "Gestión y agrupación", icon: "📫", bg: "from-amber-500 to-orange-500", light: "from-amber-50 to-orange-50", border: "border-amber-200" },
      { label: "Búsqueda", page: "busqueda", detail: "Consulta avanzada", icon: "🔎", bg: "from-purple-500 to-pink-500", light: "from-purple-50 to-pink-50", border: "border-purple-200" }
    ];

    const statsHTML = stats.map(s => `<div class="group relative overflow-hidden rounded-xl bg-gradient-to-br ${s.light} border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105"><div class="absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-5 transition-opacity"></div><div class="relative z-10"><div class="flex items-center justify-between mb-3"><div class="text-3xl">${s.icon}</div><div class="text-xs font-bold px-2 py-1 rounded-full bg-white/80 text-slate-700">${s.percent}%</div></div><div class="mb-2"><p class="text-sm font-semibold text-slate-600">${s.label}</p><p class="text-2xl font-bold text-slate-900 mt-1">${s.value}</p></div><div class="w-full bg-slate-200 rounded-full h-1.5"><div class="bg-gradient-to-r ${s.color} h-full transition-all duration-500" style="width:${s.percent}%"></div></div></div></div>`).join("");

    const actionsHTML = quickActions.map(a => `<button data-nav-page="${a.page}" class="quick-action-btn group relative overflow-hidden rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"><div class="absolute inset-0 bg-gradient-to-br ${a.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div><div class="relative z-10 bg-gradient-to-br ${a.light} border ${a.border} p-6 group-hover:bg-opacity-20 transition-all"><div class="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">${a.icon}</div><h3 class="font-bold text-lg text-slate-900">${a.label}</h3><p class="text-sm text-slate-600 mt-1">${a.detail}</p><div class="mt-3 inline-flex items-center text-xs font-semibold text-slate-700 group-hover:text-white transition-colors">Abrir →</div></div></button>`).join("");

    mountNode.innerHTML = `<section class="space-y-6"><div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-8 shadow-xl"><div class="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full -mr-48 -mt-48 opacity-10"></div><div class="absolute bottom-0 left-0 w-72 h-72 bg-blue-400 rounded-full -ml-36 -mb-36 opacity-10"></div><div class="relative z-10"><h1 class="text-4xl font-bold text-white mb-2">👤 ${nombreUsuario}</h1><p class="text-blue-100 font-medium text-lg">${cargoUsuario}</p></div></div><div><h2 class="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2"><span class="w-1 h-8 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></span>Accesos Rápidos</h2><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">${actionsHTML}</div></div></section>`;

    // Agregar event listeners a los botones de acceso rápido
    const buttons = mountNode.querySelectorAll(".quick-action-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const page = btn.getAttribute("data-nav-page");
        if (page) {
          navegarA(page);
        }
      });
    });
  }

  const cachedExp = expedienteService.listarDelBackendSync();
  
  if (cachedExp.length > 0) {
    console.log("⚡ Dashboard: Mostrando datos del caché (carga rápida)");
    renderDashboard(cachedExp);
    
    expedienteService.listarDelBackend()
      .then(resultado => {
        if (resultado.success && resultado.data) {
          console.log("✅ Dashboard: Datos actualizados del backend");
          renderDashboard(resultado.data);
        }
      })
      .catch(err => console.warn("⚠️ Error actualizando dashboard en background:", err));
    
    return;
  }

  mountNode.innerHTML = `<div class="text-center py-12"><p class="text-slate-500 font-medium mb-4">📊 Cargando datos del dashboard...</p><div class="inline-block"><div class="animate-spin w-8 h-8 border-4 border-slate-300 border-t-blue-500 rounded-full"></div></div></div>`;

  try {
    const resultado = await expedienteService.listarDelBackend();
    const expedientes = resultado.success ? resultado.data : [];

    if (!resultado.success || !resultado.data) {
      mountNode.innerHTML = `<div class="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-6"><p class="font-semibold text-orange-800">⚠️ Error al cargar expedientes</p><p class="text-sm text-orange-700 mt-2">No se pudo conectar con el backend. Intenta recargar.</p><button onclick="location.reload()" class="mt-4 px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 font-medium">🔄 Recargar</button></div>`;
      return;
    }

    renderDashboard(expedientes);
  } catch (error) {
    console.error("Error cargando datos del dashboard:", error);
    mountNode.innerHTML = `<div class="rounded-lg border-l-4 border-red-400 bg-red-50 p-6"><p class="font-semibold text-red-800">❌ Error al cargar dashboard</p><p class="text-sm text-red-700 mt-2">${error.message}</p><button onclick="location.reload()" class="mt-4 px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 font-medium">🔄 Recargar</button></div>`;
  }
}
