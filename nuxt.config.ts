import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'

const NitkoTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fdf8f5',
      100: '#f7ede4',
      200: '#edd9c9',
      300: '#e0c0a8',
      400: '#cfa082',
      500: '#b48a72',
      600: '#8c6250',
      700: '#6e4d3f',
      800: '#503830',
      900: '#352520',
      950: '#1e1511',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#fbf7f3',
          100: '#f7f3ef',
          200: '#e9ded6',
          300: '#d4c4b8',
          400: '#b8a098',
          500: '#9c807a',
          600: '#7d6560',
          700: '#5e4c47',
          800: '#3e3330',
          900: '#2d2825',
          950: '#1a1714',
        },
      },
    },
  },
})

export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@primevue/nuxt-module',
    '@nuxtjs/i18n',
    'nuxt-auth-utils',
  ],

  css: ['primeicons/primeicons.css', '~/assets/css/main.css'],

  vite: {},

  primevue: {
    options: {
      theme: {
        preset: NitkoTheme,
        options: {
          darkModeSelector: false,
        },
      },
    },
  },

  i18n: {
    defaultLocale: 'pl',
    locales: [{ code: 'pl', file: 'pl.json' }],
    langDir: '',
    strategy: 'no_prefix',
    bundle: {
      optimizeTranslationDirective: false,
    },
  },

  runtimeConfig: {
    sessionSecret: process.env.NUXT_SESSION_SECRET || '',
    adminPassword: process.env.ADMIN_PASSWORD || '',
    databaseUrl: process.env.DATABASE_URL || '',
    public: {},
  },

  nitro: {
    preset: 'vercel',
  },

  sourcemap: true,

  compatibilityDate: '2024-11-01',
})
