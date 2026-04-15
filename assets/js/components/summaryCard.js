export function renderSummaryCard({ title, value, subtitle, accent = "#0f3557" }) {
  return `
    <article class="card-surface p-4 border-l-4" style="border-left-color: ${accent};">
      <p class="text-sm text-slate-500">${title}</p>
      <p class="text-3xl font-bold mt-1" style="color:${accent}">${value}</p>
      <p class="text-xs text-slate-400 mt-2">${subtitle || "Actualizado en tiempo real"}</p>
    </article>
  `;
}
