# 🔐 Flujo de Autenticación Completo - Vibra App

## 📋 Arquitectura de las Apps

```
/vibra/
├── front/
│   ├── vibraFront/  (Puerto 5173)  ← Landing Page + Login
│   │   ├── Landing page estática
│   │   ├── LoginModal con Google OAuth
│   │   └── RegisterModal
│   │
│   └── vibraApp/    (Puerto 5174)  ← App Principal
│       ├── FavPage (Playlists)
│       ├── CreatePlaylistModal
│       └── Player, etc.
│
└── back/api/        (Puerto 3000)  ← Backend con JWT
    └── Auth completamente activado
```

---

## 🚀 Flujo Completo del Usuario

### **1. Usuario entra a la Landing (vibraFront)**
```
http://localhost:5173
```
- Ve la landing page
- Hace click en "Iniciar Sesión"
- Se abre el LoginModal

### **2. Login con Google**
```tsx
// vibraFront/src/modal/Login/LoginModal.tsx

<GoogleLogin
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

**¿Qué pasa?**
1. Usuario hace click en "Sign in with Google"
2. Google abre popup de autenticación
3. Usuario selecciona su cuenta de Google
4. Google devuelve un `id_token`

### **3. Frontend envía token a Backend**
```tsx
const response = await fetch('http://localhost:3000/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: googleToken })
});
```

### **4. Backend verifica y crea JWT**
```typescript
// Backend: auth.service.ts

1. Verifica el id_token con Google OAuth2Client
2. Extrae: email, googleId, username
3. Busca o crea usuario en la BD
4. Genera JWT propio (válido 7 días)
5. Retorna: { token: "eyJhbGciOi..." }
```

### **5. Frontend guarda token y redirige**
```tsx
const data = await response.json();
localStorage.setItem("token_vibra", data.token);

// ✅ NUEVO: Redirige a vibraApp
window.location.href = "http://localhost:5174";
```

### **6. Usuario llega a vibraApp**
```
http://localhost:5174
```

El token ya está en localStorage compartido (mismo dominio localhost).

### **7. vibraApp hace peticiones autenticadas**
```tsx
// ✅ NUEVO: axios interceptor agrega el token automáticamente
// vibraApp/src/services/playlistsService.ts

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token_vibra');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ahora TODAS las peticiones llevan el token:
await axios.post('/playlists', { name: "Mi Playlist" });
// ↓
// Headers: { Authorization: "Bearer eyJhbGciOi..." }
```

### **8. Backend valida el token**
```typescript
// Endpoints protegidos con @UseGuards(JwtAuthGuard)
// Passport-JWT verifica el token automáticamente

@Post()
@UseGuards(JwtAuthGuard)  // ← Valida token
async create(
  @CurrentUser() user: any,  // ← Usuario inyectado
  @Body() data: any
) {
  // user = { userId: "uuid", username: "nombre" }
  // Playlist se crea asociada al userId
}
```

---

## ✅ Lo que YA está implementado:

### **Backend:**
- ✅ Google OAuth configurado
- ✅ JWT generación y validación
- ✅ JwtAuthGuard activado en endpoints
- ✅ Decorador @CurrentUser
- ✅ Endpoint /auth/me
- ✅ Todos los endpoints de playlists protegidos

### **vibraFront (Landing):**
- ✅ LoginModal con Google OAuth
- ✅ Guarda token en localStorage
- ✅ **NUEVO**: Redirige a vibraApp después del login

### **vibraApp (App Principal):**
- ✅ **NUEVO**: Axios interceptor que agrega token automáticamente
- ✅ Todas las peticiones ahora son autenticadas

---

## 🧪 Cómo Probar:

### **Paso 1: Levantar todos los servicios**

```bash
# Terminal 1 - Backend
cd /home/crigca/vibra/back/api
npm run start:dev

# Terminal 2 - Landing (vibraFront)
cd /home/crigca/vibra/front/vibraFront
npm run dev

# Terminal 3 - App Principal (vibraApp)
cd /home/crigca/vibra/front/vibraApp
npm run dev
```

### **Paso 2: Probar el flujo completo**

1. **Abrir navegador** → `http://localhost:5173` (Landing)
2. **Click en "Iniciar Sesión"**
3. **Click en "Sign in with Google"**
4. **Seleccionar cuenta de Google**
5. **Automáticamente redirige** → `http://localhost:5174` (vibraApp)
6. **Crear una playlist** → Debería funcionar con autenticación

### **Paso 3: Verificar en DevTools**

```js
// Abrir Console en http://localhost:5174

// Ver el token guardado
localStorage.getItem('token_vibra')

// Hacer una petición de prueba
fetch('http://localhost:3000/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token_vibra')}`
  }
}).then(r => r.json()).then(console.log)

// Debería mostrar: { userId: "...", username: "...", email: "..." }
```

---

## 🔍 Qué endpoints están protegidos:

### 🔓 **Públicos** (sin token):
```
GET  /playlists           - Ver todas las playlists
GET  /playlists/:id       - Ver una playlist
GET  /music/songs         - Ver canciones
```

### 🔒 **Protegidos** (requieren token):
```
POST   /playlists                    - Crear playlist
PUT    /playlists/:id                - Editar playlist
DELETE /playlists/:id                - Borrar playlist
POST   /playlists/:id/songs          - Agregar canción
DELETE /playlists/:id/songs/:songId  - Quitar canción
PATCH  /playlists/:id/songs/reorder  - Reordenar
```

---

## ❌ Problemas comunes:

### **Error 401 Unauthorized**
**Causa**: Token no está siendo enviado o es inválido

**Solución**:
```js
// Verificar que el token existe
console.log(localStorage.getItem('token_vibra'));

// Si no existe, hacer login de nuevo
```

### **Redirige pero no está autenticado**
**Causa**: Token no se guardó correctamente

**Solución**:
- Verificar que vibraFront hizo login correctamente
- Verificar que se ejecutó `localStorage.setItem("token_vibra", data.token)`

### **vibraApp no incluye el token**
**Causa**: Interceptor de axios no se ejecutó

**Solución**:
- Verificar que `playlistsService.ts` se importa antes de hacer peticiones
- El interceptor se ejecuta cuando se importa el archivo

---

## 🎯 Resultado Final:

```
Usuario → Landing → Login Google → Token guardado →
Redirige a App → App usa token → Backend valida → ✅ Autenticado
```

Todo está conectado y funcionando! 🎉
