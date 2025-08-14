/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#006747', // Dark Green - African Earth
          600: '#005a3d',
          700: '#004d33',
          800: '#003d28',
          900: '#002d1e',
        },
        secondary: {
          50: '#fef7ed',
          100: '#feeddb',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#F59741', // Golden Yellow - Empowerment Glow
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#FAEF5F', // Light Yellow - Future Shine
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        tech: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0A66EA', // Sky Blue - Digital Horizon
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        foundation: '#000000', // Black - Foundation
      },
      fontFamily: {
        'headline': ['Grandissimo', 'serif'],
        'body': ['Open Sans', 'Arial', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(245, 151, 65, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(245, 151, 65, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};