const icons = {
  dashboard: "M3 12h18M3 6h18M3 18h18",
  registro: "M12 4v16m8-8H4",
  expedientes: "M9 12h6m-6 4h6M7 4h10l2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  busqueda: "M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z",
  ubicaciones: "M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  paquetes: "M3 7h18M6 7l1 13h10l1-13M9 7V5h6v2",
  movimientos: "M4 6h16M8 6v12m8-12v12M6 18h12",
  actualizacion: "M4 4v6h6M20 20v-6h-6M5.6 14A7 7 0 0 0 18 17.4M18.4 10A7 7 0 0 0 6 6.6",
  configuracion: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8-2v2H4v-2m16-6v2H4V7m16 8v2H4v-2m3-9h1.05A7 7 0 0 1 19 10v4H5v-4a7 7 0 0 1 6.95-6.95V2",
  chevronLeft: "M15 18l-6-6 6-6",
  chevronRight: "M9 18l6-6-6-6",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5m0 0-5-5m5 5H9"
};

export function icon(name, size = "w-5 h-5") {
  const path = icons[name] || icons.dashboard;
  return `<svg class="${size}" fill="none" stroke="currentColor" stroke-width="1.9" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="${path}" /></svg>`;
}
