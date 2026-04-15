/**
 * Test cases para parsearLectora
 * Valida que los códigos de 20 dígitos se conviertan correctamente
 * al formato estándar de expediente
 */

import { parsearLectora } from "./lectora.js";

// Casos de prueba con datos reales
const testCases = [
  {
    raw: "22023007933101334000201",
    esperado: "00793-2023-0-3101-JR-LA-01",
    descripcion: "Ejemplo original del usuario"
  },
  {
    raw: "22023001234101234000201",
    esperado: "01234-2023-0-3101-JR-CI-01",
    descripcion: "Juzgado mixto especialidad CI"
  },
  {
    raw: "22524000555101324000501",
    esperado: "00555-2524-0-3101-JR-FC-05",
    descripcion: "Especialidad familia (5 = FC)"
  },
  {
    raw: "21023002000321324003231",
    esperado: "02000-2102-0-3101-JM-LA-23",
    descripcion: "Juzgado mixto (24 = JM)"
  },
  {
    raw: "20723999991013235009999",
    esperado: "99999-2072-0-3101-JP-LA-99",
    descripcion: "Juzgado penal (35 = JP)"
  },
  {
    raw: "23623004000311332000401",
    esperado: "04000-2362-0-3101-SP-CI-01",
    descripcion: "Sala penal (32 = SP)"
  },
  {
    raw: "22023010999101334000101",
    esperado: "10999-2023-0-3101-JR-LA-01",
    descripcion: "Mayor número de expediente"
  },
  {
    raw: "21923050000101335004501",
    esperado: "50000-2192-0-3101-JR-FC-45",
    descripcion: "Código incidente mayor"
  },
  {
    raw: "20423098765213352000201",
    esperado: "98765-2042-0-3101-JR-CI-02",
    descripcion: "Año 2042"
  },
  {
    raw: "22223000001101324000101",
    esperado: "00001-2222-0-3101-JR-CI-01",
    descripcion: "Mínimo número de expediente"
  },
  {
    raw: "21523456789013234000601",
    esperado: "56789-2152-0-3101-JR-FC-06",
    descripcion: "Números aleatorios"
  },
  {
    raw: "20123033000101335000501",
    esperado: "33000-2012-0-3101-JR-LA-05",
    descripcion: "Año 2012"
  },
  {
    raw: "25523012345103132001201",
    esperado: "12345-2552-0-3101-JM-CI-12",
    descripcion: "Año futuro 2552"
  }
];

function ejecutarTests() {
  console.log("🧪 INICIANDO PRUEBAS DE PARSER DE LECTORA\n");
  console.log("═".repeat(80));

  let pasaron = 0;
  let fallaron = 0;

  testCases.forEach((test, index) => {
    const resultado = parsearLectora(test.raw);
    const estado = resultado?.numeroExpediente === test.esperado ? "✅" : "❌";

    if (resultado?.numeroExpediente === test.esperado) {
      pasaron++;
      console.log(
        `${estado} Test ${index + 1}: ${test.descripcion}`
      );
      console.log(`   Raw:      ${test.raw}`);
      console.log(
        `   Resultado: ${resultado.numeroExpediente}`
      );
    } else {
      fallaron++;
      console.log(
        `${estado} Test ${index + 1}: ${test.descripcion}`
      );
      console.log(`   Raw:       ${test.raw}`);
      console.log(`   Esperado:  ${test.esperado}`);
      console.log(
        `   Resultado: ${resultado?.numeroExpediente || "ERROR - retorna null"}`
      );
    }

    // Mostrar detalles de conversión en el primer caso
    if (index === 0 && resultado) {
      console.log(`\n   📋 Detalles de conversión:`);
      console.log(`      - Número:      ${resultado.numeroSolo}`);
      console.log(`      - Año:         ${resultado.anio}`);
      console.log(`      - Código Corte: ${resultado.codigoCorte}`);
      console.log(`      - Juzgado:     ${resultado.juzgado}`);
      console.log(`      - Especialidad: ${resultado.materia}`);
      console.log(`      - Número Juzgado: ${resultado.numeroJuzgado}`);
      console.log(`      - Fuente:      ${resultado.fuente}`);
    }

    console.log();
  });

  console.log("═".repeat(80));
  console.log(`\n📊 RESUMEN: ${pasaron} pasaron ✅ | ${fallaron} fallaron ❌`);
  console.log(
    `Tasa de éxito: ${((pasaron / testCases.length) * 100).toFixed(1)}%\n`
  );

  return { pasaron, fallaron, total: testCases.length };
}

// Ejecutar pruebas si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  ejecutarTests();
}

export { ejecutarTests, testCases };
