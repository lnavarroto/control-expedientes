/**
 * loader.js — Componente Loader para Sistema de Gestión de Expedientes
 * Versión 2.0
 *
 * API pública:
 *   Loader.show(options)   → muestra el loader, devuelve instancia
 *   Loader.hide(id)        → oculta un loader por id
 *   Loader.hideAll()       → oculta todos los loaders activos
 *   Loader.progress(id, porcentaje, etapaActual) → actualiza progreso
 *
 * Variantes disponibles:
 *   'expediente'   — icono de carpeta flotante (default)
 *   'verificacion' — spinner circular con icono de check
 *   'minimal'      — tres puntos pulsantes
 *   'barra'        — barra de progreso animada
 *   'skeleton'     — bloques de contenido simulado
 *   'etapas'       — lista de pasos con estado
 */

/* ─────────────────────────────────────────────────────────────────────────────
   ESTILOS GLOBALES
───────────────────────────────────────────────────────────────────────────── */

export function injectLoaderStyles() {
  if (document.getElementById("loader-styles-v2")) return;

  const style = document.createElement("style");
  style.id = "loader-styles-v2";
  style.textContent = `
    /* ── Overlay y contenedor base ── */
    .ld-overlay {
      position: fixed; inset: 0; z-index: 9990;
      background: rgba(15, 23, 42, 0.35);
      backdrop-filter: blur(2px);
      display: flex; align-items: center; justify-content: center;
      animation: ldFadeIn 0.2s ease;
    }
    .ld-overlay.ld-inline {
      position: absolute; background: rgba(255,255,255,0.75);
      backdrop-filter: blur(4px);
    }
    .ld-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 28px 32px;
      min-width: 240px;
      max-width: 340px;
      width: 100%;
      display: flex; flex-direction: column;
      align-items: center; gap: 16px;
      box-shadow: 0 8px 32px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06);
      animation: ldSlideUp 0.25s cubic-bezier(.22,1,.36,1);
    }
    @keyframes ldFadeIn  { from { opacity:0 } to { opacity:1 } }
    @keyframes ldSlideUp { from { opacity:0; transform:translateY(12px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }

    /* ── Texto y mensaje ── */
    .ld-msg {
      font-size: 13px; font-weight: 500;
      color: #475569; text-align: center; line-height: 1.5;
      min-height: 18px; transition: opacity .25s;
    }
    .ld-submsg {
      font-size: 11px; color: #94a3b8;
      text-align: center; margin-top: -8px;
    }

    /* ── Barra de progreso con porcentaje ── */
    .ld-progress-wrap { width: 100%; }
    .ld-progress-header {
      display: flex; justify-content: space-between;
      font-size: 11px; color: #94a3b8; margin-bottom: 6px;
    }
    .ld-progress-track {
      width: 100%; height: 5px;
      background: #f1f5f9; border-radius: 99px; overflow: hidden;
    }
    .ld-progress-fill {
      height: 100%; border-radius: 99px;
      background: linear-gradient(90deg, #2563eb, #6366f1, #7c3aed);
      transition: width 0.4s cubic-bezier(.22,1,.36,1);
    }
    .ld-progress-fill.indeterminate {
      width: 40% !important;
      animation: ldProgressSlide 1.8s ease-in-out infinite;
    }
    @keyframes ldProgressSlide {
      0%   { transform: translateX(-200%) }
      100% { transform: translateX(350%) }
    }

    /* ══════════════════════════════════════
       VARIANTE: expediente (carpeta)
    ══════════════════════════════════════ */
    .ld-folder-wrap { position: relative; width: 70px; height: 58px; }
    .ld-folder-body {
      width: 66px; height: 48px;
      background: #dbeafe; border: 1.5px solid #93c5fd;
      border-radius: 3px 7px 7px 7px;
      position: absolute; bottom: 0; left: 0;
    }
    .ld-folder-tab {
      width: 26px; height: 11px;
      background: #93c5fd; border-radius: 3px 3px 0 0;
      position: absolute; top: 0; left: 0;
    }
    .ld-folder-page {
      position: absolute;
      width: 40px; height: 32px;
      background: #fff; border: 1px solid #bfdbfe;
      border-radius: 3px;
      top: 8px; left: 13px;
      animation: ldPageFloat 2.2s ease-in-out infinite;
    }
    .ld-folder-page::before,
    .ld-folder-page::after {
      content: ''; position: absolute;
      left: 6px; right: 6px; height: 2px;
      background: #bfdbfe; border-radius: 1px;
    }
    .ld-folder-page::before { top: 8px; }
    .ld-folder-page::after  { top: 15px; right: 14px; }
    @keyframes ldPageFloat {
      0%, 100% { transform: translateY(0); opacity: 1; }
      50%       { transform: translateY(-11px); opacity: 0.6; }
    }

    /* ══════════════════════════════════════
       VARIANTE: verificacion (spinner)
    ══════════════════════════════════════ */
    .ld-spinner-wrap { position: relative; width: 56px; height: 56px; }
    .ld-spinner-ring {
      width: 56px; height: 56px; border-radius: 50%;
      border: 3px solid #e0e7ff; border-top-color: #6366f1;
      animation: ldSpin 0.9s linear infinite;
    }
    .ld-spinner-inner {
      position: absolute; inset: 9px;
      border-radius: 50%; background: #eef2ff;
      display: flex; align-items: center; justify-content: center;
    }
    .ld-spinner-icon { width: 20px; height: 20px; color: #6366f1; }
    @keyframes ldSpin { to { transform: rotate(360deg); } }

    /* ══════════════════════════════════════
       VARIANTE: minimal (tres puntos)
    ══════════════════════════════════════ */
    .ld-dots { display: flex; gap: 8px; align-items: center; }
    .ld-dot {
      width: 10px; height: 10px; border-radius: 50%;
      animation: ldDotPulse 1.4s ease-in-out infinite;
    }
    .ld-dot:nth-child(1) { background: #2563eb; }
    .ld-dot:nth-child(2) { background: #6366f1; animation-delay: 0.18s; }
    .ld-dot:nth-child(3) { background: #7c3aed; animation-delay: 0.36s; }
    @keyframes ldDotPulse {
      0%, 80%, 100% { transform: scale(0.55); opacity: 0.35; }
      40%           { transform: scale(1);    opacity: 1; }
    }

    /* ══════════════════════════════════════
       VARIANTE: skeleton
    ══════════════════════════════════════ */
    .ld-skeleton-wrap { width: 100%; display: flex; flex-direction: column; gap: 8px; }
    .ld-skel-header { display: flex; gap: 10px; align-items: center; margin-bottom: 4px; }
    .ld-skel-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: #e2e8f0; flex-shrink: 0;
      animation: ldShimmer 1.5s ease-in-out infinite;
    }
    .ld-skel-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .ld-skel-line {
      height: 10px; border-radius: 4px;
      background: #e2e8f0;
      animation: ldShimmer 1.5s ease-in-out infinite;
    }
    .ld-skel-block {
      height: 10px; border-radius: 4px;
      background: #e2e8f0;
      animation: ldShimmer 1.5s ease-in-out infinite;
    }
    .ld-skel-line:nth-child(2),
    .ld-skel-block:nth-child(2) { animation-delay: 0.15s; }
    .ld-skel-block:nth-child(3) { animation-delay: 0.3s; }
    .ld-skel-block:nth-child(4) { animation-delay: 0.45s; }
    @keyframes ldShimmer {
      0%, 100% { opacity: 0.45; }
      50%       { opacity: 1; }
    }

    /* ══════════════════════════════════════
       VARIANTE: etapas (steps)
    ══════════════════════════════════════ */
    .ld-stages { width: 100%; display: flex; flex-direction: column; gap: 9px; }
    .ld-stage-row { display: flex; align-items: center; gap: 10px; }
    .ld-stage-dot {
      width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
      transition: background .3s;
    }
    .ld-stage-dot.done   { background: #16a34a; }
    .ld-stage-dot.active {
      background: #2563eb;
      animation: ldStagePulse 1s ease-in-out infinite;
    }
    .ld-stage-dot.wait   {
      background: #f1f5f9;
      border: 1.5px solid #cbd5e1;
    }
    .ld-stage-label { font-size: 12px; color: #94a3b8; transition: color .3s; }
    .ld-stage-label.done   { color: #16a34a; }
    .ld-stage-label.active { color: #1e293b; font-weight: 500; }
    @keyframes ldStagePulse {
      0%, 100% { transform: scale(1); }
      50%       { transform: scale(1.4); }
    }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────────────────────────────────────
   BUILDERS DE HTML POR VARIANTE
───────────────────────────────────────────────────────────────────────────── */

function buildFolderHTML() {
  return `
    <div class="ld-folder-wrap">
      <div class="ld-folder-body"></div>
      <div class="ld-folder-tab"></div>
      <div class="ld-folder-page"></div>
    </div>`;
}

function buildVerificacionHTML() {
  return `
    <div class="ld-spinner-wrap">
      <div class="ld-spinner-ring"></div>
      <div class="ld-spinner-inner">
        <svg class="ld-spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>
        </svg>
      </div>
    </div>`;
}

function buildMinimalHTML() {
  return `<div class="ld-dots"><div class="ld-dot"></div><div class="ld-dot"></div><div class="ld-dot"></div></div>`;
}

function buildSkeletonHTML() {
  return `
    <div class="ld-skeleton-wrap">
      <div class="ld-skel-header">
        <div class="ld-skel-avatar"></div>
        <div class="ld-skel-lines">
          <div class="ld-skel-line" style="width:70%"></div>
          <div class="ld-skel-line" style="width:45%"></div>
        </div>
      </div>
      <div class="ld-skel-block" style="width:100%;height:10px"></div>
      <div class="ld-skel-block" style="width:85%;height:10px"></div>
      <div class="ld-skel-block" style="width:60%;height:10px"></div>
    </div>`;
}

function buildEtapasHTML(etapas, etapaActual = 0) {
  return `
    <div class="ld-stages">
      ${etapas.map((label, i) => {
        const cls = i < etapaActual ? 'done' : i === etapaActual ? 'active' : 'wait';
        return `<div class="ld-stage-row">
          <div class="ld-stage-dot ${cls}"></div>
          <span class="ld-stage-label ${cls}">${label}</span>
        </div>`;
      }).join('')}
    </div>`;
}

function buildProgressHTML(porcentaje, etiqueta = '') {
  const indeterminate = porcentaje === null || porcentaje === undefined;
  return `
    <div class="ld-progress-wrap">
      ${!indeterminate ? `
        <div class="ld-progress-header">
          <span>${etiqueta}</span>
          <span>${Math.round(porcentaje)}%</span>
        </div>` : ''}
      <div class="ld-progress-track">
        <div class="ld-progress-fill ${indeterminate ? 'indeterminate' : ''}"
          style="width:${indeterminate ? '40' : Math.min(100, Math.max(0, porcentaje))}%"></div>
      </div>
    </div>`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MENSAJES ROTATIVOS POR VARIANTE
───────────────────────────────────────────────────────────────────────────── */

const MENSAJES_DEFAULT = {
  expediente:   ["Cargando expediente...", "Buscando registros...", "Preparando vista...", "Casi listo..."],
  verificacion: ["Verificando datos...", "Validando acceso...", "Comprobando permisos...", "Autenticando..."],
  minimal:      ["Procesando...", "Un momento...", "Cargando..."],
  barra:        ["Guardando cambios...", "Aplicando ajustes...", "Actualizando..."],
  skeleton:     ["Cargando contenido..."],
  etapas:       [],
};

/* ─────────────────────────────────────────────────────────────────────────────
   CLASE PRINCIPAL Loader
───────────────────────────────────────────────────────────────────────────── */

class LoaderManager {
  constructor() {
    this._activos = new Map(); // id → { el, intervalId }
    this._idCounter = 0;
    injectLoaderStyles();
  }

  /**
   * Muestra un loader.
   *
   * @param {Object} opts
   * @param {string}   opts.variante       'expediente' | 'verificacion' | 'minimal' | 'barra' | 'skeleton' | 'etapas'
   * @param {string}   opts.mensaje        Texto principal (o primer mensaje)
   * @param {string[]} opts.mensajes       Array de mensajes rotativos
   * @param {string}   opts.submensaje     Texto secundario fijo bajo el mensaje
   * @param {boolean}  opts.overlay        true = cubre toda la pantalla (default: true)
   * @param {Element}  opts.contenedor     Elemento al que anclar el loader (implica overlay inline)
   * @param {number}   opts.porcentaje     0-100 para barra determinada; null = indeterminada
   * @param {string[]} opts.etapas         Lista de etapas (variante 'etapas')
   * @param {number}   opts.etapaActual    Índice de etapa activa (default: 0)
   * @param {string}   opts.etiquetaBarra  Etiqueta junto al % (variante 'barra')
   * @returns {string} id del loader para control posterior
   */
  show(opts = {}) {
    const {
      variante    = 'expediente',
      mensaje     = null,
      mensajes    = null,
      submensaje  = null,
      overlay     = true,
      contenedor  = null,
      porcentaje  = null,
      etapas      = ['Iniciando', 'Procesando', 'Completando'],
      etapaActual = 0,
      etiquetaBarra = '',
    } = opts;

    const id = `ld-${++this._idCounter}`;
    const listaMensajes = mensajes || (mensaje ? [mensaje] : MENSAJES_DEFAULT[variante] || ['Cargando...']);
    let msgIdx = 0;

    // ── Construir icono/animación según variante ──
    let iconoHTML = '';
    switch (variante) {
      case 'verificacion': iconoHTML = buildVerificacionHTML(); break;
      case 'minimal':      iconoHTML = buildMinimalHTML();      break;
      case 'skeleton':     iconoHTML = buildSkeletonHTML();     break;
      case 'etapas':       iconoHTML = buildEtapasHTML(etapas, etapaActual); break;
      default:             iconoHTML = buildFolderHTML();
    }

    // ── Barra de progreso (todas las variantes pueden tenerla) ──
    const progressHTML = (variante !== 'skeleton' && variante !== 'minimal')
      ? buildProgressHTML(porcentaje, etiquetaBarra)
      : '';

    // ── Mensaje visible ──
    const msgHTML = (variante !== 'etapas')
      ? `<div class="ld-msg" id="${id}-msg">${listaMensajes[0]}</div>`
      : '';
    const subHTML = submensaje
      ? `<div class="ld-submsg">${submensaje}</div>`
      : '';

    // ── Ensamblar caja ──
    const boxHTML = `
      <div class="ld-box" id="${id}-box">
        ${iconoHTML}
        ${msgHTML}
        ${subHTML}
        ${progressHTML}
      </div>`;

    // ── Crear overlay o contenedor inline ──
    const wrap = document.createElement('div');
    wrap.id = id;
    wrap.className = 'ld-overlay' + (contenedor ? ' ld-inline' : '');
    wrap.innerHTML = boxHTML;

    if (contenedor) {
      const pos = getComputedStyle(contenedor).position;
      if (pos === 'static') contenedor.style.position = 'relative';
      contenedor.appendChild(wrap);
    } else {
      document.body.appendChild(wrap);
    }

    // ── Rotación de mensajes ──
    let intervalId = null;
    if (listaMensajes.length > 1) {
      intervalId = setInterval(() => {
        msgIdx = (msgIdx + 1) % listaMensajes.length;
        const el = document.getElementById(`${id}-msg`);
        if (!el) return;
        el.style.opacity = '0';
        setTimeout(() => {
          el.textContent = listaMensajes[msgIdx];
          el.style.opacity = '1';
        }, 200);
      }, 2200);
    }

    this._activos.set(id, { wrap, intervalId, contenedor });
    return id;
  }

  /**
   * Actualiza el progreso y/o la etapa activa de un loader existente.
   *
   * @param {string} id
   * @param {number} porcentaje   0-100
   * @param {number} etapaActual  Índice de etapa (solo variante 'etapas')
   */
  progress(id, porcentaje, etapaActual) {
    const estado = this._activos.get(id);
    if (!estado) return;

    // Actualizar barra
    const fill = document.querySelector(`#${id}-box .ld-progress-fill`);
    if (fill && porcentaje !== undefined) {
      fill.classList.remove('indeterminate');
      fill.style.width = `${Math.min(100, Math.max(0, porcentaje))}%`;
      const pct = fill.closest('.ld-progress-wrap')?.querySelector('.ld-progress-header span:last-child');
      if (pct) pct.textContent = `${Math.round(porcentaje)}%`;
    }

    // Actualizar etapas
    if (etapaActual !== undefined) {
      const stages = document.querySelectorAll(`#${id}-box .ld-stages .ld-stage-row`);
      stages.forEach((row, i) => {
        const dot   = row.querySelector('.ld-stage-dot');
        const label = row.querySelector('.ld-stage-label');
        const cls = i < etapaActual ? 'done' : i === etapaActual ? 'active' : 'wait';
        dot.className   = `ld-stage-dot ${cls}`;
        label.className = `ld-stage-label ${cls}`;
      });
    }
  }

  /**
   * Oculta y elimina un loader por id.
   * @param {string} id
   */
  hide(id) {
    const estado = this._activos.get(id);
    if (!estado) return;
    clearInterval(estado.intervalId);
    const el = document.getElementById(id);
    if (el) {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.2s';
      setTimeout(() => el.remove(), 220);
    }
    this._activos.delete(id);
  }

  /** Oculta todos los loaders activos. */
  hideAll() {
    for (const id of this._activos.keys()) this.hide(id);
  }
}

export const Loader = new LoaderManager();

/* ─────────────────────────────────────────────────────────────────────────────
   FUNCIÓN LEGACY (compatibilidad con versión anterior)
   Devuelve HTML como string estático — sin funciones de control.
───────────────────────────────────────────────────────────────────────────── */

export const loaderHTML = (mensaje = "Cargando...") => `
  <div class="flex items-center justify-center min-h-[300px] p-8">
    <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:28px 32px;
                background:#fff;border-radius:14px;border:1px solid #e2e8f0;max-width:320px;width:100%;
                box-shadow:0 8px 32px rgba(15,23,42,.10)">
      <div class="ld-folder-wrap">
        <div class="ld-folder-body"></div>
        <div class="ld-folder-tab"></div>
        <div class="ld-folder-page"></div>
      </div>
      <p class="ld-msg">${mensaje}</p>
      <div class="ld-progress-track" style="width:100%">
        <div class="ld-progress-fill indeterminate"></div>
      </div>
    </div>
  </div>`;