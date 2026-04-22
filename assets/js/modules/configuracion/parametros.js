/**
 * Módulo Parámetros - Gestión de configuración del sistema
 */

import { parametroService } from "../../services/parametroService.js";
import { showToast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";

function formParametros(parametros) {
  return `
    <form id="form-parametros" class="space-y-6">
      <div class="border-b pb-4">
        <h4 class="font-semibold text-sm mb-3">🏢 Información Institucional</h4>
        <div class="space-y-3">
          <div>
            <label class="text-sm font-semibold">Nombre de la Institución</label>
            <input class="input-base" name="nombreInstitucion" value="${parametros.nombreInstitucion || ''}" placeholder="Corte Superior de Justicia" required />
          </div>
          <div>
            <label class="text-sm font-semibold">Nombre del Módulo</label>
            <input class="input-base" name="nombreModulo" value="${parametros.nombreModulo || ''}" placeholder="Archivo Módulo Civil" required />
          </div>
        </div>
      </div>

      <div class="border-b pb-4">
        <h4 class="font-semibold text-sm mb-3">Configuración de Expedientes</h4>
        <div class="space-y-3">
          <div class="grid md:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-semibold">Formato de expediente</label>
              <select class="select-base" name="formatoExpediente" required>
                <option value="XXXXX-YYYY-Z-DDDD-JR-XX-NN" ${parametros.formatoExpediente === 'XXXXX-YYYY-Z-DDDD-JR-XX-NN' ? 'selected' : ''}>XXXXX-YYYY-Z-DDDD-JR-XX-NN</option>
                <option value="SIMPLE" ${parametros.formatoExpediente === 'SIMPLE' ? 'selected' : ''}>SIMPLE</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-semibold">Modo registro por defecto</label>
              <select class="select-base" name="modoRegistroPorDefecto" required>
                <option value="manual" ${parametros.modoRegistroPorDefecto === 'manual' ? 'selected' : ''}>Manual</option>
                <option value="lector" ${parametros.modoRegistroPorDefecto === 'lector' ? 'selected' : ''}>Lector de códigos</option>
                <option value="automatico" ${parametros.modoRegistroPorDefecto === 'automatico' ? 'selected' : ''}>Automático</option>
              </select>
            </div>
          </div>
          <div class="grid md:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-semibold">Juzgado por defecto</label>
              <input class="input-base" name="juzgadoDefecto" value="${parametros.juzgadoDefecto || ''}" placeholder="JC01" maxlength="10" />
            </div>
            <div>
              <label class="text-sm font-semibold">Materia por defecto</label>
              <input class="input-base" name="materiaDefecto" value="${parametros.materiaDefecto || ''}" placeholder="CI" maxlength="4" />
            </div>
          </div>
          <div class="grid md:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-semibold">Código de corte defecto</label>
              <input class="input-base" name="codigoCorteDefecto" value="${parametros.codigoCorteDefecto || ''}" placeholder="01" maxlength="2" />
            </div>
            <div>
              <label class="text-sm font-semibold">Registros por página</label>
              <input class="input-base" type="number" name="registrosPorPagina" value="${parametros.registrosPorPagina || 15}" min="5" max="100" />
            </div>
          </div>
        </div>
      </div>

      <div class="border-b pb-4">
        <h4 class="font-semibold text-sm mb-3">Funcionalidades</h4>
        <div class="space-y-2">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="mostrarAyudaVisual" ${parametros.mostrarAyudaVisual ? 'checked' : ''} class="w-4 h-4">
            <span class="text-sm">Mostrar ayuda visual en las pantallas</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="activarValidacionEnTiempoReal" ${parametros.activarValidacionEnTiempoReal ? 'checked' : ''} class="w-4 h-4">
            <span class="text-sm">Activar validación en tiempo real</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="permitirEdicionLectora" ${parametros.permitirEdicionLectora ? 'checked' : ''} class="w-4 h-4">
            <span class="text-sm">Permitir edición de datos capturados por lector</span>
          </label>
        </div>
      </div>

      <div class="border-b pb-4">
        <h4 class="font-semibold text-sm mb-3">📞 Contacto de Soporte</h4>
        <div class="space-y-3">
          <div>
            <label class="text-sm font-semibold">Teléfono de soporte</label>
            <input class="input-base" name="telefonoSoporte" value="${parametros.telefonoSoporte || ''}" placeholder="+51 999999999" />
          </div>
          <div>
            <label class="text-sm font-semibold">Correo de soporte</label>
            <input class="input-base" type="email" name="correoSoporte" value="${parametros.correoSoporte || ''}" placeholder="soporte@ejemplo.com" />
          </div>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-3">
        <span class="text-amber-600">${icon("target", "w-5 h-5")}</span>
        <p class="text-sm text-slate-700">Los cambios en la configuración se aplicarán globalmente a todo el sistema.</p>
      </div>
    </form>
  `;
}

export function initParametrosModule(mountNode) {
  const parametros = parametroService.obtener();

  mountNode.innerHTML = `
    <div class="max-w-3xl">
      <div class="mb-4">
        <h3 class="font-semibold text-lg">Parámetros del Sistema</h3>
        <p class="text-sm text-slate-500">Configura el comportamiento global de la aplicación</p>
      </div>

      <div class="card-surface p-6">
        ${formParametros(parametros)}
        <div class="flex gap-2 mt-6">
          <button id="btn-guardar-parametros" class="btn btn-primary">Guardar configuración</button>
          <button id="btn-restaurar-parametros" class="btn btn-secondary">Restaurar valores</button>
          <button id="btn-exportar-config" class="btn btn-secondary">📥 Exportar</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-guardar-parametros")?.addEventListener("click", () => {
    const form = document.getElementById("form-parametros");
    const formData = new FormData(form);
    const data = {};
    
    formData.forEach((value, key) => {
      if (key.includes("mostrar") || key.includes("activar") || key.includes("permitir")) {
        data[key] = formData.getAll(key).length > 0;
      } else if (key === "registrosPorPagina") {
        data[key] = parseInt(value);
      } else {
        data[key] = value;
      }
    });

    parametroService.actualizar(data);
    showToast("Configuración guardada correctamente", "success");
    initParametrosModule(mountNode);
  });

  document.getElementById("btn-restaurar-parametros")?.addEventListener("click", () => {
    initParametrosModule(mountNode);
  });

  document.getElementById("btn-exportar-config")?.addEventListener("click", () => {
    const config = parametroService.obtener();
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Configuración exportada", "success");
  });
}
