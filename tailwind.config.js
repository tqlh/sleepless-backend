/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'serif': ['Crimson Text', 'serif'],
      },
      colors: {
        amber: {
          200: '#f5e6a3',
          300: '#f0d878',
          400: '#e6cc5f',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'card-fade-in': 'cardFadeIn 0.6s ease-out',
        'pulse': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { 
            opacity: '0.8',
            filter: 'drop-shadow(0 0 2px rgba(245,230,163,0.2))',
          },
          '50%': { 
            opacity: '1',
            filter: 'drop-shadow(0 0 6px rgba(245,230,163,0.4))',
          },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        fadeIn: {
          '0%': { height: '80px', opacity: '0.9' },
          '100%': { height: '280px', opacity: '1' },
        },
        slideDown: {
          '0%': { height: '80px', opacity: '0.9' },
          '100%': { height: 'auto', opacity: '1' },
        },
        slideUp: {
          '0%': { height: 'auto', opacity: '1' },
          '100%': { height: '80px', opacity: '0.9' },
        },
        cardFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
};