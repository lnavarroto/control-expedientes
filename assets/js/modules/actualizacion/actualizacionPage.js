import { showToast } from "../../components/toast.js";
import { excelService } from "../../services/excelService.js";
import { expedienteService } from "../../services/expedienteService.js";

export function initActualizacionPage({ mountNode }) {
  const total = expedienteService.listar().length;

  mountNode.innerHTML = `
    <section class="grid md:grid-cols-2 gap-6">
      <article class="card-surface p-5">
        <h3 class="font-semibold text-lg">Estado de integración</h3>
        <p class="text-slate-600 mt-2">Capa de conexión con Excel preparada. Actualmente usa datos mock/locales para entorno de pruebas.</p>
        <ul class="mt-4 space-y-2 text-sm text-slate-600 list-disc pl-5">
          <li>Servicio excelService configurado</li>
          <li>Persistencia local con localStorage</li>
          <li>Estructura lista para reemplazo por fuente real</li>
        </ul>
      </article>
      <article class="card-surface p-5">
        <h3 class="font-semibold text-lg">Resumen de datos</h3>
        <p class="text-4xl font-bold mt-2 text-slate-800">${total}</p>
        <p class="text-sm text-slate-500">expedientes actualmente en el sistema local</p>
        <button id="btn-sync" class="btn btn-primary mt-6">Simular sincronización</button>
      </article>
    </section>
  `;

  document.getElementById("btn-sync")?.addEventListener("click", async () => {
    const result = await excelService.sincronizar();
    showToast(result.mensaje, "success");
  });
}
