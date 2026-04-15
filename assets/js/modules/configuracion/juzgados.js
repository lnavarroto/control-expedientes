/**
 * Módulo Juzgados - Gestión de juzgados
 */

import { juzgadoService } from "../../services/juzgadoService.js";
import { renderTable } from "../../components/table.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { icon } from "../../components/icons.js";

function renderJuzgadosTable(juzgados) {
  const rows = juzgados.map(j => ({
    codigo: j.codigo,
    nombre: j.nombre,
    tipo: j.tipo,
    abreviatura: j.abreviatura,
    estado: `<span class="badge ${j.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}">${j.activo ? '✓ Activo' : '✗ Inactivo'}</span>`,
    acciones: `
      <div class="flex gap-2">
        <button class="btn btn-secondary text-xs" data-action="editar" data-id="${j.id}">Editar</button>
        <button class="btn btn-secondary text-xs" data-action="toggle" data-id="${j.id}">${j.activo ? 'Desactivar' : 'Activar'}</button>
      </div>
    `
  }));

  return renderTable({
    columns: [
      { key: "codigo", label: "Código" },
      { key: "nombre", label: "Nombre" },
      { key: "tipo", label: "Tipo" },
      { key: "abreviatura", label: "Abrv." },
      { key: "estado", label: "Estado" },
      { key: "acciones", label: "Acciones" }
    ],
    rows,
    emptyText: "No hay juzgados registrados"
  });
}

function formJuzgado(juzgado = null) {
  const editing = !!juzgado;
  return `
    <form id="form-juzgado" class="space-y-3">
      <div class="grid md:grid-cols-2 gap-3">
        <input type="hidden" name="id" value="${juzgado?.id || ''}">
        
        <div>
          <label class="text-sm font-semibold">Código</label>
          <input class="input-base" name="codigo" value="${juzgado?.codigo || ''}" placeholder="JC01" required />
        </div>
        
        <div>
          <label class="text-sm font-semibold">Abreviatura</label>
          <input class="input-base" name="abreviatura" value="${juzgado?.abreviatura || ''}" placeholder="JC" maxlength="3" required />
        </div>
        
        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Nombre</label>
          <input class="input-base" name="nombre" value="${juzgado?.nombre || ''}" placeholder="Juzgado Civil 01" required />
        </div>
        
        <div>
          <label class="text-sm font-semibold">Tipo</label>
          <select class="select-base" name="tipo" required>
            <option value="">Selecciona tipo</option>
            ${juzgadoService.tipos().map(t => `<option value="${t}" ${juzgado?.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        
        <div>
          <label class="text-sm font-semibold">Estado</label>
          <select class="select-base" name="activo" required>
            <option value="true" ${juzgado?.activo !== false ? 'selected' : ''}>Activo</option>
            <option value="false" ${juzgado?.activo === false ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
        
        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Observación</label>
          <textarea class="input-base" name="observacion" placeholder="Nota opcional" rows="2">${juzgado?.observacion || ''}</textarea>
        </div>
      </div>
    </form>
  `;
}

export function initJuzgadosModule(mountNode) {
  const juzgados = juzgadoService.listar();

  mountNode.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h3 class="font-semibold text-lg">⚖️ Gestión de Juzgados</h3>
        <p class="text-sm text-slate-500">Registra y administra los juzgados del sistema</p>
      </div>
      <button id="btn-nuevo-juzgado" class="btn btn-primary">+ Nuevo juzgado</button>
    </div>

    <div id="juzgados-tabla" class="card-surface p-4">
      ${renderJuzgadosTable(juzgados)}
    </div>
  `;

  // Evento nuevo juzgado
  document.getElementById("btn-nuevo-juzgado")?.addEventListener("click", () => {
    openModal({
      title: "Registrar nuevo juzgado",
      content: formJuzgado(),
      confirmText: "Guardar juzgado",
      onConfirm: (close) => {
        const form = document.getElementById("form-juzgado");
        const data = Object.fromEntries(new FormData(form).entries());
        data.activo = data.activo === 'true';
        juzgadoService.guardar(data);
        showToast("Juzgado guardado correctamente", "success");
        close();
        initJuzgadosModule(mountNode);
      }
    });
  });

  // Eventos tabla
  mountNode.querySelectorAll("[data-action='editar']").forEach(btn => {
    btn.addEventListener("click", () => {
      const juzgado = juzgadoService.obtener(btn.dataset.id);
      openModal({
        title: "Editar juzgado",
        content: formJuzgado(juzgado),
        confirmText: "Actualizar",
        onConfirm: (close) => {
          const form = document.getElementById("form-juzgado");
          const data = Object.fromEntries(new FormData(form).entries());
          data.activo = data.activo === 'true';
          juzgadoService.guardar(data);
          showToast("Juzgado actualizado correctamente", "success");
          close();
          initJuzgadosModule(mountNode);
        }
      });
    });
  });

  mountNode.querySelectorAll("[data-action='toggle']").forEach(btn => {
    btn.addEventListener("click", () => {
      juzgadoService.toggleActivo(btn.dataset.id);
      showToast("Estado actualizado", "success");
      initJuzgadosModule(mountNode);
    });
  });
}
