import { Bot, webhookCallback, InlineKeyboard, Context } from "grammy"
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()
export const bot = new Bot(config.telegramBotToken)

async function handleUserResponse(userId: string) {
  try {
    const keyboard = new InlineKeyboard()
      .text("Xem thông tin", "view_info")
      .row()
      .url("Liên hệ hỗ trợ", "https://t.me/your_support")

    return {
      text: "Chào mừng! Vui lòng chọn chức năng:",
      keyboard
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      text: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
      keyboard: null
    }
  }
}

async function handleCommonResponse(ctx: Context) {
  const userId = ctx.message?.from.id;
  const response = await handleUserResponse(userId!.toString())
  await ctx.reply(response.text, response.keyboard ? {
    reply_markup: response.keyboard
  } : undefined)
}

// Command handlers
bot.command("start", async (ctx) => {
  await handleCommonResponse(ctx)
})

bot.on("message:text", async (ctx) => {
  await handleCommonResponse(ctx)
})

// Xử lý webhook
export const handleUpdate = webhookCallback(bot, "cloudflare")

// Handler cho nút view_info
bot.callbackQuery("view_info", async (ctx) => {
  const user = ctx.from
  const fullName = user.first_name + ' ' + user.last_name
  await ctx.reply(`Đây là thông tin của bạn..., ${user.id}, ${user.username}, ${fullName}`)
}) 