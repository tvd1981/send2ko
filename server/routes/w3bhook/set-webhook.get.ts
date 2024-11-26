import { bot } from "../../utils/bot"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const webhookUrl = `${config.public.baseUrl}/w3bhook`

  try {
    // Set webhook với secret token
    await bot.api.setWebhook(webhookUrl, {
      secret_token: config.webhookSecret,
      drop_pending_updates: true,
      allowed_updates: ["message", "callback_query"] // Chỉ định các updates bạn muốn nhận
    })

    // Kiểm tra webhook info
    const webhookInfo = await bot.api.getWebhookInfo()

    return {
      ok: true,
      webhook: webhookUrl,
      info: webhookInfo
    }
  } catch (error: any) {
    console.error('Set webhook error:', error)
    throw createError({
      statusCode: 500,
      message: error?.message || 'Set webhook error'
    })
  }
})
