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
          navy: '#0B2545',
          blue: '#005FB8',
          subtle: '#EEF4FA',
          border: '#DCE6F1',
        },
      },
    },
  },
  plugins: [],
}
