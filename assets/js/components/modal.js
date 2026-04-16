import { addIconsToButtons } from "../utils/buttonIcons.js";

export function openModal({ title, content, onConfirm, onCancel, confirmText = "Guardar", cancelText = "Cancelar" }) {
  const root = document.getElementById("modal-root");
  if (!root) return;

  const modalId = "modal-" + Date.now();
  root.innerHTML = `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn" id="${modalId}">
      <div class="card-surface w-full max-w-md p-6 animate-slideUp space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="font-bold text-lg text-slate-900">${title}</h3>
          <button id="modal-close" class="text-slate-500 hover:text-slate-700 text-2xl leading-none transition-colors">&times;</button>
        </div>
        <div class="text-slate-700">${content}</div>
        <div class="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button id="modal-cancel" class="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors text-slate-700 font-medium">${cancelText}</button>
          <button id="modal-confirm" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">${confirmText}</button>
        </div>
      </div>
    </div>

    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
      .animate-slideUp { animation: slideUp 0.3s ease-out; }
    </style>
  `;

  const modal = document.getElementById(modalId);
  addIconsToButtons(modal);

  const close = () => {
    modal?.remove();
  };

  document.getElementById("modal-close")?.addEventListener("click", () => {
    if (typeof onCancel === "function") {
      onCancel(close);
    } else {
      close();
    }
  });

  document.getElementById("modal-cancel")?.addEventListener("click", () => {
    if (typeof onCancel === "function") {
      onCancel(close);
    } else {
      close();
    }
  });

  document.getElementById("modal-confirm")?.addEventListener("click", () => {
    if (typeof onConfirm === "function") {
      onConfirm(close);
    } else {
      close();
    }
  });

  // Cerrar con Escape
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      if (typeof onCancel === "function") {
        onCancel(close);
      } else {
        close();
      }
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
}
