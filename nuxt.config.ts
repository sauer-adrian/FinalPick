// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
  ],
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',          // if you use email/OAuth callbacks
      exclude: [
        '/login',
        '/legal/terms',
        '/legal/privacy',
        '/legal/impressum',
        // add more public routes here, e.g. homepage:
        // '/'
        // or whole folders with a wildcard:
        '/legal/*'
      ]
    }
  },
  css: ['~/assets/css/main.css']
})
