Aquí tienes el documento **completo y actualizado** con todos los cambios hasta hoy:

```markdown
# Estructura y Relaciones - Control de Expedientes

> **Documento maestro técnico - Autosuficiente**  
> Aplicación SPA para gestión de expedientes judiciales  
> Frontend: ES modules | Backend: Google Apps Script | Persistencia: Google Sheets (16 hojas)  
> Proxy CORS: Cloudflare Worker  
> Última actualización: 3 de mayo de 2026

---

## Tabla de Contenidos

1. [Arquitectura actual](#1-arquitectura-actual)
2. [Estructura del repositorio](#2-estructura-del-repositorio)
3. [Rutas SPA](#3-rutas-spa)
4. [Relación entre capas](#4-relación-entre-capas)
5. [API backend](#5-api-backend)
6. [Modelo de datos](#6-modelo-de-datos)
7. [Flujos funcionales](#7-flujos-funcionales)
8. [Sistema de caché y optimización](#8-sistema-de-caché-y-optimización)
9. [Legacy y compatibilidad](#9-legacy-y-compatibilidad)
10. [Guía para nuevos módulos](#10-guía-para-nuevos-módulos)
11. [Hojas de historial](#11-hojas-de-historial)
12. [Configuración de estados de salida](#12-configuración-de-estados-de-salida)
13. [Menú lateral](#13-menú-lateral)
14. [Notas técnicas importantes](#14-notas-técnicas-importantes)
15. [Patrones de código](#15-patrones-de-código)
16. [Resolución de problemas comunes](#16-resolución-de-problemas-comunes)

---

## 1) Arquitectura actual

```
[HTML/Vistas] → [app.js] → [router.js] → [Módulos] → [Servicios] → [config.js] → [Cloudflare Worker] → [Google Apps Script] → [Google Sheets]
```

### Stack tecnológico

| Capa | Tecnología | Detalle |
|---|---|---|
| Frontend | Vanilla JS (ES Modules) | Sin frameworks, modular |
| Estilos | Tailwind CSS + CSS custom | Variables CSS para theming |
| Backend | Google Apps Script | Archivos .gs modulares |
| Base de datos | Google Sheets | 16 hojas con relaciones |
| Proxy | Cloudflare Worker | Resuelve CORS |
| Autenticación | DNI + localStorage | Sesión con timeout por inactividad |

---

## 2) Estructura del repositorio

### 2.1 Raíz

| Ruta | Propósito |
|---|---|
| `index.html` | Entrada principal (data-page="login") |
| `cloudflare-worker.js` | Proxy CORS hacia Apps Script |
| `package.json` | Scripts de build CSS |
| `tailwind.config.js` | Configuración Tailwind |
| `backend/` | API Apps Script y documentación |
| `pages/` | Entradas HTML por módulo/ruta |
| `assets/` | Frontend modular (css/js/icons) |
| `js/`, `components/`, `data/` | Legacy (compatibilidad) |

### 2.2 assets/js/ - Núcleo activo

```
assets/js/
├── app.js              # Bootstrap global
├── router.js           # Tabla ROUTES + navegación
├── config.js           # URLs del Worker
├── auth/
│   └── authManager.js  # Sesión + timeout
├── services/           # 12 servicios (capa de datos)
├── modules/            # 11 carpetas de módulos
├── components/         # 14 componentes UI reutilizables
├── core/               # 5 archivos de constantes/helpers
├── utils/              # 8 utilidades
└── data/
    └── mockData.js     # Datos de prueba
```

### 2.3 backend/ - Apps Script

```
backend/
├── Código.gs                    # Entry points (doGet/doPost)
├── Config.gs                    # Constantes, IDs, SHEET_CONFIG
├── Utilidades.gs                # Helpers (getSheet, jsonResponse, etc.)
├── Cache.gs                     # SheetCache (caché en memoria)
├── Validaciones.gs              # Reglas de salida
├── ExpedientesService.gs        # CRUD + listarLigero + listarPaginado
├── UsuariosService.gs           # CRUD + listarEspecialistas/Asistentes
├── PaquetesService.gs           # CRUD paquetes
├── ArchivoGeneralService.gs     # Grupos, salidas, retornos
├── MovimientosService.gs        # Movimientos internos
├── SeguimientoService.gs        # Cambios de estado
├── CatalogosService.gs          # Catálogos (materias, juzgados, etc.)
└── AuditoriaService.gs          # Registro de auditoría
```

---

## 3) Rutas SPA

| Clave | Título | Init | Hoja principal |
|---|---|---|---|
| `dashboard` | Dashboard Institucional | `initDashboardPage` | expedientes |
| `registro` | Registro de Expedientes | `initRegistroPage` | expedientes |
| `expedientes` | Listado de Expedientes | `initListadoPage` | expedientes |
| `paquetes` | Paquetes Archivo Modular | `initPaquetesPage` | paquetes |
| `paquetes-general` | Paquetes Archivo General | `renderPaquetesGeneralView` | grupo_archivo_general |
| `movimientos` | Actualización de datos | `initMovimientosPage` | seguimiento_expediente |
| `movimientos-modular` | Historial de Movimientos | `initMovimientosModularPage` | movimientos_expediente |
| `salidas-archivo` | Salidas al Archivo | `initSalidasArchivoPage` | salida_archivo_general |
| `ubicaciones` | Gestión de Ubicaciones | `initUbicacionesPage` | ubicaciones |
| `configuracion` | Configuración | `initConfiguacionPage` | varias |
| `actualizacion` | Actualización de Datos | `initActualizacionPage` | seguimiento_expediente |

---

## 4) Relación entre capas

1. HTML define `data-page` → router.js busca en tabla ROUTES
2. router.js renderiza layout + invoca `route.init({ mountNode })`
3. Módulo construye UI con componentes + lógica de negocio
4. Servicios llaman a `appConfig.googleSheetURL` (Cloudflare Worker)
5. Worker reenvía POST/GET a Google Apps Script
6. Apps Script lee/escribe en Google Sheets usando `SheetCache`
7. Respuesta JSON estandarizada: `{ success: bool, data: any, error?: string }`

---

## 5) API backend vigente

### 5.1 Acciones POST (22)

```
crear_usuario, login_usuario, registrar_expediente, actualizar_expediente,
actualizar_expedientes_masivo, crear_paquete, crear_paquete_archivo,
asignar_expediente_paquete, asignar_expedientes_paquete_lote,
asignar_color_especialista, desasignar_expediente_paquete,
asignar_ubicacion_paquete, crear_grupo_archivo_general,
asignar_expedientes_grupo_archivo, desasignar_expediente_grupo_archivo,
asignar_grupo_a_paquete_archivo, registrar_salida_archivo_general,
registrar_retorno_archivo_general, prestar_expediente_individual,
retornar_expediente_individual, registrar_movimiento
```

### 5.2 Acciones GET (28)

```
listar_usuarios, obtener_usuario_por_dni, listar_materias_activas,
listar_juzgados_activos, listar_estados_activos, listar_estados_sistema_activos,
listar_especialistas_activos, listar_asistentes_activos, listar_responsables_activos,
listar_paquetes_activos, listar_paquetes_archivo, listar_paquetes_archivo_con_expedientes,
sugerir_paquete_para_expediente, listar_expedientes, listar_expedientes_ligero,
listar_expedientes_paginado, listar_expedientes_por_paquete, obtener_expediente_por_codigo,
listar_grupos_archivo_general, listar_detalle_grupo_archivo, listar_salidas_archivo_general,
listar_salidas_todas, obtener_grupo_con_detalle, listar_seguimientos, listar_movimientos,
listar_ubicaciones_activas, listar_pisos_por_ubicacion, consultar_auditoria,
historial_expediente, obtener_ultimo_seguimiento
```

---

## 6) Modelo de datos en Google Sheets (16 hojas)

### Hojas y sus relaciones

| # | Hoja | Relaciones |
|---|---|---|
| 1 | `usuarios` | → color_especialista, seguimiento_expediente |
| 2 | `materias` | → expedientes.codigo_materia |
| 3 | `juzgados` | → expedientes.id_juzgado |
| 4 | `estados` | → expedientes.id_estado |
| 5 | `estados_sistema_expediente` | → seguimiento_expediente.id_estado_sistema |
| 6 | `paquetes` | → paquete_expediente |
| 7 | `expedientes` | → seguimiento, movimientos, paquete_expediente, grupo_archivo_general_detalle |
| 8 | `seguimiento_expediente` | → expedientes.id_expediente |
| 9 | `paquetes_archivo` | → paquete_expediente.id_paquete_archivo |
| 10 | `paquete_expediente` | → expedientes + paquetes_archivo |
| 11 | `color_especialista` | → usuarios.id_usuario |
| 12 | `movimientos_expediente` | → expedientes.id_expediente |
| 13 | `grupo_archivo_general` | → grupo_archivo_general_detalle + salida_archivo_general |
| 14 | `grupo_archivo_general_detalle` | → grupo_archivo_general + expedientes |
| 15 | `salida_archivo_general` | → grupo_archivo_general |
| 16 | `auditoria` | Registro de todas las operaciones |

### Encabezados principales

**expedientes**: `id_expediente | codigo_expediente_completo | numero_expediente | anio | incidente | codigo_corte | tipo_organo | codigo_materia | id_juzgado | juzgado_texto | fecha_ingreso | id_estado | id_estado_sistema | id_usuario_responsable | registrado_por | ...`

**seguimiento_expediente**: `id_seguimiento | id_expediente | id_estado | id_estado_sistema | id_usuario_responsable | observacion | fecha_registro | fecha_actualizacion | usuario_registra | activo`

**movimientos_expediente**: `id_movimiento | id_expediente | tipo_movimiento | ubicacion_origen | ubicacion_destino | estado_anterior | estado_nuevo | fecha_movimiento | hora_movimiento | fecha_hora_movimiento | motivo | observacion | realizado_por | destino_externo | activo`

**salida_archivo_general**: `id_salida | id_grupo | rotulo_salida | tipo_salida | destino_salida | responsable_entrega | responsable_recepcion | fecha_hora_salida | fecha_hora_retorno | estado_salida | motivo_salida | observacion | realizado_por | activo | fecha_creacion`

---

## 7) Flujos funcionales vigentes

### 7.1 Login
```
Login → authManager.validarTrabajador(dni) → obtener_usuario_por_dni
      → Precarga de 8 catálogos en background (2 seg después)
```

### 7.2 Registro de expediente
```
registrar_expediente → crear en hoja expedientes → estado inicial "REGISTRADO"
                     → seguimiento_expediente (primer registro)
```

### 7.3 Actualización de datos
```
actualizar_expediente → modificar campos (estado, ubicación, especialista, etc.)
                      → seguimiento_expediente (nuevo registro)
```

### 7.4 Salida individual (archivo modular)
```
Salida individual → actualizarEnBackend() → seguimiento_expediente (cambio de estado)
                  → registrarMovimiento()  → movimientos_expediente (registro del movimiento)
```

### 7.5 Retorno individual (archivo modular)
```
Retorno individual → actualizarEnBackend() → seguimiento_expediente (cambio de estado)
                   → registrarMovimiento()  → movimientos_expediente (registro del movimiento)
```

### 7.6 Salida de paquete al archivo general
```
Registrar salida de grupo → ArchivoGeneralService.registrarSalida()
                          → salida_archivo_general (nuevo registro)
                          → actualizarBatch() → expedientes (cambio de estado masivo)
                          → seguimiento_expediente (cambio de estado)
                          → grupo_archivo_general (cambio a EN_PRESTAMO)
```

### 7.7 Retorno de paquete del archivo general
```
Registrar retorno de grupo → ArchivoGeneralService.registrarRetorno()
                           → salida_archivo_general (actualiza a DEVUELTO)
                           → actualizarBatch() → expedientes (restaura estado)
                           → seguimiento_expediente (cambio de estado)
                           → grupo_archivo_general (cambio a ACTIVO)
```

---

## 8) Sistema de caché y optimización

### 8.1 Niveles de caché

| Nivel | Ubicación | TTL | ¿Qué cachea? |
|---|---|---|---|
| `SheetCache` | Memoria (Apps Script) | Sesión | Datos de hojas completas |
| localStorage | Navegador | 30 min | Expedientes completos |
| localStorage | Navegador | 1 hora | Catálogos (estados, juzgados, materias, usuarios) |
| sessionStorage | Navegador | 2 min | Páginas de expedientes paginados |
| `tabDataCache` | Memoria (JS) | 2 min | Pestañas de archivo general |
| `catalogosCache` | Memoria (JS) | Sesión | Estados sistema, usuarios (para seguimiento) |
| `seguimientosCache` | Memoria (JS) | Sesión | Último seguimiento por expediente |

### 8.2 Estrategias implementadas

| # | Optimización | Impacto |
|---|---|---|
| 1 | Caché agresivo (30min/1h) | 80% menos llamadas al backend |
| 2 | Endpoint ligero (`listar_expedientes_ligero`) | 70% menos datos (10 de 23 campos) |
| 3 | Paginación real (25/50/100 por página) | No carga 5000 registros |
| 4 | Precarga al login (8 catálogos en paralelo) | Sistema listo al instante |
| 5 | Carga en paralelo (`Promise.all`) | 2x más rápido en modales |
| 6 | Precarga de pestañas secundarias | Navegación instantánea entre tabs |
| 7 | Carga de seguimientos una sola vez | Tabla de expedientes sin grupo con datos completos |
| 8 | Filtros con búsqueda por Enter/Botón (no en cada tecla) | No pierde foco al escribir |
| 9 | Paginación configurable en Expedientes sin Grupo (25/50/100) | Navegación flexible |
| 10 | Columnas de Estado Sistema y Especialista (desde seguimiento) | Datos completos en tabla |

---

## 9) Legacy y compatibilidad

Archivos mantenidos por compatibilidad:
- `js/app.js`, `js/lista.js`, `js/registro.js`, `js/excel-db.js`
- `components/*.html`
- `data/mock-data.js`
- `assets/js/utils/googleSheetsAPI.js`

**Flujo principal recomendado**: Solo `assets/js/*` + `pages/*` + `backend/*.gs`

---

## 10) Guía para agregar nuevos módulos

1. Crear carpeta `assets/js/modules/nuevo-modulo/`
2. Crear `nuevoModuloPage.js` con función `initNuevoModuloPage({ mountNode })`
3. Registrar en `ROUTES` de `router.js` + import
4. Crear página HTML en `pages/` con `data-page` correcto
5. Agregar endpoints en `doGet`/`doPost` y en el servicio `.gs` correspondiente
6. Crear/actualizar service en `assets/js/services/`
7. Usar caché: `_obtenerCatalogos()` o `listarLigeroDelBackend()`
8. Para listados > 100 registros: usar `listarPaginadoDelBackend()`

---

## 11) Hojas de historial (3 vistas)

| Hoja | Vista | Propósito | ¿Cuándo se registra? |
|---|---|---|---|
| `seguimiento_expediente` | Historial de actualización | Cambios de estado y datos | Actualizar expediente, asignar especialista, cambiar estado del sistema |
| `movimientos_expediente` | Historial de movimientos | Préstamos, traslados, retornos | **Salida/retorno individual de expediente (archivo modular)** |
| `salida_archivo_general` | Salidas al archivo | Envíos de paquetes completos | Registrar salida/retorno de **grupo** (NO individual) |

**IMPORTANTE - Diferenciar claramente:**
- `movimientos_expediente` = Movimientos **internos** del archivo modular (préstamos individuales, traslados). Se registra desde `listadoPageBackend.js` al hacer clic en "Salida" o "Retorno" de un expediente individual.
- `salida_archivo_general` = Salidas de **grupos completos** al archivo general. Se registra desde `ArchivoGeneralPage.js` al hacer clic en "Salida" de un grupo.
- `seguimiento_expediente` = Cambios de **estado y datos** del expediente (actualizaciones, cambios de estado del sistema, asignación de especialistas).

### Flujo de registro en cada hoja:

**movimientos_expediente** (individual):
```
listadoPageBackend.js → abrirModalSalidaExpediente() → actualizarEnBackend() → seguimiento_expediente
                                                     → registrarMovimiento()  → movimientos_expediente
```

**salida_archivo_general** (paquete/grupo):
```
ArchivoGeneralPage.js → abrirModalRegistrarSalida() → archivoGeneralService.registrarSalida()
                                                     → salida_archivo_general
```

---

## 12) Configuración de estados de salida

### Backend (config.gs)
```javascript
const ESTADOS_SALIDA_ACTIVOS = ["ACTIVA", "ENTREGADO", "EN_PROCESO"];
```

### Backend (validaciones.gs) - REGLAS_SALIDA actualizadas
```javascript
const REGLAS_SALIDA = {
  PARA_ARCHIVO: {
    destinos: ["MODULO_CIVIL", "MODULO_LABORAL", "MESA_DE_PARTES", "SALA_SUPERIOR"],
    motivos: ["ORDENAMIENTO", "ARCHIVO"],
    estados: ["ENTREGADO"]
  },
  PRESTAMO: {
    destinos: ["JUZGADO", "JUEZ", "ESPECIALISTA", "ASISTENTE", "AREA_USUARIA", "SALA_AUDIENCIA"],
    motivos: ["LECTURA_EXPEDIENTE", "CONSULTA", "REVISION_INTERNA", "AUDIENCIA", "APOYO_ORDENAMIENTO", "ELEVACION_A_INSTANCIA_SUPERIOR"],
    estados: ["ENTREGADO", "PENDIENTE", "EN_PROCESO", "DEVUELTO"]
  },
  SALIDA_INTERNA: {
    destinos: ["JUZGADO", "JUEZ", "ESPECIALISTA", "ASISTENTE", "AREA_DIGITALIZACION", "SALA_AUDIENCIA"],
    motivos: ["REVISION_INTERNA", "DIGITALIZACION", "AUDIENCIA", "ORDENAMIENTO", "APOYO_ORDENAMIENTO", "ELEVACION_A_INSTANCIA_SUPERIOR"],
    estados: ["ENTREGADO", "PENDIENTE", "EN_PROCESO", "DEVUELTO"]
  },
  SALIDA_EXTERNA: {
    destinos: ["OTRO_JUZGADO", "ENTIDAD_EXTERNA", "MESA_PARTES", "FISCALIA", "PROCURADURIA"],
    motivos: ["TRASLADO", "CONSULTA_EXTERNA", "REMISION_TEMPORAL", "REVISION_EXTERNA"],
    estados: ["ENTREGADO", "PENDIENTE", "EN_PROCESO", "DEVUELTO"]
  },
  ENVIO_DEFINITIVO: {
    destinos: ["ARCHIVO_CENTRAL", "ARCHIVO_GENERAL", "OTRO_JUZGADO", "ENTIDAD_EXTERNA",
               "MODULO_CIVIL", "MODULO_LABORAL", "MESA_DE_PARTES", "SALA_SUPERIOR"],
    motivos: ["REMISION_FINAL", "CIERRE_EXPEDIENTE", "ARCHIVO_DEFINITIVO", "TRANSFERENCIA_DEFINITIVA",
              "ORDENAMIENTO", "ARCHIVO"],
    estados: ["ENTREGADO", "ENVIADO_DEFINITIVO"]
  }
};

// Estado por defecto para TODAS las salidas: "ENTREGADO"
function obtenerEstadoSalidaPorDefecto(tipo_salida) {
  return "ENTREGADO";
}
```

### Frontend (ModalRegistrarSalida.js)
```javascript
PARA_ARCHIVO: {
  destinos: ["MODULO_CIVIL", "MODULO_LABORAL", "MESA_DE_PARTES", "SALA_SUPERIOR"],
  motivos: ["ORDENAMIENTO", "ARCHIVO"],
  estados: ["ENTREGADO"]
}
```

---

## 13) Menú lateral

```javascript
menus: {
  operaciones: [
    { key: "dashboard", label: "Dashboard", iconName: "dashboard" },
    { key: "registro", label: "Registrar expedientes", iconName: "registro" },
    { key: "expedientes", label: "Ver expedientes", iconName: "expedientes" }
  ],
  gestion: [
    { key: "ubicaciones", label: "Gestión de ubicaciones", iconName: "ubicaciones" },
    { key: "paquetes", label: "Gestión de paquetes", iconName: "paquetes",
      children: [
        { key: "paquetes-general", label: "Archivo General", iconName: "archiveBox" },
        { key: "paquetes-modular", label: "Archivo Modular", iconName: "package" }
      ]
    }
  ],
  movimientos: [
    { key: "movimientos-modular", label: "Historial de Movimientos", iconName: "history" },
    { key: "movimientos", label: "Actualización de datos", iconName: "transfer" },
    { key: "salidas-archivo", label: "Salidas al Archivo", iconName: "archiveBox" }
  ],
  sistema: [
    { key: "configuracion", label: "Configuración", iconName: "configuracion" }
  ]
}
```

---

## 14) Notas técnicas importantes

### Métodos y convenciones

1. **`listarMovimientos()` en `expedienteService.js` es ASYNC** → Siempre usar `await`
2. **`registrarMovimiento()`** → Envía al backend (`movimientos_expediente`)
3. **`_registrarMovimientoLocal()`** → Guarda en localStorage (legacy, solo para compatibilidad)
4. **Endpoints recomendados para listados**:
   - `listar_expedientes_ligero` → Catálogos y búsquedas
   - `listar_expedientes_paginado` → Listado principal con paginación
5. **Worker URL**: `https://proxy-apps-script.ln142843.workers.dev`
6. **Roles**: `ROL0005` = Especialista, `ROL0006` = Asistente
7. **Estados de expediente**: 1=REGISTRADO, 5=SUBSANADO, 7=APROBADO, 10=ARCHIVADO, 11=PRESTAMO, 12=ASIGNADO, 13=RETORNADO
8. **Para paquetes**: `PARA_ARCHIVO` se mapea a `ENVIO_DEFINITIVO` en el backend
9. **Estado por defecto**: `ENTREGADO` para todas las salidas
10. **Destinos para paquetes**: `MODULO_CIVIL`, `MODULO_LABORAL`, `MESA_DE_PARTES`, `SALA_SUPERIOR`

### Diferencias clave entre hojas de historial

| Característica | `movimientos_expediente` | `salida_archivo_general` |
|---|---|---|
| ¿Qué registra? | Movimientos individuales | Salidas de paquetes/grupos |
| ¿Quién lo dispara? | `listadoPageBackend.js` | `ArchivoGeneralPage.js` |
| ¿Tiene rótulo? | No | Sí (`rotulo_salida`) |
| ¿Tiene grupo? | No | Sí (`id_grupo`) |
| ¿Afecta expedientes? | Uno a la vez | Todos los del grupo |

### Configuración de caché

```javascript
const CACHE_EXPEDIENTES_TIME = 1800000;  // 30 minutos
const CACHE_CATALOGOS_TIME = 3600000;    // 1 hora
```

### Precarga del sistema

Se ejecuta **2 segundos después del login exitoso** en `loginPage.js`:
- 8 catálogos en paralelo
- Guarda en localStorage para acceso rápido

---

## 15) Patrones de código

### Llamada a endpoint ligero (frontend)

```javascript
const resultado = await expedienteService.listarLigeroDelBackend();
// resultado.data → array con solo 10 campos por expediente
```

### Llamada paginada (frontend)

```javascript
const resultado = await expedienteService.listarPaginadoDelBackend({
  pagina: 1,
  limite: 25,
  filtro: "2024"
});
// resultado.data → 25 expedientes
// resultado.total → 4230
// resultado.totalPaginas → 170
```

### Registro de movimiento individual (frontend)

```javascript
await expedienteService.registrarMovimiento({
  id_expediente: "EXP-4074",
  tipo_movimiento: "PRESTAMO",
  ubicacion_origen: "Archivo Modular",
  ubicacion_destino: "Asistente",
  realizado_por: "76931166 - Luis Navarro"
});
```

### Registro de salida de paquete (frontend)

```javascript
await archivoGeneralService.registrarSalida({
  id_grupo: "GRP-0001",
  tipo_salida: "ENVIO_DEFINITIVO",  // PARA_ARCHIVO se mapea a esto
  destino_salida: "MODULO_CIVIL",
  responsable_entrega: "USR-0001 - Luis Navarro",
  responsable_recepcion: "USR-0012 - Wilverder Zavaleta",
  motivo_salida: "ARCHIVO",
  estado_salida: "ENTREGADO",
  realizado_por: "USR-0001 - Luis Navarro"
});
```

### Nuevo endpoint (backend)

```javascript
// En Código.gs (doGet):
case "nuevo_endpoint":
  resultado = NuevoService.metodo(e.parameter.id || null);
  break;

// En NuevoService.gs:
const NuevoService = {
  metodo(id) {
    const cached = SheetCache.get(SHEET_CONFIG.TABLA);
    return { success: true, data: resultado };
  }
};
```

---

## 16) Resolución de problemas comunes

| Problema | Causa | Solución |
|---|---|---|
| Modal no abre | `getElementById` es null | Usar `await new Promise(r => requestAnimationFrame(r))` |
| "No hay datos" en tabla | Caché vacío | Limpiar localStorage o usar `forceRefresh: true` |
| `listarMovimientos()` no es función | No se usó `await` | Agregar `await` y hacer la función `async` |
| CORS error | URL directa a Google | Usar URL del Worker |
| `registrar_movimiento` no funciona | Método duplicado | Usar `async registrarMovimiento()` para backend, `_registrarMovimientoLocal()` para localStorage |
| Tabla vacía | No se renderizó HTML | Verificar `tabExpedientes.innerHTML` en `cargarExpedientesSinGrupo` |
| Asistentes no aparecen | Falta endpoint | Agregar `listar_asistentes_activos` en `doGet` |
| "Estado ENTREGADO no permitido" | `REGLAS_SALIDA` sin ENTREGADO | Agregar "ENTREGADO" a los arrays de estados en `validaciones.gs` |
| Cursor se sale del input | Filtro en cada `input` | Usar `keydown` con `Enter` o botón "Buscar" |
| `PARA_ARCHIVO` no reconocido | Tipo no existe en backend | Mapear `PARA_ARCHIVO → ENVIO_DEFINITIVO` en frontend |
| Modal de salida lento | Carga catálogos cada vez | Usar `Promise.all` para carga paralela |
| Columna Estado Sistema vacía | Seguimientos no precargados | Ejecutar `precargarSeguimientos()` al iniciar página |
| Destino no permitido para paquete | Destinos incorrectos en reglas | Usar `MODULO_CIVIL`, `MODULO_LABORAL`, `MESA_DE_PARTES`, `SALA_SUPERIOR` |

---
