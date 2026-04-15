export function validarDniPeruano(dni) {
  return /^\d{8}$/.test((dni || "").trim());
}

export function validarNumeroExpediente(numero) {
  const normalized = (numero || "").trim().toUpperCase();
  // Nuevo formato: NUMERO-AÑO-INCIDENTE-CODIGOCORTE-JUZGADO-MATERIA-DETERMINADOR
  // Ejemplo: 00469-2021-0-3101-JR-CI-02
  return /^\d{5}-\d{4}-\d{1,3}-\d{4}-[A-Z]{2}-[A-Z]{2}-\d{2}$/.test(normalized);
}

export function validarIncidente(incidente) {
  const value = Number(incidente);
  return Number.isInteger(value) && value >= 0 && value <= 999;
}
