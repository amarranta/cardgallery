/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['src/**/*.{astro,html,js,ts}'],
  theme: {
    extend: {
      colors: {
        deepOlive: '#435339',
        sage: '#9eb589',
        linen: '#ede4d2',
        sand: '#cdbb99',
        accent: '#314427',
        accentLight: 'rgba(67, 83, 57, 0.16)',
        accentMuted: 'rgba(67, 83, 57, 0.22)',
        textPrimary: '#21311d',
        textMuted: '#6f7762'
      },
      boxShadow: {
        card: '0 10px 18px rgba(33, 49, 29, 0.14)',
        overlay: '0 12px 24px rgba(23, 30, 22, 0.28)'
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px'
      }
    }
  },
  plugins: []
};
