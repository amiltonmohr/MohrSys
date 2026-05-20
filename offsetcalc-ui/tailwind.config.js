/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#7c3aed',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        teal: {
          DEFAULT: '#06b6d4',
          50: '#ecfeff',
          500: '#06b6d4',
          600: '#0891b2',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
