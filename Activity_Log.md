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
