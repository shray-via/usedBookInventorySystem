/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f8f2e8',
          100: '#efe2cd',
          200: '#e2ccaa',
          300: '#d0b180',
          400: '#be965d',
          500: '#a97b42',
          600: '#8e6332',
          700: '#6f4c24',
          800: '#4e3519',
        },
        ink: {
          50: '#f6f7f8',
          100: '#e8eaec',
          200: '#ccd1d6',
          300: '#a5adb6',
          400: '#788391',
          500: '#4e5a69',
          600: '#36414f',
          700: '#25303f',
          800: '#18222f',
        },
        accent: {
          50: '#ebf7f1',
          100: '#d5efe3',
          200: '#abdcc7',
          300: '#7fc7a9',
          400: '#53ad89',
          500: '#2f8f6b',
          600: '#247355',
          700: '#1b5a43',
        },
      },
      backgroundImage: {
        shelf:
          'radial-gradient(circle at 10% 20%, rgba(169,123,66,0.16), transparent 40%), radial-gradient(circle at 90% 15%, rgba(47,143,107,0.12), transparent 35%), linear-gradient(180deg, #f8f2e8 0%, #fff9f0 100%)',
      },
    },
  },
  plugins: [],
}
