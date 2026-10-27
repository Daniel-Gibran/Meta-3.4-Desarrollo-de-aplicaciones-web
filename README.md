# Meta 3.4 — Autorización de servicios (avance 1)

Avance mínimo de la aplicación de **jugadores y rosters** con:

- **Backend** (Node.js + Express + Sequelize + MySQL) con login por
  credenciales, **JWT en cookie HttpOnly**, **token CSRF** y autorización por
  rol.
- **Frontend** (Vue 3 + Vuetify + TypeScript) con pantalla de login y panel
  **Admin** para listar y crear jugadores.

El objetivo de este avance no es cubrir toda la meta, sino tener una rebanada
vertical funcionando de punta a punta: iniciar sesión, entrar al panel,
consumir la API con cookies y demostrar que una escritura sin token CSRF se
rechaza.

---

## 1. Qué se puede probar

| Acción | Resultado esperado |
|--------|--------------------|
| Entrar a `http://localhost:5173` sin sesión | Redirige a `/login` |
| Login con la cuenta Admin | Entra al panel y lista los jugadores |
| Crear un jugador | Se guarda y aparece en la tabla |
| Cerrar sesión | Vuelve al login y las cookies se eliminan |
| Login con la cuenta Público | El panel la rechaza (no tiene rol Admin) |
| `POST /api/v1/jugadores` sin sesión | `401 Unauthorized` |
| `POST` con sesión pero sin `x-csrf-token` | `403 Forbidden` |
| `POST` con sesión y token CSRF | `201 Created` |

### Cuentas de prueba

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Admin | `admin@esports.local` | `Admin123!` |
| Público | `publico@esports.local` | `Publico123!` |

---

## 2. Estructura

```text
Meta3.4/
├── backend/
│   ├── src/
│   │   ├── controllers/auth.controller.js   # login, logout, me
│   │   ├── services/auth.service.js         # validación de credenciales
│   │   ├── middlewares/auth.middleware.js   # JWT + CSRF + rol Admin
│   │   ├── routes/auth.routes.js            # /api/v1/auth
│   │   ├── models/usuario.model.js
│   │   └── ... (código de jugadores y rosters de Meta 3.2)
│   ├── migrations/20261027090000-create-usuarios.js
│   ├── seeders/20261027100000-datos-usuarios.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── services/api.ts                  # axios + cookie CSRF
    │   ├── services/auth.ts
    │   ├── stores/auth.ts                   # estado de sesión
    │   ├── router/index.ts                  # guard de Admin
    │   └── views/
    │       ├── LoginView.vue
    │       └── admin/
    │           ├── AdminLayout.vue
    │           └── JugadoresView.vue
    └── .env.example
```

---

## 3. Cómo ejecutarlo

### Requisitos

- Node.js 18+
- MySQL 8 con la base `esports` de Meta 3.2 (usuario `esports_user`)

### Backend

```bash
cd backend
npm install
cp .env.example .env     # en PowerShell: Copy-Item .env.example .env
npm run migrate
npm run seed             # solo la primera vez; crea usuarios y datos de ejemplo
npm run dev
```

> Si la base `esports` ya tiene los jugadores de Meta 3.2, `npm run seed`
> fallará por los nicknames duplicados. En ese caso ejecuta solo el seeder de
> usuarios:
>
> ```bash
> npx sequelize-cli db:seed --seed 20261027100000-datos-usuarios.js
> ```

El backend queda en `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

El frontend queda en `http://localhost:5173`.

---

## 4. Cómo funciona la seguridad

### 4.1 Login y cookies

```text
POST /api/v1/auth/login  { email, password }
        │
        ▼
  bcrypt.compare(password, password_hash)
        │
        ├── cookie jwt_token   → HttpOnly, SameSite=Strict
        └── cookie csrf_token  → legible por JavaScript
        │
        ▼
  { usuario, csrfToken }
```

- El **JWT** viaja en una cookie `HttpOnly`: JavaScript no puede leerlo, así
  que un XSS no puede robarlo.
- El **token CSRF** viaja en una cookie normal y también dentro del JWT. El
  frontend lo lee de la cookie y lo copia a la cabecera `x-csrf-token`.

### 4.2 Escrituras protegidas

```text
POST /api/v1/jugadores
  Cookie: jwt_token=...
  x-csrf-token: ...

        │
        ▼
  autenticar()
    1. verifica la firma y vigencia del JWT
    2. compara el header x-csrf-token con el token guardado en el JWT
        │
        ▼
  soloAdmin()
    3. exige rol === 'admin'
        │
        ▼
  controlador → service → MySQL
```

¿Por qué funciona contra CSRF? Otro sitio puede hacer que el navegador envíe
la cookie `jwt_token`, pero **no puede leer** la cookie `csrf_token` ni el
cuerpo del JWT por la política de mismo origen, así que no puede construir la
cabecera correcta.

### 4.3 CORS con credenciales

El backend usa:

```js
cors({
  origin: process.env.CLIENT_URL, // http://localhost:5173
  credentials: true,
})
```

Con cookies no se puede usar `origin: '*'`. El frontend usa
`withCredentials: true` en axios para enviar y recibir las cookies.

### 4.4 Matriz de permisos

| Operación | Público | Admin |
|-----------|:-------:|:-----:|
| `GET` jugadores / rosters | Sí | Sí |
| `POST`, `PUT`, `DELETE` | No | Sí |

La lectura quedó pública para conservar el comportamiento de Meta 3.2. Las
escrituras están protegidas en `jugadores`, `rosters` y `asignaciones`.

---

## 5. Endpoints de autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | Valida credenciales y crea las cookies |
| `POST` | `/api/v1/auth/logout` | Elimina las cookies (requiere JWT + CSRF) |
| `GET` | `/api/v1/auth/me` | Devuelve el usuario de la sesión |

### Prueba rápida con curl

```bash
# Login y guardar cookies
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@esports.local\",\"password\":\"Admin123!\"}"

# Sin CSRF → 403
curl -b cookies.txt -X POST http://localhost:3000/api/v1/jugadores \
  -H "Content-Type: application/json" \
  -d "{\"nickname\":\"Prueba\",\"rol\":\"Mid\"}"

# Con CSRF (usa el csrfToken que devolvió el login) → 201
curl -b cookies.txt -X POST http://localhost:3000/api/v1/jugadores \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: TOKEN_AQUI" \
  -d "{\"nickname\":\"Prueba\",\"rol\":\"Mid\"}"
```

---

## 6. Decisiones de este avance

- **Se reutiliza el backend de Meta 3.2** en lugar de reescribirlo. Se agregó
  el módulo de autenticación y se protegieron las rutas de escritura.
- **No se usa API key en el login** como en el ejemplo de Meta 3.3. Una API
  key dentro de una aplicación web pública no es secreta: cualquiera puede
  verla en el bundle. Las credenciales de usuario la sustituyen.
- **Sin Pinia ni librería de estado**: un módulo con `ref` es suficiente para
  este alcance.
- **`SameSite=Strict`** en las cookies. En desarrollo, `localhost:5173` y
  `localhost:3000` cuentan como el mismo sitio, así que las cookies viajan
  correctamente.

---

## 7. Pendientes para completar la Meta 3.4

- [ ] CRUD completo de rosters y asignaciones en el panel Admin.
- [ ] Editar y eliminar jugadores desde el frontend.
- [ ] Pantalla o modo de solo lectura para el rol Público.
- [ ] Actualizar la documentación OpenAPI con los endpoints de auth.
- [ ] Pruebas automatizadas del flujo de autenticación y CSRF.
- [ ] Publicar el repositorio en GitHub (backend + frontend).
- [ ] Variables de entorno de producción, HTTPS y `secure: true` en cookies.
