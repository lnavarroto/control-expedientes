
/**
 * Extraer dígitos numéricos consecutivos (20-23 dígitos)
 * Ahora es más flexible para códigos editados manualmente
 */
export function extraerCodigoLectora(entrada = "") {
  const raw = String(entrada).trim();
  
  // Extraer SOLO dígitos del inicio
  const soloDigitos = raw.match(/^\d+/);
  if (!soloDigitos) return null;
  
  const codigo = soloDigitos[0];
  
  // ✅ VALIDACIÓN FLEXIBLE: Aceptar entre 20-23 dígitos
  if (codigo.length >= 20 && codigo.length <= 23) {
    return codigo;
  }
  
  // Si tiene más de 23, tomar solo los primeros 23
  if (codigo.length > 23) {
    console.warn(`⚠️ Código tiene ${codigo.length} dígitos, recortando a 23`);
    return codigo.substring(0, 23);
  }
  
  // Si tiene menos de 20, intentar es muy corto
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

    // Incidente/Cautelar:
    // Se toma el bloque de 3 dígitos ubicado antes de los últimos 3 del código.
    // Ejemplos: 000 => principal (incidente 0), 071 => incidente 71, 015 => incidente 15.
    const bloqueIncidente = codigoValido.substring(
      Math.max(0, codigoValido.length - 6),
      Math.max(0, codigoValido.length - 3)
    );
    const incidenteNumero = /^\d{3}$/.test(bloqueIncidente)
      ? parseInt(bloqueIncidente, 10)
      : 0;
    const incidente = incidenteNumero === 0 ? "0" : String(incidenteNumero);
    const tipoRegistro = incidenteNumero === 0 ? "PRINCIPAL" : "CAUTELAR";
    
    // Tipo Juzgado: Pos 15-16 (Excel) = substring(14, 16) en JS
    // ✅ Fórmula simple del usuario: SI(EXTRAE(A42;15;2)="32";"SP";"JR")
    // "32" → "SP" (Sala Penal)
    // Otros → "JR" (Juzgado Primera Instancia)
    const codigoJuzgado = codigoValido.substring(14, 16);
    const tipoJuzgado = codigoJuzgado === "32" ? "SP" : "JR";
    
    // Materia: Pos 17 (Excel) = substring(16, 17) en JS
    // ✅ Fórmula simple del usuario: SI(EXTRAE(A42;17;1)="4";"LA";"CI")
    // "4" → "LA" (Laboral)
    // Otros → "CI" (Civil)
    const codigoMateria = codigoValido.substring(16, 17);
    const materia = codigoMateria === "4" ? "LA" : "CI";
    
    // Determinador: Últimos 2 dígitos
    let determinador = codigoValido.substring(codigoValido.length - 2);
    
    // ✅ VALIDACIÓN: Si el determinador no es válido (01-09), usar "01"
    const determinadorNum = parseInt(determinador, 10);
    if (determinador.length !== 2 || !/^\d+$/.test(determinador) || determinadorNum < 1 || determinadorNum > 9) {
      console.warn(`⚠️ Determinador inválido: "${determinador}", usando "01" por defecto`);
      determinador = "01";
    }
    
    // Construir número de expediente en formato COMPLETO con tipo de juzgado
    // ✅ Formato correcto: NUMERO-AÑO-INCIDENTE-CODIGOCORTE-JUZGADO-MATERIA-DETERMINADOR
    // Ejemplo: 00808-2023-0-3101-JR-CI-02
    const numeroExpediente = `${numero}-${anio}-${incidente}-${codigoCorte}-${tipoJuzgado}-${materia}-${determinador}`;

    return {
      numeroExpediente,           // Para validar: 00808-2023-0-3101-JR-CI-02
      numero,
      anio,
      incidente,
      codigoCorte,
      tipoJuzgado,                // JR o SP
      materia,                    // LA o CI
      numeroJuzgado: determinador, // Determinador para validar
      bloqueIncidente,
      tipoRegistro,
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
