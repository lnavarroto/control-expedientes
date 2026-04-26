// Vista principal de Paquetes para Archivo General
import { initArchivoGeneralPage } from '../archivo-general/ArchivoGeneralPage.js';

export async function renderPaquetesGeneralView({ mountNode }) {
  await initArchivoGeneralPage({ mountNode, embeddedInPaquetesGeneral: true });
}
