import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const { url, request, redirect } = context;

  // Language auto-detection on the home page mapping (Disabled per request)
  /*
  if (url.pathname === '/') {
    const acceptLang = request.headers.get('accept-language');
    // If browser prefers English, seamlessly redirect
    if (acceptLang && acceptLang.toLowerCase().startsWith('en')) {
      return redirect('/en', 302);
    }
  }
  */

  return next();
});
