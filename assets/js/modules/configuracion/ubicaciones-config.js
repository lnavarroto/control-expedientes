/**
 * Módulo Ubicaciones Configuración - Gestión de ubicaciones maestras
 */

import { ubicacionConfigService } from "../../services/ubicacionConfigService.js";
import { renderTable } from "../../components/table.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";

function renderUbicacionesTable(ubicaciones) {
  const rows = ubicaciones.map(u => ({
    codigo: u.codigo,
    nombre: u.nombre,
    tipo: u.tipo,
    descripcion: u.descripcion,
    estado: `<span class="badge ${u.activo ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'}">${u.activo ? '✓ Activo' : '✗ Inactivo'}</span>`,
    acciones: `
      <div class="flex gap-2">
        <button class="btn btn-secondary text-xs" data-action="editar" data-id="${u.id}">Editar</button>
        <button class="btn btn-secondary text-xs" data-action="toggle" data-id="${u.id}">${u.activo ? 'Desactivar' : 'Activar'}</button>
      </div>
    `
  }));

  return renderTable({
    columns: [
      { key: "codigo", label: "Código" },
      { key: "nombre", label: "Nombre" },
      { key: "tipo", label: "Tipo" },
      { key: "descripcion", label: "Descripción" },
      { key: "estado", label: "Estado" },
      { key: "acciones", label: "Acciones" }
    ],
    rows,
    emptyText: "No hay ubicaciones registradas"
  });
}

function formUbicacion(ubicacion = null) {
  return `
    <form id="form-ubicacion" class="space-y-3">
      <div class="grid md:grid-cols-2 gap-3">
        <input type="hidden" name="id" value="${ubicacion?.id || ''}">
        
        <div>
          <label class="text-sm font-semibold">Código</label>
          <input class="input-base" name="codigo" value="${ubicacion?.codigo || ''}" placeholder="EST" maxlength="4" required />
        </div>
        
        <div>
          <label class="text-sm font-semibold">Tipo</label>
          <select class="select-base" name="tipo" required>
            <option value="">Selecciona tipo</option>
            ${ubicacionConfigService.tipos().map(t => `<option value="${t}" ${ubicacion?.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        
        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Nombre</label>
          <input class="input-base" name="nombre" value="${ubicacion?.nombre || ''}" placeholder="Estante" required />
        </div>
        
        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Descripción</label>
          <textarea class="input-base" name="descripcion" placeholder="Descripción de la ubicación" rows="2">${ubicacion?.descripcion || ''}</textarea>
        </div>
        
        <div>
          <label class="text-sm font-semibold">Estado</label>
          <select class="select-base" name="activo" required>
            <option value="true" ${ubicacion?.activo !== false ? 'selected' : ''}>Activo</option>
            <option value="false" ${ubicacion?.activo === false ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      </div>
    </form>
  `;
}

export function initUbicacionesConfigModule(mountNode) {
  const ubicaciones = ubicacionConfigService.listar();

  mountNode.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h3 class="font-semibold text-lg">📍 Gestión de Ubicaciones</h3>
        <p class="text-sm text-slate-500">Administra las ubicaciones maestras del archivo</p>
      </div>
      <button id="btn-nueva-ubicacion" class="btn btn-primary">+ Nueva ubicación</button>
    </div>

    <div id="ubicaciones-tabla" class="card-surface p-4">
      ${renderUbicacionesTable(ubicaciones)}
    </div>
  `;

  document.getElementById("btn-nueva-ubicacion")?.addEventListener("click", () => {
    openModal({
      title: "Registrar nueva ubicación",
      content: formUbicacion(),
      confirmText: "Guardar ubicación",
      onConfirm: (close) => {
        const form = document.getElementById("form-ubicacion");
        const data = Object.fromEntries(new FormData(form).entries());
        data.activo = data.activo === 'true';
        ubicacionConfigService.guardar(data);
        showToast("Ubicación guardada correctamente", "success");
        close();
        initUbicacionesConfigModule(mountNode);
      }
    });
  });

  mountNode.querySelectorAll("[data-action='editar']").forEach(btn => {
    btn.addEventListener("click", () => {
      const ubicacion = ubicacionConfigService.obtener(btn.dataset.id);
      openModal({
        title: "Editar ubicación",
        content: formUbicacion(ubicacion),
        confirmText: "Actualizar",
        onConfirm: (close) => {
          const form = document.getElementById("form-ubicacion");
          const data = Object.fromEntries(new FormData(form).entries());
          data.activo = data.activo === 'true';
          ubicacionConfigService.guardar(data);
          showToast("Ubicación actualizada correctamente", "success");
          close();
          initUbicacionesConfigModule(mountNode);
        }
      });
    });
  });

  mountNode.querySelectorAll("[data-action='toggle']").forEach(btn => {
    btn.addEventListener("click", () => {
      ubicacionConfigService.toggleActivo(btn.dataset.id);
      showToast("Estado actualizado", "success");
      initUbicacionesConfigModule(mountNode);
    });
  });
}
