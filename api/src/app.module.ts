import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
//import { TypeOrmModule } from "@nestjs/typeorm";
//import { MongooseModule } from "@nestjs/mongoose";
//import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables estén disponibles en toda la app
      envFilePath: '.env',
    }),

    // PostgreSQL - para datos estructurados (users, playlists, songs)
    /*TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        ssl: configService.get('DB_SSL') === 'true',
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') !== 'production', // Solo en desarrollo
      }),
    }), */

    // MongoDB - para datos flexibles (imágenes generadas, prompts)
    /*MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI'),
      }),
    }), */

    // Módulos de la aplicación
    //UsersModule,
  ],
})
export class AppModule {}