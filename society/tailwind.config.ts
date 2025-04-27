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
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        dropAccelerateThenExplode: {
          '0%':  { transform: 'translateY(2rem) scale(1)', opacity: '1' },
          '10%': { transform: 'translateY(3vh) scale(1)', opacity: '1' },
          '25%': { transform: 'translateY(45vh) scale(1)', opacity: '1' },
          '30%': { transform: 'translateY(45vh) scale(0.9)', opacity: '1' },
          '100%':{ transform: 'translateY(45vh) scale(100)', opacity: '0' },
        },
      },
      animation: {
        dropAccelerateThenExplode: 'dropAccelerateThenExplode 0.5s linear forwards',
        fadeIn: 'fadeIn 1s ease-in forwards',
        fadeInDelayed: 'fadeIn 1s ease-in 1s forwards',
      },
    },
  },
  plugins: [],
};

export default config; 