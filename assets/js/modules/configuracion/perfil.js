/**
 * Módulo Perfil - Gestión del perfil del trabajador
 */

import { perfilService } from "../../services/perfilService.js";
import { authManager } from "../../auth/authManager.js";
import { showToast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";

function formPerfil(perfil) {
  const cargos = perfilService.cargos();
  const areas = perfilService.areas();
  
  return `
    <form id="form-perfil" class="space-y-6">
      <div class="bg-white rounded-lg border border-slate-200 p-6">
        <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <span class="text-2xl">👤</span>
          <h3 class="font-semibold text-lg text-slate-900">Datos Personales</h3>
        </div>
        
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Nombres</label>
            <input class="input-base w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="nombres" value="${perfil.nombres || ''}" placeholder="Juan Carlos" required />
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Apellidos</label>
            <input class="input-base w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="apellidos" value="${perfil.apellidos || ''}" placeholder="García López" required />
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">DNI</label>
            <input class="input-base w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="dni" value="${perfil.dni || ''}" placeholder="12345678" maxlength="8" type="text" disabled />
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Correo Electrónico</label>
            <input class="input-base w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="correo" type="email" value="${perfil.correo || ''}" placeholder="correo@ejemplo.com" required />
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Teléfono</label>
            <input class="input-base w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="telefono" value="${perfil.telefono || ''}" placeholder="999999999" type="tel" />
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Dirección</label>
            <input class="input-base w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="direccion" value="${perfil.direccion || ''}" placeholder="Calle principal 123" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-slate-200 p-6">
        <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
          <span class="text-2xl">🔐</span>
          <h3 class="font-semibold text-lg text-slate-900">Datos del Sistema</h3>
        </div>
        
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Cargo</label>
            <select class="select-base w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="cargo" required>
              <option value="">Selecciona cargo</option>
              ${cargos.map(c => `<option value="${c}" ${perfil.cargo === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Área/Módulo</label>
            <select class="select-base w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" name="area" required>
              <option value="">Selecciona área</option>
              ${areas.map(a => `<option value="${a}" ${perfil.area === a ? 'selected' : ''}>${a}</option>`).join('')}
            </select>
          </div>

          <div class="md:col-span-2 bg-slate-50 rounded p-3 border border-slate-200">
            <p class="text-xs text-slate-600">
              <strong>Rol:</strong> ${perfil.rol || '---'} • <strong>Módulo:</strong> ${perfil.area_modulo || '---'}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <span class="text-xl">ℹ️</span>
        <p class="text-sm text-blue-800">Los cambios se guardarán de inmediato en el perfil del sistema. Algunos cambios pueden requerir reiniciar sesión.</p>
      </div>
    </form>
  `;
}

export function initPerfilModule(mountNode) {
  const trabajador = authManager.getTrabajador();
  
  if (!trabajador) {
    mountNode.innerHTML = `<div class="rounded-lg border-l-4 border-red-400 bg-red-50 p-6"><p class="font-semibold text-red-800">Error</p><p class="text-sm text-red-700 mt-2">No se encontraron datos del usuario. Por favor, vuelve a iniciar sesión.</p></div>`;
    return;
  }

  const perfil = {
    nombres: trabajador.nombres || '',
    apellidos: trabajador.apellidos || '',
    dni: trabajador.id_usuario || '',
    correo: trabajador.correo || '',
    cargo: trabajador.cargo || '',
    area: trabajador.area_modulo || '',
    area_modulo: trabajador.area_modulo || '',
    rol: trabajador.rol || '',
    telefono: localStorage.getItem('perfil_telefono') || '',
    direccion: localStorage.getItem('perfil_direccion') || ''
  };

  mountNode.innerHTML = `
    <div class="max-w-4xl">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="md:col-span-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 text-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-3 shadow-lg">
            <span class="text-white">${icon("user", "w-8 h-8")}</span>
          </div>
          <p class="font-bold text-lg text-slate-900">${perfil.nombres} ${perfil.apellidos}</p>
          <p class="text-xs text-slate-600 mt-1 font-semibold">${perfil.cargo}</p>
          <p class="text-xs text-white mt-2 px-3 py-1 rounded-full bg-blue-600">${perfil.rol}</p>
          <p class="text-xs text-blue-700 mt-2 badge bg-blue-100">${perfil.area_modulo}</p>
        </div>

        <div class="md:col-span-2">
          ${formPerfil(perfil)}
        </div>
      </div>
      
      <div class="flex gap-2 justify-end mt-6">
        <button id="btn-resetear-perfil" class="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition font-medium text-slate-700">
          ↺ Cancelar cambios
        </button>
        <button id="btn-guardar-perfil" class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium flex items-center gap-2">
          <span id="save-loader" class="hidden">...</span>
          <span id="save-text">✓ Guardar cambios</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById("btn-guardar-perfil")?.addEventListener("click", () => {
    const form = document.getElementById("form-perfil");
    const data = Object.fromEntries(new FormData(form).entries());
    
    const loader = document.getElementById("save-loader");
    const text = document.getElementById("save-text");
    loader.classList.remove("hidden");
    text.textContent = "Guardando...";
    
    setTimeout(() => {
      localStorage.setItem('perfil_telefono', data.telefono);
      localStorage.setItem('perfil_direccion', data.direccion);
      perfilService.actualizar(data);
      showToast("✓ Perfil actualizado correctamente", "success");
      loader.classList.add("hidden");
      text.textContent = "✓ Guardar cambios";
      initPerfilModule(mountNode);
    }, 600);
  });

  document.getElementById("btn-resetear-perfil")?.addEventListener("click", () => {
    initPerfilModule(mountNode);
  });
}
