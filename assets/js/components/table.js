export function renderTable({ columns, rows, emptyText = "Sin registros disponibles" }) {
  const head = columns.map((column) => `<th class="px-4 py-3 text-left font-semibold uppercase">${column.label}</th>`).join("");

  const body = rows.length
    ? rows
        .map((row) => {
          const cells = columns
            .map((column) => `<td class="px-4 py-3 border-t border-slate-100 align-top text-slate-700">${row[column.key] ?? "-"}</td>`)
            .join("");
          return `<tr class="transition-colors">${cells}</tr>`;
        })
        .join("")
    : `
      <tr>
        <td colspan="${columns.length}" class="px-4 py-9 text-center text-slate-500">
          <div class="inline-flex flex-col items-center gap-2">
            <span class="text-xl">📭</span>
            <p class="font-medium">${emptyText}</p>
          </div>
        </td>
      </tr>
    `;

  return `
    <div class="card-surface table-shell overflow-hidden">
      <div class="overflow-x-auto overflow-y-auto max-h-[68vh]">
        <table class="w-full text-sm">
          <thead>${head}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
  `;
}
