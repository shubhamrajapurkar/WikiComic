/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        manga: ["'Noto Sans JP'", 'sans-serif'],
        western: ["'Playfair Display'", 'serif'],
        minimalist: ["'Inter'", 'sans-serif'],
        comic: ["'Comic Sans MS'", 'cursive'],
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out forwards',
        wiggle: 'wiggle 0.5s ease',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounceSmall: 'bounceSmall 0.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        wiggle: {
          '0%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(0deg)' },
          '75%': { transform: 'rotate(2deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        bounceSmall: {
          '0%, 100%': { transform: 'scale(1.0)' },
          '50%': { transform: 'scale(1.05)' },
        }
      },
      backgroundImage: {
        'manga-pattern': "url('https://plus.unsplash.com/premium_photo-1674718013659-6930c469e641?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGFuaW1lfGVufDB8fDB8fHww')",
        'western-pattern': "url('https://plus.unsplash.com/premium_photo-1674718013659-6930c469e641?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGFuaW1lfGVufDB8fDB8fHww')",
        'minimalist-pattern': "url('https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFuaW1lfGVufDB8fDB8fHww')",
        'polka-dots': "radial-gradient(#FF4081 1px, transparent 1px), radial-gradient(#FF4081 1px, transparent 1px)",
        'comic-dots': "radial-gradient(circle, #fff 1px, transparent 1px)",
        'pattern': 'url("/src/assets/pattern.png")',
      },
      colors: {
        'manga-blue': '#536DFE',
        'manga-dark': '#3D5AFE',
        'western-orange': '#FF9800',
        'western-dark': '#F57C00',
        'minimalist-gray': '#607D8B',
        'minimalist-dark': '#455A64',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
  safelist: [
    // Colors
    'bg-purple-600',
    'bg-purple-700',
    'bg-purple-900',
    'bg-red-700',
    'bg-red-800',
    'bg-amber-800',
    'bg-amber-900',
    'bg-amber-950',
    'bg-gray-600',
    'bg-gray-700',
    'bg-gray-800',
    'bg-gray-900',
    'bg-green-400',
    'bg-green-500',
    'bg-yellow-300',
    'bg-yellow-400',
    'bg-yellow-50',
    'bg-emerald-600',
    'bg-blue-500',
    'bg-blue-800',
    'bg-cyan-500',
    'bg-purple-100',
    'bg-purple-500',
    'bg-purple-600',
    'bg-orange-500',
    'bg-red-500',
    'text-purple-400',
    'text-purple-600',
    'text-purple-800',
    'text-amber-100',
    'text-yellow-500',
    'text-yellow-300',
    'text-gray-200',
    'text-gray-400',
    'text-gray-800',
    'text-indigo-400',
    'text-white',
    'text-black',
    
    // Borders
    'border-purple-500',
    'border-purple-600',
    'border-purple-900',
    'border-yellow-600',
    'border-yellow-900',
    'border-gray-300',
    'border-gray-500',
    'border-gray-600',
    'border-gray-700',
    'border-black',
    'border-2',
    'border-3',
    'border-4',
    
    // Animations
    'animate-fadeIn',
    'animate-wiggle',
    
    // Transforms
    'rotate-6',
    'rotate-12',
    '-rotate-2',
    '-rotate-6',
    'scale-105',
    'translate-x-1/4',
    '-translate-y-1/4',
    
    // Shadows
    'shadow-md',
    'shadow-lg',
    'shadow-xl',
    'shadow-amber-900',
    
    // Text styles
    'manga-text',
    'western-text',
    'minimalist-text',
    'font-extrabold',
    'font-bold',
    'font-medium',
    
    // Fonts
    'font-manga',
    'font-western',
    'font-minimalist',
    'font-comic',
    
    // Background images
    'bg-manga-pattern',
    'bg-western-pattern',
    'bg-minimalist-pattern',
    'bg-polka-dots',
    'bg-comic-dots',
    
    // Utilities
    'bg-cover',
    'bg-center',
    'bg-fixed',
    'opacity-20',
    'opacity-40',
    'opacity-50',
    'opacity-75',
    'py-1',
    'py-2',
    'py-3',
    'py-4',
    'px-2',
    'px-3',
    'px-4',
    'px-6',
    'rounded-full',
    'rounded-lg',
    'from-purple-600',
    'to-pink-600',
    'from-blue-500',
    'to-cyan-500',
    'from-green-500',
    'to-emerald-600',
    'from-gray-400',
    'to-gray-500',
    'from-green-400',
    'via-yellow-400',
    'to-red-500',
  ]
}