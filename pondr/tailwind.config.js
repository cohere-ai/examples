/** @type {import('tailwindcss/tailwind-config').TailwindConfig} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-purple': '#3E1C96',
        purple: '#7A5AF8',
        white: '#F5F8FF',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
