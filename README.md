# UAPA Empleos — Proyecto Final Programación 3

Plataforma web de bolsa de empleo y red profesional desarrollada para conectar talento con oportunidades laborales, utilizando la identidad visual oficial de UAPA.

## 🚀 Características Principales

*   **Búsqueda Global e Inteligente:** Búsqueda híbrida (estática Ultrarrápida con Pagefind + tiempo real con Supabase Text Search). Filtros avanzados (Remoto, Pasantía, Ubicación).
*   **Red Profesional y Conexiones:** Sistema de conexiones 1 a 1 al estilo LinkedIn (Pendiente, Aceptar, Conectado) con notificaciones en tiempo real.
*   **Chat en Tiempo Real:** Chat directo de usuario a usuario (sólo conexiones aprobadas) con un widget global estilo chat de red social.
*   **Perfiles Avanzados:** Subida de Avatares (Supabase Storage), Titular (Headline), Biografía, habilidades (skills) e idiomas tipo etiqueta.
*   **Reclutamiento Dinámico:** Publicación y gestión de empleos directamente hacia la base de datos PostgreSQL, sin compilación estática forzada.
*   **Postulación Ultrarrápida:** "Apply with Profile" permite a los usuarios con perfiles completos postularse sin necesidad de cargar de nuevo un PDF.
*   **Autenticación y Seguridad:** Integrado con Supabase Auth. Recuperación de contraseña por email y modo dinámico (SSR) en Astro para las protecciones de rutas.

## 🧞 Stack Tecnológico

*   **Frontend:** Astro 5 (SSR Hybrid Mode) + React 19 + Tailwind CSS 4
*   **Backend & Auth:** Supabase (PostgreSQL, Auth, Storage)
*   **Búsqueda Rápida:** Pagefind

## 📂 Comandos de Desarrollo

| Comando | Acción |
| :--- | :--- |
| `pnpm install` | Instala las dependencias del proyecto |
| `pnpm dev` | Inicia el servidor de desarrollo local en `localhost:4321` |
| `pnpm build` | Compila tu sitio de producción y rutas del lado del servidor hacia `./dist/` |

## ⚙️ Archivos que NO se suben a GitHub (.gitignore)

Tu proyecto cuenta con un archivo `.gitignore` que evita que subas contraseñas a GitHub accidentalmente. **Nunca subas tu archivo `.env`**. Puedes basarte en el archivo `.env.example` para saber qué variables necesitas:

```env
PUBLIC_SUPABASE_URL="https://tu_proyecto.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="tu_anon_key"
SUPABASE_SERVICE_ROLE_KEY="tu_secret_key_no_compartir"
```
