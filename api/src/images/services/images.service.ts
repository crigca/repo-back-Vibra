import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { GeneratedImage, GeneratedImageDocument } from '../schemas/generated-image.schema';
import { PromptService } from './prompt.service';
import type { IImageGenerator } from '../interfaces/image-generator.interface';
import { Song } from '../../music/entities/song.entity';

export interface GenerateImageOptions {
  songId: string;
  category?: 'base' | 'variation' | 'mood' | 'style';
}

export interface GetImagesOptions {
  songId?: string;
  genre?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @InjectModel(GeneratedImage.name)
    private generatedImageModel: Model<GeneratedImageDocument>,
    @InjectRepository(Song)
    private songRepository: Repository<Song>,
    private promptService: PromptService,
    @Inject('IImageGenerator')
    private imageGenerator: IImageGenerator,
  ) {
    this.logger.log('✅ ImagesService initialized');
  }

  /**
   * Genera una imagen para una canción
   * Flujo: Song (PostgreSQL) → Prompt (MongoDB) → Generator → Save (MongoDB)
   */
  async generateImage(options: GenerateImageOptions): Promise<GeneratedImageDocument> {
    const { songId, category } = options;

    this.logger.log(`Generating image for song: ${songId}`);

    try {
      // 1. Buscar canción en PostgreSQL
      const song = await this.songRepository.findOne({ where: { id: songId } });

      if (!song) {
        throw new NotFoundException(`Song not found: ${songId}`);
      }

      this.logger.debug(`Found song: ${song.title} (${song.genre})`);

      // 2. Obtener prompt por género desde MongoDB
      const prompt = await this.promptService.getRandomPromptByGenre(
        song.genre || 'Pop',
        category,
      );

      this.logger.debug(`Using prompt: ${(prompt as any)._id} (${prompt.category})`);

      // 3. Generar imagen usando el generador
      const startTime = Date.now();
      const generationResult = await this.imageGenerator.generateImage(
        prompt.promptText,
        song.genre || 'Pop',
      );
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Image generated in ${processingTime}ms using ${this.imageGenerator.getName()}`,
      );

      // 4. Guardar en MongoDB
      const generatedImage = new this.generatedImageModel({
        songId: song.id,
        imageUrl: generationResult.imageUrl,
        thumbnailUrl: generationResult.thumbnailUrl,
        cloudinaryPublicId: generationResult.publicId,
        cloudinaryFolder: generationResult.publicId.split('/')[0] || 'vibra',
        prompt: prompt.promptText,
        generator: this.imageGenerator.getName(),
        genre: song.genre,
        metadata: {
          ...generationResult.metadata,
          songTitle: song.title,
          songArtist: song.artist,
          promptId: (prompt as any)._id.toString(),
          promptCategory: prompt.category,
        },
        processingTime,
        isActive: true,
        userFavorites: [],
      });

      await generatedImage.save();

      this.logger.log(`✅ Image saved to MongoDB: ${generatedImage._id}`);

      // 5. Incrementar usage count del prompt
      await this.promptService.incrementUsageCount((prompt as any)._id.toString());

      return generatedImage;
    } catch (error) {
      this.logger.error(`Error generating image: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtiene imágenes de una canción
   */
  async getImagesBySong(
    songId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ images: GeneratedImageDocument[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [images, total] = await Promise.all([
        this.generatedImageModel
          .find({ songId, isActive: true })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.generatedImageModel.countDocuments({ songId, isActive: true }),
      ]);

      this.logger.debug(`Found ${images.length} images for song: ${songId}`);

      return {
        images: images as GeneratedImageDocument[],
        total,
      };
    } catch (error) {
      this.logger.error(`Error getting images by song: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todas las imágenes con paginación
   */
  async getAllImages(
    options: GetImagesOptions = {},
  ): Promise<{ images: GeneratedImageDocument[]; total: number }> {
    const { genre, page = 1, limit = 10 } = options;

    try {
      const skip = (page - 1) * limit;
      const query: any = { isActive: true };

      if (genre) {
        query.genre = genre;
      }

      const [images, total] = await Promise.all([
        this.generatedImageModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.generatedImageModel.countDocuments(query),
      ]);

      this.logger.debug(`Found ${images.length} images (total: ${total})`);

      return {
        images: images as GeneratedImageDocument[],
        total,
      };
    } catch (error) {
      this.logger.error(`Error getting all images: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene una imagen por ID
   */
  async getImageById(imageId: string): Promise<GeneratedImageDocument> {
    try {
      const image = await this.generatedImageModel.findById(imageId);

      if (!image) {
        throw new NotFoundException(`Image not found: ${imageId}`);
      }

      return image;
    } catch (error) {
      this.logger.error(`Error getting image by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina una imagen (soft delete)
   */
  async deleteImage(imageId: string): Promise<void> {
    try {
      const result = await this.generatedImageModel.findByIdAndUpdate(imageId, {
        isActive: false,
      });

      if (!result) {
        throw new NotFoundException(`Image not found: ${imageId}`);
      }

      this.logger.log(`✅ Image soft deleted: ${imageId}`);
    } catch (error) {
      this.logger.error(`Error deleting image: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de imágenes generadas
   */
  async getImageStats(): Promise<any> {
    try {
      const stats = await this.generatedImageModel.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalImages: { $sum: 1 },
            avgProcessingTime: { $avg: '$processingTime' },
            uniqueSongs: { $addToSet: '$songId' },
            uniqueGenres: { $addToSet: '$genre' },
          },
        },
      ]);

      const byGenre = await this.generatedImageModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$genre', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return {
        total: stats[0]?.totalImages || 0,
        avgProcessingTime: Math.round(stats[0]?.avgProcessingTime || 0),
        uniqueSongs: stats[0]?.uniqueSongs?.length || 0,
        uniqueGenres: stats[0]?.uniqueGenres?.length || 0,
        byGenre: byGenre.map((g) => ({ genre: g._id, count: g.count })),
      };
    } catch (error) {
      this.logger.error(`Error getting image stats: ${error.message}`);
      throw error;
    }
  }
}
