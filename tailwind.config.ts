import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007acc',
        secondary: '#6c757d',
        danger: '#dc3545',
        success: '#28a745',
        warning: '#ffc107',
      },
    },
  },
  plugins: [],
}
export default config
