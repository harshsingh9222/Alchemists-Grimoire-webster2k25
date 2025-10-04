
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          circus: {
            red: '#DC143C',
            gold: '#FFD700',
            purple: '#6B46C1',
            navy: '#1E293B',
            cream: '#FFF8E1',
            burgundy: '#8B0000',
            teal: '#00CED1',
          }
        },
        animation: {
          'spin-slow': 'spin 4s linear infinite',
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'bounce-slow': 'bounce 3s infinite',
          'float': 'float 6s ease-in-out infinite',
          'float-delay': 'float 6s ease-in-out 3s infinite',
          'shimmer': 'shimmer 3s linear infinite',
          'slide': 'slide 30s linear infinite',
          'spotlight': 'spotlight 5s ease-in-out infinite',
          'glow': 'glow 2s ease-in-out infinite',
          'marquee': 'marquee 20s linear infinite',
        },
        keyframes: {
          float: {
            '0%, 100%': { 
              transform: 'translateY(0) translateX(0) rotate(-5deg)',
            },
            '33%': { 
              transform: 'translateY(-20px) translateX(10px) rotate(5deg)',
            },
            '66%': { 
              transform: 'translateY(-10px) translateX(-10px) rotate(-3deg)',
            },
          },
          shimmer: {
            '0%': { backgroundPosition: '-200% center' },
            '100%': { backgroundPosition: '200% center' }
          },
          slide: {
            '0%': { transform: 'translateX(0) translateZ(0)' },
            '100%': { transform: 'translateX(80px) translateZ(0)' }
          },
          spotlight: {
            '0%, 100%': { opacity: 0.3 },
            '50%': { opacity: 0.6 }
          },
          glow: {
            '0%, 100%': { 
              filter: 'brightness(1) drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))' 
            },
            '50%': { 
              filter: 'brightness(1.2) drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))' 
            }
          },
          marquee: {
            '0%': { transform: 'translateX(0%)' },
            '100%': { transform: 'translateX(-100%)' }
          }
        },
        backgroundImage: {
          'tent-gradient': 'repeating-linear-gradient(45deg, #FF6B6B, #FF6B6B 40px, #FFF8E1 40px, #FFF8E1 80px)',
          'gold-shimmer': 'linear-gradient(90deg, #FFD700, #FFED4B, #FFD700, #FFA500, #FFD700)',
          'circus-radial': 'radial-gradient(circle at center, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
        },
        dropShadow: {
          'glow': '0 0 20px rgba(255, 215, 0, 0.5)',
          'glow-lg': '0 0 30px rgba(255, 215, 0, 0.7)',
        },
        transitionDuration: {
          '2000': '2000ms',
          '3000': '3000ms',
          '4000': '4000ms',
          '5000': '5000ms',
        },
        transitionTimingFunction: {
          'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          'smooth': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        },
        scale: {
          '102': '1.02',
          '103': '1.03',
        },
        perspective: {
          '1000': '1000px',
          '2000': '2000px',
        },
      },
    },
    plugins: [],
  }