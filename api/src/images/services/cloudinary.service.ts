import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  folder?: string;
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'auto';
  quality?: 'auto' | 'auto:low' | 'auto:good' | 'auto:best' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    // Configurar Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });

    this.logger.log('✅ CloudinaryService initialized');
  }

  /**
   * Sube una imagen a Cloudinary
   * @param file - Buffer o path de la imagen
   * @param folder - Carpeta en Cloudinary (ej: 'vibra/rock')
   * @param publicId - ID público opcional (si no se provee, Cloudinary genera uno)
   */
  async uploadImage(
    file: string | Buffer,
    folder: string = 'vibra/generated',
    publicId?: string,
  ): Promise<CloudinaryUploadResult> {
    try {
      this.logger.debug(`Uploading image to folder: ${folder}`);

      const uploadOptions: any = {
        folder,
        resource_type: 'image',
        overwrite: false,
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      let result: UploadApiResponse;

      if (Buffer.isBuffer(file)) {
        // Subir desde buffer
        result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
              if (error) reject(error);
              else resolve(result!);
            },
          );
          uploadStream.end(file);
        });
      } else {
        // Subir desde URL o path
        result = await cloudinary.uploader.upload(file, uploadOptions);
      }

      this.logger.log(`✅ Image uploaded: ${result.public_id}`);

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        folder,
      };
    } catch (error) {
      this.logger.error(`Error uploading image: ${error.message}`, error.stack);
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param publicId - Public ID de la imagen (ej: 'vibra/rock/img123')
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      this.logger.debug(`Deleting image: ${publicId}`);

      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok') {
        this.logger.log(`✅ Image deleted: ${publicId}`);
        return true;
      }

      this.logger.warn(`⚠️ Image not found or already deleted: ${publicId}`);
      return false;
    } catch (error) {
      this.logger.error(`Error deleting image: ${error.message}`, error.stack);
      throw new Error(`Failed to delete image from Cloudinary: ${error.message}`);
    }
  }

  /**
   * Genera una URL con transformaciones
   * @param publicId - Public ID de la imagen
   * @param options - Opciones de transformación
   */
  getImageUrl(publicId: string, options: TransformationOptions = {}): string {
    const transformations: any = {
      fetch_format: options.format || 'auto',
      quality: options.quality || 'auto',
    };

    if (options.width) transformations.width = options.width;
    if (options.height) transformations.height = options.height;
    if (options.crop) transformations.crop = options.crop;
    if (options.gravity) transformations.gravity = options.gravity;

    return cloudinary.url(publicId, transformations);
  }

  /**
   * Genera thumbnail de 400x400
   * @param publicId - Public ID de la imagen
   */
  generateThumbnail(publicId: string): string {
    return this.getImageUrl(publicId, {
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto',
      format: 'auto',
    });
  }

  /**
   * Genera preview de 800x800
   * @param publicId - Public ID de la imagen
   */
  generatePreview(publicId: string): string {
    return this.getImageUrl(publicId, {
      width: 800,
      height: 800,
      crop: 'fill',
      quality: 'auto:good',
      format: 'auto',
    });
  }

  /**
   * Genera imagen full size optimizada
   * @param publicId - Public ID de la imagen
   */
  generateFullSize(publicId: string): string {
    return this.getImageUrl(publicId, {
      width: 1200,
      height: 1200,
      crop: 'fill',
      quality: 'auto:best',
      format: 'auto',
    });
  }

  /**
   * Obtiene información de una imagen
   * @param publicId - Public ID de la imagen
   */
  async getImageInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      this.logger.error(`Error getting image info: ${error.message}`);
      throw new Error(`Failed to get image info: ${error.message}`);
    }
  }

  /**
   * Lista imágenes en una carpeta
   * @param folder - Carpeta a listar
   * @param maxResults - Número máximo de resultados
   */
  async listImages(folder: string, maxResults: number = 10): Promise<any[]> {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: maxResults,
      });

      return result.resources;
    } catch (error) {
      this.logger.error(`Error listing images: ${error.message}`);
      throw new Error(`Failed to list images: ${error.message}`);
    }
  }

  /**
   * Sube un buffer de imagen a Cloudinary
   * (Alias específico para IA generators)
   * @param buffer - Buffer de la imagen
   * @param folder - Carpeta en Cloudinary
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string = 'vibra/ai-generated',
  ): Promise<{ secure_url: string; public_id: string; width: number; height: number }> {
    const result = await this.uploadImage(buffer, folder);
    return {
      secure_url: result.secureUrl,
      public_id: result.publicId,
      width: result.width,
      height: result.height,
    };
  }

  /**
   * Sube un archivo de audio (MP3) a Cloudinary
   * @param filePath - Ruta del archivo MP3 local
   * @param folder - Carpeta en Cloudinary (ej: 'vibra/music/rock')
   * @param publicId - ID público opcional (ej: youtubeId)
   */
  async uploadAudio(
    filePath: string,
    folder: string = 'vibra/music/unknown',
    publicId?: string,
  ): Promise<{ secure_url: string; public_id: string; duration: number; bytes: number }> {
    try {
      this.logger.debug(`Uploading audio to folder: ${folder}`);

      const uploadOptions: any = {
        folder,
        resource_type: 'video', // Cloudinary usa 'video' para archivos de audio
        overwrite: false,
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      // Subir desde path local
      const result = await cloudinary.uploader.upload(filePath, uploadOptions);

      this.logger.log(`✅ Audio uploaded: ${result.public_id}`);

      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
        duration: result.duration || 0,
        bytes: result.bytes,
      };
    } catch (error) {
      this.logger.error(`Error uploading audio: ${error.message}`, error.stack);
      throw new Error(`Failed to upload audio to Cloudinary: ${error.message}`);
    }
  }

  /**
   * Elimina un archivo de audio de Cloudinary
   * @param publicId - Public ID del audio (ej: 'vibra/music/rock/abc123')
   */
  async deleteAudio(publicId: string): Promise<boolean> {
    try {
      this.logger.debug(`Deleting audio: ${publicId}`);

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video',
      });

      if (result.result === 'ok') {
        this.logger.log(`✅ Audio deleted: ${publicId}`);
        return true;
      }

      this.logger.warn(`⚠️ Audio not found or already deleted: ${publicId}`);
      return false;
    } catch (error) {
      this.logger.error(`Error deleting audio: ${error.message}`, error.stack);
      throw new Error(`Failed to delete audio from Cloudinary: ${error.message}`);
    }
  }
}
