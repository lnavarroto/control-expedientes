const locale = "es-PE";

export function formatoFecha(fechaIso) {
  if (!fechaIso) return "-";
  return new Intl.DateTimeFormat(locale).format(new Date(`${fechaIso}T00:00:00`));
}

export function formatoFechaHora(fechaIso, hora) {
  if (!fechaIso) return "-";
  return `${formatoFecha(fechaIso)} ${hora || ""}`.trim();
}

export function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}

export function horaActual() {
  return new Date().toTimeString().slice(0, 5);
}
