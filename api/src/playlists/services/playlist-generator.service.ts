import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Servicio para regenerar playlists por familias de géneros
 */
@Injectable()
export class PlaylistGeneratorService {
  private readonly logger = new Logger(PlaylistGeneratorService.name);

  // Nombres amigables para las familias
  private readonly familyNames = {
    metal: 'Metal',
    rock: 'Rock',
    cumbia: 'Cumbia',
    latin: 'Latin Hits',
    urban: 'Urbano',
    electronic: 'Electronic',
    pop: 'Pop',
    punk: 'Punk',
    folk: 'Folk',
    latin_traditional: 'Regional Mexicano',
    afro_caribbean: 'Afro & Caribbean',
    soul_funk: 'Soul & Funk',
    alternative: 'Alternative',
    chill: 'Chill',
    world_music: 'World Music',
    asian_pop: 'Asian Pop',
    infantil: 'Infantil',
    clasica: 'Clásica',
  };

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Regenera todas las playlists de familias
   * Borra las antiguas y crea nuevas con canciones aleatorias
   */
  async regenerateFamilyPlaylists(): Promise<{
    created: number;
    skipped: number;
    total: number;
  }> {
    this.logger.log('🔄 Iniciando regeneración de playlists por familias...');

    let created = 0;

    // Cargar familias desde el archivo JSON
    const familiesPath = path.join(
      __dirname,
      '../../../scripts/data/genre-families.json',
    );
    const families = JSON.parse(fs.readFileSync(familiesPath, 'utf-8'));

    // Eliminar todas las playlists públicas antiguas
    this.logger.log('🗑️  Eliminando playlists antiguas...');
    const deleteResult = await this.dataSource.query(`
      DELETE FROM playlists
      WHERE "userId" IS NULL
        AND "isPublic" = true
    `);
    this.logger.log(`✅ Eliminadas ${deleteResult[1]} playlists antiguas`);

    // Crear un array aleatorio de índices para el displayOrder
    const familyKeys = Object.keys(families);
    const randomOrder = this.generateRandomOrder(familyKeys.length);
    this.logger.log('🔀 Orden de visualización aleatorizado');

    // Crear playlists para cada familia
    let familyIndex = 0;
    for (const [familyKey, genres] of Object.entries(families)) {
      const familyName = this.familyNames[familyKey] || familyKey;
      this.logger.log(`🎵 Procesando familia: ${familyName}`);

      // Crear placeholders para la consulta SQL ($1, $2, $3, ...)
      const genreArray = genres as string[];
      const placeholders = genreArray
        .map((_, index) => `$${index + 1}`)
        .join(', ');

      // Buscar 30 canciones aleatorias de los géneros de esta familia (R2 only)
      const songs = await this.dataSource.query(
        `
        SELECT id, title, artist, genre, duration
        FROM songs
        WHERE genre IN (${placeholders})
          AND storage_url IS NOT NULL
        ORDER BY RANDOM()
        LIMIT 30
      `,
        genreArray,
      );

      if (songs.length === 0) {
        this.logger.warn(
          `⚠️  No hay canciones para la familia "${familyName}" - Creando playlist vacía`,
        );
      } else {
        this.logger.log(`✅ Encontradas ${songs.length} canciones`);
      }

      // Crear nueva playlist con displayOrder aleatorio
      const displayOrder = randomOrder[familyIndex];
      const createResult = await this.dataSource.query(
        `
        INSERT INTO playlists (name, description, genre, "isPublic", "userId", "songCount", "totalDuration", "displayOrder")
        VALUES ($1, $2, $3, true, NULL, 0, 0, $4)
        RETURNING id
      `,
        [
          familyName,
          `Playlist de ${familyName} con las mejores canciones`,
          familyKey, // Guardar el key de la familia como "género"
          displayOrder,
        ],
      );

      const playlistId = createResult[0].id;
      this.logger.log(`✨ Playlist creada: ${playlistId} (orden: ${displayOrder})`);
      created++;
      familyIndex++;

      // Agregar las canciones a la playlist
      let totalDuration = 0;
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];

        await this.dataSource.query(
          `
          INSERT INTO playlist_songs ("playlistId", "songId", position, "addedAt")
          VALUES ($1, $2, $3, NOW())
        `,
          [playlistId, song.id, i],
        );

        totalDuration += song.duration || 0;
      }

      // Actualizar songCount y totalDuration
      await this.dataSource.query(
        `
        UPDATE playlists
        SET "songCount" = $1, "totalDuration" = $2, "updatedAt" = NOW()
        WHERE id = $3
      `,
        [songs.length, totalDuration, playlistId],
      );

      this.logger.log(
        `✅ ${songs.length} canciones agregadas (${Math.floor(totalDuration / 60)} minutos)`,
      );
    }

    const result = {
      created,
      skipped: 0,
      total: created,
    };

    this.logger.log('✅ Regeneración de playlists completada');
    this.logger.log(`📊 Resumen: ${created} playlists creadas (algunas pueden estar vacías)`);

    return result;
  }

  /**
   * Genera un array de números aleatorios de 0 a length-1
   * Usa Fisher-Yates shuffle
   */
  private generateRandomOrder(length: number): number[] {
    const order = Array.from({ length }, (_, i) => i);

    // Fisher-Yates shuffle
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    return order;
  }
}
