import type { Config } from 'tailwindcss'
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brown: {50:'#f9f5f2',100:'#efe6df',200:'#e2d1c5',300:'#cfae9a',400:'#b78574',500:'#99624f',600:'#7b4b3a',700:'#603b2d',800:'#4d3025',900:'#3f281f'},
        cream: '#f7efe6',
        amber: {400:'#f6c56c',500:'#e9b24d'}
      },
      boxShadow: { glass: '0 10px 30px rgba(0,0,0,0.2)' },
      fontFamily: { rokaf: ['ROKAF Sans','system-ui','sans-serif'] }
    }
  },
  plugins: []
} satisfies Config
