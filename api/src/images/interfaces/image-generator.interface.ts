/**
 * Interface para generadores de imágenes (Strategy Pattern)
 * Permite cambiar entre diferentes implementaciones:
 * - StubImageGenerator: Usa placeholders de Cloudinary
 * - DallEGenerator: Usa DALL-E 3
 * - StableDiffusionGenerator: Usa Stable Diffusion
 */

export interface ImageGenerationResult {
  imageUrl: string;
  thumbnailUrl: string;
  publicId: string;
  metadata: {
    aiModel: string;
    width: number;
    height: number;
    processingTime: number;
    prompt: string;
    genre: string;
    confidence?: number;
  };
}

export interface IImageGenerator {
  /**
   * Genera una imagen basada en un prompt
   * @param prompt - Texto descriptivo de la imagen a generar
   * @param genre - Género musical
   * @returns Resultado de la generación
   */
  generateImage(prompt: string, genre: string): Promise<ImageGenerationResult>;

  /**
   * Nombre del generador
   */
  getName(): string;

  /**
   * Verifica si el generador está disponible
   */
  isAvailable(): Promise<boolean>;
}
