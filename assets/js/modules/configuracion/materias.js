/**
 * Módulo Materias - Gestión de materias judiciales
 */

import { materiaService } from "../../services/materiaService.js";
import { renderTable } from "../../components/table.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { icon } from "../../components/icons.js";

function renderMateriasTable(materias) {
  const rows = materias.map(m => ({
    codigo: m.codigo,
    nombre: m.nombre,
    abreviatura: m.abreviatura,
    descripcion: m.descripcion,
    estado: `<span class="badge ${m.activo ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}">${m.activo ? '✓ Activo' : '✗ Inactivo'}</span>`,
    acciones: `
      <div class="flex gap-2">
        <button class="btn btn-secondary text-xs inline-flex items-center gap-1" data-action="editar" data-id="${m.id}">${icon("edit", "w-3 h-3")}<span>Editar</span></button>
        <button class="btn btn-secondary text-xs inline-flex items-center gap-1" data-action="toggle" data-id="${m.id}">${m.activo ? icon("deactivate", "w-3 h-3") : icon("activate", "w-3 h-3")}<span>${m.activo ? 'Desactivar' : 'Activar'}</span></button>
      </div>
    `
  }));

  return renderTable({
    columns: [
      { key: "codigo", label: "Código" },
      { key: "nombre", label: "Nombre" },
      { key: "abreviatura", label: "Abrv." },
      { key: "descripcion", label: "Descripción" },
      { key: "estado", label: "Estado" },
      { key: "acciones", label: "Acciones" }
    ],
    rows,
    emptyText: "No hay materias registradas"
  });
}

function formMateria(materia = null) {
  return `
    <form id="form-materia" class="space-y-3">
      <div class="grid md:grid-cols-2 gap-3">
        <input type="hidden" name="id" value="${materia?.id || ''}">
        
        <div>
          <label class="text-sm font-semibold">Código</label>
          <input class="input-base" name="codigo" value="${materia?.codigo || ''}" placeholder="CI" maxlength="3" required />
        </div>
        
        <div>
          <label class="text-sm font-semibold">Abreviatura</label>
          <input class="input-base" name="abreviatura" value="${materia?.abreviatura || ''}" placeholder="CI" maxlength="3" required />
        </div>
        
        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Nombre</label>
          <input class="input-base" name="nombre" value="${materia?.nombre || ''}" placeholder="Civil" required />
        </div>
        
        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Descripción</label>
          <textarea class="input-base" name="descripcion" placeholder="Descripción de la materia" rows="2">${materia?.descripcion || ''}</textarea>
        </div>
        
        <div>
          <label class="text-sm font-semibold">Estado</label>
          <select class="select-base" name="activo" required>
            <option value="true" ${materia?.activo !== false ? 'selected' : ''}>Activo</option>
            <option value="false" ${materia?.activo === false ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      </div>
    </form>
  `;
}

export function initMateriasModule(mountNode) {
  const materias = materiaService.listar();

  mountNode.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h3 class="font-semibold text-lg">📚 Gestión de Materias</h3>
        <p class="text-sm text-slate-500">Administra las materias judiciales del sistema</p>
      </div>
      <button id="btn-nueva-materia" class="btn btn-primary">+ Nueva materia</button>
    </div>

    <div id="materias-tabla" class="card-surface p-4">
      ${renderMateriasTable(materias)}
    </div>
  `;

  document.getElementById("btn-nueva-materia")?.addEventListener("click", () => {
    openModal({
      title: "Registrar nueva materia",
      content: formMateria(),
      confirmText: "Guardar materia",
      onConfirm: (close) => {
        const form = document.getElementById("form-materia");
        const data = Object.fromEntries(new FormData(form).entries());
        data.activo = data.activo === 'true';
        materiaService.guardar(data);
        showToast("Materia guardada correctamente", "success");
        close();
        initMateriasModule(mountNode);
      }
    });
  });

  mountNode.querySelectorAll("[data-action='editar']").forEach(btn => {
    btn.addEventListener("click", () => {
      const materia = materiaService.obtener(btn.dataset.id);
      openModal({
        title: "Editar materia",
        content: formMateria(materia),
        confirmText: "Actualizar",
        onConfirm: (close) => {
          const form = document.getElementById("form-materia");
          const data = Object.fromEntries(new FormData(form).entries());
          data.activo = data.activo === 'true';
          materiaService.guardar(data);
          showToast("Materia actualizada correctamente", "success");
          close();
          initMateriasModule(mountNode);
        }
      });
    });
  });

  mountNode.querySelectorAll("[data-action='toggle']").forEach(btn => {
    btn.addEventListener("click", () => {
      materiaService.toggleActivo(btn.dataset.id);
      showToast("Estado actualizado", "success");
      initMateriasModule(mountNode);
    });
  });
}
