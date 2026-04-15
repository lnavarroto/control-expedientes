# Sistema de Archivo - Integración Backend (Google Apps Script)

## 📋 ÍNDICE
1. [Configuración inicial](#configuración-inicial)
2. [Estructura del Code.gs](#estructura-del-codegs)
3. [Endpoints disponibles](#endpoints-disponibles)
4. [Ejemplos de uso](#ejemplos-de-uso)
5. [Guía de troubleshooting](#guía-de-troubleshooting)

---

## 🔧 Configuración inicial

### PASO 1: Crear Google Apps Script

1. Ve a [script.google.com](https://script.google.com)
2. Crea un **Nuevo proyecto**
3. Nómbralo: `archivo-backend-api`
4. Pega el contenido de `backend/Code.gs`
5. **IMPORTANTE**: Actualiza `CONFIG.SPREADSHEET_ID` con tu ID de Sheets

### PASO 2: Obtener Spreadsheet ID

1. Abre tu Google Sheet
2. La URL será: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
3. Copia el ID (la cadena larga entre `/d/` y `/edit`)
4. Pégalo en Code.gs línea 11

```javascript
const CONFIG = {
  SPREADSHEET_ID: "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p", // ← Reemplaza aquí
  // ...
};
```

### PASO 3: Desplegar como Web App

1. En Apps Script, haz click en **Deploy** (arriba a la derecha)
2. Selecciona **New deployment**
3. Tipo: **Web app**
4. **Execute as**: Tu cuenta Google
5. **Who has access**: **Anyone**
6. Haz click en **Deploy**
7. Copia la URL que aparece (p.ej: `https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercontent/exec`)

### PASO 4: Configurar Frontend

1. En tu frontend, abre `assets/js/utils/googleSheetsAPI.js`
2. Localiza línea ~18:
```javascript
const API_CONFIG = {
  BASE_URL: "https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercontent/exec",
  // ↑ Reemplaza con tu URL de deployment
};
```

---

## 📦 Estructura del Code.gs

```
Code.gs
├── CONFIG (Configuración central)
├── doPost() / doGet() (Entry Points)
├── FUNCIONES UTILITARIAS
│  ├── getSpreadsheet()
│  ├── getSheet()
│  ├── getHeaders()
│  ├── mapRowToObject()
│  ├── getSheetData()
│  ├── generarID()
│  └── respuestaExito() / respuestaError()
├── USUARIOS
│  ├── crearUsuario()
│  ├── actualizarUsuario()
│  ├── listarUsuarios()
│  └── obtenerUsuarioPorDNI()
├── EXPEDIENTES
│  ├── crearExpediente()
│  ├── actualizarEstadoExpediente()
│  ├── actualizarUbicacionExpediente()
│  ├── listarExpedientes()
│  ├── obtenerExpedientePorCodigo()
│  ├── obtenerExpedientePorId()
│  └── buscarExpedientes()
├── MOVIMIENTOS
│  ├── registrarMovimiento()
│  ├── registrarMovimientoInterno()
│  └── listarMovimientosPorExpediente()
└── DATOS MAESTROS (Read-only)
   ├── listarJuzgados()
   ├── listarMaterias()
   ├── listarUbicaciones()
   └── listarEstados()
```

---

## 🔌 Endpoints disponibles

### USUARIOS

#### GET - Listar todos
```
https://script.google.com/.../exec?action=listar_usuarios
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id_usuario": "USR-1234567890-1234",
      "dni": "12345678",
      "nombres": "Juan",
      "apellidos": "Pérez",
      "correo": "juan@email.com",
      "rol": "Archivador",
      "activo": "SI",
      "fecha_creacion": "2026-04-15T10:30:00"
    }
  ]
}
```

#### GET - Por DNI
```
https://script.google.com/.../exec?action=obtener_usuario_por_dni&dni=12345678
```

#### POST - Crear
```javascript
fetch(API_URL, {
  method: "POST",
  payload: JSON.stringify({
    action: "crear_usuario",
    dni: "12345678",
    nombres: "Juan",
    apellidos: "Pérez",
    correo: "juan@email.com",
    cargo: "Archivador",
    rol: "Archivador"
  })
})
```

#### POST - Actualizar
```javascript
fetch(API_URL, {
  method: "POST",
  payload: JSON.stringify({
    action: "actualizar_usuario",
    id_usuario: "USR-1234567890-1234",
    correo: "newemail@email.com",
    cargo: "Jefe de Archivo"
  })
})
```

---

### EXPEDIENTES

#### GET - Listar todos
```
https://script.google.com/.../exec?action=listar_expedientes
```

#### GET - Por código
```
https://script.google.com/.../exec?action=obtener_expediente_por_codigo&codigo=00123-2026-1-3101-CI-01
```

#### GET - Por ID
```
https://script.google.com/.../exec?action=obtener_expediente_por_id&id=EXP-1234567890-1234
```

#### GET - Buscar con filtros
```
https://script.google.com/.../exec?action=buscar_expedientes&numero=00123&id_juzgado=JZ-001&id_estado=EST-001&activo=SI
```

#### POST - Crear
```javascript
fetch(API_URL, {
  method: "POST",
  payload: JSON.stringify({
    action: "crear_expediente",
    numero_expediente: "00123",
    anio: "2026",
    incidente: "0",
    codigo_corte: "3101",
    tipo_organo: "1",
    codigo_materia: "CI",
    id_juzgado: "JZ-001",
    id_ubicacion_actual: "UB-001",
    origen_registro: "LECTORA",
    registrado_por: "USR-001",
    observaciones: "Expediente importante"
  })
})
```

#### POST - Cambiar estado
```javascript
fetch(API_URL, {
  method: "POST",
  payload: JSON.stringify({
    action: "actualizar_estado_expediente",
    id_expediente: "EXP-1234567890-1234",
    id_estado: "EST-002",
    motivo: "Cambio administrativo"
  })
})
```

#### POST - Cambiar ubicación
```javascript
fetch(API_URL, {
  method: "POST",
  payload: JSON.stringify({
    action: "actualizar_ubicacion_expediente",
    id_expediente: "EXP-1234567890-1234",
    id_ubicacion_actual: "UB-002",
    motivo: "Movimiento a estante B"
  })
})
```

---

### MOVIMIENTOS

#### GET - Listar por expediente
```
https://script.google.com/.../exec?action=listar_movimientos_por_expediente&expediente_id=EXP-1234567890-1234
```

#### POST - Registrar
```javascript
fetch(API_URL, {
  method: "POST",
  payload: JSON.stringify({
    action: "registrar_movimiento",
    id_expediente: "EXP-1234567890-1234",
    tipo_movimiento: "TRASLADO",
    ubicacion_origen: "UB-001",
    ubicacion_destino: "UB-002",
    motivo: "Traslado por solicitud",
    observacion: "Expediente importante",
    realizado_por: "USR-001"
  })
})
```

---

### DATOS MAESTROS

#### GET - Juzgados
```
https://script.google.com/.../exec?action=listar_juzgados
```

#### GET - Materias
```
https://script.google.com/.../exec?action=listar_materias
```

#### GET - Ubicaciones
```
https://script.google.com/.../exec?action=listar_ubicaciones
```

#### GET - Estados
```
https://script.google.com/.../exec?action=listar_estados
```

---

## 💻 Ejemplos de uso

### En tu HTML form, agregar listeners que llamen a la API

#### Ejemplo: Registro de nuevo expediente

```javascript
// En registroPage.js, modificar el addEventListener del submit:

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  
  // Obtener datos del formulario
  const datosForm = parseForm(form);
  
  try {
    // Llamar API
    const expediente = await crearExpedienteFE(datosForm);
    
    // Confirmar
    openModal({
      title: "✅ Expediente creado",
      content: `<p>Código: <strong>${expediente.codigo_expediente_completo}</strong></p>`,
      confirmText: "OK",
      onConfirm: (close) => {
        close();
        initRegistroPage({ mountNode });
      }
    });
  } catch (error) {
    showToast(`❌ Error: ${error.message}`, "error");
  }
});
```

#### Ejemplo: Búsqueda avanzada

```javascript
// En busquedaPage.js:

const ejecutar = async () => {
  try {
    const filtros = getFiltros();
    const resultado = await buscarExpedientesFE(filtros);
    
    document.getElementById("resultado-busqueda").innerHTML = buildTable(resultado);
    showToast(`✅ ${resultado.length} expediente(s) encontrado(s)`, "success");
    bindActionButtons();
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
};
```

#### Ejemplo: Cambiar ubicación de expediente

```javascript
// En ubicacionesPage.js, en el submit del form:

formUbicacion.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  try {
    const expedienteId = selectExpediente.value;
    const nuevaUbicacion = document.querySelector("select[name='ubicacion_destino']").value;
    const motivo = document.querySelector("input[name='motivo']").value;
    
    await actualizarUbicacionExpedienteFE(expedienteId, nuevaUbicacion, motivo);
    
    // Refrescar datos
    const movimientos = await listarMovimientosFE(expedienteId);
    document.getElementById("historial-contenedor").innerHTML = renderHistorial(movimientos);
  } catch (error) {
    showToast(`❌ ${error.message}`, "error");
  }
});
```

---

## 🐛 Guía de troubleshooting

### Error: "PERMISSION_DENIED"
**Causa**: El Apps Script no tiene permisos en la hoja
**Solución**: 
1. Asegúrate de haber ejecutado el script al menos una vez
2. Autoriza el acceso a Google Sheets cuando lo pida
3. Redeploy el web app

### Error: "Hoja no encontrada"
**Causa**: El nombre de la hoja es incorrecto o tiene espacios
**Solución**:
1. Verifica exactamente el nombre de la hoja en CONFIG.SHEETS
2. Los nombres son case-sensitive
3. No incluyas espacios al inicio/final

### Error: "Headers no coinciden"
**Causa**: La estructura de la hoja cambió
**Solución**:
1. Verifica que la primera fila tiene headers exactos
2. No elimines ni reorganices columnas
3. Usa el archivo de estructura proporcionado

### Error: "Expediente ya existe"
**Causa**: El número de expediente ya está registrado
**Solución**:
1. Usa un número diferente
2. O modifica el código para permitir duplicados

### Response: "success": false
**Causa**: Algún campo faltante o inválido
**Solución**:
1. Revisa los campos requeridos en la documentación
2. Asegúrate de enviar los datos en formato correcto
3. Usa console.log para debuggear qué se envía

### Las fechas aparecen con número extraño
**Causa**: Google Sheets interno almacena fechas como números
**Solución**:
1. En el frontend, formatea la fecha: `new Date(fecha * 86400000)`
2. O usa el formateador: `formatoFechaHora(fecha, hora)`

---

## ✅ Checklist de configuración

- [ ] Apps Script creado
- [ ] CONFIG.SPREADSHEET_ID actualizado en Code.gs
- [ ] Web app desplegado como "Anyone"
- [ ] URL de deployment kopied
- [ ] API_CONFIG.BASE_URL actualizado en googleSheetsAPI.js
- [ ] googleSheetsAPI.js importado en index.html
- [ ] Estructura de hojas en Google Sheets coincide con CONFIG.SHEETS
- [ ] Primera fila de cada hoja tiene headers
- [ ] Tested al menos una llamada GET (listar_juzgados)

---

## 🚀 Próximos pasos (FASE 2)

- [ ] Agregar autenticación/sesiones
- [ ] Implementar auditoría de cambios
- [ ] Agregar paquetes (asignación de expedientes)
- [ ] Reportes avanzados
- [ ] Sincronización offline
- [ ] Caching en localStorage

---

**Última actualización**: 15 de abril de 2026
**Versión**: 1.0 FASE 1
