/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#285943',
          dark: '#1e4433',
          light: '#357357',
        },
        secondary: {
          DEFAULT: '#78966A',
          light: '#8fae7f',
          dark: '#5f7754',
        },
        ivory: {
          DEFAULT: '#F8F7F0',
          dark: '#ECEAE0',
          light: '#FCFBF7',
        },
        cream: {
          DEFAULT: '#FFFFFF',
          soft: '#FAF9F4',
        },
        ochre: {
          DEFAULT: '#C6A15B',
          light: '#d9b775',
          dark: '#aa8846',
        },
        charcoal: {
          DEFAULT: '#292F29',
          muted: '#4A5249',
        },
        muted: {
          DEFAULT: '#6D756C',
          light: '#8E978D',
        },
        warmborder: {
          DEFAULT: '#E6E5DA',
          dark: '#D5D3C5',
        },
        danger: {
          DEFAULT: '#A64B3B',
          light: '#FBEBE8',
        },
        alert: {
          DEFAULT: '#B87B2E',
          light: '#FEF6E9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(40, 89, 67, 0.06), 0 1px 4px -1px rgba(40, 89, 67, 0.04)',
        'card': '0 4px 16px -4px rgba(40, 89, 67, 0.08), 0 2px 6px -2px rgba(40, 89, 67, 0.05)',
        'elevated': '0 8px 24px -6px rgba(40, 89, 67, 0.12), 0 4px 10px -2px rgba(40, 89, 67, 0.06)',
      },
      borderRadius: {
        'natural': '14px',
        'card': '18px',
      }
    },
  },
  plugins: [],
}
