/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#00BA7C",
          primaryDark: "#007950",
        },
        grayCustom: {
          light: "#EDF2F7",
          medium: "#7588A3",
        },
        dark: {
          100: "#121926",
          200: "#0E1420",
          300: "#080C16",
          400: "#070A13",
        },
      },
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
        9999: "9999",
      },
    },
  },
  plugins: [],
};
