/**
 * Componente reutilizable de chip para número de expediente
 * SOLO renderiza HTML y actualiza visuales
 * La lógica de validación va en cada módulo
 */

export function createNumeroExpedienteChip() {
  return `
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <label class="text-sm font-semibold uppercase tracking-wide text-slate-600">Número de expediente</label>
        <span id="numero-estado-chip" class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all bg-slate-100 text-slate-700">
          <span class="text-lg">⏳</span>
          <span>Pendiente</span>
        </span>
      </div>
      <input 
        id="numero-expediente-input" 
        type="text" 
        class="input-base input-principal w-full" 
        placeholder="00012-2026-1-3101-CI-01"
        autocomplete="off"
      />
      <p class="text-xs text-slate-500">Formato: 00000-año-incidente-código_corte-materia-código_juzgado</p>
      <p id="numero-feedback-text" class="text-xs text-slate-600 min-h-5"></p>
    </div>
  `;
}

/**
 * Actualizar chip según estado de validación
 */
export function actualizarChipEstado(estado, esLectora = false) {
  const chip = document.getElementById("numero-estado-chip");
  const feedback = document.getElementById("numero-feedback-text");
  const input = document.getElementById("numero-expediente-input");

  if (!chip) return;

  const iconoModo = esLectora ? "📱" : "🖱️";
  const tipoModo = esLectora ? "Lectora" : "Manual";

  let clase = "";
  let icono = "";
  let texto = "";
  let feedbackTexto = "";
  let feedbackClase = "";

  if (estado === "pendiente") {
    clase = "bg-slate-100 text-slate-700";
    icono = "⏳";
    texto = "Pendiente";
    feedbackTexto = esLectora ? "Escanee el código..." : "Ingrese el número...";
    feedbackClase = "text-slate-600";
  } else if (estado === "valido") {
    clase = "bg-emerald-100 text-emerald-800";
    icono = iconoModo;
    texto = `${tipoModo} · ✓ Válido`;
    feedbackTexto = "Autocompletado activado";
    feedbackClase = "text-emerald-700 font-medium";
  } else if (estado === "invalido") {
    clase = "bg-rose-100 text-rose-800";
    icono = iconoModo;
    texto = `${tipoModo} · ✗ Inválido`;
    feedbackTexto = "Formato no reconocido";
    feedbackClase = "text-rose-700 font-medium";
  }

  chip.className = `inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all ${clase}`;
  chip.innerHTML = `<span class="text-lg">${icono}</span><span>${texto}</span>`;

  if (feedback) {
    feedback.className = `text-xs min-h-5 ${feedbackClase}`;
    feedback.textContent = feedbackTexto;
  }

  if (input) {
    input.classList.remove("input-valid", "input-invalid");
    if (estado === "valido") input.classList.add("input-valid");
    else if (estado === "invalido") input.classList.add("input-invalid");
  }
}
