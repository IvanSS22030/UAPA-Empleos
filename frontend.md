# Frontend Architecture Context - UAPA Empleos

This document provides a comprehensive overview of the current frontend architecture of the UAPA Empleos project. It is intended to serve as context for any agent or developer tasked with designing, extending, or refactoring the frontend.

## 1. Tech Stack Overview
- **Core Framework:** Astro (^5.17.1) - Used for Static Site Generation (SSG) and Server-Side Rendering (SSR).
- **UI Library:** React (^19.2.4) - Used exclusively for highly interactive client-side components.
- **Styling:** Tailwind CSS (^4.2.1) - Used for utility-first styling.
- **Search:** Pagefind (^1.4.0) - For lightning-fast static search, combined with Supabase Full-Text Search for real-time data.
- **Backend/BaaS:** Supabase (^2.98.0) - Handles Authentication, PostgreSQL Database, and Storage.

## 2. Project Structure
The frontend code is primarily located in the `src/` directory:

- `src/layouts/Layout.astro`: The main layout wrapper containing the UAPA branding header and footer.
- `src/pages/`: File-system based routing using Astro.
  - `index.astro`: Main landing page.
  - `login.astro` & `signup.astro`: Authentication pages.
  - `jobs/[slug].astro`: Dynamic routing for job detail pages.
  - `application/`: Pages related to the job application flow.
  - `en/`: Mirrored directory for English internationalization.
- `src/components/`: React components (e.g., `SearchBar.tsx`, `LoginForm.tsx`, `SignupForm.tsx`, `ApplicationForm.tsx`, `InteractiveAppStatus.tsx`). These are mounted using Astro's `client:load` or similar directives.
- `src/actions/`: Contains Astro server actions (`createProfile`, `applyToJob`) that interact with Supabase securely on the server side.
- `src/i18n/`: Contains manual internationalization configuration (`ui.ts`).
- `src/lib/`: Contains the Supabase client setup.
- `src/styles/`: Contains global CSS, specifically extending Tailwind tokens.

## 3. Design System & Branding
The project follows the official **Universidad Abierta para Adultos (UAPA)** branding. The custom color palette is defined in `tailwind.config.mjs`:

- **Deep Cove Blue (`uapa-blue`):** `#041147` - Used for headers, footers, and primary dark backgrounds.
- **Ecstasy Orange (`uapa-orange`):** `#ff8300` - Used for primary call-to-action buttons and interactive highlights.
- **Gold Sand (`uapa-sand`):** `#E8C598` - Used for secondary borders, accents, and decorative elements.

*Design principles:*
- Use Astro elements for static content (SEO-friendly, zero JS).
- Use React only when state management or interactivity is required.

## 4. State Management & Data Fetching
- **Global State:** The project currently does not rely on heavy global state managers like Redux or Zustand. State is localized within React components.
- **Data Fetching:**
  - Static data (Markdown jobs) is fetched at build time using Astro content collections (`src/content.config.ts`).
  - Dynamic data and mutations are handled via Astro Actions (`src/actions/index.ts`) for secure server-side operations, or directly via the Supabase client for real-time subscriptions.

## 5. Key Interactive Components
- `SearchBar.tsx`: A hybrid search component that queries both the static Pagefind index and the live Supabase database, deduplicating results on the fly.
- `ApplicationForm.tsx`: Handles multipart form data, uploading resumes to Supabase Storage before persisting the application record.
- Authentication Forms (`LoginForm.tsx`, `SignupForm.tsx`): Interfaces with Supabase Auth and triggers server actions to sync user profiles.
