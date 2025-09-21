import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromptDocument = Prompt & Document;

@Schema({ 
  timestamps: true,
  collection: 'prompts' 
})
export class Prompt {
  @Prop({ required: true })
  genre!: string;

  @Prop({ required: true, maxlength: 3000 })
  promptText!: string;

  @Prop({ 
    required: true, 
    enum: ['base', 'variation', 'mood', 'style'],
    index: true
  })
  category!: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ default: 'en' })
  language!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: 0 })
  usageCount!: number;

  @Prop({ default: 0.0, min: 0, max: 1 })
  successRate!: number;

  @Prop()
  lastUsedAt?: Date;

  @Prop({ type: Object, default: {} })
  aiCompatibility!: {
    'dall-e-3'?: { supported: boolean; modifications?: string };
    'deepai'?: { supported: boolean; modifications?: string };
    'stable-diffusion'?: { supported: boolean; reason?: string };
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const PromptSchema = SchemaFactory.createForClass(Prompt);

PromptSchema.index({ genre: 1, isActive: 1 });
PromptSchema.index({ tags: 1 });
PromptSchema.index({ usageCount: -1 });
PromptSchema.index({ promptText: 'text' });