/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lua: {
          indigo:       '#3A3CF6',
          indigoDark:   '#2a2bd4',
          indigoLight:  '#6B6CF8',
          coral:        '#FF6B7A',
          coralDark:    '#e55464',
          emerald:      '#2ECC9A',
          emeraldDark:  '#25b085',
          lavender:     '#E7E6FF',
          slate700:     '#334155',
          slate400:     '#94A3B8',
          slate200:     '#E2E8F0',
          slate100:     '#F1F5F9',
          text:         '#1a1a2e',
        },
      },
    },
  },
  plugins: [],
};
