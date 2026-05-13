/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // From DESIGN.md - Surface
        'surface-dim': '#dbdad7',
        'surface-bright': '#fbf9f6',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f5f3f1',
        'surface-container': '#efeeeb',
        'surface-container-high': '#e9e8e5',
        'surface-container-highest': '#e4e2e0',
        
        // On Surface
        'on-surface': '#1b1c1a',
        'on-surface-variant': '#434843',
        'inverse-surface': '#30312f',
        'inverse-on-surface': '#f2f0ee',
        
        // Outline
        outline: '#737872',
        'outline-variant': '#c3c8c1',
        'surface-tint': '#506354',
        
        // Primary
        primary: '#334537',
        'on-primary': '#ffffff',
        'primary-container': '#4a5d4e',
        'on-primary-container': '#c0d5c2',
        'inverse-primary': '#b7ccb9',
        
        // Secondary
        secondary: '#665d4a',
        'on-secondary': '#ffffff',
        'secondary-container': '#ebdec6',
        'on-secondary-container': '#6b624e',
        
        // Tertiary
        tertiary: '#553a3e',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#6e5155',
        'on-tertiary-container': '#ecc6ca',
        
        // Error
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        
        // Fixed variants
        'primary-fixed': '#d3e8d5',
        'primary-fixed-dim': '#b7ccb9',
        'on-primary-fixed': '#0e1f13',
        'on-primary-fixed-variant': '#394b3d',
        'secondary-fixed': '#eee1c9',
        'secondary-fixed-dim': '#d1c5ae',
        'on-secondary-fixed': '#211b0c',
        'on-secondary-fixed-variant': '#4e4634',
        'tertiary-fixed': '#ffd9de',
        'tertiary-fixed-dim': '#e3bdc2',
        'on-tertiary-fixed': '#2b1519',
        'on-tertiary-fixed-variant': '#5b4043',
        
        // Background
        background: '#fbf9f6',
        'on-background': '#1b1c1a',
        'surface-variant': '#e4e2e0',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: {
        unit: '4px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        xxl: '64px',
        gutter: '24px',
        'margin-mobile': '20px',
        'margin-desktop': '80px',
        'touch-target': '44px',
      },
      fontFamily: {
        display: ['Noto Serif', 'serif'],
        'headline-lg': ['Noto Serif', 'serif'],
        'headline-md': ['Noto Serif', 'serif'],
        'headline-lg-mobile': ['Noto Serif', 'serif'],
        body: ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'label-caps': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'label-caps': ['12px', { lineHeight: '1.4', letterSpacing: '0.1em', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '1.3', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'headline-md': ['24px', { lineHeight: '1.4', fontWeight: '400' }],
        'headline-lg-mobile': ['28px', { lineHeight: '1.3', fontWeight: '400' }],
        display: ['48px', { lineHeight: '1.2', fontWeight: '400', letterSpacing: '-0.02em' }],
      },
    },
  },
  plugins: [],
};
