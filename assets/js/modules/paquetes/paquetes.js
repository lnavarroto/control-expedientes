import {
  sugerirPaqueteParaExpediente,
  listarPaquetesArchivo,
  listarExpedientesPorPaquete,
  crearPaqueteArchivo,
  asignarExpedienteAPaquete
} from "../../services/paqueteService.js";

export { initPaquetesPage as initPaquetesModule } from "./paquetesPage.js";

function getUsuarioActivo() {
  try {
    const stored = localStorage.getItem("trabajador_validado");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export async function obtenerSugerenciaPaquete(codigoExpediente) {
  const resultado = await sugerirPaqueteParaExpediente(codigoExpediente);
  if (!resultado.success) throw new Error(resultado.error || "Error al obtener sugerencia de paquete");
  return resultado.data;
}

export async function ejecutarAsignacionExpediente(codigoExpediente) {
  const usuario = getUsuarioActivo();
  if (!usuario) throw new Error("No hay sesión activa");
  const asignado_por = `${usuario.dni} - ${usuario.nombres} ${usuario.apellidos}`;

  const data = await obtenerSugerenciaPaquete(codigoExpediente);
  const { sugerencia } = data;

  let id_paquete_archivo;

  if (sugerencia.debe_crear_paquete) {
    const resCrea = await crearPaqueteArchivo({
      anio: sugerencia.anio,
      id_materia: sugerencia.id_materia,
      id_paquete: sugerencia.id_paquete,
      grupo: sugerencia.grupo,
      color_especialista: sugerencia.color_especialista,
      descripcion: "",
      usuario_registra: asignado_por
    });
    if (!resCrea.success) throw new Error(resCrea.error || "Error al crear paquete archivo");
    id_paquete_archivo = resCrea.data.id_paquete_archivo;
  } else {
    id_paquete_archivo = sugerencia.paquete_archivo_existente.id_paquete_archivo;
  }

  const resAsig = await asignarExpedienteAPaquete({
    id_expediente: data.expediente.id_expediente,
    id_paquete_archivo,
    asignado_por
  });
  if (!resAsig.success) throw new Error(resAsig.error || "Error al asignar expediente al paquete");

  return resAsig;
}

export async function cargarListaPaquetesArchivo() {
  const resultado = await listarPaquetesArchivo();
  return resultado.data || [];
}

export async function cargarExpedientesDePaquete(idPaqueteArchivo) {
  const resultado = await listarExpedientesPorPaquete(idPaqueteArchivo);
  return resultado.data || [];
}
