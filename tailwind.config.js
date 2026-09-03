/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3A64AF",
          50: "#EEF2F9",
          100: "#DCE4F2",
          200: "#B4C4E3",
          300: "#8CA4D3",
          400: "#5F82C0",
          500: "#3A64AF",
          600: "#2F5290",
          700: "#264270",
          800: "#1D3255",
          900: "#15243D",
        },
        secondary: {
          DEFAULT: "#F08321",
          50: "#FEF3E8",
          100: "#FDE3C7",
          200: "#FAC58C",
          300: "#F7A759",
          400: "#F3952E",
          500: "#F08321",
          600: "#CC6912",
          700: "#A2530E",
        },
        status: {
          red: "#D00000",
          green: "#18D000",
          orange: "#F29339",
          blue: "#54B2EC",
          teal: "#0F766E",
        },
        ink: {
          900: "#1C2333",
          700: "#3A4256",
          500: "#69708A",
          300: "#A2A8BD",
        },
        surface: {
          bar: "#2E3440",
          panel: "#F4F5F8",
          card: "#FFFFFF",
          border: "#E3E6EE",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,35,51,0.06), 0 1px 1px rgba(28,35,51,0.04)",
      },
      borderRadius: {
        md2: "10px",
      },
    },
  },
  plugins: [],
};
