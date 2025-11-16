# 🎵 Sistema de Clasificación Automática de Géneros

## 📋 Descripción

El sistema ahora clasifica automáticamente el género de las canciones cuando se agregan desde el buscador del frontend, basándose en el artista.

## 🔄 Flujo Completo

### 1️⃣ **Usuario agrega canción desde el buscador**

El frontend envía `POST /music/songs` con:
```json
{
  "title": "Nombre de la canción",
  "artist": "Nombre del artista",
  "youtubeId": "abc123",
  "duration": 180
}
```

### 2️⃣ **Backend detecta género automáticamente**

El servicio `GenreDetectorService`:
- Busca el artista en `scripts/data/artists-data.js`
- Si encuentra match → asigna el género en **camelCase** (ej: `jpop`, `rockArgentino`)
- Si NO encuentra → guarda con `genre = NULL`

**Logs del backend:**
```
🔍 Intentando detectar género automáticamente para "Kyary Pamyu Pamyu"...
✅ Género detectado automáticamente: jpop
✅ Canción guardada exitosamente con ID: xyz - Género: jpop
```

### 3️⃣ **Descarga y subida a Cloudinary**

```bash
npm run download:upload:cloudinary
```

- Solo procesa canciones con `genre IS NOT NULL`
- Descarga MP3 desde YouTube
- Sube a Cloudinary en carpeta: `vibra/music/{genre}`
- Actualiza `cloudinaryUrl` en la DB

### 4️⃣ **Generación de playlists**

```bash
npm run seed:playlists
```

- Crea/actualiza playlists automáticamente por género
- Solo incluye canciones con `cloudinaryUrl` != NULL

---

## 🛠️ Scripts Disponibles

### **Clasificar canciones sin género**
```bash
npm run classify:genres
```

Busca canciones con `genre = NULL` y las clasifica automáticamente basándose en `artists-data.js`.

**Output:**
```
📋 Buscando canciones sin género...
🎵 Encontradas 25 canciones sin género

🔍 Clasificando canciones...

✅ "Drinker" - Kyary Pamyu Pamyu → jpop
✅ "Fashion Monster" - Kyary Pamyu Pamyu → jpop
⚠️  "Unknown Song" - Unknown Artist → SIN CLASIFICAR

==========================================================
📊 RESUMEN
==========================================================
Total procesadas: 25
✅ Clasificadas automáticamente: 23
⚠️  Sin clasificar: 2
```

### **Limpiar base de datos**
```bash
npm run cleanup:db
```

Elimina canciones con:
- Títulos prohibidos (mix, compilation, etc.)
- Duración inválida (<60s o >600s)

### **Descargar y subir a Cloudinary**
```bash
npm run download:upload:cloudinary
```

### **Generar playlists**
```bash
npm run seed:playlists
```

---

## 📚 Base de Datos de Artistas

El archivo `scripts/data/artists-data.js` contiene ~1000 artistas clasificados por género.

**Formato:**
```javascript
const artistsByGenre = {
  "jpop": ["Hikaru Utada", "Perfume", "Kyary Pamyu Pamyu", ...],
  "rockArgentino": ["Soda Stereo", "Charly García", ...],
  "reggaeton": ["Daddy Yankee", "Bad Bunny", ...]
};
```

### **Agregar nuevos artistas**

1. Edita `scripts/data/artists-data.js`
2. Agrega el artista al género correspondiente (en camelCase)
3. Ejecuta `npm run classify:genres` para clasificar canciones existentes

**Ejemplo:**
```javascript
"jpop": [
  "Hikaru Utada",
  "Perfume",
  "Kyary Pamyu Pamyu",
  "TU_ARTISTA_NUEVO" // ← Agregar aquí
],
```

---

## 🎯 Clasificación Manual

Para canciones que NO se clasifican automáticamente:

### **Opción 1: Agregar a artists-data.js (RECOMENDADO)**
```javascript
// scripts/data/artists-data.js
"jpop": [...artistas existentes, "Nuevo Artista"]
```

Luego ejecutar:
```bash
npm run classify:genres
```

### **Opción 2: SQL directo**
```sql
UPDATE songs
SET genre = 'jpop'
WHERE artist ILIKE '%Kyary%';
```

---

## 📊 Verificar Estado

### **Contar canciones sin género**
```sql
SELECT COUNT(*)
FROM songs
WHERE genre IS NULL;
```

### **Contar canciones por género**
```sql
SELECT genre, COUNT(*) as total
FROM songs
WHERE genre IS NOT NULL
GROUP BY genre
ORDER BY total DESC;
```

### **Ver canciones sin cloudinaryUrl**
```sql
SELECT COUNT(*)
FROM songs
WHERE cloudinaryUrl IS NULL
  AND genre IS NOT NULL;
```

---

## ✅ Flujo Recomendado

1. **Agregar canciones desde el buscador** (frontend)
   - El backend clasifica automáticamente ~90% de las canciones

2. **Clasificar manualmente las restantes**
   ```bash
   npm run classify:genres
   ```
   - Revisa el output y agrega artistas faltantes a `artists-data.js`

3. **Limpiar base de datos**
   ```bash
   npm run cleanup:db
   ```
   - Elimina canciones inválidas (compilaciones, duración incorrecta, etc.)

4. **Descargar MP3 y subir a Cloudinary**
   ```bash
   npm run download:upload:cloudinary
   ```
   - Solo procesa canciones con género asignado

5. **Generar playlists**
   ```bash
   npm run seed:playlists
   ```
   - Crea/actualiza playlists automáticamente

---

## 🔧 Troubleshooting

### **Problema: Canción no se descarga a Cloudinary**
**Causa:** No tiene género asignado (`genre = NULL`)

**Solución:**
```bash
npm run classify:genres
```

O clasificar manualmente:
```sql
UPDATE songs SET genre = 'genreEnCamelCase' WHERE id = 'uuid';
```

### **Problema: Género mal clasificado**
**Causa:** El artista no está en `artists-data.js` o el nombre no coincide

**Solución:**
1. Agregar artista a `artists-data.js` bajo el género correcto
2. Ejecutar `npm run classify:genres`

### **Problema: Muchas canciones sin clasificar**
**Solución:**
1. Ejecutar `npm run classify:genres` para ver cuáles faltan
2. Agregar artistas faltantes a `artists-data.js`
3. Ejecutar de nuevo `npm run classify:genres`

---

## 📝 Notas Importantes

- **Formato de géneros:** Siempre en **camelCase** (ej: `jpop`, `rockArgentino`, `popLatinoActual`)
- **Script de descarga:** Solo procesa canciones con `genre IS NOT NULL`
- **Playlists:** Solo incluyen canciones con `cloudinaryUrl IS NOT NULL`
- **Clasificación automática:** ~90% de precisión (artistas conocidos en `artists-data.js`)
- **Clasificación manual:** Necesaria para artistas nuevos o no mainstream

---

## 🎉 Beneficios

✅ **Clasificación automática** para la mayoría de canciones
✅ **Sin cambios en el frontend** - todo es transparente
✅ **Fácil mantenimiento** - solo agregar artistas a `artists-data.js`
✅ **Flujo rápido** - buscador → DB con género → descarga automática
✅ **Control manual** - para casos edge o artistas nuevos
