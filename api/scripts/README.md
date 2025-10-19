# 📚 Scripts de VIBRA

Documentación completa de todos los scripts del proyecto.

---

## 📁 Estructura de Carpetas

```
scripts/
├── production/         # Scripts de producción (listos para usar)
│   ├── music/         # Gestión de música y MP3
│   └── images/        # Generación de imágenes con AI
├── data/              # Archivos de configuración y datos
├── tests/             # Scripts de prueba y demos
└── deprecated/        # Scripts obsoletos (no usar)
```

---

## 🎵 Production - Music

Scripts para gestión de canciones y archivos MP3.

### `seed-music.js`
**Descripción:** Busca y guarda canciones de YouTube en la base de datos.

**Uso:**
```bash
npm run seed:music
```

**Características:**
- Busca canciones en YouTube por artista/género
- Filtra automáticamente (duración 1-10 min, sin mixes/compilations)
- Guarda hasta 500 canciones por ejecución
- Límite: 90 búsquedas por día (cuota de API)

**Requiere:**
- Backend corriendo en `localhost:3000`
- API Key de YouTube en `.env`

---

### `download-mp3.js`
**Descripción:** Descarga archivos MP3 desde YouTube para canciones en la DB.

**Uso:**
```bash
npm run download:mp3
```

**Características:**
- Busca canciones con `audioPath: null`
- Descarga MP3 usando Cobalt API
- Guarda en `/public/audio/`
- Actualiza `audioPath` en la DB

**Requiere:**
- Backend corriendo
- Conexión a internet

---

### `sync-audio-paths.js`
**Descripción:** Sincroniza archivos MP3 en disco con registros en la DB.

**Uso:**
```bash
npm run sync:audio
```

**Características:**
- Lee archivos MP3 de `/public/audio/`
- Busca cada canción por `youtubeId`
- Actualiza campo `audioPath` en la DB

**Útil cuando:**
- Los `audioPath` se borraron de la DB
- Moviste archivos MP3 manualmente
- Restauraste un backup

---

### `cleanup-database.js`
**Descripción:** Limpia canciones inválidas de la base de datos.

**Uso:**
```bash
npm run cleanup:db
```

**Elimina canciones que:**
- Duración inválida (< 1 min o > 10 min)
- Sin `youtubeId`
- Título con palabras prohibidas (mix, best of, compilation)
- Menos de 1000 vistas en YouTube

**⚠️ Advertencia:** Este script **elimina registros** permanentemente.

---

### `cleanup-orphan-mp3.js`
**Descripción:** Elimina archivos MP3 que no tienen registro en la DB.

**Uso:**
```bash
npm run cleanup:orphan-mp3
```

**Características:**
- Verifica cada archivo MP3 en disco
- Busca su registro en la DB por `youtubeId`
- Elimina archivos sin registro
- Reporta espacio liberado

**Útil para:** Liberar espacio en disco después de limpiar la DB.

---

### `validate-youtube-ids.js`
**Descripción:** Valida que los `youtubeId` en la DB sean válidos.

**Uso:**
```bash
npm run validate:youtube
```

**Verifica:**
- Formato correcto de `youtubeId` (11 caracteres)
- Que el video exista en YouTube
- Que el video sea embebible

---

## 🖼️ Production - Images

Scripts para generación masiva de imágenes con AI para cada género musical.

### 📋 Requisitos Previos

**IMPORTANTE:** Antes de ejecutar cualquier script de generación, asegúrate de que existan los enlaces simbólicos a los archivos de datos:

```bash
cd scripts/production/images
ls -la  # Deberías ver: prompts.json, genres.json, genre-families.json
```

Si no existen, créalos:
```bash
ln -sf ../../data/prompts.json prompts.json
ln -sf ../../data/genres.json genres.json
ln -sf ../../data/genre-families.json genre-families.json
```

---

### `generate-dalle.js`
**Descripción:** Genera imágenes usando DALL-E 3 de OpenAI (calidad premium).

**Uso:**
```bash
npm run generate:dalle
```

**Características:**
- Genera 50 imágenes distribuidas por tiers
- **Tier 1:** 20 imágenes (géneros mainstream)
- **Tier 2:** 15 imágenes (géneros muy populares)
- **Tier 3:** 10 imágenes (géneros con audiencia dedicada)
- **Tier 4:** 5 imágenes (géneros nicho)
- Sube automáticamente a Cloudinary
- Guarda metadata en MongoDB
- Costo: ~$0.04 USD por imagen (total ~$2.00 USD)
- Tiempo: ~3-5 segundos por imagen

**Requiere:**
- `OPENAI_API_KEY` en `.env`
- MongoDB conectado
- Cloudinary configurado

---

### `generate-fal.js`
**Descripción:** Genera imágenes usando FAL AI (Flux Schnell) - rápido y económico.

**Uso:**
```bash
npm run generate:fal
```

**Características:**
- Genera 100 imágenes distribuidas por tiers
- **Tier 1:** 40 imágenes
- **Tier 2:** 30 imágenes
- **Tier 3:** 15 imágenes
- **Tier 4:** 15 imágenes
- Velocidad: ~2-3 segundos por imagen
- Muy económico comparado con DALL-E
- Calidad: Buena para visualizaciones rápidas

**Requiere:**
- `FAL_API_KEY` en `.env`
- MongoDB conectado
- Cloudinary configurado

---

### `generate-replicate.js`
**Descripción:** Genera imágenes usando Replicate SDXL - balance calidad/precio.

**Uso:**
```bash
npm run generate:replicate
```

**Características:**
- Genera 100 imágenes distribuidas por tiers
- **Tier 1:** 40 imágenes
- **Tier 2:** 30 imágenes
- **Tier 3:** 15 imágenes
- **Tier 4:** 15 imágenes
- Velocidad: ~5-10 segundos por imagen
- Balance entre calidad y costo
- Modelo: Stable Diffusion XL

**Requiere:**
- `REPLICATE_API_TOKEN` en `.env`
- MongoDB conectado
- Cloudinary configurado

---

### `generate-by-genre.js`
**Descripción:** Genera imágenes para un género específico.

**Uso:**
```bash
node scripts/production/images/generate-by-genre.js Gospel 5  # 5 imágenes de Gospel
node scripts/production/images/generate-by-genre.js all 2     # 2 por cada género
```

**Características:**
- Permite generar imágenes por género específico
- Útil para rellenar géneros con pocas imágenes
- Usa los mismos prompts que los scripts masivos

---

### `seed-prompts.js`
**Descripción:** Carga prompts predefinidos en MongoDB.

**Uso:**
```bash
node scripts/production/images/seed-prompts.js
```

**Características:**
- Lee `prompts.json` y `genres.json`
- Carga todos los prompts en MongoDB
- Crea 2 prompts por género (base + variation)
- Útil para inicializar la base de datos

---

### 🎨 Sistema de Prompts

Los prompts se generan aleatoriamente combinando:

- **Scene Elements:** Elementos visuales del género
- **Visual Style:** Estilo artístico y colores
- **Emotion/Mood:** Sentimientos y atmósfera
- **Artistic Styles:** 25+ estilos (vintage, cyberpunk, etc.)
- **Lighting Techniques:** 25+ técnicas de iluminación
- **Visual Concepts:** Conceptos abstractos musicales
- **Photographic Compositions:** Ángulos y encuadres
- **Music Environment Objects:** Objetos del ambiente musical

Cada imagen es única gracias a la combinación aleatoria de elementos.

---

### 📊 Distribución por Tiers

Los géneros están organizados en tiers según popularidad:

- **Tier 1:** Rock, Cumbia, Reggaeton, Trap, Pop, Metal, etc.
- **Tier 2:** Bachata, Tango, Techno, House, Hip Hop, etc.
- **Tier 3:** Soul, Funk, Ska, Punk, Indie Rock, etc.
- **Tier 4:** Jazz, Blues, Opera, Gospel, Flamenco, etc.

Ver [genres-tiers.json](scripts/data/genres-tiers.json) para la lista completa.

---

## 📊 Data

Archivos de configuración y datos estáticos.

### `artists-data.js`
Lista de artistas organizados por género. Usado por `seed-music.js`.

### `genre-families.json`
Familias de géneros musicales (Rock, Pop, etc.).

### `genres-tiers.json`
Niveles/tiers de géneros para priorización.

### `genres.json`
Lista completa de géneros musicales.

### `prompts.json`
Prompts para generación de imágenes con AI.

---

## 🧪 Tests

Scripts de prueba y demos.

### `demo-youtube-api.js`
Demo visual de la integración con YouTube API.

**Uso:**
```bash
npm run demo:youtube
```

---

### `test-ai-apis.js`
Prueba las APIs de generación de imágenes.

---

### `test-cloudinary.js`
Prueba la conexión con Cloudinary.

---

### `test-image-generation.js`
Test de generación de imágenes.

---

### `test-services.js`
Test general de servicios del backend.

---

### `test-api-endpoints.sh`
Script bash para probar endpoints HTTP.

**Uso:**
```bash
bash scripts/tests/test-api-endpoints.sh
```

---

## 🗄️ Deprecated

Scripts obsoletos o deprecados. **NO USAR EN PRODUCCIÓN**.

### `verify-mongodb.js`
⚠️ **Nota:** Aún se usa MongoDB para algunas funcionalidades, pero este script es antiguo.

**Descripción:** Verifica conexión con MongoDB Atlas.

---

### `generate-fal-backup.js`
⚠️ **Deprecado:** Duplicado de `generate-fal.js`.

---

## 🔑 Variables de Entorno Requeridas

Asegúrate de tener estas variables en tu archivo `.env`:

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
```

---

## 📝 Comandos NPM Disponibles

```bash
# Música
npm run seed:music           # Buscar y guardar canciones
npm run download:mp3         # Descargar MP3
npm run sync:audio           # Sincronizar audioPath
npm run cleanup:db           # Limpiar canciones inválidas
npm run cleanup:orphan-mp3   # Eliminar MP3 huérfanos
npm run validate:youtube     # Validar youtubeIds

# Generación de Imágenes
npm run generate:dalle       # Generar 50 imágenes con DALL-E 3
npm run generate:fal         # Generar 100 imágenes con FAL AI
npm run generate:replicate   # Generar 100 imágenes con Replicate SDXL

# Tests
npm run demo:youtube         # Demo de YouTube API
```

---

## 🚀 Flujo de Trabajo Recomendado

### Para cargar música nueva:

1. **Buscar canciones:**
   ```bash
   npm run seed:music
   ```

2. **Descargar MP3:**
   ```bash
   npm run download:mp3
   ```

3. **Si hay problemas de sincronización:**
   ```bash
   npm run sync:audio
   ```

4. **Limpiar base de datos (opcional):**
   ```bash
   npm run cleanup:db
   npm run cleanup:orphan-mp3
   ```

---

### Para generar imágenes con AI:

1. **Verificar enlaces simbólicos (solo primera vez):**
   ```bash
   cd scripts/production/images
   ln -sf ../../data/prompts.json prompts.json
   ln -sf ../../data/genres.json genres.json
   ln -sf ../../data/genre-families.json genre-families.json
   cd ../../..
   ```

2. **Opción A - Calidad Premium (DALL-E 3):**
   ```bash
   npm run generate:dalle
   # Genera 50 imágenes, costo ~$2.00 USD
   ```

3. **Opción B - Rápido y Económico (FAL AI):**
   ```bash
   npm run generate:fal
   # Genera 100 imágenes, muy económico
   ```

4. **Opción C - Balance Calidad/Precio (Replicate):**
   ```bash
   npm run generate:replicate
   # Genera 100 imágenes, precio moderado
   ```

**Nota:** Puedes ejecutar múltiples scripts simultáneamente para generar imágenes con diferentes AIs en paralelo.

---

## 📞 Soporte

Si tienes problemas con algún script:

1. Verifica que el backend esté corriendo: `npm run start:dev`
2. Revisa las variables de entorno en `.env`
3. Consulta los logs de ejecución

---

**Última actualización:** Octubre 2025
**Proyecto:** VIBRA - Plataforma de Música
