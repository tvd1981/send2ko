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
    // Tạo OPDS 2.0 feed
    const feed = {
      metadata: {
        title: 'My Ebook Collection',
        modified: new Date().toISOString(),
        identifier: `urn:uuid:${userId}`
      },
      publications: files.map(file => ({
        metadata: {
          identifier: `urn:uuid:${file.id}`,
          title: file.name,
          modified: file.createdAt.toISOString(),
          published: file.createdAt.toISOString
        },
        links: [
          {
            rel: 'http://opds-spec.org/acquisition',
            href: `/ebooks/download/${file.id}`,
            type: file.mimeType
          }
        ]
      }))
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