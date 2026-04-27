# Estructura y Relaciones - Control de Expedientes

Aplicacion SPA para gestion de expedientes judiciales. El frontend usa modulos ES, consume un Cloudflare Worker y este reenvia al backend en Google Apps Script sobre Google Sheets.

Ultima actualizacion: 26 de abril de 2026

---

## Arquitectura General

```text
pages/*.html -> assets/js/app.js -> assets/js/router.js -> modules/*
modules/* -> services/* -> utils/googleSheetsAPI.js -> cloudflare-worker.js -> backend/Code.gs -> Google Sheets
```

---

## Estructura del Repositorio

### Raiz

| Ruta | Proposito |
|---|---|
| index.html | Entrada principal (`data-page="login"`) |
| cloudflare-worker.js | Proxy HTTP/CORS hacia Apps Script |
| package.json | Scripts de build CSS |
| tailwind.config.js | Configuracion Tailwind |
| ESTRUCTURA_Y_RELACIONES.md | Este documento |
| INTERFAZ_Y_BOTONES.md | Documentacion UI |
| backend/ | Apps Script y documentos tecnicos |
| pages/ | Vistas HTML para montar la SPA |
| assets/ | Frontend SPA (css, js, icons) |
| js/, components/, data/ | Estructura legacy previa a SPA (se mantiene por compatibilidad) |

### pages/

Paginas HTML que montan la SPA mediante `assets/js/app.js`.

| Archivo | data-page | Estado |
|---|---|---|
| login.html | login | Activo |
| dashboard.html | dashboard | Activo |
| registro-expedientes.html | registro | Activo |
| expedientes.html | expedientes | Activo |
| ubicaciones.html | ubicaciones | Activo |
| movimientos.html | movimientos | Activo |
| configuracion.html | configuracion | Activo |
| paquetes.html | paquetes | Activo |
| lectora.html | registro | Activo (modo lectora dentro del modulo registro) |
| actualizacion.html | actualizacion | Legacy/en transicion |
| lista-expedientes.html | expedientes | Legacy/en transicion |
| nuevo-registro.html | registro | Legacy/en transicion |
| panel.html | dashboard | Legacy/en transicion |

Nota: `busqueda.html` no existe actualmente en `pages/`, aunque el modulo de busqueda permanece como parte del codigo.

### assets/css/

| Archivo | Proposito |
|---|---|
| tailwind.input.css | Fuente de entrada Tailwind |
| tailwind.generated.css | Salida compilada de Tailwind |
| main.css | Estilos de aplicacion |
| theme.css | Variables/tokens de tema |

### assets/js/

#### Entrada y routing

| Archivo | Proposito |
|---|---|
| app.js | Bootstrap de app, auth inicial y arranque de router |
| router.js | Mapeo de rutas SPA y render de layout/modulos |
| config.js | Configuracion frontend |

#### auth/

| Archivo | Proposito |
|---|---|
| authManager.js | Sesion, persistencia y estado de autenticacion |

#### components/

Componentes UI reutilizables (`layout`, `sidebar`, `header`, `modal`, `toast`, `table`, etc.).

#### core/

Constantes y utilidades transversales (`constants`, `helpers`, `storage`, `uiTokens`, `validators`).

#### services/

Servicios de acceso a datos del frontend:
- authService.js
- expedienteService.js
- paqueteService.js
- estadoService.js
- materiaService.js
- juzgadoService.js
- ubicacionService.js
- ubicacionConfigService.js
- parametroService.js
- perfilService.js
- excelService.js

#### utils/

Utilidades de formato, parser de lectora, parser de expediente, iconos de botones y acceso API (`googleSheetsAPI.js`).

#### modules/

| Modulo | Archivos clave |
|---|---|
| auth | login.js, loginPage.js |
| dashboard | dashboard.js, dashboardPage.js |
| expedientes | registroPage.js, listadoPageBackend.js, registroExpedienteBackend.js |
| ubicaciones | ubicaciones.js, ubicacionesPage.js |
| movimientos | movimientosPage.js |
| paquetes | paquetes.js, paquetesPage.js, AsignarUbicacionPaquete.js |
| paquetesGeneral | paquetesGeneralView.js |
| archivo-general | ArchivoGeneralPage.js, modales y servicio propios |
| configuracion | configuracionPage.js y submodulos (juzgados, materias, estados, etc.) |
| actualizacion | actualizacionPage.js |

### backend/

| Archivo | Proposito |
|---|---|
| Code.gs | API principal (doGet/doPost + reglas de negocio) |
| ARQUITECTURA.md | Documento tecnico de arquitectura |
| TESTING.js | Utilidades de pruebas backend |
| README.md | Guia de despliegue/configuracion |

---

## Rutas SPA Reales (router.js)

Rutas registradas actualmente:
- `dashboard`
- `registro`
- `expedientes`
- `ubicaciones`
- `paquetes`
- `paquetes-general`
- `paquetes-modular` (alias de paquetes)
- `movimientos`
- `movimientos-modular` (alias de movimientos)
- `actualizacion`
- `configuracion`
- `archivo-general` (alias de paquetes-general)

Observacion: el modulo de busqueda existe en codigo, pero hoy no figura como ruta activa en `ROUTES`.

---

## Relacion entre Capas

1. `pages/*.html` define `data-page`.
2. `assets/js/app.js` valida autenticacion e inicia router.
3. `assets/js/router.js` renderiza layout y ejecuta el modulo de `data-page`.
4. Cada modulo usa `components/*` para UI y `services/*` para datos.
5. `services/*` consume `utils/googleSheetsAPI.js`.
6. `googleSheetsAPI.js` llama al Cloudflare Worker.
7. Worker redirige al Apps Script (`backend/Code.gs`).
8. Apps Script lee/escribe hojas en Google Sheets.

---

## Modelo de Datos (Google Sheets)

Hojas declaradas en `backend/Code.gs`:
- usuarios
- materias
- juzgados
- estados
- estados_sistema_expediente
- paquetes
- expedientes
- seguimiento_expediente
- paquetes_archivo
- paquete_expediente
- color_especialista
- movimientos_expediente
- grupo_archivo_general
- grupo_archivo_general_detalle
- salida_archivo_general

### Relaciones principales

1. `expedientes.id_juzgado` -> `juzgados.id_juzgado`
2. `expedientes.id_materia`/`codigo_materia` -> `materias.id_materia` o `materias.codigo_materia`
3. `expedientes.id_estado` -> `estados.id_estado` o `estados_sistema_expediente.id_estado`
4. `expedientes.id_paquete` -> `paquetes_archivo.id_paquete_archivo` (flujo archivo modular/general)
5. `paquete_expediente.id_expediente` -> `expedientes.id_expediente`
6. `paquete_expediente.id_paquete_archivo` -> `paquetes_archivo.id_paquete_archivo`
7. `movimientos_expediente.id_expediente` -> `expedientes.id_expediente`
8. `grupo_archivo_general_detalle.id_grupo` -> `grupo_archivo_general.id_grupo`
9. `grupo_archivo_general_detalle.id_expediente` -> `expedientes.id_expediente`
10. `salida_archivo_general.id_grupo` -> `grupo_archivo_general.id_grupo`

### Flujos de relacion funcional

1. Asignacion a paquete:
`expedientes` <-> `paquete_expediente` <-> `paquetes_archivo` + registro en `movimientos_expediente`.

2. Archivo general:
`grupo_archivo_general` <-> `grupo_archivo_general_detalle` <-> `expedientes`.

3. Salidas y retornos:
`grupo_archivo_general` <-> `salida_archivo_general` (cambios de estado de grupo y trazabilidad).

---

## Estado de Legacy

Se mantienen por compatibilidad y referencia historica:
- `js/`, `components/`, `data/` en raiz.
- Varias paginas HTML antiguas en `pages/`.

El flujo operativo principal actual esta en `assets/js/*` (SPA modular).
