# Estructura del Proyecto - Control de Expedientes

Aplicación SPA (Single Page Application) para gestión de expedientes judiciales del Archivo Civil Sullana. El frontend se comunica con el backend a través de un proxy Cloudflare Worker que intermedia con un Google Apps Script (Google Sheets como base de datos).

**Última actualización:** 26 de abril de 2026

---

## Raíz

| Archivo | Descripción |
|---|---|
| `index.html` | Redirige a `pages/login.html` |
| `cloudflare-worker.js` | Proxy CORS desplegado en Cloudflare Workers. Intercepta peticiones del frontend hacia el Apps Script backend |
| `tailwind.config.js` | Configuración de clases Tailwind personalizadas |
| `package.json` | Scripts de build (Tailwind CSS) |
| `CLAUDE.md` | Perfil de instrucciones para desarrollo |
| `ESTRUCTURA_Y_RELACIONES.md` | Este archivo. Estructura técnica del proyecto y relaciones entre entidades |
| `INTERFAZ_Y_BOTONES.md` | Descripción de la interfaz de usuario y botones por módulo |

---

## pages/
Páginas HTML del sistema. Todas son cáscaras que montan la SPA a través de `assets/js/app.js`. El atributo `data-page` en `<body>` determina qué módulo carga el router.

| Página | data-page | Módulo que carga |
|---|---|---|
| `login.html` | `login` | auth/loginPage |
| `dashboard.html` | `dashboard` | dashboard/dashboardPage |
| `registro-expedientes.html` | `registro` | expedientes/registroPage |
| `expedientes.html` | `expedientes` | expedientes/listadoPageBackend |
| `busqueda.html` | `busqueda` | busqueda/busquedaPage |
| `ubicaciones.html` | `ubicaciones` | ubicaciones/ubicacionesPage |
| `movimientos.html` | `movimientos` | movimientos/movimientosPage |
| `configuracion.html` | `configuracion` | configuracion/configuracionPage |
| `lectora.html` | `registro` | expedientes/registroPage (modo lectora) |
| `paquetes.html` | `paquetes` | paquetes/paquetesPage (Archivo Modular) |

> Las páginas legacy (`actualizacion.html`, `lista-expedientes.html`, `nuevo-registro.html`, `panel.html`) existen pero no se usan en el flujo SPA. El router redirige automáticamente a las páginas activas.

---

## assets/css/

| Archivo | Descripción |
|---|---|
| `tailwind.input.css` | Fuente de entrada para compilar Tailwind |
| `tailwind.generated.css` | CSS generado (no editar manualmente) |
| `main.css` | Estilos personalizados del sistema (nav-link, cards, sidebar, etc.) |
| `theme.css` | Tokens visuales y colores del tema |

---

## assets/js/

### Entrada y enrutamiento

| Archivo | Descripción |
|---|---|
| `app.js` | Punto de entrada. Verifica autenticación y lanza el router o la página de login |
| `router.js` | Enrutador SPA. Lee `document.body.dataset.page` y llama al módulo correspondiente. Exporta `navegarA(pagina)` para navegar entre vistas |
| `config.js` | URL base del backend (Cloudflare Worker) |

---

### auth/

| Archivo | Descripción |
|---|---|
| `authManager.js` | Gestiona la sesión activa. Guarda/recupera el trabajador autenticado en localStorage |

---

### components/
Componentes visuales reutilizables. Todos generan HTML como string (patrón render).

| Archivo | Descripción |
|---|---|
| `layout.js` | Renderiza la estructura completa de la app: sidebar + header + main. Llama a `initSidebarEvents()` |
| `sidebar.js` | Renderiza el menú lateral con categorías (Operaciones, Gestión, Sistema). Exporta `renderSidebar` e `initSidebarEvents` |
| `header.js` | Renderiza el encabezado con título de página y datos de sesión |
| `modal.js` | Sistema de modales genéricos reutilizables. Exporta `openModal({ title, content, confirmText, onConfirm })` |
| `toast.js` | Notificaciones emergentes. Exporta `showToast(mensaje, tipo)` |
| `expedienteForm.js` | Formularios de expediente. Exporta `renderExpedienteForm(expediente)` (modo manual) y `renderFormularioLectora(expediente)` (modo lectora/escáner) |
| `table.js` | Tabla HTML genérica. Recibe `{ columns, rows, emptyText }` |
| `statusBadge.js` | Badge visual de estado de expediente |
| `badge.js` | Badge genérico |
| `filters.js` | Componente de filtros para listados |
| `summaryCard.js` | Cards de resumen para el dashboard |
| `configDashboard.js` | Panel y menú de la sección Configuración |
| `icons.js` | Iconos SVG del sistema. Exporta `icon(nombre, clases)` |
| `numeroExpedienteChip.js` | Chip visual de estado del número de expediente en formularios |
| `header.html`, `modal.html`, `sidebar.html` | Templates HTML legacy (no usados en arquitectura actual) |

---

### core/
Utilidades y constantes globales.

| Archivo | Descripción |
|---|---|
| `constants.js` | Constantes del sistema |
| `helpers.js` | Funciones auxiliares genéricas |
| `storage.js` | Wrapper de localStorage |
| `validators.js` | Validadores de entrada de datos |

### modules/
Módulos principales de la aplicación, cada uno con su propia lógica de negocio.

#### auth/
| Archivo | Descripción |
|---|---|
| `login.js` | Página de login (no usada, legacy) |
| `loginPage.js` | Página de login actual |

#### dashboard/
| Archivo | Descripción |
|---|---|
| `dashboardPage.js` | Dashboard con estadísticas y filtros temporales |

#### expedientes/
| Archivo | Descripción |
|---|---|
| `registroPage.js` | Registro de expedientes (3 modos: manual, listado, lectora) |
| `listadoPageBackend.js` | Listado general de expedientes con filtros y paginación |

#### busqueda/
| Archivo | Descripción |
|---|---|
| `busquedaPage.js` | Búsqueda avanzada de expedientes |

#### ubicaciones/
| Archivo | Descripción |
|---|---|
| `ubicacionesPage.js` | Gestión de ubicaciones de archivo |

#### **archivo-general/** (NUEVO)
Módulo para gestión del Archivo General con grupos de expedientes, salidas y retornos.

| Archivo | Descripción |
|---|---|
| `ArchivoGeneralPage.js` | Página principal con 3 tabs: Grupos, Salidas, Expedientes sin Grupo |
| `archivoGeneralService.js` | Servicio API que comunica con el backend |
| `ModalCrearGrupo.js` | Modal para crear nuevos grupos de expedientes |
| `ModalAsignarExpedientes.js` | Modal para agregar expedientes a un grupo |
| `ModalVerDetalleGrupo.js` | Modal con detalle del grupo: expedientes, salidas, botones de acción |
| `ModalRegistrarSalida.js` | Modal para registrar salida de un grupo (movimiento externo) |
| `ModalRegistrarRetorno.js` | Modal para registrar retorno de una salida |
| `ModalAsignarGrupoAPaquete.js` | Modal para asignar grupo completo a paquete archivo |
| `README.md` | Documentación del módulo |

#### paquetes/ (Archivo Modular)
| Archivo | Descripción |
|---|---|
| `paquetesPage.js` | Gestión de paquetes del Archivo Modular |

#### paquetesGeneral/
| Archivo | Descripción |
|---|---|
| `paquetesGeneralView.js` | Vista embebida del Archivo General dentro de Paquetes (alias de archivo-general) |
| `components/` | Componentes auxiliares |
| `utils/` | Utilidades específicas |

#### movimientos/
| Archivo | Descripción |
|---|---|
| `movimientosPage.js` | Historial de movimientos de expedientes |

#### configuracion/
| Archivo | Descripción |
|---|---|
| `configuracionPage.js` | Panel de configuración del sistema con submodulos |

#### actualizacion/
| Archivo | Descripción |
|---|---|
| `actualizacionPage.js` | Sincronización y actualización de datos del backend |

### services/
Servicios que comunican con el backend (Google Apps Script vía Cloudflare Worker).

| Archivo | Descripción |
|---|---|
| `expedienteService.js` | CRUD y búsqueda de expedientes |
| `paqueteService.js` | Gestión de paquetes (Archivo Modular) |
| `estadoService.js` | Catálogo de estados de expediente |
| `materiaService.js` | Catálogo de materias judiciales |
| `juzgadoService.js` | Catálogo de juzgados y salas |
| `perfilService.js` | Gestión de usuarios/perfiles |
| `parametroService.js` | Parámetros del sistema |
| `ubicacionConfigService.js` | Configuración de ubicaciones |
| `ubicacionService.js` | Consulta de ubicaciones activas |
| `authService.js` | Autenticación contra el backend |

### utils/
Utilidades generales del frontend.

| Archivo | Descripción |
|---|---|
| `buttonIcons.js` | Inyección automática de iconos en botones |
| `expedienteParser.js` | Parseo y normalización de números de expediente |
| `formatters.js` | Formatos para fechas, números, etc. |
| `googleSheetsAPI.js` | Comunicación con Google Sheets API (si aplica) |
| `lectora.js` | Interfaz con lectora de códigos de barras |
| `lectora-test.js` | Testing de la lectora |
| `storage.js` | Storage de datos locales |
| `validators.js` | Validadores de entrada |
| `uiTokens.js` | Tokens de diseño: colores por tono (CARD_TONES, ALERT_TONES) |
| `validators.js` | Validaciones de datos (número de expediente, incidente, etc.) |

---

### data/

| Archivo | Descripción |
|---|---|
| `mockData.js` | Listas de constantes: ESTADOS_EXPEDIENTE, UBICACIONES_PREDETERMINADAS |

---

### services/
Capa de acceso a datos. Se comunican con el backend via `googleSheetsAPI.js` y mantienen caché local.

| Archivo | Entidad gestionada |
|---|---|
| `authService.js` | Autenticación de trabajadores |
| `expedienteService.js` | Expedientes (CRUD + búsqueda + backend sync) |
| `estadoService.js` | Estados de expediente |
| `juzgadoService.js` | Juzgados/Salas |
| `materiaService.js` | Materias judiciales |
| `paqueteService.js` | Paquetes de archivo modular |
| `ubicacionService.js` | Ubicaciones de expedientes |
| `ubicacionConfigService.js` | Configuración de ubicaciones |
| `excelService.js` | Exportación a Excel |
| `parametroService.js` | Parámetros del sistema |
| `perfilService.js` | Perfil del operador |

---

### utils/

| Archivo | Descripción |
|---|---|
| `lectora.js` | Parser principal de códigos de barras. Exporta `parsearLectora(codigo)` y `extraerCodigoLectora(raw)` |
| `lectora-test.js` | Pruebas unitarias del parser de lectora |
| `expedienteParser.js` | Parseo y construcción de números de expediente |
| `formatters.js` | Formateo de fechas, horas y textos. Exporta `hoyIso()`, `horaActual()`, `formatoFechaHora()` |
| `validators.js` | Validaciones específicas de expedientes |
| `googleSheetsAPI.js` | Cliente HTTP hacia el Cloudflare Worker/Apps Script |
| `storage.js` | Acceso a localStorage con manejo de errores |
| `buttonIcons.js` | Auto-asignación de iconos a botones por texto/clase |

---

### modules/
Cada subdirectorio es un módulo funcional completo.

#### actualizacion/
- `actualizacionPage.js` - Pantalla de sincronización/actualización de datos desde el backend

#### auth/
- `login.js`, `loginPage.js` - Formulario y lógica de inicio de sesión

#### busqueda/
- `busqueda.js`, `busquedaPage.js` - Búsqueda avanzada de expedientes con filtros

#### configuracion/
- `configuracionPage.js` - Panel principal de configuración con submodulos
- `juzgados.js` - CRUD de juzgados/salas
- `materias.js`, `materias-mejorado.js` - CRUD de materias judiciales
- `estados.js` - CRUD de estados de expediente
- `ubicaciones-config.js` - Configuración de ubicaciones
- `perfil.js` - Datos del operador
- `parametros.js` - Parámetros generales del sistema
- `actualizacion.js` - Sincronización desde configuración

#### dashboard/
- `dashboard.js`, `dashboardPage.js` - Vista principal con estadísticas e indicadores

#### expedientes/
- `registroPage.js` - Registro de expedientes (modo manual y modo lectora con escáner)
- `listadoPageBackend.js` - Listado de expedientes con datos del backend
- `registroExpedienteBackend.js` - Lógica de envío al backend
- `registroExpedienteBackendIntegracion.js` - Integración y confirmación de guardado
- `expediente-form.js` - Re-exporta `renderExpedienteForm` desde components
- `expediente-list.js` - Lógica de listado local
- `expediente-movimientos.js` - Movimientos asociados a expedientes
- `expedientesMapeo.js` - Mapeo de campos backend/frontend
- `listadoPage.js` - Versión legacy del listado (no activa)

#### movimientos/
- `movimientosPage.js` - Historial de movimientos de expedientes

#### paquetes/
- `paquetes.js`, `paquetesPage.js` - Gestión de paquetes para archivo modular

#### paquetesGeneral/
- `paquetesGeneralView.js` - Vista de paquetes para archivo general
- `paquetesGeneralController.js` - Controlador
- `paquetesGeneralService.js` - Servicio específico
- `components/` - Subcomponentes: tabla, formulario, modales de asignación/designación, historial

#### ubicaciones/
- `ubicaciones.js`, `ubicacionesPage.js` - Gestión de ubicaciones físicas de expedientes

---

## backend/

| Archivo | Descripción |
|---|---|
| `Code.gs` | Google Apps Script. Expone endpoints HTTP para CRUD de expedientes, juzgados, materias, estados, paquetes, trabajadores, etc. sobre Google Sheets |
| `ARQUITECTURA.md` | Documentación de la arquitectura del backend |
| `TESTING.js` | Scripts de prueba del backend |

---

## components/ (legacy)
Fragmentos HTML estáticos no usados en el flujo SPA activo. Permanecen como referencia.
- `header.html`, `modal.html`, `sidebar.html`

## js/ (legacy)
Scripts independientes del flujo original antes de la SPA. No se usan en el flujo activo.
- `app.js`, `busqueda.js`, `excel-db.js`, `lista.js`, `registro.js`

## data/ (legacy)
- `mock-data.js` - Datos de prueba del flujo original

---

## Flujo principal

```
pages/dashboard.html
  └── assets/js/app.js
        ├── auth: authManager.isAutenticado()
        │     - SI -> initRouter()
        │     - NO -> initLoginPage() -> onLoginSuccess -> initRouter()
        └── router.js: lee body.dataset.page
              ├── dashboard    -> dashboardPage.js
              ├── registro     -> registroPage.js
              ├── expedientes  -> listadoPageBackend.js
              ├── busqueda     -> busquedaPage.js
              ├── ubicaciones  -> ubicacionesPage.js
              ├── paquetes     -> paquetesPage.js
              ├── paquetes-general -> paquetesGeneralView.js
              ├── movimientos  -> movimientosPage.js
              ├── actualizacion -> actualizacionPage.js
              └── configuracion -> configuracionPage.js

Cada módulo usa:
  components/ -> UI
  services/   -> datos (con caché + sync backend)
  utils/      -> parseo, formateo, validación
  core/       -> constantes, tokens

services/ -> utils/googleSheetsAPI.js -> Cloudflare Worker -> Google Apps Script -> Google Sheets
```

---

## Tablas Principales en Google Sheets

### **expedientes**
- `id_expediente` (PK)
- `numero_expediente`, `codigo_expediente_completo`
- `anio`, `id_materia`, `codigo_materia`
- `id_juzgado`, `juzgado_texto`
- `id_estado` (FK → estados.id)
- `id_paquete` (FK → paquetes.codigo_paquete) [para Archivo Modular]
- `id_ubicacion_actual` (FK → ubicaciones.id o grupo/paquete)
- `ubicacion_texto`
- `fecha_ingreso`, `fecha_actualizacion`
- `activo`

### **grupo_archivo_general**
- `id_grupo` (PK) - formato: GRP-XXXX
- `codigo_grupo` (único)
- `nombre_especialista`
- `estado_grupo` (ACTIVO | EN_PRESTAMO | RETORNADO)
- `total_expedientes`
- `fecha_creacion`, `fecha_actualizacion`
- `activo`

### **grupo_archivo_general_detalle**
- `id_detalle` (PK)
- `id_grupo` (FK → grupo_archivo_general.id_grupo)
- `id_expediente` (FK → expedientes.id_expediente)
- `activo`

### **salida_archivo_general**
- `id_salida` (PK) - formato: SAL-XXXX
- `id_grupo` (FK → grupo_archivo_general.id_grupo)
- `rotulo_salida` (auto-generado: {codigo_grupo}-{correlativo})
- `tipo_salida` (PRESTAMO | CONSULTA | EXTERNO)
- `destino_salida`
- `responsable_entrega`, `responsable_recepcion`
- `fecha_hora_salida`, `fecha_hora_retorno`
- `estado_salida` (ACTIVA | PENDIENTE | EN_PROCESO | RETORNADO | ENVIADO_DEFINITIVO)
- `motivo_salida`, `observacion`
- `realizado_por`, `activo`

### **paquete_expediente**
- `id_paquete_expediente` (PK) - formato: PEXP-XXXX
- `id_paquete_archivo` (FK → paquetes_archivo.id_paquete_archivo)
- `id_expediente` (FK → expedientes.id_expediente)
- `fecha_asignacion`, `fecha_actualizacion`
- `asignado_por`
- `estado_asignacion` (ASIGNADO | DISPONIBLE)
- `activo`

### **movimientos**
- `id_movimiento` (PK) - formato: MOV-XXXX
- `id_expediente` (FK → expedientes.id_expediente)
- `tipo_movimiento` (INGRESO | ASIGNACION_PAQUETE | REASIGNACION_PAQUETE | DESASIGNACION_PAQUETE | SALIDA | RETORNO)
- `ubicacion_origen`, `ubicacion_destino`
- `estado_anterior`, `estado_nuevo`
- `fecha_movimiento`, `hora_movimiento`, `fecha_hora_movimiento`
- `motivo`, `observacion`
- `realizado_por`, `activo`

### **auditoria**
- `id_auditoria` (PK)
- `tabla` (expedientes | grupo_archivo_general | salida_archivo_general | paquete_expediente)
- `id_registro` (referencia a PK de tabla auditada)
- `accion` (INSERT | UPDATE | DELETE | ASIGNACION | DESASIGNACION)
- `campo` (para UPDATE, qué campo cambió)
- `valor_anterior`, `valor_nuevo`
- `usuario`, `modulo`, `fecha_actualizacion`
- `observacion`

---

## Flujos Principales

### Flujo 1: Crear y gestionar Grupo (Archivo General)
```
1. Usuario abre Archivo General > Tab GRUPOS
2. Clickea "+ Crear nuevo grupo"
3. ModalCrearGrupo: código (auto), especialista, descripción
4. Backend crea grupo con estado ACTIVO
5. Usuario abre modal detalle: "+ Agregar Expedientes" → ModalAsignarExpedientes
6. Usuario asigna grupo a paquete: "Asignar Paquete" → ModalAsignarGrupoAPaquete
```

### Flujo 2: Registrar salida y retorno
```
Salida:   Grupo ACTIVO → "Salida" → ModalRegistrarSalida 
          → grupo EN_PRESTAMO, salida ACTIVA
Retorno:  Grupo EN_PRESTAMO → "Retorno" → ModalRegistrarRetorno
          → grupo ACTIVO, salida RETORNADO
```

### Flujo 3: Asignar grupo a paquete
```
ModalAsignarGrupoAPaquete:
  - Asigna cada expediente al paquete
  - Cambia id_estado de cada expediente a 10 (ARCHIVADO)
  - Crea movimientos: ASIGNACION_PAQUETE / REASIGNACION_PAQUETE
  - Registra cambios en auditoría
```

---

**Actualizado:** 26 de abril de 2026
