// ============================================================================
// EJEMPLOS DE TESTING - Google Apps Script API
// Copiar y pegar en la consola del navegador para testear
// ============================================================================

// Reemplaza con tu URL real
const API_URL = "https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercontent/exec";

// ============================================================================
// TEST 1: Listar Juzgados (GET - SIN AUTENTICACION)
// ✅ Recomendado: Comienza aquí para verificar conexión
// ============================================================================

function testListarJuzgados() {
  fetch(`${API_URL}?action=listar_juzgados`)
    .then(r => r.json())
    .then(data => {
      console.log("✅ JUZGADOS:", data);
      console.table(data.data);
    })
    .catch(e => console.error("❌ Error:", e));
}

// Ejecuta en la consola: testListarJuzgados()

// ============================================================================
// TEST 2: Listar Usuarios (GET)
// ============================================================================

function testListarUsuarios() {
  fetch(`${API_URL}?action=listar_usuarios`)
    .then(r => r.json())
    .then(data => {
      console.log("✅ USUARIOS:", data);
      console.table(data.data);
    })
    .catch(e => console.error("❌ Error:", e));
}

// ============================================================================
// TEST 3: Obtener Usuario por DNI (GET)
// ============================================================================

function testObtenerUsuarioPorDNI(dni = "12345678") {
  fetch(`${API_URL}?action=obtener_usuario_por_dni&dni=${dni}`)
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        console.log("✅ USUARIO:", data.data);
      } else {
        console.error("❌ Error:", data.error);
      }
    })
    .catch(e => console.error("❌ Error:", e));
}

// Ejecuta: testObtenerUsuarioPorDNI("12345678")

// ============================================================================
// TEST 4: Crear Usuario (POST)
// ⚠️  Modifica datos antes de ejecutar
// ============================================================================

function testCrearUsuario() {
  const datosUsuario = {
    action: "crear_usuario",
    dni: "98765432",  // ← CAMBIAR PARA EVITAR DUPLICADOS
    nombres: "Carlos",
    apellidos: "López",
    correo: "carlos@example.com",
    telefono: "51-956789012",
    cargo: "Archivador",
    area_modulo: "Archivo Civil",
    rol: "Archivador"
  };

  fetch(API_URL, {
    method: "POST",
    payload: JSON.stringify(datosUsuario)
  })
    .then(r => r.text().then(t => JSON.parse(t)))
    .then(data => {
      if (data.success) {
        console.log("✅ USUARIO CREADO:", data.data);
      } else {
        console.error("❌ Error:", data.error);
      }
    })
    .catch(e => console.error("❌ Error de red:", e));
}

// Ejecuta: testCrearUsuario()

// ============================================================================
// TEST 5: Listar Ubicaciones (GET)
// ============================================================================

function testListarUbicaciones() {
  fetch(`${API_URL}?action=listar_ubicaciones`)
    .then(r => r.json())
    .then(data => {
      console.log("✅ UBICACIONES:", data);
      console.table(data.data);
    })
    .catch(e => console.error("❌ Error:", e));
}

// ============================================================================
// TEST 6: Listar Estados de Expediente (GET)
// ============================================================================

function testListarEstados() {
  fetch(`${API_URL}?action=listar_estados`)
    .then(r => r.json())
    .then(data => {
      console.log("✅ ESTADOS:", data);
      console.table(data.data);
    })
    .catch(e => console.error("❌ Error:", e));
}

// ============================================================================
// TEST 7: Listar Expedientes (GET)
// ============================================================================

function testListarExpedientes() {
  fetch(`${API_URL}?action=listar_expedientes`)
    .then(r => r.json())
    .then(data => {
      console.log("✅ EXPEDIENTES:", data);
      console.log(`Total: ${data.data?.length || 0} expedientes`);
      if (data.data?.length > 0) {
        console.table(data.data.slice(0, 5)); // Primeros 5
      }
    })
    .catch(e => console.error("❌ Error:", e));
}

// ============================================================================
// TEST 8: Buscar Expedientes con Filtros (GET)
// ⚠️  Modifica filtros según tus datos
// ============================================================================

function testBuscarExpedientes() {
  const filtros = {
    action: "buscar_expedientes",
    numero: "00001",           // Búsqueda parcial
    activo: "SI"
  };

  const queryString = new URLSearchParams(filtros).toString();
  fetch(`${API_URL}?${queryString}`)
    .then(r => r.json())
    .then(data => {
      console.log("✅ RESULTADOS BÚSQUEDA:", data);
      console.log(`Encontrados: ${data.data?.length || 0}`);
    })
    .catch(e => console.error("❌ Error:", e));
}

// Ejecuta: testBuscarExpedientes()

// ============================================================================
// TEST 9: Obtener Expediente por Código (GET)
// ⚠️  Usa código de expediente existente
// ============================================================================

function testObtenerExpediente(codigo = "00001-2026-1-3101-CI-01") {
  fetch(`${API_URL}?action=obtener_expediente_por_codigo&codigo=${codigo}`)
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        console.log("✅ EXPEDIENTE:", data.data);
      } else {
        console.error("❌ Error:", data.error);
      }
    })
    .catch(e => console.error("❌ Error:", e));
}

// ============================================================================
// TEST 10: Crear Expediente (POST)
// ⚠️  Obtén IDs válidos primero con: testListarJuzgados(), testListarUbicaciones()
// ============================================================================

function testCrearExpediente() {
  const datosExpediente = {
    action: "crear_expediente",
    numero_expediente: "00999",
    anio: "2026",
    incidente: "0",
    codigo_corte: "3101",
    tipo_organo: "1",
    codigo_materia: "CI",
    id_juzgado: "JZ-001",              // ← Reemplaza con ID válido
    id_ubicacion_actual: "UB-001",     // ← Reemplaza con ID válido
    origen_registro: "MANUAL",
    registrado_por: "USR-001",
    observaciones: "Expediente de prueba"
  };

  fetch(API_URL, {
    method: "POST",
    payload: JSON.stringify(datosExpediente)
  })
    .then(r => r.text().then(t => JSON.parse(t)))
    .then(data => {
      if (data.success) {
        console.log("✅ EXPEDIENTE CREADO:", data.data);
        // Guardar ID para tests siguientes
        window.testExpedienteId = data.data.id_expediente;
        console.log("Expediente ID guardado:", window.testExpedienteId);
      } else {
        console.error("❌ Error:", data.error);
      }
    })
    .catch(e => console.error("❌ Error de red:", e));
}

// ============================================================================
// TEST 11: Cambiar Estado de Expediente (POST)
// ⚠️  Usa ID de expediente creado en TEST 10
// ============================================================================

function testCambiarEstadoExpediente() {
  if (!window.testExpedienteId) {
    console.error("❌ Primero ejecuta testCrearExpediente() para obtener ID");
    return;
  }

  const datosEstado = {
    action: "actualizar_estado_expediente",
    id_expediente: window.testExpedienteId,
    id_estado: "EST-002",              // ← Cambiar según tus estados
    motivo: "Cambio de prueba"
  };

  fetch(API_URL, {
    method: "POST",
    payload: JSON.stringify(datosEstado)
  })
    .then(r => r.text().then(t => JSON.parse(t)))
    .then(data => {
      if (data.success) {
        console.log("✅ ESTADO ACTUALIZADO:", data.data);
      } else {
        console.error("❌ Error:", data.error);
      }
    })
    .catch(e => console.error("❌ Error de red:", e));
}

// ============================================================================
// TEST 12: Registrar Movimiento (POST)
// ⚠️  Usa ID de expediente válido
// ============================================================================

function testRegistrarMovimiento(expedienteId) {
  if (!expedienteId) {
    console.error("❌ Proporciona ID de expediente");
    return;
  }

  const datosMovimiento = {
    action: "registrar_movimiento",
    id_expediente: expedienteId,
    tipo_movimiento: "TRASLADO",
    ubicacion_origen: "UB-001",
    ubicacion_destino: "UB-002",
    motivo: "Prueba de movimiento",
    observacion: "Movimiento de test",
    realizado_por: "USR-001"
  };

  fetch(API_URL, {
    method: "POST",
    payload: JSON.stringify(datosMovimiento)
  })
    .then(r => r.text().then(t => JSON.parse(t)))
    .then(data => {
      if (data.success) {
        console.log("✅ MOVIMIENTO REGISTRADO:", data.data);
      } else {
        console.error("❌ Error:", data.error);
      }
    })
    .catch(e => console.error("❌ Error de red:", e));
}

// Ejecuta: testRegistrarMovimiento(window.testExpedienteId)

// ============================================================================
// TEST 13: Listar Movimientos (GET)
// ============================================================================

function testListarMovimientos(expedienteId) {
  if (!expedienteId) {
    console.error("❌ Proporciona ID de expediente");
    return;
  }

  fetch(`${API_URL}?action=listar_movimientos_por_expediente&expediente_id=${expedienteId}`)
    .then(r => r.json())
    .then(data => {
      console.log("✅ MOVIMIENTOS:", data);
      console.table(data.data);
    })
    .catch(e => console.error("❌ Error:", e));
}

// ============================================================================
// SCRIPT DE TESTING COMPLETO
// Ejecuta todo en orden
// ============================================================================

async function runFullTest() {
  console.log("🚀 INICIANDO TESTS...\n");

  console.log("1️⃣ Obteniendo juzgados...");
  await new Promise(resolve => {
    fetch(`${API_URL}?action=listar_juzgados`)
      .then(r => r.json())
      .then(data => {
        console.log("✅ Juzgados:", data.data?.length);
        resolve();
      });
  });

  console.log("\n2️⃣ Obteniendo usuarios...");
  await new Promise(resolve => {
    fetch(`${API_URL}?action=listar_usuarios`)
      .then(r => r.json())
      .then(data => {
        console.log("✅ Usuarios:", data.data?.length);
        resolve();
      });
  });

  console.log("\n3️⃣ Obteniendo ubicaciones...");
  await new Promise(resolve => {
    fetch(`${API_URL}?action=listar_ubicaciones`)
      .then(r => r.json())
      .then(data => {
        console.log("✅ Ubicaciones:", data.data?.length);
        resolve();
      });
  });

  console.log("\n✅ TESTS COMPLETADOS");
}

// Ejecuta: runFullTest()

// ============================================================================
// FUNCIONES AUXILIARES DE DEBUG
// ============================================================================

/**
 * Verifica si la API está accesible
 */
function testConexion() {
  console.log("🔍 Testeando conexión con API...");
  fetch(`${API_URL}?action=listar_juzgados`)
    .then(r => {
      if (r.ok) {
        console.log("✅ API ACCESIBLE");
        return r.json().then(d => console.log("Respuesta:", d));
      } else {
        console.error("❌ Error HTTP:", r.status);
      }
    })
    .catch(e => {
      console.error("❌ NO HAY CONEXIÓN:", e.message);
      console.error("Verifica que:");
      console.error("1. La URL de API es correcta");
      console.error("2. El script está desplegado como Web App");
      console.error("3. CORS está habilitado (Anyone)");
    });
}

/**
 * Abre la consola del navegador con instrucciones
 */
function ayuda() {
  console.clear();
  console.log(`
╔════════════════════════════════════════════════════════════╗
║       TESTING API - ARCHIVO CIVIL SULLANA                 ║
╚════════════════════════════════════════════════════════════╝

📌 TESTS RECOMENDADOS EN ORDEN:

1. testConexion()
   → Verifica que la API está accesible

2. testListarJuzgados()
   → Obtiene datos maestros (sin crear nada)

3. testListarUbicaciones()
4. testListarEstados()
5. testListarMaterias()
   → Datos necesarios para crear expediente

6. testCrearUsuario()
   → Crea un usuario (cambia DNI cada vez)

7. testCrearExpediente()
   → Crea expediente (guarda window.testExpedienteId)

8. testCambiarEstadoExpediente()
   → Cambia estado usando ID guardado

9. testRegistrarMovimiento(window.testExpedienteId)
   → Registra movimiento

10. testListarMovimientos(window.testExpedienteId)
    → Ver historial

═══════════════════════════════════════════════════════════

💡 TIPS:
- Abre DevTools: F12 → Console
- Copia y pega las funciones aquí
- Ejecuta: nombreFuncion()
- Revisa Google Sheets para ver cambios
- Usa console.table() para mejor visualización

═══════════════════════════════════════════════════════════
  `);
}

// Ejecuta en consola: ayuda()
