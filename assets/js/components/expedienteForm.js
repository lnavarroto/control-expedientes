import { ESTADOS_EXPEDIENTE, JUZGADOS, UBICACIONES_PREDETERMINADAS } from "../data/mockData.js";

function optionList(values, selected) {
  return values
    .map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`)
    .join("");
}

export function renderExpedienteForm(expediente = {}) {
  const estado = expediente.estado || "Ingresado";
  return `
    <form id="form-expediente" class="card-surface p-5 md:p-6 space-y-5">
      <input type="hidden" name="id" value="${expediente.id || ""}" />
      <div class="registro-heading card-soft p-4 md:p-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <label class="text-sm font-semibold uppercase tracking-wide text-slate-600">Número de expediente</label>
          <span id="numero-expediente-chip" class="badge bg-slate-100 text-slate-700">Pendiente de validar</span>
        </div>
        <input id="numero-expediente" class="input-base input-principal mt-2" name="numeroExpediente" placeholder="00012-2026-1-3101-CI-01" value="${expediente.numeroExpediente || ""}" required />
        <p class="text-xs text-slate-500 mt-2">Formato: 00000-año-incidente-código_corte-materia-código_juzgado</p>
        <p id="numero-expediente-feedback" class="text-xs mt-1 text-slate-500">Ingrese el número para activar autocompletado y validaciones.</p>
      </div>

      <section class="card-soft p-4">
        <h4 class="text-sm font-bold uppercase tracking-wide text-slate-600 mb-3">Datos del expediente</h4>
        <div class="grid md:grid-cols-2 gap-4">
          <div><label class="text-sm font-semibold">Año</label><input class="input-base" name="anio" value="${expediente.anio || ""}" required /></div>
          <div><label class="text-sm font-semibold">Incidente</label><input class="input-base" name="incidente" value="${expediente.incidente || "0"}" required /></div>
          <div><label class="text-sm font-semibold">Fecha de ingreso</label><input type="date" class="input-base" name="fechaIngreso" value="${expediente.fechaIngreso || ""}" required /></div>
          <div><label class="text-sm font-semibold">Hora de ingreso</label><input type="time" class="input-base" name="horaIngreso" value="${expediente.horaIngreso || ""}" required /></div>
          <div class="md:col-span-2">
            <label class="text-sm font-semibold">Observaciones</label>
            <textarea class="textarea-base" rows="3" name="observaciones">${expediente.observaciones || ""}</textarea>
          </div>
        </div>
      </section>

      <section class="card-soft p-4">
        <h4 class="text-sm font-bold uppercase tracking-wide text-slate-600 mb-3">Datos judiciales</h4>
        <div class="grid md:grid-cols-2 gap-4">
          <div><label class="text-sm font-semibold">Código de corte</label><input class="input-base" name="codigoCorte" value="${expediente.codigoCorte || "3101"}" required /></div>
          <div><label class="text-sm font-semibold">Materia</label><input class="input-base" name="materia" value="${expediente.materia || "CI"}" required /></div>
          <div>
            <label class="text-sm font-semibold">Juzgado</label>
            <select class="select-base" name="juzgado">${optionList(JUZGADOS, expediente.juzgado)}</select>
          </div>
          <div>
            <label class="text-sm font-semibold">Juzgado manual (opcional)</label>
            <input class="input-base" name="juzgadoManual" placeholder="Escriba juzgado si no está en la lista" value="" />
          </div>
        </div>
      </section>

      <section class="card-soft p-4">
        <h4 class="text-sm font-bold uppercase tracking-wide text-slate-600 mb-3">Ubicación</h4>
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-semibold">Ubicación actual</label>
            <select class="select-base" name="ubicacionActual">${optionList(UBICACIONES_PREDETERMINADAS, expediente.ubicacionActual)}</select>
          </div>
          <div><label class="text-sm font-semibold">Paquete asignado (opcional)</label><input class="input-base" name="paqueteId" value="${expediente.paqueteId || ""}" /></div>
        </div>
      </section>

      <section class="card-soft p-4">
        <h4 class="text-sm font-bold uppercase tracking-wide text-slate-600 mb-3">Estado y control</h4>
        <div class="grid md:grid-cols-2 gap-4 items-end">
          <div>
            <label class="text-sm font-semibold">Estado</label>
            <select class="select-base" id="estado-expediente" name="estado">${optionList(ESTADOS_EXPEDIENTE, estado)}</select>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500 mb-2">Vista previa de estado</p>
            <div id="estado-preview" class="inline-flex"></div>
          </div>
        </div>
      </section>

      <div id="modo-lectora-box" class="hidden rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        Modo lectora activo. Escanee el código y presione Enter para autocompletar.
      </div>
      <p id="form-feedback" class="text-sm min-h-5"></p>

      <div class="flex flex-wrap gap-3 justify-end pt-1">
        <button type="button" id="btn-limpiar" class="btn btn-secondary">Limpiar</button>
        <button type="submit" class="btn btn-primary">Guardar expediente</button>
      </div>
    </form>
  `;
}
