import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vultrix: {
          black: '#0a0a0a',
          dark: '#111111',
          gray: '#1a1a1a',
          accent: '#3b82f6',
          light: '#e5e7eb',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
