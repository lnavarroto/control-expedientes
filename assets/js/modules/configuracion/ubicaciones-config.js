/**
 * Módulo Ubicaciones Configuración - Gestión de ubicaciones maestras
 */

import { ubicacionService } from "../../services/ubicacionService.js";
import { renderTable } from "../../components/table.js";
import { showToast } from "../../components/toast.js";
import { openModal } from "../../components/modal.js";
import { icon } from "../../components/icons.js";

function renderUbicacionesTable(ubicaciones) {
  const rows = ubicaciones.map(u => {
    const esActivo = u.activo === "SI";
    return {
      codigo: u.codigo_ubicacion || u.codigo || "-",
      nombre: u.nombre_ubicacion || u.nombre || "-",
      tipo: u.tipo_ubicacion || u.tipo || "-",
      descripcion: u.descripcion || "-",
      estado: `<span class="badge ${esActivo ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'} font-semibold">${esActivo ? '✓ Activo' : '✗ Inactivo'}</span>`,
      acciones: `
        <div class="flex gap-2">
          <button class="btn btn-secondary text-xs inline-flex items-center gap-1" data-action="editar" data-id="${u.id_ubicacion}">${icon("edit", "w-3 h-3")}<span>Editar</span></button>
          <button class="btn btn-secondary text-xs inline-flex items-center gap-1" data-action="toggle" data-id="${u.id_ubicacion}">${esActivo ? icon("deactivate", "w-3 h-3") : icon("activate", "w-3 h-3")}<span>${esActivo ? 'Desactivar' : 'Activar'}</span></button>
        </div>
      `
    };
  });

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
        <input type="hidden" name="id_ubicacion" value="${ubicacion?.id_ubicacion || ''}">
        
        <div>
          <label class="text-sm font-semibold">Código</label>
          <input class="input-base" name="codigo_ubicacion" value="${ubicacion?.codigo_ubicacion || ''}" placeholder="EST" maxlength="4" required />
        </div>
        
        <div>
          <label class="text-sm font-semibold">Tipo</label>
          <select class="select-base" name="tipo_ubicacion" required>
            <option value="">Selecciona tipo</option>
            ${ubicacionService.tiposUbicacion().map(t => `<option value="${t}" ${ubicacion?.tipo_ubicacion === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        
        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Nombre</label>
          <input class="input-base" name="nombre_ubicacion" value="${ubicacion?.nombre_ubicacion || ''}" placeholder="Estante" required />
        </div>
        
        <div class="md:col-span-2">
          <label class="text-sm font-semibold">Descripción</label>
          <textarea class="input-base" name="descripcion" placeholder="Descripción de la ubicación" rows="2">${ubicacion?.descripcion || ''}</textarea>
        </div>
        
        <div>
          <label class="text-sm font-semibold">Estado</label>
          <select class="select-base" name="activo" required>
            <option value="SI" ${ubicacion?.activo === "SI" ? 'selected' : ''}>Activo</option>
            <option value="NO" ${ubicacion?.activo === "NO" ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      </div>
    </form>
  `;
}

export function initUbicacionesConfigModule(mountNode) {
  const ubicaciones = ubicacionService.listarDesdeLocalStorage();

  mountNode.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h3 class="font-semibold text-lg">Gestión de Ubicaciones</h3>
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
      onConfirm: async (close) => {
        const form = document.getElementById("form-ubicacion");
        const data = Object.fromEntries(new FormData(form).entries());
        try {
          if (!data.id_ubicacion) {
            await ubicacionService.crearUbicacion(data);
          } else {
            await ubicacionService.actualizarUbicacion(data);
          }
          showToast("Ubicación guardada correctamente", "success");
          close();
          initUbicacionesConfigModule(mountNode);
        } catch (error) {
          showToast("Error al guardar la ubicación: " + (error.message || "Error desconocido"), "error");
        }
      }
    });
  });

  mountNode.querySelectorAll("[data-action='editar']").forEach(btn => {
    btn.addEventListener("click", () => {
      const ubicacion = ubicacionService.obtenerUbicacion(btn.dataset.id);
      openModal({
        title: "Editar ubicación",
        content: formUbicacion(ubicacion),
        confirmText: "Actualizar",
        onConfirm: async (close) => {
          const form = document.getElementById("form-ubicacion");
          const data = Object.fromEntries(new FormData(form).entries());
          try {
            await ubicacionService.actualizarUbicacion(data);
            showToast("Ubicación actualizada correctamente", "success");
            close();
            initUbicacionesConfigModule(mountNode);
          } catch (error) {
            showToast("Error al actualizar la ubicación: " + (error.message || "Error desconocido"), "error");
          }
        }
      });
    });
  });

  mountNode.querySelectorAll("[data-action='toggle']").forEach(btn => {
    btn.addEventListener("click", () => {
      ubicacionService.toggleActivo(btn.dataset.id);
      showToast("Estado actualizado", "success");
      initUbicacionesConfigModule(mountNode);
    });
  });
}
