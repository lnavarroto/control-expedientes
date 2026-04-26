# Módulo Archivo General - Documentación

## Descripción

El módulo **Archivo General** permite gestionar grupos de expedientes, registrar salidas y retornos, y realizar un seguimiento completo del movimiento de documentos a través de la organización.

## Estructura de Archivos

```
assets/js/modules/archivo-general/
├── ArchivoGeneralPage.js           # Página principal con 3 tabs
├── ModalCrearGrupo.js              # Modal para crear nuevo grupo
├── ModalVerDetalleGrupo.js         # Modal para ver detalles del grupo
├── ModalAsignarExpedientes.js      # Modal para asignar expedientes al grupo
├── ModalRegistrarSalida.js         # Modal para registrar salida
├── ModalRegistrarRetorno.js        # Modal para registrar retorno
└── archivoGeneralService.js        # Servicio con llamadas a API
```

## Características Principales

### 1. Vista Principal (ArchivoGeneralPage)
- **3 Tabs/Secciones:**
  - **Grupos**: Lista de todos los grupos de archivo general con acciones
  - **Salidas**: Historial de todas las salidas registradas
  - **Expedientes sin Grupo**: Expedientes que aún no han sido asignados a ningún grupo

### 2. Gestión de Grupos
- Crear nuevos grupos asignando especialista
- Asignar expedientes al grupo (opcional al crear, o posteriormente)
- Ver detalle completo del grupo (expedientes y salidas)
- Remover expedientes del grupo

### 3. Control de Salidas
- Registrar salida de un grupo (Préstamo, Transferencia, Consulta, Otro)
- Especificar destino, responsables de entrega/recepción, motivo
- Cambiar estado del grupo a EN_PRESTAMO automáticamente
- Registrar retorno con observaciones
- Cambiar estado del grupo a ACTIVO automáticamente

## Estados del Grupo
- **ACTIVO**: Grupo disponible, puede registrar salida
- **EN_PRESTAMO**: Grupo en préstamo, puede registrar retorno
- **RETORNADO**: Grupo que fue retornado (histórico)

## Integración

### Router
Se agregó la ruta `"archivo-general"` en `assets/js/router.js`:
```javascript
"archivo-general": { title: "Archivo General de Expedientes", init: initArchivoGeneralPage }
```

### Sidebar
Se agregó en la sección "Gestión" el link:
- **Archivo General** (icono: archiveBox) → `archivo-general`

### Endpoints del Backend Utilizados

**GETs:**
- `listar_grupos_archivo_general` - Lista todos los grupos activos
- `obtener_grupo_con_detalle` - Retorna grupo + expedientes + salidas
- `listar_detalle_grupo_archivo` - Lista expedientes de un grupo
- `listar_salidas_archivo_general` - Lista salidas del sistema
- `listar_especialistas_activos` - Lista especialistas para selector
- `listar_expedientes` - Lista todos los expedientes disponibles

**POSTs:**
- `crear_grupo_archivo_general` - Crear nuevo grupo
- `asignar_expedientes_grupo_archivo` - Asignar expedientes a grupo existente
- `desasignar_expediente_grupo_archivo` - Remover expediente del grupo
- `registrar_salida_archivo_general` - Registrar salida del grupo
- `registrar_retorno_archivo_general` - Registrar retorno/cierre de salida

## Flujo Completo

```
1. Acceder a "Archivo General" desde el sidebar
2. Ver lista de grupos en tab "Grupos"
3. Crear nuevo grupo:
   - Click "Nuevo Grupo"
   - Seleccionar especialista
   - Opcionalmente asignar expedientes
   - El sistema genera código_grupo automático
4. Ver detalle del grupo:
   - Click "Ver" en la fila del grupo
   - Ver expedientes asignados y salidas registradas
   - Agregar/remover expedientes
5. Registrar salida:
   - Click "Salida" (solo si estado = ACTIVO)
   - Llenar datos de destino, responsables, motivo
   - El grupo cambia a EN_PRESTAMO
6. Registrar retorno:
   - Click "Retorno" (solo si estado = EN_PRESTAMO)
   - Confirmar con observación
   - El grupo vuelve a ACTIVO
```

## Consideraciones Técnicas

### Autenticación
- El usuario actual se obtiene de `localStorage.getItem("trabajador_validado")`
- Se usa para construir `realizado_por` en formato: `ID_USUARIO - Nombre Apellido`

### Manejo de Errores
- Todos los modales verifican `response.success === false`
- Se muestran errores con toast notifications
- Los botones de submit se deshabilitan durante las peticiones

### Estilos
- Usa componentes CSS existentes (badges, botones, tablas)
- Respeta la paleta de colores del proyecto (Tailwind)
- Estados representados con colores consistentes:
  - ACTIVO = verde (emerald)
  - EN_PRESTAMO = amarillo (amber)
  - ACTIVA (salida) = rojo (red)
  - RETORNADO = gris (slate)

### Performance
- Carga lazy de expedientes sin grupo (se obtienen solo cuando se abre el tab)
- Búsqueda en cliente para expedientes en modales
- Sin caching adicional (el backend gestiona la invalidación)

## Testing Recomendado

1. **Crear Grupo**: Crear sin expedientes, luego con expedientes
2. **Asignar Expedientes**: Agregar a grupo existente, verificar lista actualizada
3. **Remover Expedientes**: Quitar expediente, verificar total_expedientes actualizado
4. **Registrar Salida**: Verificar que el estado cambie a EN_PRESTAMO
5. **Registrar Retorno**: Verificar que vuelva a ACTIVO
6. **Filtros**: Verificar búsqueda de expedientes en modales
7. **Estados**: Verificar que los botones de acción se muestren solo según estado

## Backend (Pendiente)

Se requiere implementar en `Code.gs` los siguientes endpoints:

### Tablas necesarias:
- `grupo_archivo_general` (ya debe existir)
- `grupo_archivo_general_detalle` (ya debe existir)
- `salida_archivo_general` (ya debe existir)

### Funciones GAS requeridas:
Ver especificación completa en el prompt original para mapeo exacto de parámetros y respuestas.
