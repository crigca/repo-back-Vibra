# 🧹 Script Maestro de Limpieza de Base de Datos

## 📋 ¿Qué hace este script?

El script `master-cleanup.js` realiza una limpieza completa y automática de la base de datos de canciones en **4 fases**:

### **FASE 1: Asignación Automática de Géneros**
- Lee el artista de cada canción
- Normaliza el nombre (quita acentos, espacios, mayúsculas)
- Busca el artista en `artists-data.js`
- Si lo encuentra → Asigna el género correcto
- Si NO lo encuentra → Asigna `genre = "Otros"`

### **FASE 2: Limpieza de Títulos y Artistas**
- Elimina patrones comunes:
  - `(Official Video)`, `[HD]`, `- Topic`
  - Emojis
  - Años entre paréntesis
  - Sufijos como `VEVO`, `Official`, etc.

### **FASE 3: Eliminación de Duplicados**
- Agrupa canciones por: `título normalizado + artista normalizado`
- Para grupos con 3 o más canciones:
  - Ordena por `viewCount` (más vistas primero)
  - **MANTIENE las 2 primeras** (más populares)
  - **ELIMINA las demás** (3ra en adelante)

### **FASE 4: Generación de Reportes**
- `cleanup-report.json` → Estadísticas completas
- `uncategorized-songs.csv` → Canciones asignadas a "Otros" para revisar

---

## 🚀 Cómo ejecutarlo

### **1. Asegúrate de que el servidor esté corriendo**
```bash
cd /home/crigca/vibra/back/api
npm run start:dev
```

### **2. En otra terminal, ejecuta el script**
```bash
cd /home/crigca/vibra/back/api
npm run cleanup:master
```

### **3. Espera a que termine**
El script mostrará el progreso en tiempo real:
```
🧹 LIMPIEZA MAESTRA DE BASE DE DATOS
======================================================================

FASE 1: ASIGNACIÓN DE GÉNEROS
----------------------------------------------------------------------
✅ [1/1500] "Despacito" → Reggaeton
✅ [2/1500] "Bohemian Rhapsody" → Rock
⚠️  [3/1500] "Unknown Artist Song" → Otros

FASE 2: LIMPIEZA DE TÍTULOS Y ARTISTAS
----------------------------------------------------------------------
🧹 [450/1500] Limpiado:
   Título: "Song Title (Official Video) [HD]" → "Song Title"
   Artista: "ArtistVEVO" → "Artist"

FASE 3: ELIMINACIÓN DE DUPLICADOS
----------------------------------------------------------------------
🔍 Grupo con 4 canciones:
   Título: "Despacito"
   Artista: "Luis Fonsi"
   ✅ MANTENER (top 2):
      1. 8,000,000 vistas - ID: abc-123
      2. 5,000,000 vistas - ID: def-456
   ❌ ELIMINAR (2 duplicados):
      - 1,000,000 vistas - ID: ghi-789
      - 500,000 vistas - ID: jkl-012

FASE 4: GENERACIÓN DE REPORTES
----------------------------------------------------------------------
📄 Reporte JSON: /home/crigca/vibra/back/api/scripts/reports/cleanup-report.json
📄 Reporte CSV: /home/crigca/vibra/back/api/scripts/reports/uncategorized-songs.csv

📊 RESUMEN FINAL
======================================================================
Total de canciones procesadas: 1,500

FASE 1: Asignación de Géneros
  ✅ Géneros detectados y asignados: 1,200
  ⚠️  Asignadas a "Otros": 300
  ❌ Errores: 0

FASE 2: Limpieza de Títulos
  ✅ Títulos limpiados: 450
  ✅ Artistas limpiados: 380
  ❌ Errores: 0

FASE 3: Eliminación de Duplicados
  📊 Grupos analizados: 600
  ✅ Canciones mantenidas (máx 2): 170
  ❌ Duplicados eliminados: 85
  ❌ Errores: 0

✅ LIMPIEZA MAESTRA COMPLETADA!
```

---

## 📊 Reportes Generados

### **1. `cleanup-report.json`**
Contiene estadísticas detalladas en formato JSON:
```json
{
  "timestamp": "2025-01-04T10:30:00.000Z",
  "stats": {
    "total": 1500,
    "phase1": {
      "genresAssigned": 1200,
      "genresOtros": 300,
      "errors": 0
    },
    ...
  },
  "uncategorizedSongs": [...]
}
```

### **2. `uncategorized-songs.csv`**
Lista de canciones asignadas a "Otros" para revisar manualmente:
```csv
ID,Título,Artista,YouTube ID,Vistas
"abc-123","Unknown Song","Unknown Artist","dQw4w9WgXcQ",50000
"def-456","Indie Artist Song","Indie Artist","kxopViU98Xo",30000
```

**¿Qué hacer con este archivo?**
1. Ábrelo con Excel o Google Sheets
2. Para cada canción, decide a qué género pertenece
3. Actualiza manualmente en la BD o agrega el artista a `artists-data.js`

---

## ⚠️ ADVERTENCIAS

1. **BACKUP:** Asegúrate de tener un backup de tu BD antes de ejecutar
2. **SERVIDOR:** El backend DEBE estar corriendo en `localhost:3000`
3. **TIEMPO:** Puede tardar varios minutos dependiendo del tamaño de tu BD
4. **IRREVERSIBLE:** Una vez eliminados los duplicados, no se pueden recuperar

---

## 🔧 Configuración

Si necesitas modificar el comportamiento, edita estas variables en `master-cleanup.js`:

```javascript
// URL del backend
const API_BASE_URL = 'http://localhost:3000';

// Directorio de reportes
const OUTPUT_DIR = path.join(__dirname, '../../reports');
```

---

## 🆘 Solución de Problemas

### **Error: "El servidor no está corriendo"**
```bash
# Solución: Inicia el servidor
cd /home/crigca/vibra/back/api
npm run start:dev
```

### **Error: "Cannot find module 'artists-data'"**
```bash
# Verifica que el archivo existe
ls -la scripts/data/artists-data.js
```

### **El script se detiene a mitad**
- Revisa los logs del backend para ver si hay errores
- Verifica que la conexión a la BD esté activa
- Ejecuta el script nuevamente (es seguro, no duplicará el trabajo)

---

## 📝 Notas

- El script es **idempotente**: Puedes ejecutarlo múltiples veces sin problemas
- Las canciones ya procesadas serán skipeadas automáticamente
- Los duplicados eliminados NO se pueden recuperar

---

## 🎯 Próximos Pasos (Después de ejecutar)

1. **Revisa el reporte:** Abre `uncategorized-songs.csv`
2. **Categoriza manualmente:** Agrega artistas faltantes a `artists-data.js`
3. **Ejecuta nuevamente:** Para asignar géneros a las que quedaron en "Otros"
4. **Integra en el backend:** (Opcional) Para prevenir futuros problemas

---

¿Preguntas? Revisa el código fuente en `master-cleanup.js`
