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
        // Warm amber/gold accent - scholarly and luxurious
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Deep burgundy for secondary accents
        burgundy: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#f9d0da',
          300: '#f4a9bc',
          400: '#ed7596',
          500: '#e04772',
          600: '#cc2759',
          700: '#ab1d49',
          800: '#8f1b41',
          900: '#7a1a3c',
          950: '#44091c',
        },
        // Warm, aged paper tones for surfaces
        parchment: {
          50: '#fdfcfa',
          100: '#f9f6f0',
          200: '#f3ede2',
          300: '#e8ddc9',
          400: '#d9c7a7',
          500: '#c9ae85',
          600: '#b4956a',
          700: '#977958',
          800: '#7b634a',
          900: '#65523f',
          950: '#372b20',
        },
        // Deep ink/charcoal for backgrounds
        ink: {
          50: '#f6f5f4',
          100: '#e7e5e3',
          200: '#d1cdc9',
          300: '#b5aea8',
          400: '#928a82',
          500: '#786f67',
          600: '#645c55',
          700: '#524c47',
          800: '#46413d',
          900: '#3d3936',
          925: '#2a2725',
          950: '#1c1a19',
          975: '#121110',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Libre Franklin"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        'radial-warm': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'book': '0 4px 6px -1px rgba(55, 43, 32, 0.3), 0 2px 4px -2px rgba(55, 43, 32, 0.2), 4px 0 6px -1px rgba(55, 43, 32, 0.15)',
        'elevated': '0 10px 40px -10px rgba(18, 17, 16, 0.5), 0 4px 12px -4px rgba(18, 17, 16, 0.3)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.15), 0 0 40px rgba(245, 158, 11, 0.1)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'ink-spread': 'inkSpread 0.6s ease-out',
        'pulse-warm': 'pulseWarm 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        inkSpread: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseWarm: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
