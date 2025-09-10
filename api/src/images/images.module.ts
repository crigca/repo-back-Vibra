import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GeneratedImage, GeneratedImageSchema } from './schemas/generated-image.schema';
import { Prompt, PromptSchema } from './schemas/prompt.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeneratedImage.name, schema: GeneratedImageSchema },
      { name: Prompt.name, schema: PromptSchema }
    ])
  ],
  exports: [MongooseModule]
})
export class ImagesModule {}