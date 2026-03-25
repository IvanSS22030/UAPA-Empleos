# UAPA Empleos — Documentación del Proyecto

**Proyecto Final | Programación 3**  
**Universidad Abierta para Adultos (UAPA)**  
**Fecha:** Marzo 2026

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Tecnologías Utilizadas](#2-tecnologías-utilizadas)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Base de Datos](#4-base-de-datos)
5. [Autenticación y Roles de Usuario](#5-autenticación-y-roles-de-usuario)
6. [Páginas y Rutas](#6-páginas-y-rutas)
7. [Componentes React](#7-componentes-react)
8. [Acciones del Servidor](#8-acciones-del-servidor)
9. [Internacionalización (i18n)](#9-internacionalización-i18n)
10. [Sistema de Búsqueda Híbrida](#10-sistema-de-búsqueda-híbrida)
11. [Almacenamiento de Archivos](#11-almacenamiento-de-archivos)
12. [Variables de Entorno](#12-variables-de-entorno)
13. [Comandos de Desarrollo](#13-comandos-de-desarrollo)
14. [Flujo de Uso del Sistema](#14-flujo-de-uso-del-sistema)

---

## 1. Descripción General

**UAPA Empleos** es una plataforma web de bolsa de empleo desarrollada como Proyecto Final de la asignatura Programación 3. El sistema conecta a candidatos (talentos) con reclutadores, permitiendo publicar vacantes, buscar empleos y gestionar postulaciones con carga de currículum.

La plataforma está completamente integrada con la identidad visual oficial de UAPA, utilizando los colores institucionales:
- **Deep Cove Blue** `#041147` — fondo del header y footer.
- **Ecstasy Orange** `#FD7E14` — botones y acentos interactivos.
- **Gold Sand** `#E8C598` — bordes y detalles decorativos.

---

## 2. Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|---|---|---|
| [Astro](https://astro.build) | ^5.17.1 | Framework web principal (SSG + SSR) |
| [React](https://react.dev) | ^19.2.4 | Componentes interactivos en el cliente |
| [Tailwind CSS](https://tailwindcss.com) | ^4.2.1 | Estilos utilitarios |
| [Supabase](https://supabase.com) | ^2.98.0 | Base de datos PostgreSQL, Auth y Storage |
| [Pagefind](https://pagefind.app) | ^1.4.0 | Búsqueda estática ultrarrápida sobre el build |
| TypeScript | Incluido con Astro | Tipado estático en todo el proyecto |
| pnpm | — | Gestor de paquetes |

### Stack resumido

```
Frontend (Astro + React) → Supabase (PostgreSQL + Auth + Storage) → Pagefind (búsqueda estática)
```

---

## 3. Estructura del Proyecto

```
Proyecto Final/
├── public/                       # Activos estáticos (favicon, imágenes públicas)
├── src/
│   ├── actions/
│   │   └── index.ts              # Acciones del servidor (createProfile, applyToJob)
│   ├── components/
│   │   ├── ApplicationForm.tsx   # Formulario de postulación a empleos
│   │   ├── InteractiveAppStatus.tsx # Estado interactivo de la postulación
│   │   ├── LoginForm.tsx         # Formulario de inicio de sesión
│   │   ├── SearchBar.tsx         # Barra de búsqueda híbrida (Pagefind + Supabase)
│   │   └── SignupForm.tsx        # Formulario de registro de usuario
│   ├── content/
│   │   └── jobs/                 # Empleos estáticos en formato Markdown (.md)
│   │       └── junior-react-developer.md
│   ├── i18n/
│   │   └── ui.ts                 # Textos en Español e Inglés + helpers de traducción
│   ├── layouts/
│   │   └── Layout.astro          # Layout principal con header y footer de UAPA
│   ├── lib/
│   │   └── supabase.ts           # Cliente Supabase para el lado del cliente
│   ├── pages/
│   │   ├── index.astro           # Página principal (Español)
│   │   ├── login.astro           # Página de inicio de sesión
│   │   ├── signup.astro          # Página de registro
│   │   ├── jobs/
│   │   │   └── [...slug].astro   # Página dinámica de detalle de empleo
│   │   ├── application/          # Flujo de postulación
│   │   └── en/                   # Espejo en Inglés de todas las páginas
│   ├── styles/
│   │   └── global.css            # Estilos globales y tokens de color UAPA
│   ├── content.config.ts         # Esquema de la colección de empleos estáticos
│   └── middleware.ts             # Redirección automática por idioma del navegador
├── supabase_setup.sql            # Script SQL: tablas jobs, applications, messages
├── supabase_auth_setup.sql       # Script SQL: tabla profiles + políticas RLS
├── astro.config.mjs              # Configuración de Astro (integraciones)
├── tailwind.config.mjs           # Configuración de Tailwind CSS v4
├── tsconfig.json                 # Configuración de TypeScript
└── package.json                  # Dependencias y scripts del proyecto
```

---

## 4. Base de Datos

La base de datos está alojada en **Supabase (PostgreSQL)**. Se compone de 4 tablas principales.

### 4.1 Tabla `profiles`

Vinculada a `auth.users` de Supabase. Almacena datos adicionales del usuario.

```sql
CREATE TABLE public.profiles (
  id        UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role      TEXT NOT NULL CHECK (role IN ('talent', 'recruiter')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria, referencia a `auth.users` |
| `role` | TEXT | Rol del usuario: `talent` o `recruiter` |
| `full_name` | TEXT | Nombre completo del usuario |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

### 4.2 Tabla `jobs`

Almacena las ofertas de empleo dinámicas publicadas desde la base de datos.

```sql
CREATE TABLE jobs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  company     TEXT NOT NULL,
  location    TEXT,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  fts         tsvector GENERATED ALWAYS AS (
                to_tsvector('english', title || ' ' || company || ' ' || description)
              ) STORED
);
CREATE INDEX jobs_fts_idx ON jobs USING GIN (fts);
```

> La columna `fts` es un vector generado automáticamente que habilita **búsqueda de texto completo** de alto rendimiento.

### 4.3 Tabla `applications`

Registra cada postulación enviada a un empleo.

```sql
CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_name  TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  resume_url      TEXT NOT NULL,
  status          TEXT DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

| Columna | Tipo | Descripción |
|---|---|---|
| `job_id` | UUID | Referencia al empleo al que se postuló |
| `applicant_name` | TEXT | Nombre del candidato |
| `applicant_email` | TEXT | Correo del candidato |
| `resume_url` | TEXT | URL pública del currículum subido a Supabase Storage |
| `status` | TEXT | Estado: `pending`, `reviewed`, `accepted`, `rejected` |

### 4.4 Tabla `messages`

Sistema de mensajería entre reclutador y talento a través de una postulación.

```sql
CREATE TABLE messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  sender_role    TEXT NOT NULL,  -- 'recruiter' o 'talent'
  content        TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 Diagrama Entidad-Relación (MER)

```
auth.users (Supabase)
    │
    └── profiles (1:1)
            role: 'talent' | 'recruiter'

jobs
    │
    └── applications (1:N)
            │
            └── messages (1:N)

storage.buckets.resumes ←── applications.resume_url
```

---

## 5. Autenticación y Roles de Usuario

La autenticación es gestionada por **Supabase Auth** (correo + contraseña).

### Roles del sistema

| Rol | Descripción |
|---|---|
| `talent` | Candidato que busca empleo y puede postularse a vacantes. |
| `recruiter` | Reclutador que publica vacantes y gestiona postulaciones. |

### Políticas de Seguridad (Row Level Security — RLS)

La tabla `profiles` tiene RLS habilitado con las siguientes políticas:

- **SELECT**: Público — todos pueden ver los perfiles.
- **INSERT**: Solo el propio usuario puede crear su perfil (`auth.uid() = id`).
- **UPDATE**: Solo el propio usuario puede editar su perfil.

### Flujo de registro

1. El usuario se registra con correo, contraseña, nombre completo y rol.
2. Supabase Auth crea el usuario en `auth.users`.
3. La acción del servidor `createProfile` inserta el registro en `profiles` con el UUID del usuario.

---

## 6. Páginas y Rutas

El proyecto soporta **dos idiomas** (Español por defecto, Inglés con prefijo `/en/`). El middleware detecta automáticamente el idioma del navegador.

| Ruta (ES) | Ruta (EN) | Descripción |
|---|---|---|
| `/` | `/en/` | Página principal con hero, búsqueda y listado de empleos estáticos |
| `/jobs/[slug]` | `/en/jobs/[slug]` | Detalle de un empleo estático (desde Markdown) |
| `/login` | `/en/login` | Inicio de sesión |
| `/signup` | `/en/signup` | Registro de cuenta nueva |
| `/application/...` | `/en/application/...` | Flujo de postulación a un empleo |

### Redirección automática por idioma

El archivo `src/middleware.ts` intercepta la ruta `/` y redirige a `/en` si el navegador del usuario prefiere el inglés:

```typescript
if (url.pathname === '/' && acceptLang?.toLowerCase().startsWith('en')) {
  return redirect('/en', 302);
}
```

---

## 7. Componentes React

Los componentes interactivos están construidos con **React 19** y se montan en el cliente usando la directiva `client:load` de Astro.

### `SearchBar.tsx`
Barra de búsqueda con **motor híbrido**. Combina dos fuentes:
1. **Pagefind** — índice estático generado durante el build, extremadamente rápido.
2. **Supabase Full-Text Search** — consulta en tiempo real para empleos añadidos después del último build.

Los resultados se deduplican por URL y se muestran con una etiqueta indicando su fuente (`Estático` / `En Vivo`).

### `LoginForm.tsx`
Formulario de inicio de sesión que usa `supabase.auth.signInWithPassword()`. Redirige al dashboard tras la autenticación exitosa.

### `SignupForm.tsx`
Formulario de registro que:
1. Llama a `supabase.auth.signUp()` para crear el usuario en Auth.
2. Invoca la acción del servidor `createProfile` para guardar nombre y rol en la tabla `profiles`.

### `ApplicationForm.tsx`
Formulario de postulación que:
1. Acepta nombre, correo y archivo de currículum (PDF).
2. Envía los datos a la acción del servidor `applyToJob`.
3. Muestra retroalimentación del estado de la postulación.

### `InteractiveAppStatus.tsx`
Componente que muestra el estado actual de una postulación en tiempo real (`pending`, `reviewed`, `accepted`, `rejected`).

---

## 8. Acciones del Servidor

Las acciones se definen en `src/actions/index.ts` usando el sistema de **Astro Actions** con validación de esquema mediante `zod`.

### `createProfile`

Crea el registro de perfil del usuario en la tabla `profiles`. Usa el cliente **admin** (con Service Role Key) para eludir RLS en el momento del registro.

**Input:**
```typescript
{
  id: string;       // UUID del usuario de Supabase Auth
  role: 'talent' | 'recruiter';
  fullName: string;
}
```

### `applyToJob`

Procesa una postulación completa en dos pasos:

1. **Sube el currículum** al bucket `resumes` de Supabase Storage con un nombre único (`UUID.extension`), organizado en carpetas por `job_id`.
2. **Crea el registro** en la tabla `applications` con todos los datos del candidato y la URL pública del currículum.

**Input (formulario multipart):**
```typescript
{
  jobId: string;
  applicantName: string;  // mínimo 2 caracteres
  applicantEmail: string; // debe ser email válido
  resume: File;           // archivo binario
}
```

---

## 9. Internacionalización (i18n)

Implementado de forma manual en `src/i18n/ui.ts` sin librerías externas.

- **Idioma por defecto:** Español (`es`)
- **Idiomas soportados:** Español (`es`), Inglés (`en`)

### Cómo funciona

```typescript
// Obtener el idioma desde la URL
const lang = getLangFromUrl(Astro.url);

// Obtener la función de traducción
const t = useTranslations(lang);

// Usar una clave de traducción
t('hero.title') // → "Descubre tu próximo gran paso profesional" (en ES)
                // → "Discover Your Next Big Career Move" (en EN)
```

### Claves de traducción disponibles

| Clave | ES | EN |
|---|---|---|
| `nav.jobs` | Empleos | Jobs |
| `hero.title` | Descubre tu próximo gran paso profesional | Discover Your Next Big Career Move |
| `search.button` | Buscar | Search |
| `auth.role.talent` | Talento (Busco empleo) | Talent (Looking for jobs) |
| `auth.role.recruiter` | Reclutador (Ofrezco empleo) | Recruiter (Hiring talent) |

---

## 10. Sistema de Búsqueda Híbrida

Una de las características más avanzadas del proyecto. Combina dos motores de búsqueda:

```
Usuario escribe → SearchBar.tsx
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
     Pagefind              Supabase FTS
  (index estático)     (base de datos live)
  Resultados rápidos   Resultados en tiempo real
          │                     │
          └──────────┬──────────┘
                     ▼
           Deduplicación por URL
                     │
                     ▼
          Lista combinada de resultados
```

- **Pagefind** se inicializa cargando `/pagefind/pagefind.js` desde el build. Solo está disponible en producción (`pnpm build`).
- **Supabase FTS** usa la columna `fts` con `GIN index` para búsquedas de texto completo en tiempo real.

---

## 11. Almacenamiento de Archivos

Los currículums se almacenan en el bucket **`resumes`** de Supabase Storage.

- **Visibilidad:** El bucket es privado (`public: false`).
- **Política:** Se permite inserción de archivos anónimos (configurable).
- **Organización:** `resumes/{job_id}/{uuid}.{extension}`
- **Realtime:** Las tablas `applications` y `messages` tienen habilitada la publicación en tiempo real.

---

## 12. Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

| Variable | Visibilidad | Descripción |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | Pública (cliente) | URL de tu proyecto en Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Pública (cliente) | Clave anónima para operaciones de cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | **Privada (servidor)** | Clave de admin para eludir RLS en acciones del servidor |

> ⚠️ **Importante:** `SUPABASE_SERVICE_ROLE_KEY` nunca debe exponerse en el cliente. Solo se usa en `src/actions/index.ts`.

---

## 13. Comandos de Desarrollo

| Comando | Acción |
|---|---|
| `pnpm install` | Instala todas las dependencias del proyecto |
| `pnpm dev` | Inicia el servidor de desarrollo en `localhost:4321` |
| `pnpm build` | Compila el sitio a `./dist/` y genera el índice de Pagefind |
| `pnpm preview` | Previsualiza el build localmente antes de desplegar |
| `pnpm astro add [integration]` | Añade una integración a Astro |

### Configuración de la Base de Datos

Ejecutar los siguientes scripts SQL en el editor SQL de Supabase en este orden:

```bash
# 1. Crear tablas principales
supabase_setup.sql

# 2. Crear tabla de perfiles y políticas RLS
supabase_auth_setup.sql
```

---

## 14. Flujo de Uso del Sistema

### Candidato (Talent)

```
1. Accede a la página principal (/)
2. Usa la barra de búsqueda para encontrar empleos
3. Hace clic en una oferta → ve el detalle del empleo
4. Se registra como "Talento" en /signup
5. Va a la página de la oferta → hace clic en "Aplicar"
6. Completa el formulario de postulación con su CV
7. El sistema sube el CV a Supabase Storage
8. Se crea el registro en la tabla `applications`
9. Puede seguir el estado de su postulación
```

### Reclutador (Recruiter)

```
1. Se registra como "Reclutador" en /signup
2. Publica empleos (directamente en la base de datos o via panel)
3. Visualiza las postulaciones recibidas en `applications`
4. Cambia el estado: pending → reviewed → accepted/rejected
5. Puede comunicarse con el candidato via la tabla `messages`
```

---

## Créditos

| | |
|---|---|
| **Institución** | Universidad Abierta para Adultos (UAPA) |
| **Asignatura** | Programación 3 |
| **Tipo** | Proyecto Final |
| **Tecnología principal** | Astro 5 + Supabase |
| **Año** | 2026 |

---

*Documentación generada para el Proyecto Final de Programación 3 — UAPA Empleos.*
