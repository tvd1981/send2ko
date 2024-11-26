import { Bot, webhookCallback, InlineKeyboard, Context } from "grammy"
import { useRuntimeConfig } from '#imports'
import { User } from "grammy/types"
import { hashids } from "./common"

const config = useRuntimeConfig()
const db = useDrizzle()
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
  await upsertTelegramUser(ctx.message?.from)
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

const SUPPORTED_MIMES = [
  'application/pdf',
  'application/epub+zip',
  'application/x-mobipocket-ebook'
];

bot.on("message:document", async (ctx) => {
  const doc = ctx.message.document;
  
  // Kiểm tra mime type
  if (!SUPPORTED_MIMES.includes(doc.mime_type || '')) {
    await ctx.reply(
      "❌ Bot chỉ hỗ trợ các định dạng sau:\n" +
      "- PDF (.pdf)\n" +
      "- EPUB (.epub)\n" +
      "- MOBI (.mobi)"
    );
    return;
  }

  try {
    await db.insert(tables.files).values({
      id: doc.file_id,
      userId: ctx.from.id,
      name: doc.file_name || 'unknown',
      mimeType: doc.mime_type || 'application/octet-stream',
      size: doc.file_size || 0,
      createdAt: new Date()
    });

    await ctx.reply("✅ Đã lưu file thành công!");
  } catch (error) {
    console.error("Error saving file:", error);
    await ctx.reply("❌ Có lỗi xảy ra khi lưu file!");
  }
});

async function upsertTelegramUser(from: User | undefined) {
  try {
    if (!from) return
    const db = useDrizzle()
    
    // Kiểm tra user đã tồn tại chưa
    const existingUser = await db.query.tlgUsers.findFirst({
      where: eq(tables.tlgUsers.id, from.id)
    })

    // Chỉ insert nếu user chưa tồn tại
    if (!existingUser) {
      const fullName = [from.first_name, from.last_name]
        .filter(name => name !== undefined)
        .join(' ').trim()
      
      const id2 = hashids.encode(from.id)

      await db.insert(tables.tlgUsers).values({
        id: from.id,
        id2,
        fullName,
        username: from.username || null,
        languageCode: from.language_code || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
  } catch (error) {
    console.error('Error inserting telegram user:', error)
  }
} 