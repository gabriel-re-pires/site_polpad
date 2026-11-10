import { defineConfig } from 'astro/config';
import { SITE, BASE } from './site.config.mjs';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  i18n: {
    locales: ['pt-br', 'en'],
    defaultLocale: 'pt-br',
    routing: { prefixDefaultLocale: false },
  },
  // Scripts sempre em arquivo: a CSP da Vercel não libera script inline.
  vite: { build: { assetsInlineLimit: 0 } },
});
