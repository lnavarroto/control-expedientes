import { renderTable } from "../../components/table.js";
import { statusBadge } from "../../components/statusBadge.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { expedienteService } from "../../services/expedienteService.js";
import { formatoFechaHora } from "../../utils/formatters.js";
import { validarNumeroExpediente } from "../../utils/validators.js";
import { parsearLectora } from "../../utils/lectora.js";

function rowActions(id) {
  return `
    <div class="flex gap-2">
      <button class="btn btn-secondary text-xs" data-action="ver" data-id="${id}">Ver</button>
      <button class="btn btn-secondary text-xs" data-action="historial" data-id="${id}">Historial</button>
    </div>
  `;
}

function buildTable(data) {
  const rows = data.map((item) => ({
    expediente: item.numeroExpediente,
    materia: item.materia,
    juzgado: item.juzgado,
    fecha: formatoFechaHora(item.fechaIngreso, item.horaIngreso),
    ubicacion: item.ubicacionActual,
    paquete: item.paqueteId || "-",
    estado: statusBadge(item.estado),
    acciones: rowActions(item.id)
  }));

  return renderTable({
    columns: [
      { key: "expediente", label: "Expediente" },
      { key: "materia", label: "Materia" },
      { key: "juzgado", label: "Juzgado" },
      { key: "fecha", label: "Ingreso" },
      { key: "ubicacion", label: "Ubicación" },
      { key: "paquete", label: "Paquete" },
      { key: "estado", label: "Estado" },
      { key: "acciones", label: "Acciones" }
    ],
    rows,
    emptyText: "No se encontraron expedientes para esos filtros"
  });
}

export function initBusquedaPage({ mountNode }) {
  const expedientes = expedienteService.listar();
  const materias = [...new Set(expedientes.map((item) => item.materia))];
  const juzgados = [...new Set(expedientes.map((item) => item.juzgado))];
  const ubicaciones = [...new Set(expedientes.map((item) => item.ubicacionActual))];

  const opts = (values) => ['<option value="">Todos</option>']
    .concat(values.map((value) => `<option value="${value}">${value}</option>`))
    .join("");

  mountNode.innerHTML = `
    <section class="card-surface p-5">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 class="font-semibold text-lg">Búsqueda avanzada</h3>
          <p class="text-sm text-slate-500">Busca expedientes por número, materia, juzgado o estado.</p>
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
        <select id="f-estado" class="select-base">${opts(expedienteService.estados())}</select>
        <select id="f-ubicacion" class="select-base md:col-span-2">${opts(ubicaciones)}</select>
        <input id="f-paquete" class="input-base" placeholder="Código de paquete" />
        <input id="f-fecha" type="date" class="input-base md:col-span-2" />
        <div class="md:col-span-3 flex justify-end gap-3">
          <button id="btn-limpiar-busqueda" class="btn btn-secondary">Limpiar</button>
          <button id="btn-ejecutar-busqueda" class="btn btn-primary">Buscar expedientes</button>
        </div>
      </div>
    </section>
    <section id="resultado-busqueda">${buildTable(expedientes)}</section>
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
    const resultado = expedienteService.buscar(getFiltros());
    document.getElementById("resultado-busqueda").innerHTML = buildTable(resultado);
    showToast(`${resultado.length} expediente(s) encontrado(s)`, "info");
    bindActionButtons();
  };

  function bindActionButtons() {
    mountNode.querySelectorAll("[data-action='ver']").forEach((button) => {
      button.addEventListener("click", () => {
        const expediente = expedienteService.obtener(button.dataset.id);
        if (!expediente) return;
        showToast(`Expediente: ${expediente.numeroExpediente}`, "info");
      });
    });

    mountNode.querySelectorAll("[data-action='historial']").forEach((button) => {
      button.addEventListener("click", () => {
        const movimientos = expedienteService
          .listarMovimientos()
          .filter((item) => item.expedienteId === button.dataset.id).length;
        showToast(`Historial: ${movimientos} movimiento(s)`, "success");
      });
    });
  }

  document.getElementById("btn-ejecutar-busqueda")?.addEventListener("click", ejecutar);
  document.getElementById("btn-limpiar-busqueda")?.addEventListener("click", () => initBusquedaPage({ mountNode }));
  bindActionButtons();
}
