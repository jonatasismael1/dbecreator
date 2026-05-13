/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dbe: {
          dark: 'hsl(var(--color-dark) / <alpha-value>)',
          navy: 'hsl(var(--color-navy) / <alpha-value>)',
          border: 'hsl(var(--color-border) / <alpha-value>)',
          text: 'hsl(var(--color-text) / <alpha-value>)',
          muted: 'hsl(var(--color-muted) / <alpha-value>)',
          blue: 'hsl(var(--color-blue) / <alpha-value>)',
          green: 'hsl(var(--color-green) / <alpha-value>)',
          purple: 'hsl(var(--color-purple) / <alpha-value>)',
          amber: 'hsl(var(--color-amber) / <alpha-value>)',
          red: 'hsl(var(--color-red) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
