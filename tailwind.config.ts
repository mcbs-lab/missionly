import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED',
          foreground: '#FFFFFF',
          50: '#F5F0FF',
          100: '#EDE0FF',
          200: '#D4B5FF',
          300: '#B980FF',
          400: '#9D55FF',
          500: '#7C3AED',
          600: '#6020D0',
          700: '#4A18A8',
          800: '#341480',
          900: '#230F58',
        },
        secondary: {
          DEFAULT: '#0D9488',
          foreground: '#FFFFFF',
          50: '#F0FDFB',
          100: '#CCFBF5',
          200: '#99F6EE',
          300: '#5EEADF',
          400: '#2DD4CB',
          500: '#0D9488',
          600: '#0F766E',
          700: '#115E59',
          800: '#134E4A',
          900: '#134040',
        },
        accent: {
          DEFAULT: '#FACC15',
          foreground: '#1A1A1A',
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
        },
        neutral: {
          DEFAULT: '#F5F5F5',
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        border: '#E5E5E5',
        input: '#E5E5E5',
        ring: '#7C3AED',
        background: '#FFFFFF',
        foreground: '#171717',
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F5F5F5',
          foreground: '#737373',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#171717',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#171717',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
}

export default config
