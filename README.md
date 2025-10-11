# 🎵 VIBRA – Backend

## 📋 Resumen
VIBRA es un reproductor de música que genera imágenes en tiempo real usando IA basadas en las canciones reproducidas.  
El backend está construido con **NestJS + TypeScript**, y se conecta a **PostgreSQL** (datos estructurados) y **MongoDB** (imágenes generadas).  
Se integra con **YouTube API** y servicios de IA (DALL·E, DeepAI, etc.).

---

## 🏗️ Arquitectura
- **Autenticación** (`auth/`)
- **Música**: búsqueda y reproducción vía YouTube (`music/`)
- **Imágenes**: generación con IA y prompts (`images/`)
- **Playlists**: gestión de listas de reproducción (`playlists/`)
- **Usuarios**: gestión de perfiles (`users/`)
- **Shared**: constantes, utils y base de datos (`shared/`)

---

## 📐 Diagrama de Clases
![Diagrama de Clases - VIBRA](docs/vibraUML.png)

---

## 🚀 Flujo Principal (Sprint 5 - Implementado)
1. El usuario reproduce una canción mediante `POST /music/play/:id`
2. `MusicService` emite un evento `song.started` con los datos de la canción
3. `ParallelImageService` responde de forma **híbrida**:
   - ✅ Retorna **instantáneamente** una imagen precargada aleatoria del género
   - 🎨 Genera una **nueva imagen con DALL-E 3** en background (no bloqueante)
4. Las imágenes se almacenan en **MongoDB** con metadatos completos
5. Las nuevas imágenes se suben a **Cloudinary** para CDN

### 🔄 Sistema de Precarga
- **Stub Images**: Placeholders para los 81 géneros (instantáneas, sin costo)
- **DALL-E Images**: Imágenes AI para los 15 géneros más populares (alta calidad)
- **Generación Background**: Nuevas imágenes se crean mientras el usuario escucha música

---


## ✨ Características
- ⚡ **Respuesta instantánea**: imágenes precargadas con generación en background
- 🎨 **DALL-E 3**: Generación de imágenes reales con IA de OpenAI
- 🔄 **Sistema híbrido**: Stub placeholders + AI generation para balance costo/calidad
- 🧩 **Arquitectura modular**: cada módulo independiente
- 🤖 **Soporte multi-IA**: DALL-E 3, StubGenerator, extensible a más
- 🗄️ **Persistencia híbrida**: PostgreSQL (canciones) + MongoDB (imágenes) + Cloudinary (CDN)
- 📊 **Auto-aprendizaje**: Sistema de prompts con contadores de uso
- 🛠️ **Mantenible y testeable**: repositorios y servicios mockeables
- 🎯 **Event-driven**: Arquitectura basada en eventos NestJS EventEmitter2  


---

## 🔧 Scripts de Generación de Imágenes

### 📦 Precarga Inicial
```bash
# Generar imágenes DALL-E para los 15 géneros más populares (~$0.60)
node scripts/generate-top-genres.js

# Pre-cargar stubs para todos los géneros (gratis, instantáneo)
node scripts/seed-stub-images.js
```

### 🔄 Generación Periódica
```bash
# Generar N imágenes priorizando géneros con menos imágenes
node scripts/generate-periodic.js 20

# Por defecto genera 10 imágenes
node scripts/generate-periodic.js
```

### 📊 Verificar Estado
```bash
# Ver estadísticas de imágenes generadas
curl http://localhost:3000/images/stats
```

---

## 👥 Autores
- Sergio Peckerle  
- Diego Ortino  
- Cristian Calvo  
- Sebastián Allende  





