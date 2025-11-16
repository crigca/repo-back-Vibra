# 🎵 VIBRA – Backend API

Backend de VIBRA, plataforma de música con descubrimiento inteligente, gestión de playlists y generación de imágenes con IA.

---

## 🏗️ Stack Tecnológico

- **NestJS 10** + **TypeScript**
- **PostgreSQL** - Base de datos relacional (canciones, playlists, usuarios)
- **TypeORM** - ORM para PostgreSQL
- **Passport + JWT** - Autenticación con Google OAuth 2.0
- **YouTube Data API v3** - Búsqueda de música
- **Cloudinary** - Almacenamiento de archivos MP3
- **Event Emitter** - Arquitectura event-driven

---

## 📐 Arquitectura de Módulos

```
src/
├── auth/              # Autenticación Google OAuth + JWT
├── users/             # Gestión de usuarios
├── music/             # Búsqueda, reproducción y gestión de canciones
├── playlists/         # CRUD de playlists con canciones
├── images/            # Generación de imágenes con IA (DALL-E, FAL, Replicate)
└── shared/            # Utilidades, constantes y configuración
```

---

## 🚀 Instalación y Setup

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

# Puerto del servidor
PORT=3000
```

### **3. Iniciar servidor de desarrollo**

```bash
npm run start:dev
```

El backend estará disponible en: **http://localhost:3000**

---

## 🔐 Autenticación y Seguridad

### **Sistema de Autenticación**

VIBRA usa **Google OAuth 2.0 + JWT** con cookies HTTP-only:

1. Usuario hace login con Google en `vibraFront` (puerto 5173)
2. Frontend envía `id_token` de Google al endpoint `/auth/google`
3. Backend verifica el token con Google OAuth2Client
4. Backend crea o busca usuario en PostgreSQL
5. Backend genera JWT (válido 7 días) y lo envía en cookie `token_vibra`
6. Frontend redirige a `vibraApp` (puerto 5174)
7. `vibraApp` envía la cookie automáticamente en cada request

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
PATCH  /users/:id                    - Actualizar usuario
DELETE /users/:id                    - Eliminar usuario
GET    /auth/me                      - Obtener usuario actual
```

### **Cookies**

El JWT se envía automáticamente en cookie `token_vibra` (HTTP-only, secure en producción):

```typescript
// Frontend (axios) envía cookie automáticamente
axios.defaults.withCredentials = true;

// Backend extrae token de cookie
@UseGuards(JwtAuthGuard)
async create(@CurrentUser() user: any) {
  // user = { userId, username, email }
}
```

---

## 🎵 Módulo de Música

### **Búsqueda Inteligente**

Sistema híbrido que busca primero en BD local, luego en YouTube:

```bash
GET /music/search-smart?query=metallica&maxResults=20
```

**Respuesta:**
```json
{
  "fromDatabase": [...],  // Canciones ya en la BD
  "fromYoutube": [...]    // Resultados de YouTube API
}
```

### **Canciones Aleatorias**

```bash
GET /music/random?genre=rock&limit=10
```

### **Guardar desde YouTube**

Agrega canciones de YouTube a la base de datos:

```bash
POST /music/save-from-youtube
{
  "youtubeId": "dQw4w9WgXcQ",
  "title": "Never Gonna Give You Up",
  "artist": "Rick Astley",
  "duration": 213
}
```

---

## 📋 Módulo de Playlists

### **Características**

- ✅ CRUD completo de playlists
- ✅ Gestión de canciones (agregar, quitar, reordenar)
- ✅ Playlists públicas y privadas
- ✅ Límite de 15 playlists por usuario
- ✅ Límite de 30 canciones por playlist
- ✅ Validación de nombres únicos
- ✅ Mosaico de portada (primeras 4 canciones)

### **Crear Playlist**

```bash
POST /playlists
Authorization: Bearer <token>
{
  "name": "Mi Playlist Rock",
  "isPublic": false
}
```

### **Agregar Canciones en Batch**

```bash
POST /playlists/:id/songs/batch
{
  "songs": [
    { "songId": "uuid-1" },
    { "songId": "uuid-2" }
  ]
}
```

### **Reemplazar Todas las Canciones**

```bash
PUT /playlists/:id/songs
{
  "songIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

---

## 🛠️ Scripts de Producción

### **Gestión de Música**

```bash
# Buscar y guardar canciones desde YouTube
npm run seed:music

# Descargar MP3 y subir a Cloudinary
npm run download:upload:cloudinary

# Sincronizar URLs de Cloudinary
npm run sync:cloudinary

# Actualizar géneros de canciones
npm run update:genres

# Clasificar canciones sin género (con IA)
npm run classify:genres

# Limpiar base de datos (duplicados, inválidos)
npm run cleanup:db

# Limpieza maestra (multi-fase)
npm run cleanup:master

# Validar YouTube IDs
npm run validate:youtube
```

### **Gestión de Playlists**

```bash
# Generar playlists por género (automáticas)
npm run seed:playlists

# Generar playlists por familia de géneros
npm run seed:family-playlists
```

### **Generación de Imágenes con IA**

```bash
# Generar 50 imágenes con DALL-E 3 (~$2.00 USD)
npm run generate:dalle

# Generar 100 imágenes con FAL AI (económico)
npm run generate:fal

# Generar 100 imágenes con Replicate SDXL
npm run generate:replicate
```

---

## 🎨 Generación de Imágenes con IA

### **Sistema Híbrido**

VIBRA genera imágenes de portadas para playlists usando 3 servicios de IA:

1. **DALL-E 3** (OpenAI) - Alta calidad, $0.04/imagen
2. **FAL AI** - Rápido y económico
3. **Replicate SDXL** - Balance calidad/precio

### **Distribución por Tiers**

Las imágenes se priorizan por popularidad del género:

| Tier | Descripción | Géneros Ejemplo | Prioridad |
|------|-------------|-----------------|-----------|
| 1 | Mainstream LATAM | Rock, Cumbia, Reggaeton, Trap | Alta |
| 2 | Muy populares | Bachata, Tango, Techno, House | Media-Alta |
| 3 | Audiencia dedicada | Soul, Funk, Ska, Punk | Media |
| 4 | Nicho/experimentales | Jazz, Blues, Opera, Flamenco | Baja |

### **Generación de Prompts**

Los prompts se generan dinámicamente combinando:
- Scene Elements (10+ por género)
- Visual Style (8+ estilos)
- Emotion/Mood (8+ emociones)
- Artistic Styles (25+ opciones)
- Lighting Techniques (25+ técnicas)
- Cross-pollination (20% mezcla entre géneros relacionados)

---

## 📊 Base de Datos

### **Entidades Principales**

**Songs** (Canciones)
```typescript
{
  id: uuid,
  title: string,
  artist: string,
  youtubeId: string,
  duration: number,
  genre: string,  // camelCase: "rockArgentino", "deathMetal"
  cloudinaryUrl: string | null,
  viewCount: number,
  createdAt: timestamp
}
```

**Playlists**
```typescript
{
  id: uuid,
  name: string,
  userId: uuid,
  isPublic: boolean,
  songCount: number,
  totalDuration: number,
  displayOrder: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**PlaylistSongs** (Relación N:N)
```typescript
{
  id: uuid,
  playlistId: uuid,
  songId: uuid,
  position: number,
  addedAt: timestamp
}
```

**Users**
```typescript
{
  id: uuid,
  email: string,
  username: string,
  googleId: string,
  createdAt: timestamp
}
```

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

## 🧪 Testing y Desarrollo

### **Probar Autenticación**

```bash
# 1. Obtener token (desde frontend)
# Login con Google → copia el JWT de la cookie

# 2. Verificar usuario actual
curl http://localhost:3000/auth/me \
  --cookie "token_vibra=YOUR_JWT_TOKEN"

# 3. Crear playlist
curl -X POST http://localhost:3000/playlists \
  -H "Content-Type: application/json" \
  --cookie "token_vibra=YOUR_JWT_TOKEN" \
  -d '{"name": "Test Playlist", "isPublic": false}'
```

### **Logs de Desarrollo**

El servidor muestra logs detallados en modo desarrollo:

```
[PlaylistsController] 📋 GET /playlists - Usuario: a5c98ec0-692f...
[PlaylistsService] ✅ Obtenidas 5 playlists
[JwtStrategy] Payload recibido con sub: a5c98ec0-692f...
```

---

## 🐛 Troubleshooting

### **Error: "Unauthorized" en endpoints protegidos**

**Causa**: Cookie `token_vibra` no está siendo enviada

**Solución**:
```typescript
// Frontend: Habilitar envío de cookies
axios.defaults.withCredentials = true;
```

### **Error: "Una o más canciones no existen en la base de datos"**

**Causa**: IDs de canciones inválidos o no existen en BD

**Solución**: Verificar que los IDs sean UUIDs válidos de la tabla `songs`

### **Error: CORS blocked**

**Causa**: Frontend no está en la whitelist de CORS

**Solución**: Agregar URL en `main.ts`:
```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
});
```

### **YouTube API quota exceeded**

**Causa**: Límite diario de 10,000 unidades alcanzado

**Solución**:
- Esperar 24 horas para renovación
- Usar múltiples API keys
- Reducir búsquedas

---

## 📦 Build para Producción

```bash
# Compilar TypeScript a JavaScript
npm run build

# Iniciar en modo producción
npm run start:prod
```

**Output**: `/dist/` contiene el código compilado

---

## 🔗 Enlaces Útiles

- **Documentación NestJS**: https://docs.nestjs.com
- **TypeORM**: https://typeorm.io
- **Passport JWT**: https://www.passportjs.org/packages/passport-jwt
- **YouTube Data API**: https://developers.google.com/youtube/v3
- **Cloudinary**: https://cloudinary.com/documentation

---

## 👥 Autores

- Sergio Peckerle
- Diego Ortino
- Cristian Calvo
- Sebastián Allende

---

**Última actualización**: 2025-11-16
**Versión**: 3.0
**Puerto**: 3000
**Proyecto**: VIBRA Backend API
