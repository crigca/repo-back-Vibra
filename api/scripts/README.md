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

Scripts para generación de imágenes con AI.

### `generate-by-genre.js`
**Descripción:** Genera imágenes asociadas a géneros musicales.

**Uso:**
```bash
node scripts/production/images/generate-by-genre.js Gospel 5  # 5 imágenes de Gospel
node scripts/production/images/generate-by-genre.js all 2     # 2 por cada género
```

**Características:**
- Genera imágenes reutilizables por género
- Guarda en Cloudinary
- Asocia a múltiples canciones del mismo género

---

### `generate-dalle.js`
**Descripción:** Genera imágenes usando DALL-E de OpenAI.

**Requiere:**
- API Key de OpenAI en `.env`

---

### `generate-fal.js`
**Descripción:** Genera imágenes usando Fal.ai.

**Requiere:**
- API Key de Fal.ai en `.env`

---

### `generate-replicate.js`
**Descripción:** Genera imágenes usando Replicate.

**Requiere:**
- API Key de Replicate en `.env`

---

### `seed-prompts.js`
**Descripción:** Carga prompts predefinidos para generación de imágenes.

**Uso:**
```bash
node scripts/production/images/seed-prompts.js
```

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

## 📞 Soporte

Si tienes problemas con algún script:

1. Verifica que el backend esté corriendo: `npm run start:dev`
2. Revisa las variables de entorno en `.env`
3. Consulta los logs de ejecución

---

**Última actualización:** Octubre 2025
**Proyecto:** VIBRA - Plataforma de Música
