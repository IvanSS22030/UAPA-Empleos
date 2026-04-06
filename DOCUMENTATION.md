# UAPA Empleos — Documentación del Proyecto

**Proyecto Final | Programación 3**  
**Universidad Abierta para Adultos (UAPA)**  

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Nuevas Funcionalidades y Ecosistema](#2-nuevas-funcionalidades-y-ecosistema)
3. [Tecnologías Utilizadas](#3-tecnologías-utilizadas)
4. [Base de Datos y Esquema Dinámico](#4-base-de-datos-y-esquema-dinámico)
5. [Autenticación y Perfiles Avanzados](#5-autenticación-y-perfiles-avanzados)
6. [Red Social y Chat en Tiempo Real](#6-red-social-y-chat-en-tiempo-real)
7. [Búsqueda y Flujo de Empleos](#7-búsqueda-y-flujo-de-empleos)
8. [Variables de Entorno y Seguridad](#8-variables-de-entorno-y-seguridad)
9. [Comandos de Desarrollo](#9-comandos-de-desarrollo)

---

## 1. Descripción General

**UAPA Empleos** es una plataforma web de bolsa de empleo y red profesional desarrollada como Proyecto Final de la asignatura Programación 3. Evolucionó de ser un simple portal de empleos estáticos a convertirse en una **red interactiva estilo LinkedIn**, conectando talentos con reclutadores en tiempo real. 

La plataforma está integrada con la identidad visual oficial de UAPA:
- **Deep Cove Blue** `#041147`
- **Ecstasy Orange** `#FD7E14`
- **Gold Sand** `#E8C598`

## 2. Nuevas Funcionalidades y Ecosistema

En las últimas iteraciones el proyecto incorporó capacidades de red social y aplicaciones en tiempo real:
- **Modo SSR / Híbrido en Astro:** Para renderizar perfiles y empleos de forma totalmente dinámica.
- **Perfiles Avanzados:** Avatares, habilidades (tags), idiomas, biografía.
- **Sistema de Red y Conexiones:** Posibilidad de hacer "Match" o conectar 1 a 1 con otros usuarios con sistema de notificaciones de campana.
- **Chat Estilo LinkedIn:** Widget de chat flotante que notifica y recibe mensajes en tiempo real (Supabase Realtime) exclusivo para conexiones 1-on-1.
- **"Apply with Profile":** Permitir al talento aplicar a trabajos con solo un clic usando sus datos y *skills* sin PDF obligatorio.
- **Dashboard de Reclutadores:** Creación de empleos directos a Postgres ignorando el Markdown, habilitando empleos remotos, pasantías y búsquedas complejas.

## 3. Tecnologías Utilizadas

| Tecnología | Propósito |
|---|---|
| **Astro (^5)** | Framework web principal (Híbrido SSR/SSG dinámico) |
| **React (^19)** | Componentes interactivos y client-side widgets |
| **Tailwind CSS (^4)** | Estilizado con paleta UAPA integrada nativamente vía config |
| **Supabase** | Base de datos PostgreSQL, Auth, Realtime, y Storage (Avatares y PDFs de CVs) |
| **Pagefind** | Indexación estática combinada en el cliente con consultas live de DB |

---

## 4. Base de Datos y Esquema Dinámico

La arquitectura está alojada en **Supabase** (PostgreSQL) y asegurada con permisos de Nivel de Fila (RLS - Row Level Security). 

### `profiles` (Actualizada)
Vinculada a `auth.users`, ahora incluye: `avatar_url`, `headline`, `bio`, `phone`, `location`, `skills` (JSON array), `languages` (JSON array).

### `jobs` (Migración a DB Relacional)
Migrado de Markdown plano (`.md`) a la tabla, lo que permite consultas directas, fechas de expiración dinámicas y permisos CRUD otorgados solo a roles `recruiter`.

### `connections` y `notifications`
Gestionan el estado bidireccional (`Pending`, `Accepted`, `Rejected`) de las relaciones de trabajo para dictaminar qué usuarios pueden interactuar o chatear entre sí. El envío de conexión genera un evento de notificación captado por websockets.

### `conversations` y `chat_messages`
Modelo de datos para la mensajería instantánea del proyecto. 

---

## 5. Autenticación y Perfiles Avanzados

- **Supabase Auth:** Email y contraseña nativo.
- **Flujo de Recuperación (Reset Password):** Soporte activo de correos "¿Olvidaste tu contraseña?" que redirigen segurizados a `/update-password`.
- **Visibilidad Oculta en Auth:** Header (`Layout.astro`) verifica si la sesión está activa y esconde botones de "Registrarse/Login".
- **Privacidad "Empty State":** La función "PeopleSearch" (Red de personas) arroja listas vacías de inicio para evitar web scraping si el usuario no teclea algo.

## 6. Red Social y Chat en Tiempo Real

- **`ConnectButton.tsx`**: Componente presente en los perfiles `/[user_id]` y en listas de sugerencias. 
- **`NotificationBell.tsx`**: Campana situada en el header conectada vía realtime, avisa cuando una invitación es aceptada.
- **`ChatWidget.tsx`**: Situado en el scope global (`Layout.astro`). Solo carga conversaciones de la tabla validadas por las conexiones aprobadas, con diseño desplegable inferior derecho.

## 7. Búsqueda y Flujo de Empleos

- **Global Job Search**: Presente en `/jobs`, hace un híbrido: lee el index pregenerado (Pagefind) y el canal Realtime de nuevos posts de la DB. Deduplica URLs y formatea la UI.
- **Filtros Avanzados Dinámicos**: Incluye estado de Trabajo (Remoto, Presencial, Híbrido), estado de Contrato (Pasantía vs Contratación D.) basados en los datos del string de Postgres.

---

## 8. Variables de Entorno y Seguridad (.env)

En proyectos modernos de desarrollo **NUNCA DEBES SUBIR TUS SECRETOS DE `.env` A GITHUB**. 
Por eso, hemos configurado el `.gitignore` para bloquear `.env`. 

Si clonas este repositorio, debes crear tu archivo `.env` basado en `.env.example`:

```env
PUBLIC_SUPABASE_URL="https://...supabase.co"
PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."  # Superadmin Key: Mantenla oculta siempre.
```

## 9. Comandos de Desarrollo

| Comando | Acción |
|---|---|
| `pnpm install` | Instala todas las dependencias del proyecto |
| `pnpm dev` | Inicia el servidor de desarrollo local |
| `pnpm build` | Compila el sitio (produciendo HTML y páginas de SSR) |
