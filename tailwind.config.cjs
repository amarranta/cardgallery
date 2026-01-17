/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--text-ink-900)',
        primary: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        accent: 'var(--accent)',
        paper: 'var(--paper)',
        linen: 'var(--linen)',
        card: {
          DEFAULT: 'var(--surface-card)',
          grid: 'var(--surface-card-grid)',
          tile: 'var(--surface-card-tile)',
          content: 'var(--text-card)',
          'content-muted': 'var(--text-card-muted)'
        },
        banner: {
          DEFAULT: 'var(--surface-banner)',
          text: 'var(--text-banner)'
        },
        sidebar: {
          DEFAULT: 'var(--surface-sidebar)',
          hover: 'var(--surface-sidebar-hover)',
          active: 'var(--surface-sidebar-active)',
          tag: 'var(--surface-sidebar-tag)'
        },
        overlay: {
          card: 'var(--overlay-card)'
        },
        state: {
          hover: 'var(--state-hover-forest)',
          'hover-strong': 'var(--state-hover-forest-strong)',
          'hover-tint': 'var(--state-hover-forest-tint)',
          focus: 'var(--state-focus-toggle)'
        },
        tonal: 'var(--surface-tonal)',
        toggle: {
          DEFAULT: 'var(--text-toggle)',
          surface: 'var(--surface-toggle)',
          strong: 'var(--text-toggle-strong)',
          on: 'var(--text-toggle-on)',
          brand: 'var(--brand-toggle)'
        },
        backdrop: {
          DEFAULT: 'var(--surface-backdrop)',
          strong: 'var(--surface-backdrop-strong)',
          hover: 'var(--surface-backdrop-hover)',
          compact: 'var(--surface-backdrop-compact)',
          'compact-hover': 'var(--surface-backdrop-compact-hover)'
        },
        tag: {
          surface: 'var(--surface-tag)',
          'surface-hover': 'var(--surface-tag-hover)'
        },
        hero: {
          border: 'var(--border-profile)',
          from: 'var(--surface-gradient-hero-from)',
          to: 'var(--surface-gradient-hero-to)'
        },
        footer: {
          border: 'var(--border-panel)',
          text: 'var(--text-muted)'
        },
        lightbox: {
          heading: 'var(--text-lightbox-heading)',
          accent: 'var(--text-lightbox-accent)',
          body: 'var(--text-lightbox-body)',
          base: 'var(--text-lightbox-base)',
          title: 'var(--text-lightbox-title)',
          link: 'var(--text-lightbox-link)'
        },
        gradient: {
          'warm-soft': 'var(--surface-gradient-warm-soft)'
        },
        fallback: {
          surface: 'var(--surface-fallback)',
          text: 'var(--text-fallback)'
        },
        'surface-header': 'var(--surface-header)',
        'surface-chip': 'var(--surface-chip)'
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
        'lightbox-strong': 'var(--border-lightbox-strong)',
        'lightbox-lift': 'var(--border-lightbox-lift)',
        banner: 'var(--border-banner)',
        sidebar: 'var(--border-sidebar)',
        'sidebar-strong': 'var(--border-sidebar-strong)',
        avatar: 'var(--border-avatar)',
        toggle: 'var(--border-toggle)',
        'toggle-hover': 'var(--border-toggle-hover)',
        'toggle-active': 'var(--border-toggle-active)',
        profile: 'var(--border-profile)',
        'tag-pill': 'var(--border-tag-pill)',
        'tag-pill-hover': 'var(--border-tag-pill-hover)'
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
