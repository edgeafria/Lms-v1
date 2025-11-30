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
          500: '#0F6848', // 🟢 UPDATED: Your Exact Brand Green
          600: '#0d593d',
          700: '#0a4932',
          800: '#083a28',
          900: '#052a1d',
        },
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#F8C64F', // 🟡 UPDATED: Your Exact Brand Yellow
          600: '#d9a632',
          700: '#a1781b',
          800: '#854d0e',
          900: '#713f12',
        },
        tech: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3B68B1', // 🔵 UPDATED: Your Exact Brand Blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        // I switched Headline to Open Sans for now so it doesn't look broken
        // If you add a custom font later, change this back!
        'headline': ['Open Sans', 'sans-serif'], 
        'body': ['Open Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(248, 198, 79, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(248, 198, 79, 0.8)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};