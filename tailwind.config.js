/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins_400Regular', 'sans-serif'],
        medium: ['Poppins_500Medium', 'sans-serif'],
        semibold: ['Poppins_600SemiBold', 'sans-serif'],
        bold: ['Poppins_700Bold', 'sans-serif'],
      },
      colors: {
        // Add your custom colors here
      },
    },
  },
  plugins: [],
}
