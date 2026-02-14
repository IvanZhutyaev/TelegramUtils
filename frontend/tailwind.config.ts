import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        growthkit: {
          primary: "#0088cc",
          dark: "#0d1117",
          card: "#161b22",
        },
      },
    },
  },
  plugins: [],
};
export default config;
