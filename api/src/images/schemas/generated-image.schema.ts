import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GeneratedImageDocument = GeneratedImage & Document;

@Schema({
  timestamps: true,
  collection: 'generatedImages'
})
export class GeneratedImage {
  @Prop({ required: true, index: true })
  songId!: string;

  @Prop({ required: true })
  imageUrl!: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop({ required: true })
  prompt!: string;

  @Prop({ required: true, enum: ['primary', 'secondary'] })
  generator!: string;

  @Prop({ required: true })
  genre!: string;

  @Prop({ type: Object, default: {} })
  metadata!: {
    aiModel?: string;
    width?: number;
    height?: number;
    style?: string;
    mood?: string;
    colorPalette?: string[];
    confidence?: number;
    parameters?: any;
  };

  @Prop()
  processingTime?: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: [String], default: [] })
  userFavorites!: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const GeneratedImageSchema = SchemaFactory.createForClass(GeneratedImage);

GeneratedImageSchema.index({ songId: 1, createdAt: -1 });
GeneratedImageSchema.index({ genre: 1 });
GeneratedImageSchema.index({ generator: 1 });
GeneratedImageSchema.index({ userFavorites: 1 });