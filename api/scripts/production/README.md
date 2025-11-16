# Production Scripts

Scripts de producción para VIBRA. Incluye generación de imágenes con AI y gestión de música.

## 📁 Estructura

```
production/
├── images/              # Scripts de generación de imágenes
│   ├── generate-dalle.js
│   ├── generate-fal.js
│   ├── generate-replicate.js
│   ├── generate-by-genre.js
│   └── seed-prompts.js
│
├── music/               # Scripts de gestión de música
│   ├── seed-music.js
│   ├── download-mp3.js
│   ├── sync-audio-paths.js
│   ├── cleanup-database.js
│   └── cleanup-orphan-mp3.js
│
└── playlists/           # Scripts de playlists
    ├── seed-genre-playlists.js
    └── seed-family-playlists.js
```

## 🖼️ Generación de Imágenes

### 1. DALL-E 3 (Calidad Premium)

**Script:** `generate-dalle.js`
**Comando:** `npm run generate:dalle`

**Características:**
- Genera 50 imágenes de alta calidad
- Distribución: Tier1 (20), Tier2 (15), Tier3 (10), Tier4 (5)
- Costo: ~$0.04 USD por imagen (total ~$2.00 USD)
- Tiempo: ~3-5 segundos por imagen
- Mejor calidad visual

---

### 2. FAL AI (Rápido y Económico)

**Script:** `generate-fal.js`
**Comando:** `npm run generate:fal`

**Características:**
- Genera 100 imágenes muy rápido
- Distribución: Tier1 (40), Tier2 (30), Tier3 (15), Tier4 (15)
- Costo: Muy económico
- Tiempo: ~2-3 segundos por imagen
- Buena calidad para visualizaciones

---

### 3. Replicate SDXL (Balance)

**Script:** `generate-replicate.js`
**Comando:** `npm run generate:replicate`

**Características:**
- Genera 100 imágenes con balance calidad/precio
- Distribución: Tier1 (40), Tier2 (30), Tier3 (15), Tier4 (15)
- Costo: Precio moderado
- Tiempo: ~5-10 segundos por imagen
- Modelo: Stable Diffusion XL

---

### 4. Por Género Específico

**Script:** `generate-by-genre.js`
**Comando:** `node scripts/production/images/generate-by-genre.js [género] [cantidad]`

**Ejemplos:**
```bash
node scripts/production/images/generate-by-genre.js Rock 10
node scripts/production/images/generate-by-genre.js Cumbia 5
node scripts/production/images/generate-by-genre.js all 2
```

---

### 5. Seed Prompts

**Script:** `seed-prompts.js`
**Comando:** `node scripts/production/images/seed-prompts.js`

**Características:**
- Carga prompts predefinidos en MongoDB
- Lee archivos de datos (prompts.json, genres.json)
- Crea 2 prompts por género (base + variation)

### Archivos de Datos Requeridos

Los scripts necesitan estos archivos JSON (ubicados en `scripts/data/`):

- **prompts.json** - Prompts para cada género (79 géneros)
- **genres.json** - Lista de géneros
- **genre-families.json** - Familias de géneros relacionados
- **genres-tiers.json** - Tiers por popularidad

### Sistema de Tiers

Las imágenes se distribuyen según popularidad del género:

| Tier | Descripción | Géneros Ejemplo |
|------|-------------|-----------------|
| 1 | Mainstream Argentina/LATAM | Rock, Cumbia, Reggaeton, Trap |
| 2 | Muy populares en región | Bachata, Tango, Techno, House |
| 3 | Audiencia dedicada | Soul, Funk, Ska, Punk |
| 4 | Nicho o experimentales | Jazz, Blues, Opera, Flamenco |

### Elementos del Prompt

Cada imagen combina aleatoriamente:

- Scene Elements (10+ elementos por género)
- Visual Style (8+ estilos por género)
- Emotion/Mood (8+ emociones por género)
- Artistic Styles (25+ opciones globales)
- Lighting Techniques (25+ técnicas)
- Visual Concepts (conceptos abstractos)
- Photographic Compositions (ángulos y encuadres)
- Music Environment Objects (objetos musicales)

### Cross-Pollination

El sistema mezcla elementos de géneros relacionados con 20% de probabilidad para crear variedad visual mientras mantiene coherencia temática.

---

## 🎵 Gestión de Música

### 1. Seed Music (Buscar y guardar canciones)

**Script:** `seed-music.js`
**Comando:** `npm run seed:music`

**Características:**
- Busca canciones en YouTube por artista/género
- Filtra automáticamente (duración 1-10 min)
- Guarda hasta 500 canciones por ejecución
- Límite: 90 búsquedas por día (cuota API YouTube)

---

### 2. Download MP3

**Script:** `download-and-upload-cloudinary.js`
**Comando:** `npm run download:upload:cloudinary`

**Características:**
- Descarga MP3 desde YouTube
- Sube archivos a Cloudinary
- Actualiza URLs en la base de datos

---

### 3. Sync Cloudinary URLs

**Script:** `sync-cloudinary-urls.js`
**Comando:** `npm run sync:cloudinary`

**Características:**
- Sincroniza URLs de Cloudinary con la DB
- Útil después de migraciones o restauraciones

---

### 4. Cleanup Database

**Script:** `cleanup-database.js`
**Comando:** `npm run cleanup:db`

**Características:**
- Limpia canciones inválidas
- Elimina duplicados
- Remueve canciones sin youtubeId

---

### 5. Cleanup Orphan MP3

**Script:** `cleanup-orphan-mp3.js`
**Comando:** `npm run cleanup:orphan-mp3`

**Características:**
- Elimina archivos MP3 sin registro en DB
- Libera espacio en disco

---

### 6. Validate YouTube IDs

**Script:** `validate-youtube-ids.js`
**Comando:** `npm run validate:youtube`

**Características:**
- Valida formato de youtubeId
- Verifica que videos existan
- Reporta IDs inválidos

---

## 🎧 Gestión de Playlists

### 1. Seed Genre Playlists

**Script:** `seed-genre-playlists.js`
**Comando:** `npm run seed:playlists`

**Características:**
- Genera playlists por género
- Asigna canciones automáticamente
- Crea covers con mosaico 2x2

---

### 2. Seed Family Playlists

**Script:** `seed-family-playlists.js`
**Comando:** `npm run seed:family-playlists`

**Características:**
- Genera playlists por familia de géneros
- Agrupa géneros relacionados
- Ejemplo: Rock Family (Rock, Rock Argentino, Metal)

---

## 🔧 Troubleshooting

### Error: "No hay prompt para: [género]"

**Solución:**
1. Verifica que `prompts.json` contenga el género
2. Reinicia el script (puede estar usando cache)

### Imágenes no se suben a Cloudinary

**Solución:**
1. Verifica variables en `.env`:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
2. Verifica conexión a internet
3. Revisa logs del script

### MongoDB no conecta

**Solución:**
1. Verifica `MONGODB_URI` en `.env`
2. Verifica que MongoDB Atlas esté accesible
3. Revisa whitelist de IPs en MongoDB Atlas

### YouTube API Quota Exceeded

**Solución:**
1. Espera 24 horas para que se renueve la cuota
2. Considera usar múltiples API Keys
3. Reduce el número de búsquedas por ejecución

## 📊 Estadísticas

- **Total géneros:** 79
- **Prompts únicos:** 79 (base) + variaciones
- **Imágenes por ejecución completa:** 250 (50 + 100 + 100)
- **Tiempo estimado por script:**
  - DALL-E: ~3-5 min
  - FAL AI: ~5-8 min
  - Replicate: ~8-15 min

## 📝 Resumen de Comandos

### Generación de Imágenes
```bash
npm run generate:dalle       # 50 imágenes con DALL-E 3
npm run generate:fal         # 100 imágenes con FAL AI
npm run generate:replicate   # 100 imágenes con Replicate SDXL
node scripts/production/images/generate-by-genre.js Rock 10
node scripts/production/images/seed-prompts.js
```

### Gestión de Música
```bash
npm run seed:music                   # Buscar canciones en YouTube
npm run download:upload:cloudinary   # Descargar y subir MP3
npm run sync:cloudinary              # Sincronizar URLs
npm run cleanup:db                   # Limpiar base de datos
npm run cleanup:orphan-mp3           # Eliminar MP3 huérfanos
npm run validate:youtube             # Validar YouTube IDs
```

### Gestión de Playlists
```bash
npm run seed:playlists          # Crear playlists por género
npm run seed:family-playlists   # Crear playlists por familia
```

---

## 📝 Notas

- Los archivos MP3 y temporales están en `.gitignore`
- Las imágenes se guardan en Cloudinary, no en disco
- Los prompts se pueden editar en `scripts/data/prompts.json`
- Los tiers se pueden ajustar en `scripts/data/genres-tiers.json`
- Todos los scripts requieren que el backend esté configurado correctamente

---

**Última actualización:** Octubre 2025
**Autor:** VIBRA Team
