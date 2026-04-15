# ⚡ COPY-PASTE: Comandos Listos para GitHub

## 🚀 Ejecuta ESTO en PowerShell (Copiar y Pegar)

### Paso 1: Ir a la carpeta
```powershell
cd "c:\Users\luis2\OneDrive\Escritorio\MODELOS CREACIONES LUIS\APLICACIONES WEB\control-expedientes"
```

### Paso 2: Configurar usuario (Primera vez solamente)
```powershell
git config --global user.name "Luis Francisco Navarro Torres"
git config --global user.email "luis@example.com"
```
> Cambia el email si es necesario

### Paso 3: Ver qué archivos se subirán
```powershell
git status --short
```
**Debería mostar:**
- `␣M` Archivos modificados
- `?? assets/`, `?? pages/`, `?? backend/`, etc. (carpetas nuevas)
- NO debería mostrar TEST-*.js, debug-*.js (están ignorados)

### Paso 4: Agregar todo
```powershell
git add .
```

### Paso 5: Crear commit
```powershell
git commit -m "v1.0 - Sistema de gestión de expedientes con autenticación y lectora"
```

### Paso 6: Pushear a GitHub
```powershell
git push origin main
```

**Si te pide contraseña:** Usa tu token de GitHub

---

## ✅ Pasos Alternativos (Más Rápido)

### Todo en UN COMANDO
```powershell
git add . ; git commit -m "v1.0 - Sistema de expedientes" ; git push origin main
```

### O con confirmación
```powershell
git status --short ; Write-Host "¿Listo? Presiona ENTER" ; Read-Host ; git add . ; git commit -m "v1.0" ; git push origin main
```

---

## 🎯 COMANDOS ÚTILES DESPUÉS

### Ver si la subida fue exitosa
```powershell
git log --oneline -5
```
**Debería mostrar:**
```
a1b2c3d (HEAD -> main, origin/main) v1.0 - Sistema de expedientes
...
```

### Ver archivos trackeados
```powershell
git ls-files | Measure-Object
```

### Ver número exacto de archivos
```powershell
(git ls-files | Measure-Object -Line).Lines
```

### Ver archivos ignorados
```powershell
git check-ignore -v *.*
```

### Ver tamaño del repositorio
```powershell
(Get-ChildItem -Recurse .git | Measure-Object -Property Length -Sum).Sum / 1MB
```

---

## 🔄 CAMBIOS FUTUROS

Después del primer push, usa esto para cambios:

```powershell
# Hacer cambios en tus archivos...

# Agregar cambios
git add .

# Commit con descripción
git commit -m "Descripción de lo que cambió"

# Push
git push origin main
```

O todo junto:
```powershell
git add . -A && git commit -m "Descripción" && git push origin main
```

---

## ⚠️ ERRORES COMUNES Y SOLUCIONES

### Error: "fatal: Not a git repository"
```powershell
# Verifica que estés en la carpeta correcta
Get-Location
# Debería mostrar: ...control-expedientes

# Si no, ve a la carpeta
cd "c:\Users\luis2\OneDrive\Escritorio\MODELOS CREACIONES LUIS\APLICACIONES WEB\control-expedientes"
```

### Error: "Permission denied" o credenciales
```powershell
# En Windows 11, abre Credential Manager
# O usa en git bash:
git config --global credential.helper osxkeychain
```

### Error: "repository not found"
```powershell
# Verifica que el repositorio existe en GitHub
# Y que tienes acceso
git remote -v
# Debería mostrar: origin https://github.com/[tu-user]/control-expedientes.git
```

### Quiero DESHACER el último commit (sin perder archivos)
```powershell
git reset --soft HEAD~1
git status
# Luego hacer commit nuevamente
```

### Quiero ver diferencias antes de commit
```powershell
git diff
```

---

## 📈 HACER UN SEGUNDO COMMIT (Tips)

Después de hacer cambios:

```powershell
# Ver qué cambió
git diff --name-only

# Ver cambios en detalle
git diff

# Agregar solo ciertos archivos
git add archivo1.js archivo2.js

# O agregar todo
git add .

# Commit
git commit -m "Descripción clara del cambio"

# Push
git push origin main
```

---

## 🎊 VERIFICAR OUE TODO ESTÁ EN GITHUB

Ir a:
```
https://github.com/[TU-USUARIO]/control-expedientes
```

Debería ver:
- ✅ Todos los archivos listos
- ✅ README.md visible
- ✅ Código fuente en `assets/`, `pages/`, `backend/`
- ✅ Documentación completa
- ✅ Badges de commits
- ✅ Línea de tiempo de cambios

---

## 🆘 ¿PROBLEMAS? DIAGNÓSTICO

```powershell
# Ver todo el estado
git status

# Ver historial
git log --oneline

# Ver remotes configurados
git remote -v

# Ver rama actual
git branch

# Ver cambios por hacer commit
git diff --cached
```

---

## 📝 TEMPLATE DE COMMITS BIEN HECHOS

```powershell
# ❌ Malo:
git commit -m "cambios"

# ✅ Bueno:
git commit -m "Agregar autenticación JSONP sin CORS"
git commit -m "Fix: navegación del sidebar no funcionaba"
git commit -m "Docs: agregar guía de usuario completa"
git commit -m "Feat: modal de logout con animación"
git commit -m "Refactor: simplificar código de dashboardPage"
```

---

## 🎯 DESPUÉS DE SUBIR

**Comparte esto en GitHub:**
```
https://github.com/[tu-usuario]/control-expedientes

Sistema modular de gestión de expedientes judicales.
✅ Bimodal (manual/lectora)
✅ Autenticación segura
✅ 7 módulos funcionales
✅ Backend Google Apps Script
```

---

**¿Listo? ¡Copia y Pega el PASO 1 en PowerShell para empezar!** 🚀
