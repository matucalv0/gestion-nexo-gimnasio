/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/main/resources/static/**/*.html", "./src/main/resources/static/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B2C',
          50: '#FFF4EF',
          100: '#FFE8DC',
          200: '#FFD1B9',
          300: '#FFBA96',
          400: '#FFA373',
          500: '#FF6B2C',
          600: '#E85A1F',
          700: '#C74A19',
          800: '#A63A14',
          900: '#852A0F',
        },
        secondary: {
          DEFAULT: '#00D9FF',
        },
        dark: {
          bg: '#121212',
          card: '#1A1A1A',
          border: '#2A2A2A'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
