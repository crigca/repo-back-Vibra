import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IImageGenerator, ImageGenerationResult } from '../interfaces/image-generator.interface';
import { CloudinaryService } from '../services/cloudinary.service';
import axios, { AxiosError } from 'axios';

/**
 * Generador principal de imágenes usando DALL-E 3 de OpenAI
 * Implementa reintentos automáticos y manejo robusto de errores
 */
@Injectable()
export class PrimaryAIGenerator implements IImageGenerator {
  private readonly logger = new Logger(PrimaryAIGenerator.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly model: string;
  private readonly imageSize: string;
  private readonly imageQuality: string;
  private readonly timeout: number;
  private readonly maxRetries = 3;

  constructor(
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
  ) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.apiUrl = this.configService.get<string>('OPENAI_API_URL', 'https://api.openai.com/v1/images/generations');
    this.model = this.configService.get<string>('OPENAI_MODEL', 'dall-e-3');
    this.imageSize = this.configService.get<string>('OPENAI_IMAGE_SIZE', '1024x1024');
    this.imageQuality = this.configService.get<string>('OPENAI_IMAGE_QUALITY', 'standard');
    this.timeout = this.configService.get<number>('IMAGE_GENERATION_TIMEOUT', 30000);

    if (!this.apiKey) {
      this.logger.error('❌ OPENAI_API_KEY not configured');
    } else {
      this.logger.log('✅ PrimaryAIGenerator (DALL-E 3) initialized');
    }
  }

  /**
   * Genera una imagen usando DALL-E 3
   */
  async generateImage(prompt: string, genre: string): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    this.logger.debug(`🎨 Generating image with DALL-E 3 for genre: ${genre}`);

    try {
      // Intentar generar con reintentos
      const imageUrl = await this.generateWithRetry(prompt);

      // Descargar la imagen generada
      const imageBuffer = await this.downloadImage(imageUrl);

      // Subir a Cloudinary
      const uploadResult = await this.cloudinaryService.uploadBuffer(
        imageBuffer,
        `vibra/ai-generated/${genre}`,
      );

      const processingTime = Date.now() - startTime;

      const result: ImageGenerationResult = {
        imageUrl: uploadResult.secure_url,
        thumbnailUrl: this.cloudinaryService.generateThumbnail(uploadResult.public_id),
        publicId: uploadResult.public_id,
        metadata: {
          aiModel: 'dall-e-3',
          width: uploadResult.width,
          height: uploadResult.height,
          processingTime,
          prompt,
          genre,
        },
      };

      this.logger.log(`✅ Image generated successfully (${processingTime}ms)`);
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`❌ Failed to generate image: ${error.message}`);
      throw new HttpException(
        `Failed to generate image with DALL-E 3: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Genera imagen con sistema de reintentos
   */
  private async generateWithRetry(prompt: string, attempt = 1): Promise<string> {
    try {
      return await this.callDallEAPI(prompt);
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw error;
      }

      this.logger.warn(`⚠️ Attempt ${attempt} failed, retrying... (${this.maxRetries - attempt} left)`);

      // Esperar antes de reintentar (backoff exponencial)
      await this.delay(1000 * attempt);

      return this.generateWithRetry(prompt, attempt + 1);
    }
  }

  /**
   * Llama a la API de DALL-E 3
   */
  private async callDallEAPI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          prompt: prompt,
          n: 1,
          size: this.imageSize,
          quality: this.imageQuality,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: this.timeout,
        },
      );

      if (!response.data?.data?.[0]?.url) {
        throw new Error('Invalid response from DALL-E API');
      }

      return response.data.data[0].url;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.response) {
          // Error de la API
          const status = axiosError.response.status;
          const data: any = axiosError.response.data;

          if (status === 401) {
            throw new Error('Invalid OpenAI API key');
          } else if (status === 429) {
            throw new Error('Rate limit exceeded');
          } else if (status === 400) {
            throw new Error(`Bad request: ${data?.error?.message || 'Invalid prompt'}`);
          } else {
            throw new Error(`API error (${status}): ${data?.error?.message || 'Unknown error'}`);
          }
        } else if (axiosError.code === 'ECONNABORTED') {
          throw new Error('Request timeout');
        } else {
          throw new Error(`Network error: ${axiosError.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Descarga la imagen desde la URL de DALL-E
   */
  private async downloadImage(imageUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  getName(): string {
    return 'PrimaryAIGenerator';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      // Verificar que la API key es válida haciendo una request simple
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error) {
      this.logger.error(`❌ DALL-E API not available: ${error.message}`);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
