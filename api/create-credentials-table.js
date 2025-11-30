const { Client } = require('pg');

async function createTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado a Railway');

    // Crear tabla user_credentials
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        password VARCHAR NOT NULL,
        "emailVerified" BOOLEAN DEFAULT false,
        "verificationCode" VARCHAR,
        "verificationCodeExpires" TIMESTAMP,
        "resetPasswordToken" VARCHAR,
        "resetPasswordExpires" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createTableSQL);
    console.log('Tabla user_credentials creada exitosamente');

    // Verificar
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user_credentials'
      ORDER BY ordinal_position;
    `);

    console.log('\nColumnas de user_credentials:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTable();
