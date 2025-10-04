import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ImagesService } from './services/images.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { GetImagesDto } from './dto/get-images.dto';

@Controller('images')
export class ImagesController {
  private readonly logger = new Logger(ImagesController.name);

  constructor(private readonly imagesService: ImagesService) {}

  /**
   * POST /images/generate
   * Genera una imagen para una canción
   */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateImage(@Body() dto: GenerateImageDto) {
    this.logger.log(`POST /images/generate - songId: ${dto.songId}`);

    const image = await this.imagesService.generateImage({
      songId: dto.songId,
      category: dto.category,
    });

    return {
      success: true,
      data: {
        id: image._id,
        songId: image.songId,
        genre: image.genre,
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl,
        prompt: image.prompt,
        generator: image.generator,
        processingTime: image.processingTime,
        metadata: image.metadata,
        createdAt: image.createdAt,
      },
    };
  }

  /**
   * GET /images/by-song/:songId
   * Obtiene imágenes de una canción específica
   */
  @Get('by-song/:songId')
  async getImagesBySong(
    @Param('songId') songId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    this.logger.log(`GET /images/by-song/${songId}`);

    const { images, total } = await this.imagesService.getImagesBySong(
      songId,
      page || 1,
      limit || 10,
    );

    return {
      success: true,
      data: images.map((img) => ({
        id: img._id,
        songId: img.songId,
        genre: img.genre,
        imageUrl: img.imageUrl,
        thumbnailUrl: img.thumbnailUrl,
        generator: img.generator,
        processingTime: img.processingTime,
        createdAt: img.createdAt,
      })),
      pagination: {
        page: page || 1,
        limit: limit || 10,
        total,
        pages: Math.ceil(total / (limit || 10)),
      },
    };
  }

  /**
   * GET /images
   * Obtiene todas las imágenes con paginación y filtros
   */
  @Get()
  async getAllImages(@Query() dto: GetImagesDto) {
    this.logger.log(
      `GET /images - genre: ${dto.genre || 'all'}, page: ${dto.page}, limit: ${dto.limit}`,
    );

    const { images, total } = await this.imagesService.getAllImages({
      genre: dto.genre,
      page: dto.page,
      limit: dto.limit,
    });

    return {
      success: true,
      data: images.map((img) => ({
        id: img._id,
        songId: img.songId,
        genre: img.genre,
        imageUrl: img.imageUrl,
        thumbnailUrl: img.thumbnailUrl,
        generator: img.generator,
        processingTime: img.processingTime,
        createdAt: img.createdAt,
      })),
      pagination: {
        page: dto.page || 1,
        limit: dto.limit || 10,
        total,
        pages: Math.ceil(total / (dto.limit || 10)),
      },
    };
  }

  /**
   * GET /images/stats
   * Obtiene estadísticas de imágenes generadas
   */
  @Get('stats')
  async getStats() {
    this.logger.log('GET /images/stats');

    const stats = await this.imagesService.getImageStats();

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /images/:id
   * Obtiene una imagen por ID
   */
  @Get(':id')
  async getImageById(@Param('id') id: string) {
    this.logger.log(`GET /images/${id}`);

    const image = await this.imagesService.getImageById(id);

    return {
      success: true,
      data: {
        id: image._id,
        songId: image.songId,
        genre: image.genre,
        imageUrl: image.imageUrl,
        thumbnailUrl: image.thumbnailUrl,
        cloudinaryPublicId: image.cloudinaryPublicId,
        cloudinaryFolder: image.cloudinaryFolder,
        prompt: image.prompt,
        generator: image.generator,
        processingTime: image.processingTime,
        metadata: image.metadata,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
      },
    };
  }
}
