import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#0E1420", // floodlit stadium night sky — dark surfaces, replaces flat pitch-green
        dusk: "#2B3D6B", // dusk-sky indigo — secondary accent, gradients, links
        turf: "#3FA34D", // grass green — used sparingly now (pitch strip, live indicators), not as a wash
        chalk: "#F4F1E8", // off-white — card face, light surfaces
        leather: "#C1443B", // cricket-ball red — primary energetic accent, CTAs alongside gold
        willow: "#C9A574", // willow-wood tan — warm secondary accent for chips/borders
        bail: "#D9A93B", // bail gold — premium stat numbers, legend tier
        ink: "#1B1B18", // near-black text
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
