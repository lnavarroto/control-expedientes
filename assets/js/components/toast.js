export function showToast(message, type = "success") {
  const root = document.getElementById("toast-root");
  if (!root) return;

  const colors = {
    success: "bg-emerald-600",
    warning: "bg-amber-600",
    error: "bg-rose-600",
    info: "bg-slate-700"
  };

  const item = document.createElement("div");
  item.className = `toast-enter text-white text-sm px-4 py-3 rounded-lg shadow-lg ${colors[type] || colors.info}`;
  item.textContent = message;

  root.appendChild(item);
  setTimeout(() => {
    item.remove();
  }, 3200);
}
