import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GeneratedImageDocument = GeneratedImage & Document;

@Schema({ 
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  collection: 'generatedImages' 
})
export class GeneratedImage {
  @Prop({ required: true, index: true })
  songId!: string; // Referencia a Song de PostgreSQL

  @Prop({ required: true })
  imageUrl!: string; // URL de Cloudinary

  @Prop()
  thumbnailUrl?: string; // Versión optimizada

  @Prop({ required: true })
  prompt!: string; // Texto usado para generar

  @Prop({ required: true, enum: ['primary', 'secondary'] })
  generator!: string; // Qué IA generó la imagen

  @Prop({ required: true, index: true })
  genre!: string; // Género musical

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
  processingTime?: number; // Segundos que tardó en generar

  @Prop({ default: true })
  isActive!: boolean; // Soft delete

  @Prop({ type: [String], default: [] })
  userFavorites!: string[]; // Array de userIds que la favoritean

  // Timestamps automáticos por @Schema({ timestamps: true })
  createdAt?: Date;
  updatedAt?: Date;
}

export const GeneratedImageSchema = SchemaFactory.createForClass(GeneratedImage);

// Índices para optimizar búsquedas
GeneratedImageSchema.index({ songId: 1, createdAt: -1 });
GeneratedImageSchema.index({ genre: 1 });
GeneratedImageSchema.index({ generator: 1 });
GeneratedImageSchema.index({ userFavorites: 1 });