export function renderTable({ columns, rows, emptyText = "Sin registros disponibles" }) {
  const head = columns.map((column) => `<th class="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-500">${column.label}</th>`).join("");

  const body = rows.length
    ? rows
        .map((row) => {
          const cells = columns
            .map((column) => `<td class="px-4 py-3 border-t border-slate-100 align-top">${row[column.key] ?? "-"}</td>`)
            .join("");
          return `<tr class="hover:bg-slate-50">${cells}</tr>`;
        })
        .join("")
    : `<tr><td colspan="${columns.length}" class="px-4 py-6 text-center text-slate-400">${emptyText}</td></tr>`;

  return `
    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">${head}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
  `;
}
