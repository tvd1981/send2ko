import { bot } from '../../utils/bot'

export default defineEventHandler(async event => {
  try {
    const { id } = event.context.params || {}
    const config = useRuntimeConfig()
    const db = useDrizzle()
    const fileOnServer = await bot.api.getFile(id)
    const ebookFile = await db.query.tlgFiles.findFirst({
      where: eq(tables.tlgFiles.id, id)
    })
    const filePath = fileOnServer.file_path
    const fileUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${filePath}`
    
    // Redirect to Telegram file URL
    return sendRedirect(event, fileUrl, 302)

    // Temporarily commented out file fetching logic
    /*
    const response = await fetch(fileUrl)
    const buffer = await response.arrayBuffer()
    
    setHeader(event, 'Content-Type', ebookFile.mimeType)
    setHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`)
    
    return buffer
    */
  } catch (error) {
    console.error('Error downloading file:', error)
    throw createError({
      statusCode: 500,
      message: 'Error downloading file'
    })
  }
})
