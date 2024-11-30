import { getFilesByUser } from '../../utils/common'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const pk = query.pk as string
    // get user agent
    // const userAgent = getHeader(event, 'user-agent')
    // console.log('userAgent', userAgent)
    if (!pk) {
      throw createError({
        statusCode: 400,
        message: 'Missing required parameter: pk',
      })
    }

    const page = query.page ? parseInt(query.page as string) : 1
    const limit = query.limit ? parseInt(query.limit as string) : 10
    const latestOnly = query.latestOnly ? query.latestOnly === 'true' : false

    const { data, totalRows } = await getFilesByUser(pk, { page, limit, latestOnly })

    return {
      data,
      totalRows,
    }
  }
  catch (error) {
    console.error('Error in /api/ebooks/web:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error while fetching ebooks',
    })
  }
})
