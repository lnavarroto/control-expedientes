# 🔧 Solución: Problema de Codificación UTF-8

## Problema
Cuando escribes palabras con tildes (á, é, í, ó, ú, ñ), se muestran corruptas:
- `Actualización` → `ActualizaciÃ³n`
- `Búsqueda` → `BÃºsqueda`

## Causa
Los archivos HTML fueron guardados con **encoding incorrecto** (probablemente Latin-1 en lugar de UTF-8).

## Solución - 3 archivos para corregir:

### 1️⃣ Abre VS Code
   
### 2️⃣ Para cada archivo:
- `pages/actualizacion.html`
- `pages/busqueda.html`  
- `pages/parametros.js` (si lo creaste)

### 3️⃣ En cada archivo:
1. Click derecho en la pestaña del archivo
2. Selecciona **"Reopen with Encoding"**
3. Elige **"UTF-8"**
4. Guarda el archivo (Ctrl+S)

### 4️⃣ Alternativa rápida:
Haz click en el **botón de encoding** en la barra de estado (esquina inferior derecha):
- Dice algo como "UTF-8" o "CP1252"
- Click → Selecciona "UTF-8 with BOM" o "UTF-8"
- Guarda

## ✅ Después:
- Recarga el navegador (Ctrl+F5)
- Los tildes deben aparecer correctamente
- Los datos en localStorage se guardarán correctamente

## 📝 Verificación:
Abre la DevConsole (F12) y escribe:
```javascript
JSON.stringify({nombre: "José María"})
```
Debe mostrar correctamente: `{"nombre":"José María"}`
No: `{"nombre":"JosÃ© MarÃ­a"}`
