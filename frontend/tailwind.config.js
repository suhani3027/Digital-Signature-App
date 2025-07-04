module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6', // Sky Blue
        accent: '#f43f5e', // Rose
        background: '#f1f5f9', // Light Blue-Gray
        surface: '#ffffff', // White
        'text-main': '#18181b', // Dark Gray
        'text-secondary': '#334155', // Slate
      },
    },
  },
  plugins: [],
};
