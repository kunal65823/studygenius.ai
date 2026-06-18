/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50 : '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfc',
          400: '#8196f8',
          500: '#6370f1',
          600: '#4f51e5',
          700: '#4140ca',
          800: '#3636a3',
          900: '#303181',
          950: '#1d1d4e',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark   : '#0f0f1a',
          card   : '#f8f8fc',
          'card-dark': '#1a1a2e',
        },
      },
      fontFamily: {
        sans   : ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
        mono   : ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in'   : 'fadeIn 0.3s ease-out',
        'slide-up'  : 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer'   : 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn   : { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp  : { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer  : { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
