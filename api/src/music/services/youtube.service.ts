import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

/**
 * Resultado de búsqueda de YouTube
 */
export interface YouTubeSearchResult {
  id: string;
  title: string;
  artist: string;
  duration: number;
  publishedAt: string;
  viewCount?: number;
}

/**
 * Servicio de integración con YouTube API
 */
@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('YOUTUBE_BASE_URL') || '';

    if (!this.apiKey) {
      throw new Error(
        'YOUTUBE_API_KEY no está configurada en las variables de entorno',
      );
    }

    if (!this.baseUrl) {
      throw new Error(
        'YOUTUBE_BASE_URL no está configurada en las variables de entorno',
      );
    }

    this.logger.log('✅ YouTubeService inicializado correctamente');
  }

  // Buscar videos en YouTube
  async searchVideos(
    query: string,
    maxResults: number = 10,
    regionCode: string = 'AR',
  ): Promise<YouTubeSearchResult[]> {
    try {
      this.logger.log(
        `🔍 Buscando en YouTube: "${query}" (max: ${maxResults}, región: ${regionCode})`,
      );

      const searchResponse = await this.makeSearchRequest(
        query,
        maxResults,
        regionCode,
      );

      const videoIds = this.extractVideoIds(searchResponse.data);

      if (videoIds.length === 0) {
        this.logger.warn('⚠️ No se encontraron videos para la búsqueda');
        return [];
      }

      const videosResponse = await this.getVideosDetails(videoIds);

      const results = this.formatSearchResults(
        searchResponse.data,
        videosResponse.data,
      );

      this.logger.log(
        `✅ Búsqueda exitosa: ${results.length} videos encontrados`,
      );
      return results;
    } catch (error) {
      this.logger.error(`❌ Error al buscar en YouTube: ${error.message}`);

      if (error.response?.status === 403) {
        throw new HttpException(
          'API Key de YouTube inválida o sin permisos',
          HttpStatus.FORBIDDEN,
        );
      } else if (error.response?.status === 400) {
        throw new HttpException(
          'Parámetros de búsqueda inválidos',
          HttpStatus.BAD_REQUEST,
        );
      } else if (error.response?.status === 429) {
        throw new HttpException(
          'Límite de cuota de YouTube API excedido',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      } else {
        throw new HttpException(
          'Error al conectar con YouTube API',
          HttpStatus.BAD_GATEWAY,
        );
      }
    }
  }

  // Obtener detalles de un video específico por ID
  async getVideoById(videoId: string): Promise<YouTubeSearchResult | null> {
    try {
      this.logger.log(`🔍 Obteniendo detalles del video: ${videoId}`);

      // Obtener snippet y detalles del video
      const videoResponse = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          id: videoId,
          part: 'snippet,contentDetails,statistics',
        },
      });

      const videoData = videoResponse.data;

      if (!videoData.items || videoData.items.length === 0) {
        this.logger.warn(`⚠️ Video no encontrado: ${videoId}`);
        return null;
      }

      const video = videoData.items[0];

      const result: YouTubeSearchResult = {
        id: video.id,
        title: this.cleanTitle(video.snippet.title),
        artist: this.extractArtist(video.snippet.title, video.snippet.channelTitle),
        duration: this.parseDuration(video.contentDetails.duration),
        publishedAt: video.snippet.publishedAt,
        viewCount: parseInt(video.statistics?.viewCount || '0'),
      };

      this.logger.log(`✅ Video encontrado: "${result.title}" por ${result.artist}`);
      return result;

    } catch (error) {
      this.logger.error(`❌ Error al obtener video ${videoId}: ${error.message}`);

      if (error.response?.status === 403) {
        throw new HttpException(
          'API Key de YouTube inválida o sin permisos',
          HttpStatus.FORBIDDEN,
        );
      } else if (error.response?.status === 404) {
        this.logger.warn(`⚠️ Video no encontrado o privado: ${videoId}`);
        return null;
      } else if (error.response?.status === 429) {
        throw new HttpException(
          'Límite de cuota de YouTube API excedido',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      } else {
        throw new HttpException(
          'Error al conectar con YouTube API',
          HttpStatus.BAD_GATEWAY,
        );
      }
    }
  }

  // Realizar petición de búsqueda
  private async makeSearchRequest(
    query: string,
    maxResults: number,
    regionCode: string,
  ): Promise<AxiosResponse> {
    return axios.get(`${this.baseUrl}/search`, {
      params: {
        key: this.apiKey,
        q: query,
        part: 'snippet',
        type: 'video',
        maxResults,
        regionCode,
        videoCategoryId: '10',
        order: 'relevance',
      },
    });
  }

  // Extraer IDs de video
  private extractVideoIds(searchData: any): string[] {
    return searchData.items
      .filter((item) => item.id.kind === 'youtube#video')
      .map((item) => item.id.videoId);
  }

  // Obtener detalles de videos
  private async getVideosDetails(videoIds: string[]): Promise<AxiosResponse> {
    return axios.get(`${this.baseUrl}/videos`, {
      params: {
        key: this.apiKey,
        id: videoIds.join(','),
        part: 'contentDetails,statistics',
      },
    });
  }

  // Formatear resultados
  private formatSearchResults(
    searchData: any,
    videosData: any,
  ): YouTubeSearchResult[] {
    const videosMap = new Map();
    videosData.items.forEach((video) => {
      videosMap.set(video.id, video);
    });

    return searchData.items
      .filter((item) => item.id.kind === 'youtube#video')
      .map((item) => {
        const videoDetails = videosMap.get(item.id.videoId);

        return {
          id: item.id.videoId,
          title: this.cleanTitle(item.snippet.title),
          artist: this.extractArtist(item.snippet.title, item.snippet.channelTitle),
          duration: this.parseDuration(
            videoDetails?.contentDetails?.duration || 'PT0S',
          ),
          publishedAt: item.snippet.publishedAt,
          viewCount: parseInt(videoDetails?.statistics?.viewCount || '0'),
        };
      });
  }

  // Limpiar título HTML
  private cleanTitle(title: string): string {
    return title
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'");
  }

  // Convertir duración ISO 8601 a segundos
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  // Extraer artista del título o usar canal como fallback
  private extractArtist(title: string, channelTitle: string): string {
    // Probar múltiples patrones
    const patterns = [
      /^([^-:]+)\s*[-:]\s*.+/,     // "Artista - Canción" o "Artista : Canción"
      /^([^|]+)\s*\|\s*.+/,        // "Miss Monique WE2 | Tomorrowland"
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        const extracted = match[1].trim();
        if (extracted.length > 1 && extracted.length < 50) {
          return extracted;
        }
      }
    }

    return channelTitle;
  }
}
