import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { GeneratedImage, GeneratedImageDocument } from '../schemas/generated-image.schema';
import { PromptService } from './prompt.service';
import type { IImageGenerator } from '../interfaces/image-generator.interface';
import { Song } from '../../music/entities/song.entity';
import { PrimaryAIGenerator } from '../generators/primary-ai-generator';
import { SecondaryAIGenerator } from '../generators/secondary-ai-generator';
import { TertiaryAIGenerator } from '../generators/tertiary-ai-generator';

export interface GenerateImageOptions {
  songId?: string;
  genre?: string;
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
  private generationJobs: Map<string, { genre: string; timestamp: number; counts: any }> = new Map();

  constructor(
    @InjectModel(GeneratedImage.name)
    private generatedImageModel: Model<GeneratedImageDocument>,
    @InjectRepository(Song)
    private songRepository: Repository<Song>,
    private promptService: PromptService,
    @Inject('IImageGenerator')
    private imageGenerator: IImageGenerator,
    private primaryAI: PrimaryAIGenerator,
    private secondaryAI: SecondaryAIGenerator,
    private tertiaryAI: TertiaryAIGenerator,
  ) {
    this.logger.log('✅ ImagesService initialized');
  }

  /**
   * Genera una imagen para un género (o canción específica si se proporciona songId)
   * Flujo: Genre/Song → Prompt (MongoDB) → Generator → Save (MongoDB)
   */
  async generateImage(options: GenerateImageOptions): Promise<GeneratedImageDocument> {
    const { songId, genre, category } = options;

    if (!songId && !genre) {
      throw new Error('Must provide either songId or genre');
    }

    this.logger.log(`Generating image for ${songId ? `song: ${songId}` : `genre: ${genre}`}`);

    try {
      let targetGenre = genre;

      // 1. Si se proporciona songId, buscar canción para obtener género
      if (songId) {
        const song = await this.songRepository.findOne({ where: { id: songId } });

        if (!song) {
          throw new NotFoundException(`Song not found: ${songId}`);
        }

        this.logger.debug(`Found song: ${song.title} (${song.genre})`);
        targetGenre = song.genre || 'Pop';
      }

      if (!targetGenre) {
        throw new Error('Genre could not be determined');
      }

      // 2. Obtener prompt por género desde MongoDB
      const prompt = await this.promptService.getRandomPromptByGenre(
        targetGenre,
        category,
      );

      this.logger.debug(`Using prompt: ${(prompt as any)._id} (${prompt.category})`);

      // 3. Generar imagen usando el generador
      const startTime = Date.now();
      const generationResult = await this.imageGenerator.generateImage(
        prompt.promptText,
        targetGenre,
      );
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Image generated in ${processingTime}ms using ${this.imageGenerator.getName()}`,
      );

      // 4. Guardar en MongoDB
      const generatedImage = new this.generatedImageModel({
        songId: songId || undefined,
        genre: targetGenre,
        imageUrl: generationResult.imageUrl,
        thumbnailUrl: generationResult.thumbnailUrl,
        cloudinaryPublicId: generationResult.publicId,
        cloudinaryFolder: generationResult.publicId.split('/')[0] || 'vibra',
        prompt: prompt.promptText,
        generator: this.imageGenerator.getName(),
        metadata: {
          ...generationResult.metadata,
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
   * Obtiene imágenes aleatorias ignorando el género.
   */
  private async getRandomImages(
    limit: number,
  ): Promise<GeneratedImageDocument[]> {
    this.logger.debug(`Fetching ${limit} random images as fallback.`);
    try {
      const images = await this.generatedImageModel
        .aggregate([
          { $match: { isActive: true } },
          { $sample: { size: limit } }, // Usamos $sample para aleatoriedad
        ])
        .option({ lean: true }) // <--- ¡AQUÍ ESTÁ LA CLAVE!
        .exec();

      // El tipo de retorno debe ser adaptado. Si usas 'lean', realmente
      // devuelve `GeneratedImageDocument[]` con tipos planos (FlattenMaps).
      // Para simplificar, puedes usar `any[]` si el tipo genérico es muy complejo,
      // o definir un tipo `GeneratedImageLean` si prefieres estricta tipificación.
      // Asumiendo que GeneratedImageDocument es el Documento de Mongoose,
      // usamos `any[]` o `GeneratedImageDocument[]` con un casting ligero.
      return images as any[]; // Usamos 'any' para evitar la complejidad de 'FlattenMaps'
      // O mejor aún, definimos el tipo exacto para 'lean' si es posible,
      // pero por ahora, el casting es el camino más rápido.
    } catch (error) {
      this.logger.error(`Error fetching random images: ${error.message}`);
      return [];
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

      const byGenerator = await this.generatedImageModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$generator', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return {
        total: stats[0]?.totalImages || 0,
        avgProcessingTime: Math.round(stats[0]?.avgProcessingTime || 0),
        uniqueSongs: stats[0]?.uniqueSongs?.length || 0,
        uniqueGenres: stats[0]?.uniqueGenres?.length || 0,
        byGenre: byGenre.map((g) => ({ genre: g._id, count: g.count })),
        byGenerator: byGenerator.map((g) => ({ generator: g._id, count: g.count })),
      };
    } catch (error) {
      this.logger.error(`Error getting image stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene imágenes balanceadas para reproducción con generación en background
   * Mix: 33% precargadas, 42% FAL, 17% Replicate, 8% DALL-E
   *
   * @param genre - Género musical
   * @param durationSeconds - Duración de la canción en segundos
   * @returns Array de imágenes balanceadas + imágenes generándose
   */
  async getBalancedImagesForPlayback(
      genre: string,
      durationSeconds: number,
  ): Promise<{ images: any[]; breakdown: any; generating: boolean }> {
      try {
          // Calcular imágenes totales necesarias
          const totalImages = Math.ceil(durationSeconds / 5);

          // Calcular distribución
          const fromDB = Math.round(totalImages * 0.33);
          const fromFAL = Math.round(totalImages * 0.42);
          const fromReplicate = Math.round(totalImages * 0.17);
          const fromDALLE = Math.ceil(totalImages * 0.08);

          this.logger.log(
              `📊 Balanced mix for ${durationSeconds}s: ${totalImages} total (DB:${fromDB}, FAL:${fromFAL}, Replicate:${fromReplicate}, DALL-E:${fromDALLE})`,
          );

          // 1. Obtener TODAS las imágenes actuales del género
          let allImages = await this.generatedImageModel
              .find({ genre, isActive: true })
              .sort({ createdAt: -1 })
              .limit(totalImages)
              .lean() as any[];;

          // ----------------------------------------------------
          // 💡 Ajuste #1: Calcular cuántas imágenes son realmente del género solicitado
          const genreImagesCount = allImages.length;
          // ----------------------------------------------------

          // 👇 FALLBACK DE IMÁGENES ALEATORIAS
          if (allImages.length < totalImages) {
              const neededForFallback = totalImages - allImages.length;
              this.logger.warn(
                  `⚠️ Solo ${genreImagesCount}/${totalImages} encontradas para ${genre}. Buscando ${neededForFallback} imágenes aleatorias.`,
              );
              
              const randomImages = await this.getRandomImages(neededForFallback);
              
              // Agregamos las imágenes aleatorias al final del array
              allImages = [...allImages, ...randomImages];
          }
          // FIN DEL FALLBACK

          // 2. Marcar las imágenes con su origen (incluyendo las random)
          const images = allImages.map((img: any) => ({
              id: img._id,
              imageUrl: img.imageUrl,
              thumbnailUrl: img.thumbnailUrl,
              generator: img.generator,
              // source: 'precached' si el género coincide, sino 'fallback-random'
              source: img.genre === genre ? 'precached' : 'fallback-random',
              createdAt: img.createdAt,
          }));

          // ----------------------------------------------------
          // 💡 Ajuste #2: Lógica de 'needMore' para la generación en background
          
          // needMore es TRUE si no hay suficientes imágenes precargadas del género original
          const needMore = genreImagesCount < fromDB; 
          
          // Si no tenemos imágenes del género, siempre necesitamos generar
          const imagesToGenerate = totalImages - genreImagesCount; 

          // La generación debe basarse en el totalImages calculado (por duración)
          // y lo que realmente tenemos del GENERO.

          // Usamos needToGenerate para simplificar el flujo del job.
          const needToGenerate = genreImagesCount < totalImages;
          const jobKey = `${genre}-${durationSeconds}`;
          // ----------------------------------------------------


          // 4. Si hay una necesidad real de generar (basada en el género) y no hay un job activo, iniciar.
          if (needToGenerate && !this.generationJobs.has(jobKey)) {
              
              this.logger.log(`🎨 Starting background generation: ${imagesToGenerate} images needed for ${genre}`);

              // Registrar job
              this.generationJobs.set(jobKey, {
                  genre,
                  timestamp: Date.now(),
                  counts: { fromFAL, fromReplicate, fromDALLE },
              });

              // Iniciar generación en background (no esperar)
              this.generateBalancedImagesInBackground(genre, fromFAL, fromReplicate, fromDALLE, jobKey);
          }

          // 5. Retornar con breakdown
          return {
              images,
              // 💡 Ajuste #3: Retornar 'generating' si la necesidad se activa
              generating: needToGenerate && !this.generationJobs.has(jobKey), 
              breakdown: {
                  totalImages,
                  durationSeconds,
                  // Devolvemos la cantidad real de imágenes devueltas (precached + fallback)
                  currentImages: images.length, 
                  distribution: {
                      // Aquí mostramos cuántas del género *debería* tener
                      precached: { 
                          count: fromDB, 
                          percentage: 33, 
                          actual: genreImagesCount // Lo que realmente se encontró del género
                      },
                      fal: { count: fromFAL, percentage: 42, toGenerate: needToGenerate ? fromFAL : 0 },
                      replicate: { count: fromReplicate, percentage: 17, toGenerate: needToGenerate ? fromReplicate : 0 },
                      dalle: { count: fromDALLE, percentage: 8, toGenerate: needToGenerate ? fromDALLE : 0 },
                  },
              },
          };
      } catch (error) {
          this.logger.error(`Error getting balanced images: ${error.message}`);
          throw error;
      }
  }

  /**
   * Genera imágenes en background según la distribución balanceada
   */
  private async generateBalancedImagesInBackground(
    genre: string,
    falCount: number,
    replicateCount: number,
    dalleCount: number,
    jobKey: string,
  ): Promise<void> {
    this.logger.log(`🎨 Background generation started for ${genre}: FAL=${falCount}, Replicate=${replicateCount}, DALL-E=${dalleCount}`);

    try {
      // Generar con FAL AI (42% - más barato y rápido)
      for (let i = 0; i < falCount; i++) {
        this.generateSingleImage(genre, this.tertiaryAI, 'TertiaryAIGenerator').catch(err =>
          this.logger.error(`Failed to generate FAL image ${i + 1}: ${err.message}`)
        );
      }

      // Generar con Replicate (17%)
      for (let i = 0; i < replicateCount; i++) {
        this.generateSingleImage(genre, this.secondaryAI, 'SecondaryAIGenerator').catch(err =>
          this.logger.error(`Failed to generate Replicate image ${i + 1}: ${err.message}`)
        );
      }

      // Generar con DALL-E (8% - más caro)
      for (let i = 0; i < dalleCount; i++) {
        this.generateSingleImage(genre, this.primaryAI, 'PrimaryAIGenerator').catch(err =>
          this.logger.error(`Failed to generate DALL-E image ${i + 1}: ${err.message}`)
        );
      }

      // Limpiar job después de 5 minutos
      setTimeout(() => {
        this.generationJobs.delete(jobKey);
        this.logger.debug(`Cleaned up generation job: ${jobKey}`);
      }, 300000);

    } catch (error) {
      this.logger.error(`Background generation error: ${error.message}`);
      this.generationJobs.delete(jobKey);
    }
  }

  /**
   * Genera una sola imagen con un generador específico
   */
  private async generateSingleImage(
    genre: string,
    generator: IImageGenerator,
    generatorName: string,
  ): Promise<void> {
    try {
      const prompt = await this.promptService.getRandomPromptByGenre(genre);
      const startTime = Date.now();

      const result = await generator.generateImage(prompt.promptText, genre);
      const processingTime = Date.now() - startTime;

      const newImage = new this.generatedImageModel({
        genre,
        imageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        cloudinaryPublicId: result.publicId,
        cloudinaryFolder: `vibra/ai-generated/${genre}`,
        prompt: prompt.promptText,
        generator: generatorName,
        processingTime,
        metadata: {
          aiModel: generatorName,
          promptId: (prompt as any)._id.toString(),
          promptCategory: prompt.category,
          width: result.metadata?.width || 1024,
          height: result.metadata?.height || 1024,
        },
        isActive: true,
      });

      await newImage.save();
      await this.promptService.incrementUsageCount((prompt as any)._id.toString());

      this.logger.log(`✅ Generated ${generatorName} image for ${genre}: ${newImage._id}`);
    } catch (error) {
      this.logger.error(`Error generating single image with ${generatorName}: ${error.message}`);
      throw error;
    }
  }
}
