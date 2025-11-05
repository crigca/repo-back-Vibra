# Scripts de Vibra - Documentación Completa

Sistema de scripts para gestión de música, imágenes, playlists y base de datos.

---

## 📁 Estructura de Carpetas

```
scripts/
├── data/              # Datos maestros (artistas, géneros, prompts)
├── production/        # Scripts de producción
│   ├── images/       # Generación de imágenes AI
│   ├── migrations/   # Migraciones de BD
│   ├── music/        # Gestión de música y BD
│   └── playlists/    # Creación de playlists
├── utilities/         # Herramientas de uso manual
├── verification/      # Scripts de verificación/chequeo
├── reports/          # Generación de reportes
├── tests/            # Scripts de testing
└── deprecated/       # Scripts obsoletos (archivados)
```

---

## 📊 Data (Datos Maestros)

### **artists-data.js** 🎸
Base de datos de ~2000 artistas organizados por género.
```bash
node -e "console.log(require('./data/artists-data.js').artistsByGenre)"
```
**Uso**: Detección automática de géneros por artista.

### **genre-families.json** 👨‍👩‍👧‍👦
Familias de géneros relacionados (metal, rock, cumbia, etc.).

### **genres-tiers.json** 📈
Clasificación de géneros por popularidad (tier1-tier4).

### **genres.json** 🎵
Lista completa de géneros válidos del sistema.

### **prompts.json** 🎨
Prompts para generación de imágenes AI por género.

---

## 🎵 Production - Music

### **master-cleanup.js** ⭐ PRINCIPAL
Script maestro de limpieza de base de datos.

**Funciones:**
- Fase 1: Asignación automática de géneros
- Fase 2: Limpieza de títulos y artistas (241 patrones)
- Fase 3: Eliminación de duplicados (max 2 por canción)
- Fase 4: Generación de reportes

**Características de limpieza:**
- Decodificación HTML entities (`&amp;` → `&`)
- Eliminación emojis (11 rangos Unicode)
- Separador pipe (`|`) - toma última parte
- Limpieza nombres artistas (VEVO, Topic, Official)
- Separación camelCase (`SodaStereo` → `Soda Stereo`)
- 241 patrones regex (videoclip oficial, topic, lyrics, HD, 4K, etc.)

```bash
npm run start:dev  # Terminal 1
node production/music/master-cleanup.js  # Terminal 2
```

### **update-genres.js** 🔄
Actualización automática de géneros para canciones "sinCategoria".

```bash
node production/music/update-genres.js
```

### **seed-music.js** 🌱
Poblar base de datos con música desde YouTube.

```bash
npm run seed:music
```

**Características:**
- Busca canciones en YouTube por artista/género
- Filtra automáticamente (duración 1-10 min)
- Guarda hasta 500 canciones por ejecución
- Límite: 90 búsquedas por día

### **download-and-upload-cloudinary.js** ☁️
Descarga MP3 desde YouTube y sube a Cloudinary.

```bash
node production/music/download-and-upload-cloudinary.js
```

### **sync-cloudinary-urls.js** 🔗
Sincroniza URLs de Cloudinary en la base de datos.

```bash
node production/music/sync-cloudinary-urls.js
```

### **validate-youtube-ids.js** ✅
Valida IDs de YouTube en la base de datos.

```bash
node production/music/validate-youtube-ids.js
```

### **cleanup-orphan-mp3.js** 🧹
Limpia archivos MP3 huérfanos en Cloudinary.

```bash
node production/music/cleanup-orphan-mp3.js
```

### **cleanup-database.js** 🗄️
Limpieza general de base de datos.

```bash
node production/music/cleanup-database.js
```

---

## 🖼️ Production - Images

### **generate-by-genre.js** 🎨
Genera imágenes por género usando AI.

```bash
node production/images/generate-by-genre.js Gospel 5  # 5 imágenes de Gospel
node production/images/generate-by-genre.js all 2     # 2 por cada género
```

### **generate-dalle.js** 🤖
Generación de imágenes con DALL-E 3 (calidad premium).

```bash
npm run generate:dalle
```

**Características:**
- Genera 50 imágenes distribuidas por tiers
- Costo: ~$0.04 USD por imagen
- Tiempo: ~3-5 segundos por imagen

### **generate-fal.js** 🚀
Generación de imágenes con FAL AI (rápido y económico).

```bash
npm run generate:fal
```

**Características:**
- Genera 100 imágenes distribuidas por tiers
- Velocidad: ~2-3 segundos por imagen
- Muy económico comparado con DALL-E

### **generate-replicate.js** 🔁
Generación de imágenes con Replicate SDXL (balance calidad/precio).

```bash
npm run generate:replicate
```

### **seed-prompts.js** 💾
Poblar prompts de generación de imágenes.

```bash
node production/images/seed-prompts.js
```

---

## 📂 Production - Playlists

### **seed-family-playlists.js** 👨‍👩‍👧‍👦
Crear playlists por familia de géneros.

```bash
node production/playlists/seed-family-playlists.js
```

### **seed-genre-playlists.js** 🎵
Crear playlists por género individual.

```bash
node production/playlists/seed-genre-playlists.js
```

---

## 🔧 Utilities (Uso Manual)

### **reclassify-by-artist.js** 🎯
Reclasificación manual de canciones por artista.

**Uso:**
1. Agregar artistas a `data/artists-data.js`
2. Ejecutar script:
```bash
node utilities/reclassify-by-artist.js
```

**Ejemplo:**
```javascript
// En artists-data.js
"alternativeRock": [..., "Electric Callboy"]

// Ejecutar
node utilities/reclassify-by-artist.js
// Reclasifica todas las canciones de Electric Callboy a alternativeRock
```

### **delete-categorized-songs.js** 🗑️
Elimina canciones que ya tienen categoría válida.

```bash
node utilities/delete-categorized-songs.js
```

### **delete-sin-categoria-folder.js** 📁
Elimina carpeta "sin-categoria" de Cloudinary.

```bash
node utilities/delete-sin-categoria-folder.js
```

---

## ✅ Verification (Verificación)

### **check-genres-status.js** 📊
Estado actual de géneros en la BD.

```bash
node verification/check-genres-status.js
```

**Muestra:**
- Total de canciones por género
- Canciones sin categoría
- Distribución de géneros

### **check-cloudinary-sin-genero.js** ☁️
Verifica archivos sin género en Cloudinary.

```bash
node verification/check-cloudinary-sin-genero.js
```

### **verify-cloudinary-folders.js** 📂
Verifica estructura de carpetas en Cloudinary.

```bash
node verification/verify-cloudinary-folders.js
```

---

## 📈 Reports (Reportes)

### **export-sin-categoria.js** 📄
Exporta canciones sin categoría agrupadas por artista.

```bash
node reports/export-sin-categoria.js
```

**Genera:**
- `reports/sin-categoria-por-artista.json` - JSON con artistas y canciones
- Ordenado por cantidad de canciones por artista

---

## 🧪 Tests

Scripts de prueba para APIs y servicios:

- `demo-youtube-api.js` - Demo de YouTube API
- `test-ai-apis.js` - Test de APIs de AI
- `test-cloudinary.js` - Test de Cloudinary
- `test-image-generation.js` - Test generación de imágenes
- `test-services.js` - Test de servicios
- `test-api-endpoints.sh` - Test de endpoints HTTP

```bash
node tests/test-cloudinary.js
npm run demo:youtube
```

---

## 🗄️ Deprecated (Obsoletos)

Scripts archivados que ya cumplieron su función:

- ❌ `cleanup-titles.js` - Migrado a master-cleanup.js
- ❌ `convert-genres-to-camelcase.js` - Conversión completada
- ❌ `fix-genre-inconsistencies.js` - Inconsistencias corregidas
- ❌ `convert-all-jsons-to-camelcase.js` - Conversión completada
- ❌ `normalize-genres.js` - Normalización completada
- ❌ `migrate-otros-to-sin-categoria.js` - Migración completada
- ❌ `fix-otros.js` - Ya no hay "Otros"
- ❌ `fix-sin-categoria.js` - Funcionalidad duplicada
- ❌ `check-otros.js` - Ya no hay "Otros"
- ❌ `generate-fal-backup.js` - Backup obsoleto
- ❌ `verify-mongodb.js` - MongoDB no se usa

---

## 🚀 Workflows Comunes

### Agregar Nuevos Artistas y Reclasificar

1. Agregar artistas a `data/artists-data.js`:
```javascript
"rock": [..., "Nuevo Artista"]
```

2. Reclasificar canciones:
```bash
node utilities/reclassify-by-artist.js
```

3. Verificar resultado:
```bash
node verification/check-genres-status.js
```

### Limpieza Completa de Base de Datos

1. Asegurar servidor corriendo:
```bash
npm run start:dev
```

2. Ejecutar limpieza maestra:
```bash
node production/music/master-cleanup.js
```

3. Revisar reportes generados:
```bash
ls -la reports/
```

### Generar Reporte de Canciones Sin Categoría

```bash
node reports/export-sin-categoria.js
cat reports/sin-categoria-por-artista.json
```

### Sincronizar con Cloudinary

```bash
# 1. Descargar y subir nuevas canciones
node production/music/download-and-upload-cloudinary.js

# 2. Sincronizar URLs
node production/music/sync-cloudinary-urls.js

# 3. Verificar
node verification/check-cloudinary-sin-genero.js
```

### Generar Imágenes con AI

```bash
# Opción A - Calidad Premium (DALL-E 3)
npm run generate:dalle  # 50 imágenes, ~$2.00 USD

# Opción B - Rápido y Económico (FAL AI)
npm run generate:fal    # 100 imágenes, muy económico

# Opción C - Balance (Replicate SDXL)
npm run generate:replicate  # 100 imágenes, precio moderado
```

---

## 📝 Notas Importantes

### Convenciones de Nombres
- Géneros en **camelCase**: `rockArgentino`, `heavyMetal`, `sinCategoria`
- Artistas con mayúsculas: `Los Redondos`, `Soda Stereo`

### Base de Datos
- PostgreSQL en Railway
- ~7000 canciones
- ~2000 artistas mapeados
- 90+ géneros

### Cloudinary
- Carpetas por género en camelCase
- Formato: `vibra/music/{genre}/{filename}.mp3`
- Max 2 duplicados por canción

### Géneros Especiales
- `sinCategoria` - Sin clasificar
- `otros` - **OBSOLETO** (migrado a sinCategoria)

---

## 🔑 Variables de Entorno Requeridas

```env
# YouTube API
YOUTUBE_API_KEY=tu_api_key_aqui

# OpenAI (DALL-E)
OPENAI_API_KEY=tu_api_key_aqui

# Fal.ai
FAL_API_KEY=tu_api_key_aqui

# Replicate
REPLICATE_API_TOKEN=tu_token_aqui

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Database
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb+srv://...
DB_HOST=...
DB_PORT=...
DB_USERNAME=...
DB_PASSWORD=...
DB_NAME=...
DB_SSL=true
```

---

## 📞 Soporte

Para agregar nuevos artistas o géneros, editar:
- `data/artists-data.js`
- `data/genres.json`
- `data/genres-tiers.json`
- `data/genre-families.json`

---

## 🛠️ Requisitos

- Node.js 18+
- PostgreSQL (Railway)
- Cloudinary account
- YouTube API key
- API servidor corriendo en `localhost:3000`

---

**Última actualización**: 2025-11-05
**Total de scripts activos**: 29
**Total de scripts obsoletos**: 10
**Proyecto**: VIBRA - Plataforma de Música
