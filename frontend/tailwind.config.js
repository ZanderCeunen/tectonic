/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sdworx: {
          navy: '#002D62',
          'navy-dark': '#001E42',
          blue: '#0072CE',
          'blue-light': '#EBF4FC',
          orange: '#EB6434',
          'orange-hover': '#D95325',
          'orange-light': '#FDF1EC',
          border: '#D8E2EC',
          bg: '#F4F7FA',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
