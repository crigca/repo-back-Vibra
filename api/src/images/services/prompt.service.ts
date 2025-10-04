import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prompt, PromptDocument } from '../schemas/prompt.schema';

export interface PromptStats {
  totalPrompts: number;
  activePrompts: number;
  totalGenres: number;
  categoryCounts: { [key: string]: number };
  topUsedPrompts: Array<{ genre: string; category: string; usageCount: number }>;
}

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);

  constructor(
    @InjectModel(Prompt.name)
    private promptModel: Model<PromptDocument>,
  ) {
    this.logger.log('✅ PromptService initialized');
  }

  /**
   * Obtiene un prompt aleatorio por género
   * @param genre - Género musical
   * @param category - Categoría opcional (base, variation, mood, style)
   */
  async getRandomPromptByGenre(
    genre: string,
    category?: string,
  ): Promise<PromptDocument> {
    try {
      const query: any = {
        genre,
        isActive: true,
      };

      if (category) {
        query.category = category;
      }

      this.logger.debug(`Finding random prompt for genre: ${genre}, category: ${category || 'any'}`);

      // Contar prompts disponibles
      const count = await this.promptModel.countDocuments(query);

      if (count === 0) {
        throw new NotFoundException(
          `No active prompts found for genre: ${genre}${category ? ` and category: ${category}` : ''}`,
        );
      }

      // Obtener uno aleatorio usando aggregation
      const randomPrompts = await this.promptModel.aggregate([
        { $match: query },
        { $sample: { size: 1 } },
      ]);

      if (randomPrompts.length === 0) {
        throw new NotFoundException(`No prompts found for genre: ${genre}`);
      }

      this.logger.debug(`✅ Found random prompt: ${randomPrompts[0]._id}`);

      return randomPrompts[0] as PromptDocument;
    } catch (error) {
      this.logger.error(`Error getting random prompt: ${error.message}`);
      throw error;
    }
  }

  /**
   * Incrementa el contador de uso de un prompt
   * @param promptId - ID del prompt
   */
  async incrementUsageCount(promptId: string): Promise<void> {
    try {
      await this.promptModel.findByIdAndUpdate(promptId, {
        $inc: { usageCount: 1 },
        $set: { lastUsedAt: new Date() },
      });

      this.logger.debug(`✅ Incremented usage count for prompt: ${promptId}`);
    } catch (error) {
      this.logger.error(`Error incrementing usage count: ${error.message}`);
      throw new Error(`Failed to increment usage count: ${error.message}`);
    }
  }

  /**
   * Actualiza el success rate de un prompt
   * @param promptId - ID del prompt
   * @param success - Si la generación fue exitosa
   */
  async updateSuccessRate(promptId: string, success: boolean): Promise<void> {
    try {
      const prompt = await this.promptModel.findById(promptId);

      if (!prompt) {
        throw new NotFoundException(`Prompt not found: ${promptId}`);
      }

      // Calcular nuevo success rate (promedio simple)
      const totalGenerations = prompt.usageCount;
      const currentSuccessCount = prompt.successRate * totalGenerations;
      const newSuccessCount = success ? currentSuccessCount + 1 : currentSuccessCount;
      const newSuccessRate = newSuccessCount / (totalGenerations + 1);

      await this.promptModel.findByIdAndUpdate(promptId, {
        $set: { successRate: newSuccessRate },
      });

      this.logger.debug(`✅ Updated success rate for prompt: ${promptId} to ${newSuccessRate.toFixed(2)}`);
    } catch (error) {
      this.logger.error(`Error updating success rate: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todos los géneros disponibles
   */
  async getAllGenres(): Promise<string[]> {
    try {
      const genres = await this.promptModel.distinct('genre');
      this.logger.debug(`✅ Found ${genres.length} unique genres`);
      return genres.sort();
    } catch (error) {
      this.logger.error(`Error getting all genres: ${error.message}`);
      throw new Error(`Failed to get genres: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas de prompts
   */
  async getPromptStats(): Promise<PromptStats> {
    try {
      const [totalPrompts, activePrompts, totalGenres, categoryCounts, topUsedPrompts] =
        await Promise.all([
          this.promptModel.countDocuments(),
          this.promptModel.countDocuments({ isActive: true }),
          this.promptModel.distinct('genre').then((genres) => genres.length),
          this.promptModel.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
          ]),
          this.promptModel
            .find()
            .sort({ usageCount: -1 })
            .limit(10)
            .select('genre category usageCount')
            .lean(),
        ]);

      const categoryCountsObj: { [key: string]: number } = {};
      categoryCounts.forEach((item) => {
        categoryCountsObj[item._id] = item.count;
      });

      const stats: PromptStats = {
        totalPrompts,
        activePrompts,
        totalGenres,
        categoryCounts: categoryCountsObj,
        topUsedPrompts: topUsedPrompts.map((p: any) => ({
          genre: p.genre,
          category: p.category,
          usageCount: p.usageCount,
        })),
      };

      this.logger.debug('✅ Generated prompt statistics');

      return stats;
    } catch (error) {
      this.logger.error(`Error getting prompt stats: ${error.message}`);
      throw new Error(`Failed to get prompt stats: ${error.message}`);
    }
  }

  /**
   * Busca prompts por género
   * @param genre - Género musical
   * @param limit - Límite de resultados
   */
  async findPromptsByGenre(genre: string, limit: number = 10): Promise<PromptDocument[]> {
    try {
      const prompts = await this.promptModel
        .find({ genre, isActive: true })
        .limit(limit)
        .lean();

      this.logger.debug(`✅ Found ${prompts.length} prompts for genre: ${genre}`);

      return prompts as PromptDocument[];
    } catch (error) {
      this.logger.error(`Error finding prompts by genre: ${error.message}`);
      throw new Error(`Failed to find prompts: ${error.message}`);
    }
  }

  /**
   * Obtiene un prompt por ID
   * @param promptId - ID del prompt
   */
  async findPromptById(promptId: string): Promise<PromptDocument> {
    try {
      const prompt = await this.promptModel.findById(promptId);

      if (!prompt) {
        throw new NotFoundException(`Prompt not found: ${promptId}`);
      }

      return prompt;
    } catch (error) {
      this.logger.error(`Error finding prompt by ID: ${error.message}`);
      throw error;
    }
  }
}
