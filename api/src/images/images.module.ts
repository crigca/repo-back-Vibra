import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  GeneratedImage,
  GeneratedImageSchema,
} from './schemas/generated-image.schema';
import { Prompt, PromptSchema } from './schemas/prompt.schema';
import { CloudinaryService } from './services/cloudinary.service';
import { PromptService } from './services/prompt.service';
import { ImagesService } from './services/images.service';
import { ParallelImageService } from './services/parallel-image.service';
import { PrimaryAIGenerator } from './generators/primary-ai-generator';
import { SecondaryAIGenerator } from './generators/secondary-ai-generator';
import { TertiaryAIGenerator } from './generators/tertiary-ai-generator';
import { ImagesController } from './images.controller';
import { Song } from '../music/entities/song.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeneratedImage.name, schema: GeneratedImageSchema },
      { name: Prompt.name, schema: PromptSchema },
    ]),
    TypeOrmModule.forFeature([Song]),
  ],
  controllers: [ImagesController],
  providers: [
    CloudinaryService,
    PromptService,
    ImagesService,
    ParallelImageService,
    PrimaryAIGenerator,
    SecondaryAIGenerator,
    TertiaryAIGenerator,
    {
      provide: 'IImageGenerator',
      useClass: ParallelImageService, // Usa servicio paralelo con fallback automático
    },
  ],
  exports: [MongooseModule, CloudinaryService, PromptService, ImagesService, ParallelImageService],
})
export class ImagesModule {}
