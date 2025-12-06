/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        supabase: {
          green: '#5ED591',
          'green-light': '#4FFFB0',
          'green-dark': '#2BA86F',
          dark: '#0F1419',
          'dark-secondary': '#1A1F25',
          'dark-hover': '#242B33',
          'gray-light': '#9CA3AF',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class', // only generate classes for form elements
    }),
  ],
}
