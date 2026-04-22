/**
 * Módulo Estados - Gestión de estados de expedientes
 */

import { estadoService } from "../../services/estadoService.js";
import { renderTable } from "../../components/table.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { icon } from "../../components/icons.js";

function renderEstadosTable(estados) {
  const rows = estados.map(e => ({
    nombre: e.nombre,
    codigo: e.codigo,
    color: `
      <div class="flex items-center gap-2">
        <span class="inline-block w-4 h-4 rounded bg-${e.color}-500"></span>
        <span class="text-xs">${e.color}</span>
      </div>
    `,
    descripcion: e.descripcion || '-',
    estado: `<span class="badge ${e.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}">${e.activo ? 'Activo' : 'Inactivo'}</span>`,
    acciones: `
      <div class="flex gap-2">
        <button class="btn btn-secondary text-xs inline-flex items-center gap-1" data-action="editar" data-id="${e.id}">${icon("edit", "w-3 h-3")}<span>Editar</span></button>
        <button class="btn btn-secondary text-xs inline-flex items-center gap-1" data-action="toggle" data-id="${e.id}">${e.activo ? icon("deactivate", "w-3 h-3") : icon("activate", "w-3 h-3")}<span>${e.activo ? 'Desactivar' : 'Activar'}</span></button>
      </div>
    `
  }));

  return renderTable({
    columns: [
      { key: "nombre", label: "Estado" },
      { key: "codigo", label: "Código" },
      { key: "color", label: "Color" },
      { key: "descripcion", label: "Descripción" },
      { key: "estado", label: "Estado" },
      { key: "acciones", label: "Acciones" }
    ],
    rows,
    emptyText: "No hay estados registrados"
  });
}

function formEstado(estado = null) {
  const colores = estadoService.colores();
  
  return `
    <form id="form-estado" class="space-y-3">
      <div class="grid md:grid-cols-2 gap-3">
        <input type="hidden" name="id" value="${estado?.id || ''}">
        
        <div>
          <label class="text-sm font-semibold">Nombre del estado</label>
          <input class="input-base" name="nombre" value="${estado?.nombre || ''}" placeholder="Ingresado" required />
        </div>
        
        <div>
          <label class="text-sm font-semibold">Código</label>
          <input class="input-base" name="codigo" value="${estado?.codigo || ''}" placeholder="ING" maxlength="3" required />
        </div>
        
        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Color de identificación</label>
          <div class="grid grid-cols-5 gap-2">
            ${colores.map(color => `
              <label class="cursor-pointer">
                <input type="radio" name="color" value="${color}" ${estado?.color === color ? 'checked' : ''} class="hidden">
                <div class="w-full h-10 rounded border-2 ${estado?.color === color ? 'border-slate-800' : 'border-slate-300'} bg-${color}-500 hover:border-slate-600 transition"></div>
              </label>
            `).join('')}
          </div>
        </div>
        
        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Descripción</label>
          <textarea class="input-base" name="descripcion" placeholder="Descripción del estado" rows="2">${estado?.descripcion || ''}</textarea>
        </div>
        
        <div>
          <label class="text-sm font-semibold">Estado</label>
          <select class="select-base" name="activo" required>
            <option value="true" ${estado?.activo !== false ? 'selected' : ''}>Activo</option>
            <option value="false" ${estado?.activo === false ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      </div>
    </form>
  `;
}

export function initEstadosModule(mountNode) {
  const estados = estadoService.listar();

  mountNode.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h3 class="font-semibold text-lg">🎯 Gestión de Estados</h3>
        <p class="text-sm text-slate-500">Define los estados que pueden tener los expedientes</p>
      </div>
      <button id="btn-nuevo-estado" class="btn btn-primary">+ Nuevo estado</button>
    </div>

    <div id="estados-tabla" class="card-surface p-4">
      ${renderEstadosTable(estados)}
    </div>
  `;

  document.getElementById("btn-nuevo-estado")?.addEventListener("click", () => {
    openModal({
      title: "Registrar nuevo estado",
      content: formEstado(),
      confirmText: "Guardar estado",
      onConfirm: (close) => {
        const form = document.getElementById("form-estado");
        const data = Object.fromEntries(new FormData(form).entries());
        data.activo = data.activo === 'true';
        estadoService.guardar(data);
        showToast("Estado guardado correctamente", "success");
        close();
        initEstadosModule(mountNode);
      }
    });
  });

  mountNode.querySelectorAll("[data-action='editar']").forEach(btn => {
    btn.addEventListener("click", () => {
      const estado = estadoService.obtener(btn.dataset.id);
      openModal({
        title: "Editar estado",
        content: formEstado(estado),
        confirmText: "Actualizar",
        onConfirm: (close) => {
          const form = document.getElementById("form-estado");
          const data = Object.fromEntries(new FormData(form).entries());
          data.activo = data.activo === 'true';
          estadoService.guardar(data);
          showToast("Estado actualizado correctamente", "success");
          close();
          initEstadosModule(mountNode);
        }
      });
    });
  });

  mountNode.querySelectorAll("[data-action='toggle']").forEach(btn => {
    btn.addEventListener("click", () => {
      estadoService.toggleActivo(btn.dataset.id);
      showToast("Estado actualizado", "success");
      initEstadosModule(mountNode);
    });
  });
}
