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
        background: 'var(--bg)',
        'background-subtle': 'var(--bg2)',
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface2)',
        'surface-elevated': 'var(--surface2)',
        'surface-glass': 'var(--surface)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        'text-muted': 'var(--text2)',
        'text-subtle': 'var(--text3)',
        primary: {
          DEFAULT: 'var(--blue)',
          hover: 'var(--blue-dark)',
          soft: 'rgb(var(--blue-rgb) / 0.1)',
          'soft-foreground': 'var(--primary-soft-foreground)',
        },
        success: {
          DEFAULT: 'var(--green)',
          dark: 'var(--success-dark)',
          soft: 'rgb(var(--green-rgb) / 0.1)',
          'soft-foreground': 'var(--success-soft-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          dark: 'var(--warning-dark)',
          soft: 'rgb(var(--warning-rgb) / 0.1)',
          'soft-foreground': 'var(--warning-soft-foreground)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          dark: 'var(--danger-dark)',
          soft: 'rgb(var(--danger-rgb) / 0.1)',
          'soft-foreground': 'var(--danger-soft-foreground)',
        },
        input: 'var(--input)',
        ai: {
          DEFAULT: 'var(--green)',
          soft: 'rgb(var(--green-rgb) / 0.1)',
          'soft-foreground': 'var(--ai-soft-foreground)',
        },
        dbe: {
          dark: 'var(--bg)',
          navy: 'var(--surface)',
          border: 'var(--border)',
          text: 'var(--text)',
          muted: 'var(--text2)',
          blue: 'var(--blue)',
          green: 'var(--green)',
          purple: 'var(--green)',
          amber: 'var(--blue)',
          red: 'var(--danger)',
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
