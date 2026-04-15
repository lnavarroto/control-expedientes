# 📱 Sistema Bimodal: Lectura Manual y por Lectora Física

## ✅ Completado

### 1. **Parser de Lectora** (`assets/js/utils/lectora.js`)
- ✅ Función `parsearLectora(codigo)` que convierte códigos de 20-23 dígitos al formato estándar
- ✅ Función `detectarFormatoExpediente(valor)` para auto-detectar formato de entrada
- ✅ Función `procesarExpediente(valor)` para procesar en modo automático
- ✅ Mapeo de tipos de juzgado: 32→SP, 35→JP, 24→JM, otros→JR
- ✅ Mapeo de especialidades: 4→LA (Laboral), 5→FC (Familia), otros→CI (Civil)
- ✅ Validación de caso real del usuario: ✓ `22023007933101334000201` → `00793-2023-0-3101-JR-LA-01`

### 2. **Módulo Registro de Expedientes** (`assets/js/modules/expedientes/registroPage.js`)
- ✅ Toggle **🖱️ Manual** vs **📱 Lectora** en encabezado
- ✅ Campo de entrada dual con feedback visual diferenciado:
  - 🖱️ Manual: espera formato estándar o autocompletado desde número
  - 📱 Lectora: auto-parsea códigos de 20-23 dígitos
- ✅ Iconos diferenciadores en chip de validación
- ✅ Colores diferenciados: Esmeralda (manual) vs Cielo (lectora)
- ✅ Feedback contextualizado para cada modo
- ✅ Auto-limpiar entrada al cambiar de modo

### 3. **Módulo Búsqueda** (`assets/js/modules/busqueda/busquedaPage.js`)
- ✅ Rediseño de interfaz con entrada dual en sección destacada
- ✅ Toggle **🖱️ Manual** vs **📱 Lectora** en header
- ✅ Campo de búsqueda principal con parseo automático
- ✅ Feedback visual y chip de estado
- ✅ Integración con filtros avanzados existentes
- ✅ Búsqueda por número normalizado después de parsear código lettora

### 4. **Módulo Ubicaciones (Movimientos)** (`assets/js/modules/ubicaciones/ubicacionesPage.js`)
- ✅ Entrada dual manual/lectora para seleccionar expediente
- ✅ Toggle **🖱️ Manual** vs **📱 Lectora** en header
- ✅ Auto-búsqueda en lista de expedientes cuando se escanea
- ✅ Feedback de parsing con actualización automática del select
- ✅ Actualización de historial cuando se selecciona de la entrada
- ✅ Botón "Limpiar" adicional para reset rápido

## 🎨 Interfaz Visual

### Iconografía
- **🖱️ Manual:** Entrada de formato estándar (ej: `00793-2023-0-3101-JR-LA-01`)
- **📱 Lectora:** Entrada de códigos de barras (ej: `22023007933101334000201`)

### Feedback Visual
| Estado | Manual | Lectora | Color | Icono |
|--------|--------|---------|-------|-------|
| Pendiente | 🖱️ Pendiente | 📱 Pendiente | Slate | • |
| Válido | 🖱️ Válido | 📱 Válido | Cielo | ✓ |
| Parseado | — | 📱 Parseado | Verde | ✓ |
| Inválido | 🖱️ Inválido | 📱 Inválido | Rosa | ✗ |

### Mensajes Contextuales
- **Manual:** "Ingrese el número para activar autocompletado"
- **Lectora:** "Escanee o ingrese el código de 20-23 dígitos de la lectora"
- **Parseado:** "Convertido a: [número normalizado]"

## 🔄 Flujo de Trabajo Dual

### Entrada Manual (🖱️)
```
Usuario escribe número estándar
        ↓
Validación de formato
        ↓
Auto-búsqueda si existe
        ↓
Autocompletado de campos
```

### Entrada por Lectora (📱)
```
Usuario escanea código de barras (20-23 dígitos)
        ↓
Auto-parseo a formato estándar
        ↓
Actualización de campo con formato normalizado
        ↓
Auto-búsqueda del expediente
        ↓
Autocompletado de campos
```

## 📊 Especificación del Formato

### Entrada (Código Bruto de Lectora)
- **Longitud:** 20 o 23 dígitos
- **Formato:** `[prefijo?]PPPPPNNNNNNAAAABBBBCCCCDDNNNN`
- **Ejemplo:** `22023007933101334000201`

### Salida (Formato Normalizado)
- **Formato:** `NNNNN-AAAA-0-BBBB-TT-MM-DD`
- **Componentes:**
  - `NNNNN`: Número de expediente (5 dígitos)
  - `AAAA`: Año (4 dígitos)
  - `0`: Dígito verificador (fijo)
  - `BBBB`: Código de corte (fijo: 3101)
  - `TT`: Tipo de juzgado (SP/JP/JM/JR)
  - `MM`: Especialidad (LA/FC/CI)
  - `DD`: Número de juzgado (2 dígitos)
- **Ejemplo:** `00793-2023-0-3101-JR-LA-01`

## 🧪 Validación

✅ **Caso Real Confirmado del Usuario:**
- Input: `22023007933101334000201`
- Output: `00793-2023-0-3101-JR-LA-01`
- Status: **FUNCIONA CORRECTAMENTE**

## 📁 Archivos Modificados

1. **assets/js/utils/lectora.js** (NUEVO)
   - Parser principal con 3 funciones exportadas

2. **assets/js/modules/expedientes/registroPage.js**
   - Integración de parser
   - Iconos diferenciadores en feedback
   - Toggle manual/lectora

3. **assets/js/modules/busqueda/busquedaPage.js**
   - Entrada dual de expediente
   - Parseo automático
   - Feedback contextualizado

4. **assets/js/modules/ubicaciones/ubicacionesPage.js**
   - Entrada dual para selección de expediente
   - Auto-búsqueda al parsear
   - Actualización de historial

## 🚀 Próximas Mejoras (Opcionales)

- [ ] Agregar más casos de test con ejemplos reales del usuario
- [ ] Implementar historial de códigos escaneados recientemente
- [ ] Sonido de confirmación al parsear correctamente
- [ ] Modo "escaneo rápido" con enter automático
- [ ] Listado de expedientes por código de barras múltiple (paquetes)
- [ ] Reportes de lecturas por usuario y fecha

## 📝 Notas

- El parser es flexible y acepta ambos formatos (20 y 23 dígitos)
- El único caso confirmado firmemente es el del usuario
- Se recomienda recopilar más ejemplos reales para validación completa
- Todos los módulos mantienen coherencia visual y de UX
