/** @type {import('tailwindcss').Config} */
export default {
   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
   theme: {
      extend: {
         colors: {
            gold: "#D4AF37",
            midnight: "#050814",
         },
         fontFamily: {
            serif: ['"Playfair Display"', "serif"],
            sans: ["Poppins", "sans-serif"],
         },
         boxShadow: {
            glow: "0 0 20px rgba(212, 175, 55, 0.3)",
         },
      },
   },
   plugins: [],
};
