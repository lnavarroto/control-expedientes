import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { expedienteService } from "../../services/expedienteService.js";
import { validarNumeroExpediente } from "../../utils/validators.js";
import { parsearLectora } from "../../utils/lectora.js";
import { formatearExpediente } from "../expedientes/expedientesMapeo.js";

const ITEMS_POR_PAGINA = 10;

function normalizarTexto(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function idExpToNumber(idExp) {
  const match = String(idExp || "").match(/EXP-(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function renderTablaExpedientes(expedientes, paginaActual = 1, itemsPorPagina = ITEMS_POR_PAGINA) {
  if (!expedientes || expedientes.length === 0) {
    return {
      html: `
        <div class="card-surface p-8 text-center">
          <p class="text-slate-500 font-medium mb-2">📭 No se encontraron expedientes</p>
          <p class="text-xs text-slate-400">Ajusta filtros para ver resultados</p>
        </div>
      `,
      totalPaginas: 0,
      paginaActual: 0,
      expedientesMostrados: 0,
      expedientesTotal: 0
    };
  }

  const expedientesOrdenados = [...expedientes].sort((a, b) => {
    return idExpToNumber(b.id_expediente) - idExpToNumber(a.id_expediente);
  });

  const totalPaginas = Math.ceil(expedientesOrdenados.length / itemsPorPagina);
  const paginaValida = Math.min(Math.max(1, paginaActual), totalPaginas);
  const inicio = (paginaValida - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const expedientesPagina = expedientesOrdenados.slice(inicio, fin);

  const filas = expedientesPagina.map((exp, indexEnPagina) => {
    const formateado = formatearExpediente(exp);
    const numeroGlobal = idExpToNumber(exp.id_expediente) || (expedientesOrdenados.length - inicio - indexEnPagina);
    const estadoHtml = `
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-${formateado.estadoColor}-100 text-${formateado.estadoColor}-700">
        • ${formateado.estado}
      </span>
    `;

    return `
      <tr class="hover:bg-slate-50 transition-colors" data-numero="${formateado.numero}">
        <td class="px-4 py-3 border-t border-slate-100"><span class="font-bold text-slate-600">#${numeroGlobal}</span></td>
        <td class="px-4 py-3 border-t border-slate-100"><span class="font-mono font-bold text-blue-700">${formateado.numero}</span></td>
        <td class="px-4 py-3 border-t border-slate-100 text-sm">${formateado.materia}</td>
        <td class="px-4 py-3 border-t border-slate-100 text-sm">${formateado.juzgado}</td>
        <td class="px-4 py-3 border-t border-slate-100 text-xs text-slate-600">${formateado.ingreso}</td>
        <td class="px-4 py-3 border-t border-slate-100 text-xs text-slate-600">${formateado.ubicacion}</td>
        <td class="px-4 py-3 border-t border-slate-100">${estadoHtml}</td>
        <td class="px-4 py-3 border-t border-slate-100 text-sm text-slate-700">${formateado.registradoPor}</td>
        <td class="px-4 py-3 border-t border-slate-100 text-center">
          <button class="btn btn-secondary text-xs btn-ver-detalles" data-numero="${formateado.numero}">👁️ Ver</button>
        </td>
      </tr>
    `;
  }).join("");

  return {
    html: `
      <div class="card-surface overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Orden</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Número del Expediente</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Materia</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Juzgado</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Fecha de Ingreso</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Ubicación</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Estado</th>
                <th class="px-4 py-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700">Registrado por</th>
                <th class="px-4 py-3 text-center text-xs uppercase tracking-wider font-bold text-slate-700">Acción</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
      </div>
    `,
    totalPaginas,
    paginaActual: paginaValida,
    expedientesMostrados: expedientesPagina.length,
    expedientesTotal: expedientesOrdenados.length
  };
}

function renderPaginacion(paginaActual, totalPaginas) {
  if (totalPaginas <= 1) return "";

  const generarBotonesPagina = () => {
    const botones = [];
    const ventana = 3;
    const inicio = Math.max(1, paginaActual - ventana);
    const fin = Math.min(totalPaginas, paginaActual + ventana);

    if (inicio > 1) {
      botones.push(`<button class="btn-pagina" data-pagina="1" title="Primera página"><span class="font-bold">«</span></button>`);
      if (inicio > 2) botones.push(`<span class="text-slate-400 px-2">...</span>`);
    }

    for (let i = inicio; i <= fin; i++) {
      const esActual = i === paginaActual;
      botones.push(`<button class="btn-pagina ${esActual ? "activo" : ""}" data-pagina="${i}" ${esActual ? "disabled" : ""}>${i}</button>`);
    }

    if (fin < totalPaginas) {
      if (fin < totalPaginas - 1) botones.push(`<span class="text-slate-400 px-2">...</span>`);
      botones.push(`<button class="btn-pagina" data-pagina="${totalPaginas}" title="Última página"><span class="font-bold">»</span></button>`);
    }

    return botones.join("");
  };

  return `
    <div class="card-surface p-4 mt-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="text-sm text-slate-600 font-semibold">
          Página <span class="text-blue-600 font-bold">${paginaActual}</span> de <span class="text-blue-600 font-bold">${totalPaginas}</span>
        </div>
        <div class="flex items-center gap-2 flex-wrap justify-center">
          <button class="btn-primera-pagina btn-nav-paginacion text-xs" ${paginaActual === 1 ? "disabled" : ""}>⏮ Primera</button>
          <button class="btn-pagina-anterior btn-nav-paginacion text-xs" ${paginaActual === 1 ? "disabled" : ""}>◀ Anterior</button>
          <div class="flex items-center gap-1 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 flex-wrap justify-center">
            ${generarBotonesPagina()}
          </div>
          <button class="btn-pagina-siguiente btn-nav-paginacion text-xs" ${paginaActual === totalPaginas ? "disabled" : ""}>Siguiente ▶</button>
          <button class="btn-ultima-pagina btn-nav-paginacion text-xs" ${paginaActual === totalPaginas ? "disabled" : ""}>Última ⏭</button>
        </div>
        <div class="text-xs text-slate-500">
          Mostrando <span class="font-bold text-slate-700">${ITEMS_POR_PAGINA}</span> expedientes por página
        </div>
      </div>
    </div>
  `;
}

function abrirModalDetalles(expediente) {
  const formateado = formatearExpediente(expediente);
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto";
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-slate-900">📋 Detalles del Expediente</h2>
        <button class="btn-cerrar text-slate-500 hover:text-slate-700 font-bold text-2xl">✕</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
        <div>
          <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Número Expediente</p>
          <p class="text-lg font-mono font-bold text-blue-700">${formateado.numero}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Año</p>
          <p class="text-lg font-bold text-slate-800">${formateado.anio}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Materia</p>
          <p class="text-base text-slate-800">${formateado.materia}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Juzgado</p>
          <p class="text-base text-slate-800">${formateado.juzgado}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Fecha de Ingreso</p>
          <p class="text-base text-slate-800">${formateado.ingreso}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Ubicación</p>
          <p class="text-base text-slate-800">${formateado.ubicacion}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Estado</p>
          <p class="text-base"><span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-${formateado.estadoColor}-100 text-${formateado.estadoColor}-700">• ${formateado.estado}</span></p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Incidente</p>
          <p class="text-base text-slate-800">${formateado.incidente}</p>
        </div>
        <div class="md:col-span-2">
          <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Registrado por</p>
          <p class="text-base text-slate-800">${formateado.registradoPor}</p>
        </div>
        <div class="md:col-span-2">
          <p class="text-xs uppercase tracking-wider font-bold text-slate-600">Observaciones</p>
          <p class="text-base text-slate-800 whitespace-pre-wrap">${formateado.observaciones || "Sin observaciones"}</p>
        </div>
      </div>

      <div class="flex gap-2 justify-end pt-4 border-t border-slate-200">
        <button class="btn-cerrar px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">Cerrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelectorAll(".btn-cerrar").forEach((btn) => {
    btn.addEventListener("click", () => modal.remove());
  });
}

function coincideFecha(expediente, fechaFiltroYmd) {
  if (!fechaFiltroYmd) return true;
  const fechaLocal = fechaFiltroYmd.split("-").reverse().join("/");
  const fechaIngreso = String(expediente.fecha_ingreso || "").trim();
  const fechaHoraIngreso = String(expediente.fecha_hora_ingreso || "").trim();
  const ingresoVisual = formatearExpediente(expediente).ingreso;

  return (
    fechaIngreso.includes(fechaFiltroYmd) ||
    fechaIngreso.includes(fechaLocal) ||
    fechaHoraIngreso.includes(fechaFiltroYmd) ||
    fechaHoraIngreso.includes(fechaLocal) ||
    ingresoVisual.includes(fechaLocal)
  );
}

function filtrarExpedientesBackend(expedientes, filtros) {
  const texto = normalizarTexto(filtros.texto);
  const paqueteTexto = normalizarTexto(filtros.paqueteId);

  return expedientes.filter((item) => {
    const formateado = formatearExpediente(item);
    const bolsaTexto = normalizarTexto([
      item.numero_expediente,
      item.codigo_expediente_completo,
      item.id_expediente,
      formateado.materia,
      formateado.juzgado,
      formateado.ubicacion,
      formateado.estado,
      item.registrado_por,
      item.observaciones
    ].join(" "));

    const paqueteActual = normalizarTexto(item.id_paquete || item.paqueteId || "");

    const cumpleTexto = !texto || bolsaTexto.includes(texto);
    const cumpleMateria = !filtros.materia || String(item.codigo_materia || "") === String(filtros.materia);
    const cumpleJuzgado = !filtros.juzgado || String(item.id_juzgado || item.juzgado_texto || "") === String(filtros.juzgado);
    const cumpleEstado = !filtros.estado || String(item.id_estado || "") === String(filtros.estado);
    const cumpleUbicacion = !filtros.ubicacionActual || normalizarTexto(item.ubicacion).includes(normalizarTexto(filtros.ubicacionActual));
    const cumplePaquete = !paqueteTexto || paqueteActual.includes(paqueteTexto);
    const cumpleFecha = coincideFecha(item, filtros.fechaIngreso);

    return (
      cumpleTexto &&
      cumpleMateria &&
      cumpleJuzgado &&
      cumpleEstado &&
      cumpleUbicacion &&
      cumplePaquete &&
      cumpleFecha
    );
  });
}

export async function initBusquedaPage({ mountNode }) {
  mountNode.innerHTML = `
    <section class="card-surface p-8 text-center">
      <p class="text-slate-500 font-medium">🔎 Cargando búsqueda avanzada...</p>
    </section>
  `;

  const cachedExpedientes = expedienteService.listarDelBackendSync();
  let expedientes = [...cachedExpedientes];

  if (expedientes.length === 0) {
    const resultado = await expedienteService.listarDelBackend({ forceRefresh: false });
    expedientes = resultado?.success && Array.isArray(resultado.data) ? resultado.data : [];
  } else {
    expedienteService.listarDelBackend({ forceRefresh: false }).then((resultado) => {
      if (resultado?.success && Array.isArray(resultado.data)) {
        expedientes = resultado.data;
      }
    }).catch(() => {});
  }

  const materias = [...new Set(expedientes.map((item) => item.codigo_materia).filter(Boolean))];
  const juzgados = [...new Set(expedientes.map((item) => item.id_juzgado || item.juzgado_texto).filter(Boolean))];
  const ubicaciones = [...new Set(expedientes.map((item) => item.ubicacion).filter(Boolean))];
  const estados = [...new Set(expedientes.map((item) => item.id_estado).filter(Boolean))];

  const opts = (values, mapper = (value) => value) => ['<option value="">Todos</option>']
    .concat(values.map((value) => `<option value="${value}">${mapper(value)}</option>`))
    .join("");

  let resultados = [...expedientes];
  let paginaActual = 1;

  const renderResultados = () => {
    const tabla = renderTablaExpedientes(resultados, paginaActual, ITEMS_POR_PAGINA);
    const panel = document.getElementById("resultado-busqueda");
    if (!panel) return;

    panel.innerHTML = `
      <div class="mt-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm text-slate-600">Total: <span class="font-bold">${resultados.length}</span> resultado(s)</p>
        </div>
        ${tabla.html}
        ${renderPaginacion(tabla.paginaActual, tabla.totalPaginas)}
      </div>
    `;

    panel.querySelectorAll(".btn-ver-detalles").forEach((button) => {
      button.addEventListener("click", () => {
        const expediente = resultados.find((item) => String(item.numero_expediente) === String(button.dataset.numero));
        if (!expediente) {
          showToast("❌ Expediente no encontrado", "error");
          return;
        }
        abrirModalDetalles(expediente);
      });
    });

    panel.querySelectorAll(".btn-pagina").forEach((btn) => {
      btn.addEventListener("click", () => {
        paginaActual = parseInt(btn.getAttribute("data-pagina"), 10) || 1;
        renderResultados();
      });
    });

    panel.querySelector(".btn-primera-pagina")?.addEventListener("click", () => {
      paginaActual = 1;
      renderResultados();
    });

    panel.querySelector(".btn-pagina-anterior")?.addEventListener("click", () => {
      if (paginaActual > 1) {
        paginaActual--;
        renderResultados();
      }
    });

    panel.querySelector(".btn-pagina-siguiente")?.addEventListener("click", () => {
      const totalPaginas = Math.max(1, Math.ceil(resultados.length / ITEMS_POR_PAGINA));
      if (paginaActual < totalPaginas) {
        paginaActual++;
        renderResultados();
      }
    });

    panel.querySelector(".btn-ultima-pagina")?.addEventListener("click", () => {
      paginaActual = Math.max(1, Math.ceil(resultados.length / ITEMS_POR_PAGINA));
      renderResultados();
    });
  };

  mountNode.innerHTML = `
    <section class="card-surface p-5">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 class="font-semibold text-lg">Búsqueda avanzada</h3>
          <p class="text-sm text-slate-500">Busca expedientes con el mismo formato y acciones del listado principal.</p>
        </div>
        <div class="flex gap-2">
          <button id="btn-buscar-manual" class="btn btn-secondary" title="Búsqueda manual">🖱️ Manual</button>
          <button id="btn-buscar-lectora" class="btn btn-secondary" title="Búsqueda por lectora">📱 Lectora</button>
        </div>
      </div>

      <div id="estado-chip-busqueda" style="margin-bottom: 12px; min-height: 36px;"></div>

      <div class="grid md:grid-cols-3 gap-3">
        <input id="f-expediente" class="input-base md:col-span-3" placeholder="Número de expediente (ej: 00012-2026-1-3101-CI-01)" />
        <select id="f-materia" class="select-base">${opts(materias)}</select>
        <select id="f-juzgado" class="select-base">${opts(juzgados)}</select>
        <select id="f-estado" class="select-base">${opts(estados)}</select>
        <select id="f-ubicacion" class="select-base md:col-span-2">${opts(ubicaciones)}</select>
        <input id="f-paquete" class="input-base" placeholder="Código de paquete" />
        <input id="f-fecha" type="date" class="input-base md:col-span-2" />
        <div class="md:col-span-3 flex justify-end gap-3">
          <button id="btn-limpiar-busqueda" class="btn btn-secondary">Limpiar</button>
          <button id="btn-ejecutar-busqueda" class="btn btn-primary">Buscar expedientes</button>
        </div>
      </div>
    </section>
    <section id="resultado-busqueda"></section>
  `;

  const getFiltros = () => ({
    texto: document.getElementById("f-expediente")?.value || "",
    materia: document.getElementById("f-materia")?.value || "",
    juzgado: document.getElementById("f-juzgado")?.value || "",
    paqueteId: document.getElementById("f-paquete")?.value || "",
    ubicacionActual: document.getElementById("f-ubicacion")?.value || "",
    estado: document.getElementById("f-estado")?.value || "",
    fechaIngreso: document.getElementById("f-fecha")?.value || ""
  });

  let modoLectoraBusqueda = false;

  // Chip de estado
  function actualizarChipBusqueda(estado, esLectora) {
    const chip = document.getElementById("estado-chip-busqueda");
    let html = '';
    
    if (estado === "pendiente") {
      html = `<div class="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-600">
        Modo ${esLectora ? "lectora 📱" : "manual 🖱️"} - Esperando entrada...
      </div>`;
    } else if (estado === "valido") {
      const icono = esLectora ? "📱" : "🖱️";
      html = `<div class="px-3 py-2 rounded-lg border-2 border-green-400 bg-green-50 text-sm font-semibold text-green-700">
        ${icono} Válido - Buscando...
      </div>`;
    } else if (estado === "invalido") {
      const icono = esLectora ? "📱" : "🖱️";
      html = `<div class="px-3 py-2 rounded-lg border-2 border-red-400 bg-red-50 text-sm font-semibold text-red-700">
        ${icono} Inválido - Revisar formato
      </div>`;
    }
    
    chip.innerHTML = html;
  }

  // Validar número en búsqueda
  function validarNumeroBusqueda() {
    const valor = document.getElementById("f-expediente").value.trim().toUpperCase();

    if (!valor) {
      actualizarChipBusqueda("pendiente", modoLectoraBusqueda);
      return;
    }

    // MODO LECTORA
    if (modoLectoraBusqueda) {
      if (/^\d{20}$/.test(valor) || /^\d{23}$/.test(valor)) {
        const parsed = parsearLectora(valor);
        if (parsed) {
          actualizarChipBusqueda("valido", true);
          document.getElementById("f-expediente").value = parsed.numeroExpediente;
          // Ejecutar búsqueda automática
          setTimeout(() => ejecutar(), 300);
          return;
        }
      }
    }

    // VALIDACIÓN ESTÁNDAR
    if (validarNumeroExpediente(valor)) {
      actualizarChipBusqueda("valido", modoLectoraBusqueda);
    } else {
      actualizarChipBusqueda("invalido", modoLectoraBusqueda);
    }
  }

  actualizarChipBusqueda("pendiente", false);

  // Listeners de validación
  const expedienteInput = document.getElementById("f-expediente");
  expedienteInput.addEventListener("input", validarNumeroBusqueda);
  expedienteInput.addEventListener("blur", validarNumeroBusqueda);
  expedienteInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && modoLectoraBusqueda) {
      e.preventDefault();
      validarNumeroBusqueda();
    }
  });

  // Botones de modo
  document.getElementById("btn-buscar-manual")?.addEventListener("click", () => {
    modoLectoraBusqueda = false;
    expedienteInput.value = "";
    expedienteInput.focus();
    actualizarChipBusqueda("pendiente", false);
    showToast("🖱️ Búsqueda manual", "info");
  });

  document.getElementById("btn-buscar-lectora")?.addEventListener("click", () => {
    modoLectoraBusqueda = true;
    expedienteInput.value = "";
    expedienteInput.focus();
    actualizarChipBusqueda("pendiente", true);
    
    openModal({
      title: "📱 Modo Lectora - Búsqueda de Expedientes",
      content: `
        <div class="space-y-4">
          <p class="text-base font-medium text-slate-700">Buscar utilizando código de barras</p>
          
          <div class="bg-sky-50 border border-sky-300 rounded-lg p-4 space-y-2">
            <p class="text-sm text-sky-900 font-semibold">📋 Instrucciones:</p>
            <ol class="text-sm text-sky-800 space-y-2 ml-4 list-decimal">
              <li>Acerca el código de barras al escáner</li>
              <li>El código se ingresará automáticamente</li>
              <li>Presiona <strong>ENTER</strong> o espera a que busque automáticamente</li>
              <li>Los resultados aparecerán debajo</li>
            </ol>
          </div>
          
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p class="text-xs text-amber-800">💡 También puedes buscar por: N° expediente, materia, juzgado o palabras clave</p>
          </div>
        </div>
      `,
      confirmText: "Entendido",
      onConfirm: (close) => {
        close();
        showToast("📱 Escanea el código para buscar", "success");
      }
    });
  });

  const ejecutar = () => {
    resultados = filtrarExpedientesBackend(expedientes, getFiltros());
    paginaActual = 1;
    renderResultados();
    showToast(`${resultados.length} expediente(s) encontrado(s)`, "info");
  };

  document.getElementById("btn-ejecutar-busqueda")?.addEventListener("click", ejecutar);
  document.getElementById("btn-limpiar-busqueda")?.addEventListener("click", () => initBusquedaPage({ mountNode }));

  renderResultados();
}
