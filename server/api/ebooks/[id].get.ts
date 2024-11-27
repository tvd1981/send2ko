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

    // Fetch file content
    const response = await fetch(fileUrl)
    const fileBuffer = await response.arrayBuffer()
    // let fileName = ebookFile?.name?.replace(/[^a-zA-Z0-9.-\s]/g, '')
    // fileName = fileName?.replace(/\.(epub|pdf|mobi|azw3)$/i, '')
    // Set appropriate headers
    setHeader(event, 'Content-Type', 'application/octet-stream')
    setHeader(event, 'Content-Disposition', `attachment; filename="${ebookFile?.name}"`)
    
    // Return file buffer directly
    return Buffer.from(fileBuffer)
  } catch (error) {
    console.error('Error downloading file:', error)
    throw createError({
      statusCode: 500,
      message: 'Error downloading file'
    })
  }
})
