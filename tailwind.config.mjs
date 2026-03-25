/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'uapa-blue': '#041147',
        'uapa-orange': '#ff8300',
        'uapa-sand': '#E8C598',
      }
    },
  },
  plugins: [],
}
