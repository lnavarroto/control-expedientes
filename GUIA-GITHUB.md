# 📤 Guía para Subir a GitHub - Control de Expedientes

## ✅ QUÉ SUBIR (Archivos Importantes)

### Código fuente principal
```
✅ assets/
   ├── css/
   │   ├── main.css
   │   └── theme.css
   ├── js/
   │   ├── app.js                    (Inicializador principal)
   │   ├── router.js                 (Gestor de rutas SPA)
   │   ├── config.js                 (Configuración)
   │   ├── auth/                     (Sistema de autenticación)
   │   ├── components/               (Componentes reutilizables)
   │   ├── services/                 (Servicios de datos)
   │   ├── modules/                  (Módulos principales)
   │   └── utils/                    (Utilidades)
   └── icons/                        (Iconos del sistema)

✅ pages/                            (Páginas HTML principales)
   ├── login.html
   ├── dashboard.html
   ├── registro-expedientes.html
   ├── expedientes.html
   ├── ubicaciones.html
   ├── busqueda.html
   ├── paquetes.html
   ├── movimientos.html
   ├── actualizacion.html
   └── configuracion.html

✅ backend/                          (Google Apps Script)
   ├── Code.gs                       (Código principal del backend)
   ├── README.md                     (Documentación del backend)
   ├── ARQUITECTURA.md               (Diseño del backend)
   └── TESTING.js                    (Ejemplos de pruebas)

✅ Archivos de documentación
   ├── README.md                     (Documentación principal)
   ├── LICENSE                       (Licencia)
   ├── CHANGELOG.md                  (Historial de cambios)
   ├── GUIA-USUARIO.md               (Manual del usuario)
   ├── IMPLEMENTACION-LECTORA.md     (Documentación de lectora)
   │
```

### Carpeta de datos (SOLO si es mock/ejemplo)
```
✅ data/                             (Solo si contiene datos de ejemplo)
   └── mock-data.js                  (Datos de prueba sin información sensible)
```

### Archivos de configuración
```
✅ .gitignore                        (Este archivo - qué ignorar)
```

---

## ❌ QUÉ NO SUBIR (Archivos a Ignorar)

### Archivos temporales y de testing
```
❌ TEST-PARSER-LECTURA.js           (Archivo de pruebas)
❌ EJEMPLOS-PARSER.js               (Ejemplos de desarrollo)
❌ test-lectora-*.js                (Archivos de testing)
❌ debug-*.js                       (Archivos de debuggeo)
❌ check-*.js                       (Scripts de verificación)
❌ *.tmp
❌ *.temp
❌ *.log
```

### Configuración local del IDE
```
❌ .vscode/                          (Configuración de VS Code personal)
❌ .idea/                            (Configuración de IntelliJ)
❌ *.sublime-project
❌ *.code-workspace
```

### Archivos de sistema operativo
```
❌ .DS_Store                         (macOS)
❌ Thumbs.db                         (Windows)
❌ .AppleDouble
❌ .LSOverride
```

### Información sensible
```
❌ .env                              (Variables de entorno con secretos)
❌ .env.local
❌ *.pem, *.key                      (Claves privadas)
❌ config-secreto.js
❌ api-keys.js
```

### Directorios de herramientas
```
❌ node_modules/                     (Si usas npm)
❌ dist/
❌ build/
❌ .git/
```

### Archivos de backup
```
❌ *.bak
❌ *.backup
❌ *~
```

---

## 🚀 Pasos para Subir a GitHub

### 1️⃣ Verificar el .gitignore
```bash
cat .gitignore
```

### 2️⃣ Ver qué archivos se subirán
```bash
git status
```

### 3️⃣ Agregar solo lo que se debe
```bash
# Agregar todos los archivos tracked (excepto los ignorados)
git add .

# O ser más selectivo:
git add assets/ pages/ backend/ *.md LICENSE .gitignore
```

### 4️⃣ Crear commit
```bash
git commit -m "Versión 1.0 - Sistema de gestión de expedientes con autenticación y lectora"
```

### 5️⃣ Pushear a GitHub
```bash
git push origin main
# O si la rama es diferente:
git push origin [tu-rama]
```

---

## 📋 Estructura Final en GitHub

```
control-expedientes/
├── .gitignore                   (Qué ignorar)
├── LICENSE                      (Licencia del proyecto)
├── README.md                    (Documentación principal)
├── CHANGELOG.md                 (Historial de versiones)
├── GUIA-USUARIO.md             (Manual para usuarios)
├── IMPLEMENTACION-LECTORA.md    (Docs del sistema de lectora)
│
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   └── theme.css
│   ├── js/                      (Código principal)
│   └── icons/
│
├── pages/                       (HTML pages)
│   ├── login.html
│   ├── dashboard.html
│   ├── registro-expedientes.html
│   └── ... resto de pages
│
├── backend/
│   ├── Code.gs                  (Backend Google Apps Script)
│   ├── README.md
│   ├── ARQUITECTURA.md
│   └── TESTING.js
│
└── data/
    └── mock-data.js             (Ejemplo de datos - SIN datos reales)
```

---

## ⚠️ IMPORTANTE: Información Sensible

Antes de pushear, verifica que NO incluyas:

- ✋ **DNI reales** o datos de empleados
- ✋ **URLs de APIs privadas** con contraseñas
- ✋ **Token de Google Apps Script** en comentarios
- ✋ **Datos personales** de usuarios
- ✋ **Configuración de producción**

---

## 🔒 Si Subiste Algo que No Debías

```bash
# Remover archivos del histórico de git
git rm --cached archivo-sensible.js
git commit -m "Remover archivo sensible"
git push

# O reescribir el historial (⚠️ usa solo si es necesario)
git filter-branch --tree-filter 'rm -f archivo-sensible.js' HEAD
```

---

## 📌 Descripción recomendada para GitHub

```
# Control de Expedientes para Archivo Módulo Civil

Sistema modular de gestión documental judicial para el Archivo Civil de Sullana.

## Características

- ✅ Sistema **bimodal**: entrada manual y por lectora física
- ✅ Autenticación segura con Google Sheets backend
- ✅ 7 módulos funcionales de gestión de expedientes
- ✅ Interfaz profesional con Tailwind CSS
- ✅ API REST con Google Apps Script

## Tecnología

- Frontend: HTML5, JavaScript Modules, Tailwind CSS
- Backend: Google Apps Script + Google Sheets
- Auth: JSONP callbacks para seguridad cross-origin

## Instalación

1. Clonar repositorio
2. Abrir `pages/login.html` en navegador (requiere backend configurado)
3. Ver GUIA-USUARIO.md para documentación completa
```

---

## ✨ Checklist Final

- [ ] Verificar que .gitignore existe y está completo
- [ ] Revisar `git status` - NO debe mostrar archivos sensibles
- [ ] Remover archivos temporales (test-*.js, debug-*.js, etc.)
- [ ] Verificar que no hay datos personales reales
- [ ] Hacer primer commit con mensaje descriptivo
- [ ] Push a GitHub exitoso
- [ ] Revisar en GitHub que se vea completo y limpio

---

## 🆘 Dudas frecuentes

**P: ¿Puedo subir los archivos de testing?**
R: No. `TEST-` y `debug-` deben ir en .gitignore. Solo incluye código de producción.

**P: ¿Debo cambiar URLs/tokens antes de subir?**
R: SÍ. Nunca subas URLs reales de APIs o tokens. Usa placeholders en ejemplos.

**P: ¿Mi proyecto está listo para GitHub?**
R: Sí, si verificas todos los puntos del checklist final.
