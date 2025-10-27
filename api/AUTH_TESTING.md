# 🔐 Guía de Prueba - Autenticación con Google OAuth y JWT

## ✅ Sistema Activado

La autenticación con Google OAuth2 y JWT está **completamente activada** en el backend.

---

## 📋 Endpoints Disponibles

### 🔓 **Públicos** (No requieren autenticación)

```
GET  /playlists              - Listar todas las playlists
GET  /playlists/:id          - Obtener playlist por ID
GET  /music/songs            - Listar canciones
```

### 🔒 **Protegidos** (Requieren JWT Token)

```
POST   /playlists                    - Crear playlist
PUT    /playlists/:id                - Actualizar playlist
DELETE /playlists/:id                - Eliminar playlist
POST   /playlists/:id/songs          - Agregar canción
DELETE /playlists/:id/songs/:songId  - Eliminar canción
PATCH  /playlists/:id/songs/reorder  - Reordenar canciones
PATCH  /playlists/:id/regenerate     - Regenerar playlist

GET    /users                        - Listar usuarios
GET    /users/:id                    - Obtener usuario
POST   /users                        - Crear usuario
PATCH  /users/:id                    - Actualizar usuario
DELETE /users/:id                    - Eliminar usuario

GET    /auth/me                      - Obtener usuario actual
```

### 🌐 **Autenticación**

```
POST /auth/google  - Login con Google (devuelve JWT)
```

---

## 🧪 Probar con cURL/Postman

### 1️⃣ **Login con Google** (Frontend)

El frontend ya maneja esto automáticamente:

```tsx
// LoginModal.tsx hace:
const response = await fetch('http://localhost:3000/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: googleToken })
});

const data = await response.json();
localStorage.setItem("token_vibra", data.token);
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2️⃣ **Verificar Usuario Autenticado**

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Respuesta:**
```json
{
  "userId": "uuid-del-usuario",
  "username": "nombre_usuario",
  "email": "usuario@gmail.com"
}
```

---

### 3️⃣ **Crear Playlist (Con Autenticación)**

```bash
curl -X POST http://localhost:3000/playlists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "name": "Mi Playlist",
    "description": "Descripción opcional",
    "isPublic": true
  }'
```

**Sin token → Error 401:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Con token → Success:**
```json
{
  "id": "uuid-playlist",
  "name": "Mi Playlist",
  "userId": "uuid-usuario",
  "createdAt": "2025-10-26T..."
}
```

---

### 4️⃣ **Agregar Canción a Playlist**

```bash
curl -X POST http://localhost:3000/playlists/PLAYLIST_ID/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "songId": "uuid-de-la-cancion"
  }'
```

---

## 🎨 Frontend - Uso del Token

### **Guardar Token** (Ya implementado)

```tsx
localStorage.setItem("token_vibra", data.token);
```

### **Enviar Token en Peticiones** (Agregar esto)

```tsx
// Ejemplo: Crear playlist
const createPlaylist = async (name: string, songs: Song[]) => {
  const token = localStorage.getItem('token_vibra');

  const response = await fetch('http://localhost:3000/playlists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // ← Agregar esto
    },
    body: JSON.stringify({ name, songs })
  });

  return response.json();
};
```

### **Verificar si está Autenticado**

```tsx
const checkAuth = async () => {
  const token = localStorage.getItem('token_vibra');

  if (!token) {
    // Usuario no autenticado
    return false;
  }

  try {
    const response = await fetch('http://localhost:3000/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const user = await response.json();
      return user;
    } else {
      // Token inválido o expirado
      localStorage.removeItem('token_vibra');
      return false;
    }
  } catch (error) {
    return false;
  }
};
```

---

## 🔧 Variables de Entorno

**Backend** (`.env`):
```env
JWT_SECRET=clave-secreta
JWT_EXPIRES_IN=24h
GOOGLE_CLIENT_ID=881144321895-esh95d9nnokqigh4dv20upmcfqvg9vjd.apps.googleusercontent.com
```

**Frontend**: Necesitas configurar el Google OAuth Client ID en tu app de React.

---

## ⚠️ Errores Comunes

### **401 Unauthorized**
- Token no enviado o mal formateado
- Token expirado (7 días)
- Token inválido

**Solución**: Hacer login de nuevo

### **403 Forbidden**
- Usuario autenticado pero sin permisos

### **Token no funciona**
- Verificar que el header sea: `Authorization: Bearer TOKEN`
- Verificar que JWT_SECRET sea el mismo en backend y al generar el token

---

## 🚀 Siguiente Paso

**Reiniciar el backend** para que tome todos los cambios:

```bash
# Detener el servidor actual (Ctrl+C)
cd /home/crigca/vibra/back/api
npm run start:dev
```

Luego probar desde el frontend o Postman!
