const statusMap = {
  Ingresado: "bg-slate-100 text-slate-700",
  Ubicado: "bg-emerald-100 text-emerald-800",
  "En paquete": "bg-sky-100 text-sky-800",
  "En tránsito": "bg-amber-100 text-amber-800",
  "En transito": "bg-amber-100 text-amber-800",
  Prestado: "bg-orange-100 text-orange-800",
  Derivado: "bg-indigo-100 text-indigo-800",
  Retornado: "bg-teal-100 text-teal-800",
  Archivado: "bg-rose-100 text-rose-800"
};

export function statusBadge(status = "Ingresado") {
  const classes = statusMap[status] || "bg-slate-100 text-slate-700";
  return `<span class="badge ${classes}">${status}</span>`;
}
