const locale = "es-PE";

export function formatoFecha(fechaIso) {
  if (!fechaIso) return "-";
  const texto = String(fechaIso).trim();
  const match = texto.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return texto;
  const [, anio, mes, dia] = match;
  return `${dia}/${mes}/${anio}`;
}

export function formatoFechaHora(fechaIso, hora) {
  if (!fechaIso) return "-";
  const horaFormateada = hora ? (hora.length === 5 ? `${hora}:00` : hora) : "";
  return `${formatoFecha(fechaIso)} ${horaFormateada}`.trim();
}

export function hoyIso() {
  const now = new Date();
  const anio = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const dia = String(now.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function horaActual() {
  const now = new Date();
  const horas = String(now.getHours()).padStart(2, '0');
  const minutos = String(now.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}