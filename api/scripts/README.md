# Scripts de Vibra - Producción

Sistema limpio y simple para gestión de música e imágenes.

---

## 📁 Estructura de Carpetas

```
scripts/
├── data/              # Datos maestros (artistas, géneros, prompts)
├── production/        # Scripts de producción
│   ├── images/       # Generación de imágenes AI
│   ├── music/        # Gestión de música
│   └── playlists/    # Creación de playlists
└── cleanup-orphaned-cloudinary-files.js  # Limpieza de archivos huérfanos
```

---

## 📊 Data (Datos Maestros)

### **artists-data.js** 🎸
Base de datos de ~1,841 artistas organizados por 95+ géneros.

**Uso**: Detección automática de géneros por artista en master-cleanup.js

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

### **master-cleanup.js** ⭐ SCRIPT PRINCIPAL DE MÚSICA

Script maestro de limpieza de base de datos.

**3 Fases:**
1. **Asignación de géneros**: Detecta artista en artists-data.js → asigna género. Si no encuentra → marca como "sin-categoria" (cuarentena)
2. **Limpieza de títulos y artistas**: Elimina 241 patrones (VEVO, Topic, Official, emojis, HTML entities, etc.)
3. **Eliminación de duplicados**: Mantiene máximo 2 versiones por canción (las de más vistas)

**Características de limpieza:**
- Decodificación HTML entities (`&amp;` → `&`)
- Eliminación de emojis (11 rangos Unicode)
- Separador pipe (`|`) - toma última parte
- Limpieza nombres artistas (VEVO, Topic, Official, YouTube)
- Separación camelCase (`SodaStereo` → `Soda Stereo`)
- 241 patrones regex (videoclip oficial, topic, lyrics, HD, 4K, etc.)

**Genera reporte CSV**:
- `scripts/output/uncategorized-songs.csv` - Canciones en cuarentena para revisión manual

```bash
npm run cleanup:master
```

### **download-and-upload-cloudinary.js** ☁️

Descarga MP3 desde YouTube y sube a Cloudinary.

**Características:**
- Solo procesa canciones con género válido (excluye "sin-categoria")
- Organiza por carpetas: `vibra/music/{género}/`
- Elimina automáticamente videos inválidos/privados de la BD
- Límite: 500 canciones por ejecución

```bash
npm run download:upload:cloudinary
```

---

## 🖼️ Production - Images

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

---

## 🧹 Mantenimiento

### **cleanup-orphaned-cloudinary-files.js**

Limpia archivos MP3 huérfanos en Cloudinary (archivos que ya no tienen canción en la BD).

**Uso:**
```bash
# Ver reporte (sin eliminar)
node scripts/cleanup-orphaned-cloudinary-files.js

# Eliminar archivos huérfanos
node scripts/cleanup-orphaned-cloudinary-files.js --delete
```

---

## 🚀 Workflow de Producción

### Flujo completo de nuevas canciones:

```bash
# 1. Usuario agrega canciones desde el buscador del frontend
#    → Se insertan en la BD vía POST /music/save-from-youtube

# 2. Correr limpieza maestra
npm run cleanup:master

# 3. Revisar reporte de cuarentena
cat scripts/output/uncategorized-songs.csv

# 4. Agregar artistas legítimos a data/artists-data.js
# Editar: scripts/data/artists-data.js

# 5. Volver a correr limpieza (asigna géneros a los nuevos artistas)
npm run cleanup:master

# 6. Subir a Cloudinary (solo sube canciones con género válido)
npm run download:upload:cloudinary

# 7. (Opcional) Limpiar archivos huérfanos de Cloudinary
node scripts/cleanup-orphaned-cloudinary-files.js --delete
```

---

## 📝 Notas Importantes

### Convenciones de Nombres
- Géneros en **camelCase**: `rockArgentino`, `heavyMetal`, `sin-categoria`
- Artistas con mayúsculas correctas: `Los Redondos`, `Soda Stereo`, `AC/DC`

### Base de Datos
- PostgreSQL en Railway
- ~7,000 canciones
- ~1,841 artistas mapeados
- 95+ géneros

### Cloudinary
- Carpetas por género en camelCase
- Formato: `vibra/music/{genre}/{youtubeId}.mp3`
- Max 2 versiones por canción (las de más vistas)

### Géneros Especiales
- `sin-categoria` - Cuarentena para revisión manual (no se sube a Cloudinary)

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

# Database (Railway PostgreSQL)
DB_HOST=junction.proxy.rlwy.net
DB_PORT=26286
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=railway
DB_SSL=false
```

---

## 📞 Mantenimiento de Data

Para agregar nuevos artistas o géneros, editar:
- `data/artists-data.js` - Artistas por género
- `data/genres.json` - Lista de géneros válidos
- `data/genres-tiers.json` - Clasificación por popularidad
- `data/genre-families.json` - Familias de géneros

---

## 🛠️ Requisitos

- Node.js 18+
- PostgreSQL (Railway)
- Cloudinary account
- YouTube API key (para descarga de MP3)
- yt-dlp y ffmpeg instalados (para descarga)

---

## 📋 Scripts Activos

**Música (2):**
- `npm run cleanup:master` - Limpieza y organización de BD
- `npm run download:upload:cloudinary` - Descarga y subida a CDN

**Imágenes (3):**
- `npm run generate:dalle` - Generación con DALL-E 3
- `npm run generate:fal` - Generación con FAL AI
- `npm run generate:replicate` - Generación con Replicate

**Mantenimiento (1):**
- `node scripts/cleanup-orphaned-cloudinary-files.js` - Limpieza de CDN

---

**Última actualización**: 2025-11-15
**Total de scripts activos**: 6
**Proyecto**: VIBRA - Plataforma de Música
