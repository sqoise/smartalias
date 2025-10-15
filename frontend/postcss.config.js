// Tailwind CSS v4+ requires using the dedicated PostCSS plugin package '@tailwindcss/postcss'.
// Reverted to official plugin naming after framework error advising migration.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
