import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IImageGenerator,
  ImageGenerationResult,
} from '../interfaces/image-generator.interface';
import { CloudinaryService } from '../services/cloudinary.service';
import axios from 'axios';

/**
 * SecondaryAIGenerator - Replicate SDXL
 * Generador de imágenes usando Stable Diffusion XL via Replicate API
 *
 * Características:
 * - Calidad profesional (1024x1024)
 * - ~10x más económico que DALL-E (~$0.003/img)
 * - Retry logic con polling para async API
 * - Fallback automático en caso de falla
 */
@Injectable()
export class SecondaryAIGenerator implements IImageGenerator {
  private readonly logger = new Logger(SecondaryAIGenerator.name);
  private readonly apiToken: string;
  private readonly apiUrl: string;
  private readonly modelVersion: string;
  private readonly imageSize: number;
  private readonly inferenceSteps: number;
  private readonly guidanceScale: number;
  private readonly maxRetries = 3;
  private readonly pollInterval = 2000; // 2 segundos
  private readonly maxPollAttempts = 30; // 60 segundos max

  constructor(
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    this.apiToken = this.configService.get<string>('REPLICATE_API_TOKEN', '');
    this.apiUrl = this.configService.get<string>(
      'REPLICATE_API_URL',
      'https://api.replicate.com/v1/predictions',
    );
    this.modelVersion = this.configService.get<string>(
      'REPLICATE_SDXL_VERSION',
      '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
    );
    this.imageSize = this.configService.get<number>('REPLICATE_IMAGE_SIZE', 1024);
    this.inferenceSteps = this.configService.get<number>(
      'REPLICATE_NUM_INFERENCE_STEPS',
      30,
    );
    this.guidanceScale = this.configService.get<number>(
      'REPLICATE_GUIDANCE_SCALE',
      7.5,
    );

    this.logger.log('✅ SecondaryAIGenerator (Replicate SDXL) initialized');
  }

  async generateImage(
    prompt: string,
    genre: string,
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now();

    try {
      this.logger.debug(`🎨 Generating image with Replicate SDXL for genre: ${genre}`);

      // Crear predicción
      const predictionId = await this.createPrediction(prompt);

      // Polling hasta que termine
      const imageUrl = await this.pollPrediction(predictionId);

      // Descargar imagen
      const imageBuffer = await this.downloadImage(imageUrl);

      // Subir a Cloudinary
      const uploadResult = await this.cloudinaryService.uploadBuffer(
        imageBuffer,
        `vibra/ai-generated/${genre}`,
      );

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Image generated successfully with SDXL (${processingTime}ms)`,
      );

      return {
        imageUrl: uploadResult.secure_url,
        thumbnailUrl: uploadResult.secure_url, // SDXL no genera thumbnail separado
        publicId: uploadResult.public_id,
        metadata: {
          aiModel: 'Replicate SDXL',
          width: uploadResult.width,
          height: uploadResult.height,
          processingTime,
          prompt,
          genre,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Error generating image with SDXL: ${error.message}`,
      );

      throw new Error(
        `SecondaryAI generation failed after ${processingTime}ms: ${error.message}`,
      );
    }
  }

  /**
   * Crea una predicción en Replicate (async)
   */
  private async createPrediction(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          version: this.modelVersion,
          input: {
            prompt: prompt,
            width: this.imageSize,
            height: this.imageSize,
            num_inference_steps: this.inferenceSteps,
            guidance_scale: this.guidanceScale,
            scheduler: 'K_EULER',
            num_outputs: 1,
          },
        },
        {
          headers: {
            'Authorization': `Token ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const predictionId = response.data.id;
      this.logger.debug(`📋 Prediction created: ${predictionId}`);

      return predictionId;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Replicate API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
      }
      throw new Error(`Failed to create prediction: ${error.message}`);
    }
  }

  /**
   * Polling para obtener resultado de predicción
   */
  private async pollPrediction(predictionId: string): Promise<string> {
    const predictionUrl = `${this.apiUrl}/${predictionId}`;

    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      try {
        const response = await axios.get(predictionUrl, {
          headers: {
            'Authorization': `Token ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });

        const { status, output, error } = response.data;

        if (status === 'succeeded' && output && output.length > 0) {
          this.logger.debug(`✅ Prediction succeeded: ${predictionId}`);
          return output[0]; // URL de la imagen generada
        }

        if (status === 'failed') {
          throw new Error(`Prediction failed: ${error || 'Unknown error'}`);
        }

        if (status === 'canceled') {
          throw new Error('Prediction was canceled');
        }

        // Status: starting, processing -> seguir esperando
        this.logger.debug(
          `⏳ Prediction ${status} (attempt ${attempt + 1}/${this.maxPollAttempts})`,
        );
        await this.delay(this.pollInterval);
      } catch (error) {
        if (attempt === this.maxPollAttempts - 1) {
          throw new Error(
            `Polling timeout after ${this.maxPollAttempts * this.pollInterval / 1000}s: ${error.message}`,
          );
        }
        // Continuar polling en caso de error de red temporal
        await this.delay(this.pollInterval);
      }
    }

    throw new Error('Polling timeout: prediction did not complete in time');
  }

  /**
   * Descarga la imagen generada desde Replicate CDN
   */
  private async downloadImage(imageUrl: string): Promise<Buffer> {
    try {
      this.logger.debug(`📥 Downloading image from: ${imageUrl}`);

      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retorna el nombre del generador
   */
  getName(): string {
    return 'SecondaryAIGenerator';
  }

  /**
   * Verifica si el generador está disponible
   */
  async isAvailable(): Promise<boolean> {
    // Verificar que tengamos API token configurado
    if (!this.apiToken || this.apiToken === 'PENDING_TOKEN_HERE') {
      this.logger.warn('⚠️  Replicate API token not configured');
      return false;
    }

    return true;
  }
}
