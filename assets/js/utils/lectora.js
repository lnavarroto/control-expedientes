/**
 * Parsear código de lectora (20 o 23 dígitos) al formato estándar de expediente
 * Lectora: 22023007933101334000201 (23 dígitos)
 * Estándar: 00793-2023-0-3101-CI-01
 *
 * Extrae y mapea según la fórmula:
 * - Dígitos 2-5   (2023)   → año
 * - Dígitos 6-10  (00793)  → número de expediente
 * - Fijo         (0)       → incidente
 * - Fijo         (3101)    → código de corte
 * - Dígito 17     (4)      → especialidad (4=LA, 5=FC, resto=CI)
 * - Últimos 2     (01)     → número de juzgado
 */
export function parsearLectora(codigo = "") {
  const raw = String(codigo).trim();

  // Validar que sea un código lectora válido (20 o 23 dígitos)
  if (!/^\d{20}$/.test(raw) && !/^\d{23}$/.test(raw)) {
    return null;
  }

  try {
    // Extraer según posiciones
    const anio = raw.substring(1, 5);           // Dígitos 2-5
    const numero = raw.substring(5, 10);        // Dígitos 6-10
    const codigoCorte = "3101";                 // Fijo
    const incidente = "0";                      // Fijo
    const especialidad = raw.substring(16, 17); // Dígito 17 para materia
    const numeroJuzgado = raw.substring(raw.length - 2); // Últimos 2

    // Mapear especialidad a materia
    const materiaMap = {
      "4": "LA",
      "5": "FC"
    };
    const materia = materiaMap[especialidad] || "CI";

    // Construir número de expediente en formato CORRECTO: numero-anio-incidente-codigoCorte-materia-numeroJuzgado
    const numeroExpediente = `${numero}-${anio}-${incidente}-${codigoCorte}-${materia}-${numeroJuzgado}`;

    return {
      numeroExpediente,
      numero,
      anio,
      incidente,
      codigoCorte,
      materia,
      numeroJuzgado,
      fuente: "lectora"
    };
  } catch (error) {
    return null;
  }
}

/**
 * Detectar si un string es código lectora o formato estándar
 */
export function detectarFormatoExpediente(valor = "") {
  const raw = String(valor).trim();

  if (/^\d{20}$/.test(raw) || /^\d{23}$/.test(raw)) {
    return "lectora";
  }

  if (/^\d{5}-\d{4}-\d-\d{4}-(CI|LA|FC|PE)-\d{2}$/.test(raw)) {
    return "estandar";
  }

  return "desconocido";
}

/**
 * Procesar entrada de expediente (auto-detecta formato)
 */
export function procesarExpediente(valor = "") {
  const formato = detectarFormatoExpediente(valor);

  if (formato === "lectora") {
    return parsearLectora(valor);
  }

  if (formato === "estandar") {
    return {
      numeroExpediente: valor,
      fuente: "manual"
    };
  }

  return null;
}
