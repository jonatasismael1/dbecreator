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
        background: 'rgb(var(--bg-rgb) / <alpha-value>)',
        'background-subtle': 'rgb(var(--bg2-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        'surface-muted': 'rgb(var(--surface2-rgb) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface2-rgb) / <alpha-value>)',
        'surface-glass': 'rgb(var(--surface-rgb) / <alpha-value>)',
        border: 'rgb(var(--border-rgb) / var(--border-opacity))',
        'border-strong': 'rgb(var(--border-rgb) / var(--border-strong-opacity))',
        text: 'rgb(var(--text-rgb) / <alpha-value>)',
        'text-muted': 'rgb(var(--text2-rgb) / <alpha-value>)',
        'text-subtle': 'rgb(var(--text3-rgb) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--blue-rgb) / <alpha-value>)',
          hover: 'rgb(var(--blue-dark-rgb) / <alpha-value>)',
          soft: 'rgb(var(--blue-rgb) / 0.12)',
          'soft-foreground': 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--text2-rgb) / <alpha-value>)',
          soft: 'rgb(var(--surface2-rgb) / <alpha-value>)',
          'soft-foreground': 'rgb(var(--text2-rgb) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--green-rgb) / <alpha-value>)',
          soft: 'rgb(var(--green-rgb) / 0.12)',
          'soft-foreground': 'var(--success-foreground)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning-rgb) / <alpha-value>)',
          soft: 'rgb(var(--warning-rgb) / 0.12)',
          'soft-foreground': 'var(--warning-foreground)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger-rgb) / <alpha-value>)',
          soft: 'rgb(var(--danger-rgb) / 0.12)',
          'soft-foreground': 'var(--danger-foreground)',
        },
        info: {
          DEFAULT: 'rgb(var(--blue-rgb) / <alpha-value>)',
          soft: 'rgb(var(--blue-rgb) / 0.12)',
          'soft-foreground': 'var(--primary-foreground)',
        },
        ai: {
          DEFAULT: 'rgb(var(--green-rgb) / <alpha-value>)',
          soft: 'rgb(var(--green-rgb) / 0.12)',
          'soft-foreground': 'var(--ai-foreground)',
        },
        dbe: {
          dark: 'rgb(var(--bg-rgb) / <alpha-value>)',
          navy: 'rgb(var(--surface-rgb) / <alpha-value>)',
          border: 'rgb(var(--border-rgb) / var(--border-opacity))',
          text: 'rgb(var(--text-rgb) / <alpha-value>)',
          muted: 'rgb(var(--text2-rgb) / <alpha-value>)',
          blue: 'rgb(var(--blue-rgb) / <alpha-value>)',
          green: 'rgb(var(--green-rgb) / <alpha-value>)',
          purple: 'rgb(var(--green-rgb) / <alpha-value>)',
          amber: 'rgb(var(--blue-rgb) / <alpha-value>)',
          red: 'rgb(var(--danger-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', '"Apple Color Emoji"', 'Arial', 'sans-serif', '"Segoe UI Emoji"', '"Segoe UI Symbol"'],
        serif: ['Lyon-Text', 'Georgia', 'YuMincho', '"Yu Mincho"', '"Hiragino Mincho ProN"', '"Hiragino Mincho Pro"', '"Songti TC"', '"Songti SC"', 'SimSun', '"Nanum Myeongjo"', 'NanumMyeongjo', 'Batang', 'serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', '"Apple Color Emoji"', 'Arial', 'sans-serif', '"Segoe UI Emoji"', '"Segoe UI Symbol"'],
      },
    },
  },
  plugins: [],
}
