import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromptDocument = Prompt & Document;

@Schema({ 
  timestamps: true,
  collection: 'prompts' 
})
export class Prompt {
  @Prop({ required: true, index: true })
  genre!: string; // rock, pop, jazz, electronic, etc.

  @Prop({ required: true, maxlength: 3000 })
  promptText!: string; // Texto descriptivo para IA

  @Prop({ 
    required: true, 
    enum: ['base', 'variation', 'mood', 'style'],
    index: true
  })
  category!: string;

  @Prop({ default: true, index: true })
  isActive!: boolean; // Para deshabilitar sin borrar

  @Prop({ default: 'en' })
  language!: string; // Idioma del prompt

  @Prop({ type: [String], default: [], index: true })
  tags!: string[]; // rock, guitar, concert, energy, etc.

  @Prop({ default: 0 })
  usageCount!: number; // Estadística de uso

  @Prop({ default: 0.0, min: 0, max: 1 })
  successRate!: number; // % entre 0-1 de generaciones exitosas

  @Prop()
  lastUsedAt?: Date; // Última vez que se usó

  @Prop({ type: Object, default: {} })
  aiCompatibility!: {
    'dall-e-3'?: { supported: boolean; modifications?: string };
    'deepai'?: { supported: boolean; modifications?: string };
    'stable-diffusion'?: { supported: boolean; reason?: string };
  };

  // Timestamps automáticos
  createdAt?: Date;
  updatedAt?: Date;
}

export const PromptSchema = SchemaFactory.createForClass(Prompt);

// Índices para optimizar búsquedas
PromptSchema.index({ genre: 1, isActive: 1 });
PromptSchema.index({ tags: 1 });
PromptSchema.index({ usageCount: -1 });

// Índice de texto completo para búsquedas
PromptSchema.index({ promptText: 'text' });