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
        background: 'hsl(var(--background))',
        'background-subtle': 'hsl(var(--background-subtle))',
        surface: 'hsl(var(--surface))',
        'surface-muted': 'hsl(var(--surface-muted))',
        'surface-elevated': 'hsl(var(--surface-elevated))',
        'surface-glass': 'hsl(var(--surface-glass))',
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        text: 'hsl(var(--text))',
        'text-muted': 'hsl(var(--text-muted))',
        'text-subtle': 'hsl(var(--text-subtle))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          hover: 'hsl(var(--primary-hover))',
          soft: 'hsl(var(--primary-soft))',
          'soft-foreground': 'hsl(var(--primary-soft-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          soft: 'hsl(var(--secondary-soft))',
          'soft-foreground': 'hsl(var(--secondary-soft-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          soft: 'hsl(var(--success-soft))',
          'soft-foreground': 'hsl(var(--success-soft-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          soft: 'hsl(var(--warning-soft))',
          'soft-foreground': 'hsl(var(--warning-soft-foreground))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          soft: 'hsl(var(--danger-soft))',
          'soft-foreground': 'hsl(var(--danger-soft-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          soft: 'hsl(var(--info-soft))',
          'soft-foreground': 'hsl(var(--info-soft-foreground))',
        },
        ai: {
          DEFAULT: 'hsl(var(--ai))',
          soft: 'hsl(var(--ai-soft))',
          'soft-foreground': 'hsl(var(--ai-soft-foreground))',
        },
        dbe: {
          dark: 'hsl(var(--background) / <alpha-value>)',
          navy: 'hsl(var(--surface) / <alpha-value>)',
          border: 'hsl(var(--border) / <alpha-value>)',
          text: 'hsl(var(--text) / <alpha-value>)',
          muted: 'hsl(var(--text-muted) / <alpha-value>)',
          blue: 'hsl(var(--primary) / <alpha-value>)',
          green: 'hsl(var(--success) / <alpha-value>)',
          purple: 'hsl(var(--ai) / <alpha-value>)',
          amber: 'hsl(var(--warning) / <alpha-value>)',
          red: 'hsl(var(--danger) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
