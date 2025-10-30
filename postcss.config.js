// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
  options: {
    from: undefined, // ✅ chặn cảnh báo "did not pass from"
  },
};
