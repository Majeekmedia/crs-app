---
name: Precision Ledger
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#4c4546'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#585f6c'
  on-secondary: '#ffffff'
  secondary-container: '#dce2f3'
  on-secondary-container: '#5e6572'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1b'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#dce2f3'
  secondary-fixed-dim: '#c0c7d6'
  on-secondary-fixed: '#151c27'
  on-secondary-fixed-variant: '#404754'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  numeric-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is built on a foundation of **Minimalism** and **Modern Corporate** aesthetics, specifically tailored for high-density financial data. The brand personality is disciplined, transparent, and authoritative, designed to evoke a sense of security and clarity for users managing complex fiscal information.

The visual language focuses on "Negative Space as Structure." By utilizing expansive white space and a rigorous alignment to a geometric grid, the UI remains breathable even when displaying dense transaction ledgers or portfolio analytics. The emotional response should be one of "effortless control"—reducing the cognitive load associated with financial decision-making through extreme legibility and a reduction of unnecessary decorative elements.

## Colors

The palette is strictly functional, prioritizing content over container. 

- **Primary & Neutral:** We use a "True Ink" approach. Primary text and key actions are solid black (#000000) to ensure maximum contrast against the pure white (#FFFFFF) background. Secondary information uses a muted slate to create a clear visual hierarchy.
- **Surfaces:** Secondary surfaces and card backgrounds utilize a very light cool gray (#F9FAFB) to subtly distinguish different functional zones without breaking the flow of the page.
- **Semantic Logic:** Color is reserved almost exclusively for status signaling. 
    - **Green (#10B981):** Positive cash flow, completed payments, or "Live" status.
    - **Orange (#F59E0B):** Pending transactions or items requiring review.
    - **Red (#EF4444):** Overdue invoices, failed auths, or critical errors.

## Typography

The typography utilizes **Inter** for its neutral, systematic qualities and exceptional legibility at small sizes. 

- **Numerical Clarity:** Financial figures should use the `numeric-data` role, which features slightly increased tracking (+0.02em) to ensure digits are easily distinguishable during quick scanning.
- **Hierarchy:** Use `label-caps` for table headers and small metadata categories to provide a clear structural anchor.
- **Scale:** On mobile devices, display and large headline sizes scale down to prevent awkward line breaks in currency strings.

## Layout & Spacing

The design system employs a **Fluid Grid** with fixed maximum widths for desktop viewing to maintain readability. 

- **Grid Model:** A 12-column system is used for desktop, collapsing to 4 columns for mobile. 
- **Rhythm:** All spacing is derived from a 4px baseline. Gutters are kept tight (20px) to maximize horizontal space for data columns, while vertical margins between sections are generous (40px+) to prevent the "wall of data" effect.
- **Density:** For data-heavy views (like transaction lists), use "Compact" vertical padding (8px) while maintaining wide horizontal margins to guide the eye across the row.

## Elevation & Depth

This system avoids heavy shadows and deep layering. Depth is communicated through **Tonal Layers** and extremely subtle **Ambient Shadows**.

- **Level 0 (Background):** Pure white (#FFFFFF). 
- **Level 1 (Cards/Sections):** Light gray (#F9FAFB) with a 1px solid border (#E5E7EB). No shadow.
- **Level 2 (Overlays/Modals):** Pure white background with a `shadow-sm` (0px 1px 2px rgba(0,0,0,0.05)). This provides just enough lift to signify interactivity without appearing heavy.
- **Focus States:** Use a 2px solid black ring with a 2px offset for keyboard navigation and active input states.

## Shapes

The shape language is "Soft-Modern." While the overall layout is architectural and rigid, the individual elements use **Rounded (0.5rem)** corners to feel approachable and contemporary. 

- **Containers:** Large cards and primary containers should use `rounded-xl` (1.5rem) to create a distinct frame for content.
- **Interactions:** Buttons and input fields use the base `rounded-md` (0.5rem) to maintain a crisp, professional appearance.
- **Icons:** Use a 1.5px or 2px stroke weight with slightly rounded caps to match the typography's geometry.

## Components

- **Buttons:** 
    - *Primary:* Solid black background, white text, no shadow. 
    - *Secondary:* White background, 1px border (#E5E7EB), black text.
- **Input Fields:** Use a 1px border (#E5E7EB) that transitions to black on focus. Labels should always be visible (never placeholder-only) using the `body-md` role in slate gray.
- **Chips/Badges:** Use a light tinted background of the semantic color (e.g., 10% opacity Green) with 100% opacity text for status indicators. Shape should be fully rounded (pill).
- **Data Tables:** Remove all vertical borders. Use 1px horizontal dividers (#F3F4F6). The header row should use `label-caps` with a subtle gray text color.
- **Cards:** Cards should have no shadow by default, relying on the #F9FAFB fill and #E5E7EB border for definition. Only use shadows on hover to indicate clickability.
- **Progress Bars:** Use a thick 8px track in light gray with a solid primary color or semantic color fill.