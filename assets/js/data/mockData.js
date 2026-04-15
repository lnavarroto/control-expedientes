export const ESTADOS_EXPEDIENTE = [
  "Ingresado",
  "Ubicado",
  "En paquete",
  "En transito",
  "Prestado",
  "Derivado",
  "Retornado",
  "Archivado"
];

export const UBICACIONES_PREDETERMINADAS = [
  "Estante",
  "Anaquel",
  "Archivo temporal",
  "Juzgado",
  "Mesa de partes",
  "Prestamo interno",
  "Otra area"
];

export const JUZGADOS = [
  "Juzgado Civil 01",
  "Juzgado Civil 02",
  "Juzgado Mixto 01",
  "Sala Civil"
];

export const MATERIAS = ["CI", "FC", "LA", "PE"];

export const PAQUETES_INICIALES = [
  { id: "PQT-A-00", codigo: "PQT A-00", descripcion: "Paquete inicial civil", fechaCreacion: "2026-04-12" },
  { id: "PQT-A-01", codigo: "PQT A-01", descripcion: "Paquete seguimiento", fechaCreacion: "2026-04-13" }
];

export const EXPEDIENTES_INICIALES = [
  {
    id: "EXP-1",
    numeroExpediente: "00012-2026-1-3101-CI-01",
    anio: "2026",
    incidente: "1",
    codigoCorte: "3101",
    materia: "CI",
    juzgado: "Juzgado Civil 01",
    fechaIngreso: "2026-04-14",
    horaIngreso: "08:35",
    observaciones: "Ingreso por mesa de partes",
    ubicacionActual: "Estante",
    paqueteId: "PQT-A-00",
    estado: "En paquete",
    textoRelacionado: "demanda civil de obligacion de dar suma"
  },
  {
    id: "EXP-2",
    numeroExpediente: "00452-2025-0-3101-FC-02",
    anio: "2025",
    incidente: "0",
    codigoCorte: "3101",
    materia: "FC",
    juzgado: "Juzgado Civil 02",
    fechaIngreso: "2026-04-14",
    horaIngreso: "09:50",
    observaciones: "Transferido desde juzgado",
    ubicacionActual: "Archivo temporal",
    paqueteId: "",
    estado: "Ubicado",
    textoRelacionado: "familia custodia provisional"
  },
  {
    id: "EXP-3",
    numeroExpediente: "01001-2024-2-3101-CI-01",
    anio: "2024",
    incidente: "2",
    codigoCorte: "3101",
    materia: "CI",
    juzgado: "Sala Civil",
    fechaIngreso: "2026-04-13",
    horaIngreso: "16:10",
    observaciones: "Pendiente de retiro",
    ubicacionActual: "Juzgado",
    paqueteId: "PQT-A-01",
    estado: "En transito",
    textoRelacionado: "apelacion civil daños y perjuicios"
  }
];

export const MOVIMIENTOS_INICIALES = [
  {
    id: "MOV-1",
    expedienteId: "EXP-1",
    numeroExpediente: "00012-2026-1-3101-CI-01",
    fecha: "2026-04-14",
    hora: "09:00",
    usuario: "OPERADOR",
    origen: "Mesa de partes",
    destino: "Estante",
    motivo: "Registro inicial",
    observacion: "Sin incidencias"
  },
  {
    id: "MOV-2",
    expedienteId: "EXP-3",
    numeroExpediente: "01001-2024-2-3101-CI-01",
    fecha: "2026-04-14",
    hora: "10:20",
    usuario: "OPERADOR",
    origen: "Archivo temporal",
    destino: "Juzgado",
    motivo: "Solicitud de despacho",
    observacion: "Entrega con cargo"
  }
];
