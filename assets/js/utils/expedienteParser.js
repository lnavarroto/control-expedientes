import { JUZGADOS } from "../data/mockData.js";

const MATERIA_MAP = {
  CI: "Civil",
  FC: "Familia Civil",
  LA: "Laboral",
  PE: "Penal"
};

export function parseNumeroExpediente(numeroExpediente = "") {
  const clean = numeroExpediente.trim().toUpperCase();
  const parts = clean.split("-");

  if (parts.length !== 6) {
    return null;
  }

  const [numero, anio, incidente, codigoCorte, materia, codigoJuzgado] = parts;

  return {
    numero,
    anio,
    incidente,
    codigoCorte,
    materia,
    codigoJuzgado,
    juzgadoSugerido: sugerirJuzgado(codigoJuzgado),
    materiaDescripcion: MATERIA_MAP[materia] || "Materia no identificada"
  };
}

function sugerirJuzgado(codigoJuzgado) {
  if (codigoJuzgado === "01") return JUZGADOS[0];
  if (codigoJuzgado === "02") return JUZGADOS[1];
  return JUZGADOS[2];
}
