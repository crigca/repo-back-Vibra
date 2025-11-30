# VIBRA – Backend API

Backend de VIBRA, plataforma de música con descubrimiento inteligente, gestión de playlists y generación de imágenes con IA.
Este repositorio cuenta con una wiki donde se detalla toda su documentacion en: https://deepwiki.com/crigca/repo-back-Vibra
Asimismo, este proyecto cuenta con un informe tecnico: https://docs.google.com/document/d/1__hA0XD2aFfMkWAgLew-wv83zOdFjg64Gf1wZH8nOQQ/edit?usp=drive_link

**Link al proyecto en producción:** https://vibra-kohl.vercel.app

---

## Stack Tecnológico

- **NestJS 10** + **TypeScript**
- **PostgreSQL** - Base de datos relacional (canciones, playlists, usuarios)
- **TypeORM** - ORM para PostgreSQL
- **Passport + JWT** - Autenticación con Google OAuth 2.0 y Email/Password
- **Resend API** - Envío de emails (verificación y recuperación)
- **YouTube Data API v3** - Búsqueda de música
- **Cloudinary** - Almacenamiento de archivos MP3
- **Railway** - Deploy del backend

---

## Arquitectura de Módulos

```
src/
├── auth/              # Autenticación (Google OAuth + Email/Password)
├── users/             # Gestión de usuarios
├── music/             # Búsqueda, reproducción y gestión de canciones
├── playlists/         # CRUD de playlists con canciones
├── images/            # Generación de imágenes con IA (DALL-E, FAL, Replicate)
└── shared/            # Utilidades, constantes y configuración
```

---

## Instalación y Setup

### **Prerequisitos**
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### **1. Clonar repositorio e instalar dependencias**

```bash
cd /home/crigca/vibra/back/api
npm install
```

### **2. Configurar variables de entorno**

Crear archivo `.env` en `/back/api/`:

```env
# Base de Datos PostgreSQL
DB_HOST=oregon-postgres.render.com
DB_PORT=5432
DB_USERNAME=vibra_user
DB_PASSWORD=your_db_password
DB_NAME=vibra
DB_SSL=true

# Autenticación JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# Cloudinary (almacenamiento MP3)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# URLs Frontend (CORS)
FRONTEND_URL_LANDING=http://localhost:5173
FRONTEND_URL_APP=http://localhost:5174

# Email (Resend API)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=Vibra <noreply@vibra.app>
FRONTEND_URL=http://localhost:5173

# Puerto del servidor
PORT=3000
```

### **3. Iniciar servidor de desarrollo**

```bash
npm run start:dev
```

El backend estará disponible en: **http://localhost:3000**

---

## Autenticación y Seguridad

### **Sistema de Autenticación**

VIBRA soporta **dos métodos de autenticación**:

#### **Google OAuth 2.0**
1. Usuario hace login con Google en `vibraFront`
2. Frontend envía `id_token` de Google al endpoint `/auth/google`
3. Backend verifica el token con Google OAuth2Client
4. Backend crea o busca usuario en PostgreSQL
5. Backend genera JWT (válido 7 días) y lo envía
6. Frontend redirige a `vibraApp` con el token

#### **Email + Contraseña**
1. Usuario se registra con email/password en `/auth/register`
2. Backend envía código de verificación de 6 dígitos por email
3. Usuario verifica su email en `/auth/verify-email`
4. Una vez verificado, puede hacer login en `/auth/login`
5. Si olvida la contraseña: `/auth/forgot-password` envía link de recuperación
6. Usuario restablece contraseña en `/auth/reset-password`

### **Guards de Autenticación**

- **`JwtAuthGuard`**: Requiere autenticación (endpoints protegidos)
- **`OptionalJwtAuthGuard`**: Autenticación opcional (permite acceso anónimo pero identifica usuario si existe)

### **Endpoints Públicos** (sin autenticación)

```
GET  /playlists              - Listar playlists públicas
GET  /playlists/:id          - Ver playlist específica (privadas solo si eres dueño)
GET  /playlists/:id/songs    - Ver canciones de playlist
GET  /music/songs            - Listar canciones
GET  /music/random           - Canciones aleatorias por género
GET  /music/search-smart     - Búsqueda híbrida (BD + YouTube)
```

### **Endpoints Protegidos** (requieren JWT)

```
# Playlists
POST   /playlists                    - Crear playlist
PUT    /playlists/:id                - Actualizar playlist
DELETE /playlists/:id                - Eliminar playlist
POST   /playlists/:id/songs          - Agregar canción
DELETE /playlists/:id/songs/:songId  - Quitar canción
PATCH  /playlists/:id/songs/reorder  - Reordenar canciones
PATCH  /playlists/:id/regenerate     - Regenerar playlist automática

# Usuarios
GET    /users                        - Listar usuarios
GET    /users/:id                    - Obtener usuario
PATCH  /users/:id                    - Actualizar usuario (solo propio)
DELETE /users/:id                    - Eliminar usuario (solo propio)

# Autenticación
POST   /auth/google                  - Login con Google OAuth
POST   /auth/register                - Registro con email/password
POST   /auth/login                   - Login con email/password
POST   /auth/verify-email            - Verificar código de email
POST   /auth/resend-code             - Reenviar código de verificación
POST   /auth/forgot-password         - Solicitar reset de contraseña
POST   /auth/reset-password          - Restablecer contraseña con token
GET    /auth/me                      - Obtener usuario actual
```

---

## Módulo de Música

### **Búsqueda Inteligente**

Sistema híbrido que busca primero en BD local, luego en YouTube:

```bash
GET /music/search-smart?query=metallica&maxResults=20
```

### **Canciones Aleatorias**

```bash
GET /music/random?genre=rock&limit=10
```

---

## Módulo de Playlists

### **Características**

- CRUD completo de playlists
- Gestión de canciones (agregar, quitar, reordenar)
- Playlists públicas y privadas
- Límite de 15 playlists por usuario
- Límite de 30 canciones por playlist
- Validación de nombres únicos
- Mosaico de portada (primeras 4 canciones)

---

## Scripts de Producción

### **Gestión de Música**

```bash
npm run seed:music                    # Buscar y guardar canciones desde YouTube
npm run download:upload:cloudinary    # Descargar MP3 y subir a Cloudinary
npm run sync:cloudinary               # Sincronizar URLs de Cloudinary
npm run update:genres                 # Actualizar géneros de canciones
npm run classify:genres               # Clasificar canciones sin género (con IA)
npm run cleanup:db                    # Limpiar base de datos
npm run validate:youtube              # Validar YouTube IDs
```

### **Gestión de Playlists**

```bash
npm run seed:playlists                # Generar playlists por género
npm run seed:family-playlists         # Generar playlists por familia de géneros
```

### **Generación de Imágenes con IA**

```bash
npm run generate:dalle                # DALL-E 3 (~$2.00 USD)
npm run generate:fal                  # FAL AI (económico)
npm run generate:replicate            # Replicate SDXL
```

---

## Generación de Imágenes con IA

VIBRA genera imágenes de portadas para playlists usando 3 servicios de IA:

1. **DALL-E 3** (OpenAI) - Alta calidad, $0.04/imagen
2. **FAL AI** - Rápido y económico
3. **Replicate SDXL** - Balance calidad/precio

---

## Base de Datos

### **Géneros Musicales**

Total: **65 géneros** en formato camelCase

Familias principales:
- **Metal**: `heavyMetal`, `deathMetal`, `thrashMetal`, `blackMetal`, `industrialMetal`
- **Rock**: `rock`, `rockArgentino`, `rockLatino`, `alternativeRock`, `indieRock`
- **Latino**: `cumbia`, `reggaeton`, `salsa`, `bachata`, `merengue`
- **Electrónica**: `techno`, `house`, `trance`, `dubstep`, `edm`
- **Hip Hop**: `hiphop`, `rap`, `trap`
- **Más**: Jazz, Blues, Folk, Country, Kpop, Jpop, etc.

---

## Build para Producción

```bash
npm run build        # Compilar TypeScript a JavaScript
npm run start:prod   # Iniciar en modo producción
```

---

## Enlaces Útiles

- **Documentación NestJS**: https://docs.nestjs.com
- **TypeORM**: https://typeorm.io
- **Passport JWT**: https://www.passportjs.org/packages/passport-jwt
- **YouTube Data API**: https://developers.google.com/youtube/v3
- **Cloudinary**: https://cloudinary.com/documentation
- **Resend (Email)**: https://resend.com/docs

---

## Autores

- Sergio Peckerle
- Diego Ortino
- Cristian Calvo
- Sebastián Allende

---

**Última actualización**: 2025-11-30
**Versión**: 3.1
**Puerto**: 3000
**Proyecto**: VIBRA Backend API
