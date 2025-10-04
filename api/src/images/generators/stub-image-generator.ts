import { Injectable, Logger } from '@nestjs/common';
import { IImageGenerator, ImageGenerationResult } from '../interfaces/image-generator.interface';
import { CloudinaryService } from '../services/cloudinary.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generador simulado que usa imágenes placeholder de Cloudinary
 * NO genera imágenes nuevas, solo retorna URLs existentes
 * Útil para desarrollo y testing antes de integrar IA real
 */
@Injectable()
export class StubImageGenerator implements IImageGenerator {
  private readonly logger = new Logger(StubImageGenerator.name);
  private placeholderAssignments: Map<string, any>;

  constructor(private cloudinaryService: CloudinaryService) {
    this.loadPlaceholderAssignments();
    this.logger.log('✅ StubImageGenerator initialized');
  }

  /**
   * Carga el mapeo de géneros a placeholders desde el archivo JSON
   */
  private loadPlaceholderAssignments(): void {
    try {
      const assignmentsPath = path.join(
        __dirname,
        '../../../scripts/placeholder-assignments.json',
      );

      if (fs.existsSync(assignmentsPath)) {
        const data = JSON.parse(fs.readFileSync(assignmentsPath, 'utf-8'));
        this.placeholderAssignments = new Map();

        data.forEach((assignment: any) => {
          this.placeholderAssignments.set(assignment.genre, assignment);
        });

        this.logger.debug(
          `Loaded ${this.placeholderAssignments.size} placeholder assignments`,
        );
      } else {
        this.logger.warn('Placeholder assignments file not found, using fallback');
        this.placeholderAssignments = new Map();
      }
    } catch (error) {
      this.logger.error(
        `Error loading placeholder assignments: ${error.message}`,
      );
      this.placeholderAssignments = new Map();
    }
  }

  /**
   * Simula la generación de una imagen
   * Retorna URL de placeholder de Cloudinary según el género
   */
  async generateImage(
    prompt: string,
    genre: string,
  ): Promise<ImageGenerationResult> {
    this.logger.debug(`Generating stub image for genre: ${genre}`);

    // Simular delay de generación (2-4 segundos)
    const processingTime = Math.floor(Math.random() * 2000) + 2000;
    await this.delay(processingTime);

    // Obtener assignment para el género
    const assignment = this.placeholderAssignments.get(genre) || {
      publicId: 'cld-sample',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample',
      thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/sample',
      folder: 'default',
    };

    // Generar URLs con transformaciones de Cloudinary
    const imageUrl = this.cloudinaryService.generateFullSize(
      assignment.publicId,
    );
    const thumbnailUrl = this.cloudinaryService.generateThumbnail(
      assignment.publicId,
    );

    // Metadata simulada
    const result: ImageGenerationResult = {
      imageUrl,
      thumbnailUrl,
      publicId: assignment.publicId,
      metadata: {
        aiModel: 'stub-placeholder-v1',
        width: 1200,
        height: 1200,
        processingTime,
        prompt,
        genre,
        confidence: Math.random() * 0.3 + 0.7, // 0.7 - 1.0
      },
    };

    this.logger.log(
      `✅ Generated stub image for ${genre} (${processingTime}ms)`,
    );

    return result;
  }

  getName(): string {
    return 'StubImageGenerator';
  }

  async isAvailable(): Promise<boolean> {
    // Stub generator siempre está disponible
    return true;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
