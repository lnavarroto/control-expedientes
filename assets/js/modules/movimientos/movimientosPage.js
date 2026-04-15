import { renderTable } from "../../components/table.js";
import { expedienteService } from "../../services/expedienteService.js";

export function initMovimientosPage({ mountNode }) {
  const rows = expedienteService.listarMovimientos().map((item) => ({
    fecha: item.fecha,
    hora: item.hora,
    expediente: item.numeroExpediente,
    usuario: item.usuario,
    origen: item.origen,
    destino: item.destino,
    motivo: item.motivo,
    observacion: item.observacion
  }));

  mountNode.innerHTML = `
    <section>
      <div class="card-surface p-5 mb-4">
        <h3 class="font-semibold text-lg">Historial general de movimientos</h3>
        <p class="text-sm text-slate-500 mt-1">Trazabilidad completa de salidas, traslados y retornos.</p>
      </div>
      ${renderTable({
        columns: [
          { key: "fecha", label: "Fecha" },
          { key: "hora", label: "Hora" },
          { key: "expediente", label: "Expediente" },
          { key: "usuario", label: "Usuario" },
          { key: "origen", label: "Origen" },
          { key: "destino", label: "Destino" },
          { key: "motivo", label: "Motivo" },
          { key: "observacion", label: "Observación" }
        ],
        rows
      })}
    </section>
  `;
}
