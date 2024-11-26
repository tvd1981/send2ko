import { bot } from '../../utils/bot'
export default defineEventHandler(async event => {
  const { id } = event.context.params || {}
  const config = useRuntimeConfig()
  const ebookFile = await bot.api.getFile(id)
  const filePath = ebookFile.file_path
  const fileUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${filePath}`
  return sendRedirect(event, fileUrl)
})