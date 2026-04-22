/**
 * Módulo Actualización - Integración dentro de Configuración
 */

import { showToast } from "../../components/toast.js";
import { excelService } from "../../services/excelService.js";
import { expedienteService } from "../../services/expedienteService.js";
import { icon } from "../../components/icons.js";

export function initActualizacionModule(mountNode) {
  const total = expedienteService.listar().length;

  mountNode.innerHTML = `
    <div class="space-y-4">
      <div>
        <h3 class="font-semibold text-lg">Actualización de Datos</h3>
        <p class="text-sm text-slate-500">Sincronización con fuentes externas y gestión de actualizaciones</p>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Card Integración -->
        <div class="bg-white rounded-lg border border-slate-200 p-6">
          <div class="flex items-start gap-3 mb-4">
            <span class="text-blue-600">${icon("database", "w-6 h-6")}</span>
            <div>
              <h4 class="font-semibold text-slate-900">Estado de Integración</h4>
              <p class="text-xs text-slate-500 mt-1">Conexión con fuentes de datos</p>
            </div>
          </div>
          
          <div class="space-y-2 text-sm text-slate-600">
            <p class="flex items-center gap-2">
              <span class="text-emerald-600">✓</span>
              <span>Servicio excelService configurado</span>
            </p>
            <p class="flex items-center gap-2">
              <span class="text-emerald-600">✓</span>
              <span>Persistencia con localStorage</span>
            </p>
            <p class="flex items-center gap-2">
              <span class="text-blue-600">→</span>
              <span>Estructura lista para integración real</span>
            </p>
          </div>

          <div class="mt-4 p-3 bg-sky-50 rounded border border-sky-200">
            <p class="text-xs text-blue-800">
              <strong>Nota:</strong> Sistema en modo prueba usando datos locales. Contacte al administrador para activar sincronización real.
            </p>
          </div>
        </div>

        <!-- Card Resumen -->
        <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h4 class="font-semibold text-emerald-900">Resumen de Datos</h4>
              <p class="text-xs text-emerald-700 mt-1">Información del sistema local</p>
            </div>
            <span class="text-emerald-600">${icon("database", "w-6 h-6")}</span>
          </div>
          
          <div class="space-y-3">
            <div>
              <p class="text-4xl font-bold text-emerald-700">${total}</p>
              <p class="text-sm text-emerald-600 mt-1">expedientes en el sistema</p>
            </div>
            
            <button id="btn-sync" class="w-full mt-4 px-4 py-2 rounded-lg btn btn-primary transition font-medium">
              Simular sincronización
            </button>
          </div>
        </div>
      </div>

      <!-- Sección de Historial -->
      <div class="bg-white rounded-lg border border-slate-200 p-6">
        <h4 class="font-semibold text-slate-900 mb-4">Registro de Actualizaciones</h4>
        
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between py-2 border-b border-slate-200">
            <span class="text-slate-700">Última sincronización</span>
            <span class="badge bg-blue-100 text-blue-800">Hoy</span>
          </div>
          <div class="flex items-center justify-between py-2 border-b border-slate-200">
            <span class="text-slate-700">Estado de base de datos</span>
            <span class="badge bg-emerald-100 text-emerald-800">Sincronizado</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-slate-700">Versión del sistema</span>
            <span class="font-mono text-slate-600">v2.1.0</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-sync")?.addEventListener("click", async () => {
    const btn = document.getElementById("btn-sync");
    btn.disabled = true;
btn.innerHTML = "Sincronizando...";
    
    setTimeout(async () => {
      const result = await excelService.sincronizar();
      showToast("✓ " + result.mensaje, "success");
      btn.disabled = false;
      btn.innerHTML = "Simular sincronización";
    }, 1500);
  });
}
