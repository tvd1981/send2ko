// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // https://nuxt.com/modules
  modules: ['@nuxthub/core', '@nuxt/eslint', '@nuxt/ui'],

  // https://devtools.nuxt.com
  devtools: { enabled: true },
  // Env variables - https://nuxt.com/docs/getting-started/configuration#environment-variables-and-private-tokens
  runtimeConfig: {
    telegramBotToken: process.env.NUXT_TELEGRAM_BOT_TOKEN,
    webhookSecret: process.env.NUXT_WEBHOOK_SECRET,
    openaiApiKey: process.env.NUXT_OPENAI_API_KEY,
    adminId: process.env.NUXT_ADMIN_ID,
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL,
      showInfoBot: process.env.NUXT_PUBLIC_SHOW_INFO_BOT,
      supportLink: process.env.NUXT_PUBLIC_SUPPORT_LINK,
    },
  },
  devServer: {
    host: '0.0.0.0', // Cho phép truy cập từ tất cả các IP
    port: 3000, // Port mặc định, có thể thay đổi
  },
  // https://nuxt.com/docs/getting-started/upgrade#testing-nuxt-4
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-07-30',

  // https://hub.nuxt.com/docs/getting-started/installation#options
  hub: {
    kv: true,
    database: true,
  },
  // https://eslint.nuxt.com
  eslint: {
    config: {
      stylistic: {
        quotes: 'single',
      },
    },
  },
})
