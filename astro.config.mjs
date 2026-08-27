import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://adamtrepka.github.io',
  base: '/riffle-web',
  output: 'static',
  trailingSlash: 'always',
})
