import { renderTable } from "../../components/table.js";
import { showToast } from "../../components/toast.js";
import { expedienteService } from "../../services/expedienteService.js";
import { paqueteService } from "../../services/paqueteService.js";

function tablaPaquetes() {
  const rows = paqueteService.listar().map((item) => ({
    codigo: item.codigo,
    descripcion: item.descripcion,
    fecha: item.fechaCreacion,
    cantidad: paqueteService.contarExpedientes(item.id)
  }));

  return renderTable({
    columns: [
      { key: "codigo", label: "Código" },
      { key: "descripcion", label: "Descripción" },
      { key: "fecha", label: "Creación" },
      { key: "cantidad", label: "Expedientes" }
    ],
    rows
  });
}

export function initPaquetesPage({ mountNode }) {
  const expedientes = expedienteService.listar();
  const paquetes = paqueteService.listar();

  mountNode.innerHTML = `
    <section class="grid xl:grid-cols-2 gap-6">
      <article class="card-surface p-5">
        <h3 class="font-semibold text-lg">Crear paquete</h3>
        <form id="form-paquete" class="mt-4 grid gap-3">
          <input name="codigo" class="input-base" placeholder="Ej: PQT B-01" required />
          <input name="descripcion" class="input-base" placeholder="Descripción" required />
          <div class="flex justify-end"><button class="btn btn-primary">Guardar paquete</button></div>
        </form>
      </article>
      <article class="card-surface p-5">
        <h3 class="font-semibold text-lg">Asignar expediente</h3>
        <form id="form-asignacion" class="mt-4 grid gap-3">
          <select class="select-base" name="expedienteId">${expedientes.map((e) => `<option value="${e.id}">${e.numeroExpediente}</option>`).join("")}</select>
          <select class="select-base" name="paqueteId">${paquetes.map((p) => `<option value="${p.id}">${p.codigo}</option>`).join("")}</select>
          <div class="flex gap-2 justify-end">
            <button type="button" id="btn-quitar-paquete" class="btn btn-secondary">Quitar de paquete</button>
            <button class="btn btn-primary">Asignar</button>
          </div>
        </form>
      </article>
    </section>
    <section>
      <h3 class="font-semibold text-lg mb-3">Listado de paquetes</h3>
      ${tablaPaquetes()}
    </section>
  `;

  document.getElementById("form-paquete")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    paqueteService.crear(data);
    showToast("Paquete creado", "success");
    initPaquetesPage({ mountNode });
  });

  document.getElementById("form-asignacion")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    paqueteService.asignarExpediente(data);
    showToast("Expediente asignado al paquete", "success");
    initPaquetesPage({ mountNode });
  });

  document.getElementById("btn-quitar-paquete")?.addEventListener("click", () => {
    const expedienteId = document.querySelector("[name='expedienteId']")?.value;
    paqueteService.quitarExpediente(expedienteId);
    showToast("Expediente retirado del paquete", "warning");
    initPaquetesPage({ mountNode });
  });
}
