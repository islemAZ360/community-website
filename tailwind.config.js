/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#13eca4",
                "background-light": "#f6f8f7",
                "background-dark": "#080e0c",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                "serif": ["Playfair Display", "serif"]
            },
        },
    },
    plugins: [],
}
