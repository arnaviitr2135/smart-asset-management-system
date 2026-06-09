/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c084fc',
          400: '#a855f7',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#0c0714',
        },
        dark: {
          50: '#f6f6f7',
          100: '#e1e2e4',
          200: '#c5c7cb',
          300: '#a1a4ad',
          400: '#797d8b',
          500: '#5b6070',
          600: '#474c5b',
          700: '#383c48',
          800: '#262932',
          900: '#1a1c23',
          950: '#0f1015',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 4px rgba(139, 92, 246, 0.2), 0 0 10px rgba(139, 92, 246, 0.2)' },
          '100%': { boxShadow: '0 0 12px rgba(139, 92, 246, 0.6), 0 0 20px rgba(139, 92, 246, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
