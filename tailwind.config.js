export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ["JetBrains Mono", "sans-serif"],
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        "2xl": "4rem",
      },
      screens: {
        sm: "100%",
        md: "100%",
        lg: "1280px",
        xl: "1440px",
        "2xl": "1600px", // 👈 cho rộng hơn
      },
    },

    plugins: [],
  },
};
