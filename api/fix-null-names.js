const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'oregon-postgres.render.com',
  port: 5432,
  username: 'vibra_db_user',
  password: 'smHWUztniMBqPTosfcIHHerIkMhlgfLE',
  database: 'vibra_db',
  ssl: {
    rejectUnauthorized: false
  },
  synchronize: false,
});

async function fixNullNames() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    // 1. Ver cuántos registros tienen name NULL
    const countResult = await AppDataSource.query(
      'SELECT COUNT(*) FROM playlists WHERE name IS NULL'
    );
    console.log(`📊 Playlists con name NULL: ${countResult[0].count}`);

    if (parseInt(countResult[0].count) > 0) {
      // 2. Ver algunos ejemplos
      const examples = await AppDataSource.query(
        'SELECT id, name, "isPublic", "userId", "createdAt" FROM playlists WHERE name IS NULL LIMIT 5'
      );
      console.log('📋 Ejemplos de playlists con name NULL:');
      console.table(examples);

      // 3. Eliminar playlists públicas con name NULL (probablemente basura)
      const deletePublic = await AppDataSource.query(
        'DELETE FROM playlists WHERE name IS NULL AND "isPublic" = true RETURNING id'
      );
      console.log(`🗑️  Eliminadas ${deletePublic.length} playlists públicas con name NULL`);

      // 4. Para playlists privadas con name NULL, asignar un nombre por defecto
      const updatePrivate = await AppDataSource.query(
        `UPDATE playlists
         SET name = 'Mi Playlist ' || SUBSTRING(id::text, 1, 8)
         WHERE name IS NULL AND "isPublic" = false
         RETURNING id, name`
      );
      console.log(`✏️  Actualizadas ${updatePrivate.length} playlists privadas con nombre por defecto`);
      if (updatePrivate.length > 0) {
        console.table(updatePrivate.slice(0, 5));
      }

      // 5. Verificar que ya no hay NULL
      const finalCount = await AppDataSource.query(
        'SELECT COUNT(*) FROM playlists WHERE name IS NULL'
      );
      console.log(`\n✅ Playlists con name NULL después de la limpieza: ${finalCount[0].count}`);
    } else {
      console.log('✅ No hay playlists con name NULL');
    }

    await AppDataSource.destroy();
    console.log('\n🎉 Proceso completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixNullNames();
