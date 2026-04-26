# Interfaz y Botones - Control de Expedientes

Descripción precisa de la interfaz de usuario del sistema, sus módulos activos, componentes visuales, botones y su función real.

---

## Layout general

Todas las páginas activas usan el mismo layout generado por `assets/js/components/layout.js`:

```
┌─────────────────────────────────────────────┐
│  SIDEBAR (fijo izquierda)                   │
│  - Logo / nombre sistema                    │
│  - Menú de navegación por categorías        │
│  - Botón colapsar/expandir (escritorio)     │
│  - Botón cerrar sesión (abajo)              │
├─────────────────────────────────────────────┤
│  HEADER (parte superior del contenido)      │
│  - Título de la página actual               │
│  - Nombre/rol del usuario logueado          │
│  - Botón hamburguesa (mobile)               │
├─────────────────────────────────────────────┤
│  MAIN (contenido de la página activa)       │
└─────────────────────────────────────────────┘
```

---

## Sidebar

Generado por `sidebar.js`. Tiene tres categorías con sus módulos:

**Operaciones**
- Dashboard
- Registrar expedientes
- Ver expedientes
- Búsqueda avanzada

**Gestión**
- Gestión de ubicaciones
- Gestión de paquetes (con submenú expandible)
  - Paquetes para Archivo General
  - Paquetes para Archivo Modular
- Movimientos

**Sistema**
- Configuración

El sidebar puede colapsarse en escritorio (oculta etiquetas, muestra solo iconos). En mobile/TV se abre como drawer lateral.

---

## Módulos activos y sus botones

### Login
- Campo usuario + campo contraseña
- Botón **Ingresar** - autentica contra el backend

---

### Dashboard
Muestra estadísticas del sistema con cards de resumen y filtros temporales.

- Cards con totales: expedientes registrados, por estado, por juzgado
- Filtros por rango de fechas
- Sin botones de acción directa (es vista de solo lectura)

---

### Registro de Expedientes
Tres modos accesibles desde la misma pantalla:

**Botones de modo (barra superior):**
- **Listar** - Abre modal con el historial de registros recientes, con filtro por número de expediente
- **Manual** - Activa el formulario de entrada manual con teclado
- **Lectora** - Activa el formulario de escaneo con lectora de código de barras

**Modo Manual - Formulario:**

| Campo | Descripción |
|---|---|
| Número | Primeros 5 dígitos del expediente |
| Año | Año del expediente |
| Incidente | 0 por defecto; checkbox para activar edición |
| Corte | Selector: 3101-JR / 3101-JP / 3101-JM / 3101-SP |
| Materia | Selector cargado desde backend |
| Det (determinador) | 2 dígitos (01-09) |
| Juzgado/Sala | Selector cargado desde backend |
| Paquete | Selector opcional |
| Ubicación | Selector (Estante, Archivo, etc.) |
| Estado | Texto fijo de solo lectura (valor predeterminado: "Ingresado") |
| Observaciones | Área de texto libre |

- Botón **Limpiar** - Resetea el formulario
- Botón **Guardar** - Valida y envía al backend. Solicita confirmación si el expediente ya existe
- Botón **?** (ayuda) - Explica que fecha/hora se generan automáticamente al guardar

**Modo Lectora - Formulario:**

- Campo de escaneo (código de barras 20-23 dígitos)
- Presionar ENTER procesa el código y muestra resumen con: número completo, juzgado, paquete, ubicación, estado
- Presionar ENTER por segunda vez guarda automáticamente
- Botón **Editar** (aparece en el resumen) - Abre modal de edición con:
  - Número de expediente (editable)
  - Determinador detectado (informativo)
  - Juzgado específico (selector)
  - Paquete (selector, opcional)
  - Ubicación (selector)
  - Estado (texto fijo de solo lectura - no editable)
  - Botón **Guardar cambios** / **Cancelar**
- Botón **Limpiar** (aparece en el resumen) - Resetea el escaneo
- Campo **Observaciones** - Texto libre
- Botón **Guardar expediente** - Deshabilitado hasta que el escaneo sea válido

---

### Ver Expedientes (Listado)

Tabla con todos los expedientes del backend con múltiples acciones.

**Filtros disponibles:**
- Número de expediente
- Materia
- Juzgado
- Estado
- Ubicación actual
- Paquete
- Rango de fechas (desde/hasta)

**Botones principales:**
- Botón **Actualizar** - Fuerza recarga desde el backend

**Botones de acción por cada expediente (en dropdown "Acciones"):**

| Botón | Acción |
|---|---|
| **Ver** | Abre modal con detalle completo del expediente (tabs: datos, movimientos, trazabilidad) |
| **Editar** | Abre formulario de edición del expediente |
| **Mover** | Abre modal para cambiar ubicación del expediente a otra área |
| **Salida** | **NUEVO**: Abre modal de salida del expediente a otra área. 4 tipos disponibles con motivos dinámicos |

#### **Flujo de Salida de Expediente (NUEVO)**

Cuando se presiona botón **Salida** en la tabla de listado:

1. Se abre modal **Registrar Salida de Grupo** (reutiliza el mismo modal que Archivo General)
2. Campos del modal (todos obligatorios):
   - **Tipo de Salida**: Dropdown con 4 opciones:
     - Préstamo
     - Salida Interna
     - Salida Externa
     - Envío Definitivo
   - **Motivo de Salida**: Dropdown dinámico según tipo seleccionado:
     - **Préstamo**: Lectura expediente, Consulta, Revisión interna, Audiencia, Apoyo ordenamiento
     - **Salida Interna**: Revisión interna, Digitalización, Audiencia, Ordenamiento, Apoyo ordenamiento
     - **Salida Externa**: Traslado, Consulta externa, Remisión temporal, Revisión externa
     - **Envío Definitivo**: Remisión final, Cierre expediente, Archivo definitivo, Transferencia definitiva
   - **Destino de Salida**: Dropdown según tipo (Juzgado, Juez, Especialista, Asistente, etc.)
   - **Responsable de Entrega**: Texto libre (nombre completo)
   - **Responsable de Recepción**: Texto opcional
   - **Estado de Salida**: Dropdown según tipo (Pendiente, En Proceso, Devuelto, Enviado definitivo)
   - **Observación**: Área de texto opcional

3. Botón **Registrar Salida** - Valida campos y guarda el registro
4. Toast de confirmación: "Salida registrada: SAL-XXXX"
5. El listado se recarga automáticamente

---

### Búsqueda Avanzada
- Campos de búsqueda: número de expediente, juzgado, materia, estado, rango de fechas
- Botón **Buscar**
- Botón **Limpiar filtros**
- Resultados en tabla con las mismas acciones que el listado

---

### Gestión de Ubicaciones
- Listado de ubicaciones activas
- Botón **Nueva ubicación** - Formulario de creación
- Por cada ubicación: Editar, Cambiar estado activo/inactivo

---

### Gestión de Paquetes

El módulo Paquetes tiene dos flujos separados accesibles desde el submenú en el sidebar:

#### **Paquetes para Archivo Modular** (`paquetes-modular`)

Gestión de paquetes del Archivo Modular con múltiples tabs:

**Tabs disponibles:**

1. **Listado de Paquetes** - Vista principal
   - Tabla de paquetes con: Rótulo, Año, Materia, Paquete, Grupo
   - Por cada paquete, 5 botones de acción:
     - Botón **Listado de expedientes** (icono ojo) - Abre modal con todos los expedientes del paquete
     - Botón **Asignación masiva** (icono transfer) - Abre modal para asignar múltiples expedientes de una sola vez
     - Botón **Salida** (icono send) - **NUEVO**: Abre modal de salida del paquete hacia archivo. Solo permite destino ESPECIALISTA o ASISTENTE y motivo ORDENAMIENTO/ARCHIVO
     - Botón **Rótulo** (icono libro) - Muestra y permite imprimir el rótulo del paquete
     - Botón **Asignar ubicación** (icono mapPin) - Abre modal para establecer ubicación física del paquete

2. **Asignación Individual** - Tab secundario
   - Formulario para buscar expediente y asignarlo a un paquete manualmente
   - Botón **Asignar Expediente** - Ejecuta la asignación

3. **Asignación Grupal** - Tab secundario
   - Búsqueda masiva de expedientes por filtros
   - Botón **Buscar** - Localiza expedientes según criterios
   - Botón **Anterior/Siguiente** - Navegación por páginas

4. **Gestión de Colores** - Tab secundario
   - Asignación de colores a especialistas para identificación visual rápida

#### **Flujo de Salida de Paquete (NUEVO)**

Cuando se presiona botón **Salida** en la tabla de paquetes:

1. Se abre modal **Registrar Salida de Paquete**
2. Campos del modal (todos obligatorios):
   - **Tipo de Salida**: Fijo = "Para Archivo" (sin opciones, auto-seleccionado)
   - **Motivo de Salida**: Dropdown con "Ordenamiento" o "Archivo"
   - **Destino de Salida**: Dropdown con "Especialista" o "Asistente"
   - **Responsable de Entrega**: Texto libre (nombre completo)
   - **Responsable de Recepción**: Texto opcional
   - **Estado de Salida**: Dropdown con "Pendiente" o "En Proceso"
   - **Observación**: Área de texto opcional
3. Botón **Registrar Salida** - Valida campos y guarda el registro
4. Toast de confirmación: "Salida registrada: SAL-XXXX"
5. La tabla se recarga automáticamente

#### **Paquetes para Archivo General** (`paquetes-general`)
Gestión del Archivo General con grupos de expedientes, movimientos internos y asignación a paquetes.
Ver sección **Archivo General** abajo.

---

### **ARCHIVO GENERAL** (NEW)

Módulo completo para gestión de expedientes organizados en grupos, con movimientos de entrada/salida y asignación a paquetes de archivo.

**Ubicación:** Sidebar > Gestión de Paquetes > Paquetes para Archivo General  
**Página:** archivoGeneralPage.js  
**3 Tabs principales:**

#### Tab 1: GRUPOS
Listado de grupos de expedientes.

| Botones | Acción |
|---|---|
| **+ Crear nuevo grupo** | Abre `ModalCrearGrupo` con formulario para crear grupo |
| **Ver** (por grupo) | Abre `ModalVerDetalleGrupo` con detalle completo del grupo |
| **Salida** (por grupo) | Solo aparece si `estado_grupo = "ACTIVO"`. Abre `ModalRegistrarSalida` |
| **Retorno** (por grupo) | Solo aparece si hay salida activa. Abre `ModalRegistrarRetorno` |

**Características del Tab:**
- Muestra contador de grupos totales, activos, y en préstamo
- Cards de resumen con código de especialista
- Estados: ACTIVO, EN_PRESTAMO, RETORNADO
- Filtros opcionales por estado y fecha creación

#### Tab 2: SALIDAS
Historial de movimientos externos (salidas de grupos).

| Columnas | Datos |
|---|---|
| Rótulo | ID único de la salida |
| Tipo | PRESTAMO, CONSULTA, etc. |
| Destino | Dónde se envió |
| Fecha | Cuándo se registró la salida |
| Estado | ACTIVA, PENDIENTE, EN_PROCESO, RETORNADO, ENVIADO_DEFINITIVO |

**Sin botones de acción directa en este tab.** Las salidas se retornan desde el Tab de Grupos.

#### Tab 3: EXPEDIENTES SIN GRUPO
Listado de expedientes que no están asignados a ningún grupo.

| Columnas | Datos |
|---|---|
| Código | Código del expediente |
| Año | Año judicial |
| Juzgado | Juzgado asignado |
| Materia | Categoría de materia |
| Estado | Estado actual del expediente |

**Sin botones de acción.** Para asignar expedientes a un grupo, usar el botón dentro de ModalVerDetalleGrupo.

---

### **ModalVerDetalleGrupo** (Detalle de Grupo)

Modal emergente que muestra toda la información de un grupo.

**Botones de acción en header:**
- **+ Agregar Expedientes** - Abre `ModalAsignarExpedientes` para agregar más expedientes al grupo
- **Asignar Paquete** - Abre `ModalAsignarGrupoAPaquete` para asignar el grupo completo a un paquete de archivo

**Contenido (3 sub-tabs):**

##### Sub-tab: EXPEDIENTES
Tabla con todos los expedientes del grupo.

| Columnas | Datos |
|---|---|
| Código | Código del expediente |
| Materia | Categoría judicial |
| Juzgado | Juzgado asignado |
| Estado | Estado del expediente |

**Sin botones de acción en expedientes individuales.**

##### Sub-tab: SALIDAS
Tabla de movimientos externos del grupo.

| Columnas | Datos |
|---|---|
| Rótulo | ID único de la salida |
| Tipo | PRESTAMO, CONSULTA, etc. |
| Destino | Dónde se envió |
| Fecha | Cuándo salió |
| Estado | ACTIVA, PENDIENTE, EN_PROCESO, RETORNADO, ENVIADO_DEFINITIVO |

**Sin botones.** Este tab es informativo.

---

### **ModalAsignarExpedientes**

Modal para agregar expedientes a un grupo existente.

**Elementos:**
- Selector/buscador de expedientes disponibles (que no están en grupos)
- Tabla de expedientes seleccionados para agregar
- Checkbox de seleccionar todos

| Botones | Acción |
|---|---|
| **Agregar** | Envía los expedientes seleccionados al backend y los asigna al grupo |
| **Cancelar** | Cierra el modal |

---

### **ModalAsignarGrupoAPaquete**

Modal para asignar un grupo completo a un paquete de Archivo General.

**Elementos:**
- Selector de paquete archivo (PAQ-XXXX con rótulo)
- Resumen del grupo: código, cantidad de expedientes
- Confirmación de acción

| Botones | Acción |
|---|---|
| **Confirmar asignación** | Asigna todos los expedientes del grupo al paquete. Cambia estado a ARCHIVADO |
| **Cancelar** | Cierra el modal |

**Importante:** 
- Al asignar, cada expediente obtiene `id_estado = ARCHIVADO` (estado 10)
- Se registran movimientos con `tipo_movimiento = ASIGNACION_PAQUETE` o `REASIGNACION_PAQUETE`
- Se crea entrada en tabla de auditoría

---

### **ModalRegistrarSalida**

Modal para registrar que un grupo sale del archivo (préstamo, consulta, etc.).

**Campos de formulario:**
| Campo | Tipo | Obligatorio |
|---|---|---|
| Tipo de salida | Select (PRESTAMO, CONSULTA, EXTERNO) | Sí |
| Destino de salida | Text | Sí |
| Responsable de entrega | Text | Sí |
| Responsable de recepción (opcional) | Text | No |
| Motivo de salida | Text | No |
| Observación | Textarea | No |

| Botones | Acción |
|---|---|
| **Registrar salida** | Crea registro en tabla salida_archivo_general. Cambia estado del grupo a EN_PRESTAMO |
| **Cancelar** | Cierra el modal |

**Backend:**
- Genera ID único con prefijo `SAL-`
- Rótulo auto: `{codigo_grupo}-{correlativo}`
- Estado salida: `ACTIVA`
- Registra fecha/hora automática

---

### **ModalRegistrarRetorno**

Modal para cerrar una salida (devolver grupo al archivo).

**Mostrado cuando:**
- `estado_grupo = EN_PRESTAMO` Y existe una salida con estado ACTIVA/PENDIENTE/EN_PROCESO

**Contenido:**
- Resumen de la salida a retornar: rótulo, tipo, destino, responsable entrega, fecha salida
- Campo de observación del retorno (opcional)
- Nota informativa: "Este retorno cerrará la salida actual y liberará nuevamente el grupo"

| Botones | Acción |
|---|---|
| **Confirmar retorno** | Cambia estado salida a RETORNADO. Cambia estado grupo a ACTIVO. Registra fecha/hora de retorno |
| **Cancelar** | Cierra el modal |

---

### **ModalCrearGrupo**

Modal para crear un nuevo grupo de expedientes.

**Campos:**
| Campo | Tipo | Obligatorio |
|---|---|---|
| Código del grupo | Text | Sí (auto-generado patrón: GRP-XXXX) |
| Especialista | Select | Sí |
| Nombre/descripción | Textarea | No |

| Botones | Acción |
|---|---|
| **Crear grupo** | Crea nuevo grupo en backend. Estado inicial: ACTIVO |
| **Cancelar** | Cierra modal |

---

### Movimientos
- Historial de movimientos de expedientes (entradas, salidas, traslados)
- Filtros por expediente, tipo de movimiento, fecha
- Vista en tabla

---

### Configuración
Panel con submodulos accesibles por menú interno:

| Submodulo | Función |
|---|---|
| Panel General | Resumen estadístico de registros activos |
| Juzgados | CRUD de juzgados y salas |
| Materias | CRUD de categorías judiciales |
| Ubicaciones | CRUD de puntos de archivo |
| Estados | CRUD de estados de expediente |
| Mi Perfil | Nombre, cargo y datos del operador |
| Parámetros | Configuración general del sistema |
| Actualización | Sincronización de datos con el backend |

Cada submodulo tiene su propio listado con botones de crear, editar y activar/desactivar.

---

## Componentes transversales

### Modales (`modal.js`)
Ventana emergente reutilizable. Se invoca con `openModal({ title, content, confirmText, onConfirm })`.
Siempre tiene:
- Botón **X** (cerrar)
- Botón **Cancelar**
- Botón de confirmación con texto configurable

### Toasts (`toast.js`)
Mensajes emergentes en esquina superior derecha. Tipos: `success`, `error`, `warning`, `info`. Se auto-cierran.

### Tabla (`table.js`)
Tabla genérica configurada con `{ columns, rows, emptyText }`. Usada en listados, búsqueda y modales de registros.

### StatusBadge (`statusBadge.js`)
Badge de color según el estado del expediente (Ingresado, Archivado, Prestado, etc.).

---

## Comportamiento del campo Estado

El campo **Estado** es de **solo lectura** en todos los formularios de registro y edición.
- Valor predeterminado: `Ingresado`
- No se puede modificar desde el formulario de registro ni desde el modal de edición de lectora
- Se envía como campo oculto al backend
- Solo se puede cambiar desde módulos específicos (Movimientos o Configuración > Estados)

---

## RESUMEN DE CAMBIOS (26 de abril de 2026)

### Nuevo módulo: ARCHIVO GENERAL
Se agregó un módulo completo para gestión del Archivo General con:
- Grupos de expedientes con gestión centralizada
- Movimientos internos (salidas/retornos)
- Asignación de grupos a paquetes de archivo
- Estados de grupo: ACTIVO, EN_PRESTAMO, RETORNADO
- Estados de expediente mapeados por ID (visualización mejorada)

### Cambios en UI/Estado
- Campo **Estado** ahora muestra nombre en lugar de ID numérico en todos los listados
- Modales optimizados con carga lazy de expedientes (sin setTimeout)
- Botón **Retorno** más robusto: aparece si hay salida activa OR estado = EN_PRESTAMO

### Cambios en estructura del sidebar
- Se agregó submenú expandible en "Gestión de Paquetes" con dos opciones:
  - Paquetes para Archivo General (nuevo)
  - Paquetes para Archivo Modular (existente, rebautizado)

### Flujos de datos nuevo
- `expediente.id_estado` se mapea automáticamente a `estado.nombre` en frontend
- `estadoService.listarSync()` usado en paquetesPage, ArchivoGeneralPage, ModalVerDetalleGrupo
- Nueva tabla: `salida_archivo_general` para movimientos externos
- Nueva tabla: `grupo_archivo_general_detalle` para miembros de grupos

### Expediente ↔ Grupo
- Un expediente puede estar en 0 o 1 grupo
- Un grupo puede tener 0 o muchos expedientes
- Almacenamiento: tabla `grupo_archivo_general_detalle` con campos `id_grupo`, `id_expediente`
- Al asignar a grupo: expediente recibe `id_ubicacion_actual = id_grupo`, `ubicacion_texto = "GRUPO: {codigo_grupo}"`

### Grupo ↔ Salida
- Un grupo puede tener 0 o muchas salidas (históricas)
- Solo 1 salida activa por grupo (validado en backend)
- Estados de salida: ACTIVA, PENDIENTE, EN_PROCESO, RETORNADO, ENVIADO_DEFINITIVO
- Almacenamiento: tabla `salida_archivo_general` con campos `id_grupo`, `id_salida`, `estado_salida`

### Grupo ↔ Paquete
- Un grupo puede ser asignado a 0 o 1 paquete
- Un paquete puede contener muchos grupos (a través de sus expedientes)
- Cuando grupo → paquete: todos los expedientes del grupo obtienen `id_paquete = id_paquete_archivo`, `id_estado = ARCHIVADO (10)`
- Almacenamiento: tabla `paquete_expediente` con campos `id_expediente`, `id_paquete_archivo`

### Estados de Grupo
| Estado | Cuándo | Transición |
|---|---|---|
| ACTIVO | Inicial. Sin movimientos externos | → EN_PRESTAMO (al registrar salida) |
| EN_PRESTAMO | Hay una salida activa | → ACTIVO (al registrar retorno) |
| RETORNADO | Después de retorno (histórico) | No transiciona |

### Estados de Expediente (cuando asignado a Archivo General)
| ID | Estado | Cuándo | Flujo |
|---|---|---|---|
| 2 | REGISTRADO | Expediente nuevo en el sistema | Inicial |
| 3 | EN PAQUETE | (Legacy - no usado actualmente) | - |
| 10 | ARCHIVADO | Cuando grupo se asigna a paquete | Final en Archivo General |
| 1 | INGRESADO | (Legacy) | - |

---

**Actualizado:** 26 de abril de 2026
