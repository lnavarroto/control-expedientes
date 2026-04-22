import { addIconsToButtons } from "../utils/buttonIcons.js";
 
export function openModal({ title, content, onConfirm, onCancel, confirmText = "Guardar", cancelText = "Cancelar", panelClass = "", panelWidthClass = "max-w-xl", bodyClass = "", bodyScrollable = true, inlineMountId = "" }) {
  const isInline = Boolean(String(inlineMountId || "").trim());
  const root = isInline
    ? document.getElementById(String(inlineMountId || "").trim())
    : document.getElementById("modal-root");
  if (!root) return;
 
  const showCancel = typeof cancelText === "string" ? cancelText.trim().length > 0 : Boolean(cancelText);
  const showConfirm = typeof confirmText === "string" ? confirmText.trim().length > 0 : Boolean(confirmText);
 
  const modalId = "modal-" + Date.now();
  const titleId = "modal-title-" + Date.now();
  if (isInline) {
    root.innerHTML = `
      <div class="inline-modal-shell h-full" id="${modalId}">
        <div class="modal-panel card-surface w-full max-w-none h-full max-h-none p-4 md:p-5 flex flex-col overflow-hidden shadow-sm ${panelClass}">
          <div class="flex justify-between items-center gap-4 mb-4 flex-shrink-0">
            <h3 id="${titleId}" class="font-bold text-lg text-slate-900">${title}</h3>
            <button id="modal-close" type="button" aria-label="Cerrar panel" class="text-slate-400 hover:text-slate-700 text-2xl leading-none transition-colors">&times;</button>
          </div>
          <div class="flex-1 min-h-0 text-slate-700 ${bodyScrollable ? "overflow-y-auto" : "overflow-hidden"} ${bodyClass}">${content}</div>
          <div class="flex justify-end gap-3 pt-3 mt-3 border-t border-slate-200 flex-shrink-0">
            ${showCancel ? `<button id="modal-cancel" type="button" class="btn btn-secondary">${cancelText}</button>` : ""}
            ${showConfirm ? `<button id="modal-confirm" type="button" class="btn btn-primary">${confirmText}</button>` : ""}
          </div>
        </div>
      </div>
    `;
  } else {
  root.innerHTML = `
    <div class="modal-overlay fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 md:p-4" id="${modalId}" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
      <div class="modal-panel card-surface w-full ${panelWidthClass} p-4 md:p-5 max-h-[88vh] flex flex-col overflow-hidden shadow-2xl ${panelClass}">
        <div class="flex justify-between items-center gap-4 mb-4 flex-shrink-0">
          <h3 id="${titleId}" class="font-bold text-lg text-slate-900">${title}</h3>
          <button id="modal-close" type="button" aria-label="Cerrar modal" class="text-slate-400 hover:text-slate-700 text-2xl leading-none transition-colors">&times;</button>
        </div>
        <div class="flex-1 min-h-0 text-slate-700 ${bodyScrollable ? "overflow-y-auto" : "overflow-hidden"} ${bodyClass}">${content}</div>
        <div class="flex justify-end gap-3 pt-3 mt-3 border-t border-slate-200 flex-shrink-0">
          ${showCancel ? `<button id="modal-cancel" type="button" class="btn btn-secondary">${cancelText}</button>` : ""}
          ${showConfirm ? `<button id="modal-confirm" type="button" class="btn btn-primary">${confirmText}</button>` : ""}
        </div>
      </div>
    </div>
  `;
  }
 
  const modal = document.getElementById(modalId);
  addIconsToButtons(modal);
  if (!isInline) {
    document.body.classList.add("modal-open");
  }
 
  const cleanup = () => {
    if (!isInline) {
      document.removeEventListener("keydown", handleEscape);
      document.body.classList.remove("modal-open");
    }
  };
 
  const close = () => {
    cleanup();
    if (isInline) {
      root.innerHTML = "";
    } else {
      modal?.remove();
    }
  };
 
  const runCancel = () => {
    if (typeof onCancel === "function") { onCancel(close); return; }
    close();
  };
 
  const runConfirm = () => {
    if (typeof onConfirm === "function") { onConfirm(close); return; }
    close();
  };
 
  modal?.querySelector("#modal-close")?.addEventListener("click", () => runCancel());
  if (showCancel) modal?.querySelector("#modal-cancel")?.addEventListener("click", () => runCancel());
  if (showConfirm) modal?.querySelector("#modal-confirm")?.addEventListener("click", () => runConfirm());
 
  const handleEscape = (e) => { if (e.key === "Escape") runCancel(); };
  if (!isInline) {
    modal?.addEventListener("click", (event) => { if (event.target === modal) runCancel(); });
    document.addEventListener("keydown", handleEscape);
  }
}
 