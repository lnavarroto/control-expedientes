# 📚 Guía de Uso: Sistema Bimodal Manual/Lectora

## Inicio Rápido

### Módulo: Nuevo Registro

#### Opción 1: Entrada Manual (🖱️)
```
1. Haz clic en botón "🖱️ Manual" (ya lo está)
2. Escribe el número de expediente: 00793-2023-0-3101-JR-LA-01
3. Campo mostrará: "🖱️ Válido" (verde)
4. Campos judiciales se autocompletan automáticamente
5. Confirma y guarda
```

#### Opción 2: Entrada por Lectora (📱)
```
1. Haz clic en botón "📱 Lectora"
2. Campo pasará a modo lectora (fondo destacado)
3. Escanea el código de barras del expediente
4. Sistema automáticamente:
   - Parsea: 22023007933101334000201 (23 dígitos)
   - Convierte a: 00793-2023-0-3101-JR-LA-01
   - Muestra: "📱 Parseado"
   - Autocompleta campos judiciales
5. Confirma y guarda
```

### Módulo: Búsqueda

#### Buscar por Manual
```
1. Haz clic en "🖱️ Manual"
2. Ingresa número: 00793-2023-0-3101-JR-LA-01
3. Usa filtros adicionales (materia, juzgado, estado, etc.)
4. Haz clic en "Buscar expedientes"
```

#### Buscar por Lectora
```
1. Haz clic en "📱 Lectora"
2. Escanea el código de barras
3. Se autoconvierte y busca automáticamente
4. Usa filtros si necesitas afinar las búsquedas
5. Haz clic en "Buscar expedientes"
```

### Módulo: Ubicaciones (Registrar Movimiento)

#### Opción Manual
```
1. Haz clic en "🖱️ Manual"
2. Ingresa o selecciona expediente desde la lista
3. Ingresa ubicación destino, motivo, estado
4. Haz clic en "Registrar movimiento"
```

#### Opción Lectora
```
1. Haz clic en "📱 Lectora"
2. Escanea el código de barras
3. El expediente se autoselecciona en la lista
4. El historial se actualiza automáticamente
5. Ingresa ubicación, motivo, estado
6. Haz clic en "Registrar movimiento"
```

## 🎨 Indicadores Visuales

### Chips de Estado

| Estado | Apariencia | Significado |
|--------|-----------|------------|
| 🖱️ Manual | Gris | Modo manual, esperando entrada |
| 📱 Lectora | Gris | Modo lectora, esperando escaneo |
| 🖱️ Válido | Verde | Número manual en formato correcto |
| 📱 Válido | Azul | Código de lectora válido (antes de parsear) |
| 📱 Parseado | Verde | Código parseado correctamente |
| 🖱️ Inválido | Rojo | Número manual no reconocido |
| 📱 Inválido | Rojo | Código de lectora no válido |

### Mensajes Informativos

```
Modo Manual:
- "Ingrese el número para activar autocompletado y validaciones"
- "Formato correcto. Campos judiciales autocompletados"
- "Use el formato 00000-2026-1-3101-CI-01"

Modo Lectora:
- "Escanee o ingrese el código de 20-23 dígitos de la lectora"
- "Convertido a: 00793-2023-0-3101-JR-LA-01"
- "Código de lectora debe tener 20-23 dígitos o formato 00000-2026-1-3101-CI-01"
```

## 🔑 Atajos y Consejos

### Uso Eficiente de Lectora
- El campo se enfoca automáticamente cuando activas modo lectora
- El código se parsea al terminar de escanear
- Puedes cambiar de modo en cualquier momento
- Usa "Limpiar" para resetear rápidamente

### Formatos Aceptados

**Formato Estándar (Manual):**
```
NNNNN-AAAA-0-CCCC-TT-MM-DD
Ejemplo: 00793-2023-0-3101-JR-LA-01

Componentes:
- NNNNN = Número expediente (00001-99999)
- AAAA = Año (2000-2099)
- 0 = Verificador (fijo)
- CCCC = Código corte (fijo: 3101)
- TT = Juzgado (SP/JP/JM/JR)
- MM = Materia (LA/FC/CI)
- DD = Número juzgado (01-99)
```

**Código Lectora (Lectora Física):**
```
20-23 dígitos sin separadores
Ejemplo: 22023007933101334000201

Estructura interna:
[pos 2-5] = Año
[pos 6-10] = Número expediente
[pos 15-16] = Tipo juzgado
[pos 17] = Especialidad
[últimos 2] = Número juzgado
```

## ❓ Troubleshooting

### "📱 Inválido" al escanear
- Verifica que el código tenga 20-23 dígitos
- Confirma que el código no esté dañado o cortado
- Intenta manualmente si continúa el error

### No encontró el expediente
- Verifica manualmente el número en formato estándar
- Usa búsqueda avanzada con filtros adicionales
- Revisa que el expediente esté en el sistema

### Autocompletado no funciona
- Asegúrate de que el número sea válido
- Comprueba que el expediente exista en el sistema
- Intenta cargar el expediente manualmente desde búsqueda

## 📞 Soporte Técnico

Para reportar problemas:
1. Anota el código exacto que causar el error
2. Describe exactamente qué pasó
3. Especifica el módulo donde ocurrió (Registro/Búsqueda/Ubicaciones)
4. Contacta al administrador del sistema
