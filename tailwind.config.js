// tailwind.config.js (your file)
module.exports = {
  // content: [...] // <- optional in v4, can remove
  theme: {
    extend: {
      colors: {
        body: "#0b0b47",
        light: "#fcfcfd",
        primary: "#1b47f7",
        slate: { 150: "#e9edf2" },
      },
    },
  },
  corePlugins: { preflight: false }, // <- add this if preflight breaks your styles
  plugins: [],
};
