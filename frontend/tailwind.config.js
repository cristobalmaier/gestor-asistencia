/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mapeamos la variable CSS --background a la utilidad 'background'
        'background': 'var(--background)',
        
        // Mapeamos la variable CSS --primary al color 'primary'
        // Usamos el formato RGB con <alpha-value> para que puedas usar
        // clases como text-primary/50 o bg-primary/20 en tus componentes.
        'primary': 'rgb(var(--primary) / <alpha-value>)', 
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}