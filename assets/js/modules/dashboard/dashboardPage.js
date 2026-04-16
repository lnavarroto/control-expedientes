import { expedienteService } from "../../services/expedienteService.js";
import { navegarA } from "../../router.js";
import { authManager } from "../../auth/authManager.js";

export async function initDashboardPage({ mountNode }) {
  const normalizar = (valor = "") => String(valor)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const soloDigitos = (valor = "") => String(valor || "").replace(/\D+/g, "");

  const parsearFechaRegistro = (expediente) => {
    const fechaRaw = String(expediente.fecha_ingreso || expediente.fecha_hora_ingreso || "").trim();
    if (!fechaRaw) return null;

    const iso = fechaRaw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const [, anio, mes, dia] = iso;
      return new Date(Number(anio), Number(mes) - 1, Number(dia));
    }

    const local = fechaRaw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (local) {
      const [, dia, mes, anio] = local;
      return new Date(Number(anio), Number(mes) - 1, Number(dia));
    }

    const intento = new Date(fechaRaw);
    if (!Number.isNaN(intento.getTime())) {
      return new Date(intento.getFullYear(), intento.getMonth(), intento.getDate());
    }

    return null;
  };

  const esMismoDia = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const obtenerInicioSemana = (fecha) => {
    const base = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const dia = base.getDay();
    const ajuste = dia === 0 ? -6 : 1 - dia; // Lunes como inicio
    base.setDate(base.getDate() + ajuste);
    return base;
  };

  function renderDashboard(expedientes) {
    // Obtener datos del usuario
    const trabajador = authManager.getTrabajador();
    const nombreUsuario = trabajador?.nombres || "Usuario";
    const cargoUsuario = trabajador?.cargo || "Sin cargo";

    const nombreCompletoUsuario = `${trabajador?.nombres || ""} ${trabajador?.apellidos || ""}`.trim();
    const nombresUsuario = normalizar(trabajador?.nombres || "");
    const apellidosUsuario = normalizar(trabajador?.apellidos || "");
    const dniUsuario = soloDigitos(trabajador?.dni || "");
    const idUsuario = normalizar(trabajador?.id_usuario || "");
    const nombreUsuarioNormalizado = normalizar(nombreCompletoUsuario);

    const hoy = new Date();
    const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioSemana = obtenerInicioSemana(hoyLocal);
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);

    const esDelUsuarioConectado = (exp) => {
      const dniRegistro = soloDigitos(exp.dni_usuario || exp.dniUsuario || "");

      const idRegistro = [
        exp.id_usuario,
        exp.idUsuario,
        exp.id_usuario_registro,
        exp.registrado_por_id
      ]
        .map((v) => normalizar(v || ""))
        .find(Boolean);

      const nombreRegistro = normalizar(
        exp.registrado_por
          || exp.registradoPor
          || `${exp.nombres_usuario || ""} ${exp.apellidos_usuario || ""}`
      );

      if (dniUsuario && dniRegistro && dniUsuario === dniRegistro) return true;
      if (idUsuario && idRegistro && idUsuario === idRegistro) return true;

      if (nombreUsuarioNormalizado && nombreRegistro) {
        if (nombreRegistro === nombreUsuarioNormalizado) return true;
        if (nombreRegistro.includes(nombreUsuarioNormalizado)) return true;
        if (nombreUsuarioNormalizado.includes(nombreRegistro)) return true;
      }

      if (nombresUsuario && apellidosUsuario && nombreRegistro) {
        return nombreRegistro.includes(nombresUsuario) && nombreRegistro.includes(apellidosUsuario);
      }

      return false;
    };

    const expedientesUsuario = expedientes.filter(esDelUsuarioConectado);

    const registrosHoyUsuario = expedientesUsuario.filter((exp) => {
      const fecha = parsearFechaRegistro(exp);
      return fecha ? esMismoDia(fecha, hoyLocal) : false;
    }).length;

    const registrosSemanaUsuario = expedientesUsuario.filter((exp) => {
      const fecha = parsearFechaRegistro(exp);
      return fecha ? fecha >= inicioSemana && fecha <= finSemana : false;
    }).length;

    const registrosMesUsuario = expedientesUsuario.filter((exp) => {
      const fecha = parsearFechaRegistro(exp);
      return fecha
        ? fecha.getMonth() === hoyLocal.getMonth() && fecha.getFullYear() === hoyLocal.getFullYear()
        : false;
    }).length;

    const totalBd = expedientes.length;

    const cardsKpi = [
      {
        icon: "🗓️",
        titulo: "Hoy (Mi registro)",
        valor: registrosHoyUsuario,
        detalle: "Expedientes registrados hoy por tu usuario",
        bg: "from-blue-50 to-cyan-50",
        border: "border-blue-200",
        badge: "text-blue-700"
      },
      {
        icon: "📆",
        titulo: "Semana (Mi registro)",
        valor: registrosSemanaUsuario,
        detalle: "Registros de lunes a domingo del usuario conectado",
        bg: "from-emerald-50 to-green-50",
        border: "border-emerald-200",
        badge: "text-emerald-700"
      },
      {
        icon: "🗂️",
        titulo: "Mes (Mi registro)",
        valor: registrosMesUsuario,
        detalle: "Registros del mes actual del usuario conectado",
        bg: "from-amber-50 to-orange-50",
        border: "border-amber-200",
        badge: "text-amber-700"
      },
      {
        icon: "🏛️",
        titulo: "Total BD",
        valor: totalBd,
        detalle: "Total de expedientes en la base de datos",
        bg: "from-violet-50 to-fuchsia-50",
        border: "border-violet-200",
        badge: "text-violet-700"
      }
    ];

    const cardsKpiHtml = cardsKpi
      .map((card) => `
        <article class="relative overflow-hidden rounded-xl bg-gradient-to-br ${card.bg} border ${card.border} p-3 md:p-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs md:text-sm font-semibold text-slate-600">${card.titulo}</p>
              <p class="text-2xl md:text-3xl font-bold text-slate-900 mt-1">${card.valor}</p>
            </div>
            <span class="text-3xl md:text-4xl leading-none">${card.icon}</span>
          </div>
          <p class="mt-2 text-[11px] md:text-xs font-medium ${card.badge}">${card.detalle}</p>
        </article>
      `)
      .join("");

    const quickActions = [
      { label: "Registrar", page: "registro", detail: "Ingreso manual o lectora", icon: "✍️", bg: "from-blue-500 to-cyan-500", light: "from-blue-50 to-cyan-50", border: "border-blue-200" },
      { label: "Ver listado", page: "expedientes", detail: "Con filtros y opciones", icon: "📋", bg: "from-slate-500 to-slate-600", light: "from-slate-50 to-slate-100", border: "border-slate-200" },
      { label: "Búsqueda avanzada", page: "busqueda", detail: "Consulta por filtros", icon: "🔎", bg: "from-indigo-500 to-violet-500", light: "from-indigo-50 to-violet-50", border: "border-indigo-200" },
      { label: "Ubicaciones", page: "ubicaciones", detail: "Movimientos en tiempo real", icon: "🗺️", bg: "from-green-500 to-emerald-500", light: "from-green-50 to-emerald-50", border: "border-green-200" },
      { label: "Paquetes", page: "paquetes", detail: "Gestión y agrupación", icon: "📫", bg: "from-amber-500 to-orange-500", light: "from-amber-50 to-orange-50", border: "border-amber-200" },
      { label: "Movimientos", page: "movimientos", detail: "Historial y trazabilidad", icon: "🔄", bg: "from-rose-500 to-red-500", light: "from-rose-50 to-red-50", border: "border-rose-200" },
      { label: "Actualización", page: "actualizacion", detail: "Sincroniza y refresca datos", icon: "🔁", bg: "from-teal-500 to-cyan-500", light: "from-teal-50 to-cyan-50", border: "border-teal-200" },
      { label: "Configuración", page: "configuracion", detail: "Parámetros del sistema", icon: "⚙️", bg: "from-cyan-500 to-sky-500", light: "from-cyan-50 to-sky-50", border: "border-cyan-200" }
    ];

    const actionsHTML = quickActions.map(a => `<button data-nav-page="${a.page}" class="quick-action-btn group relative overflow-hidden rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"><div class="absolute inset-0 bg-gradient-to-br ${a.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div><div class="relative z-10 bg-gradient-to-br ${a.light} border ${a.border} p-3 md:p-4 group-hover:bg-opacity-20 transition-all h-full"><div class="h-full flex flex-col items-center justify-center text-center gap-2 md:gap-3"><div class="text-4xl md:text-5xl leading-none transform group-hover:scale-110 transition-transform duration-300">${a.icon}</div><div class="min-w-0"><h3 class="font-bold text-sm md:text-base text-slate-900 leading-tight">${a.label}</h3><p class="text-xs text-slate-600 mt-1 leading-snug">${a.detail}</p><p class="mt-2 text-xs font-semibold text-slate-700 group-hover:text-white transition-colors">Abrir →</p></div></div></div></button>`).join("");

    mountNode.innerHTML = `<section class="space-y-3 md:space-y-4 lg:h-[calc(100vh-11rem)] lg:overflow-hidden lg:grid lg:grid-rows-[auto_auto_1fr]"><div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-4 md:p-5 shadow-lg"><div class="absolute top-0 right-0 w-56 h-56 md:w-80 md:h-80 bg-blue-500 rounded-full -mr-28 -mt-28 md:-mr-40 md:-mt-40 opacity-10"></div><div class="absolute bottom-0 left-0 w-44 h-44 md:w-64 md:h-64 bg-blue-400 rounded-full -ml-20 -mb-20 md:-ml-28 md:-mb-28 opacity-10"></div><div class="relative z-10"><h1 class="text-2xl md:text-3xl font-bold text-white mb-1">👤 ${nombreUsuario}</h1><p class="text-blue-100 font-medium text-sm md:text-base">${cargoUsuario}</p></div></div><div><h2 class="text-xl md:text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2"><span class="w-1 h-6 md:h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full"></span>Resumen de Registros</h2><div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 md:gap-3">${cardsKpiHtml}</div></div><div class="min-h-0 flex flex-col"><h2 class="text-xl md:text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2"><span class="w-1 h-6 md:h-8 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></span>Accesos Rápidos</h2><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 lg:flex-1">${actionsHTML}</div></div></section>`;

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
