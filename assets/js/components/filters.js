export function renderSimpleFilters({
  searchId = "filtro-texto",
  searchPlaceholder = "Buscar...",
  selectId = "filtro-estado",
  selectOptions = [],
  selectLabel = "Todos"
}) {
  const optionsHtml = [`<option value="">${selectLabel}</option>`]
    .concat(selectOptions.map((item) => `<option value="${item}">${item}</option>`))
    .join("");

  return `
    <div class="card-surface p-4 grid md:grid-cols-3 gap-3">
      <div class="md:col-span-2">
        <label class="text-xs uppercase tracking-wide text-slate-500">Texto</label>
        <input id="${searchId}" class="input-base" placeholder="${searchPlaceholder}" />
      </div>
      <div>
        <label class="text-xs uppercase tracking-wide text-slate-500">Estado</label>
        <select id="${selectId}" class="select-base">${optionsHtml}</select>
      </div>
    </div>
  `;
}
