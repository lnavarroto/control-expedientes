# ARQUITECTURA - Sistema de Archivo Civil Sullana

## 🔄 Flujo de Comunicación

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (HTML + JS)                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    pages/                                    │  │
│  │  ├── index.html (core)                                       │  │
│  │  ├── login.html                                              │  │
│  │  ├── dashboard.html (panel.html)                             │  │
│  │  ├── nuevo-registro.html (Módulo EXPEDIENTES)               │  │
│  │  ├── busqueda.html (Búsqueda)                                │  │
│  │  └── lectora.html (Ubicaciones/Movimientos)                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↕ FETCH API                             │
│                         ┌──────────────┐                             │
│                         │ googleSheetsAPI.js                        │
│                         │  - crearExpedienteFE()                    │
│                         │  - actualizarUbicacionFE()                │
│                         │  - registrarMovimientoFE()                │
│                         └──────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
                                ↓↑
                          HTTPS POST/GET
                                
┌─────────────────────────────────────────────────────────────────────┐
│                   GOOGLE APPS SCRIPT (WEB APP)                      │
│  URL: https://script.google.com/macros/.../exec                    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Code.gs                                 │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           │  │
│  │  │ doPost │  │ doGet  │  │ switch │  │ action │           │  │
│  │  │   ()   │  │  ()    │  │(action)│  │ routes │           │  │
│  │  └────────┘  └────────┘  └────────┘  └────────┘           │  │
│  │       ↓           ↓            ↓            ↓               │  │
│  │  ┌─────────────────────────────────────────────────┐      │  │
│  │  │     LÓGICA DE NEGOCIOS (Funciones)             │      │  │
│  │  │                                                 │      │  │
│  │  │  USUARIOS:                                      │      │  │
│  │  │  ├─ crearUsuario()                              │      │  │
│  │  │  ├─ actualizarUsuario()                         │      │  │
│  │  │  ├─ listarUsuarios()                            │      │  │
│  │  │  └─ obtenerUsuarioPorDNI()                      │      │  │
│  │  │                                                 │      │  │
│  │  │  EXPEDIENTES:                                   │      │  │
│  │  │  ├─ crearExpediente()                           │      │  │
│  │  │  ├─ actualizarEstadoExpediente()                │      │  │
│  │  │  ├─ actualizarUbicacionExpediente()             │      │  │
│  │  │  ├─ listarExpedientes()                         │      │  │
│  │  │  ├─ obtenerExpedientePorCodigo()                │      │  │
│  │  │  └─ buscarExpedientes()                         │      │  │
│  │  │                                                 │      │  │
│  │  │  MOVIMIENTOS:                                   │      │  │
│  │  │  ├─ registrarMovimiento()                       │      │  │
│  │  │  └─ listarMovimientosPorExpediente()            │      │  │
│  │  └─────────────────────────────────────────────────┘      │  │
│  │       ↓                                                     │  │
│  │  ┌─────────────────────────────────────────────────┐      │  │
│  │  │      UTILIDADES CORE                           │      │  │
│  │  │  ├─ getSheet(), getHeaders()                   │      │  │
│  │  │  ├─ getSheetData(), mapRowToObject()           │      │  │
│  │  │  ├─ generarID()                                │      │  │
│  │  │  ├─ buscarValorEnSheet()                       │      │  │
│  │  │  └─ respuestaExito/Error()                     │      │  │
│  │  └─────────────────────────────────────────────────┘      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓↑                                      │
│                       SpreadsheetApp API                             │
└─────────────────────────────────────────────────────────────────────┘
                                ↓↑
┌─────────────────────────────────────────────────────────────────────┐
│                     GOOGLE SHEETS (BASE DE DATOS)                   │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Hoja "usuarios"           │ Hoja "juzgados"               │    │
│  │ ├─ id_usuario             │ ├─ id_juzgado                 │    │
│  │ ├─ dni                    │ ├─ nombre_juzgado             │    │
│  │ ├─ nombres, apellidos     │ └─ ...                        │    │
│  │ └─ ...                    │                               │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Hoja "expedientes" (PRINCIPAL)                              │    │
│  │ ├─ id_expediente                                            │    │
│  │ ├─ numero_expediente, codigo_expediente_completo            │    │
│  │ ├─ id_juzgado (FK → juzgados)                              │    │
│  │ ├─ id_estado (FK → estados_expediente)                      │    │
│  │ ├─ id_ubicacion_actual (FK → ubicaciones)                   │    │
│  │ ├─ id_paquete (FK → paquetes)                               │    │
│  │ ├─ registrado_por (FK → usuarios)                           │    │
│  │ └─ ...                                                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Hoja "movimientos_expediente" (TRAZABILIDAD)                │    │
│  │ ├─ id_movimiento                                            │    │
│  │ ├─ id_expediente (FK → expedientes)                         │    │
│  │ ├─ tipo_movimiento (TRASLADO, CAMBIO_ESTADO, etc)           │    │
│  │ ├─ ubicacion_origen, ubicacion_destino                      │    │
│  │ ├─ estado_anterior, estado_nuevo                            │    │
│  │ ├─ realizado_por (FK → usuarios)                            │    │
│  │ └─ fecha_hora_movimiento                                    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  + materias, ubicaciones, estados_expediente, paquetes...           │
│  + parametros_sistema, auditoria                                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Estructura de Datos (ERD Simplificado)

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│    USUARIOS     │         │    JUZGADOS      │         │    MATERIAS     │
├─────────────────┤         ├──────────────────┤         ├─────────────────┤
│ id_usuario (PK) │         │ id_juzgado (PK)  │         │ id_materia (PK) │
│ dni (UNIQUE)    │         │ nombre_juzgado   │         │ codigo_materia  │
│ nombres         │         │ codigo_juzgado   │         │ nombre_materia  │
│ apellidos       │         │ tipo_juzgado     │         │ ...             │
│ correo          │◄────┐   │ ...              │         └─────────────────┘
│ rol             │     │   └──────────────────┘                ▲
│ ...             │     │                                       │
└─────────────────┘     │                                       │
         ▲              │   ┌──────────────────────────────────┼──────────┐
         │              │   │       EXPEDIENTES (CENTRAL)      │          │
         │              │   ├──────────────────────────────────┼──────────┤
         │              │   │ id_expediente (PK)               │          │
         │              │   │ numero_expediente                │          │
         │              └───┼─ id_juzgado (FK: JUZGADOS)       │          │
         │                  │ codigo_materia (FK: MATERIAS)    │          │
         │4               │ id_estado (FK: ESTADOS)          │          │
         │                  │ id_ubicacion_actual (FK: UBICAC) │          │
         ├─────────────────┼─ registrado_por (FK: USUARIOS)    │          │
         │                  │ id_paquete (FK: PAQUETES)        │          │
         │                  │ fecha_creacion                   │          │
         │                  │ ...                              │          │
         │                  └──────────────────────────────────┼──────────┘
         │                                                      │
         │   ┌──────────────────────────────────────────┐      │
         │   │    MOVIMIENTOS_EXPEDIENTE                │      │
         │   ├──────────────────────────────────────────┤      │
         │   │ id_movimiento (PK)                       │      │
         └───┼─ realizado_por (FK: USUARIOS)            │      │
             │ id_expediente (FK: EXPEDIENTES)◄────────┤      │
             │ tipo_movimiento (TRASLADO, etc)         │      │
             │ estado_anterior, estado_nuevo           │      │
             │ ubicacion_origen, ubicacion_destino     │      │
             │ fecha_hora_movimiento                   │      │
             │ ...                                      │      │
             └──────────────────────────────────────────┘      │
                                                                │
┌──────────────────────┐  ┌──────────────────┐  ┌─────────────┘
│   UBICACIONES        │  │    ESTADOS       │  │
├──────────────────────┤  ├──────────────────┤  │
│ id_ubicacion (PK)    │  │ id_estado (PK)   │  │
│ codigo_ubicacion     │  │ nombre_estado    │  │
│ nombre_ubicacion     │  │ color_badge      │  │
│ tipo_ubicacion       │  │ ...              │  │
│ ...                  │  └──────────────────┘  │
└──────────────────────┘                        │
         ▲                                       │
         │       ┌────────────────────────────────┤
         └───────┼─ Referenciado en EXPEDIENTES  │
                 │ y MOVIMIENTOS                │
                 └─────────────────────────────────
```

---

## 🔌 Flujo de Crear Expediente (Ejemplo Completo)

```
USUARIO                FRONTEND             API (Apps Script)      GOOGLE SHEETS
   │                      │                         │                    │
   │─ Rellena form ───────→│                         │                    │
   │                      │                         │                    │
   │                      │─ parseForm() ───────→   │                    │
   │                      │ datos + validación      │                    │
   │                      │                         │                    │
   │                      │─ POST /crear_expediente │                    │
   │                      │ {numero, juzgado, ...}  │                    │
   │                      │                         │──→ crearExpediente()│
   │                      │                         │    + validaciones   │
   │                      │                         │    + generar ID     │
   │                      │                         │                    │
   │                      │                         │    Buscar juzgado en│
   │                      │                         │    sheet juzgados   │
   │                      │                         │ ───────────────────→
   │                      │                         │←─────────────────────
   │                      │                         │    nombre_juzgado
   │                      │                         │                    │
   │                      │                         │    getSheet("exped")│
   │                      │                         │    appendRow(fila)  │
   │                      │                         │ ───────────────────→
   │                      │                         │←─────────────────────
   │                      │                         │    ✅ Nueva fila
   │                      │                         │                    │
   │                      │←─ respuestaExito()      │                    │
   │                      │  {success, data}        │                    │
   │                      │                         │                    │
   │←──── showToast() ────│                         │                    │
   │  ✅ "Expediente creado"                       │                    │
   │                                                │                    │
   └────────────────────────────────────────────────────────────────────
```

---

## 🔐 Respuestas Estandarizadas

### ✅ Éxito

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "id_expediente": "EXP-1234567890-1234",
    "numero_expediente": "00123",
    "codigo_expediente_completo": "00123-2026-1-3101-CI-01",
    "id_juzgado": "JZ-001",
    "juzgado_texto": "Juzgado Civil Primero",
    ...
  }
}
```

### ❌ Error

```json
{
  "success": false,
  "error": "Número de expediente requerido",
  "code": 400
}
```

---

## 📱 Integración con Módulos Frontend

### Módulo: NUEVA REGISTRACIÓN
```
registroPage.js
├─ form submit event
├─ parseForm() → getData
├─ crearExpedienteFE(getData) ← googleSheetsAPI
├─ response → showToast + modal
└─ reinit form
```

### Módulo: BÚSQUEDA
```
busquedaPage.js
├─ filter inputs
├─ btnExecutar → buildFilters
├─ buscarExpedientesFE(filtros) ← googleSheetsAPI
├─ buildTable(resultados)
└─ bindActionButtons
```

### Módulo: UBICACIONES/MOVIMIENTOS
```
ubicacionesPage.js
├─ select expediente
├─ form ubicación
├─ form submit
├─ actualizarUbicacionExpedienteFE() ← googleSheetsAPI
├─ registrarMovimientoFE() (auto)
├─ refreshHistorial()
└─ listarMovimientosFE()
```

---

## 🚀 Pasos de Deployment

1. **Apps Script creado** ✅
2. **Código pegado** ✅
3. **CONFIG.SPREADSHEET_ID actualizado** ✅
4. **Deploy como Web App (Anyone)** ✅
5. **URL copiada** ✅
6. **googleSheetsAPI.js importado en index.html** ⏳

```html
<!-- En index.html antes de </body> -->
<script src="assets/js/utils/googleSheetsAPI.js"></script>
```

7. **API_CONFIG.BASE_URL actualizado** ⏳
8. **Testing básico (testConexion())** ⏳
9. **Integración en cada módulo** ⏳

---

## 📋 Checklist de Integración

### Backend (Google Apps Script)
- [ ] Code.gs creado
- [ ] CONFIG_SPREADSHEET_ID correcto
- [ ] Todas las hojas existen con headers
- [ ] Deploy como Web App
- [ ] URL deployment copiada
- [ ] Probado con: curl / Postman / Consola

### Frontend
- [ ] googleSheetsAPI.js importado
- [ ] API_CONFIG.BASE_URL actualizado
- [ ] Cada módulo importa y usa funciones:
  - [ ] registroPage: crearExpedienteFE()
  - [ ] busquedaPage: buscarExpedientesFE()
  - [ ] ubicacionesPage: actualizarUbicacionExpedienteFE()

### Datos
- [ ] Usuarios creados en hoja "usuarios"
- [ ] Juzgados en hoja "juzgados"
- [ ] Materias en hoja "materias"
- [ ] Ubicaciones en hoja "ubicaciones"
- [ ] Estados en hoja "estados_expediente"

---

## 🎯 Próximas Fases

### FASE 2: Autenticación & Sesiones
- Login con Google
- Tokens JWT
- Permisos por rol

### FASE 3: Paquetes
- Asignación de expedientes
- Seguimiento de paquetes

### FASE 4: Auditoría
- Logs de cambios
- Trail completo

### FASE 5: Reportes
- Estadísticas
- Exportar a Excel

---

**Documento**: Arquitectura Sistema Archivo Civil Sullana
**Versión**: 1.0
**Fecha**: 15 Abril 2026
