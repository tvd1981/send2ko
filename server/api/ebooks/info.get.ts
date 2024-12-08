// import { saveEbookInfo } from '../../utils/common'
import { summaryYoutubeVideo } from '../../utils/common'
// import { fetchTranscript } from '../../utils/fetch-transcript'
// import { summaryContent } from '../../utils/openai'
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { url } = query

    if (!url || typeof url !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'URL is required and must be a string',
      })
    }

    const data = await summaryYoutubeVideo(url)
    // const summary = await summaryContent(data.fullTranscript, url)
    // return { summary }
    return { title: data?.title }
    // // Giả lập mime type và name cho test
    // const db = useDrizzle()
    // const [file] = await db.select().from(tables.tlgFiles).where(eq(tables.tlgFiles.id, id))

    // if (!file || !file.mimeType || !file.name) {
    //   throw createError({
    //     statusCode: 400,
    //     message: 'File information not found',
    //   })
    // }

    // const ebookId = await saveEbookInfo(id, file.mimeType, file.name)

    // return {
    //   success: true,
    //   data: {
    //     ebookId,
    //   },
    // }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal Server Error',
    })
  }
})
