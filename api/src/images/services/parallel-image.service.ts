import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeneratedImage, GeneratedImageDocument } from '../schemas/generated-image.schema';
import { PromptService } from './prompt.service';
import { PrimaryAIGenerator } from '../generators/primary-ai-generator';
import { StubImageGenerator } from '../generators/stub-image-generator';
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
 * - Devuelve imágenes precargadas aleatorias
 * - Genera nuevas imágenes en background
 */
@Injectable()
export class ParallelImageService {
  private readonly logger = new Logger(ParallelImageService.name);

  constructor(
    @InjectModel(GeneratedImage.name)
    private generatedImageModel: Model<GeneratedImageDocument>,
    private promptService: PromptService,
    private primaryAI: PrimaryAIGenerator,
    private stubAI: StubImageGenerator,
    private cloudinaryService: CloudinaryService,
  ) {
    this.logger.log('✅ ParallelImageService initialized');
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

      // 3. Si no hay precargadas, generar con Stub como fallback
      this.logger.warn(`⚠️  No precached images for genre: ${event.genre}, using fallback`);
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
   * Genera imagen en background (no bloquea)
   */
  private async generateInBackground(event: SongStartedEvent): Promise<void> {
    this.logger.debug(`🎨 Generating new image in background for: ${event.genre}`);

    try {
      // Obtener prompt
      const prompt = await this.promptService.getRandomPromptByGenre(event.genre);

      // Generar con PrimaryAI (DALL-E)
      const result = await this.primaryAI.generateImage(prompt.promptText, event.genre);

      // Guardar en MongoDB
      const newImage = new this.generatedImageModel({
        songId: event.songId,
        genre: event.genre,
        imageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        publicId: result.publicId,
        prompt: prompt.promptText,
        generator: 'PrimaryAIGenerator',
        processingTime: result.metadata.processingTime,
        metadata: {
          ...result.metadata,
          songTitle: event.title,
          songArtist: event.artist,
          promptId: (prompt as any)._id.toString(),
          promptCategory: prompt.category,
        },
        isActive: true,
      });

      await newImage.save();

      // Incrementar usage count del prompt
      await this.promptService.incrementUsageCount((prompt as any)._id.toString());

      this.logger.log(`✅ Background image generated: ${newImage._id}`);
    } catch (error) {
      this.logger.error(`❌ Failed to generate background image: ${error.message}`);
    }
  }

  /**
   * Genera imagen fallback con Stub si no hay precargadas
   */
  private async generateFallbackImage(event: SongStartedEvent): Promise<GeneratedImageDocument> {
    try {
      const prompt = await this.promptService.getRandomPromptByGenre(event.genre);
      const result = await this.stubAI.generateImage(prompt.promptText, event.genre);

      const fallbackImage = new this.generatedImageModel({
        songId: event.songId,
        genre: event.genre,
        imageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        publicId: result.publicId,
        prompt: prompt.promptText,
        generator: 'StubImageGenerator',
        processingTime: result.metadata.processingTime,
        metadata: {
          ...result.metadata,
          songTitle: event.title,
          songArtist: event.artist,
          promptId: (prompt as any)._id.toString(),
          promptCategory: prompt.category,
        },
        isActive: true,
      });

      await fallbackImage.save();
      await this.promptService.incrementUsageCount((prompt as any)._id.toString());

      this.logger.log(`✅ Fallback image created: ${fallbackImage._id}`);
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
