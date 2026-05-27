---
name: Serene Alignment
colors:
  surface: '#fbf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#fbf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f1'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e4e2e0'
  on-surface: '#1b1c1a'
  on-surface-variant: '#434843'
  inverse-surface: '#30312f'
  inverse-on-surface: '#f2f0ee'
  outline: '#737872'
  outline-variant: '#c3c8c1'
  surface-tint: '#506354'
  primary: '#334537'
  on-primary: '#ffffff'
  primary-container: '#4a5d4e'
  on-primary-container: '#c0d5c2'
  inverse-primary: '#b7ccb9'
  secondary: '#665d4a'
  on-secondary: '#ffffff'
  secondary-container: '#ebdec6'
  on-secondary-container: '#6b624e'
  tertiary: '#553a3e'
  on-tertiary: '#ffffff'
  tertiary-container: '#6e5155'
  on-tertiary-container: '#ecc6ca'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e8d5'
  primary-fixed-dim: '#b7ccb9'
  on-primary-fixed: '#0e1f13'
  on-primary-fixed-variant: '#394b3d'
  secondary-fixed: '#eee1c9'
  secondary-fixed-dim: '#d1c5ae'
  on-secondary-fixed: '#211b0c'
  on-secondary-fixed-variant: '#4e4634'
  tertiary-fixed: '#ffd9de'
  tertiary-fixed-dim: '#e3bdc2'
  on-tertiary-fixed: '#2b1519'
  on-tertiary-fixed-variant: '#5b4043'
  background: '#fbf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2e0'
typography:
  display:
    fontFamily: Noto Serif
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.1em
  headline-lg-mobile:
    fontFamily: Noto Serif
    fontSize: 28px
    fontWeight: '400'
    lineHeight: '1.3'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: '4'
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 80px
---

## Brand & Style

This design system is built on the principles of **intentionality, mindfulness, and editorial clarity**. It is designed for wellness, productivity, or reflective applications where the user's mental focus is the priority. 

The style is a blend of **Editorial Minimalism** and **Soft Functionalism**. It avoids the sterility of pure tech aesthetics by utilizing organic, warm tones and high-quality serif typography, creating an environment that feels more like a physical journal or a curated gallery than a software interface. The emotional response is one of calm, focus, and quiet sophistication.

## Colors

The palette is rooted in nature-inspired neutrals to reduce visual fatigue.

- **Primary (Forest Green):** Used for actionable items, primary buttons, and active states. It provides a grounded, stable anchor for the eye.
- **Secondary (Parchment):** A light, warm neutral (#EADDC5) used for subtle UI elements, secondary surfaces, and containers that require a gentle distinction from the background.
- **Background (Cream):** A warm off-white (#F9F7F2) that provides a softer canvas than pure white, reducing screen glare.
- **Accent (Sage):** Derived from the primary, used for subtle backgrounds, secondary chips, or success indicators.
- **Text:** High-contrast but slightly softened charcoal (#3A3834) to maintain readability without the harshness of pure black.

## Typography

The typography strategy relies on the contrast between the intellectual, traditional feel of **Noto Serif** and the utilitarian precision of **Inter**.

- **Headings:** Use Noto Serif for all page titles and section headers. This creates an editorial "rhythm" that encourages slow, focused reading.
- **Body & Labels:** Use Inter for all functional text, inputs, and long-form descriptions. This ensures maximum legibility and a modern feel.
- **Uppercase Labels:** Small caps with tracking are used for section metadata (e.g., "ACTIVE TASKS") to create clear hierarchical boundaries without needing heavy dividers.

## Layout & Spacing

This design system utilizes a **Fixed-Fluid Hybrid Grid**. Content is centered within a maximum width (typically 1200px) to prevent lines of text from becoming too long, while sidebars or navigation elements remain fixed to the viewport edges.

- **Generous Whitespace:** Spacing should lean towards "oversized." Use `xl` and `xxl` units for vertical breathing room between major sections.
- **Sidebar:** A persistent left navigation (240px-280px) provides a structural anchor, utilizing a slightly darker shade of the background color or a very subtle tint.
- **Rhythm:** Elements should follow a 4px baseline grid, though most components will align to 8px or 16px increments to maintain a relaxed, airy feel.

## Elevation & Depth

Depth is handled with extreme subtlety to maintain the minimalist aesthetic.

- **Tonal Layering:** Instead of heavy shadows, use slight color shifts in background surfaces. Cards should be either pure white (#FFFFFF) against the cream background or use a thin, low-contrast border.
- **Subtle Shadows:** When elevation is required (e.g., for hovering or floating action buttons), use "Ambient Shadows"—very large blur radiuses (20-40px) with extremely low opacity (3-5%) and a slight tint of the primary green color.
- **Inner Depth:** Use "Inset" styling for empty states or specialized input zones to create a "recessed" feeling that implies a container for user content.

## Shapes

The shape language is defined by **soft, approachable geometry**. 

- **Standard Radius:** 8px (0.5rem) for cards and input fields.
- **Interactive Radius:** 12px-16px (0.75rem - 1rem) for buttons and primary navigation items to emphasize touch-friendliness.
- **Icons:** Use thin-stroke (1.5px) linear icons with slightly rounded terminals to match the typography. Avoid solid-fill icons unless representing an active state.

## Components

- **Buttons:** Primary buttons use the Forest Green background with white text. Secondary buttons use the Parchment background or a subtle outline. All buttons should have a horizontal padding of at least 24px to feel substantial.
- **Cards:** Cards should be borderless with a very soft shadow or a 1px border in a slightly darker cream tint. The padding within cards should be generous (24px-32px).
- **Navigation Items:** Active states in the sidebar should use a pill-shaped background with a very soft tint (Sage or Light Cream) to highlight the current location without high contrast.
- **Lists:** List items should be separated by whitespace rather than dividers wherever possible. When dividers are necessary, they should be 1px and use the Secondary (Parchment) color at a subtle opacity.
- **Inputs:** Text fields should have a background that is slightly darker than the page background to clearly define the interaction area, using the standard 8px corner radius.
- **Empty States:** Use dashed borders and muted neutral icons to indicate areas where content has not yet been created, maintaining the "intentional" and "airy" vibe.