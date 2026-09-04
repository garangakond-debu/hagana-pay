// theme.ts
import { vars } from "nativewind";

// ============================================================================
// FONT CONFIGURATION
// ============================================================================
// Each theme can define its own font families. Fonts are loaded in _layout.tsx
// using expo-font and referenced via CSS variables in tailwind.config.js.
//
// Font families:
// - heading: Used for h1-h4 headings
// - body: Used for body text, labels, captions
// - mono: Used for code snippets
// ============================================================================

export interface ThemeFonts {
  heading: {
    family: string;
    weights: Record<string, string>; // weight name -> font file key
  };
  body: {
    family: string;
    weights: Record<string, string>;
  };
  mono: {
    family: string;
    weights: Record<string, string>;
  };
}

// Default theme fonts: Inter for clean, modern typography
export const themeFonts: ThemeFonts = {
  heading: {
    family: 'Inter',
    weights: {
      normal: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
    },
  },
  body: {
    family: 'Inter',
    weights: {
      normal: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
    },
  },
  mono: {
    family: 'JetBrainsMono',
    weights: {
      normal: 'JetBrainsMono_400Regular',
      medium: 'JetBrainsMono_500Medium',
    },
  },
};


// 🔴 AI: These are PLACEHOLDER values — you MUST replace ALL colors below
// with a custom palette that matches the app's personality.
// Do NOT keep these defaults. Generate your own unique colors.
export const lightTheme = vars({
  "--radius": "14",

  // Core semantic colors — Hagana Pay: deep green + warm off-white canvas
  "--background": "247 249 247",
  "--foreground": "20 33 25",

  "--card": "255 255 255",
  "--card-foreground": "20 33 25",

  "--popover": "255 255 255",
  "--popover-foreground": "20 33 25",

  "--primary": "13 92 46",
  "--primary-foreground": "255 255 255",

  "--secondary": "232 243 235",
  "--secondary-foreground": "13 92 46",

  "--muted": "240 244 241",
  "--muted-foreground": "100 116 106",

  "--accent": "212 175 55",
  "--accent-foreground": "255 255 255",

  "--destructive": "190 42 42",

  "--border": "226 232 227",
  "--input": "226 232 227",
  "--ring": "13 92 46",

  // Chart colors
  "--chart-1": "13 92 46",
  "--chart-2": "212 175 55",
  "--chart-3": "42 79 116",
  "--chart-4": "34 197 94",
  "--chart-5": "212 175 55",

  // Sidebar colors
  "--sidebar": "250 251 250",
  "--sidebar-foreground": "20 33 25",
  "--sidebar-primary": "13 92 46",
  "--sidebar-primary-foreground": "255 255 255",
  "--sidebar-accent": "232 243 235",
  "--sidebar-accent-foreground": "13 92 46",
  "--sidebar-border": "226 232 227",
  "--sidebar-ring": "13 92 46",
});

// 🔴 AI: Replace ALL dark theme colors too — tint backgrounds with your brand color.
export const darkTheme = vars({
  "--radius": "14",

  // Core semantic colors — deep green-tinted navy night background
  "--background": "11 24 16",
  "--foreground": "236 242 238",

  "--card": "17 34 23",
  "--card-foreground": "236 242 238",

  "--popover": "22 42 29",
  "--popover-foreground": "236 242 238",

  "--primary": "46 205 113",
  "--primary-foreground": "11 24 16",

  "--secondary": "28 50 36",
  "--secondary-foreground": "236 242 238",

  "--muted": "24 42 30",
  "--muted-foreground": "148 168 154",

  "--accent": "233 199 101",
  "--accent-foreground": "28 35 16",

  "--destructive": "248 113 113",

  "--border": "28 47 35",
  "--input": "28 47 35",
  "--ring": "46 205 113",

  // Chart colors
  "--chart-1": "46 205 113",
  "--chart-2": "212 175 55",
  "--chart-3": "66 138 214",
  "--chart-4": "34 197 94",
  "--chart-5": "251 191 36",

  // Sidebar colors
  "--sidebar": "17 34 23",
  "--sidebar-foreground": "236 242 238",
  "--sidebar-primary": "46 205 113",
  "--sidebar-primary-foreground": "11 24 16",
  "--sidebar-accent": "28 50 36",
  "--sidebar-accent-foreground": "236 242 238",
  "--sidebar-border": "28 47 35",
  "--sidebar-ring": "46 205 113",
});