# Control de Expedientes - Archivo Módulo Civil de Sullana

Sistema frontend modular para gestión de expedientes judiciales del área de archivo con **soporte bimodal manual y por lectora física**.

## 🆕 Novedades: Sistema Bimodal Manual/Lectora

- ✅ **Parser de Lectora:** Convierte códigos de barras (20-23 dígitos) a formato estándar
- ✅ **Entrada Dual:** Todos los módulos soportan entrada manual (🖱️) o por lectora (📱)
- ✅ **Iconos Diferenciadores:** Visual clara entre modos manual y lectora
- ✅ **Autocompletado Inteligente:** Los campos se completan automáticamente tras parsear
- ✅ **Integrado en 3 Módulos:** Registro, Búsqueda, Ubicaciones

## Stack

- HTML5
- JavaScript moderno con módulos ES
- Tailwind CSS (CDN)
- CSS institucional personalizado
- LocalStorage para persistencia mock
- **NUEVO:** Parser nativo para códigos de lectora

## Estructura

```text
assets/
	css/
		main.css
		theme.css
	icons/
	js/
		app.js
		router.js
		data/
			mockData.js
		utils/
			expedienteParser.js
			formatters.js
			storage.js
			validators.js
			lectora.js           ← NUEVO: Parser de lectora física
		services/
			authService.js
			excelService.js
			expedienteService.js
			paqueteService.js
			ubicacionService.js
		components/
			expedienteForm.js
			filters.js
			header.js
			icons.js
			layout.js
			modal.js
			sidebar.js
			statusBadge.js
			summaryCard.js
			table.js
			toast.js
		modules/
			auth/loginPage.js
			dashboard/dashboardPage.js
			expedientes/registroPage.js       ← Entrada dual
			expedientes/listadoPage.js
			busqueda/busquedaPage.js          ← Entrada dual
			ubicaciones/ubicacionesPage.js    ← Entrada dual
			paquetes/paquetesPage.js
			movimientos/movimientosPage.js
			actualizacion/actualizacionPage.js
pages/
	login.html
	dashboard.html
	registro-expedientes.html
	expedientes.html
	busqueda.html
	ubicaciones.html
	paquetes.html
	movimientos.html
	actualizacion.html
components/
	sidebar.html
	header.html
	modal.html
index.html
```

## Flujo implementado

- Login por DNI con validación de 8 dígitos.
- Dashboard con indicadores mock y accesos rápidos.
- **Registro de expediente con entrada dual y autocompletado.**
- Listado con filtros y edición rápida por modal.
- Búsqueda avanzada por múltiples criterios.
- Gestión de ubicaciones con historial de movimientos.
- Gestión de paquetes con asignación y retiro de expedientes.
- Panel de movimientos e historial general.
- Módulo de actualización con capa Excel simulada.

## Servicios listos para escalar

- `authService`: autenticación mock.
- `expedienteService`: CRUD, búsqueda, movimientos, resumen.
- `paqueteService`: creación y asignación de paquetes.
- `ubicacionService`: movimientos de ubicación.
- `excelService`: interfaz preparada para integración real.

## Ejecución local

1. Abrir `index.html` en un servidor local estático.
2. Ingresar un DNI válido de 8 dígitos.
3. Navegar por los módulos desde el sidebar.

Recomendación: usar Live Server para desarrollo rápido en VS Code.
