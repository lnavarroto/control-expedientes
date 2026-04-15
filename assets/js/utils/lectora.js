
/**
 * Extraer SOLO los dígitos numéricos consecutivos (20-23 dígitos)
 * del inicio del string capturado
 */
export function extraerCodigoLectora(entrada = "") {
  const raw = String(entrada).trim();
  
  // Extraer SOLO dígitos del inicio
  const soloDigitos = raw.match(/^\d+/);
  if (!soloDigitos) return null;
  
  const codigo = soloDigitos[0];
  
  // Validar que sea 20 o 23 dígitos
  if (codigo.length === 20 || codigo.length === 23) {
    return codigo;
  }
  
  // Si tiene más de 23, tomar solo los primeros 23
  if (codigo.length > 23) {
    return codigo.substring(0, 23);
  }
  
  // Si tiene menos de 20, rechazar
  return null;
}

export function parsearLectora(codigo = "") {
  const raw = String(codigo).trim();

  // Intentar extraer código válido (20-23 dígitos)
  let codigoValido = extraerCodigoLectora(raw);
  if (!codigoValido) {
    return null;
  }

  try {
    // EXTRACCIÓN: Pos actúa en índexing de Excel (1-based), convertir a JS (0-based)
    
    // Número expediente: Pos 6-10 (Excel) = substring(5, 10) en JS
    const numero = codigoValido.substring(5, 10);
    
    // Año: Pos 2-5 (Excel) = substring(1, 5) en JS
    const anio = codigoValido.substring(1, 5);
    
    // Código corte: Fijo
    const codigoCorte = "3101";
    
    // Incidente: Fijo
    const incidente = "0";
    
    // Tipo Juzgado: Pos 15-16 (Excel) = substring(14, 16) en JS
    // Si "32" → "SP" (Sala Penal), sino → "JR" (Juzgado Primera Instancia)
    const tipoJuzgado = codigoValido.substring(14, 16) === "32" ? "SP" : "JR";
    
    // Materia: Se detecta por patrón en pos 14-16
    // Si contiene ciertos patrones: "334" o termina en "4" → "LA", sino → "CI"
    // Verificar pos 14-18 (substring 13-18)
    const sectoresDigitos = codigoValido.substring(13, 18);
    const materia = sectoresDigitos.includes("4") || codigoValido.substring(15, 16) === "4" ? "LA" : "CI";
    
    // Determinador: Últimos 2 dígitos
    const determinador = codigoValido.substring(codigoValido.length - 2);
    
    // Construir número de expediente en formato ESTÁNDAR (SIN tipo de juzgado)
    // Formato: NUMERO-AÑO-INCIDENTE-CODIGOCORTE-MATERIA-DETERMINADOR
    const numeroExpediente = `${numero}-${anio}-${incidente}-${codigoCorte}-${materia}-${determinador}`;

    return {
      numeroExpediente,           // Para validar: 00461-2024-0-3101-CI-02
      numero,
      anio,
      incidente,
      codigoCorte,
      materia,
      juzgadoTipo: tipoJuzgado,   // JR o SP (separado del número)
      numeroJuzgado: determinador, // Determinador para validar
      fuente: "lectora",
      codigoLecturaRaw: codigoValido  // El código de barras extraído
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
