import { STATUS_BADGE_TONES } from "../core/uiTokens.js";

export function statusBadge(status = "Ingresado") {
  const classes = STATUS_BADGE_TONES[status] || "bg-slate-100 text-slate-700 ring-1 ring-slate-300/70";
  return `
    <span class="badge ${classes} gap-1.5 font-semibold">
      <span class="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      <span>${status}</span>
    </span>
  `;
}
