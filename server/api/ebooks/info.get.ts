import { saveEbookInfo } from '../../utils/common'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { id } = query

    if (!id || typeof id !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'ID is required and must be a string'
      })
    }

    // Giả lập mime type và name cho test
    const db = useDrizzle()
    const [file] = await db.select().from(tables.tlgFiles).where(eq(tables.tlgFiles.id, id))

    if (!file || !file.mimeType || !file.name) {
      throw createError({
        statusCode: 400,
        message: 'File information not found'
      })
    }

    const ebookId = await saveEbookInfo(id, file.mimeType, file.name)

    return {
      success: true,
      data: {
        ebookId
      }
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal Server Error'
    })
  }
}) 