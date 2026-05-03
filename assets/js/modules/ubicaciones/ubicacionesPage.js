import { renderTable } from "../../components/table.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { expedienteService } from "../../services/expedienteService.js";
import { ubicacionService } from "../../services/ubicacionService.js";
import { validarNumeroExpediente } from "../../utils/validators.js";
import { parsearLectora } from "../../utils/lectora.js";
import { icon } from "../../components/icons.js";
import { ALERT_TONES } from "../../core/uiTokens.js";
// Variables de estado
let ubicacionesData = [];
let detallesData = [];

export async function initUbicacionesPage({ mountNode, sesion }) {
  // 1. Mostrar skeleton inmediatamente
  mountNode.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="rounded-2xl p-5 text-white shadow-lg"
        style="background: linear-gradient(145deg, var(--color-brand), var(--color-brand-2));">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="bg-white/10 rounded-xl p-3">${icon("mapPin", "w-8 h-8")}</span>
            <div>
              <h1 class="text-xl md:text-2xl font-bold">Gestión de Ubicaciones</h1>
              <p class="text-blue-100 text-sm">Administra pisos, módulos y estantes del archivo</p>
            </div>
          </div>
          <button id="btn-nueva-ubicacion" class="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-semibold transition flex items-center gap-2">
            ${icon("plus", "w-4 h-4")} Nueva Ubicación
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 border-b border-slate-200">
        <button id="tab-ubicaciones" class="tab-ubicacion-btn px-4 py-2 text-sm font-semibold rounded-t-lg bg-white text-blue-600 border-b-2 border-blue-600">
          ${icon("building", "w-4 h-4")} Ubicaciones
        </button>
        <button id="tab-detalles" class="tab-ubicacion-btn px-4 py-2 text-sm font-semibold rounded-t-lg text-slate-600 hover:text-slate-900">
          ${icon("layers", "w-4 h-4")} Detalle de Ubicaciones
        </button>
        <button id="tab-movimientos" class="tab-ubicacion-btn px-4 py-2 text-sm font-semibold rounded-t-lg text-slate-600 hover:text-slate-900">
          ${icon("moveRight", "w-4 h-4")} Registrar Movimiento
        </button>
      </div>

      <!-- Contenido de Ubicaciones -->
      <div id="contenido-ubicaciones" class="space-y-4">
        ${renderUbicacionesSkeleton()}
      </div>

      <!-- Contenido de Detalles (oculto inicialmente) -->
      <div id="contenido-detalles" class="space-y-4 hidden">
        ${renderDetallesSkeleton()}
      </div>

      <!-- Contenido de Movimientos (oculto inicialmente) -->
      <div id="contenido-movimientos" class="hidden">
        ${renderMovimientosFormSkeleton()}
      </div>
    </div>
  `;

  agregarEstilosUbicacion();

  // Referencias a elementos
  const contenidoUbicaciones = document.getElementById("contenido-ubicaciones");
  const contenidoDetalles = document.getElementById("contenido-detalles");
  const contenidoMovimientos = document.getElementById("contenido-movimientos");
  
  let expedientes = [];

  try {
    // 2. Cargar datos en paralelo
    const [ubicacionesResp, detallesResp, expedientesResp] = await Promise.all([
      ubicacionService.listarUbicaciones(),
      ubicacionService.listarDetallesUbicacion(),
      expedienteService.listarDelBackend()
    ]);

    ubicacionesData = ubicacionesResp.success ? ubicacionesResp.data : [];
    detallesData = detallesResp.success ? detallesResp.data : [];
    expedientes = expedientesResp.success ? expedientesResp.data : [];

    console.log(`✅ Cargadas: ${ubicacionesData.length} ubicaciones, ${detallesData.length} detalles, ${expedientes.length} expedientes`);

    // 3. Renderizar tabs
    renderUbicaciones(contenidoUbicaciones);
    renderDetalles(contenidoDetalles);
    renderMovimientosForm(contenidoMovimientos, expedientes);

    // 4. Configurar tabs
    const tabUbicaciones = document.getElementById("tab-ubicaciones");
    const tabDetalles = document.getElementById("tab-detalles");
    const tabMovimientos = document.getElementById("tab-movimientos");

    tabUbicaciones.addEventListener("click", () => {
      tabUbicaciones.classList.add("bg-white", "text-blue-600", "border-b-2", "border-blue-600");
      tabUbicaciones.classList.remove("text-slate-600");
      tabDetalles.classList.remove("bg-white", "text-blue-600", "border-b-2", "border-blue-600");
      tabDetalles.classList.add("text-slate-600");
      tabMovimientos.classList.remove("bg-white", "text-blue-600", "border-b-2", "border-blue-600");
      tabMovimientos.classList.add("text-slate-600");
      
      contenidoUbicaciones.classList.remove("hidden");
      contenidoDetalles.classList.add("hidden");
      contenidoMovimientos.classList.add("hidden");
    });

    tabDetalles.addEventListener("click", () => {
      tabDetalles.classList.add("bg-white", "text-blue-600", "border-b-2", "border-blue-600");
      tabDetalles.classList.remove("text-slate-600");
      tabUbicaciones.classList.remove("bg-white", "text-blue-600", "border-b-2", "border-blue-600");
      tabUbicaciones.classList.add("text-slate-600");
      tabMovimientos.classList.remove("bg-white", "text-blue-600", "border-b-2", "border-blue-600");
      tabMovimientos.classList.add("text-slate-600");
      
      contenidoDetalles.classList.remove("hidden");
      contenidoUbicaciones.classList.add("hidden");
      contenidoMovimientos.classList.add("hidden");
    });

    tabMovimientos.addEventListener("click", () => {
      tabMovimientos.classList.add("bg-white", "text-blue-600", "border-b-2", "border-blue-600");
      tabMovimientos.classList.remove("text-slate-600");
      tabUbicaciones.classList.remove("bg-white", "text-blue-600", "border-b-2", "border-blue-600");
      tabUbicaciones.classList.add("text-slate-600");
      tabDetalles.classList.remove("bg-white", "text-blue-600", "border-b-2", "border-blue-600");
      tabDetalles.classList.add("text-slate-600");
      
      contenidoMovimientos.classList.remove("hidden");
      contenidoUbicaciones.classList.add("hidden");
      contenidoDetalles.classList.add("hidden");
    });

    // 5. Botón nueva ubicación
    document.getElementById("btn-nueva-ubicacion")?.addEventListener("click", () => {
      abrirModalNuevaUbicacion(() => {
        // Recargar datos después de crear
        Promise.all([
          ubicacionService.listarUbicaciones(),
          ubicacionService.listarDetallesUbicacion()
        ]).then(([newUbicaciones, newDetalles]) => {
          ubicacionesData = newUbicaciones.success ? newUbicaciones.data : [];
          detallesData = newDetalles.success ? newDetalles.data : [];
          renderUbicaciones(contenidoUbicaciones);
          renderDetalles(contenidoDetalles);
        });
      });
    });

  } catch (error) {
    console.error("Error cargando ubicaciones:", error);
    contenidoUbicaciones.innerHTML = `
      <div class="text-center py-8 text-red-600 bg-red-50 rounded-xl">
        <p class="font-semibold">❌ Error al cargar las ubicaciones</p>
        <p class="text-sm mt-2">${error.message}</p>
        <button onclick="location.reload()" class="mt-4 btn btn-primary">Reintentar</button>
      </div>
    `;
  }
}

// =====================
// SKELETONS
// =====================

function renderUbicacionesSkeleton() {
  return `
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <h2 class="text-base font-semibold text-slate-800 flex items-center gap-2">
          <span class="w-1.5 h-5 bg-blue-500 rounded-full"></span>
          Lista de Ubicaciones
        </h2>
      </div>
      <div class="p-5">
        <div class="space-y-2">
          ${Array.from({ length: 5 }).map(() => `
            <div class="h-16 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 animate-pulse"></div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderDetallesSkeleton() {
  return `
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <h2 class="text-base font-semibold text-slate-800">Detalle de Ubicaciones</h2>
      </div>
      <div class="p-5">
        <div class="space-y-2">
          ${Array.from({ length: 5 }).map(() => `
            <div class="h-16 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 animate-pulse"></div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderMovimientosFormSkeleton() {
  return `
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <h2 class="text-base font-semibold text-slate-800">Registrar Movimiento</h2>
      </div>
      <div class="p-5">
        <div class="space-y-4">
          <div class="h-12 rounded-lg bg-slate-200 animate-pulse"></div>
          <div class="h-12 rounded-lg bg-slate-200 animate-pulse"></div>
          <div class="h-12 rounded-lg bg-slate-200 animate-pulse"></div>
          <div class="h-24 rounded-lg bg-slate-200 animate-pulse"></div>
        </div>
      </div>
    </div>
  `;
}

// =====================
// RENDERIZADO DE UBICACIONES
// =====================

function renderUbicaciones(container) {
  if (!ubicacionesData.length) {
    container.innerHTML = `
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100">
          <h2 class="text-base font-semibold text-slate-800">Lista de Ubicaciones</h2>
        </div>
        <div class="p-5 text-center text-slate-500">
          <p>No hay ubicaciones registradas</p>
          <button id="btn-nueva-ubicacion-empty" class="mt-4 btn btn-primary">+ Crear primera ubicación</button>
        </div>
      </div>
    `;
    document.getElementById("btn-nueva-ubicacion-empty")?.addEventListener("click", () => {
      abrirModalNuevaUbicacion(() => location.reload());
    });
    return;
  }

  container.innerHTML = `
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 class="text-base font-semibold text-slate-800 flex items-center gap-2">
          <span class="w-1.5 h-5 bg-blue-500 rounded-full"></span>
          Lista de Ubicaciones
        </h2>
        <span class="text-xs text-slate-500">${ubicacionesData.length} ubicaciones</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Código</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Nombre</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Tipo</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Descripción</th>
              <th class="text-center px-4 py-3 font-medium text-slate-700">Estado</th>
              <th class="text-center px-4 py-3 font-medium text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${ubicacionesData.map(ubicacion => `
              <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-3 font-mono text-sm">${escapeHtml(ubicacion.codigo_ubicacion || '-')}</td>
                <td class="px-4 py-3 font-medium text-slate-900">${escapeHtml(ubicacion.nombre_ubicacion || '-')}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 rounded-full text-xs font-semibold ${getTipoUbicacionColor(ubicacion.tipo_ubicacion)}">
                    ${escapeHtml(ubicacion.tipo_ubicacion || 'General')}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-600">${escapeHtml(ubicacion.descripcion || '-')}</td>
                <td class="px-4 py-3 text-center">
                  <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${ubicacion.activo === 'SI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                    <span class="w-1.5 h-1.5 rounded-full ${ubicacion.activo === 'SI' ? 'bg-green-500' : 'bg-red-500'}"></span>
                    ${ubicacion.activo === 'SI' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <button class="btn-ver-detalle-ubicacion text-blue-600 hover:text-blue-800" data-id="${ubicacion.id_ubicacion}">
                    ${icon("eye", "w-4 h-4")}
                  </button>
                  <button class="btn-editar-ubicacion text-amber-600 hover:text-amber-800 ml-2" data-id="${ubicacion.id_ubicacion}">
                    ${icon("edit", "w-4 h-4")}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Event listeners para botones
  document.querySelectorAll(".btn-ver-detalle-ubicacion").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      verDetalleUbicacion(id);
    });
  });

  document.querySelectorAll(".btn-editar-ubicacion").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      editarUbicacion(id);
    });
  });
}

// =====================
// RENDERIZADO DE DETALLES
// =====================

function renderDetalles(container) {
  if (!detallesData.length) {
    container.innerHTML = `
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100">
          <h2 class="text-base font-semibold text-slate-800">Detalle de Ubicaciones</h2>
        </div>
        <div class="p-5 text-center text-slate-500">
          <p>No hay detalles de ubicaciones registrados</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <h2 class="text-base font-semibold text-slate-800 flex items-center gap-2">
          <span class="w-1.5 h-5 bg-green-500 rounded-full"></span>
          Detalle de Ubicaciones (Pisos/Estantes)
        </h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Ubicación</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Código Piso</th>
              <th class="text-left px-4 py-3 font-medium text-slate-700">Nombre Piso</th>
              <th class="text-center px-4 py-3 font-medium text-slate-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${detallesData.map(detalle => {
              const ubicacionPadre = ubicacionesData.find(u => u.id_ubicacion == detalle.id_ubicacion);
              return `
                <tr class="border-b border-slate-100 hover:bg-slate-50">
                  <td class="px-4 py-3 font-medium text-slate-900">${escapeHtml(ubicacionPadre?.nombre_ubicacion || detalle.id_ubicacion)}</td>
                  <td class="px-4 py-3 font-mono text-sm">${escapeHtml(detalle.codigo_piso || '-')}</td>
                  <td class="px-4 py-3 text-slate-700">${escapeHtml(detalle.nombre_piso || '-')}</td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${detalle.activo === 'SI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                      <span class="w-1.5 h-1.5 rounded-full ${detalle.activo === 'SI' ? 'bg-green-500' : 'bg-red-500'}"></span>
                      ${detalle.activo === 'SI' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// =====================
// FORMULARIO DE MOVIMIENTOS
// =====================

function renderMovimientosForm(container, expedientes) {
  container.innerHTML = `
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <h2 class="text-base font-semibold text-slate-800 flex items-center gap-2">
          <span class="w-1.5 h-5 bg-amber-500 rounded-full"></span>
          Registrar Movimiento de Expediente
        </h2>
      </div>
      <div class="p-5">
        <div id="estado-chip-ubicacion" class="mb-4 min-h-[56px]"></div>
        
        <div id="modo-lectora-alerta" class="hidden rounded-xl border ${ALERT_TONES.info.border} ${ALERT_TONES.info.surface} px-4 py-3 text-sm ${ALERT_TONES.info.text} mb-4">
          <span class="font-medium">Modo lectora activo</span> - Escanee el código y presione Enter para llenar automáticamente.
        </div>

        <form id="form-ubicacion" class="grid md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="text-sm font-semibold text-slate-700">Número de expediente</label>
            <div class="flex gap-2 mt-1">
              <input id="numero-expediente-input" class="input-base flex-1" placeholder="Escanea o escribe el número..." />
              <button type="button" id="ubi-modo-manual" class="btn btn-secondary">${icon("edit", "w-4 h-4")} Manual</button>
              <button type="button" id="ubi-modo-lectora" class="btn btn-secondary">${icon("shieldCheck", "w-4 h-4")} Lectora</button>
            </div>
          </div>

          <div class="md:col-span-2">
            <label class="text-sm font-semibold text-slate-700">O seleccionar de lista</label>
            <select id="expediente-id" class="select-base w-full mt-1">
              <option value="">-- Seleccione un expediente --</option>
              ${expedientes.map(exp => `<option value="${exp.id_expediente}">${exp.numero_expediente || exp.num || exp.codigo_expediente_completo} (${exp.ubicacion_actual || 'Sin ubicación'})</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="text-sm font-semibold text-slate-700">Ubicación destino</label>
            <select name="ubicacionActual" class="select-base w-full mt-1" required>
              <option value="">-- Seleccione ubicación --</option>
              ${ubicacionesData.map(u => `<option value="${escapeHtml(u.nombre_ubicacion)}">${escapeHtml(u.nombre_ubicacion)}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="text-sm font-semibold text-slate-700">Nuevo estado</label>
            <select name="estado" class="select-base w-full mt-1" required>
              <option value="ACTIVO">ACTIVO</option>
              <option value="EN_PRESTAMO">EN_PRÉSTAMO</option>
              <option value="ARCHIVADO">ARCHIVADO</option>
              <option value="TRASLADADO">TRASLADADO</option>
            </select>
          </div>

          <div>
            <label class="text-sm font-semibold text-slate-700">Motivo</label>
            <input name="motivo" class="input-base w-full mt-1" placeholder="Ej: Préstamo interno" required />
          </div>

          <div>
            <label class="text-sm font-semibold text-slate-700">Observación</label>
            <input name="observacion" class="input-base w-full mt-1" placeholder="Detalle del movimiento" />
          </div>

          <div class="md:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" id="btn-limpiar-ubi" class="btn btn-secondary">${icon("refreshCw", "w-4 h-4")} Limpiar</button>
            <button type="submit" class="btn btn-primary">${icon("check", "w-4 h-4")} Registrar movimiento</button>
          </div>
        </form>
      </div>
    </div>

    <div class="mt-6">
      <h3 class="font-semibold text-lg mb-3">Historial del expediente seleccionado</h3>
      <div id="historial-contenedor" class="bg-white rounded-xl border border-slate-200 p-5 text-center text-slate-500">
        Seleccione un expediente para ver su historial
      </div>
    </div>
  `;

  // Inicializar funcionalidad del formulario
  inicializarFormularioMovimientos(expedientes);
}

function inicializarFormularioMovimientos(expedientes) {
  const formUbicacion = document.getElementById("form-ubicacion");
  const selectExpediente = document.getElementById("expediente-id");
  const numeroInput = document.getElementById("numero-expediente-input");
  const modoAlerta = document.getElementById("modo-lectora-alerta");
  let modoLectoraUbicacion = false;

  function actualizarChipUbicacion(estado, esLectora) {
    const chip = document.getElementById("estado-chip-ubicacion");
    if (!chip) return;
    
    let html = '';
    if (estado === "pendiente") {
      html = `<div class="px-3 py-2 rounded-lg border ${ALERT_TONES.neutral.border} ${ALERT_TONES.neutral.surface} text-sm ${ALERT_TONES.neutral.text}">
        ${esLectora ? "🔍 Modo lectora" : "✏️ Modo manual"} - Esperando entrada...
      </div>`;
    } else if (estado === "valido") {
      html = `<div class="px-3 py-2 rounded-lg border-2 ${ALERT_TONES.success.border} ${ALERT_TONES.success.surface} text-sm font-semibold ${ALERT_TONES.success.text}">
        ✅ Válido - Expediente verificado
      </div>`;
    } else if (estado === "invalido") {
      html = `<div class="px-3 py-2 rounded-lg border-2 ${ALERT_TONES.danger.border} ${ALERT_TONES.danger.surface} text-sm font-semibold ${ALERT_TONES.danger.text}">
        ❌ Inválido - Revisar formato
      </div>`;
    }
    chip.innerHTML = html;
  }

  async function renderHistorial(expedienteId) {
    const contenedor = document.getElementById("historial-contenedor");
    if (!contenedor) return;
    
    if (!expedienteId) {
      contenedor.innerHTML = `<div class="text-center text-slate-500 py-8">Seleccione un expediente para ver su historial</div>`;
      return;
    }

    contenedor.innerHTML = `<div class="text-center py-8"><div class="animate-pulse text-slate-500">Cargando historial...</div></div>`;
    
    try {
      const movimientos = await expedienteService.listarMovimientos();
      const historial = (movimientos || [])
        .filter(item => item.expedienteId == expedienteId || item.id_expediente == expedienteId)
        .slice(0, 20)
        .map(item => ({
          fecha: item.fecha || item.fecha_movimiento || '-',
          hora: item.hora || item.hora_movimiento || '-',
          usuario: item.usuario || item.realizado_por || '-',
          origen: item.origen || item.ubicacion_origen || '-',
          destino: item.destino || item.ubicacion_destino || '-',
          motivo: item.motivo || '-',
          observacion: item.observacion || '-'
        }));

      contenedor.innerHTML = renderTable({
        columns: [
          { key: "fecha", label: "Fecha" },
          { key: "hora", label: "Hora" },
          { key: "usuario", label: "Usuario" },
          { key: "origen", label: "Origen" },
          { key: "destino", label: "Destino" },
          { key: "motivo", label: "Motivo" },
          { key: "observacion", label: "Observación" }
        ],
        rows: historial,
        emptyText: "Sin movimientos registrados para este expediente"
      });
    } catch (error) {
      contenedor.innerHTML = `<div class="text-center text-red-600 py-8">Error al cargar historial: ${error.message}</div>`;
    }
  }

  function validarNumeroUbicacion() {
    const valor = numeroInput.value.trim().toUpperCase();
    if (!valor) {
      actualizarChipUbicacion("pendiente", modoLectoraUbicacion);
      return;
    }

    if (modoLectoraUbicacion && (/^\d{20}$/.test(valor) || /^\d{23}$/.test(valor))) {
      const parsed = parsearLectora(valor);
      if (parsed) {
        actualizarChipUbicacion("valido", true);
        numeroInput.value = parsed.numeroExpediente;
        const expediente = expedientes.find(e => (e.numero_expediente || '').split('-')[0] === parsed.numeroExpediente.split('-')[0]);
        if (expediente) {
          selectExpediente.value = expediente.id_expediente;
          renderHistorial(expediente.id_expediente);
          showToast("✅ Expediente encontrado", "success");
        }
        return;
      }
    }

    if (validarNumeroExpediente(valor)) {
      actualizarChipUbicacion("valido", modoLectoraUbicacion);
      const expediente = expedientes.find(e => (e.numero_expediente || '') === valor);
      if (expediente) {
        selectExpediente.value = expediente.id_expediente;
        renderHistorial(expediente.id_expediente);
        showToast("✅ Expediente encontrado", "success");
      } else {
        showToast("⚠️ Expediente no encontrado", "warning");
      }
    } else {
      actualizarChipUbicacion("invalido", modoLectoraUbicacion);
    }
  }

  actualizarChipUbicacion("pendiente", false);

  numeroInput.addEventListener("input", validarNumeroUbicacion);
  numeroInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && modoLectoraUbicacion) {
      e.preventDefault();
      validarNumeroUbicacion();
    }
  });

  document.getElementById("ubi-modo-manual")?.addEventListener("click", () => {
    modoLectoraUbicacion = false;
    numeroInput.value = "";
    numeroInput.focus();
    actualizarChipUbicacion("pendiente", false);
    modoAlerta?.classList.add("hidden");
    showToast("Modo manual activado", "info");
  });

  document.getElementById("ubi-modo-lectora")?.addEventListener("click", () => {
    modoLectoraUbicacion = true;
    numeroInput.value = "";
    numeroInput.focus();
    actualizarChipUbicacion("pendiente", true);
    modoAlerta?.classList.remove("hidden");
    showToast("Modo lectora activado - Escanee el código", "info");
  });

  selectExpediente.addEventListener("change", (e) => {
    if (e.target.value) {
      renderHistorial(e.target.value);
    }
  });

  formUbicacion.addEventListener("submit", async (e) => {
    e.preventDefault();
    const expedienteId = selectExpediente.value;
    if (!expedienteId) {
      showToast("Seleccione un expediente", "warning");
      return;
    }

    const datos = new FormData(formUbicacion);
    const movimiento = {
      expedienteId: parseInt(expedienteId),
      ubicacionActual: datos.get("ubicacionActual"),
      estado: datos.get("estado"),
      motivo: datos.get("motivo"),
      observacion: datos.get("observacion"),
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-PE')
    };

    try {
      await ubicacionService.guardarMovimiento(movimiento);
      showToast("✅ Movimiento registrado exitosamente", "success");
      formUbicacion.reset();
      numeroInput.value = "";
      selectExpediente.value = "";
      actualizarChipUbicacion("pendiente", modoLectoraUbicacion);
      renderHistorial(null);
    } catch (error) {
      showToast(`❌ Error: ${error.message}`, "error");
    }
  });

  document.getElementById("btn-limpiar-ubi")?.addEventListener("click", () => {
    formUbicacion.reset();
    numeroInput.value = "";
    selectExpediente.value = "";
    actualizarChipUbicacion("pendiente", modoLectoraUbicacion);
    renderHistorial(null);
  });
}

// =====================
// HELPERS
// =====================

function getTipoUbicacionColor(tipo) {
  const colores = {
    'PISO': 'bg-blue-100 text-blue-700',
    'ESTANTE': 'bg-green-100 text-green-700',
    'CAJA': 'bg-amber-100 text-amber-700',
    'ARCHIVO': 'bg-purple-100 text-purple-700'
  };
  return colores[tipo] || 'bg-slate-100 text-slate-700';
}

function verDetalleUbicacion(id) {
  const ubicacion = ubicacionesData.find(u => u.id_ubicacion == id);
  if (!ubicacion) return;

  const detalles = detallesData.filter(d => d.id_ubicacion == id);
  
  openModal({
    title: `Detalle: ${ubicacion.nombre_ubicacion}`,
    content: `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-slate-50 p-3 rounded-lg"><span class="text-xs text-slate-500">Código</span><p class="font-mono font-semibold">${escapeHtml(ubicacion.codigo_ubicacion)}</p></div>
          <div class="bg-slate-50 p-3 rounded-lg"><span class="text-xs text-slate-500">Tipo</span><p class="font-semibold">${escapeHtml(ubicacion.tipo_ubicacion || 'General')}</p></div>
          <div class="col-span-2 bg-slate-50 p-3 rounded-lg"><span class="text-xs text-slate-500">Descripción</span><p>${escapeHtml(ubicacion.descripcion || 'Sin descripción')}</p></div>
        </div>
        ${detalles.length ? `
          <div><h4 class="font-semibold mb-2">Detalles asociados</h4>
          <div class="space-y-2">${detalles.map(d => `
            <div class="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
              <span class="font-mono text-sm">${escapeHtml(d.codigo_piso)}</span>
              <span>${escapeHtml(d.nombre_piso)}</span>
              <span class="text-xs ${d.activo === 'SI' ? 'text-green-600' : 'text-red-600'}">${d.activo === 'SI' ? 'Activo' : 'Inactivo'}</span>
            </div>
          `).join('')}</div>
        ` : '<p class="text-slate-500 text-sm">Sin detalles asociados</p>'}
      </div>
    `,
    confirmText: "Cerrar"
  });
}

function editarUbicacion(id) {
  const ubicacion = ubicacionesData.find(u => u.id_ubicacion == id);
  if (!ubicacion) return;
  
  openModal({
    title: `Editar: ${ubicacion.nombre_ubicacion}`,
    content: `
      <form id="form-editar-ubicacion" class="space-y-3">
        <input type="hidden" name="id_ubicacion" value="${ubicacion.id_ubicacion}">
        <div><label class="text-sm font-semibold">Código</label><input name="codigo_ubicacion" class="input-base w-full" value="${escapeHtml(ubicacion.codigo_ubicacion)}" required></div>
        <div><label class="text-sm font-semibold">Nombre</label><input name="nombre_ubicacion" class="input-base w-full" value="${escapeHtml(ubicacion.nombre_ubicacion)}" required></div>
        <div><label class="text-sm font-semibold">Tipo</label><select name="tipo_ubicacion" class="select-base w-full">
          <option value="PISO" ${ubicacion.tipo_ubicacion === 'PISO' ? 'selected' : ''}>PISO</option>
          <option value="ESTANTE" ${ubicacion.tipo_ubicacion === 'ESTANTE' ? 'selected' : ''}>ESTANTE</option>
          <option value="CAJA" ${ubicacion.tipo_ubicacion === 'CAJA' ? 'selected' : ''}>CAJA</option>
          <option value="ARCHIVO" ${ubicacion.tipo_ubicacion === 'ARCHIVO' ? 'selected' : ''}>ARCHIVO</option>
        </select></div>
        <div><label class="text-sm font-semibold">Descripción</label><textarea name="descripcion" class="input-base w-full" rows="2">${escapeHtml(ubicacion.descripcion || '')}</textarea></div>
        <div><label class="text-sm font-semibold">Estado</label><select name="activo" class="select-base w-full">
          <option value="SI" ${ubicacion.activo === 'SI' ? 'selected' : ''}>Activo</option>
          <option value="NO" ${ubicacion.activo === 'NO' ? 'selected' : ''}>Inactivo</option>
        </select></div>
        <div class="flex justify-end gap-2 pt-3"><button type="submit" class="btn btn-primary">Guardar cambios</button></div>
      </form>
    `,
    confirmText: "Cerrar",
    onConfirm: (close) => close()
  });

  setTimeout(() => {
    const formEditar = document.getElementById("form-editar-ubicacion");
    if (formEditar) {
      formEditar.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(formEditar);
        const datos = Object.fromEntries(formData.entries());
        
        try {
          await ubicacionService.actualizarUbicacion(datos);
          showToast("✅ Ubicación actualizada", "success");
          setTimeout(() => location.reload(), 1000);
        } catch (error) {
          showToast(`❌ Error: ${error.message}`, "error");
        }
      });
    }
  }, 100);
}

function abrirModalNuevaUbicacion(onSuccess) {
  openModal({
    title: "Nueva Ubicación",
    content: `
      <form id="form-nueva-ubicacion" class="space-y-3">
        <div><label class="text-sm font-semibold">Código *</label><input name="codigo_ubicacion" class="input-base w-full" placeholder="Ej: UB-001" required></div>
        <div><label class="text-sm font-semibold">Nombre *</label><input name="nombre_ubicacion" class="input-base w-full" placeholder="Ej: Segundo Piso" required></div>
        <div><label class="text-sm font-semibold">Tipo</label><select name="tipo_ubicacion" class="select-base w-full">
          <option value="PISO">PISO</option>
          <option value="ESTANTE">ESTANTE</option>
          <option value="CAJA">CAJA</option>
          <option value="ARCHIVO">ARCHIVO</option>
        </select></div>
        <div><label class="text-sm font-semibold">Descripción</label><textarea name="descripcion" class="input-base w-full" rows="2" placeholder="Descripción de la ubicación"></textarea></div>
        <div><label class="text-sm font-semibold">Estado</label><select name="activo" class="select-base w-full">
          <option value="SI">Activo</option>
          <option value="NO">Inactivo</option>
        </select></div>
        <div class="flex justify-end gap-2 pt-3"><button type="submit" class="btn btn-primary">Crear ubicación</button></div>
      </form>
    `,
    confirmText: "Cerrar",
    onConfirm: (close) => close()
  });

  setTimeout(() => {
    const formNueva = document.getElementById("form-nueva-ubicacion");
    if (formNueva) {
      formNueva.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(formNueva);
        const datos = Object.fromEntries(formData.entries());
        datos.fecha_creacion = new Date().toISOString();
        
        try {
          await ubicacionService.crearUbicacion(datos);
          showToast("✅ Ubicación creada exitosamente", "success");
          if (onSuccess) onSuccess();
        } catch (error) {
          showToast(`❌ Error: ${error.message}`, "error");
        }
      });
    }
  }, 100);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function agregarEstilosUbicacion() {
  if (document.getElementById("ubicacion-styles")) return;
  const style = document.createElement("style");
  style.id = "ubicacion-styles";
  style.textContent = `
    .input-base, .select-base {
      padding: 0.6rem 0.8rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }
    .input-base:focus, .select-base:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .btn-primary {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
    }
  `;
  document.head.appendChild(style);
}