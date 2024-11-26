import { desc } from 'drizzle-orm'
import { Builder } from 'xml2js'
const xmlBuilder = new Builder()

export default defineEventHandler(async (event) => {
  try {
    // Lấy pk từ query params
    const query = getQuery(event)
    const pk = query.pk as string
    
    if (!pk) {
      throw createError({
        statusCode: 400,
        message: 'Missing pk parameter'
      })
    }

    // Decode pk để lấy userId
    const userId = hashids.decode(pk)[0] as number
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'Invalid pk'
      })
    }

    const db = useDrizzle()
    
    // Query files theo userId, sắp xếp theo createdAt giảm dần
    const files = await db.query.tlgFiles.findMany({
      where: eq(tables.tlgFiles.userId, userId),
      orderBy: desc(tables.tlgFiles.createdAt)
    })
    // Tạo OPDS 1.x feed
    const feed = {
      'feed': {
        '$': {
          'xmlns': 'http://www.w3.org/2005/Atom',
          'xmlns:dc': 'http://purl.org/dc/terms/',
          'xmlns:opds': 'http://opds-spec.org/2010/catalog'
        },
        'id': `urn:uuid:${userId}`,
        'title': 'My Ebook Collection',
        'updated': new Date().toISOString(),
        'entry': files.map(file => ({
          'id': `urn:uuid:${file.id}`,
          'title': (file.name ?? '').replace(/[^a-zA-Z0-9.-\s]/g, ''),
          'updated': file.createdAt.toISOString(),
          'published': file.createdAt.toISOString(),
          'link': [{
            '$': {
              'rel': 'http://opds-spec.org/acquisition',
              'href': `/api/ebooks/download/${file.id}`,
              'type': file.mimeType
            }
          }]
        }))
      }
    }

    // Set header là application/atom+xml
    setHeader(event, 'Content-Type', 'application/atom+xml; charset=utf-8')
    
    // Trả về XML
    return xmlBuilder.buildObject(feed)
    
    // Comment phần JSON debug
    // setHeader(event, 'Content-Type', 'application/json') 
    // return { feed, files }

  } catch (error) {
    console.error('Error fetching ebooks:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
}) 