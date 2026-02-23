/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', 'sans-serif'],
            },
            colors: {
                slate: {
                    850: '#1e293b', // Deep Slate for Sidebar
                    900: '#0f172a', // Darkest Slate
                },
                blue: {
                    600: '#2563eb', // Royal Blue Primary
                    700: '#1d4ed8',
                },
                gray: {
                    50: '#f8fafc', // Light Background
                }
            },
            boxShadow: {
                'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
