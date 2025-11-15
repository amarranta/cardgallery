/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['src/**/*.{astro,html,js,ts}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--text-ink-900)',
        muted: 'var(--text-muted)',
        paper: 'var(--paper)',
        card: {
          DEFAULT: 'var(--surface-card)',
          grid: 'var(--surface-card-grid)',
          tile: 'var(--surface-card-tile)'
        },
        accent: 'var(--accent)',
        banner: 'var(--surface-banner)',
        'banner-text': 'var(--text-banner)',
        sidebar: 'var(--surface-sidebar)',
        'sidebar-hover': 'var(--surface-sidebar-hover)',
        'sidebar-active': 'var(--surface-sidebar-active)',
        'sidebar-tag': 'var(--surface-sidebar-tag)'
      },
      boxShadow: {
        surface: 'var(--shadow-surface)',
        overlay: 'var(--shadow-overlay)'
      },
      borderColor: {
        panel: 'var(--border-panel)',
        card: 'var(--border-card)',
        'card-strong': 'var(--border-card-strong)',
        'chip-muted': 'var(--border-chip-muted)',
        'chip-accent': 'var(--border-chip-accent)',
        lightbox: 'var(--border-lightbox)',
        banner: 'var(--border-banner)',
        sidebar: 'var(--border-sidebar)',
        'sidebar-strong': 'var(--border-sidebar-strong)',
        avatar: 'var(--border-avatar)'
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
