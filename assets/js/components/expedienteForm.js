import { ESTADOS_EXPEDIENTE, UBICACIONES_PREDETERMINADAS } from "../data/mockData.js";
import { materiaService } from "../services/materiaService.js";
import { juzgadoService } from "../services/juzgadoService.js";
import { paqueteService } from "../services/paqueteService.js";

function optionList(values, selected, keyField = null, labelField = null) {
  return values
    .map((value) => {
      const key = keyField ? value[keyField] : value;
      const label = labelField ? value[labelField] : value;
      const isSelected = (keyField ? value[keyField] : value) === selected ? "selected" : "";
      return `<option value="${key}" ${isSelected}>${label}</option>`;
    })
    .join("");
}

export function renderExpedienteForm(expediente = {}) {
  const estado = expediente.estado || "Ingresado";
  
  // Data para dropdowns (usar SYNC para cargas rápidas del caché)
  const materias = materiaService.listarSync().filter(m => m.activo);
  const juzgados = juzgadoService.listarSync();
  const paquetes = paqueteService.listarSync();
  
  // Defaults
  const incidenteDefault = expediente.incidente || "0";
  const determinadorDefault = expediente.numeroJuzgado || "01";
  
  return `
    <form id="form-expediente" class="space-y-3">
      <input type="hidden" name="id" value="${expediente.id || ""}" />
      <input type="hidden" name="fechaIngreso" value="${expediente.fechaIngreso || ""}" />
      <input type="hidden" name="horaIngreso" value="${expediente.horaIngreso || ""}" />

      <div class="flex justify-end">
        <button
          type="button"
          id="btn-ayuda-fecha-hora"
          data-no-auto-icon="1"
          class="h-8 w-8 inline-flex items-center justify-center rounded-full border border-sky-300 bg-sky-50 text-sky-700 text-sm font-bold"
          title="Necesitas ayuda"
          aria-label="Necesitas ayuda"
        >
          ?
        </button>
      </div>
      
      <!-- 📋 NÚMERO DE EXPEDIENTE - SECCIÓN PRINCIPAL -->
      <div class="rounded-2xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 p-4 md:p-4 shadow-sm ring-1 ring-blue-100/70">
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="text-2xl">📋</span>
          <h3 class="text-base md:text-lg font-bold text-blue-900">Número de Expediente</h3>
          <div class="ml-auto text-right">
            <span id="numero-expediente-chip" class="badge bg-blue-100 text-blue-700 text-xs px-3 py-1 font-semibold">✓ Pendiente</span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-2 items-end">
          <!-- NÚMERO -->
          <div class="col-span-1 md:col-span-2">
            <label class="text-xs font-bold text-blue-800 uppercase tracking-wide">Número</label>
            <input class="input-base w-full text-center font-mono font-bold text-lg border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 bg-white" 
              name="numeroExpediente" placeholder="00012" value="${expediente.numeroExpediente ? expediente.numeroExpediente.split('-')[0] : ''}" />
          </div>
          <div class="hidden md:flex md:col-span-1 justify-center text-blue-500 font-bold">—</div>
          
          <!-- AÑO -->
          <div class="col-span-1 md:col-span-1">
            <label class="text-xs font-bold text-blue-800 uppercase tracking-wide">Año</label>
            <input class="input-base w-full text-center font-mono font-bold text-lg border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 bg-white" 
              name="anio" type="number" value="${expediente.anio || ''}" />
          </div>
          <div class="hidden md:flex md:col-span-1 justify-center text-blue-500 font-bold">—</div>
          
          <!-- INCIDENTE CON CHECKBOX -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center gap-1 mb-1">
              <label class="text-xs font-bold text-blue-800 uppercase tracking-wide">Incidente</label>
              <input type="checkbox" id="checkbox-incidente" class="w-4 h-4 cursor-pointer border-blue-400 rounded" />
            </div>
            <input class="input-base w-full text-center font-mono font-bold text-lg border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 bg-white" 
              name="incidente" type="number" min="0" max="999" value="${incidenteDefault}" readonly id="input-incidente" />
          </div>
          <div class="hidden md:flex md:col-span-1 justify-center text-blue-500 font-bold">—</div>
          
          <!-- CORTE (Dropdown) -->
          <div class="col-span-1 md:col-span-2">
            <label class="text-xs font-bold text-blue-800 uppercase tracking-wide">Corte</label>
            <select class="select-base w-full text-center font-mono font-bold text-lg border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 bg-white" name="codigoCorte">
              <option value="3101-JR" ${expediente.codigoCorte === '3101-JR' ? 'selected' : ''}>3101-JR</option>
              <option value="3101-JP" ${expediente.codigoCorte === '3101-JP' ? 'selected' : ''}>3101-JP</option>
              <option value="3101-JM" ${expediente.codigoCorte === '3101-JM' ? 'selected' : ''}>3101-JM</option>
              <option value="3101-SP" ${expediente.codigoCorte === '3101-SP' ? 'selected' : ''}>3101-SP</option>
            </select>
          </div>
          <div class="hidden md:flex md:col-span-1 justify-center text-blue-500 font-bold">—</div>
          
          <!-- MATERIA (Desde Google Sheets) -->
          <div class="col-span-1 md:col-span-2">
            <label class="text-xs font-bold text-blue-800 uppercase tracking-wide">Materia</label>
            <select class="select-base w-full text-center font-mono font-bold text-lg border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 bg-white" name="materia">
              ${optionList(materias, expediente.materia, 'codigo', 'abreviatura')}
            </select>
          </div>
          <div class="hidden md:flex md:col-span-1 justify-center text-blue-500 font-bold">—</div>
          
          <!-- DETERMINADOR (01-09) -->
          <div class="col-span-1 md:col-span-1">
            <label class="text-xs font-bold text-blue-800 uppercase tracking-wide">Det</label>
            <input class="input-base w-full text-center font-mono font-bold text-lg border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 bg-white" 
              name="numeroJuzgado" type="text" maxlength="2" value="${determinadorDefault}" id="input-determinador" placeholder="01" />
          </div>
        </div>
        
        <p id="numero-expediente-feedback" class="text-xs text-blue-600 mt-2 font-medium">Ingrese el número para activar autocompletado</p>
      </div>

      <!-- 📍 UBICACIÓN Y ESTADO -->
      <div class="rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-3 shadow-sm ring-1 ring-green-100/70">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">📍</span>
          <h4 class="text-sm font-bold text-green-900">Ubicación y Control</h4>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="text-xs font-bold text-green-800 uppercase">Juzgado/Sala</label>
            <select class="select-base w-full border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200" name="juzgado">
              <option value="">-- Seleccionar --</option>
              ${optionList(juzgados, expediente.juzgado, 'nombre', 'nombre')}
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-green-800 uppercase">Paquete</label>
            <select class="select-base w-full border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200" name="paqueteId">
              <option value="">-- Opcional --</option>
              ${optionList(paquetes, expediente.paqueteId, 'id', 'codigo')}
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-green-800 uppercase">Ubicación</label>
            <select class="select-base w-full border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200" name="ubicacionActual">${optionList(UBICACIONES_PREDETERMINADAS, expediente.ubicacionActual)}</select>
          </div>
          <div>
            <label class="text-xs font-bold text-green-800 uppercase">Estado</label>
            <select class="select-base w-full border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200" id="estado-expediente" name="estado">${optionList(ESTADOS_EXPEDIENTE, estado)}</select>
          </div>
          <div class="flex flex-col justify-end">
            <p class="text-xs font-bold text-green-800 uppercase mb-1">Vista previa</p>
            <div id="estado-preview" class="inline-flex"></div>
          </div>
        </div>
      </div>

      <!-- 📝 OBSERVACIONES -->
      <div class="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-3 shadow-sm ring-1 ring-amber-100/70">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">📝</span>
          <label class="text-sm font-bold text-amber-900 uppercase">Observaciones</label>
        </div>
        <textarea class="textarea-base w-full border-2 border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200" 
          rows="1" name="observaciones" placeholder="Notas adicionales sobre el expediente...">${expediente.observaciones || ''}</textarea>
      </div>

      <!-- BOTONES -->
      <p id="form-feedback" class="text-sm min-h-5 text-slate-600"></p>
      <div class="sticky bottom-0 z-20 bg-white/95 backdrop-blur border-t-2 border-slate-200 py-3 px-1 flex flex-wrap gap-3 justify-end">
        <button type="button" id="btn-limpiar" class="btn btn-secondary rounded-lg px-5 py-2 font-bold">
          🔄 Limpiar
        </button>
        <button type="submit" class="btn btn-primary rounded-lg px-6 py-2 font-bold shadow-lg">
          ✅ Guardar
        </button>
      </div>
    </form>
  `;
}

export function renderFormularioLectora(expediente = {}) {
  const estado = expediente.estado || "Ingresado";
  return `
    <form id="form-expediente-lectora" class="card-surface p-5 md:p-6 space-y-5">
      <input type="hidden" name="id" value="${expediente.id || ""}" />
      <input type="hidden" name="tipoIngreso" value="LECTORA" />
      
      <!-- Zona de escaneo prominente -->
      <div class="rounded-2xl border-3 border-dashed border-sky-400 bg-gradient-to-br from-sky-50 to-cyan-50 p-8 md:p-10">
        <div class="text-center space-y-4">
          <div class="text-5xl">📱</div>
          <h3 class="text-xl font-bold text-sky-900">Escáner de Códigos</h3>
          <p class="text-sm text-sky-700 max-w-md mx-auto">
            Acerca el código de barras al escáner. Los datos se completarán automáticamente.
          </p>
        </div>
        
        <div class="mt-6 space-y-2">
          <label class="text-sm font-semibold text-slate-700 block">Código de barras (20-23 dígitos)</label>
          <input 
            id="numero-expediente-lectora" 
            class="input-base text-center text-lg font-mono tracking-wider" 
            name="numeroExpediente" 
            placeholder="Escanea aquí..."
            maxlength="23"
            inputmode="numeric"
            autocomplete="off"
            value="${expediente.numeroExpediente || ""}" 
            required 
          />
          <p class="text-xs text-sky-600 text-center">Presiona <strong>ENTER</strong> para procesar</p>
        </div>
      </div>

      <!-- Estado del escaneo -->
      <div id="estado-chip-lectora" style="min-height: 40px;"></div>

      <!-- Resumen de datos detectados (oculto hasta escanear) -->
      <div id="resumen-lectora" class="hidden rounded-lg border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 space-y-3">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-semibold text-blue-900">📋 Expediente Detectado:</h4>
          <div class="flex gap-2">
            <button type="button" id="btn-editar-lectora" class="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold">✏️ Editar</button>
            <button type="button" id="btn-limpiar-lectora-btn" class="btn btn-sm bg-slate-400 hover:bg-slate-500 text-white px-3 py-1 rounded text-xs font-bold">🔄 Limpiar</button>
          </div>
        </div>
        
        <!-- Una línea con código completo -->
        <div class="bg-white rounded-lg p-4 border-2 border-blue-200">
          <p class="text-xs text-slate-500 font-semibold uppercase mb-2">Código Expediente Completo</p>
          <p id="resumen-expediente-completo" class="font-mono text-base font-bold text-blue-900 break-words">-</p>
        </div>
        
        <!-- Datos adicionales en línea -->
        <div class="bg-white rounded-lg p-3 space-y-2 text-sm">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p class="text-xs text-slate-500 font-semibold">Juzgado</p>
              <p id="resumen-juzgado" class="font-semibold text-slate-900">-</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-semibold">Paquete</p>
              <p id="resumen-paquete" class="font-semibold text-slate-900">-</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-semibold">Ubicación</p>
              <p id="resumen-ubicacion" class="font-semibold text-slate-900">-</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 font-semibold">Estado</p>
              <p id="resumen-estado" class="font-semibold text-slate-900">-</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Campos ocultos para datos extraídos -->
      <input type="hidden" name="anio" id="input-anio" value="${expediente.anio || ""}" />
      <input type="hidden" name="incidente" id="input-incidente" value="${expediente.incidente || "0"}" />
      <input type="hidden" name="codigoCorte" id="input-codigo-corte" value="${expediente.codigoCorte || "3101"}" />
      <input type="hidden" name="materia" id="input-materia" value="${expediente.materia || "CI"}" />
      <input type="hidden" name="juzgado" id="input-juzgado" value="${expediente.juzgado || ""}" />
      <input type="hidden" name="numeroJuzgado" id="input-numero-juzgado" value="${expediente.numeroJuzgado || "01"}" />
      <input type="hidden" name="codigoLecturaRaw" id="input-codigo-lectura-raw" value="${expediente.codigoLecturaRaw || ""}" />
      <input type="hidden" name="juzgadoManual" value="" />
      <input type="hidden" name="fechaIngreso" value="${expediente.fechaIngreso || (() => {
  const now = new Date();
  const anio = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const dia = String(now.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
})()}" />
      <input type="hidden" name="horaIngreso" value="${expediente.horaIngreso || (() => {
        const now = new Date();
        const horas = String(now.getHours()).padStart(2, '0');
        const minutos = String(now.getMinutes()).padStart(2, '0');
        return `${horas}:${minutos}`;
      })()}" />
      <input type="hidden" name="estado" value="${estado}" />
      <input type="hidden" name="ubicacionActual" value="${expediente.ubicacionActual || "Estante"}" />
      <input type="hidden" name="paqueteId" value="${expediente.paqueteId || ""}" />
      <input type="hidden" name="textoRelacionado" value="" />

      <!-- 📝 OBSERVACIONES -->
      <div class="rounded-xl border-2 border-sky-300 bg-gradient-to-r from-sky-50 to-cyan-50 p-3 shadow-sm ring-1 ring-sky-100/70">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">📝</span>
          <label class="text-sm font-bold text-sky-900 uppercase">Observaciones</label>
        </div>
        <textarea class="textarea-base w-full border-2 border-sky-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200" 
          rows="2" name="observaciones" placeholder="Notas adicionales sobre el expediente (registrado por lectora)...">${expediente.observaciones || ''}</textarea>
      </div>

      <p id="form-feedback-lectora" class="text-sm min-h-5"></p>

      <div class="flex flex-wrap gap-3 justify-end pt-1">
        <button type="submit" id="btn-guardar-lectora" class="btn btn-primary" disabled>✅ Guardar expediente</button>
      </div>
    </form>
  `;
}
