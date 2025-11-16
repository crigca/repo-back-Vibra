import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PlaylistGeneratorService } from './playlist-generator.service';

/**
 * Servicio para programar la regeneración automática de playlists
 */
@Injectable()
export class PlaylistSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(PlaylistSchedulerService.name);
  private isFirstRun = true;

  constructor(
    private readonly playlistGenerator: PlaylistGeneratorService,
  ) {}

  /**
   * Se ejecuta cuando el módulo se inicializa (al arrancar la app)
   * Regenera playlists si no existen o si es el primer deploy
   */
  async onModuleInit() {
    this.logger.log('🚀 Verificando playlists al iniciar la aplicación...');

    try {
      // Aquí podrías verificar si existen playlists
      // Por ahora simplemente regeneramos en el primer inicio
      if (this.isFirstRun) {
        this.logger.log('🎯 Primera ejecución - Regenerando playlists...');
        await this.playlistGenerator.regenerateFamilyPlaylists();
        this.isFirstRun = false;
      }
    } catch (error) {
      this.logger.error('❌ Error al regenerar playlists en inicio:', error);
    }
  }

  /**
   * Cron job que se ejecuta todos los días a las 3:00 PM (15:00)
   * Timezone: America/Argentina/Buenos_Aires (UTC-3)
   *
   * Nota: El cron se ejecuta en UTC, así que 3pm Argentina (UTC-3) = 6pm UTC
   */
  @Cron('0 18 * * *', {
    name: 'regenerate-family-playlists',
    timeZone: 'UTC', // 18:00 UTC = 15:00 Argentina (UTC-3)
  })
  async handlePlaylistRegeneration() {
    this.logger.log('⏰ Cron job ejecutándose - Regenerando playlists...');

    try {
      const result = await this.playlistGenerator.regenerateFamilyPlaylists();

      this.logger.log(
        `✅ Playlists regeneradas exitosamente: ${result.created} creadas, ${result.skipped} saltadas`,
      );
    } catch (error) {
      this.logger.error('❌ Error al regenerar playlists:', error);
    }
  }
}
