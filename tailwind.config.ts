import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary - Dark Navy
        primary: "#14213d",
        "on-primary": "#ffffff",
        "primary-container": "#d4d8e0",
        "on-primary-container": "#000000",
        "primary-fixed": "#d4d8e0",
        "primary-fixed-dim": "#b0b6c2",
        "on-primary-fixed": "#000000",
        "on-primary-fixed-variant": "#2e3a54",
        "surface-tint": "#14213d",

        // Secondary - Black (used for text, icons, and UI elements)
        secondary: "#000000",
        "on-secondary": "#ffffff",
        "secondary-container": "#e5e5e5",
        "on-secondary-container": "#000000",
        "secondary-fixed": "#e5e5e5",
        "secondary-fixed-dim": "#d4d4d4",
        "on-secondary-fixed": "#000000",
        "on-secondary-fixed-variant": "#333333",

        // Tertiary - Dark gray (for subtle accents)
        tertiary: "#4a4a4a",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#e0e0e0",
        "on-tertiary-container": "#000000",
        "tertiary-fixed": "#e0e0e0",
        "tertiary-fixed-dim": "#cccccc",
        "on-tertiary-fixed": "#000000",
        "on-tertiary-fixed-variant": "#333333",

        // Error
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        // Background & Surface
        background: "#ffffff",
        "on-background": "#000000",
        surface: "#ffffff",
        "on-surface": "#000000",
        "surface-bright": "#ffffff",
        "surface-dim": "#e5e5e5",
        "surface-container": "#f0f0f0",
        "surface-container-low": "#f5f5f5",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#e5e5e5",
        "surface-container-highest": "#e0e0e0",
        "surface-variant": "#e2e2e2",
        "on-surface-variant": "#4c4546",

        // Outline
        outline: "#7e7576",
        "outline-variant": "#cfc4c5",

        // Inverse
        "inverse-surface": "#303030",
        "inverse-on-surface": "#f1f1f1",
        "inverse-primary": "#b0b8c8",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        md: "16px",
        xs: "4px",
        "margin-desktop": "32px",
        base: "4px",
        gutter: "20px",
        sm: "8px",
        lg: "24px",
        xl: "40px",
        "margin-mobile": "16px",
      },
      fontFamily: {
        "numeric-data": ["var(--font-inter)"],
        "body-lg": ["var(--font-inter)"],
        display: ["var(--font-inter)"],
        "headline-md": ["var(--font-inter)"],
        "body-md": ["var(--font-inter)"],
        "label-caps": ["var(--font-inter)"],
        "headline-lg-mobile": ["var(--font-inter)"],
        "headline-lg": ["var(--font-inter)"],
      },
      fontSize: {
        "numeric-data": [
          "14px",
          { lineHeight: "20px", letterSpacing: "0.02em", fontWeight: "500" },
        ],
        "body-lg": [
          "16px",
          { lineHeight: "24px", letterSpacing: "0", fontWeight: "400" },
        ],
        display: [
          "48px",
          { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "headline-md": [
          "20px",
          { lineHeight: "28px", letterSpacing: "-0.005em", fontWeight: "500" },
        ],
        "body-md": [
          "14px",
          { lineHeight: "20px", letterSpacing: "0", fontWeight: "400" },
        ],
        "label-caps": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" },
        ],
        "headline-lg-mobile": [
          "24px",
          { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "headline-lg": [
          "30px",
          { lineHeight: "36px", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
      },
    },
  },
  plugins: [],
};
export default config;
