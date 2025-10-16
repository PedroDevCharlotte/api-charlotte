const mysql = require('mysql2/promise');

async function checkTableStructure() {
  const connection = await mysql.createConnection({
    host: 'srv1104.hstgr.io',
    port: 3306,
    user: 'u821827014_conctusr1',
    password: 'r3O#&qLLG#t;',
    database: 'u821827014_conectadb'
  });

  try {
    console.log('🔍 REVISANDO ESTRUCTURA DE TABLA');
    console.log('==================================\n');

    // 1. Verificar estructura de la tabla
    console.log('📋 1. Estructura de non_conformity_whys:');
    const [columns] = await connection.execute('DESCRIBE non_conformity_whys');
    
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // 2. Verificar datos de muestra
    console.log('\n📊 2. Datos de muestra (últimos 3):');
    const [records] = await connection.execute(
      'SELECT * FROM non_conformity_whys ORDER BY id DESC LIMIT 3'
    );
    
    records.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id}, nonConformityId: ${record.nonConformityId}, type: ${record.type}, questionNumber: ${record.questionNumber}, description: ${record.description?.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTableStructure();