/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0B1020',
          secondary: '#111827',
          card: 'rgba(255,255,255,0.04)',
          'card-hover': 'rgba(255,255,255,0.06)',
          input: 'rgba(255,255,255,0.05)',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          glass: 'rgba(255,255,255,0.08)',
          accent: 'rgba(59,130,246,0.4)',
        },
        accent: {
          blue: '#3B82F6',
          'blue-dim': 'rgba(59,130,246,0.15)',
          green: '#10B981',
          'green-dim': 'rgba(16,185,129,0.12)',
          amber: '#F59E0B',
          'amber-dim': 'rgba(245,158,11,0.12)',
          red: '#EF4444',
          'red-dim': 'rgba(239,68,68,0.12)',
          violet: '#8B5CF6',
          'violet-dim': 'rgba(139,92,246,0.12)',
        },
        text: {
          primary: '#F9FAFB',
          secondary: '#9CA3AF',
          muted: '#4B5563',
          accent: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      backdropBlur: {
        xs: '4px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.45s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-right': 'slideInRight 0.35s ease-out',
        'pulse-slow': 'pulse 2.5s ease-in-out infinite',
        'spin-slow': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.4)',
        'glow-blue': '0 0 24px rgba(59,130,246,0.15)',
        'glow-green': '0 0 24px rgba(16,185,129,0.15)',
        'inner-border': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
}
