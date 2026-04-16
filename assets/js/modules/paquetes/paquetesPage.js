import { renderTable } from "../../components/table.js";
import { openModal } from "../../components/modal.js";
import { showToast } from "../../components/toast.js";
import { expedienteService } from "../../services/expedienteService.js";
import { paqueteService } from "../../services/paqueteService.js";

const PAGE_SIZE = 10;

function expedienteTienePaquete(expediente) {
  const paqueteId = expediente.paqueteId || expediente.id_paquete || "";
  return Boolean(String(paqueteId).trim());
}

function numeroExpedienteLabel(expediente) {
  return expediente.numeroExpediente || expediente.numero_expediente || expediente.codigo_expediente_completo || expediente.id || "Sin codigo";
}

function tablaPaquetes(paquetes = [], page = 1, pageSize = PAGE_SIZE) {
  const total = paquetes.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const inicio = (currentPage - 1) * pageSize;
  const fin = inicio + pageSize;

  const rows = paquetes.slice(inicio, fin).map((item) => ({
    orden: item.id || "-",
    codigo: item.codigo,
    descripcion: item.descripcion,
    fecha: item.fechaCreacion || "-",
    cantidad: paqueteService.contarExpedientes(item.id)
  }));

  return {
    tableHtml: renderTable({
      columns: [
        { key: "orden", label: "ID" },
        { key: "codigo", label: "Codigo" },
        { key: "descripcion", label: "Descripcion" },
        { key: "fecha", label: "Creacion" },
        { key: "cantidad", label: "Expedientes" }
      ],
      rows,
      emptyText: "No hay paquetes activos para mostrar"
    }),
    total,
    totalPages,
    currentPage
  };
}

function renderPagination(page, totalPages) {
  if (totalPages <= 1) return "";
  return `
    <div class="card-surface p-3 mt-3 flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm text-slate-600">Pagina ${page} de ${totalPages}</p>
      <div class="flex items-center gap-2">
        <button id="btn-paq-prev" class="btn btn-secondary text-sm" ${page <= 1 ? "disabled" : ""}>Anterior</button>
        <button id="btn-paq-next" class="btn btn-secondary text-sm" ${page >= totalPages ? "disabled" : ""}>Siguiente</button>
      </div>
    </div>
  `;
}

function abrirModalAsignacion({ paquetes, expedientes, onAssigned }) {
  const disponibles = expedientes.filter((item) => !expedienteTienePaquete(item));

  if (!disponibles.length) {
    showToast("No hay expedientes disponibles sin paquete", "warning");
    return;
  }

  const paqueteOptions = paquetes
    .map((p) => `<option value="${p.id}">${p.codigo}</option>`)
    .join("");

  const buildExpOptions = (lista) => lista
    .map((e) => `<option value="${e.id}">${numeroExpedienteLabel(e)}</option>`)
    .join("");

  openModal({
    title: "Asignar expediente a paquete",
    content: `
      <div class="grid gap-3 text-sm">
        <div>
          <label class="block mb-1 font-semibold text-slate-700">Buscar por codigo</label>
          <input id="asig-buscar" class="input-base" placeholder="Ej: 00059-2019-0-3101-JR-CI-01" />
        </div>
        <div>
          <label class="block mb-1 font-semibold text-slate-700">Expedientes sin paquete</label>
          <select id="asig-expediente" class="select-base max-w-full">${buildExpOptions(disponibles)}</select>
        </div>
        <div>
          <label class="block mb-1 font-semibold text-slate-700">Paquete destino</label>
          <select id="asig-paquete" class="select-base">${paqueteOptions}</select>
        </div>
        <p id="asig-info" class="text-xs text-slate-500">Puedes buscar por codigo o elegir un registro de la lista.</p>
      </div>
    `,
    confirmText: "Asignar",
    onConfirm: (close) => {
      const expedienteId = document.getElementById("asig-expediente")?.value;
      const paqueteId = document.getElementById("asig-paquete")?.value;

      if (!expedienteId || !paqueteId) {
        showToast("Selecciona expediente y paquete", "warning");
        return;
      }

      const actualizado = paqueteService.asignarExpediente({ expedienteId, paqueteId });
      if (!actualizado) {
        showToast("No se pudo asignar el expediente", "error");
        return;
      }

      close();
      showToast("Expediente asignado al paquete", "success");
      onAssigned?.();
    }
  });

  setTimeout(() => {
    const buscarInput = document.getElementById("asig-buscar");
    const selectExp = document.getElementById("asig-expediente");
    const info = document.getElementById("asig-info");

    if (!buscarInput || !selectExp) return;

    const refrescarOpciones = () => {
      const query = String(buscarInput.value || "").trim().toLowerCase();
      const filtrados = query
        ? disponibles.filter((e) => numeroExpedienteLabel(e).toLowerCase().includes(query))
        : disponibles;

      selectExp.innerHTML = buildExpOptions(filtrados);
      info.textContent = filtrados.length
        ? `${filtrados.length} expediente(s) disponible(s)`
        : "Sin coincidencias para esa busqueda";
    };

    buscarInput.addEventListener("input", refrescarOpciones);
  }, 0);
}

export async function initPaquetesPage({ mountNode }) {
  let page = 1;
  let paquetes = await paqueteService.listar();
  let expedientes = expedienteService.listar();

  const refrescarData = async () => {
    paquetes = await paqueteService.listar();
    expedientes = expedienteService.listar();
  };

  const render = () => {
    const tabla = tablaPaquetes(paquetes, page, PAGE_SIZE);
    mountNode.innerHTML = `
      <section class="grid xl:grid-cols-3 gap-6">
        <article class="card-surface p-5 xl:col-span-1">
          <h3 class="font-semibold text-lg">Crear paquete</h3>
          <form id="form-paquete" class="mt-4 grid gap-3">
            <input name="codigo" class="input-base" placeholder="Ej: PQT-B-01" required />
            <input name="descripcion" class="input-base" placeholder="Descripcion" required />
            <div class="flex justify-end"><button class="btn btn-primary">Guardar paquete</button></div>
          </form>
        </article>

        <article class="card-surface p-5 xl:col-span-1">
          <h3 class="font-semibold text-lg">Crear continuacion</h3>
          <form id="form-continuacion" class="mt-4 grid gap-3">
            <select class="select-base" name="paqueteBaseId" required>
              <option value="">Seleccionar paquete base</option>
              ${paquetes.map((p) => `<option value="${p.id}">${p.codigo}</option>`).join("")}
            </select>
            <input name="descripcion" class="input-base" placeholder="Descripcion (opcional)" />
            <div class="flex justify-end"><button class="btn btn-secondary">Crear continuacion</button></div>
          </form>
        </article>

        <article class="card-surface p-5 xl:col-span-1">
          <h3 class="font-semibold text-lg">Asignacion</h3>
          <p class="text-sm text-slate-500 mt-2">Asigna expedientes sin paquete mediante modal con busqueda por codigo.</p>
          <div class="mt-4 flex gap-2 justify-end">
            <button id="btn-asignar-modal" class="btn btn-primary">Asignar expediente</button>
            <button id="btn-quitar-paquete" class="btn btn-secondary">Quitar de paquete</button>
          </div>
        </article>
      </section>

      <section>
        <h3 class="font-semibold text-lg mb-3">Listado de paquetes</h3>
        ${tabla.tableHtml}
        ${renderPagination(tabla.currentPage, tabla.totalPages)}
      </section>
    `;

    document.getElementById("form-paquete")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      if (!String(data.codigo || "").trim()) {
        showToast("Ingresa codigo de paquete", "warning");
        return;
      }
      paqueteService.crear(data);
      await refrescarData();
      page = 1;
      render();
      showToast("Paquete creado", "success");
    });

    document.getElementById("form-continuacion")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      const nuevo = paqueteService.crearContinuacion(data);
      if (!nuevo) {
        showToast("No se pudo crear la continuacion", "error");
        return;
      }
      await refrescarData();
      page = 1;
      render();
      showToast(`Continuacion creada: ${nuevo.codigo}`, "success");
    });

    document.getElementById("btn-asignar-modal")?.addEventListener("click", () => {
      abrirModalAsignacion({
        paquetes,
        expedientes,
        onAssigned: async () => {
          await refrescarData();
          render();
        }
      });
    });

    document.getElementById("btn-quitar-paquete")?.addEventListener("click", async () => {
      const asignados = expedientes.filter((e) => expedienteTienePaquete(e));
      if (!asignados.length) {
        showToast("No hay expedientes asignados a paquetes", "warning");
        return;
      }

      const options = asignados
        .map((e) => `<option value="${e.id}">${numeroExpedienteLabel(e)}</option>`)
        .join("");

      openModal({
        title: "Quitar expediente de paquete",
        content: `<select id="quitar-expediente" class="select-base">${options}</select>`,
        confirmText: "Quitar",
        onConfirm: async (close) => {
          const expedienteId = document.getElementById("quitar-expediente")?.value;
          const actualizado = paqueteService.quitarExpediente(expedienteId);
          if (!actualizado) {
            showToast("No se pudo retirar el expediente", "error");
            return;
          }
          close();
          await refrescarData();
          render();
          showToast("Expediente retirado del paquete", "warning");
        }
      });
    });

    document.getElementById("btn-paq-prev")?.addEventListener("click", () => {
      page = Math.max(1, page - 1);
      render();
    });

    document.getElementById("btn-paq-next")?.addEventListener("click", () => {
      const totalPages = Math.max(1, Math.ceil(paquetes.length / PAGE_SIZE));
      page = Math.min(totalPages, page + 1);
      render();
    });
  };

  render();
}
