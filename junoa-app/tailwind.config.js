import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-green': '#0a0f0a',
        'dark-green-light': '#111611',
        'dark-green-lighter': '#0f1a0f',
      }
    }
  },
} satisfies Config;