import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IImageGenerator,
  ImageGenerationResult,
} from '../interfaces/image-generator.interface';
import { CloudinaryService } from '../services/cloudinary.service';
import axios from 'axios';

/**
 * TertiaryAIGenerator - FAL AI (Flux Schnell)
 * Generador de imágenes usando Flux Schnell via FAL AI
 *
 * Características:
 * - Muy rápido (~1-3 segundos)
 * - Económico (~$0.003/img similar a Replicate)
 * - Buena calidad con Flux
 * - Ideal para tier 3 y 4
 */
@Injectable()
export class TertiaryAIGenerator implements IImageGenerator {
  private readonly logger = new Logger(TertiaryAIGenerator.name);
  private readonly apiToken: string;
  private readonly apiUrl: string;
  private readonly maxRetries = 3;
  private readonly timeout = 60000; // 60 segundos

  constructor(
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    this.apiToken = this.configService.get<string>('FAL_API_TOKEN', '');
    this.apiUrl = this.configService.get<string>(
      'FAL_API_URL',
      'https://fal.run/fal-ai/flux-schnell',
    );

    if (!this.apiToken) {
      this.logger.error('❌ FAL_API_TOKEN not configured');
    } else {
      this.logger.log('✅ TertiaryAIGenerator (FAL AI - Flux Schnell) initialized');
    }
  }

  getName(): string {
    return 'TertiaryAIGenerator';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiToken;
  }

  async generateImage(
    prompt: string,
    genre: string,
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    try {
      this.logger.debug(`🎨 Generating image with FAL AI for genre: ${genre}`);

      // Generar imagen con FAL AI
      const imageUrl = await this.generateWithFAL(prompt);

      // Descargar imagen
      const imageBuffer = await this.downloadImage(imageUrl);

      // Subir a Cloudinary
      const uploadResult = await this.cloudinaryService.uploadBuffer(
        imageBuffer,
        `vibra/ai-generated/${genre}`,
      );

      const processingTime = Date.now() - startTime;

      const result: ImageGenerationResult = {
        imageUrl: uploadResult.secure_url,
        thumbnailUrl: this.cloudinaryService.generateThumbnail(
          uploadResult.public_id,
        ),
        publicId: uploadResult.public_id,
        metadata: {
          aiModel: 'flux-schnell',
          width: uploadResult.width,
          height: uploadResult.height,
          processingTime,
          prompt,
          genre,
        },
      };

      this.logger.log(`✅ Image generated successfully with FAL AI (${processingTime}ms)`);
      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`❌ Failed to generate image with FAL AI: ${error.message}`);
      throw new HttpException(
        `Failed to generate image with FAL AI: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Genera imagen con FAL AI
   */
  private async generateWithFAL(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          prompt,
          image_size: 'square_hd', // 1024x1024
          num_inference_steps: 4, // Flux Schnell es rápido con pocos steps
          num_images: 1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Key ${this.apiToken}`,
          },
          timeout: this.timeout,
        },
      );

      // FAL AI retorna directamente la URL de la imagen
      if (response.data && response.data.images && response.data.images[0]) {
        return response.data.images[0].url;
      }

      throw new Error('No image URL returned from FAL AI');
    } catch (error) {
      if (error.response) {
        this.logger.error(
          `FAL API error ${error.response.status}: ${JSON.stringify(error.response.data)}`,
        );
        throw new Error(
          `FAL API error ${error.response.status}: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Descarga la imagen desde la URL
   */
  private async downloadImage(imageUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(`Failed to download image: ${error.message}`);
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }
}
