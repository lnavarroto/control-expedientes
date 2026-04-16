function normalizar(valor = "") {
  return String(valor)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tieneIconoInicial(texto = "") {
  return /^[\u{1F300}-\u{1FAFF}\u2600-\u27BF✅❌✏️📋📦📱🖱️🔎🔍🔄➕➖⬅️➡️↔️👁️📥📤⚙️]/u.test(texto.trim());
}

function resolverIcono(btn, textoOriginal) {
  const texto = normalizar(textoOriginal);
  const id = normalizar(btn.id || "");
  const key = `${id} ${texto}`;

  if (/(cerrar|cancelar)/.test(key)) return "❌";
  if (/(guardar|registrar)/.test(key)) return "💾";
  if (/(limpiar)/.test(key)) return "🧹";
  if (/(buscar|filtrar)/.test(key)) return "🔎";
  if (/(editar)/.test(key)) return "✏️";
  if (/(nuevo|nueva|crear)/.test(key)) return "➕";
  if (/(activar|desactivar|actualizacion|sincron)/.test(key)) return "🔄";
  if (/(detalle|ver)/.test(key)) return "👁️";
  if (/(mover|movimiento)/.test(key)) return "🚚";
  if (/(salida)/.test(key)) return "📤";
  if (/(asignar)/.test(key)) return "📌";
  if (/(quitar)/.test(key)) return "➖";
  if (/(exportar)/.test(key)) return "📥";
  if (/(manual)/.test(key)) return "🖱️";
  if (/(lectora)/.test(key)) return "📱";
  if (/(anterior|prev)/.test(key)) return "⬅️";
  if (/(siguiente|next)/.test(key)) return "➡️";
  if (/(config)/.test(key)) return "⚙️";

  if (btn.classList.contains("btn-primary")) return "🔹";
  if (btn.classList.contains("btn-secondary")) return "🔸";
  return "🔹";
}

export function addIconsToButtons(root = document) {
  const buttons = root.querySelectorAll("button");

  buttons.forEach((btn) => {
    if (btn.dataset.iconized === "1") return;
    if (btn.dataset.noAutoIcon === "1") return;

    // No tocar botones con estructura compleja interna (cards custom, iconos SVG, etc.).
    if (btn.children.length > 0) return;

    const texto = (btn.textContent || "").trim();
    if (!texto) return;

    // No alterar botones que son solo simbolos de cierre/navegacion.
    if (/^[×✕✖<>«»?¿]$/.test(texto)) return;

    if (tieneIconoInicial(texto)) {
      btn.dataset.iconized = "1";
      return;
    }

    const icono = resolverIcono(btn, texto);
    btn.textContent = `${icono} ${texto}`;
    btn.dataset.iconized = "1";
  });
}
