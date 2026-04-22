/**
 * Módulo Materias - Gestión de categorías judiciales
 */

import { materiaService } from "../../services/materiaService.js";
import { renderTable } from "../../components/table.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { icon } from "../../components/icons.js";

function renderMateriasTable(materias) {
  const rows = materias.map(m => ({
    codigo: `<span class="badge bg-slate-100 text-slate-800 font-mono">${m.codigo}</span>`,
    nombre: `<span class="font-medium">${m.nombre}</span>`,
    abreviatura: m.abreviatura,
    descripcion: m.descripcion || "-",
    estado: `<span class="badge ${m.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}">${m.activo ? 'Activo' : 'Inactivo'}</span>`,
    acciones: `
      <div class="flex gap-2">
        <button class="px-3 py-1 text-xs rounded border border-blue-300 text-blue-700 hover:bg-blue-50 transition inline-flex items-center gap-1" data-action="editar" data-id="${m.id}">${icon("edit", "w-3 h-3")}<span>Editar</span></button>
        <button class="px-3 py-1 text-xs rounded border border-orange-300 text-orange-700 hover:bg-orange-50 transition inline-flex items-center gap-1" data-action="toggle" data-id="${m.id}">${m.activo ? icon("deactivate", "w-3 h-3") : icon("activate", "w-3 h-3")}<span>${m.activo ? 'Desactivar' : 'Activar'}</span></button>
      </div>
    `
  }));

  return renderTable({
    columns: [
      { key: "codigo", label: "Código" },
      { key: "nombre", label: "Nombre" },
      { key: "abreviatura", label: "Abrev." },
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
    <form id="form-materia" class="space-y-4">
      <input type="hidden" name="id" value="${materia?.id || ''}">
      
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2">Código</label>
          <input class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" name="codigo" value="${materia?.codigo || ''}" placeholder="CI" maxlength="3" required />
        </div>
        
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2">Abreviatura</label>
          <input class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" name="abreviatura" value="${materia?.abreviatura || ''}" placeholder="CI" maxlength="3" required />
        </div>
        
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-slate-700 mb-2">Nombre</label>
          <input class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="nombre" value="${materia?.nombre || ''}" placeholder="Civil" required />
        </div>
        
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-slate-700 mb-2">Descripción</label>
          <textarea class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="descripcion" placeholder="Descripción de la materia" rows="2">${materia?.descripcion || ''}</textarea>
        </div>
        
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2">Estado</label>
          <select class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="activo" required>
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
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="font-semibold text-lg">📚 Gestión de Materias</h3>
          <p class="text-sm text-slate-500">Administra las categorías judiciales</p>
        </div>
        <button id="btn-nueva-materia" class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium">+ Agregar materia</button>
      </div>

      <div class="bg-white rounded-lg border border-slate-200 p-4 overflow-x-auto">
        ${renderMateriasTable(materias)}
      </div>
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
        showToast("✓ Materia guardada correctamente", "success");
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
          showToast("✓ Materia actualizada", "success");
          close();
          initMateriasModule(mountNode);
        }
      });
    });
  });

  mountNode.querySelectorAll("[data-action='toggle']").forEach(btn => {
    btn.addEventListener("click", () => {
      materiaService.toggleActivo(btn.dataset.id);
      showToast("✓ Estado actualizado", "success");
      initMateriasModule(mountNode);
    });
  });
}
