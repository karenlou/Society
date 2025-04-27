import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)"],
        jetbrains_mono: ["var(--font-jetbrains-mono)"],
        geist: ["var(--font-geist-sans)"],
        geist_mono: ["var(--font-geist-mono)"],
      },
    },
  },
  plugins: [],
};

export default config; 