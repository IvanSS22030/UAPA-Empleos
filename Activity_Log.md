# Activity Log

## [Current Date]
- **Bug Fixed:** Buttons were invisible (white text on white background) because custom Universidad UAPA colors (`uapa-blue`, `uapa-orange`, `uapa-gold`, `uapa-sand`) were applied in class names but missing from the Tailwind 4 `@theme` configuration in `src/styles/global.css`.
- **Approach Taken:** Added the missing hex colors directly to `global.css` under `@theme`. This successfully populates the CSS variables to restore backgrounds and text colors on all previously styled elements.

## UI Improvements (Password & Auth Header)
- **Password Visibility:** Added a state (`showPassword`) and an SVG-based eye icon toggle to the password inputs inside both `LoginForm.tsx` and `SignupForm.tsx`.
- **Forgot Password Link:** Inserted a "¿Olvidaste tu contraseña?" link below the login button in `LoginForm.tsx` to match the style of the Facebook login page.
- **Authenticated Header View:** Modified `Layout.astro` by injecting a client-side `<script>` that fetches the Supabase session on page load. If authenticated, the "Iniciar sesión" and "Registrarse" links are hidden, and the user's name is rendered along with a "Salir" (Logout) button.

## Feature Addition: Reset Password Flow
- **LoginForm Update:** Added an `isResettingPassword` state in `LoginForm.tsx` that changes the form to only ask for the email. Clicking the submit button now calls `supabase.auth.resetPasswordForEmail()` which sends the recovery link via email.
- **Translations:** Added new keys to `ui.ts` for English and Spanish to handle the forgot password UI strings.
- **Update Password Page (`/update-password`):** Built new Astro routes (`src/pages/update-password.astro` and `src/pages/en/update-password.astro`) pointing to a new React component `UpdatePasswordForm.tsx`. This component allows users arriving from a Supabase recovery email link to securely input their new password.

## Feature Addition: Global Jobs Search & Filters
- **New Page Routes (`/jobs`):** Created `src/pages/jobs/index.astro` and `src/pages/en/jobs/index.astro` with a beautifully styled hero section matching the UAPA university brand (Deep Cove Blue).
- **GlobalJobSearch Component:** Developed a new React component at `src/components/GlobalJobSearch.tsx` that simultaneously fetches static jobs from Pagefind and live jobs from Supabase. It deduplicates URLs, maps fields, and infers job 'modality' or 'internship' status dynamically.
- **Advanced Filters:** Added a comprehensive sidebar for dynamic client-side filtering by "Remoto/Híbrido/Presencial", "Pasantía", general text query, and location text search.
- **Translations:** Added the translation keys for the job filters in `ui.ts`.

## Feature Addition: Real-time Chat & Advanced Profiles
- **Database Schema Upgrades:** Expanded `public.profiles` to include `avatar_url`, `headline`, `bio`, `phone`, `location`, and `resume_url`. Created a dedicated `conversations` table and refactored `chat_messages` to support direct, user-to-user messaging. Created an `avatars` public storage bucket in Supabase.
- **Profile Page (`/profile`):** Built `ProfileEditor.tsx`, a secure dashboard allowing users to upload avatar pictures directly to Supabase storage, manage their bios, and update professional information.
- **Job Application Auto-fill:** Updated `ApplicationForm.tsx` to query the `profiles` table upon load. Authenticaticated users will automatically have their 'Name' and 'Email' pre-filled seamlessly, accelerating their application process.
- **LinkedIn-Style Chat Widget:** Created a dynamic `ChatWidget.tsx` React component anchored to the bottom-right of the screen globally via `Layout.astro`. It fetches ongoing conversations, displays profile avatars, and connects to Supabase Realtime to push and receive live messages without page reloads.
- **Translations Update:** Added comprehensive localization strings for profile fields, avatar uploads, and chat interfaces.

## Feature Addition: Netork, Profile Skills & Profile Applications
- **Database Schema Upgrades:** Expanded `public.profiles` to include `skills` and `languages` arrays. Expanded `public.applications` to include `applicant_id`.
- **Profile Editor Updates:** Added interactive Upwork-style cards for skills and language tags at the bottom of the user profile.
- **PeopleSearch Component:** Created a dedicated Network people search that queries all recruiters and peers with filtering capabilities.
- **Apply with Profile:** Updated `ApplicationForm.tsx` to include an "Apply with Profile" toggle. This enables a user with a complete profile to submit job applications without uploading a standalone PDF.

## UI Tweaks & Public Profile System
- **Navbar Spacing Fix:** Modified `Layout.astro` to decouple the navigation links from the user authentication section. Moved "Empleos" directly adjacent to the main UAPA logo.
- **Privacy First Network Search:** Updated `PeopleSearch.tsx`. It now returns an empty array and displays a robust empty-state UI prompt if the search box is completely empty, ensuring "everyone doesn't see everyone" by default.
## API & Backend Connectivity Update
- **Astro SSR (Hybrid Mode):** Fixed dynamic routing bug (`[id].astro`) completely by integrating `@astrojs/node` and refactoring `astro.config.mjs` config to output server pages, allowing `[id]` profiles to be rendered on the fly.
- **Connections & Notifications SQL:** Authored `supabase_connections_notifications.sql` containing a rigid RLS-enabled schema mirroring LinkedIn's Connect and Bell logic.
- **Connection Mechanics:** Built `ConnectButton.tsx` to handle bi-directional "Pending", "Accept", and "Connected" states on the front-end, integrated natively into dynamic profile layouts.
- **Real-time Notifications:** Implemented `<NotificationBell />` polling the user's unread interactions. Allows dropdown interaction and links directly to actor profiles.
- **Chat Lockdown:** Refactored `<ChatWidget />` dependency hook `fetchConversations`. Chatting is now strictly permitted only with confirmed 1-on-1 connections.

## Dynamic Recruiter Ecosystem
- **Jobs Table:** Authored `supabase_jobs_update.sql` to shift job listings from static markdown into a relational Postgres table.
- **Job Posting UI:** Created secure React form `JobCreateForm.tsx` within `/jobs/create` route. Only users with the `recruiter` role can view this and post jobs directly to the live feed.
- **Dynamic Job Views:** Refactored `src/pages/jobs/[id].astro` to pull the specific job metadata from Supabase in real-time, effectively abandoning the local static `[...slug]` methodology.
