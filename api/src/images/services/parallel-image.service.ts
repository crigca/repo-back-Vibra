import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeneratedImage, GeneratedImageDocument } from '../schemas/generated-image.schema';
import { PromptService } from './prompt.service';
import { PrimaryAIGenerator } from '../generators/primary-ai-generator';
import { SecondaryAIGenerator } from '../generators/secondary-ai-generator';
import { TertiaryAIGenerator } from '../generators/tertiary-ai-generator';
import { CloudinaryService } from './cloudinary.service';

export interface SongStartedEvent {
  songId: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
}

/**
 * Servicio orquestador para generación paralela de imágenes
 * - Escucha eventos song.started
 * - Devuelve imágenes precargadas aleatorias de MongoDB
 * - Genera nuevas imágenes en background con 3 AIs
 */
@Injectable()
export class ParallelImageService {
  private readonly logger = new Logger(ParallelImageService.name);

  constructor(
    @InjectModel(GeneratedImage.name)
    private generatedImageModel: Model<GeneratedImageDocument>,
    private promptService: PromptService,
    private primaryAI: PrimaryAIGenerator,
    private secondaryAI: SecondaryAIGenerator,
    private tertiaryAI: TertiaryAIGenerator,
  ) {
    this.logger.log('✅ ParallelImageService initialized with fallback chain: DALL-E → Replicate SDXL → FAL AI');
  }

  /**
   * Escucha el evento song.started y devuelve imagen precargada
   */
  @OnEvent('song.started')
  async handleSongStarted(event: SongStartedEvent): Promise<GeneratedImageDocument | null> {
    this.logger.log(`🎵 Song started: ${event.title} (${event.genre})`);

    try {
      // 1. Buscar imágenes precargadas del género
      const precachedImages = await this.findPrecachedImagesByGenre(event.genre);

      if (precachedImages.length > 0) {
        // Devolver imagen aleatoria
        const randomImage = this.selectRandomImage(precachedImages);
        this.logger.log(`✅ Returning precached image: ${randomImage._id} (${randomImage.generator})`);

        // 2. Generar nueva imagen en background (no esperar)
        this.generateInBackground(event).catch(err => {
          this.logger.error(`Error generating in background: ${err.message}`);
        });

        return randomImage;
      }

      // 3. Si no hay precargadas, intentar generar con las 3 IAs
      this.logger.warn(`⚠️  No precached images for genre: ${event.genre}, generating with AI fallback`);
      return await this.generateFallbackImage(event);

    } catch (error) {
      this.logger.error(`Error handling song started: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca TODAS las imágenes precargadas de un género
   */
  private async findPrecachedImagesByGenre(genre: string): Promise<GeneratedImageDocument[]> {
    try {
      const images = await this.generatedImageModel
        .find({ genre, isActive: true })
        .sort({ createdAt: -1 })
        .lean();

      this.logger.debug(`Found ${images.length} precached images for genre: ${genre}`);
      return images as GeneratedImageDocument[];
    } catch (error) {
      this.logger.error(`Error finding precached images: ${error.message}`);
      return [];
    }
  }

  /**
   * Selecciona imagen aleatoria del pool
   */
  private selectRandomImage(images: GeneratedImageDocument[]): GeneratedImageDocument {
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  }

  /**
   * Genera imagen en background con fallback automático (no bloquea)
   * Fallback chain: DALL-E 3 → Replicate SDXL → FAL AI (Flux Schnell)
   */
  private async generateInBackground(event: SongStartedEvent): Promise<void> {
    this.logger.debug(`🎨 Generating new image in background for: ${event.genre}`);

    try {
      // Obtener prompt
      const prompt = await this.promptService.getRandomPromptByGenre(event.genre);

      // Intentar generar con fallback automático
      const result = await this.generateWithFallback(prompt.promptText, event.genre);

      // Guardar en MongoDB
      const newImage = new this.generatedImageModel({
        songId: event.songId,
        genre: event.genre,
        imageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        cloudinaryPublicId: result.publicId,
        cloudinaryFolder: `vibra/ai-generated/${event.genre}`,
        prompt: prompt.promptText,
        generator: result.provider,
        processingTime: result.processingTime,
        metadata: {
          songTitle: event.title,
          songArtist: event.artist,
          promptId: (prompt as any)._id.toString(),
          promptCategory: prompt.category,
          aiModel: result.provider,
          width: result.width || 1024,
          height: result.height || 1024,
        },
        isActive: true,
      });

      await newImage.save();

      // Incrementar usage count del prompt
      await this.promptService.incrementUsageCount((prompt as any)._id.toString());

      this.logger.log(`✅ Background image generated: ${newImage._id} (${result.provider})`);
    } catch (error) {
      this.logger.error(`❌ Failed to generate background image: ${error.message}`);
    }
  }

  /**
   * Intenta generar imagen con fallback automático
   * 1. DALL-E 3 (Primary)
   * 2. Replicate SDXL (Secondary)
   * 3. FAL AI Flux Schnell (Tertiary)
   */
  private async generateWithFallback(prompt: string, genre: string): Promise<any> {
    // Intento 1: DALL-E 3
    try {
      this.logger.debug(`🎨 Attempt 1: PrimaryAI (DALL-E 3)`);
      const result = await this.primaryAI.generateImage(prompt, genre);
      this.logger.log(`✅ PrimaryAI succeeded`);
      return result;
    } catch (primaryError) {
      this.logger.warn(`⚠️  PrimaryAI failed: ${primaryError.message}`);

      // Intento 2: Replicate SDXL
      try {
        this.logger.debug(`🎨 Attempt 2: SecondaryAI (Replicate SDXL)`);
        const result = await this.secondaryAI.generateImage(prompt, genre);
        this.logger.log(`✅ SecondaryAI succeeded (fallback)`);
        return result;
      } catch (secondaryError) {
        this.logger.warn(`⚠️  SecondaryAI failed: ${secondaryError.message}`);

        // Intento 3: FAL AI (Flux Schnell)
        try {
          this.logger.debug(`🎨 Attempt 3: TertiaryAI (FAL AI - Flux Schnell)`);
          const result = await this.tertiaryAI.generateImage(prompt, genre);
          this.logger.log(`✅ TertiaryAI succeeded (final fallback)`);
          return result;
        } catch (tertiaryError) {
          this.logger.error(`❌ All AI generators failed`);
          throw new Error(`All AI generators failed. Last error: ${tertiaryError.message}`);
        }
      }
    }
  }

  /**
   * Genera imagen fallback con las 3 IAs si no hay precargadas
   */
  private async generateFallbackImage(event: SongStartedEvent): Promise<GeneratedImageDocument> {
    try {
      const prompt = await this.promptService.getRandomPromptByGenre(event.genre);
      const result = await this.generateWithFallback(prompt.promptText, event.genre);

      const fallbackImage = new this.generatedImageModel({
        songId: event.songId,
        genre: event.genre,
        imageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        cloudinaryPublicId: result.publicId,
        cloudinaryFolder: `vibra/ai-generated/${event.genre}`,
        prompt: prompt.promptText,
        generator: result.provider,
        processingTime: result.processingTime,
        metadata: {
          songTitle: event.title,
          songArtist: event.artist,
          promptId: (prompt as any)._id.toString(),
          promptCategory: prompt.category,
          aiModel: result.provider,
          width: result.width || 1024,
          height: result.height || 1024,
        },
        isActive: true,
      });

      await fallbackImage.save();
      await this.promptService.incrementUsageCount((prompt as any)._id.toString());

      this.logger.log(`✅ Fallback image created: ${fallbackImage._id} (${result.provider})`);
      return fallbackImage;
    } catch (error) {
      this.logger.error(`Error creating fallback image: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene imagen para mostrar al usuario (API pública)
   */
  async getImageForSong(songId: string, genre: string): Promise<GeneratedImageDocument | null> {
    try {
      // Buscar imágenes del género
      const images = await this.findPrecachedImagesByGenre(genre);

      if (images.length > 0) {
        return this.selectRandomImage(images);
      }

      return null;
    } catch (error) {
      this.logger.error(`Error getting image for song: ${error.message}`);
      return null;
    }
  }
}
